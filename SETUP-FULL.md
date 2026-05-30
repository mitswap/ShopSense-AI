# সম্পূর্ণ প্রোটোটাইপ — সব কিছু চালু করুন (কিছু বাদ নয়)

এই প্রোটোটাইপ **হ্যাকথন জাজকে দেখানোর জন্য** — প্রতিটি স্তর কাজ করবে।

| # | স্তর | দেখাবেন |
|---|------|---------|
| 1 | React + Vite + Tailwind | ড্যাশবোর্ড UI |
| 2 | PapaParse + Zod | CSV আপলোড |
| 3 | Analytics (JS) | KPI কার্ড, চার্ট |
| 4 | Forecast (MA + ঈদ/পূজা/বর্ষা) | পূর্বাভাস গ্রাফ |
| 5 | Supabase Postgres | ক্লাউড ডেটা, স্টক এডিট |
| 6 | pgvector | ভেক্টর ডাটাবেস |
| 7 | RAG | জ্ঞান ভান্ডার + সূত্র |
| 8 | Gemini | এমবেডিং + বাংলা AI পরামর্শ |
| 9 | বাংলা UI | লোকালাইজেশন |
| 10 | Vercel deploy | লাইভ URL |

---

## ধাপ ১ — লোকাল টুল

```powershell
cd "G:\BuildFest Hackathon\sme-ai-dashboard"
npm install
copy .env.example .env
```

---

## ধাপ ২ — অ্যাকাউন্ট (সব লাগবে)

| সেবা | লিংক | কী নেবেন |
|------|------|---------|
| **Gemini** | https://aistudio.google.com | `GEMINI_API_KEY` |
| **Supabase** | https://supabase.com | URL, anon, **service_role** |
| **GitHub** | https://github.com | রিপো |
| **Vercel** | https://vercel.com | ডিপ্লয় |

---

## ধাপ ৩ — `.env` (সম্পূর্ণ)

```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://YOUR.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...

GEMINI_API_KEY=AIza...

SUPABASE_URL=https://YOUR.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
```

`service_role` শুধু সার্ভারে — কখনো `VITE_` দেবেন না।

---

## ধাপ ৪ — Supabase SQL (দুটো ফাইল)

SQL Editor এ চালান:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_vector_search.sql`

Extensions → **vector** চালু আছে কিনা দেখুন।

---

## ধাপ ৫ — চালান + সিড

```powershell
npm run dev:all
```

ব্রাউজার: http://localhost:5173

1. **টেক স্ট্যাক স্ট্যাটাস** — সব সবুজ হওয়া পর্যন্ত `.env` ঠিক করুন  
2. **Vector RAG সিড করুন** বাটন — Gemini → pgvector  
3. **CSV** আপলোড (`public/sample-inventory.csv`)  
4. **স্টক এডিট** — ডাইনামিক আপডেট  
5. **AI পরামর্শ নিন** — বাংলা + RAG সূত্র  

API স্ট্যাটাস: http://localhost:3001/api/status

---

## ধাপ ৬ — ভিডিওতে বলুন (৩ মিনিট)

1. সমস্যা: দোকানদার স্টক/ভবিষ্যৎ বুঝতে পারে না  
2. CSV → Supabase → অ্যানালিটিক্স  
3. পূর্বাভাস + ঈদ সিজন  
4. Vector RAG + Gemini — «পরবর্তী কী করবেন»  
5. KPI + স্কেল (multi-shop, Vercel)

---

## ধাপ ৭ — Vercel env

Production এ একই ভেরিয়েবল + `SUPABASE_SERVICE_ROLE_KEY` + `GEMINI_API_KEY`.

---

**ডেমো মোড বন্ধ:** `VITE_USE_SUPABASE=true` — পুরো প্রোটোটাইপের জন্য।
