-- RevOps dashboard: read pending call tasks via anon key
CREATE POLICY "anon_select_follow_up_tasks" ON public.follow_up_tasks
  FOR SELECT TO anon USING (true);

GRANT SELECT ON public.follow_up_tasks TO anon;
