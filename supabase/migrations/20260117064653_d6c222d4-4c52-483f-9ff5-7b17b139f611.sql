-- Create function to check and reset daily tasks, then track login
CREATE OR REPLACE FUNCTION public.track_daily_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_today date := CURRENT_DATE;
  v_task_record record;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- First, reset all stale tasks (tasks from previous days)
  UPDATE daily_tasks
  SET 
    progress = 0,
    is_completed = false,
    is_claimed = false,
    last_updated = v_today
  WHERE user_id = v_user_id
    AND last_updated < v_today;

  -- Now check and update daily_login task
  SELECT * INTO v_task_record
  FROM daily_tasks
  WHERE user_id = v_user_id
    AND task_type = 'daily_login'
    AND last_updated = v_today
  FOR UPDATE;

  IF v_task_record IS NULL THEN
    -- No task found for today - this shouldn't happen if reset worked, but handle it
    RETURN jsonb_build_object('success', false, 'error', 'No daily login task found');
  END IF;

  -- If already completed today, just return success
  IF v_task_record.is_completed THEN
    RETURN jsonb_build_object(
      'success', true, 
      'already_completed', true,
      'message', 'Already logged in today'
    );
  END IF;

  -- Mark daily login as completed
  UPDATE daily_tasks
  SET 
    progress = target,
    is_completed = true
  WHERE id = v_task_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'message', 'Daily login tracked'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.track_daily_login() TO authenticated;