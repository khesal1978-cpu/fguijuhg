import { useState, forwardRef, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Shield, Plus, Copy, Loader2, Gift, ChevronRight,
  Check, AlertCircle, Zap, Crown, UserPlus, X, Info,
  Calculator, Target, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { 
  MAX_GROUPS_PER_USER, 
  MAX_MEMBERS_PER_GROUP,
  MIN_MEMBERS_TO_EARN,
  MIN_ACTIVE_MEMBERS
} from "@/types/groups";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const GroupsInner = forwardRef<HTMLDivElement, object>(function Groups(_, ref) {
  const { profile } = useAuth();
  const { 
    myGroups, 
    loading, 
    creating, 
    joining, 
    claiming, 
    todayClaimed,
    createGroup, 
    joinGroup, 
    claimGroupReward 
  } = useGroups();
  const { showTeamClaimAd, isLoading: adLoading } = useRewardedAd();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pendingClaimGroup, setPendingClaimGroup] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Group code copied!");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }
    const result = await createGroup(groupName);
    if (result.success) {
      toast.success(`Group "${groupName}" created!`);
      setShowCreateDialog(false);
      setGroupName("");
    } else {
      toast.error(result.error || "Failed to create group");
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter a group code");
      return;
    }
    const result = await joinGroup(joinCode);
    if (result.success) {
      toast.success("Joined group successfully!");
      setShowJoinDialog(false);
      setJoinCode("");
    } else {
      toast.error(result.error || "Failed to join group");
    }
  };

  const handleClaimReward = useCallback(async (groupId: string) => {
    // Show ad before claiming
    setPendingClaimGroup(groupId);
    
    const adResult = await showTeamClaimAd();
    if (!adResult) {
      toast.error("Please watch the ad to claim your reward");
      setPendingClaimGroup(null);
      return;
    }

    const result = await claimGroupReward(groupId);
    setPendingClaimGroup(null);
    
    if (result.success) {
      toast.success(`Claimed ${result.amount} CASET from group!`);
    } else {
      toast.error(result.error || "Failed to claim reward");
    }
  }, [showTeamClaimAd, claimGroupReward]);

  const canCreateOrJoin = myGroups.length < MAX_GROUPS_PER_USER;

  return (
    <div ref={ref} className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Security Groups</h1>
            <p className="text-sm text-muted-foreground">Earn together with your team</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfoSheet(true)}
          className="size-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
        >
          <Info className="size-5 text-foreground/60" />
        </button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-glass-strong p-4">
          <p className="text-xs text-foreground/60 mb-1">My Groups</p>
          <p className="text-2xl font-display font-bold text-foreground">
            {myGroups.length}<span className="text-base text-foreground/40">/{MAX_GROUPS_PER_USER}</span>
          </p>
        </div>
        <div className="card-glass-strong p-4">
          <p className="text-xs text-foreground/60 mb-1">Today's Status</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            {todayClaimed ? (
              <>
                <Check className="size-4 text-success" />
                <span className="text-success">Claimed</span>
              </>
            ) : (
              <>
                <Clock className="size-4 text-gold" />
                <span className="text-gold">Available</span>
              </>
            )}
          </p>
        </div>
      </motion.div>

      {/* Create / Join Buttons */}
      {canCreateOrJoin && (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            variant="outline"
            onClick={() => setShowCreateDialog(true)}
            className="h-12 flex items-center gap-2"
          >
            <Plus className="size-4" />
            Create Group
          </Button>
          <Button
            onClick={() => setShowJoinDialog(true)}
            className="h-12 flex items-center gap-2 gradient-primary"
          >
            <UserPlus className="size-4" />
            Join Group
          </Button>
        </motion.div>
      )}

      {/* Groups List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-foreground/70">Your Groups</h2>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
          </div>
        ) : myGroups.length === 0 ? (
          <div className="card-glass-strong p-8 text-center border-2 border-dashed border-white/[0.1]">
            <Shield className="size-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70">No groups yet</p>
            <p className="text-xs text-foreground/50 mt-1">
              Create a group or join one using a code
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myGroups.map((group, i) => {
              const canClaim = !todayClaimed && 
                group.members.length >= MIN_MEMBERS_TO_EARN &&
                (group.todayStats?.activeMembers || 0) >= MIN_ACTIVE_MEMBERS &&
                (group.myActivity?.mines_today || 0) >= 1 &&
                (group.todayStats?.myReward || 0) > 0;

              const isClaimedFromThis = todayClaimed === group.id;
              const isPendingClaim = pendingClaimGroup === group.id;

              return (
                <motion.div
                  key={group.id}
                  className="card-glass-strong p-4 space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold">
                        {group.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{group.name}</p>
                        <button
                          onClick={() => copyCode(group.code)}
                          className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                        >
                          <span className="font-mono">{group.code}</span>
                          <Copy className="size-3" />
                        </button>
                      </div>
                    </div>
                    {group.created_by === profile?.id && (
                      <Crown className="size-4 text-gold" />
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      <p className="text-lg font-bold text-foreground">{group.members.length}</p>
                      <p className="text-[10px] text-foreground/50">Members</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      <p className="text-lg font-bold text-primary">{group.todayStats?.activeMembers || 0}</p>
                      <p className="text-[10px] text-foreground/50">Active Today</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      <p className="text-lg font-bold text-gold">{group.myActivity?.mines_today || 0}/4</p>
                      <p className="text-[10px] text-foreground/50">My Sessions</p>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-primary" />
                      <span className="text-sm text-foreground/80">Today's Reward</span>
                    </div>
                    <span className="text-lg font-display font-bold text-primary">
                      {group.todayStats?.myReward || 0} CASET
                    </span>
                  </div>

                  {/* Claim Button or Status */}
                  {isClaimedFromThis ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success/15 border border-success/30">
                      <Check className="size-4 text-success" />
                      <span className="text-sm font-semibold text-success">Claimed Today</span>
                    </div>
                  ) : todayClaimed ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                      <AlertCircle className="size-4 text-foreground/40" />
                      <span className="text-sm text-foreground/50">Claimed from another group</span>
                    </div>
                  ) : !canClaim ? (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.1]">
                      <p className="text-xs text-foreground/50 text-center">
                        {group.members.length < MIN_MEMBERS_TO_EARN 
                          ? `Need ${MIN_MEMBERS_TO_EARN} members (have ${group.members.length})`
                          : (group.todayStats?.activeMembers || 0) < MIN_ACTIVE_MEMBERS
                          ? `Need ${MIN_ACTIVE_MEMBERS} active members today`
                          : (group.myActivity?.mines_today || 0) < 1
                          ? "Mine at least once to be eligible"
                          : "No reward available"
                        }
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleClaimReward(group.id)}
                      disabled={claiming || adLoading}
                      className="w-full h-12 gradient-primary btn-glow"
                    >
                      {isPendingClaim && (claiming || adLoading) ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          <Gift className="size-5 mr-2" />
                          Claim {group.todayStats?.myReward} CASET
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Security Group</DialogTitle>
            <DialogDescription>
              Create a group and invite up to 5 members to earn together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={20}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Security Group</DialogTitle>
            <DialogDescription>
              Enter the group code shared by a member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Group code (e.g. GRP-XXXX)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono text-center text-lg tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinGroup} disabled={joining}>
              {joining ? <Loader2 className="size-4 animate-spin" /> : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Sheet */}
      <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Shield className="size-5 text-primary" />
              </div>
              <SheetTitle className="text-xl">Security Groups</SheetTitle>
            </div>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto pb-10">
            {/* Overview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info className="size-4 text-primary" />
                Overview
              </div>
              <div className="p-4 rounded-xl bg-white/[0.04] space-y-3 text-sm text-foreground/80">
                <p>Group rewards are based on your daily mining sessions (up to 4) and the activity of other group members.</p>
                <p>You can join up to <strong>5 groups</strong>, and each group can have up to <strong>5 members</strong>.</p>
                <p>Each day, you may claim from exactly <strong>one</strong> of your groups.</p>
                <p>To earn any reward, your chosen group must have at least <strong>3 members</strong> and at least <strong>2 active members</strong> (including you).</p>
                <p className="text-foreground/60 text-xs">Results are calculated daily at 0AM (UTC+0).</p>
              </div>
            </div>

            {/* Formulas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calculator className="size-4 text-primary" />
                Formulas
              </div>
              <div className="p-4 rounded-xl bg-white/[0.04] space-y-2 font-mono text-sm text-foreground/80">
                <p>Group reward = 180 × A/5</p>
                <p>Your reward = Group reward × M/4</p>
              </div>
            </div>

            {/* Definitions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Target className="size-4 text-primary" />
                Definitions
              </div>
              <div className="p-4 rounded-xl bg-white/[0.04] space-y-2 text-sm text-foreground/80">
                <p>• <strong>A</strong> = number of active members (max 5)</p>
                <p>• <strong>M</strong> = your sessions today (0–4, only counted after joining the group)</p>
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="size-4 text-primary" />
                Eligibility to Earn
              </div>
              <div className="p-4 rounded-xl bg-white/[0.04] space-y-2 text-sm text-foreground/80">
                <p>• A group must have at least 3 members, with at least 2 active.</p>
                <p>• You must mine at least once.</p>
                <p>• Sessions before joining a group will not be counted. Only sessions after joining count, up to 4 per day.</p>
              </div>
            </div>

            {/* Example */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap className="size-4 text-gold" />
                Example
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.04] text-sm text-foreground/80">
                  <p>The group you choose has 5 members and 3 of them mined today (A = 3).</p>
                  <p className="font-mono mt-1">Group reward = 180 × 3/5 = <strong>108</strong></p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.04] text-sm text-foreground/80">
                  <p>You completed 2 sessions after joining group (M = 2).</p>
                  <p className="font-mono mt-1">Your reward = 108 × 2/4 = <strong>54</strong></p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-foreground">
                  <p>You will receive <strong className="text-primary">54 CASET</strong> when claiming from this group.</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

export default memo(GroupsInner);
