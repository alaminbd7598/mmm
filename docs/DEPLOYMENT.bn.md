# ডিপ্লয়মেন্ট গাইড — মাহারাত মডেল মাদ্রাসা ওয়েবসাইট

একই কোড তিন জায়গায় চলে: **Hostinger (চূড়ান্ত লাইভ সাইট)**, **Vercel** এবং **Google Cloud Run**।
ডাটাবেস (`DATABASE_URL`) দিলে সব তথ্য MySQL-এ স্থায়ীভাবে সেভ হয়। না দিলে সাইট **ডেমো মোডে** চলে:
সবকিছু দেখা ও পরীক্ষা করা যায়, কিন্তু সার্ভার রিস্টার্ট হলে পরিবর্তন মুছে যায়, আর অ্যাডমিন প্যানেলে
"Demo Mode" ব্যাজ দেখায়।

> **নিরাপত্তা:** পাসওয়ার্ড, `DATABASE_URL`, `JWT_SECRET` বা API কী কখনো GitHub-এ, চ্যাটে বা কোডে
> লিখবেন না। শুধু হোস্টিংয়ের "Environment variables" অংশে বসাবেন।

## Environment variables (সব জায়গায় একই)

| নাম | বাধ্যতামূলক? | কী দেবেন |
|---|---|---|
| `DATABASE_URL` | লাইভ সাইটে হ্যাঁ | `mysql://ইউজার:পাসওয়ার্ড@হোস্ট:3306/ডাটাবেস_নাম` |
| `JWT_SECRET` | `DATABASE_URL` থাকলে হ্যাঁ | কমপক্ষে ৩২ অক্ষরের এলোমেলো লেখা (যেমন `openssl rand -base64 48`-এর ফল) |
| `GEMINI_API_KEY` | না | Noor AI চ্যাটবট ও AI ফিচারের জন্য Google AI Studio-র কী |
| `GEMINI_MODEL` | না | ডিফল্ট `gemini-4-hydrogen` |
| `NEXT_PUBLIC_APP_URL` | সুপারিশকৃত | সাইটের পূর্ণ ঠিকানা, যেমন `https://maharatmadrasah.edu.bd` |
| `BLOG_API_KEY` | না | ব্লগ অটোমেশন ওয়েবহুকের নির্দিষ্ট কী |
| `ADMIN_BOOTSTRAP_PASSWORD` | না | খালি ডাটাবেসে প্রথমবার তৈরি হওয়া সব স্টাফ অ্যাকাউন্টের প্রাথমিক পাসওয়ার্ড |

`.env.example` ফাইলে সব নাম ব্যাখ্যাসহ আছে।

## প্রথম লগইন

- খালি ডাটাবেসে প্রথমবার সাইট চালু হলে পাঁচটি স্টাফ অ্যাকাউন্ট তৈরি হয় (`admin`, `chairman`,
  `principal`, `teacher`, `manager`)। পাসওয়ার্ড হবে `ADMIN_BOOTSTRAP_PASSWORD` (দিলে), না দিলে আগের
  ডিফল্ট পাসওয়ার্ড।
- প্রথম লগইনের পরই নতুন পাসওয়ার্ড সেট করতে হবে; তার আগে ড্যাশবোর্ড খুলবে না।
- লাইভ করার পর অপ্রয়োজনীয় অ্যাকাউন্ট মুছে দিন বা পাসওয়ার্ড বদলে নিন।

## আগের ডাটা (লিড, আবেদন ইত্যাদি) ডাটাবেসে আনা

পুরনো সাইটের পুরো তথ্য একটি JSON ফাইলে আছে (আগের `data/live-cms-state.json`, অথবা অ্যাডমিন প্যানেলের
"Backup → JSON Export" ফাইল)। ডাটাবেস তৈরি হওয়ার পর একবার চালান:

```bash
npm run db:import -- path/to/backup.json
```

পুরনো সব প্লেইন-টেক্সট পাসওয়ার্ড এনক্রিপ্ট (bcrypt) হয়ে যায় এবং প্রত্যেককে পরের লগইনে নতুন পাসওয়ার্ড দিতে হয়।
অ্যাডমিন প্যানেলের "JSON Import / Restore" দিয়েও একই কাজ করা যায়।

---

## ১. Hostinger (Business / Cloud প্ল্যান) — চূড়ান্ত লাইভ সাইট

> Hostinger-এর মেনুর নাম মাঝে মাঝে বদলায়; নিচে সাধারণ নাম দেওয়া হলো।

### ক. MySQL ডাটাবেস তৈরি
1. hPanel → **Websites → Manage → Databases → MySQL Databases**।
2. ডাটাবেস নাম, ইউজারনেম ও শক্ত পাসওয়ার্ড দিয়ে **Create** চাপুন।
3. তৈরি হওয়া পূর্ণ নাম (যেমন `u123456789_mmm`) ও ইউজার নোট করুন। একই সার্ভারে অ্যাপ চললে হোস্ট `localhost`।
4. `DATABASE_URL` হবে: `mysql://u123456789_mmmuser:পাসওয়ার্ড@localhost:3306/u123456789_mmm`
   - পাসওয়ার্ডে `@ : / # ?` থাকলে URL-encode করুন (যেমন `@` → `%40`), অথবা এগুলো ছাড়া পাসওয়ার্ড দিন।

### খ. Node.js অ্যাপ তৈরি (GitHub থেকে)
1. hPanel → **Websites → Add Website → Node.js Apps** (বা "Node.js Web App")।
2. **Import Git Repository** বেছে GitHub অ্যাকাউন্ট সংযুক্ত করুন এবং `alaminbd7598/mmm` রিপো, `main` ব্রাঞ্চ দিন।
3. সেটিংস:
   - Framework: **Next.js** (না থাকলে "Other")
   - Node.js version: **22**
   - Install command: `npm install`
   - Build command: `npm run build`
   - Start command: `npm start`
4. **Environment variables**-এ উপরের তালিকা অনুযায়ী `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
   (আর লাগলে `GEMINI_API_KEY`) যোগ করুন।
5. **Deploy** চাপুন। বিল্ডের সময় `prisma db push` নিজে থেকেই টেবিল তৈরি করে
   (`scripts/prepare-db.mjs`)। বিল্ড লগে `[prepare-db]` লাইনগুলো দেখে নিশ্চিত হোন।
6. ডোমেইন: অ্যাপের সেটিংসে আপনার ডোমেইন যুক্ত করুন এবং SSL চালু রাখুন।

### গ. আপডেট
GitHub-এর `main` ব্রাঞ্চে নতুন কোড এলে hPanel থেকে **Redeploy** চাপুন (স্বয়ংক্রিয় ডিপ্লয় চালু থাকলে নিজেই হবে)।

### সমস্যা হলে
- বিল্ডে `prisma db push failed`: `DATABASE_URL`-এর ইউজার, পাসওয়ার্ড, ডাটাবেস নাম আবার মিলিয়ে দেখুন।
  বিল্ড-সার্ভার ডাটাবেসে পৌঁছাতে না পারলে `SKIP_DB_PUSH=1` দিয়ে বিল্ড করে, SSH থেকে একবার
  `npx prisma db push` চালান।
- লগইনে "not configured": `JWT_SECRET` দেওয়া হয়নি বা ৩২ অক্ষরের কম।

---

## ২. Vercel

1. vercel.com → **Add New → Project** → GitHub থেকে `alaminbd7598/mmm` ইমপোর্ট করুন। Framework নিজে থেকেই **Next.js** ধরবে।
2. **Settings → Environment Variables**-এ ভেরিয়েবলগুলো দিন।
   - ডেমো/প্রিভিউর জন্য `DATABASE_URL` না দিলেও চলবে (ডেমো মোড)।
   - স্থায়ী ডাটার জন্য বাইরের MySQL লাগবে (যেমন Hostinger-এর "Remote MySQL" চালু করে তার হোস্ট ও IP অনুমতি দিয়ে,
     অথবা অন্য কোনো ম্যানেজড MySQL)।
3. **Deploy**। প্রতিটি পুশে প্রিভিউ তৈরি হবে।

> Vercel-এ প্রতিটি অনুরোধ আলাদা সার্ভারে চলতে পারে, তাই ডেমো মোডের পরিবর্তন অস্থায়ী ও অনিশ্চিত — এটা শুধু দেখানোর জন্য।

---

## ৩. Google Cloud Run (Docker)

রিপোতে `Dockerfile` আছে। Google Cloud SDK থাকলে:

```bash
gcloud run deploy mmm-web --source . --region asia-south1 --allow-unauthenticated --port 8080
```

তারপর Cloud Run কনসোলে **Edit & Deploy new revision → Variables & Secrets**-এ ভেরিয়েবলগুলো দিন।
ডাটাবেসের জন্য Cloud SQL (MySQL) বা বাইরের MySQL ব্যবহার করুন। প্রথমবার টেবিল তৈরি করতে নিজের কম্পিউটার
থেকে একবার চালান:

```bash
DATABASE_URL="mysql://..." npx prisma db push
```

Google AI Studio থেকে "Deploy to Cloud Run" করলেও একই `Dockerfile` ব্যবহার হয়।

---

## লোকাল কম্পিউটারে চালানো

```bash
npm install
cp .env.example .env   # প্রয়োজনমতো মান বসান; DATABASE_URL খালি রাখলে ডেমো মোড
npm run dev            # http://localhost:3000
```

পরীক্ষা: `npm run lint` (টাইপচেক), `npm test` (ইউনিট টেস্ট), `npm run build`।
