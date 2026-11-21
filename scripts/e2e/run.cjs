#!/usr/bin/env node
/**
 * End-to-end test of the production build (website + admin CMS + API) with Playwright/Chromium.
 *
 * Prerequisites: `npm run build`, and the `playwright` package with Chromium available
 * (globally or in node_modules; this script never installs browsers).
 *
 * Demo mode (in-memory store, no DATABASE_URL):
 *     node scripts/e2e/run.cjs
 *
 * Database mode (MySQL / MariaDB) against a NEW, EMPTY test database (create it yourself, e.g.
 * `CREATE DATABASE mmm_e2e`). --db-push creates the tables with a plain `prisma db push` first;
 * the script never drops or resets data:
 *     DATABASE_URL=mysql://user:pw@127.0.0.1:3306/mmm_e2e JWT_SECRET=<48 random chars> \
 *       node scripts/e2e/run.cjs --db-push
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
 * The login rate-limit scenario runs last because it exhausts the per-IP login budget of the
 * server process for 15 minutes. Exit code 0 = all scenarios passed.
 */
'use strict';

const { spawn, spawnSync } = require('node:child_process');
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

function startServer() {
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ...(DB_MODE ? { ADMIN_BOOTSTRAP_PASSWORD: BOOTSTRAP_PASSWORD } : { DEMO_MODE: '1' }),
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

async function newVisitorContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('mmm_promo_popup_shown', '1');
    } catch {
      // storage blocked
    }
  });
  return ctx;
}

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
  if (!args['base-url']) {
    if (args['db-push']) pushSchema();
    server = startServer();
  }
  const meta = await waitForServer(BASE, 60_000);
  console.log(`Server ${BASE} ready: mode=${meta.mode} version=${meta.version} (expected ${DB_MODE ? 'database' : 'demo'})`);

  const browser = await chromium.launch({ headless: !args.headed });
  const adminNewPassword = DB_MODE ? strongPassword('Adm1n-') : ADMIN.password;
  const lead = {
    student: `E2E Student ${RUN_ID}`,
    guardian: `E2E Guardian ${RUN_ID}`,
    phone: `017${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`,
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
      await visitor.locator('#home-reg-student').scrollIntoViewIfNeeded();
      await visitor.fill('#home-reg-student', lead.student);
      await visitor.fill('#home-reg-guardian', lead.guardian);
      await visitor.fill('#home-reg-mobile', lead.phone);
      const classSelect = visitor.locator('#home-reg-class');
      const firstClass = await classSelect.locator('option').nth(1).getAttribute('value');
      await classSelect.selectOption(firstClass);
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
      const lookup = await api.post('/api/public/career/status', { data: { query: email } });
      const body = await lookup.json();
      await api.dispose();
      assert(lookup.status() === 200 && body.applications.length === 1, `lookup ${lookup.status()} ${JSON.stringify(body)}`);
      const entry = body.applications[0];
      for (const f of ['phone', 'email', 'whatsapp', 'paymentTrxId', 'cvFileDataUrl', 'expectedSalaryBn']) {
        assert(!(f in entry), `status lookup exposes ${f}`);
      }

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
      await api.dispose();
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
