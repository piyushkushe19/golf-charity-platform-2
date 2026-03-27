# ⛳ ParScore — Golf Charity Subscription Platform

A full-stack subscription-based web application that combines golf scoring with charity contributions and monthly prize draws.

---

## 🚀 Live Demo

* 🌐 Main Website: [https://golf-charity-platform-2.vercel.app/](https://golf-charity-platform-2.vercel.app/)
* 👤 User Dashboard: [https://golf-charity-platform-2.vercel.app/dashboard](https://golf-charity-platform-2.vercel.app/dashboard)
* 🛠️ Admin Panel: [https://golf-charity-platform-2.vercel.app/admin](https://golf-charity-platform-2.vercel.app/admin)

---

## 📌 Overview

ParScore is a platform where users:

* Subscribe monthly/yearly
* Enter their golf scores
* Allocate a percentage to charity
* Participate in monthly prize draws

Admins can:

* Manage users, charities, and draws
* Run and publish draw results
* Verify and approve winners

---

## ✨ Key Features

### 👤 User Features

* Secure authentication (Signup/Login)
* Subscription system (Stripe integration)
* Add and manage golf scores
* Rolling score system (last 5 scores only)
* Charity contribution selection
* View winnings and draw results

### 🛠️ Admin Features

* Admin dashboard overview
* Manage users and roles
* Create and manage draw periods
* Simulate and publish draw results
* Manage charities
* Verify winners and payouts

---

## 🧠 Core Business Logic

* Only **last 5 scores** are considered (auto-managed via DB trigger)
* Score range: **1–45**
* Minimum **10% charity contribution**
* Prize pool split:

  * 🥇 40%
  * 🥈 35%
  * 🥉 25%
* Jackpot rollover if no winner
* Subscription required to access dashboard

---

## 🏗️ Tech Stack

### Frontend

* React.js (Vite)
* React Router v6
* Tailwind CSS

### Backend

* Supabase (PostgreSQL, Auth, Storage)
* Supabase Edge Functions (Deno/TypeScript)

### Payments

* Stripe (Subscriptions + Webhooks)

### Deployment

* Vercel (Frontend)
* Supabase (Backend & DB)

---


## ⚙️ Setup Instructions

### 1. Clone Repository

```
git clone https://github.com/piyushkushe19/golf-charity-platform-2
cd golf-charity-platform/frontend
```

### 2. Install Dependencies

```
npm install
```

### 3. Environment Variables

Create `.env` file and add:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_MONTHLY=
VITE_STRIPE_PRICE_YEARLY=
```

### 4. Run Locally

```
npm run dev
```

---

## 🧪 Test Flow

1. Sign up a new user
2. Subscribe using Stripe test card: `4242 4242 4242 4242`
3. Access dashboard
4. Add golf scores
5. Admin creates and publishes draw
6. Users view results

---

## 🔐 Admin Access

To make a user admin, run this in Supabase SQL Editor:

```
UPDATE profiles SET role = 'admin' WHERE email = 'your-email';
```

---

## 🚧 Challenges Faced

* Dependency and environment setup issues (npm/Vite)
* GitHub connectivity issues (SSH/DNS errors)
* Stripe integration and webhook configuration
* Supabase profile sync and RLS policies
* Deployment debugging on Vercel

All issues were resolved through debugging, documentation, and iterative testing.

---

## 📈 Future Improvements

* Enhanced UI/UX animations
* Email notifications for draws and winnings
* Advanced analytics dashboard
* Mobile responsiveness improvements

---


## ⭐ Final Note

This project demonstrates full-stack development skills including authentication, payments, database design, role-based access, and deployment.

---
