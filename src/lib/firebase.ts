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
  } as Profile;

  // Handle referral
  if (referralCode) {
    const referrerQuery = query(collection(db, 'profiles'), where('referral_code', '==', referralCode.toUpperCase()));
    const referrerSnap = await getDocs(referrerQuery);
    
    if (!referrerSnap.empty) {
      const referrerId = referrerSnap.docs[0].id;
      const referrerProfile = referrerSnap.docs[0].data() as Profile;
      newProfile.referred_by = referrerId;
      newProfile.balance = 50; // Welcome bonus for referred user
      
      // Update referrer balance (direct referral bonus: 25)
      const referrerRef = doc(db, 'profiles', referrerId);
      await updateDoc(referrerRef, {
        balance: increment(25),
        updated_at: now,
      });
      
      // Create DIRECT referral record (level 1)
      await addDoc(collection(db, 'referrals'), {
        referrer_id: referrerId,
        referred_id: userId,
        bonus_earned: 25,
        is_active: false,
        level: 1, // Direct referral
        created_at: now,
      });
      
      // Create transaction for direct referrer
      await addDoc(collection(db, 'transactions'), {
        user_id: referrerId,
        type: 'referral',
        amount: 25,
        description: 'Direct referral bonus',
        metadata: { level: 1 },
        created_at: now,
      });
      
      // Check for INDIRECT referral (if the referrer was referred by someone else)
      if (referrerProfile.referred_by) {
        const indirectReferrerId = referrerProfile.referred_by;
        const indirectBonus = 10; // Indirect referral bonus
        
        // Update indirect referrer balance
        const indirectReferrerRef = doc(db, 'profiles', indirectReferrerId);
        await updateDoc(indirectReferrerRef, {
          balance: increment(indirectBonus),
          updated_at: now,
        });
        
        // Create INDIRECT referral record (level 2)
        await addDoc(collection(db, 'referrals'), {
          referrer_id: indirectReferrerId,
          referred_id: userId,
          bonus_earned: indirectBonus,
          is_active: false,
          level: 2, // Indirect referral
          created_at: now,
        });
        
        // Create transaction for indirect referrer
        await addDoc(collection(db, 'transactions'), {
          user_id: indirectReferrerId,
          type: 'referral',
          amount: indirectBonus,
          description: 'Indirect referral bonus (2nd level)',
          metadata: { level: 2 },
          created_at: now,
        });
      }
      
      // Create welcome bonus transaction for new user
      await addDoc(collection(db, 'transactions'), {
        user_id: userId,
        type: 'referral',
        amount: 50,
        description: 'Welcome bonus from referral',
        metadata: null,
        created_at: now,
      });
    }
  }

  await setDoc(profileRef, newProfile);

  // Initialize daily tasks
  const tasksData = [
    { task_type: 'daily_login', target: 1, reward: 3 },
    { task_type: 'invite_friends', target: 10, reward: 50 },
    { task_type: 'play_games', target: 50, reward: 100 },
  ];

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

export const startMiningSession = async (userId: string): Promise<{ success: boolean; error?: string; session_id?: string }> => {
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

  return { success: true, session_id: sessionRef.id };
};

export const claimMiningReward = async (userId: string, sessionId: string): Promise<{ success: boolean; error?: string; amount?: number }> => {
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

  return { success: true, amount: session.earned_amount };
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

// Referral Functions
export const getReferrals = async (userId: string): Promise<Referral[]> => {
  // Simplified query - sort client-side
  const q = query(
    collection(db, 'referrals'),
    where('referrer_id', '==', userId)
  );
  
  const snap = await getDocs(q);
  const referrals: Referral[] = [];
  
  for (const referralDoc of snap.docs) {
    const referral = { id: referralDoc.id, ...referralDoc.data() } as Referral;
    
    // Get referred user's profile
    const profileSnap = await getDoc(doc(db, 'profiles', referral.referred_id));
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as Profile;
      referral.referred_profile = {
        display_name: profile.display_name,
        total_mined: profile.total_mined,
        created_at: profile.created_at,
      };
    }
    
    referrals.push(referral);
  }
  
  // Sort client-side
  referrals.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
  return referrals;
};

export const subscribeToReferrals = (userId: string, callback: (referrals: Referral[]) => void) => {
  // Simplified query - sort client-side
  const q = query(
    collection(db, 'referrals'),
    where('referrer_id', '==', userId)
  );
  
  return onSnapshot(q, async (snap) => {
    const referrals: Referral[] = [];
    
    for (const referralDoc of snap.docs) {
      const referral = { id: referralDoc.id, ...referralDoc.data() } as Referral;
      
      // Get referred user's profile
      const profileSnap = await getDoc(doc(db, 'profiles', referral.referred_id));
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as Profile;
        referral.referred_profile = {
          display_name: profile.display_name,
          total_mined: profile.total_mined,
          created_at: profile.created_at,
        };
      }
      
      referrals.push(referral);
    }
    
    // Sort client-side
    referrals.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    callback(referrals);
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
