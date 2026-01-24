import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Shield,
  Fingerprint,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaceVerificationCamera } from '@/components/verification/FaceVerificationCamera';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import {
  descriptorToArray,
  arrayToDescriptor,
  facesMatch,
} from '@/lib/faceVerification';
import { toast } from 'sonner';

// Step indicator component
function StepIndicator({ 
  active, 
  completed, 
  label, 
  isComplete 
}: { 
  active: boolean; 
  completed: boolean; 
  label: string; 
  isComplete?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: active ? 1.1 : 1 }}
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        isComplete 
          ? 'bg-green-500 text-white' 
          : active 
          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
          : completed 
          ? 'bg-primary/20 text-primary' 
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {isComplete ? <Check className="size-4" /> : label}
    </motion.div>
  );
}

type AuthStep = 'credentials' | 'face-verify' | 'complete' | 'recovery';
type AuthMode = 'login' | 'register';

// Simulated user storage (replace with your backend)
interface StoredUser {
  email: string;
  passwordHash: string;
  appId: string;
  faceTemplate: string;
  deviceFingerprint: string;
  createdAt: string;
}

// Simple password hash (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_change_in_production');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate unique App ID
function generateAppId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'APP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simulated backend storage (localStorage for demo)
const UserStorage = {
  getAll(): StoredUser[] {
    const data = localStorage.getItem('face_auth_users');
    return data ? JSON.parse(data) : [];
  },

  save(users: StoredUser[]) {
    localStorage.setItem('face_auth_users', JSON.stringify(users));
  },

  findByEmail(email: string): StoredUser | undefined {
    return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findByFace(descriptor: Float32Array): StoredUser | undefined {
    const users = this.getAll();
    for (const user of users) {
      try {
        // Decrypt and compare
        const storedDescriptor = arrayToDescriptor(JSON.parse(atob(user.faceTemplate)));
        if (facesMatch(descriptor, storedDescriptor, 0.5)) {
          return user;
        }
      } catch (e) {
        console.error('Error comparing face:', e);
      }
    }
    return undefined;
  },

  add(user: StoredUser) {
    const users = this.getAll();
    users.push(user);
    this.save(users);
  },

  update(email: string, updates: Partial<StoredUser>) {
    const users = this.getAll();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      this.save(users);
    }
  },
};

export default function FaceAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Verification state
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<StoredUser | null>(null);
  const [recoveryUser, setRecoveryUser] = useState<StoredUser | null>(null);

  // Get device fingerprint on mount
  useEffect(() => {
    generateDeviceFingerprint().then(fp => {
      setDeviceFingerprint(fp.fingerprint);
    });
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        // Check if email already exists
        const existing = UserStorage.findByEmail(email);
        if (existing) {
          toast.error('An account with this email already exists');
          setLoading(false);
          return;
        }

        // Proceed to face verification for registration
        setStep('face-verify');
      } else {
        // Login: verify credentials first
        const user = UserStorage.findByEmail(email);
        if (!user) {
          toast.error('Account not found');
          setLoading(false);
          return;
        }

        const hashedPassword = await hashPassword(password);
        if (user.passwordHash !== hashedPassword) {
          toast.error('Invalid password');
          setLoading(false);
          return;
        }

        // Store user for face verification step
        setPendingUser(user);
        setStep('face-verify');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerificationComplete = async (descriptor: Float32Array) => {
    setLoading(true);

    try {
      if (step === 'recovery') {
        // Recovery mode: find user by face
        const user = UserStorage.findByFace(descriptor);
        if (user) {
          setRecoveryUser(user);
          toast.success(`Account found! Your App ID is: ${user.appId}`);
          // Allow password reset
        } else {
          toast.error('No matching face found. Cannot recover account.');
        }
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        // Check if face already registered (prevent multiple accounts)
        const existingFace = UserStorage.findByFace(descriptor);
        if (existingFace) {
          toast.error(
            'This face is already registered with another account. One person = one account.'
          );
          setStep('credentials');
          setLoading(false);
          return;
        }

        // Create new user
        const hashedPassword = await hashPassword(password);
        const appId = generateAppId();
        const faceTemplate = btoa(JSON.stringify(descriptorToArray(descriptor)));

        const newUser: StoredUser = {
          email,
          passwordHash: hashedPassword,
          appId,
          faceTemplate,
          deviceFingerprint,
          createdAt: new Date().toISOString(),
        };

        UserStorage.add(newUser);

        toast.success(`Account created! Your App ID is: ${appId}`);
        setStep('complete');
      } else {
        // Login: verify face matches stored template
        if (!pendingUser) {
          toast.error('Session expired. Please try again.');
          setStep('credentials');
          setLoading(false);
          return;
        }

        try {
          const storedDescriptor = arrayToDescriptor(
            JSON.parse(atob(pendingUser.faceTemplate))
          );

          if (facesMatch(descriptor, storedDescriptor, 0.5)) {
            // Update device fingerprint on successful login
            UserStorage.update(pendingUser.email, { deviceFingerprint });

            toast.success('Login successful!');
            setStep('complete');

            // Navigate to main app after delay
            setTimeout(() => navigate('/'), 1500);
          } else {
            toast.error('Face does not match. Access denied.');
            setStep('credentials');
          }
        } catch (e) {
          toast.error('Failed to verify face template');
          setStep('credentials');
        }
      }
    } catch (error) {
      toast.error('Verification failed');
      setStep('credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = () => {
    setStep('recovery');
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!recoveryUser) return;

    const hashedPassword = await hashPassword(newPassword);
    UserStorage.update(recoveryUser.email, { passwordHash: hashedPassword });
    toast.success('Password reset successfully!');
    setStep('credentials');
    setMode('login');
    setRecoveryUser(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <motion.div 
            className="size-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Shield className="size-6 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Secure Login
            </h1>
            <p className="text-xs text-primary font-medium tracking-widest uppercase">
              Biometric Verification
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl">
          {/* Step indicator */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <StepIndicator active={step === 'credentials'} completed={step !== 'credentials'} label="1" />
            <div className={`w-8 h-0.5 ${step !== 'credentials' ? 'bg-primary' : 'bg-muted'}`} />
            <StepIndicator active={step === 'face-verify' || step === 'recovery'} completed={step === 'complete'} label="2" />
            <div className={`w-8 h-0.5 ${step === 'complete' ? 'bg-green-500' : 'bg-muted'}`} />
            <StepIndicator active={step === 'complete'} completed={false} label="✓" isComplete={step === 'complete'} />
          </div>

          {/* Credentials Step */}
          {step === 'credentials' && (
            <>
              <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {mode === 'login'
                  ? 'Sign in with email + face verification'
                  : 'Register with biometric security'}
              </p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Display Name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="pl-10 h-11 bg-muted/50 border-border"
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 border-border"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 gradient-primary font-semibold mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Continue to Face Verification
                      <ArrowRight className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <span className="font-medium text-primary">
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </span>
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleRecovery}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
                  >
                    Forgot App ID or Password? Recover with face
                  </button>
                )}
              </div>
            </>
          )}

          {/* Face Verification Step */}
          {(step === 'face-verify' || step === 'recovery') && (
            <>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Fingerprint className="size-5 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">
                  {step === 'recovery'
                    ? 'Face Recovery'
                    : mode === 'register'
                    ? 'Register Your Face'
                    : 'Verify Your Face'}
                </h2>
              </div>

              <FaceVerificationCamera
                mode={mode === 'register' ? 'register' : 'verify'}
                onVerificationComplete={handleFaceVerificationComplete}
                onError={error => {
                  toast.error(error);
                  setStep('credentials');
                }}
              />

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setStep('credentials')}
              >
                ← Back to credentials
              </Button>
            </>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <Shield className="size-10 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                {mode === 'register' ? 'Account Created!' : 'Welcome Back!'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {mode === 'register'
                  ? 'Your biometric identity has been securely registered.'
                  : 'Face verification successful.'}
              </p>
              {mode === 'register' && (
                <p className="text-xs text-primary font-mono bg-muted/50 rounded p-2">
                  Save your App ID: {UserStorage.findByEmail(email)?.appId}
                </p>
              )}
            </div>
          )}

          {/* Recovery result */}
          {recoveryUser && (
            <div className="mt-4 p-4 bg-green-500/10 rounded-lg">
              <h3 className="font-semibold text-green-500 mb-2">Account Found!</h3>
              <p className="text-sm text-muted-foreground">
                Email: {recoveryUser.email}
              </p>
              <p className="text-sm text-muted-foreground">
                App ID: {recoveryUser.appId}
              </p>
              <Input
                type="password"
                placeholder="Enter new password"
                className="mt-3"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleResetPassword((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Press Enter to reset password
              </p>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <AlertTriangle className="size-4" />
          <span className="text-xs">
            Demo: Data stored in localStorage. Use proper backend in production.
          </span>
        </div>

        {/* Device Fingerprint */}
        {deviceFingerprint && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-muted-foreground font-mono">
              Device: {deviceFingerprint.substring(0, 16)}...
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
