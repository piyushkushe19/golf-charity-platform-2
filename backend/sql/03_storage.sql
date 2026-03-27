-- ============================================================
-- SUPABASE STORAGE SETUP
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Create storage bucket for winner proof uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-proofs',
  'winner-proofs',
  FALSE,  -- private bucket, access via signed URLs
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for charity images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'charity-images',
  'charity-images',
  TRUE,  -- public bucket
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for winner-proofs
CREATE POLICY "Authenticated users can upload their own proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'winner-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'winner-proofs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage policies for charity-images
CREATE POLICY "Anyone can view charity images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'charity-images');

CREATE POLICY "Admins can manage charity images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'charity-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
