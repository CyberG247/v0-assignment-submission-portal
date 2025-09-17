-- Insert sample subjects (only if no subjects exist)
INSERT INTO public.subjects (name, code, description) 
SELECT * FROM (VALUES 
  ('Mathematics', 'MATH101', 'Introduction to Mathematics'),
  ('Computer Science', 'CS101', 'Programming Fundamentals'),
  ('Physics', 'PHYS101', 'General Physics'),
  ('English Literature', 'ENG101', 'Introduction to Literature')
) AS v(name, code, description)
WHERE NOT EXISTS (SELECT 1 FROM public.subjects LIMIT 1);
