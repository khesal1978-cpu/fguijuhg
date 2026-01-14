-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT UPPER(CONCAT('PING-', SUBSTRING(gen_random_uuid()::text, 1, 4))),
  referred_by UUID REFERENCES public.profiles(id),
  balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
  total_mined DECIMAL(18, 2) NOT NULL DEFAULT 0,
  mining_rate DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  mining_power INTEGER NOT NULL DEFAULT 50,
  level INTEGER NOT NULL DEFAULT 1,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mining_sessions table for tracking mining cycles
CREATE TABLE public.mining_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  earned_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table for wallet history
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mining', 'referral', 'bonus', 'withdrawal')),
  amount DECIMAL(18, 2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referrals table for tracking referral relationships
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_earned DECIMAL(18, 2) NOT NULL DEFAULT 50.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);

-- Mining sessions policies
CREATE POLICY "Users can view their own mining sessions"
  ON public.mining_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mining sessions"
  ON public.mining_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mining sessions"
  ON public.mining_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_profile_id UUID;
BEGIN
  -- Check if user signed up with a referral code in metadata
  ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- Find referrer if code exists
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT id INTO referrer_profile_id FROM public.profiles WHERE referral_code = ref_code;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, display_name, referred_by, balance)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Miner'),
    referrer_profile_id,
    CASE WHEN referrer_profile_id IS NOT NULL THEN 500 ELSE 0 END
  );
  
  -- Create referral record if referred
  IF referrer_profile_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned)
    VALUES (referrer_profile_id, NEW.id, 50);
    
    -- Add bonus to referrer
    UPDATE public.profiles 
    SET balance = balance + 50 
    WHERE id = referrer_profile_id;
    
    -- Create transaction for referrer
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (referrer_profile_id, 'referral', 50, 'Referral bonus for new member');
    
    -- Create transaction for new user
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'bonus', 500, 'Welcome bonus from referral');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to claim mining rewards
CREATE OR REPLACE FUNCTION public.claim_mining_reward(session_id UUID)
RETURNS JSONB AS $$
DECLARE
  session_record RECORD;
  reward_amount DECIMAL(18, 2);
BEGIN
  -- Get the session
  SELECT * INTO session_record 
  FROM public.mining_sessions 
  WHERE id = session_id AND user_id = auth.uid() AND is_claimed = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found or already claimed');
  END IF;
  
  -- Check if session has ended
  IF session_record.ends_at > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mining session not yet complete');
  END IF;
  
  reward_amount := session_record.earned_amount;
  
  -- Mark session as claimed
  UPDATE public.mining_sessions 
  SET is_claimed = true, is_active = false 
  WHERE id = session_id;
  
  -- Update user balance
  UPDATE public.profiles 
  SET 
    balance = balance + reward_amount,
    total_mined = total_mined + reward_amount,
    updated_at = now()
  WHERE id = auth.uid();
  
  -- Create transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (auth.uid(), 'mining', reward_amount, 'Mining cycle completed');
  
  RETURN jsonb_build_object('success', true, 'amount', reward_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to start a mining session
CREATE OR REPLACE FUNCTION public.start_mining_session()
RETURNS JSONB AS $$
DECLARE
  user_profile RECORD;
  new_session_id UUID;
  session_duration INTERVAL := '6 hours';
  earned DECIMAL(18, 2);
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Check for active session
  IF EXISTS (SELECT 1 FROM public.mining_sessions WHERE user_id = auth.uid() AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already have an active mining session');
  END IF;
  
  -- Calculate earnings (mining_rate * 6 hours)
  earned := user_profile.mining_rate * 6;
  
  -- Create new session
  INSERT INTO public.mining_sessions (user_id, ends_at, earned_amount)
  VALUES (auth.uid(), now() + session_duration, earned)
  RETURNING id INTO new_session_id;
  
  RETURN jsonb_build_object('success', true, 'session_id', new_session_id, 'ends_at', now() + session_duration);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(time_period TEXT DEFAULT 'all')
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  total_mined DECIMAL,
  level INTEGER,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY p.total_mined DESC) as rank,
    p.id as user_id,
    p.display_name,
    p.total_mined,
    p.level,
    p.is_premium
  FROM public.profiles p
  ORDER BY p.total_mined DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for profiles and mining_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mining_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;