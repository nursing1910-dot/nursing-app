import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {doc, getDoc, serverTimestamp, setDoc} from 'firebase/firestore';
import {firebaseErrorToArabic} from '../lib/authErrors';
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../lib/firebase';
import {initAnalyticsWhenReady} from '../lib/analytics';

export type UserRole = 'patient' | 'nurse';

export type FirestoreUserProfile = {
  role: UserRole;
  email: string;
  phone?: string;
  address?: string;
  displayName?: string;
  graduationPlace?: string;
  nurseStatus?: 'pending' | 'approved';
  walletNote?: string;
  gender?: string;
};

type AuthStatus = 'unknown' | 'ready';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  profile: FirestoreUserProfile | null;
  signUpPatient: (input: {
    email: string;
    password: string;
    phone: string;
    address: string;
    displayLabel?: string;
  }) => Promise<void>;
  signUpNurse: (input: {
    email: string;
    password: string;
    phone: string;
    walletNote?: string;
    graduationPlace: string;
    gender: string;
  }) => Promise<void>;
  signInPatient: (email: string, password: string) => Promise<void>;
  signInNurse: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  firebaseConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(
  uid: string,
): Promise<FirestoreUserProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as FirestoreUserProfile;
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setStatus('ready');
      setUser(null);
      setProfile(null);
      return;
    }

    void initAnalyticsWhenReady();

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const p = await fetchProfile(firebaseUser.uid);
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setStatus('ready');
      }
    });

    return () => unsub();
  }, [configured]);

  const signUpPatient = useCallback(
    async (input: {
      email: string;
      password: string;
      phone: string;
      address: string;
      displayLabel?: string;
    }) => {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const normalizedEmail = input.email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        input.password,
      );

      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'patient' as const,
        email: normalizedEmail,
        phone: input.phone.trim(),
        address: input.address.trim(),
        displayName: input.displayLabel?.trim() ?? '',
        createdAt: serverTimestamp(),
      });

      if (input.displayLabel?.trim()) {
        await updateProfile(cred.user, {
          displayName: input.displayLabel.trim(),
        });
      }

      await cred.user.reload();
    },
    [],
  );

  const signUpNurse = useCallback(
    async (input: {
      email: string;
      password: string;
      phone: string;
      walletNote?: string;
      graduationPlace: string;
      gender: string;
    }) => {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const normalizedEmail = input.email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        input.password,
      );

      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'nurse' as const,
        email: normalizedEmail,
        phone: input.phone.trim(),
        walletNote: input.walletNote?.trim() ?? '',
        graduationPlace: input.graduationPlace.trim(),
        gender: input.gender,
        nurseStatus: 'pending' as const,
        createdAt: serverTimestamp(),
      });
    },
    [],
  );

  const signInPatient = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const normalizedEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      const p = await fetchProfile(cred.user.uid);
      if (!p || p.role !== 'patient') {
        await firebaseSignOut(auth);
        throw new Error('هذا الحساب ليس حساب مريض.');
      }
    },
    [],
  );

  const signInNurse = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const normalizedEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      const p = await fetchProfile(cred.user.uid);
      if (!p || p.role !== 'nurse') {
        await firebaseSignOut(auth);
        throw new Error('هذا الحساب ليس حساب مقدم خدمة.');
      }
    },
    [],
  );

  const signOutUser = useCallback(async () => {
    if (!configured) return;
    await firebaseSignOut(getFirebaseAuth());
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      signUpPatient,
      signUpNurse,
      signInPatient,
      signInNurse,
      signOutUser,
      firebaseConfigured: configured,
    }),
    [
      status,
      user,
      profile,
      signUpPatient,
      signUpNurse,
      signInPatient,
      signInNurse,
      signOutUser,
      configured,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return ctx;
}

export async function withAuthErrorHandling<T>(
  fn: () => Promise<T>,
  setMessage: (msg: string) => void,
): Promise<boolean> {
  try {
    await fn();
    setMessage('');
    return true;
  } catch (e) {
    setMessage(firebaseErrorToArabic(e));
    return false;
  }
}
