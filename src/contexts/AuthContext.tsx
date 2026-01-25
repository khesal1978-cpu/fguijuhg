import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from "react";
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
  
  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  const profileSubscriptionRef = useRef<(() => void) | null>(null);

  // Memoized fetch profile function
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!userId) return null;
    
    try {
      const data = await getProfile(userId);
      if (data && isMountedRef.current) {
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
      // Clean up profile subscription before signing out
      if (profileSubscriptionRef.current) {
        try {
          profileSubscriptionRef.current();
        } catch (e) {
          // Ignore cleanup errors
        }
        profileSubscriptionRef.current = null;
      }
      
      await firebaseSignOut();
      
      if (isMountedRef.current) {
        setProfile(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  // Auth state listener - runs once on mount
  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribeAuth: (() => void) | undefined;
    
    try {
      unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (!isMountedRef.current) return;
        
        try {
          setUser(firebaseUser);
          
          if (firebaseUser) {
            // Attempt to get existing profile
            let userProfile = await getProfile(firebaseUser.uid);
            
            if (!userProfile) {
              // Wait briefly for profile creation (handles race condition with Auth page)
              await new Promise(resolve => setTimeout(resolve, 500));
              userProfile = await getProfile(firebaseUser.uid);
              
              // Create fallback profile for edge cases (direct Google sign-in)
              if (!userProfile && isMountedRef.current) {
                try {
                  console.log('Creating fallback profile for user:', firebaseUser.uid);
                  const displayName = (firebaseUser.displayName || 'Miner')
                    .slice(0, 50)
                    .replace(/[<>"']/g, '');
                  userProfile = await createProfile(firebaseUser.uid, displayName);
                } catch (createError) {
                  console.error('Error creating fallback profile:', createError);
                }
              }
            }
            
            if (isMountedRef.current) {
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
            if (isMountedRef.current) {
              setProfile(null);
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (isMountedRef.current) {
            setProfile(null);
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
            setIsInitialized(true);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (isMountedRef.current) {
        setLoading(false);
        setIsInitialized(true);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  // Subscribe to profile changes in real-time - with improved cleanup
  useEffect(() => {
    if (!user?.uid || !isInitialized) return;

    let isActive = true;
    
    // Clean up any existing subscription first
    if (profileSubscriptionRef.current) {
      try {
        profileSubscriptionRef.current();
      } catch (e) {
        // Ignore cleanup errors
      }
      profileSubscriptionRef.current = null;
    }
    
    // Delay subscription to avoid race conditions during auth state changes
    const timeoutId = setTimeout(() => {
      if (!isActive || !isMountedRef.current) return;
      
      try {
        profileSubscriptionRef.current = subscribeToProfile(user.uid, (updatedProfile) => {
          if (isActive && isMountedRef.current) {
            setProfile(updatedProfile);
          }
        });
      } catch (error) {
        console.error('Error subscribing to profile:', error);
      }
    }, 200);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      
      if (profileSubscriptionRef.current) {
        try {
          profileSubscriptionRef.current();
        } catch (e) {
          // Ignore cleanup errors
        }
        profileSubscriptionRef.current = null;
      }
    };
  }, [user?.uid, isInitialized]);

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
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
