-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Students can upload their own submissions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own submissions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view all submissions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);
