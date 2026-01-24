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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const data = await getProfile(userId);
    if (data) {
      setProfile(data);
    }
    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if profile exists
        let userProfile = await getProfile(firebaseUser.uid);
        
        if (!userProfile) {
          // Profile doesn't exist yet - this shouldn't happen normally
          // as we create it during signup, but handle edge case
          userProfile = await createProfile(firebaseUser.uid, 'Miner');
        }
        
        setProfile(userProfile);
        
        // Track daily login
        await trackDailyLogin(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to profile changes in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProfile(user.uid, (updatedProfile) => {
      setProfile(updatedProfile);
    });

    return () => unsubscribe();
  }, [user]);

  const signOut = async () => {
    await firebaseSignOut();
    setProfile(null);
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
