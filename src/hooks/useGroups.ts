import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp,
  onSnapshot,
  getDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SecurityGroup, 
  GroupMember, 
  GroupDailyActivity, 
  GroupClaim,
  GroupWithMembers,
  MAX_GROUPS_PER_USER,
  MAX_MEMBERS_PER_GROUP,
  MIN_MEMBERS_TO_EARN,
  MIN_ACTIVE_MEMBERS,
  BASE_GROUP_REWARD,
  MAX_MINES_PER_DAY
} from '@/types/groups';

const generateGroupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'GRP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export function useGroups() {
  const { user, profile } = useAuth();
  const [myGroups, setMyGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [todayClaimed, setTodayClaimed] = useState<string | null>(null); // group_id if claimed today
  const isMountedRef = useRef(true);

  // Fetch groups and their data
  const fetchGroups = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Get all group memberships for this user
      const membershipQuery = query(
        collection(db, 'group_members'),
        where('user_id', '==', user.uid)
      );
      const membershipSnap = await getDocs(membershipQuery);
      
      if (membershipSnap.empty) {
        if (isMountedRef.current) {
          setMyGroups([]);
          setLoading(false);
        }
        return;
      }

      const groupIds = membershipSnap.docs.map(doc => doc.data().group_id);
      const today = getTodayDate();

      // Fetch all groups
      const groupsWithData: GroupWithMembers[] = [];
      
      for (const groupId of groupIds) {
        const groupDoc = await getDoc(doc(db, 'security_groups', groupId));
        if (!groupDoc.exists()) continue;

        const groupData = { id: groupDoc.id, ...groupDoc.data() } as SecurityGroup;

        // Get all members
        const membersQuery = query(
          collection(db, 'group_members'),
          where('group_id', '==', groupId)
        );
        const membersSnap = await getDocs(membersQuery);
        const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupMember));

        // Get today's activity for all members
        const activityQuery = query(
          collection(db, 'group_daily_activity'),
          where('group_id', '==', groupId),
          where('date', '==', today)
        );
        const activitySnap = await getDocs(activityQuery);
        const activities = activitySnap.docs.map(d => d.data() as GroupDailyActivity);

        // Calculate stats
        const activeMembers = activities.filter(a => a.is_active).length;
        const myActivity = activities.find(a => a.user_id === user.uid);
        const myMines = myActivity?.mines_today || 0;

        // Group reward formula: 180 × A/5 (A = active members, max 5)
        const groupReward = Math.floor((BASE_GROUP_REWARD * Math.min(activeMembers, 5)) / 5);
        // Your reward: Group reward × M/4 (M = your mines today, max 4)
        const myReward = Math.floor((groupReward * Math.min(myMines, MAX_MINES_PER_DAY)) / MAX_MINES_PER_DAY);

        groupsWithData.push({
          ...groupData,
          members,
          myActivity,
          todayStats: {
            activeMembers,
            totalMines: activities.reduce((sum, a) => sum + a.mines_today, 0),
            groupReward,
            myReward
          }
        });
      }

      // Check if user already claimed today
      const claimQuery = query(
        collection(db, 'group_claims'),
        where('user_id', '==', user.uid),
        where('date', '==', today)
      );
      const claimSnap = await getDocs(claimQuery);
      
      if (isMountedRef.current) {
        setMyGroups(groupsWithData);
        setTodayClaimed(claimSnap.empty ? null : claimSnap.docs[0].data().group_id);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchGroups();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchGroups]);

  // Create a new group
  const createGroup = useCallback(async (name: string): Promise<{ success: boolean; error?: string; group?: SecurityGroup }> => {
    if (!user?.uid || !profile) {
      return { success: false, error: 'Not authenticated' };
    }

    if (myGroups.length >= MAX_GROUPS_PER_USER) {
      return { success: false, error: `Maximum ${MAX_GROUPS_PER_USER} groups allowed` };
    }

    setCreating(true);
    try {
      const now = Timestamp.now();
      const code = generateGroupCode();

      // Create the group
      const groupRef = await addDoc(collection(db, 'security_groups'), {
        name: name.trim(),
        code,
        created_by: user.uid,
        created_at: now,
        member_count: 1
      });

      // Add creator as first member
      await addDoc(collection(db, 'group_members'), {
        group_id: groupRef.id,
        user_id: user.uid,
        display_name: profile.display_name,
        joined_at: now
      });

      await fetchGroups();
      return { 
        success: true, 
        group: { 
          id: groupRef.id, 
          name: name.trim(), 
          code, 
          created_by: user.uid, 
          created_at: now,
          member_count: 1 
        } 
      };
    } catch (error: any) {
      console.error('Error creating group:', error);
      return { success: false, error: error.message || 'Failed to create group' };
    } finally {
      setCreating(false);
    }
  }, [user?.uid, profile, myGroups.length, fetchGroups]);

  // Join a group by code
  const joinGroup = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.uid || !profile) {
      return { success: false, error: 'Not authenticated' };
    }

    if (myGroups.length >= MAX_GROUPS_PER_USER) {
      return { success: false, error: `You can only join up to ${MAX_GROUPS_PER_USER} groups` };
    }

    setJoining(true);
    try {
      const normalizedCode = code.trim().toUpperCase();

      // Find the group
      const groupQuery = query(
        collection(db, 'security_groups'),
        where('code', '==', normalizedCode)
      );
      const groupSnap = await getDocs(groupQuery);

      if (groupSnap.empty) {
        return { success: false, error: 'Group not found' };
      }

      const groupDoc = groupSnap.docs[0];
      const groupData = groupDoc.data() as SecurityGroup;

      // Check if already a member
      const memberQuery = query(
        collection(db, 'group_members'),
        where('group_id', '==', groupDoc.id),
        where('user_id', '==', user.uid)
      );
      const memberSnap = await getDocs(memberQuery);

      if (!memberSnap.empty) {
        return { success: false, error: 'Already a member of this group' };
      }

      // Check group capacity
      if (groupData.member_count >= MAX_MEMBERS_PER_GROUP) {
        return { success: false, error: 'Group is full (max 5 members)' };
      }

      const now = Timestamp.now();

      // Add member
      await addDoc(collection(db, 'group_members'), {
        group_id: groupDoc.id,
        user_id: user.uid,
        display_name: profile.display_name,
        joined_at: now
      });

      // Update member count
      await updateDoc(doc(db, 'security_groups', groupDoc.id), {
        member_count: increment(1)
      });

      await fetchGroups();
      return { success: true };
    } catch (error: any) {
      console.error('Error joining group:', error);
      return { success: false, error: error.message || 'Failed to join group' };
    } finally {
      setJoining(false);
    }
  }, [user?.uid, profile, myGroups.length, fetchGroups]);

  // Claim reward from a group (once per day, from one group only)
  const claimGroupReward = useCallback(async (groupId: string): Promise<{ success: boolean; error?: string; amount?: number }> => {
    if (!user?.uid) {
      return { success: false, error: 'Not authenticated' };
    }

    const today = getTodayDate();

    // Check if already claimed today
    if (todayClaimed) {
      return { success: false, error: 'Already claimed from a group today' };
    }

    setClaiming(true);
    try {
      const group = myGroups.find(g => g.id === groupId);
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      // Validate eligibility
      if (group.members.length < MIN_MEMBERS_TO_EARN) {
        return { success: false, error: `Group needs at least ${MIN_MEMBERS_TO_EARN} members` };
      }

      if ((group.todayStats?.activeMembers || 0) < MIN_ACTIVE_MEMBERS) {
        return { success: false, error: `Need at least ${MIN_ACTIVE_MEMBERS} active members today` };
      }

      if ((group.myActivity?.mines_today || 0) < 1) {
        return { success: false, error: 'You must mine at least once today' };
      }

      const rewardAmount = group.todayStats?.myReward || 0;
      if (rewardAmount <= 0) {
        return { success: false, error: 'No reward to claim' };
      }

      const now = Timestamp.now();
      const batch = writeBatch(db);

      // Create claim record
      const claimRef = doc(collection(db, 'group_claims'));
      batch.set(claimRef, {
        date: today,
        group_id: groupId,
        user_id: user.uid,
        amount: rewardAmount,
        claimed_at: now
      });

      // Update user balance
      const profileRef = doc(db, 'profiles', user.uid);
      batch.update(profileRef, {
        balance: increment(rewardAmount),
        updated_at: now
      });

      // Create transaction
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        user_id: user.uid,
        type: 'group_reward',
        amount: rewardAmount,
        description: `Security Group reward: ${group.name}`,
        metadata: { group_id: groupId, group_name: group.name },
        created_at: now
      });

      await batch.commit();

      setTodayClaimed(groupId);
      await fetchGroups();
      
      return { success: true, amount: rewardAmount };
    } catch (error: any) {
      console.error('Error claiming group reward:', error);
      return { success: false, error: error.message || 'Failed to claim reward' };
    } finally {
      setClaiming(false);
    }
  }, [user?.uid, myGroups, todayClaimed, fetchGroups]);

  // Update activity when user mines (called from mining hook)
  const recordMiningActivity = useCallback(async (): Promise<void> => {
    if (!user?.uid || myGroups.length === 0) return;

    const today = getTodayDate();

    try {
      for (const group of myGroups) {
        // Check if activity record exists for today
        const activityQuery = query(
          collection(db, 'group_daily_activity'),
          where('group_id', '==', group.id),
          where('user_id', '==', user.uid),
          where('date', '==', today)
        );
        const activitySnap = await getDocs(activityQuery);

        if (activitySnap.empty) {
          // Create new activity record
          await addDoc(collection(db, 'group_daily_activity'), {
            date: today,
            group_id: group.id,
            user_id: user.uid,
            mines_today: 1,
            is_active: true
          });
        } else {
          // Update existing (max 4 mines per day - matches app's session limit)
          const activityDoc = activitySnap.docs[0];
          const currentMines = activityDoc.data().mines_today || 0;
          if (currentMines < MAX_MINES_PER_DAY) {
            await updateDoc(doc(db, 'group_daily_activity', activityDoc.id), {
              mines_today: increment(1),
              is_active: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error recording mining activity:', error);
    }
  }, [user?.uid, myGroups]);

  return {
    myGroups,
    loading,
    creating,
    joining,
    claiming,
    todayClaimed,
    createGroup,
    joinGroup,
    claimGroupReward,
    recordMiningActivity,
    refreshGroups: fetchGroups
  };
}
