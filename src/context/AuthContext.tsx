import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ADMIN_EMAIL, auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { digitsOnly } from '../lib/validators';
import type { MembershipCycle, MembershipTier, TShirtSize, UserAffiliation, UserProfile } from '../types/domain';

const DEMO_USER_STORAGE = 'camblu.demo.user';
const DEMO_REGISTRY_STORAGE = 'camblu.demo.userRegistry';
const DEMO_AVATAR_URL = '/demo-google-avatar.svg';

export interface ProfileInput {
  name: string;
  cpf: string;
  phone: string;
  affiliation: UserAffiliation;
  turma?: string;
  isCalouro: boolean;
  tshirtSize?: TShirtSize;
}

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  signInWithGoogle: (demoRole?: 'student' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<void>;
  updateMembershipLocal: (tier: MembershipTier, cycle: MembershipCycle) => Promise<void>;
  findDemoUserByCpf: (cpf: string) => UserProfile | null;
  allDemoUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_DEMO_REGISTRY: UserProfile[] = [
  {
    uid: 'demo-student-1',
    name: 'Marina Souza',
    email: 'marina.demo@furb.br',
    photoURL: DEMO_AVATAR_URL,
    cpf: '52998224725',
    phone: '47999887766',
    affiliation: 'FURB',
    turma: '63',
    isCalouro: true,
    tshirtSize: 'M',
    membershipTier: 'raro',
    membershipCycle: 'semestral',
    membershipActive: true,
    membershipValidUntil: '2027-03-01T00:00:00.000Z',
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    uid: 'demo-student-2',
    name: 'Lucas Pereira',
    email: 'lucas.demo@furb.br',
    photoURL: DEMO_AVATAR_URL,
    cpf: '39053344705',
    phone: '47991112233',
    affiliation: 'FURB',
    turma: '61',
    isCalouro: false,
    membershipTier: 'lendario',
    membershipCycle: 'mensal',
    membershipActive: true,
    membershipValidUntil: '2026-12-30T00:00:00.000Z',
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    uid: 'demo-student-3',
    name: 'Camila Zimmermann',
    email: 'camila.z@furb.br',
    photoURL: DEMO_AVATAR_URL,
    cpf: '61428910032',
    phone: '47992345678',
    affiliation: 'FURB',
    turma: '60',
    isCalouro: false,
    membershipTier: 'epico',
    membershipCycle: 'mensal',
    membershipActive: true,
    membershipValidUntil: '2026-12-20T00:00:00.000Z',
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
  {
    uid: 'demo-student-4',
    name: 'Gabriel Tavares',
    email: 'gabriel.t@furb.br',
    photoURL: DEMO_AVATAR_URL,
    cpf: '47829130019',
    phone: '47993456789',
    affiliation: 'FURB',
    turma: '63',
    isCalouro: true,
    tshirtSize: 'G',
    membershipTier: 'comum',
    membershipCycle: 'semestral',
    membershipActive: true,
    membershipValidUntil: '2027-02-28T00:00:00.000Z',
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
  },
  {
    uid: 'demo-student-5',
    name: 'Beatriz Kretzer',
    email: 'beatriz.k@furb.br',
    photoURL: DEMO_AVATAR_URL,
    cpf: '88234150021',
    phone: '47994567890',
    affiliation: 'FURB',
    turma: '62',
    isCalouro: false,
    membershipTier: 'none',
    membershipActive: false,
    membershipValidUntil: null,
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
];

function withDemoAvatar(user: UserProfile): UserProfile {
  return user.photoURL ? user : { ...user, photoURL: DEMO_AVATAR_URL };
}

function readRegistry(): UserProfile[] {
  try {
    const raw = localStorage.getItem(DEMO_REGISTRY_STORAGE);
    if (!raw) return INITIAL_DEMO_REGISTRY;
    const saved = (JSON.parse(raw) as UserProfile[]).map(withDemoAvatar);
    const missingSeeds = INITIAL_DEMO_REGISTRY.filter(
      (seed) => !saved.some((u) => u.uid === seed.uid),
    );
    return missingSeeds.length > 0 ? [...saved, ...missingSeeds] : saved;
  } catch {
    return INITIAL_DEMO_REGISTRY;
  }
}

function writeRegistry(users: UserProfile[]) {
  try {
    localStorage.setItem(DEMO_REGISTRY_STORAGE, JSON.stringify(users));
  } catch {
    // ignore quota issues
  }
}

function defaultProfileFromFirebase(user: User): UserProfile {
  const email = (user.email || '').toLowerCase();
  const now = new Date().toISOString();
  return {
    uid: user.uid,
    name: user.displayName || 'Acadêmico(a) CAMBLU',
    email,
    photoURL: user.photoURL || undefined,
    cpf: '',
    phone: '',
    affiliation: 'FURB',
    turma: '',
    isCalouro: false,
    membershipTier: 'none',
    membershipActive: false,
    membershipValidUntil: null,
    role: email === ADMIN_EMAIL ? 'admin' : 'student',
    profileCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<UserProfile[]>(() => readRegistry());

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      try {
        const saved = localStorage.getItem(DEMO_USER_STORAGE);
        if (saved) setProfile(withDemoAvatar(JSON.parse(saved) as UserProfile));
      } catch {
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db!, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          const isAdm = (fbUser.email || '').toLowerCase() === ADMIN_EMAIL;
          const freshPhoto = fbUser.photoURL || data.photoURL || undefined;
          if (
            fbUser.photoURL &&
            fbUser.photoURL !== data.photoURL &&
            (data.name || '').trim().length >= 2
          ) {
            void setDoc(
              ref,
              { photoURL: fbUser.photoURL, updatedAt: new Date().toISOString() },
              { merge: true },
            ).catch(() => {});
          }
          setProfile({
            ...data,
            photoURL: freshPhoto,
            role: isAdm ? 'admin' : data.role,
          });
        } else {
          const fresh = defaultProfileFromFirebase(fbUser);
          await setDoc(ref, fresh);
          setProfile(fresh);
        }
      } catch {
        setProfile(defaultProfileFromFirebase(fbUser));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const persistDemoProfile = (next: UserProfile) => {
    setProfile(next);
    localStorage.setItem(DEMO_USER_STORAGE, JSON.stringify(next));
    setRegistry((prev) => {
      const filtered = prev.filter((u) => u.uid !== next.uid);
      const updated = [...filtered, next];
      writeRegistry(updated);
      return updated;
    });
  };

  const signInWithGoogle = async (demoRole: 'student' | 'admin' = 'student') => {
    if (isFirebaseConfigured && auth) {
      await signInWithPopup(auth, googleProvider);
      return;
    }

    const now = new Date().toISOString();
    const targetEmail = demoRole === 'admin' ? ADMIN_EMAIL : 'marina.demo@furb.br';
    const existing = registry.find((u) => u.email.toLowerCase() === targetEmail);
    if (existing) {
      persistDemoProfile(existing);
      return;
    }

    const adminUser: UserProfile = {
      uid: demoRole === 'admin' ? 'camblu-admin-demo' : 'demo-student-new',
      name: demoRole === 'admin' ? 'Gestão CAMBLU (Admin)' : 'Estudante Demo MEDFURB',
      email: targetEmail,
      photoURL: DEMO_AVATAR_URL,
      cpf: demoRole === 'admin' ? '52998224725' : '',
      phone: demoRole === 'admin' ? '4733210277' : '',
      affiliation: 'FURB',
      turma: demoRole === 'admin' ? '63' : '',
      isCalouro: false,
      membershipTier: demoRole === 'admin' ? 'lendario' : 'none',
      membershipCycle: demoRole === 'admin' ? 'semestral' : undefined,
      membershipActive: demoRole === 'admin',
      membershipValidUntil: demoRole === 'admin' ? '2027-06-30T00:00:00.000Z' : null,
      role: demoRole === 'admin' ? 'admin' : 'student',
      profileCompleted: demoRole === 'admin',
      createdAt: now,
      updatedAt: now,
    };
    persistDemoProfile(adminUser);
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
      setProfile(null);
      return;
    }
    localStorage.removeItem(DEMO_USER_STORAGE);
    setProfile(null);
  };

  const saveProfile = async (input: ProfileInput) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      name: input.name.trim(),
      cpf: digitsOnly(input.cpf),
      phone: digitsOnly(input.phone),
      affiliation: input.affiliation,
      turma: input.affiliation === 'FURB' ? digitsOnly(input.turma || '') : undefined,
      isCalouro: input.isCalouro,
      tshirtSize: input.isCalouro ? input.tshirtSize : undefined,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', profile.uid), updated, { merge: true });
      setProfile(updated);
      return;
    }
    persistDemoProfile(updated);
  };

  const updateMembershipLocal = async (tier: MembershipTier, cycle: MembershipCycle) => {
    if (!profile) return;
    const months = cycle === 'mensal' ? 1 : 6;
    const valid = new Date();
    valid.setMonth(valid.getMonth() + months);
    const updated: UserProfile = {
      ...profile,
      membershipTier: tier,
      membershipCycle: cycle,
      membershipActive: tier !== 'none',
      membershipValidUntil: tier === 'none' ? null : valid.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', profile.uid), updated, { merge: true });
      setProfile(updated);
      return;
    }
    persistDemoProfile(updated);
  };

  const findDemoUserByCpf = (cpf: string) => {
    const target = digitsOnly(cpf);
    return registry.find((u) => digitsOnly(u.cpf) === target) || null;
  };

  const isAdmin = Boolean(profile && (profile.email.toLowerCase() === ADMIN_EMAIL || profile.role === 'admin'));

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isAdmin,
        isDemoMode: !isFirebaseConfigured,
        signInWithGoogle,
        signOut,
        saveProfile,
        updateMembershipLocal,
        findDemoUserByCpf,
        allDemoUsers: registry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
