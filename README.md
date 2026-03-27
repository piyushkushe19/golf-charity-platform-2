# ParScore — Golf Charity Subscription Platform
### Full-Stack Setup & Deployment Guide

---

## Project Structure

```
golf-charity-platform/
├── frontend/                    # React.js + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Layout.jsx, AdminLayout.jsx
│   │   ├── context/             # AuthContext.jsx
│   │   ├── lib/                 # supabase.js (all DB helpers)
│   │   ├── pages/
│   │   │   ├── dashboard/       # DashboardPage, ScoresPage, MyDrawsPage, MyCharityPage, WinningsPage
│   │   │   ├── admin/           # AdminDashboard, AdminUsers, AdminDraws, AdminCharities, AdminWinners
│   │   │   └── (public pages)   # HomePage, CharitiesPage, DrawsPage, HowItWorksPage, LoginPage, SignupPage
│   │   └── styles/              # global.css
│   ├── .env.example             # ← copy to .env and fill in
│   ├── package.json
│   ├── tailwind.config.js
│   └── vercel.json
└── backend/
    ├── sql/
    │   ├── 01_schema.sql        # All tables, triggers, RLS
    │   ├── 02_seed.sql          # 8 charities + sample draws
    │   └── 03_storage.sql       # Supabase Storage buckets + policies
    └── functions/
        ├── create-checkout-session/index.ts   # Stripe checkout
        └── stripe-webhook/index.ts            # Stripe webhook handler
```

---

## Step 1 — Supabase Setup

### 1.1 Create a new Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name (e.g. `parscore`), set a strong database password, choose region closest to your users
3. Wait ~2 minutes for the project to provision

### 1.2 Run the SQL schema
In Supabase Dashboard → **SQL Editor**:
1. Paste the contents of `backend/sql/01_schema.sql` → Run
2. Paste the contents of `backend/sql/02_seed.sql` → Run
3. Paste the contents of `backend/sql/03_storage.sql` → Run

### 1.3 Get your API keys
Dashboard → **Settings → API**:
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`
- Copy **service_role** key (keep secret!) → used for Edge Functions

### 1.4 Create an admin user
1. Sign up via the app at `/signup`
2. In Supabase → SQL Editor, run:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

---

## Step 2 — Stripe Setup

### 2.1 Create a Stripe account
Go to [stripe.com](https://stripe.com) → Dashboard

### 2.2 Create products & prices
**Dashboard → Products → Add Product**:

**Product 1: Monthly Subscription**
- Name: ParScore Monthly
- Pricing: £9.99 recurring / month
- Copy the **Price ID** → `VITE_STRIPE_PRICE_MONTHLY`

**Product 2: Yearly Subscription**
- Name: ParScore Yearly
- Pricing: £99.99 recurring / year
- Copy the **Price ID** → `VITE_STRIPE_PRICE_YEARLY`

### 2.3 Get API keys
Dashboard → **Developers → API Keys**:
- Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
- Secret key → used as `STRIPE_SECRET_KEY` Edge Function secret

### 2.4 Set up webhook
Dashboard → **Developers → Webhooks → Add endpoint**:
- URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
- Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 3 — Deploy Supabase Edge Functions

Install the Supabase CLI:
```bash
npm install -g supabase
supabase login
```

Link to your project:
```bash
supabase link --project-ref your-project-ref
```

Set secrets for Edge Functions:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Copy functions to the right place and deploy:
```bash
# Create functions directory
mkdir -p supabase/functions/create-checkout-session
mkdir -p supabase/functions/stripe-webhook

# Copy from backend/functions/
cp backend/functions/create-checkout-session/index.ts supabase/functions/create-checkout-session/
cp backend/functions/stripe-webhook/index.ts supabase/functions/stripe-webhook/

# Deploy
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## Step 4 — Frontend Setup

### 4.1 Install dependencies
```bash
cd frontend
npm install
```

### 4.2 Configure environment variables
```bash
cp .env.example .env
# Edit .env and fill in all values
```

### 4.3 Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## Step 5 — Deploy to Vercel

### 5.1 Create a new Vercel account
Go to [vercel.com](https://vercel.com) → Sign up with GitHub

### 5.2 Push your code to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Initial ParScore build"
git branch -M main
git remote add origin https://github.com/yourusername/parscore.git
git push -u origin main
```

### 5.3 Import to Vercel
1. Vercel Dashboard → **Add New Project**
2. Import your GitHub repo
3. Set Root Directory to `frontend` (or root if frontend IS root)
4. Framework Preset: **Vite**
5. Add Environment Variables (all from your `.env` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_STRIPE_PRICE_MONTHLY`
   - `VITE_STRIPE_PRICE_YEARLY`
6. Click **Deploy**

---

## Test Credentials

After setup, use these test flows:

### Stripe Test Cards
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | 3D Secure |

Use any future expiry date and any 3-digit CVC.

### Test Flow
1. Sign up at `/signup` → email + password
2. Subscribe at `/subscribe` → choose plan → use test card
3. After redirect back → dashboard loads automatically
4. Add scores at `/dashboard/scores`
5. Admin: promote user via SQL, then visit `/admin`
6. Admin: create draw period → Simulate → Publish

---

## Monthly Draw Operations

1. Admin → **Draws → New Draw Period** (e.g. "May 2026")
2. Select draw logic (Random or Weighted)
3. Click **Simulate** — runs the engine against all active subscriber scores
4. Review drawn numbers and prize pool breakdown
5. Click **Re-run** to try different results (before publishing)
6. Click **Publish** → results go live, users can see them at `/draws`

Winners must upload proof → Admin → **Winners** → Approve/Reject → Mark Paid

---

## Key Business Logic

| Rule | Implementation |
|------|---------------|
| Rolling 5 scores | DB trigger `enforce_rolling_scores` auto-deletes oldest on 6th insert |
| Score range | DB constraint `CHECK (score >= 1 AND score <= 45)` |
| Min charity 10% | DB constraint on `charity_percentage` + UI slider starts at 10 |
| 5-match rollover | `jackpot_rollover` boolean on `draw_periods`, carried to next month |
| Pool split | 40% / 35% / 25% enforced in draw engine |
| RLS | Every table has row-level security — users only see their own data |
| Subscription check | Every dashboard route checks `useAuth().isSubscribed` |
| Stripe webhooks | All subscription state changes sync to `subscriptions` table |

---

## Customisation

| What | Where |
|------|-------|
| Brand name "ParScore" | `Layout.jsx`, `index.html` title |
| Subscription prices | `.env` Stripe price IDs |
| Prize pool splits | `AdminDraws.jsx` `runDrawEngine()` function |
| Charity percentage range | `MyCharityPage.jsx` slider `min`/`max` |
| Color scheme | `tailwind.config.js` → `colors.brand` |
| Fonts | `index.html` Google Fonts + `tailwind.config.js` |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Styling | TailwindCSS 3, custom CSS variables |
| Auth | Supabase Auth (JWT, email/password) |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (winner proofs, charity images) |
| Payments | Stripe Checkout + Subscriptions + Webhooks |
| Backend Functions | Supabase Edge Functions (Deno/TypeScript) |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

Built for Digital Heroes Full-Stack Development Trainee Selection Process.
