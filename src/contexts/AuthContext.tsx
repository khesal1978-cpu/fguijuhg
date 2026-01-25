import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { 
  firebaseAuth, 
  onAuthStateChanged, 
  firebaseSignOut,
  User,
  Profile,
  getProfile,
  createProfile,
  subscribeToProfile,
  trackDailyLogin,
  claimPendingBonuses
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Secure default context to prevent undefined access
const defaultContext: AuthContextType = {
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoized fetch profile function
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!userId) return null;
    
    try {
      const data = await getProfile(userId);
      if (data) {
        setProfile(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Memoized refresh profile function
  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  }, [user?.uid, fetchProfile]);

  // Memoized sign out function
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut();
      setProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error; // Re-throw for caller to handle
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    
    try {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (!isMounted) return;
        
        try {
          setUser(firebaseUser);
          
          if (firebaseUser) {
            // Attempt to get existing profile
            let userProfile = await getProfile(firebaseUser.uid);
            
            if (!userProfile) {
              // Wait briefly for profile creation (handles race condition with Auth page)
              await new Promise(resolve => setTimeout(resolve, 1000));
              userProfile = await getProfile(firebaseUser.uid);
              
              // Create fallback profile for edge cases (direct Google sign-in)
              if (!userProfile && isMounted) {
                try {
                  console.log('Creating fallback profile for user:', firebaseUser.uid);
                  // Sanitize display name
                  const displayName = (firebaseUser.displayName || 'Miner')
                    .slice(0, 50)
                    .replace(/[<>"']/g, ''); // Remove potentially dangerous characters
                  userProfile = await createProfile(firebaseUser.uid, displayName);
                } catch (createError) {
                  console.error('Error creating fallback profile:', createError);
                }
              }
            }
            
            if (isMounted) {
              setProfile(userProfile);
            }
            
            // Claim pending referral bonuses (non-blocking)
            if (userProfile) {
              claimPendingBonuses(firebaseUser.uid)
                .then((result) => {
                  if (result.total > 0) {
                    console.log(`[REFERRAL] Claimed ${result.total} CASET from ${result.claimed} pending bonuses`);
                  }
                })
                .catch((err) => console.error('[REFERRAL] Claim error:', err));
              
              // Track daily login (non-blocking)
              trackDailyLogin(firebaseUser.uid).catch(console.error);
            }
          } else {
            if (isMounted) {
              setProfile(null);
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (isMounted) {
            setProfile(null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setIsInitialized(true);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
      setIsInitialized(true);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to profile changes in real-time
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    
    try {
      unsubscribe = subscribeToProfile(user.uid, (updatedProfile) => {
        if (isMounted) {
          setProfile(updatedProfile);
        }
      });
    } catch (error) {
      console.error('Error subscribing to profile:', error);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    profile,
    loading,
    refreshProfile,
    signOut,
  }), [user, profile, loading, refreshProfile, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Safety check - should never happen with proper provider setup
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
