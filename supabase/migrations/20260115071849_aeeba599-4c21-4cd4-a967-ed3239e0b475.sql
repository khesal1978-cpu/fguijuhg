-- Drop the old constraint
ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;

-- Add new constraint with 'game' type included
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY['mining'::text, 'referral'::text, 'bonus'::text, 'withdrawal'::text, 'game'::text, 'task'::text]));

-- Update the spin wheel function to include unlucky outcomes (0 coins)
CREATE OR REPLACE FUNCTION public.play_spin_wheel(spin_cost DECIMAL DEFAULT 5)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL;
  v_random DECIMAL;
  v_reward DECIMAL;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id;
  
  IF v_balance < spin_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct cost
  UPDATE profiles SET balance = balance - spin_cost WHERE id = v_user_id;
  
  -- Generate random number between 0 and 100
  v_random := random() * 100;
  
  -- Determine reward based on probabilities:
  -- Unlucky (0): 15% (split across 3 unlucky segments)
  -- 10 coins: 55% (remaining after unlucky)
  -- 20 coins: 20%
  -- 50 coins: 7%
  -- 100 coins: 2%
  -- 500 coins: 1%
  IF v_random < 15 THEN
    v_reward := 0;  -- Unlucky!
  ELSIF v_random < 70 THEN
    v_reward := 10;
  ELSIF v_random < 90 THEN
    v_reward := 20;
  ELSIF v_random < 97 THEN
    v_reward := 50;
  ELSIF v_random < 99 THEN
    v_reward := 100;
  ELSE
    v_reward := 500;
  END IF;
  
  -- Add reward to balance (if any)
  IF v_reward > 0 THEN
    UPDATE profiles SET balance = balance + v_reward WHERE id = v_user_id;
  END IF;
  
  -- Record the game play
  INSERT INTO game_plays (user_id, game_type, cost, reward)
  VALUES (v_user_id, 'spin', spin_cost, v_reward);
  
  -- Update games played task
  UPDATE daily_tasks 
  SET progress = progress + 1,
      is_completed = CASE WHEN progress + 1 >= target THEN true ELSE false END,
      last_updated = CURRENT_DATE
  WHERE user_id = v_user_id 
    AND task_type = 'play_games' 
    AND is_claimed = false;
  
  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'game', v_reward - spin_cost, 
    CASE WHEN v_reward = 0 THEN 'Spin Wheel: Unlucky!' 
    ELSE 'Spin Wheel: Won ' || v_reward || ' coins' END);
  
  RETURN json_build_object('success', true, 'reward', v_reward, 'net', v_reward - spin_cost);
END;
$$;

-- Update the scratch card function
CREATE OR REPLACE FUNCTION public.play_scratch_card(scratch_cost DECIMAL DEFAULT 3)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL;
  v_random DECIMAL;
  v_reward DECIMAL;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id;
  
  IF v_balance < scratch_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct cost
  UPDATE profiles SET balance = balance - scratch_cost WHERE id = v_user_id;
  
  -- Generate random number between 0 and 100
  v_random := random() * 100;
  
  -- Determine reward based on probabilities:
  -- 5 coins: 70% (0-70)
  -- 10 coins: 20% (70-90)
  -- 30 coins: 10% (90-100)
  IF v_random < 70 THEN
    v_reward := 5;
  ELSIF v_random < 90 THEN
    v_reward := 10;
  ELSE
    v_reward := 30;
  END IF;
  
  -- Add reward to balance
  UPDATE profiles SET balance = balance + v_reward WHERE id = v_user_id;
  
  -- Record the game play
  INSERT INTO game_plays (user_id, game_type, cost, reward)
  VALUES (v_user_id, 'scratch', scratch_cost, v_reward);
  
  -- Update games played task
  UPDATE daily_tasks 
  SET progress = progress + 1,
      is_completed = CASE WHEN progress + 1 >= target THEN true ELSE false END,
      last_updated = CURRENT_DATE
  WHERE user_id = v_user_id 
    AND task_type = 'play_games' 
    AND is_claimed = false;
  
  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'game', v_reward - scratch_cost, 'Scratch Card: Won ' || v_reward || ' coins');
  
  RETURN json_build_object('success', true, 'reward', v_reward, 'net', v_reward - scratch_cost);
END;
$$;

-- Update the claim task reward function
CREATE OR REPLACE FUNCTION public.claim_task_reward(task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get task
  SELECT * INTO v_task FROM daily_tasks 
  WHERE id = task_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  IF NOT v_task.is_completed THEN
    RETURN json_build_object('success', false, 'error', 'Task not completed');
  END IF;
  
  IF v_task.is_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed');
  END IF;
  
  -- Mark as claimed
  UPDATE daily_tasks SET is_claimed = true WHERE id = task_id;
  
  -- Add reward to balance
  UPDATE profiles SET balance = balance + v_task.reward WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'task', v_task.reward, 'Task Reward: ' || v_task.task_type);
  
  RETURN json_build_object('success', true, 'reward', v_task.reward);
END;
$$;