-- ============================================================
-- Golf Charity Subscription Platform — Supabase SQL Schema
-- Run this in Supabase SQL Editor (in order)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  handicap INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE public.charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  website_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charity events (e.g. charity golf days)
CREATE TABLE public.charity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  plan_amount NUMERIC(10,2) NOT NULL,  -- e.g. 9.99 or 99.99
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed', 'trialing', 'past_due')),
  charity_id UUID REFERENCES public.charities(id),
  charity_percentage INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOLF SCORES (rolling last 5)
-- ============================================================
CREATE TABLE public.golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),  -- Stableford range
  score_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast retrieval of latest 5 scores per user
CREATE INDEX idx_golf_scores_user_date ON public.golf_scores(user_id, score_date DESC);

-- Function: enforce max 5 scores per user (delete oldest when 6th added)
CREATE OR REPLACE FUNCTION public.enforce_rolling_scores()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
  oldest_id UUID;
BEGIN
  SELECT COUNT(*) INTO score_count FROM public.golf_scores WHERE user_id = NEW.user_id;
  IF score_count >= 5 THEN
    SELECT id INTO oldest_id
    FROM public.golf_scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date ASC, created_at ASC
    LIMIT 1;
    DELETE FROM public.golf_scores WHERE id = oldest_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_rolling_scores_trigger
  BEFORE INSERT ON public.golf_scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rolling_scores();

-- ============================================================
-- DRAW PERIODS
-- ============================================================
CREATE TABLE public.draw_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_label TEXT NOT NULL,           -- e.g. "April 2026"
  period_month INTEGER NOT NULL,        -- 1-12
  period_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_logic TEXT NOT NULL DEFAULT 'random' CHECK (draw_logic IN ('random', 'weighted')),
  drawn_numbers INTEGER[] NOT NULL DEFAULT '{}',  -- 5 numbers drawn
  total_pool NUMERIC(12,2) DEFAULT 0,
  pool_5match NUMERIC(12,2) DEFAULT 0,
  pool_4match NUMERIC(12,2) DEFAULT 0,
  pool_3match NUMERIC(12,2) DEFAULT 0,
  jackpot_carried_forward NUMERIC(12,2) DEFAULT 0,  -- from prev month
  jackpot_rollover BOOLEAN DEFAULT FALSE,             -- did 5-match go unclaimed?
  active_subscriber_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_month, period_year)
);

-- ============================================================
-- DRAW ENTRIES (which users are in each draw)
-- ============================================================
CREATE TABLE public.draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_period_id UUID REFERENCES public.draw_periods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Snapshot of user's 5 scores at draw time
  score_1 INTEGER, score_2 INTEGER, score_3 INTEGER, score_4 INTEGER, score_5 INTEGER,
  match_type TEXT CHECK (match_type IN ('5_match', '4_match', '3_match', 'no_match')),
  matched_count INTEGER DEFAULT 0,
  prize_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_period_id, user_id)
);

-- ============================================================
-- WINNER VERIFICATIONS
-- ============================================================
CREATE TABLE public.winner_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_entry_id UUID REFERENCES public.draw_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  draw_period_id UUID REFERENCES public.draw_periods(id),
  proof_url TEXT,             -- Supabase Storage URL
  proof_filename TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
  payout_date TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHARITY DONATIONS (independent, not subscription-tied)
-- ============================================================
CREATE TABLE public.charity_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES public.charities(id),
  amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRIZE POOL CONTRIBUTIONS (from subscriptions)
-- ============================================================
CREATE TABLE public.prize_pool_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id),
  user_id UUID REFERENCES public.profiles(id),
  draw_period_id UUID REFERENCES public.draw_periods(id),
  pool_contribution NUMERIC(10,2),   -- amount going to prize pool
  charity_contribution NUMERIC(10,2), -- amount going to charity
  period_month INTEGER,
  period_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool_contributions ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Golf scores: own scores only (admins full access)
CREATE POLICY "Users can manage own scores" ON public.golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON public.golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subscriptions: own subscription + admins
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charities: public read, admin write
CREATE POLICY "Anyone can view active charities" ON public.charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage charities" ON public.charities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charity events: public read
CREATE POLICY "Anyone can view charity events" ON public.charity_events FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage charity events" ON public.charity_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draw periods: public read (published), admin write
CREATE POLICY "Anyone can view published draws" ON public.draw_periods FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage draws" ON public.draw_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draw entries: own + admins
CREATE POLICY "Users can view own draw entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all draw entries" ON public.draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Winner verifications: own + admins
CREATE POLICY "Users can manage own verifications" ON public.winner_verifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all verifications" ON public.winner_verifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- ANALYTICS VIEW (for admin dashboard)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'subscriber') AS total_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active') AS active_subscribers,
  (SELECT COALESCE(SUM(plan_amount), 0) FROM public.subscriptions WHERE status = 'active') AS monthly_revenue,
  (SELECT COUNT(*) FROM public.charities WHERE is_active = TRUE) AS active_charities,
  (SELECT COUNT(*) FROM public.draw_periods WHERE status = 'published') AS published_draws,
  (SELECT COUNT(*) FROM public.winner_verifications WHERE status = 'pending') AS pending_verifications,
  (SELECT COALESCE(SUM(prize_amount), 0) FROM public.draw_entries WHERE prize_amount > 0) AS total_prizes_awarded;
