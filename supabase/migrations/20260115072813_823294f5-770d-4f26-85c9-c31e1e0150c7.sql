-- Update play_spin_wheel with correct probabilities: 10 at 70%, 20 at 20%, 50 at 7%, 100 at 2%, 500 at 1%
CREATE OR REPLACE FUNCTION public.play_spin_wheel(spin_cost numeric DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_balance numeric;
    user_id uuid;
    reward_amount numeric;
    random_num numeric;
    net_result numeric;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT balance INTO user_balance FROM profiles WHERE id = user_id;

    IF user_balance < spin_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct cost first
    UPDATE profiles SET balance = balance - spin_cost WHERE id = user_id;

    -- Generate reward with exact probabilities: 10 at 70%, 20 at 20%, 50 at 7%, 100 at 2%, 500 at 1%
    random_num := random() * 100;
    
    IF random_num < 70 THEN
        reward_amount := 10;
    ELSIF random_num < 90 THEN
        reward_amount := 20;
    ELSIF random_num < 97 THEN
        reward_amount := 50;
    ELSIF random_num < 99 THEN
        reward_amount := 100;
    ELSE
        reward_amount := 500;
    END IF;

    net_result := reward_amount - spin_cost;

    -- Add reward to balance
    UPDATE profiles SET balance = balance + reward_amount WHERE id = user_id;

    -- Record game play
    INSERT INTO game_plays (user_id, game_type, cost, reward)
    VALUES (user_id, 'spin', spin_cost, reward_amount);

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (user_id, 'game', net_result, 'Spin wheel: won ' || reward_amount || ' coins');

    -- Update daily task progress for games
    UPDATE daily_tasks 
    SET progress = progress + 1, 
        is_completed = CASE WHEN progress + 1 >= target THEN true ELSE is_completed END
    WHERE user_id = user_id 
      AND task_type = 'play_games' 
      AND is_claimed = false
      AND last_updated = CURRENT_DATE;

    RETURN json_build_object('success', true, 'reward', reward_amount, 'net', net_result);
END;
$$;

-- Update play_scratch_card with rewards: 5 at 70%, 10 at 20%, 30 at 10%, max 100
CREATE OR REPLACE FUNCTION public.play_scratch_card(scratch_cost numeric DEFAULT 3)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_balance numeric;
    user_id uuid;
    reward_amount numeric;
    random_num numeric;
    net_result numeric;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT balance INTO user_balance FROM profiles WHERE id = user_id;

    IF user_balance < scratch_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct cost first
    UPDATE profiles SET balance = balance - scratch_cost WHERE id = user_id;

    -- Generate reward: 5 at 70%, 10 at 20%, 30 at 10%
    random_num := random() * 100;
    
    IF random_num < 70 THEN
        reward_amount := 5;
    ELSIF random_num < 90 THEN
        reward_amount := 10;
    ELSE
        reward_amount := 30;
    END IF;

    net_result := reward_amount - scratch_cost;

    -- Add reward to balance
    UPDATE profiles SET balance = balance + reward_amount WHERE id = user_id;

    -- Record game play
    INSERT INTO game_plays (user_id, game_type, cost, reward)
    VALUES (user_id, 'scratch', scratch_cost, reward_amount);

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (user_id, 'game', net_result, 'Scratch card: won ' || reward_amount || ' coins');

    -- Update daily task progress for games
    UPDATE daily_tasks 
    SET progress = progress + 1, 
        is_completed = CASE WHEN progress + 1 >= target THEN true ELSE is_completed END
    WHERE user_id = user_id 
      AND task_type = 'play_games' 
      AND is_claimed = false
      AND last_updated = CURRENT_DATE;

    RETURN json_build_object('success', true, 'reward', reward_amount, 'net', net_result);
END;
$$;

-- Update referral bonus: inviter gets 25, invited gets 50
-- Create/update function to handle referral creation on signup
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Give 25 coins to referrer
    UPDATE profiles SET balance = balance + 25 WHERE id = NEW.referrer_id;
    
    -- Give 50 coins to referred user
    UPDATE profiles SET balance = balance + 50 WHERE id = NEW.referred_id;
    
    -- Update the bonus_earned to 25 (what referrer earned)
    UPDATE referrals SET bonus_earned = 25 WHERE id = NEW.id;
    
    -- Create transaction for referrer
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (NEW.referrer_id, 'referral', 25, 'Referral bonus: new team member joined');
    
    -- Create transaction for referred
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (NEW.referred_id, 'referral', 50, 'Welcome bonus: joined via referral');
    
    RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_referral_created ON referrals;
CREATE TRIGGER on_referral_created
    AFTER INSERT ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION handle_referral_bonus();