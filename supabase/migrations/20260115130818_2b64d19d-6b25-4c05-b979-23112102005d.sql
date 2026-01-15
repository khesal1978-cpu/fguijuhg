-- Update play_spin_wheel function with new probabilities
-- Unlucky (0): 35%, 10: 35%, 20: 20%, 50: 7%, 100: 3%, 500: 0%
CREATE OR REPLACE FUNCTION public.play_spin_wheel(spin_cost numeric DEFAULT 5)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_balance numeric;
    v_user_id uuid;
    reward_amount numeric;
    random_num numeric;
    net_result numeric;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT balance INTO user_balance FROM profiles WHERE id = v_user_id;

    IF user_balance < spin_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct cost first
    UPDATE profiles SET balance = balance - spin_cost WHERE id = v_user_id;

    -- Generate reward: Unlucky (0) at 35%, 10 at 35%, 20 at 20%, 50 at 7%, 100 at 3%, 500 at 0%
    random_num := random() * 100;
    
    IF random_num < 35 THEN
        reward_amount := 0;  -- Unlucky
    ELSIF random_num < 70 THEN
        reward_amount := 10;
    ELSIF random_num < 90 THEN
        reward_amount := 20;
    ELSIF random_num < 97 THEN
        reward_amount := 50;
    ELSE
        reward_amount := 100;
    END IF;

    net_result := reward_amount - spin_cost;

    -- Add reward to balance (only if won)
    IF reward_amount > 0 THEN
        UPDATE profiles SET balance = balance + reward_amount WHERE id = v_user_id;
    END IF;

    -- Record game play
    INSERT INTO game_plays (user_id, game_type, cost, reward)
    VALUES (v_user_id, 'spin', spin_cost, reward_amount);

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (v_user_id, 'game', net_result, 
            CASE WHEN reward_amount = 0 THEN 'Spin wheel: unlucky!' 
                 ELSE 'Spin wheel: won ' || reward_amount || ' coins' END);

    -- Update daily task progress for games
    UPDATE daily_tasks 
    SET progress = progress + 1, 
        is_completed = CASE WHEN progress + 1 >= target THEN true ELSE is_completed END
    WHERE user_id = v_user_id 
      AND task_type = 'play_games' 
      AND is_claimed = false
      AND last_updated = CURRENT_DATE;

    RETURN json_build_object('success', true, 'reward', reward_amount, 'net', net_result);
END;
$function$;

-- Update play_scratch_card function with same probabilities
-- Unlucky (0): 35%, 5: 35%, 10: 20%, 30: 7%, 100: 3%
CREATE OR REPLACE FUNCTION public.play_scratch_card(scratch_cost numeric DEFAULT 3)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_balance numeric;
    v_user_id uuid;
    reward_amount numeric;
    random_num numeric;
    net_result numeric;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT balance INTO user_balance FROM profiles WHERE id = v_user_id;

    IF user_balance < scratch_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct cost first
    UPDATE profiles SET balance = balance - scratch_cost WHERE id = v_user_id;

    -- Generate reward: Unlucky (0) at 35%, 5 at 35%, 10 at 20%, 30 at 7%, 100 at 3%
    random_num := random() * 100;
    
    IF random_num < 35 THEN
        reward_amount := 0;  -- Unlucky
    ELSIF random_num < 70 THEN
        reward_amount := 5;
    ELSIF random_num < 90 THEN
        reward_amount := 10;
    ELSIF random_num < 97 THEN
        reward_amount := 30;
    ELSE
        reward_amount := 100;
    END IF;

    net_result := reward_amount - scratch_cost;

    -- Add reward to balance (only if won)
    IF reward_amount > 0 THEN
        UPDATE profiles SET balance = balance + reward_amount WHERE id = v_user_id;
    END IF;

    -- Record game play
    INSERT INTO game_plays (user_id, game_type, cost, reward)
    VALUES (v_user_id, 'scratch', scratch_cost, reward_amount);

    -- Record transaction
    INSERT INTO transactions (user_id, type, amount, description)
    VALUES (v_user_id, 'game', net_result, 
            CASE WHEN reward_amount = 0 THEN 'Scratch card: unlucky!' 
                 ELSE 'Scratch card: won ' || reward_amount || ' coins' END);

    -- Update daily task progress for games
    UPDATE daily_tasks 
    SET progress = progress + 1, 
        is_completed = CASE WHEN progress + 1 >= target THEN true ELSE is_completed END
    WHERE user_id = v_user_id 
      AND task_type = 'play_games' 
      AND is_claimed = false
      AND last_updated = CURRENT_DATE;

    RETURN json_build_object('success', true, 'reward', reward_amount, 'net', net_result);
END;
$function$;