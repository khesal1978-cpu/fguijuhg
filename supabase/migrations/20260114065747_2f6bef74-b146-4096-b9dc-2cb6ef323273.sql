-- Add games tracking table
CREATE TABLE public.game_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'spin', 'scratch'
  cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
  reward DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own game plays"
ON public.game_plays FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game plays"
ON public.game_plays FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add daily_tasks table
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'daily_login', 'invite_friends', 'play_games'
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  reward DECIMAL(18, 2) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_tasks
CREATE POLICY "Users can view their own tasks"
ON public.daily_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON public.daily_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.daily_tasks FOR UPDATE
USING (auth.uid() = user_id);

-- Update referral bonus from 50 to 25 for referrer in referrals table default
ALTER TABLE public.referrals ALTER COLUMN bonus_earned SET DEFAULT 25.00;

-- Function to play spin wheel
CREATE OR REPLACE FUNCTION public.play_spin_wheel(spin_cost DECIMAL DEFAULT 5)
RETURNS JSON AS $$
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
  -- 10 coins: 70% (0-70)
  -- 20 coins: 20% (70-90)
  -- 50 coins: 7% (90-97)
  -- 100 coins: 2% (97-99)
  -- 500 coins: 1% (99-100)
  IF v_random < 70 THEN
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
  
  -- Add reward to balance
  UPDATE profiles SET balance = balance + v_reward WHERE id = v_user_id;
  
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
  VALUES (v_user_id, 'game', v_reward - spin_cost, 'Spin Wheel: Won ' || v_reward || ' CASET');
  
  RETURN json_build_object('success', true, 'reward', v_reward, 'net', v_reward - spin_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to play scratch card
CREATE OR REPLACE FUNCTION public.play_scratch_card(scratch_cost DECIMAL DEFAULT 3)
RETURNS JSON AS $$
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
  VALUES (v_user_id, 'game', v_reward - scratch_cost, 'Scratch Card: Won ' || v_reward || ' CASET');
  
  RETURN json_build_object('success', true, 'reward', v_reward, 'net', v_reward - scratch_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to claim task reward
CREATE OR REPLACE FUNCTION public.claim_task_reward(task_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_task RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get the task
  SELECT * INTO v_task FROM daily_tasks 
  WHERE id = task_id AND user_id = v_user_id;
  
  IF v_task IS NULL THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user to give 50 coins to invited user and 25 to referrer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id_val UUID;
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := UPPER(CONCAT('PING-', SUBSTRING(gen_random_uuid()::text, 1, 4)));
  
  -- Insert profile
  INSERT INTO public.profiles (id, display_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Miner'),
    new_referral_code
  );
  
  -- Handle referral if code provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO referrer_id_val 
    FROM public.profiles 
    WHERE referral_code = UPPER(NEW.raw_user_meta_data->>'referral_code');
    
    IF referrer_id_val IS NOT NULL THEN
      -- Update the new user's profile with referred_by
      UPDATE public.profiles SET referred_by = referrer_id_val WHERE id = NEW.id;
      
      -- Create referral record with 25 bonus for referrer
      INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned)
      VALUES (referrer_id_val, NEW.id, 25);
      
      -- Give 25 coins to referrer
      UPDATE public.profiles SET balance = balance + 25 WHERE id = referrer_id_val;
      
      -- Give 50 coins to the new user (invited)
      UPDATE public.profiles SET balance = balance + 50 WHERE id = NEW.id;
      
      -- Record transactions for both
      INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES (referrer_id_val, 'referral', 25, 'Referral bonus for inviting a friend');
      
      INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES (NEW.id, 'referral', 50, 'Welcome bonus from referral');
    END IF;
  END IF;
  
  -- Initialize daily tasks for new user
  INSERT INTO public.daily_tasks (user_id, task_type, target, reward)
  VALUES 
    (NEW.id, 'daily_login', 1, 3),
    (NEW.id, 'invite_friends', 10, 50),
    (NEW.id, 'play_games', 50, 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for game_plays
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_plays;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks;