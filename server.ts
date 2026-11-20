import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  DEFAULT_VIRTUAL_OFFICE_CONFIG,
  evaluateVirtualOfficeLiveStatus,
  resolveDeskJoinDetails,
  sanitizeVirtualOfficeForPublic,
  virtualOfficeCheckinSchema,
} from './src/utils/virtualOfficeLogic.ts';
import { classifyContentDeterministically } from './src/utils/admissionToken2027Logic.ts';
import type {
  BlogAutomationConfig,
  BlogPostItem,
  VirtualOfficeConfig,
  VirtualOfficeSession,
} from './src/types/cms.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const LIVE_STATE_FILE = path.join(DATA_DIR, 'live-cms-state.json');

interface PersistedLiveStore {
  version: number;
  updatedAt: string;
  state: Record<string, unknown>;
}

let liveStoreCache: PersistedLiveStore | null = null;

function loadLiveStoreFromDisk(): PersistedLiveStore | null {
  if (liveStoreCache) return liveStoreCache;
  try {
    if (fs.existsSync(LIVE_STATE_FILE)) {
      const raw = fs.readFileSync(LIVE_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedLiveStore;
      if (parsed && typeof parsed === 'object' && parsed.state) {
        liveStoreCache = {
          version: Number(parsed.version) || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          state: parsed.state,
        };
        return liveStoreCache;
      }
    }
  } catch {
    // Ignore disk read error and start fresh
  }
  return null;
}

function saveLiveStoreToDisk(state: Record<string, unknown>): PersistedLiveStore {
  const current = loadLiveStoreFromDisk();
  const nextVersion = (current?.version || 0) + 1;
  const updatedAt = new Date().toISOString();
  const nextRecord: PersistedLiveStore = {
    version: nextVersion,
    updatedAt,
    state,
  };
  liveStoreCache = nextRecord;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LIVE_STATE_FILE, JSON.stringify(nextRecord), 'utf-8');
  } catch {
    // Keep in-memory cache even if filesystem is read-only
  }
  return nextRecord;
}

/**
 * STRICT SECURITY SANITIZER for public GET /api/cms-state:
 * Never expose Virtual Office Meet/Zoom Room URLs, Zoom Meeting IDs, or Passcodes
 * to unauthenticated visitors.
 */
function sanitizeStateForPublicVisitor(rawState: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!rawState) return null;
  const cloned: Record<string, unknown> = { ...rawState };
  if (cloned.virtualOfficeConfig && typeof cloned.virtualOfficeConfig === 'object') {
    const vo = cloned.virtualOfficeConfig as VirtualOfficeConfig;
    cloned.virtualOfficeConfig = {
      ...vo,
      roomUrl: '',
      zoomMeetingId: '',
      zoomPasscode: '',
      desks: Array.isArray(vo.desks)
        ? vo.desks.map((d) => ({
            ...d,
            roomUrl: '',
            zoomMeetingId: '',
            zoomPasscode: '',
          }))
        : [],
    };
  }
  return cloned;
}

function getEffectiveVirtualOfficeConfig(store: PersistedLiveStore | null): VirtualOfficeConfig {
  const rawVo = store?.state?.virtualOfficeConfig as VirtualOfficeConfig | undefined;
  if (!rawVo || typeof rawVo !== 'object') {
    return DEFAULT_VIRTUAL_OFFICE_CONFIG;
  }
  return {
    ...DEFAULT_VIRTUAL_OFFICE_CONFIG,
    ...rawVo,
    desks:
      Array.isArray(rawVo.desks) && rawVo.desks.length > 0
        ? rawVo.desks
        : DEFAULT_VIRTUAL_OFFICE_CONFIG.desks,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // 0. Live Deployment State Sync Endpoints (Shared across all visitors/devices)
  app.get('/api/cms-state/meta', (_req, res) => {
    const store = loadLiveStoreFromDisk();
    return res.json({
      hasServerState: Boolean(store?.state),
      version: store?.version || 0,
      updatedAt: store?.updatedAt || null,
    });
  });

  app.get('/api/cms-state', (req, res) => {
    const store = loadLiveStoreFromDisk();
    const isAdminRequest = req.headers['x-mmm-admin'] === '1';
    return res.json({
      hasServerState: Boolean(store?.state),
      version: store?.version || 0,
      updatedAt: store?.updatedAt || null,
      state: isAdminRequest ? store?.state || null : sanitizeStateForPublicVisitor(store?.state || null),
    });
  });

  app.post('/api/cms-state', (req, res) => {
    try {
      const incomingState =
        req.body && typeof req.body === 'object' && req.body.state && typeof req.body.state === 'object'
          ? (req.body.state as Record<string, unknown>)
          : req.body && typeof req.body === 'object' && 'settings' in req.body
            ? (req.body as Record<string, unknown>)
            : null;

      if (!incomingState) {
        return res.status(400).json({ ok: false, error: 'Valid CMS state payload is required' });
      }

      // Preserve server-side Meet/Zoom credentials if an unauthenticated/sanitized payload posts empty roomUrls
      const existing = loadLiveStoreFromDisk();
      const existingVo = existing?.state?.virtualOfficeConfig as VirtualOfficeConfig | undefined;
      const incomingVo = incomingState.virtualOfficeConfig as VirtualOfficeConfig | undefined;
      if (existingVo && incomingVo && !incomingVo.roomUrl && existingVo.roomUrl) {
        incomingState.virtualOfficeConfig = {
          ...incomingVo,
          roomUrl: existingVo.roomUrl,
          zoomMeetingId: incomingVo.zoomMeetingId || existingVo.zoomMeetingId,
          zoomPasscode: incomingVo.zoomPasscode || existingVo.zoomPasscode,
          desks: Array.isArray(incomingVo.desks)
            ? incomingVo.desks.map((d) => {
                const match = (existingVo.desks || []).find((ed) => ed.id === d.id);
                return {
                  ...d,
                  roomUrl: d.roomUrl || match?.roomUrl || existingVo.roomUrl,
                  zoomMeetingId: d.zoomMeetingId || match?.zoomMeetingId,
                  zoomPasscode: d.zoomPasscode || match?.zoomPasscode,
                };
              })
            : existingVo.desks,
        };
      }

      const saved = saveLiveStoreToDisk(incomingState);
      return res.json({
        ok: true,
        version: saved.version,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to save live CMS state',
      });
    }
  });

  // 1. Virtual Office — Public Sanitized Status (ZERO Meet/Zoom URLs or passcodes exposed)
  app.get('/api/public/virtual-office/status', (_req, res) => {
    const store = loadLiveStoreFromDisk();
    const config = getEffectiveVirtualOfficeConfig(store);
    const sanitized = sanitizeVirtualOfficeForPublic(config, new Date());
    return res.json({
      ok: true,
      virtualOffice: sanitized,
    });
  });

  // 2. Virtual Office — Validated 3-Field Lead-Capture Gate (Unlocks Meet/Zoom ONLY after validation)
  app.post('/api/public/virtual-office/checkin', (req, res) => {
    const parsed = virtualOfficeCheckinSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        ok: false,
        error: firstIssue?.message || 'Please provide valid Full Name, Phone, and Email.',
      });
    }

    const input = parsed.data;
    const store = loadLiveStoreFromDisk();
    const config = getEffectiveVirtualOfficeConfig(store);
    const effectiveMode = evaluateVirtualOfficeLiveStatus(config, new Date());
    const deskInfo = resolveDeskJoinDetails(config, input.deskId);

    const sessionId = `vo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    const isLive = effectiveMode === 'ONLINE_LIVE';

    const newSession: VirtualOfficeSession = {
      id: sessionId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      deskId: input.deskId || 'desk-admission',
      deskNameBn: deskInfo.deskNameBn,
      topic: input.topic || 'Virtual Office Live Counseling',
      department: input.department,
      preferredCallbackTime: input.preferredCallbackTime,
      deskMode: isLive
        ? 'ONLINE_LIVE'
        : effectiveMode === 'BUSY_IN_SESSION'
          ? 'BUSY_IN_SESSION'
          : 'OFFLINE',
      sessionStatus: isLive ? 'Joined' : 'Missed — Call Back',
      checkedInAt: nowIso,
    };

    // Persist check-in session & CRM admission lead into live server store
    const baseState: Record<string, unknown> = store?.state ? { ...store.state } : {};
    const existingSessions = Array.isArray(baseState.virtualOfficeSessions)
      ? (baseState.virtualOfficeSessions as VirtualOfficeSession[])
      : [];
    baseState.virtualOfficeSessions = [newSession, ...existingSessions].slice(0, 200);

    const existingLeads = Array.isArray(baseState.leads)
      ? (baseState.leads as Array<Record<string, unknown>>)
      : [];
    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    baseState.leads = [
      {
        id: `lead-vo-${Date.now()}`,
        name: input.fullName,
        phone: input.phone,
        email: input.email,
        courseId: 'virtual-office',
        courseTitle: `Virtual Office — ${deskInfo.deskNameBn}`,
        message: `[Virtual Office ${isLive ? 'Live Join' : 'Callback Request'}] ${input.topic || deskInfo.deskNameEn}${input.preferredCallbackTime ? ` · Callback: ${input.preferredCallbackTime}` : ''}`,
        status: 'New',
        submittedAt: formattedDate,
        source: 'Quick Inquiry',
        priority: 'Hot',
        marketingSourceTag: 'Virtual Office Desk',
      },
      ...existingLeads,
    ];

    saveLiveStoreToDisk(baseState);

    if (!isLive) {
      return res.json({
        ok: true,
        unlocked: false,
        status: effectiveMode,
        session: newSession,
        message:
          effectiveMode === 'BUSY_IN_SESSION'
            ? 'Our duty officer is currently in a counseling session. Your callback ticket has been registered for priority follow-up.'
            : 'Virtual Office is currently offline. Your callback request has been saved and our admission desk will contact you during office hours.',
      });
    }

    return res.json({
      ok: true,
      unlocked: true,
      status: effectiveMode,
      session: newSession,
      join: {
        deskNameBn: deskInfo.deskNameBn,
        deskNameEn: deskInfo.deskNameEn,
        officerNameBn: deskInfo.officerNameBn,
        platform: deskInfo.platform,
        roomUrl: deskInfo.roomUrl,
        zoomMeetingId: deskInfo.zoomMeetingId,
        zoomPasscode: deskInfo.zoomPasscode,
      },
    });
  });

  // 3. Virtual Office — Authenticated Admin Configuration & Check-in Queue
  app.get('/api/admin/virtual-office', (req, res) => {
    if (req.headers['x-mmm-admin'] !== '1') {
      return res.status(401).json({ ok: false, error: 'Admin authorization header required' });
    }
    const store = loadLiveStoreFromDisk();
    const config = getEffectiveVirtualOfficeConfig(store);
    const sessions = Array.isArray(store?.state?.virtualOfficeSessions)
      ? (store?.state?.virtualOfficeSessions as VirtualOfficeSession[])
      : [];
    return res.json({
      ok: true,
      config,
      sessions,
    });
  });

  // 4. Blog Automation API / Webhook (POST /api/blog/action-publish)
  app.post('/api/blog/action-publish', (req, res) => {
    try {
      const store = loadLiveStoreFromDisk();
      const baseState: Record<string, unknown> = store?.state ? { ...store.state } : {};
      const blogAutoCfg = (baseState.blogAutomationConfig || {
        enabled: true,
        apiKey: 'mmm-blog-live-key-2027',
        defaultAuthorName: 'Maharat Editorial Desk',
        defaultCategory: 'Education & Tarbiyah',
      }) as BlogAutomationConfig;

      if (blogAutoCfg.enabled === false) {
        return res.status(403).json({ ok: false, error: 'Blog Automation API is disabled in Admin.' });
      }

      const authHeader = String(req.headers.authorization || '');
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const expectedKey = blogAutoCfg.apiKey || 'mmm-blog-live-key-2027';

      if (!bearerToken || bearerToken !== expectedKey) {
        return res.status(401).json({ ok: false, error: 'Invalid or missing Bearer API key.' });
      }

      const body = req.body || {};
      const titleBn = String(body.titleBn || body.title || '').trim();
      const titleEn = String(body.titleEn || body.title || titleBn).trim();
      const bodyMarkdownBn = String(body.bodyMarkdownBn || body.content || body.body || '').trim();
      const bodyMarkdownEn = String(body.bodyMarkdownEn || bodyMarkdownBn).trim();

      if (!titleBn || !bodyMarkdownBn) {
        return res.status(400).json({
          ok: false,
          error: 'Both title (titleBn/title) and content (bodyMarkdownBn/content) are required.',
        });
      }

      const slugBase = (titleEn || titleBn)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60);

      const newPost: BlogPostItem = {
        id: `blog-api-${Date.now()}`,
        slug: `${slugBase || 'maharat-post'}-${Date.now().toString().slice(-4)}`,
        titleBn,
        titleEn,
        titleAr: body.titleAr ? String(body.titleAr) : undefined,
        excerptBn: String(body.excerptBn || bodyMarkdownBn.slice(0, 160)),
        excerptEn: String(body.excerptEn || bodyMarkdownEn.slice(0, 160)),
        bodyMarkdownBn,
        bodyMarkdownEn,
        category: String(body.category || blogAutoCfg.defaultCategory || 'Education & Tarbiyah'),
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t))
          : ['Maharat', 'Webhook'],
        coverImageUrl: String(body.coverImageUrl || '/assets/maharat/fb/fb-media-3.jpg'),
        authorName: String(body.authorName || blogAutoCfg.defaultAuthorName || 'Maharat Editorial Desk'),
        publishedAt: new Date().toISOString().slice(0, 10),
        status: body.status === 'Draft' || body.status === 'Scheduled' ? body.status : 'Published',
        source: 'api',
      };

      const existingPosts = Array.isArray(baseState.blogPosts)
        ? (baseState.blogPosts as BlogPostItem[])
        : [];
      baseState.blogPosts = [newPost, ...existingPosts];
      const saved = saveLiveStoreToDisk(baseState);

      return res.status(201).json({
        ok: true,
        post: newPost,
        version: saved.version,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to publish blog post via webhook',
      });
    }
  });

  const getGenAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // 5. AI Smart Publishing Assistant Endpoint (Facebook Post / Link / Document -> Section Suggestion)
  app.post('/api/ai-smart-publish', async (req, res) => {
    try {
      const { rawText = '', sourceUrl = '' } = req.body || {};
      const combinedText = `${rawText || ''}\n${sourceUrl || ''}`.trim();
      if (!combinedText) {
        return res.status(400).json({ ok: false, error: 'Text or source URL is required' });
      }

      const stored = loadLiveStoreFromDisk();
      const storedHifz = (stored?.state?.hifzTreeConfig as { graduates?: unknown[] } | undefined)?.graduates?.length;
      const fallback = classifyContentDeterministically(
        String(rawText || ''),
        String(sourceUrl || ''),
        typeof storedHifz === 'number' ? storedHifz : 30
      );
      const ai = getGenAIClient();
      if (!ai) {
        return res.json({ ok: true, mode: 'deterministic', suggestion: fallback });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Analyze this Maharat Model Madrasah announcement, Facebook post, or document and route it to the exact website section:\n\nSource URL: ${sourceUrl}\nContent:\n${rawText}`,
          config: {
            systemInstruction:
              'You are the editorial routing AI for Maharat Model Madrasah (EIIN: 140630, Uttara Dhaka). Classify the post into one of: hifz-tree (new Hafez completing Quran), notice (official notice/exam/holiday/admission circular), blog (long-form educational article/reflection), event (upcoming seminar/competition/tour/program), news-ticker (short breaking highlight). Return accurate Bengali and English titles, summary, and if hifz-tree, extract hafizNameBn, hafizNameEn, fatherNameBn, teacherNameBn, durationNoteBn.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                targetSection: { type: Type.STRING },
                targetLabelBn: { type: Type.STRING },
                targetLabelEn: { type: Type.STRING },
                confidencePercent: { type: Type.NUMBER },
                reasonBn: { type: Type.STRING },
                suggestedTitleBn: { type: Type.STRING },
                suggestedTitleEn: { type: Type.STRING },
                suggestedSummaryBn: { type: Type.STRING },
                suggestedDate: { type: Type.STRING },
                hafizNameBn: { type: Type.STRING },
                hafizNameEn: { type: Type.STRING },
                fatherNameBn: { type: Type.STRING },
                teacherNameBn: { type: Type.STRING },
                durationNoteBn: { type: Type.STRING },
              },
              required: [
                'targetSection',
                'targetLabelBn',
                'targetLabelEn',
                'confidencePercent',
                'reasonBn',
                'suggestedTitleBn',
                'suggestedTitleEn',
                'suggestedSummaryBn',
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        const validTargets = new Set(['hifz-tree', 'notice', 'blog', 'event', 'news-ticker']);
        const merged = {
          ...fallback,
          ...parsed,
          targetSection: validTargets.has(parsed.targetSection)
            ? parsed.targetSection
            : fallback.targetSection,
          sourceUrl: sourceUrl || fallback.sourceUrl,
        };
        return res.json({ ok: true, mode: 'gemini', suggestion: merged });
      } catch {
        return res.json({ ok: true, mode: 'deterministic', suggestion: fallback });
      }
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Smart publish analysis failed',
      });
    }
  });

  // 6. MMM AI Agent Server Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message,
        botName = 'এমএমএম এআই এজেন্ট (MMM AI Agent)',
        knowledgeBase = '',
        instituteNameBn = 'মাহারাত মডেল মাদ্রাসা',
        phone = '01886-340308',
        address = 'প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০ | বয়েস ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০',
      } = req.body || {};

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.json({ reply: null });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: message,
        config: {
          systemInstruction: `আপনি "${instituteNameBn}"-এর অফিসিয়াল এআই এজেন্ট "${botName}"।
প্রতিষ্ঠানের ঠিকানা: ${address}
হেল্পলাইন: ${phone}
প্রতিষ্ঠানের তথ্যভাণ্ডার:
${knowledgeBase}

নির্দেশনা:
১. শুধুমাত্র এই প্রতিষ্ঠানের ভর্তি, ফি, বিভাগ, আবাসিক সুবিধা, ক্যাম্পাস এবং একাডেমিক বিষয়ে সংক্ষিপ্ত, বিনয়ী ও নির্ভুল বাংলায় উত্তর দিন।
২. প্রতিষ্ঠানের বাইরের অপ্রাসঙ্গিক কোনো প্রশ্নের উত্তর দেবেন না।`,
          temperature: 0.3,
        },
      });

      return res.json({ reply: response.text || null });
    } catch {
      return res.json({ reply: null });
    }
  });

  // 7. AI Multi-Document Institution Extractor Endpoint (PDF / DOCX / TXT / Raw Text)
  app.post('/api/ai-extract-institution', async (req, res) => {
    try {
      const { rawText = '', files = [] } = req.body || {};
      const ai = getGenAIClient();

      if (!ai) {
        return res.status(200).json({ aiExtracted: null, fallbackReason: 'NO_API_KEY' });
      }

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (rawText && typeof rawText === 'string' && rawText.trim()) {
        parts.push({
          text: `নিচের ডকুমেন্টের টেক্সট থেকে শিক্ষাপ্রতিষ্ঠানের সকল তথ্য বিশ্লেষণ করে JSON আকারে বের করুন:\n\n${rawText}`,
        });
      }

      if (Array.isArray(files)) {
        for (const f of files) {
          if (f?.base64 && f?.mimeType === 'application/pdf') {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: f.base64,
              },
            });
          } else if (f?.textContent) {
            parts.push({
              text: `ফাইল (${f.name || 'document'}):\n${f.textContent}`,
            });
          }
        }
      }

      if (parts.length === 0) {
        return res.status(400).json({ error: 'No document content provided' });
      }

      parts.push({
        text: `উপরের তথ্য থেকে প্রতিষ্ঠানের নাম (বাংলা ও ইংরেজি), স্লোগান/ট্যাগলাইন, ফোন নম্বর, ইমেইল, ঠিকানা, ভর্তির ছাড় (%), আবাসিক মাসিক ফি, ডে-কেয়ার ফি, শ্রেণিভিত্তিক ভর্তি ও মাসিক বেতনের তালিকা, এবং চ্যাটবটের জন্য প্রশ্নোত্তর (Q&A) বের করুন।`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              instituteName: { type: Type.STRING },
              instituteNameBn: { type: Type.STRING },
              tagline: { type: Type.STRING },
              phonePrimary: { type: Type.STRING },
              phoneSecondary: { type: Type.STRING },
              email: { type: Type.STRING },
              address: { type: Type.STRING },
              admissionDiscountPercent: { type: Type.NUMBER },
              residentialMonthlyFee: { type: Type.NUMBER },
              dayCareMonthlyFee: { type: Type.NUMBER },
              customKnowledgeBase: { type: Type.STRING },
              extractedClasses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    department: { type: Type.STRING },
                    classNameBn: { type: Type.STRING },
                    classNameEn: { type: Type.STRING },
                    admissionFee: { type: Type.NUMBER },
                    monthlyTuition: { type: Type.NUMBER },
                    annualServiceCharge: { type: Type.NUMBER },
                    descriptionBn: { type: Type.STRING },
                  },
                  required: [
                    'department',
                    'classNameBn',
                    'classNameEn',
                    'admissionFee',
                    'monthlyTuition',
                    'annualServiceCharge',
                    'descriptionBn',
                  ],
                },
              },
              extractedQA: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionBn: { type: Type.STRING },
                    keywords: { type: Type.STRING },
                    answerBn: { type: Type.STRING },
                  },
                  required: ['questionBn', 'keywords', 'answerBn'],
                },
              },
            },
            required: [
              'instituteName',
              'instituteNameBn',
              'tagline',
              'phonePrimary',
              'phoneSecondary',
              'email',
              'address',
              'admissionDiscountPercent',
              'residentialMonthlyFee',
              'dayCareMonthlyFee',
              'customKnowledgeBase',
              'extractedClasses',
              'extractedQA',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ aiExtracted: parsed });
    } catch (err) {
      return res.status(200).json({
        aiExtracted: null,
        fallbackReason: err instanceof Error ? err.message : 'AI_ERROR',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
