import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  onSnapshot,
  Timestamp,
  increment,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDempbrEElfOwm8TRMdxuCeKTfnXAAWBB0",
  authDomain: "wajud-973e0.firebaseapp.com",
  projectId: "wajud-973e0",
  storageBucket: "wajud-973e0.firebasestorage.app",
  messagingSenderId: "683758607731",
  appId: "1:683758607731:web:79fdc2ae2470614b073906",
  measurementId: "G-5BWP0N42BD"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// Auth Functions
export const firebaseSignUp = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};

export const firebaseSignIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const firebaseSignOut = async () => {
  return signOut(firebaseAuth);
};

export const signInWithGoogle = async () => {
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const sendResetEmail = async (email: string) => {
  return sendPasswordResetEmail(firebaseAuth, email);
};

// Link a Unique ID account with Gmail for recovery
export const linkUniqueIdToGmail = async (gmail: string, password: string) => {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  const credential = EmailAuthProvider.credential(gmail, password);
  return linkWithCredential(user, credential);
};

// Find Unique ID by linked Gmail
export const findUniqueIdByEmail = async (gmail: string): Promise<string | null> => {
  const q = query(
    collection(db, 'profiles'),
    where('recovery_email', '==', gmail.toLowerCase())
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const profile = snap.docs[0].data();
    // Extract unique ID from the profile's associated email
    const profileId = snap.docs[0].id;
    // Look up the auth user to get their email (which contains the unique ID)
    return profile.unique_id || null;
  }
  return null;
};

export { onAuthStateChanged };
export type { User };

// Profile Types
export interface Profile {
  id: string;
  display_name: string | null;
  balance: number;
  pending_balance: number;
  total_mined: number;
  mining_rate: number;
  mining_power: number;
  is_premium: boolean;
  referral_code: string;
  referred_by: string | null;
  avatar_url: string | null;
  username: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  unique_id?: string | null;
  recovery_email?: string | null;
  // Burning mechanism fields
  burned_amount: number;
  recovery_streak: number;
  last_mining_at: Timestamp | null;
  total_burned: number;
  total_recovered: number;
}

export interface MiningSession {
  id: string;
  user_id: string;
  started_at: Timestamp;
  ends_at: Timestamp;
  earned_amount: number;
  is_active: boolean;
  is_claimed: boolean;
  created_at: Timestamp;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamp;
}

export interface DailyTask {
  id: string;
  user_id: string;
  task_type: string;
  progress: number;
  target: number;
  reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  last_updated: string;
  created_at: Timestamp;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_earned: number;
  is_active: boolean;
  level: number; // 1 = direct, 2 = indirect
  created_at: Timestamp;
  referred_profile?: {
    display_name: string | null;
    total_mined: number;
    created_at: Timestamp;
  };
}

export interface GamePlay {
  id: string;
  user_id: string;
  game_type: string;
  cost: number;
  reward: number;
  created_at: Timestamp;
}

// Pending bonus for referral system - allows users to claim bonuses on their next login
export interface PendingBonus {
  id: string;
  user_id: string; // The user who will receive this bonus
  amount: number;
  type: 'direct_referral' | 'indirect_referral';
  from_user_id: string; // The new user who triggered this bonus
  is_claimed: boolean;
  created_at: Timestamp;
}

// Generate unique referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PING-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Profile Functions
export const createProfile = async (
  userId: string, 
  displayName: string, 
  referralCode?: string,
  options?: { uniqueId?: string; recoveryEmail?: string }
): Promise<Profile> => {
  const profileRef = doc(db, 'profiles', userId);
  const now = Timestamp.now();
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize profile with all fields including burning mechanism
  const newProfile: Profile = {
    id: userId,
    display_name: displayName || 'Miner',
    balance: 0,
    pending_balance: 0,
    total_mined: 0,
    mining_rate: 10,
    mining_power: 1,
    is_premium: false,
    referral_code: generateReferralCode(),
    referred_by: null,
    avatar_url: null,
    username: null,
    created_at: now,
    updated_at: now,
    unique_id: options?.uniqueId || null,
    recovery_email: options?.recoveryEmail?.toLowerCase() || null,
    // Burning mechanism fields
    burned_amount: 0,
    recovery_streak: 0,
    last_mining_at: null,
    total_burned: 0,
    total_recovered: 0,
  };

  console.log('[PROFILE] Creating profile for user:', userId);
  console.log('[PROFILE] Referral code provided:', referralCode || 'none');

  // Handle referral BEFORE creating profile so we can set initial balance
  let referrerId: string | null = null;
  let indirectReferrerId: string | null = null;
  
  if (referralCode && referralCode.trim()) {
    const normalizedCode = referralCode.trim().toUpperCase();
    console.log('[REFERRAL] Looking for referrer with code:', normalizedCode);
    
    try {
      const referrerQuery = query(collection(db, 'profiles'), where('referral_code', '==', normalizedCode));
      const referrerSnap = await getDocs(referrerQuery);
      
      console.log('[REFERRAL] Query returned', referrerSnap.size, 'results');
      
      if (!referrerSnap.empty) {
        referrerId = referrerSnap.docs[0].id;
        const referrerProfile = referrerSnap.docs[0].data() as Profile;
        indirectReferrerId = referrerProfile.referred_by || null;
        
        console.log('[REFERRAL] Found referrer:', referrerId);
        console.log('[REFERRAL] Referrer code matches:', referrerProfile.referral_code);
        console.log('[REFERRAL] Indirect referrer:', indirectReferrerId || 'none');
        
        // Set welcome bonus and referrer on profile
        newProfile.balance = 100;
        newProfile.referred_by = referrerId;
      } else {
        console.log('[REFERRAL] No profile found with code:', normalizedCode);
      }
    } catch (error) {
      console.error('[REFERRAL] Error finding referrer:', error);
    }
  }

  // Create the user's profile
  try {
    await setDoc(profileRef, newProfile);
    console.log('[PROFILE] Profile created successfully');
  } catch (error) {
    console.error('[PROFILE] Error creating profile:', error);
    throw error;
  }

  // Process referral AFTER profile exists (required for security rules)
  if (referrerId) {
    console.log('[REFERRAL] Processing referral rewards...');
    
    // Step 1: Create direct referral record
    try {
      const directReferralRef = await addDoc(collection(db, 'referrals'), {
        referrer_id: referrerId,
        referred_id: userId,
        bonus_earned: 50,
        is_active: true,
        level: 1,
        created_at: now,
      });
      console.log('[REFERRAL] Created direct referral record:', directReferralRef.id);
    } catch (error) {
      console.error('[REFERRAL] Failed to create direct referral record:', error);
    }
    
    // Step 2: Create pending bonus for direct referrer (50 CASET)
    try {
      const pendingBonusRef = await addDoc(collection(db, 'pending_bonuses'), {
        user_id: referrerId,
        amount: 50,
        type: 'direct_referral',
        from_user_id: userId,
        from_user_name: displayName || 'New User',
        is_claimed: false,
        created_at: now,
      });
      console.log('[REFERRAL] Created pending bonus for referrer:', pendingBonusRef.id);
    } catch (error) {
      console.error('[REFERRAL] Failed to create pending bonus for referrer:', error);
    }
    
    // Step 3: Create welcome bonus transaction for new user
    try {
      await addDoc(collection(db, 'transactions'), {
        user_id: userId,
        type: 'referral',
        amount: 100,
        description: 'Welcome bonus from referral',
        metadata: { referrer_id: referrerId },
        created_at: now,
      });
      console.log('[REFERRAL] Created welcome bonus transaction');
    } catch (error) {
      console.error('[REFERRAL] Failed to create welcome transaction:', error);
    }
    
    // Step 4: Handle indirect referral
    if (indirectReferrerId) {
      try {
        await addDoc(collection(db, 'referrals'), {
          referrer_id: indirectReferrerId,
          referred_id: userId,
          bonus_earned: 25,
          is_active: true,
          level: 2,
          created_at: now,
        });
        console.log('[REFERRAL] Created indirect referral record');
      } catch (error) {
        console.error('[REFERRAL] Failed to create indirect referral:', error);
      }
      
      try {
        await addDoc(collection(db, 'pending_bonuses'), {
          user_id: indirectReferrerId,
          amount: 25,
          type: 'indirect_referral',
          from_user_id: userId,
          from_user_name: displayName || 'New User',
          is_claimed: false,
          created_at: now,
        });
        console.log('[REFERRAL] Created pending bonus for indirect referrer');
      } catch (error) {
        console.error('[REFERRAL] Failed to create indirect pending bonus:', error);
      }
    }
    
    console.log('[REFERRAL] Referral processing complete!');
  }

  // Initialize daily tasks
  const tasksData = [
    { task_type: 'daily_login', target: 1, reward: 3 },
    { task_type: 'invite_friends', target: 10, reward: 50 },
    { task_type: 'play_games', target: 50, reward: 100 },
  ];

  try {
    for (const task of tasksData) {
      await addDoc(collection(db, 'daily_tasks'), {
        user_id: userId,
        task_type: task.task_type,
        progress: 0,
        target: task.target,
        reward: task.reward,
        is_completed: false,
        is_claimed: false,
        last_updated: today,
        created_at: now,
      });
    }
  } catch (taskError) {
    console.error('Daily tasks initialization error:', taskError);
  }

  return newProfile;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const profileRef = doc(db, 'profiles', userId);
  const profileSnap = await getDoc(profileRef);
  
  if (profileSnap.exists()) {
    return { id: profileSnap.id, ...profileSnap.data() } as Profile;
  }
  return null;
};

export const subscribeToProfile = (userId: string, callback: (profile: Profile | null) => void) => {
  const profileRef = doc(db, 'profiles', userId);
  return onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Profile);
    } else {
      callback(null);
    }
  });
};

// Mining Functions
export const getActiveSession = async (userId: string): Promise<MiningSession | null> => {
  try {
    // Simplified query - filter client-side to avoid composite index
    const q = query(
      collection(db, 'mining_sessions'),
      where('user_id', '==', userId)
    );
    
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    // Filter and sort client-side
    const sessions = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as MiningSession))
      .filter(s => s.is_active && !s.is_claimed)
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    
    return sessions[0] || null;
  } catch (error) {
    console.error('Error fetching active session:', error);
    return null;
  }
};

export const subscribeToMiningSession = (userId: string, callback: (session: MiningSession | null) => void) => {
  // Simplified query - filter client-side to avoid composite index requirement
  const q = query(
    collection(db, 'mining_sessions'),
    where('user_id', '==', userId)
  );
  
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    
    // Filter and sort client-side
    const sessions = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as MiningSession))
      .filter(s => s.is_active && !s.is_claimed)
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    
    callback(sessions[0] || null);
  });
};

// Helper to count active referrals (users who mined in last 48 hours)
const getActiveReferralCount = async (userId: string): Promise<number> => {
  try {
    const referralQuery = query(
      collection(db, 'referrals'),
      where('referrer_id', '==', userId),
      where('is_active', '==', true)
    );
    const referralSnap = await getDocs(referralQuery);
    return referralSnap.size;
  } catch (error) {
    console.error('Error counting referrals:', error);
    return 0;
  }
};

// Calculate mining multiplier based on active referrals
const getMiningMultiplier = (activeReferrals: number): number => {
  if (activeReferrals >= 11) return 2.5;
  if (activeReferrals >= 6) return 2.0;
  if (activeReferrals >= 3) return 1.7;
  if (activeReferrals >= 1) return 1.2;
  return 1.0;
};

// Check today's session count
const getTodaySessionCount = async (userId: string): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const q = query(
      collection(db, 'mining_sessions'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    
    // Filter client-side for today's sessions
    const todaySessions = snap.docs.filter(doc => {
      const data = doc.data();
      return data.created_at.toMillis() >= todayTimestamp.toMillis();
    });
    
    return todaySessions.length;
  } catch (error) {
    console.error('Error counting sessions:', error);
    return 0;
  }
};

// Burning mechanism constants
const BURN_INACTIVITY_HOURS = 48; // Hours of inactivity before burn
const BURN_PERCENTAGE = 0.10; // 10% of balance burned
const RECOVERY_SESSIONS = 4; // Sessions needed for recovery
const RECOVERY_PERCENTAGE = 0.25; // 25% of burned amount recovered per milestone

// Check and apply burn if inactive
const checkAndApplyBurn = async (userId: string, profile: Profile): Promise<{ burned: boolean; amount: number }> => {
  const lastMiningAt = profile.last_mining_at;
  if (!lastMiningAt) {
    // First time miner, no burn
    return { burned: false, amount: 0 };
  }

  const lastMiningDate = lastMiningAt.toDate();
  const hoursSinceLastMining = (Date.now() - lastMiningDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastMining < BURN_INACTIVITY_HOURS) {
    // Not inactive long enough
    return { burned: false, amount: 0 };
  }

  // Calculate burn amount (10% of current balance)
  const burnAmount = Math.floor((profile.balance || 0) * BURN_PERCENTAGE * 100) / 100;
  
  if (burnAmount <= 0) {
    return { burned: false, amount: 0 };
  }

  // Apply burn
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    balance: increment(-burnAmount),
    burned_amount: increment(burnAmount),
    total_burned: increment(burnAmount),
    recovery_streak: 0, // Reset streak on burn
    updated_at: Timestamp.now(),
  });

  // Create burn transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'burn',
    amount: -burnAmount,
    description: 'Inactivity penalty: tokens burned',
    metadata: { hours_inactive: Math.floor(hoursSinceLastMining) },
    created_at: Timestamp.now(),
  });

  return { burned: true, amount: burnAmount };
};

// Check and apply recovery after mining
const checkAndApplyRecovery = async (userId: string, profile: Profile): Promise<{ recovered: boolean; amount: number }> => {
  const burnedAmount = profile.burned_amount || 0;
  const newStreak = (profile.recovery_streak || 0) + 1;

  if (burnedAmount <= 0) {
    // Nothing to recover, just update streak
    await updateDoc(doc(db, 'profiles', userId), {
      recovery_streak: newStreak,
      last_mining_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { recovered: false, amount: 0 };
  }

  // Check if hit recovery milestone (every 4 sessions)
  if (newStreak % RECOVERY_SESSIONS !== 0) {
    // Not at milestone yet
    await updateDoc(doc(db, 'profiles', userId), {
      recovery_streak: newStreak,
      last_mining_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    return { recovered: false, amount: 0 };
  }

  // Calculate recovery (25% of burned amount)
  const recoveryAmount = Math.floor(burnedAmount * RECOVERY_PERCENTAGE * 100) / 100;

  // Apply recovery
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    balance: increment(recoveryAmount),
    burned_amount: increment(-recoveryAmount),
    total_recovered: increment(recoveryAmount),
    recovery_streak: newStreak,
    last_mining_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Create recovery transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'recovery',
    amount: recoveryAmount,
    description: `Token recovery: ${newStreak} session streak`,
    metadata: { streak: newStreak },
    created_at: Timestamp.now(),
  });

  return { recovered: true, amount: recoveryAmount };
};

export const startMiningSession = async (userId: string): Promise<{ success: boolean; error?: string; session_id?: string; burned?: number }> => {
  // Check for existing active session
  const existing = await getActiveSession(userId);
  if (existing) {
    return { success: false, error: 'Already have an active mining session' };
  }

  // Check daily session limit (max 4 per day)
  const todayCount = await getTodaySessionCount(userId);
  if (todayCount >= 4) {
    return { success: false, error: 'Daily mining limit reached (4 sessions/day)' };
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }

  // Check and apply burn if inactive
  const burnResult = await checkAndApplyBurn(userId, profile);

  // Calculate reward with referral multiplier
  const activeReferrals = await getActiveReferralCount(userId);
  const multiplier = getMiningMultiplier(activeReferrals);
  const baseReward = 10; // Base 10 CASET per 6-hour session
  const earnedAmount = Math.floor(baseReward * multiplier);

  const now = Timestamp.now();
  const endsAt = Timestamp.fromDate(new Date(Date.now() + 6 * 60 * 60 * 1000)); // 6 hours

  const sessionRef = await addDoc(collection(db, 'mining_sessions'), {
    user_id: userId,
    started_at: now,
    ends_at: endsAt,
    earned_amount: earnedAmount,
    is_active: true,
    is_claimed: false,
    created_at: now,
  });

  // Update last_mining_at
  await updateDoc(doc(db, 'profiles', userId), {
    last_mining_at: now,
    updated_at: now,
  });

  return { success: true, session_id: sessionRef.id, burned: burnResult.amount };
};

export const claimMiningReward = async (userId: string, sessionId: string): Promise<{ success: boolean; error?: string; amount?: number; recovered?: number }> => {
  const sessionRef = doc(db, 'mining_sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    return { success: false, error: 'Session not found' };
  }

  const session = sessionSnap.data() as MiningSession;
  
  if (session.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (session.is_claimed) {
    return { success: false, error: 'Already claimed' };
  }

  const now = new Date();
  const endsAt = session.ends_at.toDate();
  
  if (now < endsAt) {
    return { success: false, error: 'Mining session not yet complete' };
  }

  const batch = writeBatch(db);
  
  // Mark session as claimed
  batch.update(sessionRef, {
    is_claimed: true,
    is_active: false,
  });

  // Update profile balance
  const profileRef = doc(db, 'profiles', userId);
  batch.update(profileRef, {
    balance: increment(session.earned_amount),
    total_mined: increment(session.earned_amount),
    updated_at: Timestamp.now(),
  });

  await batch.commit();

  // Create transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'mining',
    amount: session.earned_amount,
    description: 'Mining cycle completed',
    metadata: null,
    created_at: Timestamp.now(),
  });

  // Mark referrer as active if this user was referred
  const profile = await getProfile(userId);
  if (profile?.referred_by) {
    const referralQuery = query(
      collection(db, 'referrals'),
      where('referred_id', '==', userId),
      where('is_active', '==', false)
    );
    const referralSnap = await getDocs(referralQuery);
    if (!referralSnap.empty) {
      await updateDoc(doc(db, 'referrals', referralSnap.docs[0].id), {
        is_active: true,
      });
    }
  }

  // Check and apply recovery after claiming
  let recoveryResult = { recovered: false, amount: 0 };
  if (profile) {
    recoveryResult = await checkAndApplyRecovery(userId, profile);
  }

  return { success: true, amount: session.earned_amount, recovered: recoveryResult.amount };
};

// Transaction Functions
export const getTransactions = async (userId: string, limitCount = 10): Promise<Transaction[]> => {
  // Simplified query - sort client-side to avoid composite index
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId)
  );
  
  const snap = await getDocs(q);
  const transactions = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
    .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
    .slice(0, limitCount);
  return transactions;
};

export const subscribeToTransactions = (userId: string, limitCount: number, callback: (transactions: Transaction[]) => void) => {
  // Simplified query - sort client-side
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId)
  );
  
  return onSnapshot(q, (snap) => {
    const transactions = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
      .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis())
      .slice(0, limitCount);
    callback(transactions);
  });
};

// Game Functions
export const playSpinWheel = async (userId: string, spinCost = 5): Promise<{ success: boolean; reward?: number; net?: number; error?: string }> => {
  const profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Not authenticated' };
  }

  if (profile.balance < spinCost) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Generate reward based on probabilities
  const random = Math.random() * 100;
  let rewardAmount: number;
  
  if (random < 35) {
    rewardAmount = 0; // Unlucky
  } else if (random < 70) {
    rewardAmount = 10;
  } else if (random < 90) {
    rewardAmount = 20;
  } else if (random < 97) {
    rewardAmount = 50;
  } else {
    rewardAmount = 100;
  }

  const netResult = rewardAmount - spinCost;
  const now = Timestamp.now();
  const today = new Date().toISOString().split('T')[0];

  // Update balance
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    balance: increment(netResult),
    updated_at: now,
  });

  // Record game play
  await addDoc(collection(db, 'game_plays'), {
    user_id: userId,
    game_type: 'spin',
    cost: spinCost,
    reward: rewardAmount,
    created_at: now,
  });

  // Record transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'game',
    amount: netResult,
    description: rewardAmount === 0 ? 'Spin wheel: unlucky!' : `Spin wheel: won ${rewardAmount} coins`,
    metadata: null,
    created_at: now,
  });

  // Update daily task progress
  const taskQuery = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId),
    where('task_type', '==', 'play_games'),
    where('is_claimed', '==', false),
    where('last_updated', '==', today)
  );
  const taskSnap = await getDocs(taskQuery);
  if (!taskSnap.empty) {
    const taskDoc = taskSnap.docs[0];
    const task = taskDoc.data() as DailyTask;
    const newProgress = task.progress + 1;
    await updateDoc(doc(db, 'daily_tasks', taskDoc.id), {
      progress: newProgress,
      is_completed: newProgress >= task.target,
    });
  }

  return { success: true, reward: rewardAmount, net: netResult };
};

export const playScratchCard = async (userId: string, scratchCost = 3): Promise<{ success: boolean; reward?: number; net?: number; error?: string }> => {
  const profile = await getProfile(userId);
  if (!profile) {
    return { success: false, error: 'Not authenticated' };
  }

  if (profile.balance < scratchCost) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Generate reward based on probabilities
  const random = Math.random() * 100;
  let rewardAmount: number;
  
  if (random < 35) {
    rewardAmount = 0; // Unlucky
  } else if (random < 70) {
    rewardAmount = 5;
  } else if (random < 90) {
    rewardAmount = 10;
  } else if (random < 97) {
    rewardAmount = 30;
  } else {
    rewardAmount = 100;
  }

  const netResult = rewardAmount - scratchCost;
  const now = Timestamp.now();
  const today = new Date().toISOString().split('T')[0];

  // Update balance
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    balance: increment(netResult),
    updated_at: now,
  });

  // Record game play
  await addDoc(collection(db, 'game_plays'), {
    user_id: userId,
    game_type: 'scratch',
    cost: scratchCost,
    reward: rewardAmount,
    created_at: now,
  });

  // Record transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'game',
    amount: netResult,
    description: rewardAmount === 0 ? 'Scratch card: unlucky!' : `Scratch card: won ${rewardAmount} coins`,
    metadata: null,
    created_at: now,
  });

  // Update daily task progress
  const taskQuery = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId),
    where('task_type', '==', 'play_games'),
    where('is_claimed', '==', false),
    where('last_updated', '==', today)
  );
  const taskSnap = await getDocs(taskQuery);
  if (!taskSnap.empty) {
    const taskDoc = taskSnap.docs[0];
    const task = taskDoc.data() as DailyTask;
    const newProgress = task.progress + 1;
    await updateDoc(doc(db, 'daily_tasks', taskDoc.id), {
      progress: newProgress,
      is_completed: newProgress >= task.target,
    });
  }

  return { success: true, reward: rewardAmount, net: netResult };
};

// Daily Tasks Functions
export const getDailyTasks = async (userId: string): Promise<DailyTask[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  // First reset stale tasks
  const allTasksQuery = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId)
  );
  const allTasksSnap = await getDocs(allTasksQuery);
  
  for (const taskDoc of allTasksSnap.docs) {
    const task = taskDoc.data() as DailyTask;
    if (task.last_updated !== today) {
      await updateDoc(doc(db, 'daily_tasks', taskDoc.id), {
        progress: 0,
        is_completed: false,
        is_claimed: false,
        last_updated: today,
      });
    }
  }

  // Now fetch updated tasks
  const q = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId),
    where('is_claimed', '==', false)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
};

export const subscribeToTasks = (userId: string, callback: (tasks: DailyTask[]) => void) => {
  const q = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId)
  );
  
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as DailyTask))
      .filter(t => !t.is_claimed);
    callback(tasks);
  });
};

export const claimTaskReward = async (userId: string, taskId: string): Promise<{ success: boolean; reward?: number; error?: string }> => {
  const taskRef = doc(db, 'daily_tasks', taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) {
    return { success: false, error: 'Task not found' };
  }

  const task = taskSnap.data() as DailyTask;
  
  if (task.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!task.is_completed) {
    return { success: false, error: 'Task not completed' };
  }

  if (task.is_claimed) {
    return { success: false, error: 'Already claimed' };
  }

  const now = Timestamp.now();

  // Mark as claimed
  await updateDoc(taskRef, { is_claimed: true });

  // Add reward to balance
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    balance: increment(task.reward),
    updated_at: now,
  });

  // Record transaction
  await addDoc(collection(db, 'transactions'), {
    user_id: userId,
    type: 'task',
    amount: task.reward,
    description: `Task Reward: ${task.task_type}`,
    metadata: null,
    created_at: now,
  });

  return { success: true, reward: task.reward };
};

export const trackDailyLogin = async (userId: string): Promise<{ success: boolean; already_completed?: boolean }> => {
  const today = new Date().toISOString().split('T')[0];
  
  const q = query(
    collection(db, 'daily_tasks'),
    where('user_id', '==', userId),
    where('task_type', '==', 'daily_login')
  );
  
  const snap = await getDocs(q);
  if (snap.empty) {
    return { success: false };
  }

  const taskDoc = snap.docs[0];
  const task = taskDoc.data() as DailyTask;

  // Reset if from previous day
  if (task.last_updated !== today) {
    await updateDoc(doc(db, 'daily_tasks', taskDoc.id), {
      progress: 1,
      is_completed: true,
      is_claimed: false,
      last_updated: today,
    });
    return { success: true, already_completed: false };
  }

  if (task.is_completed) {
    return { success: true, already_completed: true };
  }

  await updateDoc(doc(db, 'daily_tasks', taskDoc.id), {
    progress: 1,
    is_completed: true,
  });

  return { success: true, already_completed: false };
};

// Claim all pending referral bonuses for a user
// This is called on login so users get their referral bonuses
export const claimPendingBonuses = async (userId: string): Promise<{ claimed: number; total: number }> => {
  console.log('[REFERRAL] Checking for pending bonuses for user:', userId);
  
  try {
    // Simple query - filter client side to avoid composite index
    const q = query(
      collection(db, 'pending_bonuses'),
      where('user_id', '==', userId)
    );
    
    const snap = await getDocs(q);
    console.log('[REFERRAL] Found', snap.size, 'total pending bonus records');
    
    // Filter unclaimed client-side
    const unclaimedDocs = snap.docs.filter(d => !d.data().is_claimed);
    console.log('[REFERRAL] Unclaimed bonuses:', unclaimedDocs.length);
    
    if (unclaimedDocs.length === 0) {
      return { claimed: 0, total: 0 };
    }
    
    let totalBonus = 0;
    const now = Timestamp.now();
    
    // Calculate total and mark as claimed
    for (const bonusDoc of unclaimedDocs) {
      const bonus = bonusDoc.data();
      totalBonus += bonus.amount;
      console.log('[REFERRAL] Processing bonus:', bonus.amount, 'CASET, type:', bonus.type);
      
      // Mark as claimed
      try {
        await updateDoc(doc(db, 'pending_bonuses', bonusDoc.id), {
          is_claimed: true,
        });
      } catch (updateError) {
        console.error('[REFERRAL] Failed to mark bonus as claimed:', updateError);
        continue;
      }
      
      // Create transaction record
      try {
        await addDoc(collection(db, 'transactions'), {
          user_id: userId,
          type: 'referral',
          amount: bonus.amount,
          description: bonus.type === 'direct_referral' 
            ? `Direct referral bonus from ${bonus.from_user_name || 'New User'}` 
            : `Indirect referral bonus from ${bonus.from_user_name || 'New User'}`,
          metadata: { from_user: bonus.from_user_id, type: bonus.type },
          created_at: now,
        });
      } catch (txError) {
        console.error('[REFERRAL] Failed to create transaction:', txError);
      }
    }
    
    // Update user's balance (user updating their OWN profile - always allowed)
    if (totalBonus > 0) {
      try {
        const profileRef = doc(db, 'profiles', userId);
        await updateDoc(profileRef, {
          balance: increment(totalBonus),
          updated_at: now,
        });
        console.log('[REFERRAL] Successfully claimed', totalBonus, 'CASET from', unclaimedDocs.length, 'bonuses');
      } catch (balanceError) {
        console.error('[REFERRAL] Failed to update balance:', balanceError);
      }
    }
    
    return { claimed: unclaimedDocs.length, total: totalBonus };
  } catch (error) {
    console.error('[REFERRAL] Error claiming pending bonuses:', error);
    return { claimed: 0, total: 0 };
  }
};

// Referral Functions
export const getReferrals = async (userId: string): Promise<Referral[]> => {
  console.log('[REFERRAL] Fetching referrals where referrer_id =', userId);
  
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrer_id', '==', userId)
    );
    
    const snap = await getDocs(q);
    console.log('[REFERRAL] Query returned', snap.size, 'referral documents');
    
    const referrals: Referral[] = [];
    
    for (const referralDoc of snap.docs) {
      const data = referralDoc.data();
      console.log('[REFERRAL] Processing referral:', referralDoc.id, data);
      
      const referral = { id: referralDoc.id, ...data } as Referral;
      
      // Get referred user's profile
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', referral.referred_id));
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as Profile;
          referral.referred_profile = {
            display_name: profile.display_name,
            total_mined: profile.total_mined,
            created_at: profile.created_at,
          };
        }
      } catch (profileError) {
        console.error('[REFERRAL] Failed to get referred profile:', profileError);
      }
      
      referrals.push(referral);
    }
    
    // Sort client-side
    referrals.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    console.log('[REFERRAL] Returning', referrals.length, 'referrals');
    return referrals;
  } catch (error) {
    console.error('[REFERRAL] Error fetching referrals:', error);
    return [];
  }
};

export const subscribeToReferrals = (userId: string, callback: (referrals: Referral[]) => void) => {
  console.log('[REFERRAL] Setting up real-time subscription for referrer:', userId);
  
  const q = query(
    collection(db, 'referrals'),
    where('referrer_id', '==', userId)
  );
  
  return onSnapshot(q, async (snap) => {
    console.log('[REFERRAL] Real-time update received:', snap.size, 'referral documents');
    
    const referrals: Referral[] = [];
    
    for (const referralDoc of snap.docs) {
      const data = referralDoc.data();
      console.log('[REFERRAL] Realtime referral data:', referralDoc.id, data);
      
      const referral = { id: referralDoc.id, ...data } as Referral;
      
      // Get referred user's profile
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', referral.referred_id));
        if (profileSnap.exists()) {
          const profile = profileSnap.data() as Profile;
          referral.referred_profile = {
            display_name: profile.display_name,
            total_mined: profile.total_mined,
            created_at: profile.created_at,
          };
        }
      } catch (profileError) {
        console.error('[REFERRAL] Failed to get referred profile in realtime:', profileError);
      }
      
      referrals.push(referral);
    }
    
    // Sort client-side
    referrals.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    console.log('[REFERRAL] Realtime callback with', referrals.length, 'referrals');
    callback(referrals);
  }, (error) => {
    console.error('[REFERRAL] Realtime subscription error:', error);
    callback([]);
  });
};

// Leaderboard
export const getLeaderboard = async (): Promise<{ rank: number; user_id: string; display_name: string; total_mined: number; is_premium: boolean }[]> => {
  const q = query(
    collection(db, 'profiles'),
    orderBy('total_mined', 'desc'),
    limit(100)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map((doc, index) => {
    const profile = doc.data() as Profile;
    return {
      rank: index + 1,
      user_id: doc.id,
      display_name: profile.display_name || 'Miner',
      total_mined: profile.total_mined,
      is_premium: profile.is_premium,
    };
  });
};
