-- Update handle_new_user function with new referral amounts
-- Direct: 50, Indirect: 25, Friend (new user): 100

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_id_val UUID;
  indirect_referrer_id UUID;
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
    -- Find direct referrer
    SELECT id, referred_by INTO referrer_id_val, indirect_referrer_id
    FROM public.profiles 
    WHERE referral_code = UPPER(NEW.raw_user_meta_data->>'referral_code');
    
    IF referrer_id_val IS NOT NULL THEN
      -- Update the new user's profile with referred_by
      UPDATE public.profiles SET referred_by = referrer_id_val WHERE id = NEW.id;
      
      -- Create DIRECT referral record (level 1) with 50 bonus
      INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned, level)
      VALUES (referrer_id_val, NEW.id, 50, 1);
      
      -- Give 50 coins to direct referrer
      UPDATE public.profiles SET balance = balance + 50 WHERE id = referrer_id_val;
      
      -- Give 100 coins to the new user (invited friend)
      UPDATE public.profiles SET balance = balance + 100 WHERE id = NEW.id;
      
      -- Record transaction for direct referrer
      INSERT INTO public.transactions (user_id, type, amount, description, metadata)
      VALUES (referrer_id_val, 'referral', 50, 'Direct referral bonus', '{"level": 1}'::jsonb);
      
      -- Record transaction for new user
      INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES (NEW.id, 'referral', 100, 'Welcome bonus from referral');
      
      -- Handle INDIRECT referral (level 2) if direct referrer has a referrer
      IF indirect_referrer_id IS NOT NULL THEN
        -- Create INDIRECT referral record (level 2) with 25 bonus
        INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned, level)
        VALUES (indirect_referrer_id, NEW.id, 25, 2);
        
        -- Give 25 coins to indirect referrer
        UPDATE public.profiles SET balance = balance + 25 WHERE id = indirect_referrer_id;
        
        -- Record transaction for indirect referrer
        INSERT INTO public.transactions (user_id, type, amount, description, metadata)
        VALUES (indirect_referrer_id, 'referral', 25, 'Indirect referral bonus (2nd level)', '{"level": 2}'::jsonb);
      END IF;
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
$function$;

-- Add level column to referrals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'referrals' 
                 AND column_name = 'level') THEN
    ALTER TABLE public.referrals ADD COLUMN level integer NOT NULL DEFAULT 1;
  END IF;
END $$;