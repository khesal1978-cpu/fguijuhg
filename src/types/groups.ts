import { Timestamp } from "firebase/firestore";

export interface SecurityGroup {
  id: string;
  name: string;
  code: string; // Unique join code like "GRP-XXXX"
  created_by: string;
  created_at: Timestamp;
  member_count: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: Timestamp;
  display_name: string | null;
}

export interface GroupDailyActivity {
  id: string;
  date: string; // YYYY-MM-DD format
  group_id: string;
  user_id: string;
  mines_today: number; // 0-4 (matches app's 4 session limit)
  is_active: boolean; // mined at least once today
}

export interface GroupClaim {
  id: string;
  date: string; // YYYY-MM-DD format
  group_id: string;
  user_id: string;
  amount: number;
  claimed_at: Timestamp;
}

export interface GroupWithMembers extends SecurityGroup {
  members: GroupMember[];
  myActivity?: GroupDailyActivity;
  todayStats?: {
    activeMembers: number;
    totalMines: number;
    groupReward: number;
    myReward: number;
  };
}

// Constants
export const MAX_GROUPS_PER_USER = 5;
export const MAX_MEMBERS_PER_GROUP = 5;
export const MIN_MEMBERS_TO_EARN = 3;
export const MIN_ACTIVE_MEMBERS = 2;
export const BASE_GROUP_REWARD = 180;
export const MAX_MINES_PER_DAY = 4; // Matches app's 4 session limit
