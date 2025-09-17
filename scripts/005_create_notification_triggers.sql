-- Function to create assignment due notifications
CREATE OR REPLACE FUNCTION create_assignment_due_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create notifications for assignments due in 24 hours
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT DISTINCT 
    p.id,
    'Assignment Due Tomorrow',
    'Assignment "' || a.title || '" is due tomorrow at ' || to_char(a.due_date, 'HH24:MI'),
    'assignment_due'
  FROM public.assignments a
  CROSS JOIN public.profiles p
  LEFT JOIN public.submissions s ON s.assignment_id = a.id AND s.student_id = p.id
  WHERE p.role = 'student'
    AND a.status = 'active'
    AND s.id IS NULL -- No submission yet
    AND a.due_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = p.id 
        AND n.type = 'assignment_due' 
        AND n.message LIKE '%' || a.title || '%'
        AND n.created_at > NOW() - INTERVAL '2 days'
    );
END;
$$;

-- Function to automatically create notifications when assignments are created
CREATE OR REPLACE FUNCTION notify_new_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify all students about new assignment
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Assignment Available',
    'New assignment "' || NEW.title || '" has been posted. Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY'),
    'new_assignment'
  FROM public.profiles p
  WHERE p.role = 'student';
  
  RETURN NEW;
END;
$$;

-- Create trigger for new assignments
DROP TRIGGER IF EXISTS on_assignment_created ON public.assignments;
CREATE TRIGGER on_assignment_created
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_assignment();
