-- ============================================================
-- SEED DATA — Golf Charity Subscription Platform
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CHARITIES (8 sample charities)
-- ============================================================
INSERT INTO public.charities (name, slug, description, long_description, category, is_featured, is_active, total_raised, image_url) VALUES
(
  'Golf Foundation',
  'golf-foundation',
  'Growing the game of golf and transforming young lives through sport.',
  'The Golf Foundation is the national charity dedicated to growing golf among young people. We help children and young people to discover golf and develop through the game, transforming lives through sport.',
  'Youth & Sport',
  TRUE, TRUE, 48500.00,
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600'
),
(
  'Prostate Cancer UK',
  'prostate-cancer-uk',
  'Funding vital research and support for men with prostate cancer.',
  'Prostate Cancer UK fights to help more men survive prostate cancer and enjoy a better quality of life. We support men and their families, fund research, and campaign for better care.',
  'Health',
  TRUE, TRUE, 72300.00,
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600'
),
(
  'Macmillan Cancer Support',
  'macmillan-cancer-support',
  'Providing specialist health care, information and financial support to cancer patients.',
  'Macmillan Cancer Support improves the lives of people affected by cancer. We provide support for people going through cancer treatment and living with cancer.',
  'Health',
  FALSE, TRUE, 95100.00,
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600'
),
(
  'Walking With The Wounded',
  'walking-with-the-wounded',
  'Supporting wounded, injured and sick veterans back into employment.',
  'Walking With The Wounded supports those wounded, injured and sick as a result of their service, helping them reintegrate into civilian life through employment support and mental health programmes.',
  'Veterans',
  FALSE, TRUE, 31200.00,
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600'
),
(
  'Greenspace Scotland',
  'greenspace-scotland',
  'Creating and protecting green spaces for communities and wildlife.',
  'Greenspace Scotland works to ensure that everyone in Scotland has access to high-quality greenspaces. We connect people with nature and support local communities to transform urban spaces.',
  'Environment',
  FALSE, TRUE, 18700.00,
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600'
),
(
  'Mental Health Foundation',
  'mental-health-foundation',
  'Preventing mental health problems and tackling the inequality they cause.',
  'The Mental Health Foundation works to prevent mental health problems. We help people understand, protect and sustain their mental health. We are committed to reaching those least likely to access mental health support.',
  'Mental Health',
  TRUE, TRUE, 56800.00,
  'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600'
),
(
  'Action for Children',
  'action-for-children',
  'Supporting and protecting the UK''s most vulnerable and neglected children.',
  'Action for Children supports and speaks out for the UK''s most vulnerable and neglected children and young people. We provide hands-on services, advocate for better policy and help families through difficult times.',
  'Children & Families',
  FALSE, TRUE, 42100.00,
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600'
),
(
  'Alzheimer''s Research UK',
  'alzheimers-research-uk',
  'Pioneering dementia research to bring about life-changing treatments.',
  'Alzheimer''s Research UK is the UK''s leading dementia research charity. Our mission is to bring about life-changing treatments and preventions for people with Alzheimer''s and other forms of dementia.',
  'Health',
  FALSE, TRUE, 63400.00,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600'
);

-- ============================================================
-- CHARITY EVENTS
-- ============================================================
INSERT INTO public.charity_events (charity_id, title, description, event_date, location) VALUES
(
  (SELECT id FROM public.charities WHERE slug = 'golf-foundation'),
  'Junior Golf Day 2026',
  'A fun-filled day of junior golf with coaching, competitions and prizes for ages 8-16.',
  '2026-06-14',
  'Royal St. George''s Golf Club, Kent'
),
(
  (SELECT id FROM public.charities WHERE slug = 'prostate-cancer-uk'),
  'Golf for Men United 2026',
  'Annual charity golf event raising funds for prostate cancer research. All abilities welcome.',
  '2026-07-19',
  'Wentworth Club, Surrey'
),
(
  (SELECT id FROM public.charities WHERE slug = 'mental-health-foundation'),
  'Mind on the Fairway',
  'A unique charity golf day combining golf with mental wellness workshops and talks.',
  '2026-08-02',
  'Sunningdale Golf Club, Berkshire'
),
(
  (SELECT id FROM public.charities WHERE slug = 'walking-with-the-wounded'),
  'Veterans Golf Classic',
  'Annual golf day celebrating our veterans with a 4-ball competition and gala dinner.',
  '2026-09-13',
  'The Belfry, Warwickshire'
);

-- ============================================================
-- DRAW PERIODS (sample historical draws)
-- ============================================================
INSERT INTO public.draw_periods (period_label, period_month, period_year, status, draw_logic, drawn_numbers, total_pool, pool_5match, pool_4match, pool_3match, active_subscriber_count, jackpot_rollover, published_at) VALUES
(
  'January 2026', 1, 2026, 'published', 'random',
  ARRAY[12, 24, 31, 8, 19],
  1250.00, 500.00, 437.50, 312.50, 48,
  FALSE, '2026-01-31 20:00:00+00'
),
(
  'February 2026', 2, 2026, 'published', 'weighted',
  ARRAY[7, 18, 25, 33, 11],
  1400.00, 560.00, 490.00, 350.00, 54,
  TRUE, '2026-02-28 20:00:00+00'
),
(
  'March 2026', 3, 2026, 'pending', 'random',
  ARRAY[]::INTEGER[],
  0, 0, 0, 0, 61,
  FALSE, NULL
);

-- NOTE: Admin and test user accounts must be created via Supabase Auth UI
-- or via the application signup flow, then manually update role to 'admin':
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
