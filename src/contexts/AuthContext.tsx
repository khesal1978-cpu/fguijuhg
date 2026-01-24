import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  firebaseAuth, 
  onAuthStateChanged, 
  firebaseSignOut,
  User,
  Profile,
  getProfile,
  createProfile,
  subscribeToProfile,
  trackDailyLogin
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
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
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        try {
          setUser(firebaseUser);
          
          if (firebaseUser) {
            // Check if profile exists - but DON'T auto-create it here
            // The Auth page handles profile creation with referral codes
            // We just wait for the profile to be created
            let userProfile = await getProfile(firebaseUser.uid);
            
            if (!userProfile) {
              // Wait a moment and try again - the Auth page might be creating the profile
              await new Promise(resolve => setTimeout(resolve, 1000));
              userProfile = await getProfile(firebaseUser.uid);
              
              // If still no profile after waiting, create a basic one
              // This handles edge cases like direct Google sign-in without going through Auth page
              if (!userProfile) {
                try {
                  console.log('Creating fallback profile for user:', firebaseUser.uid);
                  userProfile = await createProfile(firebaseUser.uid, firebaseUser.displayName || 'Miner');
                } catch (createError) {
                  console.error('Error creating fallback profile:', createError);
                }
              }
            }
            
            setProfile(userProfile);
            
            // Track daily login (don't await to prevent blocking)
            if (userProfile) {
              trackDailyLogin(firebaseUser.uid).catch(console.error);
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to profile changes in real-time
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = subscribeToProfile(user.uid, (updatedProfile) => {
        setProfile(updatedProfile);
      });
    } catch (error) {
      console.error('Error subscribing to profile:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setProfile(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signOut,
        profile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
