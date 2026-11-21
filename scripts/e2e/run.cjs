#!/usr/bin/env node
/**
 * End-to-end test of the production build (website + admin CMS + API) with Playwright/Chromium.
 *
 * Prerequisites (from a clean checkout):
 *     npm install                       installs the `playwright` package (a devDependency)
 *     npx playwright install chromium   once per machine; this script never installs browsers
 *     npm run build
 * Run with `npm run test:e2e` (options after `--`) or `node scripts/e2e/run.cjs`.
 *
 * Demo mode (in-memory store, no DATABASE_URL):
 *     node scripts/e2e/run.cjs
 *
 * Database mode (MySQL / MariaDB) against a NEW, EMPTY test database (create it yourself, e.g.
 * `CREATE DATABASE mmm_e2e`). --db-push creates the tables with a plain `prisma db push` first;
 * the script never drops or resets data:
 *     DATABASE_URL=mysql://user:pw@127.0.0.1:3306/mmm_e2e JWT_SECRET=<48 random chars> \
 *       npm run test:e2e -- --db-push
 *
 * Options:
 *     --port=3300          port for the `next start` server this script spawns (default 3300)
 *     --base-url=URL       test an already running server instead of spawning one
 *     --db-push            run `prisma db push` before starting (database mode only)
 *     --headed             show the browser
 *
 * The spawned server gets DEMO_MODE=1 in demo mode (the sample admin is closed in production
 * otherwise) and, in database mode, an ADMIN_BOOTSTRAP_PASSWORD (yours, or a random one). The
 * Super Admin must still have that bootstrap password, so every database-mode run needs a new
 * empty database. With --base-url, start the server with the same variables yourself.
 * In database mode the spawned server reaches the database through a small TCP relay inside this
 * script, so the outage scenario can cut and restore the connection (skipped with --base-url).
 * The login rate-limit scenario runs last because it exhausts the per-IP login budget of the
 * server process for 15 minutes. Exit code 0 = all scenarios passed.
 */
'use strict';

const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium, request: pwRequest } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const PORT = Number(args.port || 3300);
const BASE = String(args['base-url'] || `http://localhost:${PORT}`).replace(/\/$/, '');
const DB_MODE = Boolean(process.env.DATABASE_URL);
const RUN_ID = crypto.randomBytes(3).toString('hex');
const strongPassword = (prefix) => `${prefix}${crypto.randomBytes(5).toString('hex')}9Q`;
const BOOTSTRAP_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || strongPassword('B00tstrap-');
const ADMIN = { username: 'admin', password: DB_MODE ? BOOTSTRAP_PASSWORD : 'admin123' };

// ------------------------------------------------------------------------------------------
// Tiny test harness
// ------------------------------------------------------------------------------------------

const results = [];
class AssertionError extends Error {}
function assert(cond, message) {
  if (!cond) throw new AssertionError(message);
}
async function scenario(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - started, error: err && err.message ? err.message : String(err) });
    console.log(`FAIL  ${name}\n      ${err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n      ') : err}`);
  }
}

// ------------------------------------------------------------------------------------------
// Server lifecycle
// ------------------------------------------------------------------------------------------

function pushSchema() {
  if (!DB_MODE) throw new Error('--db-push needs DATABASE_URL.');
  console.log('Creating the schema (prisma db push)...');
  const res = spawnSync('npx', ['prisma', 'db', 'push'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) throw new Error('prisma db push failed.');
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/state/meta`);
      if (res.ok) return res.json();
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready.`);
}

/**
 * TCP relay between the spawned server and the database. `cut()` drops every connection and stops
 * listening (the database looks down); `restore()` listens again.
 */
async function startDbRelay() {
  const target = new URL(process.env.DATABASE_URL);
  const sockets = new Set();
  const relayPort = PORT + 1000;
  let server = null;
  const listen = () =>
    new Promise((resolve, reject) => {
      server = net.createServer((client) => {
        const upstream = net.connect(Number(target.port || 3306), target.hostname);
        for (const sock of [client, upstream]) {
          sockets.add(sock);
          sock.on('error', () => {});
          sock.on('close', () => sockets.delete(sock));
        }
        client.pipe(upstream);
        upstream.pipe(client);
        client.on('close', () => upstream.destroy());
        upstream.on('close', () => client.destroy());
      });
      server.once('error', reject);
      server.listen(relayPort, '127.0.0.1', resolve);
    });
  await listen();
  const relayed = new URL(target);
  relayed.hostname = '127.0.0.1';
  relayed.port = String(relayPort);
  return {
    url: relayed.toString(),
    cut() {
      for (const sock of sockets) sock.destroy();
      return new Promise((resolve) => server.close(resolve));
    },
    restore: listen,
    async stop() {
      for (const sock of sockets) sock.destroy();
      if (server.listening) await new Promise((resolve) => server.close(resolve));
    },
  };
}

function startServer(databaseUrl) {
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ...(DB_MODE
        ? { ADMIN_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASSWORD, DATABASE_URL: databaseUrl }
        : { DEMO_MODE: '1' }),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  const log = [];
  const keep = (chunk) => {
    log.push(String(chunk));
    if (log.length > 400) log.shift();
  };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);
  return {
    log,
    stop() {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        // already gone
      }
    },
  };
}

// ------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------

/** Collect same-origin console errors, page errors, failed same-origin requests and CSP violations. */
function watchPage(page, sink) {
  page.on('pageerror', (e) => sink.push(`pageerror ${page.url()}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Content Security Policy/i.test(m.text())) {
      sink.push(`CSP ${page.url()}: ${m.text().slice(0, 300)}`);
      return;
    }
    const loc = m.location() && m.location().url;
    if (loc && !loc.startsWith(BASE)) return; // third-party embeds/fonts (may be offline here)
    sink.push(`console ${page.url()}: ${m.text().slice(0, 200)}`);
  });
  page.on('response', (r) => {
    if (r.url().startsWith(BASE) && r.status() >= 500) sink.push(`HTTP ${r.status()} ${r.url()}`);
  });
}

let clientCounter = 0;
/** A browser context that looks like its own visitor: separate storage and client address. */
async function newVisitorContext(browser, { mobile = false } = {}) {
  clientCounter += 1;
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
    reducedMotion: 'reduce',
  });
  // The server reads the address its proxy appended (TRUSTED_PROXY_HOPS=1): one per context,
  // added to requests for the site only (third-party hosts would refuse the extra header).
  const address = `10.77.${Math.floor(clientCounter / 250)}.${(clientCounter % 250) + 1}`;
  await ctx.route(`${BASE}/api/**`, (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } })
  );
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('maharat_promo_seen', '1');
    } catch {
      // storage blocked
    }
  });
  return ctx;
}

const randomPhone = () => `017${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;

async function fillHomeRegistration(page, { student, guardian, phone }) {
  await page.locator('#home-reg-student').scrollIntoViewIfNeeded();
  await page.fill('#home-reg-student', student);
  await page.fill('#home-reg-guardian', guardian);
  await page.fill('#home-reg-mobile', phone);
  const classSelect = page.locator('#home-reg-class');
  await classSelect.selectOption(await classSelect.locator('option').nth(1).getAttribute('value'));
}

async function uiLogin(page, username, password) {
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await page.fill('#login-userid', username);
  await page.fill('#login-password', password);
  await page.getByTestId('login-submit-button').click();
  await page.getByTestId('admin-dashboard-version').waitFor({ timeout: 20_000 });
}

/** Text of the first visible error message (role="alert") inside `scope`, or ''. */
async function alertText(scope) {
  const alert = scope.locator('[role="alert"]:visible');
  return (await alert.count()) ? (await alert.first().innerText()).trim() : '';
}

const SUBMIT_GLOB = '**/api/public/submit';
const rejectWith429 = (route) =>
  route.fulfill({
    status: 429,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, error: 'Too many requests. Please try again shortly.', code: 'RATE_LIMITED' }),
  });

async function dismissOverlays(page) {
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
}

const waitForApi = (page, pathname, method = 'POST') =>
  page.waitForResponse((r) => r.url() === `${BASE}${pathname}` && r.request().method() === method, { timeout: 20_000 });

/** API client with its own cookie jar (no Origin header, like a non-browser client). */
async function apiClient() {
  return pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Accept: 'application/json' } });
}

async function apiLogin(api, username, password, expectedRole) {
  const res = await api.post('/api/auth/login', { data: { username, password, expectedRole } });
  return { status: res.status(), body: await res.json() };
}

async function staffState(api) {
  const res = await api.get('/api/state');
  assert(res.ok(), `GET /api/state failed with ${res.status()}`);
  return res.json();
}

async function openAdminTab(page, labelRegex) {
  await page.getByRole('button', { name: labelRegex }).first().click();
  await page.waitForTimeout(400);
}

// ------------------------------------------------------------------------------------------
// Scenarios
// ------------------------------------------------------------------------------------------

async function main() {
  let server = null;
  let dbRelay = null;
  if (!args['base-url']) {
    if (args['db-push']) pushSchema();
    if (DB_MODE) dbRelay = await startDbRelay();
    server = startServer(dbRelay ? dbRelay.url : undefined);
  }
  const meta = await waitForServer(BASE, 60_000);
  console.log(`Server ${BASE} ready: mode=${meta.mode} version=${meta.version} (expected ${DB_MODE ? 'database' : 'demo'})`);

  const browser = await chromium.launch({ headless: !args.headed });
  const adminNewPassword = DB_MODE ? strongPassword('Adm1n-') : ADMIN.password;
  const lead = {
    student: `E2E Student ${RUN_ID}`,
    guardian: `E2E Guardian ${RUN_ID}`,
    phone: randomPhone(),
  };
  const noticeTitle = `E2E Notice ${RUN_ID}`;
  const teacher = { username: `e2eteacher${RUN_ID}`, password: strongPassword('Teach3r-'), newPassword: strongPassword('Teach3r-n') };

  const visitorCtx = await newVisitorContext(browser);
  const visitor = await visitorCtx.newPage();
  const visitorErrors = [];
  watchPage(visitor, visitorErrors);

  const adminCtx = await newVisitorContext(browser);
  const admin = await adminCtx.newPage();
  const adminErrors = [];
  watchPage(admin, adminErrors);

  try {
    await scenario('mode reported by /api/state/meta matches DATABASE_URL', async () => {
      assert(meta.mode === (DB_MODE ? 'database' : 'demo'), `mode is ${meta.mode}`);
    });

    await scenario('public pages /, /blog, /fees load without console or page errors', async () => {
      for (const p of ['/', '/blog', '/fees']) {
        const res = await visitor.goto(BASE + p, { waitUntil: 'networkidle' });
        assert(res && res.ok(), `${p} returned ${res && res.status()}`);
        await visitor.waitForTimeout(1200);
        const text = await visitor.locator('body').innerText();
        assert(text.trim().length > 200, `${p} rendered almost no text`);
      }
      assert(visitorErrors.length === 0, `errors:\n${visitorErrors.join('\n')}`);
    });

    await scenario('GET /api/state as visitor exposes no personal data or secrets', async () => {
      const api = await apiClient();
      const res = await api.get('/api/state');
      const body = await res.json();
      await api.dispose();
      assert(body.audience === 'public', `audience ${body.audience}`);
      const s = body.state;
      for (const k of ['leads', 'emails', 'complaints', 'leaveRequests', 'careerApplications', 'careerCandidates', 'admissionTokens2027', 'virtualOfficeSessions', 'rbacMatrix', 'blogAutomationConfig']) {
        assert(!(k in s), `private key ${k} present`);
      }
      for (const u of s.users || []) {
        for (const f of ['password', 'passwordHash', 'username', 'email', 'phone', 'mustChangePassword']) {
          assert(!(f in u), `users[${u.id}].${f} present`);
        }
        assert(u.signatorySlot, `non-signatory user ${u.id} exposed`);
      }
      const raw = JSON.stringify(s);
      assert(!/"password(Hash)?"\s*:/.test(raw), 'a password field is present');
      assert(!/"apiKey"\s*:\s*"[^"]+"/.test(raw), 'a non-empty apiKey is present');
      for (const f of ['roomUrl', 'zoomMeetingId', 'zoomPasscode']) {
        const re = new RegExp(`"${f}"\\s*:\\s*"([^"]+)"`, 'g');
        assert(!re.test(raw), `virtual office ${f} exposed`);
      }
    });

    await scenario('visitor submits the home admission inquiry form through the UI', async () => {
      await visitor.goto(BASE + '/', { waitUntil: 'networkidle' });
      await dismissOverlays(visitor);
      await fillHomeRegistration(visitor, lead);
      const submitted = waitForApi(visitor, '/api/public/submit');
      await visitor.locator('#quick-registration button[type="submit"]').click();
      const res = await submitted;
      assert(res.status() === 200, `/api/public/submit returned ${res.status()}`);
      await visitor.getByTestId('home-reg-success').waitFor({ timeout: 10_000 });
    });

    await scenario(`admin signs in through /admin${DB_MODE ? ' (forced password change first)' : ''}`, async () => {
      await admin.goto(BASE + '/admin', { waitUntil: 'networkidle' });
      await admin.fill('#login-userid', ADMIN.username);
      await admin.fill('#login-password', ADMIN.password);
      const login = waitForApi(admin, '/api/auth/login');
      await admin.getByTestId('login-submit-button').click();
      const res = await login;
      assert(res.status() === 200, `login returned ${res.status()}`);
      if (DB_MODE) {
        await admin.getByTestId('change-password-dialog').waitFor({ timeout: 15_000 });
        await admin.fill('#change-password-current', ADMIN.password);
        await admin.fill('#change-password-new', adminNewPassword);
        await admin.fill('#change-password-confirm', adminNewPassword);
        const changed = waitForApi(admin, '/api/auth/change-password');
        await admin.getByTestId('change-password-submit').click();
        const cr = await changed;
        assert(cr.status() === 200, `change-password returned ${cr.status()}`);
        await admin.getByTestId('change-password-dialog').waitFor({ state: 'detached', timeout: 15_000 });
      }
      await admin.getByTestId('admin-dashboard-version').waitFor({ timeout: 15_000 });
      if (!DB_MODE) await admin.getByTestId('admin-demo-mode-badge').waitFor({ timeout: 5_000 });
    });

    await scenario('the visitor lead is visible to the admin (API and Leads tab)', async () => {
      const res = await admin.request.get(BASE + '/api/state');
      const body = await res.json();
      assert(body.audience === 'staff', `audience ${body.audience}`);
      const found = (body.state.leads || []).find((l) => l.phone === lead.phone);
      assert(found, 'lead not found in staff state');
      assert(found.status === 'New', `lead status ${found.status}`);
      assert(found.name.includes(lead.student), 'lead name mismatch');
      await openAdminTab(admin, /লিড টু অ্যাডমিশন|Lead to Admission/);
      await admin.getByText(lead.student).first().waitFor({ timeout: 10_000 });
    });

    await scenario('reload of /admin keeps the session', async () => {
      await admin.reload({ waitUntil: 'networkidle' });
      await admin.getByTestId('admin-dashboard-version').waitFor({ timeout: 15_000 });
      const me = await admin.request.get(BASE + '/api/auth/me');
      assert(me.status() === 200, `/api/auth/me returned ${me.status()}`);
    });

    await scenario('admin edits a notice; an open anonymous browser picks it up by polling, and after reload', async () => {
      const otherCtx = await newVisitorContext(browser);
      const other = await otherCtx.newPage();
      const otherErrors = [];
      watchPage(other, otherErrors);
      await other.goto(BASE + '/notices', { waitUntil: 'networkidle' });
      await dismissOverlays(other);
      assert(!(await other.locator('body').innerText()).includes(noticeTitle), 'notice title present before the edit');

      await openAdminTab(admin, /নোটিশ বোর্ড ম্যানেজার|Notice Board Manager/);
      await admin.locator('button[aria-label^="Edit "]').first().click();
      await admin.locator('form input[type="text"]').first().fill(noticeTitle);
      const synced = waitForApi(admin, '/api/admin/sync');
      await admin.locator('form button[type="submit"]').first().click();
      const res = await synced;
      const body = await res.json();
      assert(res.status() === 200 && body.ok && !body.rejected, `sync returned ${res.status()} ${JSON.stringify(body).slice(0, 300)}`);

      // Visitors poll /api/state/meta every 30 s while the tab is visible.
      await other.getByText(noticeTitle).first().waitFor({ timeout: 45_000 });
      await other.reload({ waitUntil: 'networkidle' });
      await dismissOverlays(other);
      await other.getByText(noticeTitle).first().waitFor({ timeout: 15_000 });
      await otherCtx.close();
      assert(otherErrors.length === 0, `errors:\n${otherErrors.join('\n')}`);
    });

    await scenario('Super Admin creates a teacher account through the users UI', async () => {
      await openAdminTab(admin, /ইউজার রোল ও RBAC|User Roles & RBAC/);
      await admin.fill('input[placeholder="e.g. Ustadh Mahmudul Hasan"]', `E2E Teacher ${RUN_ID}`);
      await admin.fill('input[placeholder="mahmud"]', teacher.username);
      await admin.fill('input[placeholder="Noor-2027-Uttara"]', teacher.password);
      const form = admin.locator('form', { has: admin.locator('input[placeholder="mahmud"]') });
      await form.locator('select').selectOption('Coordinators / Teachers');
      const synced = waitForApi(admin, '/api/admin/sync');
      await form.locator('button[type="submit"]').click();
      const res = await synced;
      const body = await res.json();
      assert(res.status() === 200 && body.ok && !body.rejected, `sync returned ${res.status()} ${JSON.stringify(body).slice(0, 300)}`);
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const u = (state.state.users || []).find((x) => x.username === teacher.username);
      assert(u && u.role === 'Coordinators / Teachers', 'teacher not stored');
      assert(!('password' in u) && !('passwordHash' in u), 'password returned to the browser');
    });

    await scenario('teacher cannot write virtual-office (sync op rejected)', async () => {
      const api = await apiClient();
      const login = await apiLogin(api, teacher.username, teacher.password, 'Coordinators / Teachers');
      assert(login.status === 200, `teacher login ${login.status} ${JSON.stringify(login.body)}`);
      assert(login.body.mustChangePassword === true, 'admin-set password does not force a change');
      const blocked = await api.post('/api/admin/sync', { data: { baseVersion: 0, ops: [] } });
      assert(blocked.status() === 403, `sync before password change returned ${blocked.status()}`);
      const changed = await api.post('/api/auth/change-password', {
        data: { currentPassword: teacher.password, newPassword: teacher.newPassword },
      });
      assert(changed.status() === 200, `teacher change-password ${changed.status()}`);

      const state = await staffState(api);
      assert(state.audience === 'staff', 'teacher has no staff state');
      const vo = state.state.virtualOfficeConfig || {};
      const res = await api.post('/api/admin/sync', {
        data: {
          baseVersion: state.version,
          ops: [
            { op: 'set', key: 'virtualOfficeConfig', value: { ...vo, enabled: !vo.enabled } },
            { op: 'upsert', key: 'virtualOfficeSessions', item: { id: `vos-e2e-${RUN_ID}`, visitorName: 'x' } },
          ],
        },
      });
      const body = await res.json();
      assert(res.status() === 400 || res.status() === 403, `virtual-office write returned ${res.status()}`);
      if (res.status() === 400) assert(body.rejected && body.rejected.length === 2, `rejected: ${JSON.stringify(body.rejected)}`);
      const after = await staffState(api);
      assert(after.version === state.version, 'version changed after a rejected write');
      const detail = await api.get('/api/admin/virtual-office');
      assert(detail.status() === 200, `teacher (view permission) GET /api/admin/virtual-office ${detail.status()}`);
      await api.post('/api/auth/logout');
      await api.dispose();
    });

    // ------------------------------------------------------------------------------------
    // Public forms: success only after the server accepted; errors keep the visitor's input
    // ------------------------------------------------------------------------------------

    await scenario('admin switches the Virtual Office desk to live (so check-ins unlock the room at any hour)', async () => {
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const res = await admin.request.post(BASE + '/api/admin/sync', {
        data: {
          baseVersion: state.version,
          ops: [{ op: 'set', key: 'virtualOfficeConfig', value: { ...state.state.virtualOfficeConfig, enabled: true, manualStatus: 'ONLINE_LIVE' } }],
        },
      });
      const body = await res.json();
      assert(res.status() === 200 && body.ok && !body.rejected, `sync returned ${res.status()} ${JSON.stringify(body).slice(0, 300)}`);
    });

    for (const mobile of [false, true]) {
      const device = mobile ? 'mobile' : 'desktop';

      await scenario(`Virtual Office check-in through the UI shows the join panel (${device})`, async () => {
        const ctx = await newVisitorContext(browser, { mobile });
        const page = await ctx.newPage();
        const errors = [];
        watchPage(page, errors);
        await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        await dismissOverlays(page);
        await page.getByTestId('virtual-office-launcher').click();
        const form = page.locator('form', { has: page.locator('input[placeholder="017XX-XXXXXX"]') });
        const name = `E2E VO ${device} ${RUN_ID}`;
        const phone = randomPhone();
        await form.locator('input[type="text"]').first().fill(name);
        await form.locator('input[type="tel"]').fill(phone);
        await form.locator('input[type="email"]').fill('vo-e2e@example.com');

        // A refused check-in reports the reason in the form and keeps what was typed.
        await page.route('**/api/public/virtual-office/checkin', rejectWith429);
        await form.locator('button[type="submit"]').click();
        await form.locator('[role="alert"]').waitFor({ timeout: 10_000 });
        assert(!/RATE_LIMITED|Too many/.test(await alertText(form)), `raw server text shown: ${await alertText(form)}`);
        assert((await form.locator('input[type="tel"]').inputValue()) === phone, 'phone was cleared after a refusal');
        await page.unroute('**/api/public/virtual-office/checkin');

        const checkedIn = waitForApi(page, '/api/public/virtual-office/checkin');
        await form.locator('button[type="submit"]').click();
        const res = await checkedIn;
        const body = await res.json();
        assert(res.status() === 200 && body.ok, `check-in returned ${res.status()} ${JSON.stringify(body).slice(0, 200)}`);
        assert(body.unlocked && body.join && body.join.dutyOfficerPhone, `join details missing: ${JSON.stringify(body.join)}`);
        // The join panel: the duty officer's call link and, when a room is configured, the room link.
        await page.locator('a[href^="tel:"]').first().waitFor({ timeout: 10_000 });
        const text = await page.locator('body').innerText();
        assert(!/পেইজটি লোড করতে সাময়িক সমস্যা/.test(text), 'the error boundary replaced the site');
        assert((await page.locator('header').count()) > 0, 'site header is gone after the check-in');
        const state = await (await admin.request.get(BASE + '/api/state')).json();
        assert((state.state.virtualOfficeSessions || []).some((v) => v.fullName === name), 'session not stored');
        assert((state.state.leads || []).some((l) => l.name === name && l.phone === phone), 'lead not stored');
        await ctx.close();
        const unexpected = errors.filter((e) => !/status of 429/.test(e)); // the refusal injected above
        assert(unexpected.length === 0, `errors:\n${unexpected.join('\n')}`);
      });

      await scenario(`home registration: refusal and network failure keep the form; the shown reference is the stored id; a sibling gets a lead of its own (${device})`, async () => {
        const ctx = await newVisitorContext(browser, { mobile });
        const page = await ctx.newPage();
        const pageErrors = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));
        await page.goto(BASE + '/', { waitUntil: 'networkidle' });
        await dismissOverlays(page);
        const first = { student: `E2E First ${device} ${RUN_ID}`, guardian: 'E2E Guardian', phone: randomPhone() };
        await fillHomeRegistration(page, first);
        const section = page.locator('#quick-registration');
        const submit = page.getByTestId('home-reg-submit');

        for (const [label, handler] of [['429', rejectWith429], ['offline', (route) => route.abort()]]) {
          await page.route(SUBMIT_GLOB, handler);
          await submit.click();
          await section.locator('[role="alert"]').waitFor({ timeout: 10_000 });
          const message = await alertText(section);
          assert(message && !/RATE_LIMITED|Too many|HTTP_/.test(message), `${label}: unexpected error text "${message}"`);
          assert((await page.getByTestId('home-reg-success').count()) === 0, `${label}: success card shown`);
          assert(!/নিবন্ধিত|Logged/.test(await page.locator('body').innerText()), `${label}: success toast shown`);
          assert((await page.inputValue('#home-reg-student')) === first.student, `${label}: student name was cleared`);
          assert((await page.inputValue('#home-reg-mobile')) === first.phone, `${label}: phone was cleared`);
          await page.unroute(SUBMIT_GLOB);
        }

        let accepted = waitForApi(page, '/api/public/submit');
        await submit.click();
        const firstIds = (await (await accepted).json()).ids;
        await page.getByTestId('home-reg-success').waitFor({ timeout: 10_000 });
        const shown = ((await page.getByTestId('home-reg-success').innerText()).match(/REF: (\S+)/) || [])[1];
        assert(shown === firstIds[0], `reference shown "${shown}" is not the stored lead id "${firstIds[0]}"`);

        // Second child, same guardian phone, same browser: must reach the server as its own lead.
        await page.getByTestId('home-reg-success').locator('button').first().click();
        const sibling = { ...first, student: `E2E Sibling ${device} ${RUN_ID}` };
        await fillHomeRegistration(page, sibling);
        accepted = waitForApi(page, '/api/public/submit');
        await submit.click();
        const secondRes = await accepted;
        const sent = JSON.parse(secondRes.request().postData());
        assert(sent.items.some((i) => i.key === 'leads'), 'the second submission carried no lead');
        await page.getByTestId('home-reg-success').waitFor({ timeout: 10_000 });
        // Closing the tab right after the confirmation loses nothing: it is already stored.
        await ctx.close();
        const state = await (await admin.request.get(BASE + '/api/state')).json();
        const leads = (state.state.leads || []).filter((l) => l.phone === first.phone);
        assert(leads.length === 2, `expected 2 leads for the guardian phone, found ${leads.length}`);
        assert(leads.some((l) => l.id === shown && l.name.includes(first.student)), 'first child lead missing');
        assert(leads.some((l) => l.name.includes(sibling.student)), 'sibling lead missing');
        assert(pageErrors.length === 0, `page errors:\n${pageErrors.join('\n')}`);
        // The long-lived test pages polled during the outage; their 503s are expected.
        for (const sink of [visitorErrors, adminErrors]) {
          const kept = sink.filter((e) => !/503/.test(e));
          sink.length = 0;
          sink.push(...kept);
        }
      });
    }

    await scenario('contact inquiry, registration and complaint forms: error first, success only once stored', async () => {
      const ctx = await newVisitorContext(browser);
      const page = await ctx.newPage();
      const tag = `E2E ${RUN_ID}`;

      // Contact inquiry
      await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
      await dismissOverlays(page);
      await page.fill('#inq-name', `Inquiry ${tag}`);
      await page.fill('#inq-phone', randomPhone());
      await page.fill('#inq-email', 'inquiry-e2e@example.com');
      await page.fill('#inq-message', 'Please call back.');
      const inquirySubmit = page.locator('form', { has: page.locator('#inq-name') }).locator('button[type="submit"]');
      await page.route(SUBMIT_GLOB, (route) => route.abort());
      await inquirySubmit.click();
      await page.locator('[role="alert"]', { hasText: /সংযোগ/ }).first().waitFor({ timeout: 10_000 });
      assert((await page.inputValue('#inq-name')) === `Inquiry ${tag}`, 'inquiry name was cleared after a failure');
      assert(!(await page.locator('body').innerText()).includes(`ধন্যবাদ Inquiry ${tag}`), 'inquiry success shown after a failure');
      await page.unroute(SUBMIT_GLOB);
      let accepted = waitForApi(page, '/api/public/submit');
      await inquirySubmit.click();
      assert((await accepted).status() === 200, 'inquiry was not accepted');
      await page.getByText(`ধন্যবাদ Inquiry ${tag}`).first().waitFor({ timeout: 10_000 });

      // Registration form on /admission: the reference shown is the stored lead id.
      await page.goto(BASE + '/admission', { waitUntil: 'networkidle' });
      await dismissOverlays(page);
      const reg = page.locator('#registration-section');
      const regForm = reg.locator('form');
      await regForm.locator('input[type="text"]').first().fill(`Registration ${tag}`);
      await regForm.locator('input[type="text"]').nth(1).fill('E2E Guardian');
      await regForm.locator('input[placeholder="01XXXXXXXXX"]').fill(randomPhone());
      await regForm.locator('input[placeholder="parent@example.com"]').fill('registration-e2e@example.com');
      await page.route(SUBMIT_GLOB, rejectWith429);
      await regForm.locator('button[type="submit"]').click();
      await regForm.locator('[role="alert"]').waitFor({ timeout: 10_000 });
      assert(!/Registration Reference ID/.test(await reg.innerText()), 'registration receipt shown after a refusal');
      await page.unroute(SUBMIT_GLOB);
      accepted = waitForApi(page, '/api/public/submit');
      await regForm.locator('button[type="submit"]').click();
      const regIds = (await (await accepted).json()).ids;
      await reg.getByText('Registration Reference ID').waitFor({ timeout: 10_000 });
      const regShown = ((await reg.innerText()).match(/Registration Reference ID:\s*(\S+)/) || [])[1];
      assert(regShown === regIds[0], `registration reference "${regShown}" is not the stored id "${regIds[0]}"`);

      // Complaint / suggestion
      await page.goto(BASE + '/feedback', { waitUntil: 'networkidle' });
      await dismissOverlays(page);
      const feedback = page.locator('#guardian-feedback');
      const complaintForm = feedback.locator('form');
      await complaintForm.locator('input[type="text"]').first().fill(`Complaint ${tag}`);
      await complaintForm.locator('input[type="tel"]').first().fill(randomPhone());
      await complaintForm.locator('textarea').fill(`Suggestion ${tag}`);
      await page.route(SUBMIT_GLOB, rejectWith429);
      await complaintForm.locator('button[type="submit"]').click();
      await feedback.locator('[role="alert"]').waitFor({ timeout: 10_000 });
      assert((await complaintForm.locator('textarea').inputValue()) === `Suggestion ${tag}`, 'complaint text was cleared after a refusal');
      await page.unroute(SUBMIT_GLOB);
      accepted = waitForApi(page, '/api/public/submit');
      await complaintForm.locator('button[type="submit"]').click();
      assert((await accepted).status() === 200, 'complaint was not accepted');
      await ctx.close();

      const state = (await (await admin.request.get(BASE + '/api/state')).json()).state;
      assert(state.leads.some((l) => l.name === `Inquiry ${tag}`), 'inquiry lead not stored');
      assert(state.leads.some((l) => l.id === regShown && l.name === `Registration ${tag}`), 'registration lead not stored');
      assert((state.complaints || []).some((c) => c.guardianName === `Complaint ${tag}`), 'complaint not stored');
    });

    await scenario('full admission form through the UI: the receipt number is the stored lead id', async () => {
      const ctx = await newVisitorContext(browser);
      const page = await ctx.newPage();
      await page.goto(BASE + '/admission', { waitUntil: 'networkidle' });
      await dismissOverlays(page);
      await page.getByRole('button', { name: /৬-ধাপের ভর্তি ফরম ওপেন করুন|Open 6-Step Admission Form/ }).first().click();
      await page.getByRole('button', { name: /ডেমো তথ্য অটো-ফিল করুন|Auto-Fill Sample Applicant/ }).first().click();
      const studentEn = `Admission ${RUN_ID}`;
      await page.locator('input[value="Farhan Sadik"]').first().fill(studentEn);
      for (let step = 1; step <= 6; step++) {
        await page.getByRole('button', { name: step < 6 ? /পরবর্তী|Next Step/ : /প্রিভিউ|Preview Application/ }).last().click();
        await page.waitForTimeout(250);
      }
      // Refused: back on the form with the reason, nothing lost; then accepted.
      await page.route(SUBMIT_GLOB, rejectWith429);
      await page.getByRole('button', { name: /Confirm . Submit/ }).click();
      await page.locator('[role="alert"]').first().waitFor({ timeout: 10_000 });
      assert(!/আবেদন রিসিট নং/.test(await page.locator('body').innerText()), 'receipt shown after a refusal');
      await page.unroute(SUBMIT_GLOB);
      await page.getByRole('button', { name: /প্রিভিউ|Preview Application/ }).last().click();
      const accepted = waitForApi(page, '/api/public/submit');
      await page.getByRole('button', { name: /Confirm . Submit/ }).click();
      const ids = (await (await accepted).json()).ids;
      await page.getByText(/আবেদন রিসিট নং/).first().waitFor({ timeout: 10_000 });
      const shown = ((await page.locator('body').innerText()).match(/আবেদন রিসিট নং:\s*(\S+)/) || [])[1];
      assert(shown === ids[0], `receipt number "${shown}" is not the stored lead id "${ids[0]}"`);
      await ctx.close();
      const state = (await (await admin.request.get(BASE + '/api/state')).json()).state;
      const stored = state.leads.find((l) => l.id === shown);
      assert(stored && stored.detailedData && stored.detailedData.studentNameEn === studentEn, 'admission form data not stored');
    });

    await scenario('two full admission forms with the same guardian phone are both kept in full', async () => {
      const api = await apiClient();
      const phone = randomPhone();
      const form = (name) => ({
        key: 'leads',
        item: {
          id: 'client-id',
          name,
          phone,
          email: 'siblings-e2e@example.com',
          courseId: 'course-prep-2',
          message: 'Full admission form',
          source: 'Full Admission Form',
          detailedData: { studentNameEn: name, studentNameBn: name, fatherMobile: phone, fatherNameEn: 'Shared Father', targetClass: 'Class One' },
        },
      });
      const ids = [];
      for (const name of [`Sibling One ${RUN_ID}`, `Sibling Two ${RUN_ID}`]) {
        const res = await api.post('/api/public/submit', { data: { items: [form(name)] } });
        assert(res.status() === 200, `submit returned ${res.status()} ${await res.text()}`);
        ids.push((await res.json()).ids[0]);
      }
      await api.dispose();
      assert(ids[0] !== ids[1], 'the second child was merged into the first lead');
      const state = (await (await admin.request.get(BASE + '/api/state')).json()).state;
      const [one, two] = ids.map((id) => state.leads.find((l) => l.id === id));
      assert(one && one.detailedData.studentNameEn === `Sibling One ${RUN_ID}`, 'first form data missing');
      assert(two && two.detailedData.studentNameEn === `Sibling Two ${RUN_ID}`, 'second form data missing');
      assert((two.notes || []).some((n) => n.text.includes(one.id)), 'the second lead is not linked to the first');
    });

    // ------------------------------------------------------------------------------------
    // Admin data integrity
    // ------------------------------------------------------------------------------------

    await scenario('creating a staff user with a weak or common password shows the reason and creates nothing', async () => {
      await openAdminTab(admin, /ইউজার রোল ও RBAC|User Roles & RBAC/);
      const form = admin.locator('form', { has: admin.locator('input[placeholder="mahmud"]') });
      for (const [username, password] of [[`weak${RUN_ID}`, 'pass123'], [`common${RUN_ID}`, 'password1234']]) {
        await admin.fill('input[placeholder="e.g. Ustadh Mahmudul Hasan"]', `Weak ${username}`);
        await admin.fill('input[placeholder="mahmud"]', username);
        await admin.fill('input[placeholder="Noor-2027-Uttara"]', password);
        await form.locator('button[type="submit"]').click();
        await admin.getByTestId('new-user-error').waitFor({ timeout: 5_000 });
        await admin.waitForTimeout(800);
        assert(!/নতুন স্টাফ অ্যাকাউন্ট তৈরি হয়েছে|Staff Account Created/.test(await admin.locator('body').innerText()), `${password}: success toast shown`);
        const state = await (await admin.request.get(BASE + '/api/state')).json();
        assert(!(state.state.users || []).some((u) => u.username === username), `${password}: account was created`);
      }
      await admin.fill('input[placeholder="mahmud"]', '');
      await admin.fill('input[placeholder="Noor-2027-Uttara"]', '');
    });

    await scenario('deleted items stay deleted and an emptied list stays empty after reload (admin and visitors)', async () => {
      const before = (await (await admin.request.get(BASE + '/api/state')).json()).state;
      const graduate = before.hifzTreeConfig.graduates[0];
      const newGraduate = `হাফেজ ই-টু-ই ${RUN_ID}`;

      await openAdminTab(admin, /স্ক্রলিং নিউজ ম্যানেজার|Scrolling News Manager/);
      for (let i = 0; i < 60 && (await admin.locator('button[aria-label^="Delete "]').count()) > 0; i++) {
        await admin.locator('button[aria-label^="Delete "]').first().click();
        await admin.waitForTimeout(200);
      }
      await openAdminTab(admin, /Media Showcase/);
      await admin.getByRole('button', { name: /হিফজুল কুরআন ট্রি ও সার্টিফিকেট/ }).first().click();
      let synced = waitForApi(admin, '/api/admin/sync');
      await admin.locator(`button[aria-label="Delete ${graduate.nameBn}"]`).first().click();
      await synced;
      await admin.locator('input[placeholder^="হাফেজের পূর্ণ নাম"]').fill(newGraduate);
      synced = waitForApi(admin, '/api/admin/sync');
      await admin.getByRole('button', { name: /হাফেজ যুক্ত করুন/ }).first().click();
      await synced;
      await admin.waitForTimeout(1200);

      const check = async (when) => {
        const s = (await (await admin.request.get(BASE + '/api/state')).json()).state;
        assert(s.news.length === 0, `${when}: news has ${s.news.length} items`);
        const names = s.hifzTreeConfig.graduates.map((g) => g.nameBn);
        assert(!names.includes(graduate.nameBn), `${when}: deleted graduate is back`);
        assert(names.includes(newGraduate), `${when}: added graduate is missing`);
        assert(names.length === before.hifzTreeConfig.graduates.length, `${when}: ${names.length} graduates`);
      };
      await check('after the edits');
      // Reload, wait for a poll and make another edit: nothing built-in may be written back.
      await admin.reload({ waitUntil: 'networkidle' });
      await admin.getByTestId('admin-dashboard-version').waitFor({ timeout: 15_000 });
      await admin.waitForTimeout(6000);
      await openAdminTab(admin, /স্ক্রলিং নিউজ ম্যানেজার|Scrolling News Manager/);
      assert((await admin.locator('button[aria-label^="Delete "]').count()) === 0, 'news items are listed again after reload');
      await check('after reload');

      const ctx = await newVisitorContext(browser, { mobile: true });
      const page = await ctx.newPage();
      await page.goto(BASE + '/hifz-tree', { waitUntil: 'networkidle' });
      const text = await page.locator('body').innerText();
      assert(!text.includes(graduate.nameBn), 'visitor still sees the deleted graduate');
      assert(text.includes(newGraduate), 'visitor does not see the added graduate');
      const publicState = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
      assert(publicState.state.news.length === 0, 'public state lists news again');
      for (const item of before.news) assert(!text.includes(item.text), `visitor sees deleted news "${item.text.slice(0, 30)}"`);
      await ctx.close();
    });

    await scenario('two admins edit the same notice: the stale save is refused with a clear message and nothing is overwritten', async () => {
      const ctx = await newVisitorContext(browser);
      const second = await ctx.newPage();
      await uiLogin(second, ADMIN.username, adminNewPassword);
      await openAdminTab(admin, /নোটিশ বোর্ড ম্যানেজার|Notice Board Manager/);
      await openAdminTab(second, /নোটিশ বোর্ড ম্যানেজার|Notice Board Manager/);
      const notices = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      const target = notices[notices.length - 1];
      await admin.locator(`button[aria-label="Edit ${target.title}"]`).first().click();
      await second.locator(`button[aria-label="Edit ${target.title}"]`).first().click();
      const firstTitle = `E2E first writer ${RUN_ID}`;
      await admin.locator('form input[type="text"]').first().fill(firstTitle);
      await second.locator('form textarea').first().fill('Content typed by the second admin');
      let synced = waitForApi(admin, '/api/admin/sync');
      await admin.locator('form button[type="submit"]').first().click();
      assert((await (await synced).json()).ok, 'first save failed');
      synced = waitForApi(second, '/api/admin/sync');
      await second.locator('form button[type="submit"]').first().click();
      const body = await (await synced).json();
      assert((body.rejected || []).some((r) => r.reason.startsWith('CONFLICT:')), `no conflict reported: ${JSON.stringify(body)}`);
      await second.getByText(/অন্য কেউ একই তথ্য পরিবর্তন করেছেন|Someone Else Changed This/).first().waitFor({ timeout: 10_000 });
      await second.getByText(firstTitle).first().waitFor({ timeout: 10_000 });
      const after = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      assert(after.find((n) => n.id === target.id).title === firstTitle, 'the first admin\'s title was overwritten');
      assert(after.length === notices.length, 'other notices were affected');
      await ctx.close();
    });

    await scenario('a visitor submission does not reset what an admin is typing in the settings form', async () => {
      await openAdminTab(admin, /পেইজ সেটিংস|Page Settings/);
      const phone = (await (await admin.request.get(BASE + '/api/state')).json()).state.settings.phonePrimary;
      const field = admin.locator(`input[value="${phone}"]`).first();
      await field.evaluate((el) => el.setAttribute('data-e2e', 'typing'));
      const typing = admin.locator('input[data-e2e="typing"]');
      await typing.fill('01999-UNSAVED');
      const refreshed = admin.waitForResponse((r) => r.url() === `${BASE}/api/state` && r.request().method() === 'GET', { timeout: 20_000 });
      const api = await apiClient();
      const res = await api.post('/api/public/submit', {
        data: { items: [{ key: 'leads', item: { id: 'x', name: `Typing ${RUN_ID}`, phone: randomPhone(), email: '', courseId: '', message: 'x', source: 'Quick Inquiry' } }] },
      });
      await api.dispose();
      assert(res.status() === 200, `submit returned ${res.status()}`);
      await refreshed;
      await admin.waitForTimeout(800);
      assert((await typing.inputValue()) === '01999-UNSAVED', `the field was reset to "${await typing.inputValue()}"`);
      await typing.fill(phone);
    });

    await scenario('staff edits made while the server is unreachable show "not saved yet" and are saved when it returns', async () => {
      const ctx = await newVisitorContext(browser);
      const page = await ctx.newPage();
      await uiLogin(page, ADMIN.username, adminNewPassword);
      await openAdminTab(page, /নোটিশ বোর্ড ম্যানেজার|Notice Board Manager/);
      const notices = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      const target = notices[0];
      const offlineTitle = `${target.title} (offline ${RUN_ID})`;
      await page.route('**/api/**', (route) => route.abort());
      await page.locator(`button[aria-label="Edit ${target.title}"]`).first().click();
      await page.locator('form input[type="text"]').first().fill(offlineTitle);
      await page.locator('form button[type="submit"]').first().click();
      await page.getByTestId('admin-unsaved-badge').waitFor({ timeout: 15_000 });
      await page.unroute('**/api/**');
      await page.getByTestId('admin-unsaved-badge').waitFor({ state: 'detached', timeout: 20_000 });
      const after = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      assert(after.find((n) => n.id === target.id).title === offlineTitle, 'the offline edit was not saved after reconnecting');
      await ctx.close();
    });

    await scenario('edits made offline survive a reconnect whose first save fails, and are saved by the next one', async () => {
      const ctx = await newVisitorContext(browser);
      const page = await ctx.newPage();
      await uiLogin(page, ADMIN.username, adminNewPassword);
      await openAdminTab(page, /নোটিশ বোর্ড ম্যানেজার|Notice Board Manager/);
      const notices = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      const target = notices[0];
      const offlineTitle = `${target.title} (retry ${RUN_ID})`;
      // Offline long enough for a poll to notice (the client switches to its offline mode).
      const pollFailed = page.waitForEvent('requestfailed', { predicate: (r) => r.url().includes('/api/state/meta'), timeout: 20_000 });
      await page.route('**/api/**', (route) => route.abort());
      await pollFailed;
      await page.locator(`button[aria-label="Edit ${target.title}"]`).first().click();
      await page.locator('form input[type="text"]').first().fill(offlineTitle);
      await page.locator('form button[type="submit"]').first().click();
      await page.getByTestId('admin-unsaved-badge').waitFor({ timeout: 15_000 });
      await page.getByText(offlineTitle).first().waitFor({ timeout: 10_000 });
      // The server is reachable again, but saving fails (as during a database outage).
      let refused = 0;
      const reconnected = page.waitForResponse((r) => r.url() === `${BASE}/api/state/meta` && r.status() === 200, { timeout: 30_000 });
      await page.unroute('**/api/**');
      await page.route('**/api/admin/sync', (route) => {
        refused += 1;
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'The database is temporarily unavailable.', code: 'STORE_UNAVAILABLE' }),
        });
      });
      // The poll that notices the connection is back saves at once; that save is refused. Wait
      // for that poll (not for the save sent right after the edit) and leave time for a reload.
      await reconnected;
      await page.waitForTimeout(3_000);
      assert(refused >= 1, 'no save was attempted after reconnecting');
      assert((await page.getByTestId('admin-unsaved-badge').count()) === 1, 'the unsaved badge disappeared although nothing was saved');
      assert((await page.getByText(offlineTitle).count()) > 0, 'the offline edit was replaced by the server state');
      const during = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      assert(during.find((n) => n.id === target.id).title === target.title, 'the edit reached the server although saving was refused');
      await page.unroute('**/api/admin/sync');
      await page.getByTestId('admin-unsaved-badge').waitFor({ state: 'detached', timeout: 20_000 });
      const after = (await (await admin.request.get(BASE + '/api/state')).json()).state.notices;
      assert(after.find((n) => n.id === target.id).title === offlineTitle, 'the offline edit was not saved once saving worked again');
      await ctx.close();
    });

    await scenario('a signatory assignment refused as a conflict leaves the slot with its holder', async () => {
      const sync = async (baseVersion, ops) => {
        const res = await admin.request.post(BASE + '/api/admin/sync', { data: { baseVersion, ops } });
        return { status: res.status(), body: await res.json() };
      };
      const users = async () => (await (await admin.request.get(BASE + '/api/state')).json()).state.users;
      const loaded = await (await admin.request.get(BASE + '/api/state')).json();
      const record = loaded.state.users.find((u) => u.username === teacher.username);
      const holder = loaded.state.users.find((u) => u.signatorySlot === 'coordinator');
      assert(record && holder && holder.id !== record.id, 'needs the teacher account and a coordinator signatory');

      // Someone else edits the teacher's account after this client loaded the state ...
      const renamed = `${record.fullName} (edited)`;
      const other = await sync(loaded.version, [{ op: 'upsert', key: 'users', item: { ...record, fullName: renamed } }]);
      assert(other.status === 200 && !other.body.rejected, `edit returned ${other.status} ${JSON.stringify(other.body)}`);
      // ... so the stale client's assignment is refused, and the holder must keep the slot.
      const stale = await sync(loaded.version, [{ op: 'upsert', key: 'users', item: { ...record, signatorySlot: 'coordinator' } }]);
      assert(stale.status === 200, `stale assignment returned ${stale.status}`);
      assert((stale.body.rejected || []).some((r) => r.index === 0 && r.reason.startsWith('CONFLICT:')), `no conflict: ${JSON.stringify(stale.body)}`);
      assert(stale.body.version === other.body.version, 'a refused assignment changed the state version');
      let now = await users();
      assert(now.find((u) => u.id === holder.id).signatorySlot === 'coordinator', 'the slot was taken from its holder although the assignment was refused');
      assert(now.find((u) => u.id === record.id).signatorySlot !== 'coordinator', 'the refused assignment was stored');
      assert(now.find((u) => u.id === record.id).fullName === renamed, 'the other edit was overwritten');

      // With the current state the assignment moves the slot, and moving it back restores everything.
      const fresh = await sync(other.body.version, [{ op: 'upsert', key: 'users', item: { ...record, fullName: renamed, signatorySlot: 'coordinator' } }]);
      assert(fresh.status === 200 && !fresh.body.rejected, `assignment returned ${fresh.status} ${JSON.stringify(fresh.body)}`);
      now = await users();
      assert(now.find((u) => u.id === record.id).signatorySlot === 'coordinator', 'assignment not stored');
      assert(now.find((u) => u.id === holder.id).signatorySlot === 'none', 'the previous holder kept the slot');
      const back = await sync(fresh.body.version, [
        { op: 'upsert', key: 'users', item: record },
        { op: 'upsert', key: 'users', item: holder },
      ]);
      assert(back.status === 200 && !back.body.rejected, `restore returned ${back.status} ${JSON.stringify(back.body)}`);
      now = await users();
      assert(now.find((u) => u.id === holder.id).signatorySlot === 'coordinator', 'slot not restored');
      assert(now.find((u) => u.id === record.id).fullName === record.fullName, 'teacher not restored');
    });

    await scenario('two repeat submissions and a staff edit of the same lead at the same moment: nothing acknowledged is lost', async () => {
      const api = await apiClient();
      for (let round = 0; round < 2; round += 1) {
        const phone = randomPhone();
        const name = `E2E Race ${RUN_ID} ${round}`;
        const submit = (message) =>
          api.post('/api/public/submit', {
            data: { items: [{ key: 'leads', item: { id: 'client-id', name, phone, email: '', courseId: '', message, source: 'Quick Inquiry' } }] },
          });
        assert((await submit('first')).status() === 200, 'first submission failed');
        const loaded = await (await admin.request.get(BASE + '/api/state')).json();
        const stored = loaded.state.leads.find((l) => l.phone === phone);
        assert(stored, 'lead not stored');
        // All three were prepared from the same state of the lead and are sent together.
        const [a, b, staff] = await Promise.all([
          submit(`again A${round}`),
          submit(`again B${round}`),
          admin.request.post(BASE + '/api/admin/sync', {
            data: { baseVersion: loaded.version, ops: [{ op: 'upsert', key: 'leads', item: { ...stored, status: 'Contacted' } }] },
          }),
        ]);
        assert(a.status() === 200 && b.status() === 200, `repeat submissions returned ${a.status()} and ${b.status()}`);
        assert(staff.status() === 200, `staff edit returned ${staff.status()}`);
        const staffRefused = ((await staff.json()).rejected || []).some((r) => r.reason.startsWith('CONFLICT:'));
        const after = (await (await admin.request.get(BASE + '/api/state')).json()).state.leads.filter((l) => l.phone === phone);
        assert(after.length === 1, `${after.length} leads for one student`);
        const notes = JSON.stringify(after[0].notes || []);
        assert(notes.includes(`again A${round}`) && notes.includes(`again B${round}`), 'a repeat submission that was acknowledged is missing from the lead');
        assert((after[0].notes || []).length === (stored.notes || []).length + 2, 'notes were lost or duplicated');
        // The staff edit is either stored or was reported back as a conflict, never silently dropped.
        assert((after[0].status === 'Contacted') !== staffRefused, `staff edit: status ${after[0].status}, refused ${staffRefused}`);
      }
      await api.dispose();
    });

    // ------------------------------------------------------------------------------------
    // Navigation and metadata
    // ------------------------------------------------------------------------------------

    await scenario('unknown URLs return 404; titles follow navigation; blog posts have their own title and link', async () => {
      const ctx = await newVisitorContext(browser, { mobile: true });
      const page = await ctx.newPage();
      for (const path of ['/this-page-does-not-exist', '/admin/unknown', '/blog/deep/link']) {
        const res = await page.goto(BASE + path);
        assert(res.status() === 404, `${path} returned ${res.status()}`);
        assert((await page.locator('a[href="/"]').count()) > 0, `${path}: no link back to the home page`);
      }
      await page.goto(BASE + '/fees', { waitUntil: 'networkidle' });
      const feesTitle = await page.title();
      await page.evaluate(() => {
        history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForFunction((t) => document.title !== t, feesTitle, { timeout: 5_000 });

      await page.goto(BASE + '/blog', { waitUntil: 'networkidle' });
      await dismissOverlays(page);
      const blogTitle = await page.title();
      assert((await page.locator('h1:visible').count()) === 1, 'the blog page does not have exactly one visible h1');
      const link = page.locator('a[href*="?post="]').first();
      const href = await link.getAttribute('href');
      assert(href, 'blog cards are not links');
      const html = await (await fetch(href)).text();
      assert(/property="og:type" content="article"/.test(html), 'post URL has no article metadata');
      await link.click();
      await page.getByTestId('blog-article-title').waitFor({ timeout: 10_000 });
      assert(page.url().includes('?post='), 'opening a post did not change the URL');
      assert((await page.title()) !== blogTitle, 'the tab title did not change to the post title');
      assert((await page.locator('h1:visible').count()) === 1, 'an open post does not have exactly one visible h1');
      await ctx.close();
    });

    await scenario('POST /api/public/submit with status Admitted stores status New', async () => {
      const api = await apiClient();
      const phone = `018${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;
      const res = await api.post('/api/public/submit', {
        data: {
          items: [
            {
              key: 'leads',
              item: {
                id: `lead-e2e-${RUN_ID}`,
                name: `E2E Admitted ${RUN_ID}`,
                phone,
                email: '',
                courseId: '',
                message: 'status injection test',
                source: 'Quick Inquiry',
                status: 'Admitted',
                priority: 'Hot',
              },
            },
          ],
        },
      });
      assert(res.status() === 200, `submit returned ${res.status()}`);
      await api.dispose();
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const stored = (state.state.leads || []).find((l) => l.phone === phone);
      assert(stored, 'lead not stored');
      assert(stored.status === 'New', `status is ${stored.status}`);
    });

    await scenario('guest career application; the no-login tracker shows its status only', async () => {
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const job = (state.state.careerJobs || []).find((j) => j.active);
      assert(job, 'no active career job');
      const email = `e2e.${RUN_ID}@example.test`;
      const api = await apiClient();
      const submit = await api.post('/api/public/submit', {
        data: {
          items: [
            {
              key: 'careerApplications',
              item: {
                id: `app-e2e-${RUN_ID}`,
                jobId: job.id,
                applicantName: `Applicant ${RUN_ID}`,
                phone: `019${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`,
                email,
                educationBn: 'Dawrah Hadith',
                experienceYearsBn: '3',
                paymentTrxId: `TRX${RUN_ID}`,
              },
            },
          ],
        },
      });
      assert(submit.status() === 200, `submit returned ${submit.status()}`);
      const first = await (await api.post('/api/public/career/status', { data: { query: email } })).json();
      assert(first.applications && first.applications.length === 1, `first lookup ${JSON.stringify(first)}`);
      // HR writes a note for the applicant; the no-login lookup must not hand it to whoever knows the email.
      const staff = await (await admin.request.get(BASE + '/api/state')).json();
      const storedApp = (staff.state.careerApplications || []).find((a) => a.id === first.applications[0].id);
      assert(storedApp, 'application not visible to the admin');
      const hrNote = `Interview Saturday ${RUN_ID}`;
      const noted = await admin.request.post(BASE + '/api/admin/sync', {
        data: { baseVersion: staff.version, ops: [{ op: 'upsert', key: 'careerApplications', item: { ...storedApp, hrNote } }] },
      });
      assert(noted.status() === 200 && !(await noted.json()).rejected, `saving the HR note returned ${noted.status()}`);
      const lookup = await api.post('/api/public/career/status', { data: { query: email } });
      const body = await lookup.json();
      await api.dispose();
      assert(lookup.status() === 200 && body.applications.length === 1, `lookup ${lookup.status()} ${JSON.stringify(body)}`);
      const entry = body.applications[0];
      for (const f of ['phone', 'email', 'whatsapp', 'paymentTrxId', 'cvFileDataUrl', 'expectedSalaryBn', 'hrNote']) {
        assert(!(f in entry), `status lookup exposes ${f}`);
      }
      assert(!JSON.stringify(body).includes(hrNote), 'status lookup exposes the HR note');
      assert(Object.keys(entry).sort().join() === 'applicantName,id,jobTitleBn,status,submittedAt', `status fields: ${Object.keys(entry)}`);

      await visitor.goto(BASE + '/career', { waitUntil: 'networkidle' });
      await dismissOverlays(visitor);
      await visitor.getByTestId('career-status-input').fill(email);
      const looked = waitForApi(visitor, '/api/public/career/status');
      await visitor.getByTestId('career-status-search-btn').click();
      assert((await looked).status() === 200, 'UI status lookup failed');
      await visitor.getByTestId('career-status-results').getByText(entry.id).waitFor({ timeout: 10_000 });
    });

    await scenario('security headers are sent on pages and API responses', async () => {
      const api = await apiClient();
      for (const p of ['/', '/admin', '/api/state/meta']) {
        const h = (await api.get(p)).headers();
        assert(h['x-content-type-options'] === 'nosniff', `${p}: nosniff missing`);
        assert(h['referrer-policy'] === 'strict-origin-when-cross-origin', `${p}: referrer-policy ${h['referrer-policy']}`);
        assert(h['x-frame-options'] === 'SAMEORIGIN', `${p}: x-frame-options ${h['x-frame-options']}`);
        assert(/camera=\(\)/.test(h['permissions-policy'] || ''), `${p}: permissions-policy missing`);
        assert(/max-age=\d+/.test(h['strict-transport-security'] || ''), `${p}: HSTS missing`);
        assert(/frame-ancestors 'self'/.test(h['content-security-policy'] || ''), `${p}: CSP missing`);
        assert(!('x-powered-by' in h), `${p}: x-powered-by present`);
      }
      // Pages: scripts run only with the per-request nonce; one policy header, a new nonce each time.
      const nonces = new Set();
      for (const p of ['/', '/admin', '/blog', `/no-such-page-${RUN_ID}`]) {
        const res = await api.get(p);
        const csp = res.headers()['content-security-policy'] || '';
        const nonce = (/script-src [^;]*'nonce-([A-Za-z0-9+/=]+)'/.exec(csp) || [])[1];
        assert(nonce && /'strict-dynamic'/.test(csp), `${p}: no script nonce in "${csp.slice(0, 120)}"`);
        assert(res.headersArray().filter((h) => h.name.toLowerCase() === 'content-security-policy').length === 1, `${p}: several CSP headers`);
        const scripts = (await res.text()).match(/<script\b[^>]*>/g) || [];
        const bare = scripts.filter((tag) => !tag.includes(`nonce="${nonce}"`) && !/type="application\/ld\+json"/.test(tag));
        assert(scripts.length > 3 && bare.length === 0, `${p}: script tags without the nonce: ${bare.slice(0, 2).join(' ')}`);
        nonces.add(nonce);
      }
      assert(nonces.size === 4, 'the nonce is reused between responses');
      const apiCsp = (await api.get('/api/state/meta')).headers()['content-security-policy'] || '';
      assert(!/nonce-/.test(apiCsp), 'API responses carry a nonce policy');
      await api.dispose();

      // In the browser: the app runs, and script that did not come with the nonce does not.
      const ctx = await newVisitorContext(browser);
      const page = await ctx.newPage();
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const probe = await page.evaluate(async () => {
        const blocked = [];
        document.addEventListener('securitypolicyviolation', (e) => blocked.push(e.violatedDirective));
        document.body.insertAdjacentHTML('beforeend', '<img src="data:," onerror="window.__e2eInline = 1">');
        const el = document.createElement('div');
        el.setAttribute('onclick', 'window.__e2eInline = 2');
        document.body.appendChild(el);
        el.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { ran: window.__e2eInline, blocked, rendered: document.querySelectorAll('#root *').length };
      });
      await ctx.close();
      assert(probe.ran === undefined, `an injected inline handler ran (${probe.ran})`);
      assert(probe.blocked.length >= 1, 'no CSP violation was reported for the injected handlers');
      assert(probe.rendered > 50, 'the application did not render under the nonce policy');
    });

    if (DB_MODE) {
      await scenario('the public default passwords are refused in database mode', async () => {
        const api = await apiClient();
        for (const [username, password] of [['chairman', 'chairman123'], ['principal', 'principal123'], ['teacher', 'teacher123'], ['manager', 'manager123']]) {
          const r = await apiLogin(api, username, password);
          assert(r.status === 401, `${username} with its old default password returned ${r.status}`);
        }
        await api.dispose();
        const state = await (await admin.request.get(BASE + '/api/state')).json();
        assert(!(state.state.users || []).some((u) => u.username === 'manager'), 'sample manager account was seeded');
      });
    }

    await scenario('links with unsafe schemes are refused by staff sync and public submit', async () => {
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const res = await admin.request.post(BASE + '/api/admin/sync', {
        data: {
          baseVersion: state.version,
          ops: [
            { op: 'upsert', key: 'notices', item: { id: `n-e2e-js-${RUN_ID}`, title: 'x', attachmentUrl: 'javascript:alert(1)' } },
            { op: 'upsert', key: 'departmentVideos', item: { id: `v-e2e-data-${RUN_ID}`, videoUrl: 'data:text/html,<script>1</script>' } },
            { op: 'upsert', key: 'departmentVideos', item: { id: `v-e2e-file-${RUN_ID}`, videoUrl: 'file:///etc/passwd' } },
          ],
        },
      });
      const body = await res.json();
      assert(res.status() === 400 && body.rejected && body.rejected.length === 3, `sync ${res.status()} ${JSON.stringify(body).slice(0, 300)}`);
      const job = (state.state.careerJobs || []).find((j) => j.active);
      const api = await apiClient();
      const submit = await api.post('/api/public/submit', {
        data: {
          items: [{ key: 'careerApplications', item: { jobId: job.id, applicantName: 'Link Test', phone: '01911000000', email: `link.${RUN_ID}@example.test`, educationBn: 'BA', cvLinkOrFileName: 'javascript:alert(1)' } }],
        },
      });
      await api.dispose();
      assert(submit.status() === 400, `public submit with a script link returned ${submit.status()}`);
    });

    await scenario('a candidate account does not expose guest applications sent with the same email', async () => {
      const email = `e2e.${RUN_ID}@example.test`; // the guest application above used this address
      const api = await apiClient();
      const reg = await api.post('/api/public/career/register', {
        data: { fullName: 'Someone Else', email, phone: '01811000000', password: strongPassword('Cand1date-') },
      });
      assert(reg.status() === 200, `register returned ${reg.status()}`);
      const me = await (await api.get('/api/public/career/me')).json();
      assert(me.candidate && me.candidate.email === email, 'candidate session missing');
      assert(me.applications.length === 0, `account sees ${me.applications.length} guest application(s)`);
      const cookies = (await api.storageState()).cookies;
      await api.post('/api/public/career/logout');
      await api.dispose();
      // The copied candidate token is void after logout.
      const replay = await pwRequest.newContext({ baseURL: BASE, storageState: { cookies, origins: [] } });
      const again = await (await replay.get('/api/public/career/me')).json();
      await replay.dispose();
      assert(again.candidate === null, 'candidate token still valid after logout');
    });

    await scenario('a spoofed X-Forwarded-For prefix does not bypass the per-client rate limit', async () => {
      const api = await apiClient();
      const statuses = [];
      for (let i = 0; i < 13; i++) {
        const r = await api.post('/api/public/admission-token/match', {
          headers: { 'X-Forwarded-For': `203.0.113.${i}, 198.51.100.${parseInt(RUN_ID.slice(0, 2), 16)}` },
          data: { phone: '01700000000' },
        });
        statuses.push(r.status());
      }
      await api.dispose();
      assert(statuses.filter((s) => s !== 429).length === 10 && statuses[12] === 429, `statuses ${statuses.join(',')}`);
    });

    await scenario('a copied staff token is void after password reset and after logout', async () => {
      const api = await apiClient();
      const login = await apiLogin(api, teacher.username, teacher.newPassword, 'Coordinators / Teachers');
      assert(login.status === 200, `teacher login ${login.status}`);
      const cookies = (await api.storageState()).cookies;
      const copy = () => pwRequest.newContext({ baseURL: BASE, storageState: { cookies, origins: [] } });
      const before = await copy();
      assert((await before.get('/api/auth/me')).status() === 200, 'copied token not valid before logout');
      await before.dispose();
      await api.post('/api/auth/logout');
      await api.dispose();
      const after = await copy();
      assert((await after.get('/api/auth/me')).status() === 401, 'copied token still valid after logout');
      await after.dispose();

      // Admin resets the password: sessions opened with the old one stop working.
      const api2 = await apiClient();
      assert((await apiLogin(api2, teacher.username, teacher.newPassword)).status === 200, 'teacher re-login failed');
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      const record = (state.state.users || []).find((u) => u.username === teacher.username);
      const reset = await admin.request.post(BASE + '/api/admin/sync', {
        data: { baseVersion: state.version, ops: [{ op: 'upsert', key: 'users', item: { ...record, password: strongPassword('Res3t-') } }] },
      });
      assert(reset.status() === 200, `reset returned ${reset.status()}`);
      assert((await api2.get('/api/auth/me')).status() === 401, 'session survived an admin password reset');
      await api2.dispose();
    });

    await scenario('logout clears staff data', async () => {
      await openAdminTab(admin, /লিড টু অ্যাডমিশন|Lead to Admission/);
      await admin.getByText(lead.student).first().waitFor({ timeout: 10_000 });
      const out = waitForApi(admin, '/api/auth/logout');
      await admin.getByRole('button', { name: /লগআউট করুন|Sign Out/ }).first().click();
      assert((await out).status() === 200, 'logout failed');
      await admin.waitForTimeout(1500);
      const me = await admin.request.get(BASE + '/api/auth/me');
      assert(me.status() === 401, `/api/auth/me after logout ${me.status()}`);
      const state = await (await admin.request.get(BASE + '/api/state')).json();
      assert(state.audience === 'public' && !('leads' in state.state), 'staff state still served');
      const leaked = await admin.evaluate((needle) => {
        const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k) || '').join('\n');
        return document.body.innerText.includes(needle) || stored.includes(needle);
      }, lead.student);
      assert(!leaked, 'lead data still in the page or localStorage after logout');
      await admin.goto(BASE + '/admin', { waitUntil: 'networkidle' });
      await admin.locator('#login-userid').waitFor({ timeout: 10_000 });
    });

    await scenario('/api/admin/sync without cookie returns 401', async () => {
      const api = await apiClient();
      const res = await api.post('/api/admin/sync', { data: { baseVersion: 0, ops: [] } });
      assert(res.status() === 401, `status ${res.status()}`);
      const vo = await api.get('/api/admin/virtual-office');
      assert(vo.status() === 401, `virtual-office status ${vo.status()}`);
      await api.dispose();
    });

    await scenario('blog webhook with the legacy default key returns 503', async () => {
      const api = await apiClient();
      const res = await api.post('/api/blog/action-publish', {
        headers: { Authorization: 'Bearer mmm-blog-live-key-2027' },
        data: { title: 'x', content: 'y' },
      });
      const body = await res.json();
      assert(res.status() === 503, `status ${res.status()} ${JSON.stringify(body)}`);
      await api.dispose();
    });

    await scenario('cross-origin state-changing request is refused (403)', async () => {
      const api = await apiClient();
      const res = await api.post('/api/public/submit', {
        headers: { Origin: 'https://evil.example' },
        data: { items: [] },
      });
      assert(res.status() === 403, `status ${res.status()}`);
      await api.dispose();
    });

    if (dbRelay) {
      await scenario('database outage: fast 503, the public site still renders, forms report the failure and work again afterwards', async () => {
        const ctx = await newVisitorContext(browser);
        const page = await ctx.newPage();
        const pageErrors = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));
        await page.goto(BASE + '/feedback', { waitUntil: 'networkidle' });
        await dismissOverlays(page);
        const feedback = page.locator('#guardian-feedback');
        const form = feedback.locator('form');
        await form.locator('input[type="text"]').first().fill(`Outage ${RUN_ID}`);
        await form.locator('input[type="tel"]').first().fill(randomPhone());
        await form.locator('textarea').fill('Typed while the database was down');

        await dbRelay.cut();
        try {
          const timed = async (path) => {
            const started = Date.now();
            const res = await fetch(BASE + path);
            return { status: res.status, code: (await res.json()).code, ms: Date.now() - started };
          };
          const first = await timed('/api/state/meta');
          assert(first.status === 503 && first.code === 'STORE_UNAVAILABLE', `first request: ${JSON.stringify(first)}`);
          assert(first.ms < 7000, `first 503 took ${first.ms} ms`);
          const next = await timed('/api/state');
          assert(next.status === 503 && next.ms < 1500, `following request: ${JSON.stringify(next)}`);

          await form.locator('button[type="submit"]').click();
          await feedback.locator('[role="alert"]').waitFor({ timeout: 15_000 });
          assert((await form.locator('textarea').inputValue()) === 'Typed while the database was down', 'text was cleared');

          // A first-time visitor (no cached copy) still gets the website.
          const freshCtx = await newVisitorContext(browser, { mobile: true });
          const fresh = await freshCtx.newPage();
          fresh.on('pageerror', (e) => pageErrors.push(e.message));
          const res = await fresh.goto(BASE + '/notices', { waitUntil: 'domcontentloaded' });
          assert(res.status() === 200, `/notices returned ${res.status()} during the outage`);
          await fresh.locator('header').first().waitFor({ timeout: 20_000 });
          const text = await fresh.locator('body').innerText();
          assert(text.trim().length > 500 && !/পেইজটি লোড করতে সাময়িক সমস্যা/.test(text), 'the site did not render during the outage');
          await freshCtx.close();
        } finally {
          await dbRelay.restore();
        }
        // The fail-fast window lasts a few seconds; then everything works again.
        await waitForServer(BASE, 30_000);
        const accepted = waitForApi(page, '/api/public/submit');
        await form.locator('button[type="submit"]').click();
        assert((await accepted).status() === 200, 'the complaint was not accepted after the database came back');
        await ctx.close();
        assert(pageErrors.length === 0, `page errors:\n${pageErrors.join('\n')}`);
      });
    }

    await scenario('login rate limit returns 429 after repeated failures', async () => {
      const api = await apiClient();
      const statuses = [];
      for (let i = 0; i < 12; i++) {
        const r = await apiLogin(api, `nobody${RUN_ID}`, `wrong-${i}`);
        statuses.push(r.status);
        if (r.status === 429) break;
      }
      await api.dispose();
      assert(statuses.slice(0, 10).every((s) => s === 401), `first statuses ${statuses.join(',')}`);
      assert(statuses.includes(429), `no 429 in ${statuses.join(',')}`);
    });

    await scenario('no console/page errors in the admin browser session', async () => {
      const relevant = adminErrors.filter((e) => !/status of 401/.test(e)); // expected 401 from /api/auth/me after logout
      assert(relevant.length === 0, `errors:\n${relevant.join('\n')}`);
    });
  } finally {
    await browser.close();
    if (server) server.stop();
    if (dbRelay) await dbRelay.stop();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} scenarios passed (${DB_MODE ? 'database' : 'demo'} mode).`);
  if (failed.length && server) console.log('--- server log tail ---\n' + server.log.slice(-40).join(''));
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
