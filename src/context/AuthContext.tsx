import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth';
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { ADMIN_EMAIL, API_BASE_URL, auth, db, getAuthHeaders, googleProvider, isFirebaseConfigured, storage } from '../lib/firebase';
import { logError, logInfo, logWarn } from '../lib/logger';
import { stripUndefinedDeep } from '../lib/objectUtils';
import { resolveSemesterWindow } from '../lib/memberCard';
import { digitsOnly } from '../lib/validators';
import type { MembershipCycle, MembershipTier, TShirtSize, UserAffiliation, UserProfile } from '../types/domain';

const DEMO_USER_STORAGE = 'camblu.demo.user';
const DEMO_REGISTRY_STORAGE = 'camblu.demo.userRegistry';
const DEMO_AVATAR_URL = '/demo-google-avatar.svg';
const ENROLLMENT_PDF_MAX_BYTES = 10 * 1024 * 1024;
const DEMO_PDF_MAX_BYTES = 2 * 1024 * 1024;

export interface ProfileInput {
  name: string;
  cpf: string;
  phone: string;
  affiliation: UserAffiliation;
  turma?: string;
  isCalouro: boolean;
  tshirtSize?: TShirtSize;
  enrollmentSummaryUrl?: string | null;
  enrollmentSummaryFileName?: string | null;
  enrollmentSummaryUploadedAt?: string | null;
}

export interface EnrollmentUploadResult {
  url: string;
  fileName: string;
  uploadedAt: string;
}

export interface EnrollmentVerifyResult {
  verified: boolean;
  semester: string;
  validUntil: string | null;
  verifiedAt: string;
  reason: string;
}

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  signInWithGoogle: (demoRole?: 'student' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<void>;
  uploadEnrollmentSummaryPdf: (file: File) => Promise<EnrollmentUploadResult>;
  verifyEnrollmentSummary: () => Promise<EnrollmentVerifyResult>;
  removeEnrollmentSummaryPdf: () => Promise<void>;
  updateMembershipLocal: (tier: MembershipTier, cycle: MembershipCycle) => Promise<void>;
  cancelClubMembership: () => Promise<void>;
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
  const cleanName = (user.displayName || 'Acadêmico(a) CAMBLU').trim().slice(0, 140) || 'Acadêmico(a) CAMBLU';
  return {
    uid: user.uid,
    name: cleanName,
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
      logInfo('Auth', 'Modo demonstração ativo; restaurando sessão do localStorage');
      try {
        const saved = localStorage.getItem(DEMO_USER_STORAGE);
        if (saved) setProfile(withDemoAvatar(JSON.parse(saved) as UserProfile));
      } catch (err) {
        logError('Auth', 'AuthContext.loadDemoStorage', err);
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    logInfo('Auth', 'Registrando listener Firebase onAuthStateChanged');
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        logInfo('Auth', 'Usuário desconectado (onAuthStateChanged: null)');
        setProfile(null);
        setLoading(false);
        return;
      }
      logInfo('Auth', 'Sessão Firebase detectada', {
        uid: fbUser.uid,
        email: fbUser.email,
        emailVerified: fbUser.emailVerified,
        hasPhotoURL: Boolean(fbUser.photoURL),
      });
      try {
        const ref = doc(db!, 'users', fbUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          const isAdm = (fbUser.email || '').toLowerCase() === ADMIN_EMAIL;
          const freshPhoto = fbUser.photoURL || data.photoURL || undefined;
          logInfo('Auth', 'Perfil Firestore carregado', {
            uid: fbUser.uid,
            role: isAdm ? 'admin' : data.role,
            profileCompleted: data.profileCompleted,
            hasPhotoURL: Boolean(freshPhoto),
          });
          if (
            fbUser.photoURL &&
            fbUser.photoURL !== data.photoURL &&
            (data.name || '').trim().length >= 2
          ) {
            void updateDoc(ref, {
              photoURL: fbUser.photoURL,
              updatedAt: new Date().toISOString(),
            }).catch((err) => {
              logWarn('Auth', 'Falha não-crítica ao sincronizar photoURL do Google no Firestore', err);
            });
          }
          setProfile({
            ...data,
            photoURL: freshPhoto,
            role: isAdm ? 'admin' : data.role,
          });
        } else {
          const fresh = defaultProfileFromFirebase(fbUser);
          logInfo('Auth', 'Criando novo documento de perfil no Firestore users/{uid}', {
            uid: fbUser.uid,
            email: fresh.email,
          });
          await setDoc(ref, stripUndefinedDeep(fresh));
          setProfile(fresh);
        }
      } catch (err) {
        logError('Auth', 'AuthContext.onAuthStateChanged -> getDoc/setDoc users', err, {
          uid: fbUser.uid,
          email: fbUser.email,
        });
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
      logInfo('Auth', 'Abrindo popup Google Sign-In');
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        logInfo('Auth', 'Google Sign-In autenticado com sucesso', {
          uid: cred.user.uid,
          email: cred.user.email,
          hasPhotoURL: Boolean(cred.user.photoURL),
        });
      } catch (err) {
        logError('Auth', 'AuthContext.signInWithGoogle -> signInWithPopup', err);
        throw err;
      }
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
    const now = new Date().toISOString();
    const cleanName = input.name.trim().slice(0, 140);
    const isFurb = input.affiliation === 'FURB';
    const cleanTurma = isFurb ? digitsOnly(input.turma || '').slice(0, 12) : undefined;
    const cleanTshirt = input.isCalouro ? input.tshirtSize : undefined;

    const resolvedEnrollmentUrl = !isFurb
      ? undefined
      : input.enrollmentSummaryUrl === null
        ? undefined
        : input.enrollmentSummaryUrl !== undefined
          ? input.enrollmentSummaryUrl
          : profile.enrollmentSummaryUrl;
    const resolvedEnrollmentFileName =
      resolvedEnrollmentUrl && isFurb
        ? input.enrollmentSummaryFileName ?? profile.enrollmentSummaryFileName
        : undefined;
    const resolvedEnrollmentUploadedAt =
      resolvedEnrollmentUrl && isFurb
        ? input.enrollmentSummaryUploadedAt ?? profile.enrollmentSummaryUploadedAt
        : undefined;

    const updated: UserProfile = {
      ...profile,
      name: cleanName,
      cpf: digitsOnly(input.cpf).slice(0, 14),
      phone: digitsOnly(input.phone).slice(0, 20),
      affiliation: input.affiliation,
      turma: cleanTurma,
      isCalouro: input.isCalouro,
      tshirtSize: cleanTshirt,
      enrollmentSummaryUrl: resolvedEnrollmentUrl,
      enrollmentSummaryFileName: resolvedEnrollmentFileName,
      enrollmentSummaryUploadedAt: resolvedEnrollmentUploadedAt,
      profileCompleted: true,
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      logInfo('Auth', 'Salvando perfil do usuário no Firestore users/{uid}', {
        uid: profile.uid,
        affiliation: updated.affiliation,
        isCalouro: updated.isCalouro,
        hasEnrollmentPdf: Boolean(updated.enrollmentSummaryUrl),
      });
      try {
        const userRef = doc(db, 'users', profile.uid);
        const existingSnap = await getDoc(userRef);

        if (existingSnap.exists()) {
          // Only touch user-editable fields so Firestore immutableKeys rules never reject updates.
          await updateDoc(userRef, {
            name: updated.name,
            cpf: updated.cpf,
            phone: updated.phone,
            affiliation: updated.affiliation,
            turma: isFurb ? cleanTurma || '' : deleteField(),
            isCalouro: updated.isCalouro,
            tshirtSize: cleanTshirt ?? deleteField(),
            enrollmentSummaryUrl: resolvedEnrollmentUrl ?? deleteField(),
            enrollmentSummaryFileName: resolvedEnrollmentFileName ?? deleteField(),
            enrollmentSummaryUploadedAt: resolvedEnrollmentUploadedAt ?? deleteField(),
            ...(updated.photoURL ? { photoURL: updated.photoURL } : {}),
            profileCompleted: true,
            updatedAt: now,
          });
          logInfo('Auth', 'Perfil atualizado via updateDoc em users/{uid}', { uid: profile.uid });
        } else {
          const emailLower = (profile.email || '').toLowerCase();
          const createPayload: UserProfile = {
            ...updated,
            email: emailLower,
            role: emailLower === ADMIN_EMAIL ? 'admin' : 'student',
            membershipTier: 'none',
            membershipActive: false,
            membershipValidUntil: null,
            createdAt: profile.createdAt || now,
          };
          await setDoc(userRef, stripUndefinedDeep(createPayload));
          logInfo('Auth', 'Documento users/{uid} criado via saveProfile', { uid: profile.uid });
        }

        if (!isFurb && profile.enrollmentSummaryUrl && storage) {
          void deleteObject(
            storageRef(storage, `enrollment-summaries/${profile.uid}/resumo-matricula.pdf`),
          ).catch(() => {
            // Ignora ausência do arquivo no bucket ao alternar para vínculo externo.
          });
        }

        setProfile(updated);
      } catch (err) {
        logError('Auth', 'AuthContext.saveProfile -> setDoc/updateDoc users', err, { uid: profile.uid });
        throw err;
      }
      return;
    }
    persistDemoProfile(updated);
  };

  const uploadEnrollmentSummaryPdf = async (file: File): Promise<EnrollmentUploadResult> => {
    if (!profile) {
      throw new Error('Faça login para enviar o resumo de matrícula.');
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('Envie um arquivo em formato PDF válido (.pdf).');
    }
    if (file.size > ENROLLMENT_PDF_MAX_BYTES) {
      throw new Error('O PDF do resumo de matrícula deve ter no máximo 10 MB.');
    }

    const cleanFileName = (file.name || 'resumo-matricula.pdf').trim().slice(0, 140) || 'resumo-matricula.pdf';
    const uploadedAt = new Date().toISOString();

    if (isFirebaseConfigured && storage && db) {
      logInfo('Perfil', 'Enviando resumo de matrícula PDF para Firebase Storage', {
        uid: profile.uid,
        fileName: cleanFileName,
        bytes: file.size,
      });
      try {
        const fileRef = storageRef(storage, `enrollment-summaries/${profile.uid}/resumo-matricula.pdf`);
        await uploadBytes(fileRef, file, {
          contentType: 'application/pdf',
          contentDisposition: 'inline; filename="resumo-matricula.pdf"',
        });
        const url = await getDownloadURL(fileRef);

        const userRef = doc(db, 'users', profile.uid);
        const existingSnap = await getDoc(userRef);
        if (existingSnap.exists()) {
          await updateDoc(userRef, {
            enrollmentSummaryUrl: url,
            enrollmentSummaryFileName: cleanFileName,
            enrollmentSummaryUploadedAt: uploadedAt,
            updatedAt: uploadedAt,
          });
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                enrollmentSummaryUrl: url,
                enrollmentSummaryFileName: cleanFileName,
                enrollmentSummaryUploadedAt: uploadedAt,
              }
            : prev,
        );
        logInfo('Perfil', 'Resumo de matrícula PDF salvo com sucesso', { uid: profile.uid });
        return { url, fileName: cleanFileName, uploadedAt };
      } catch (err) {
        logError('Perfil', 'AuthContext.uploadEnrollmentSummaryPdf -> Storage/Firestore', err, {
          uid: profile.uid,
        });
        throw err;
      }
    }

    if (file.size > DEMO_PDF_MAX_BYTES) {
      throw new Error('No modo demonstração local, o PDF deve ter até 2 MB.');
    }

    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Não foi possível ler o PDF selecionado.'));
      reader.readAsDataURL(file);
    });

    persistDemoProfile({
      ...profile,
      enrollmentSummaryUrl: url,
      enrollmentSummaryFileName: cleanFileName,
      enrollmentSummaryUploadedAt: uploadedAt,
      updatedAt: uploadedAt,
    });
    return { url, fileName: cleanFileName, uploadedAt };
  };

  const verifyEnrollmentSummary = async (): Promise<EnrollmentVerifyResult> => {
    if (!profile) {
      throw new Error('Faça login para verificar o resumo de matrícula.');
    }

    if (isFirebaseConfigured && auth && db) {
      logInfo('Perfil', 'Solicitando verificação automática do resumo de matrícula', { uid: profile.uid });
      const headers = await getAuthHeaders();
      const resp = await fetch(`${API_BASE_URL}/profile/verify-enrollment`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = (await resp.json().catch(() => null)) as
        | (EnrollmentVerifyResult & { ok?: boolean; error?: string })
        | null;
      if (!resp.ok || !data || typeof data.verified !== 'boolean') {
        throw new Error(data?.error || 'Não foi possível verificar o resumo de matrícula.');
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              enrollmentVerified: data.verified,
              enrollmentVerifiedAt: data.verifiedAt,
              enrollmentVerifiedUntil: data.validUntil,
              enrollmentVerificationSemester: data.semester,
              enrollmentVerificationReason: data.reason,
            }
          : prev,
      );
      return {
        verified: data.verified,
        semester: data.semester,
        validUntil: data.validUntil,
        verifiedAt: data.verifiedAt,
        reason: data.reason,
      };
    }

    const nowIso = new Date().toISOString();
    const sem = resolveSemesterWindow();
    const demoResult: EnrollmentVerifyResult = {
      verified: true,
      semester: sem.semesterLabel,
      validUntil: sem.validUntilIso,
      verifiedAt: nowIso,
      reason: `Matrícula em Medicina na FURB confirmada para o semestre ${sem.semesterLabel} (modo demonstração).`,
    };
    persistDemoProfile({
      ...profile,
      enrollmentVerified: true,
      enrollmentVerifiedAt: nowIso,
      enrollmentVerifiedUntil: sem.validUntilIso,
      enrollmentVerificationSemester: sem.semesterLabel,
      enrollmentVerificationReason: demoResult.reason,
      updatedAt: nowIso,
    });
    return demoResult;
  };

  const removeEnrollmentSummaryPdf = async () => {
    if (!profile) return;
    const now = new Date().toISOString();

    if (isFirebaseConfigured && storage && db) {
      logInfo('Perfil', 'Removendo resumo de matrícula PDF do perfil', { uid: profile.uid });
      try {
        const fileRef = storageRef(storage, `enrollment-summaries/${profile.uid}/resumo-matricula.pdf`);
        await deleteObject(fileRef).catch((err) => {
          const code = (err as { code?: string })?.code;
          if (code !== 'storage/object-not-found') {
            throw err;
          }
        });

        const userRef = doc(db, 'users', profile.uid);
        const existingSnap = await getDoc(userRef);
        if (existingSnap.exists()) {
          await updateDoc(userRef, {
            enrollmentSummaryUrl: deleteField(),
            enrollmentSummaryFileName: deleteField(),
            enrollmentSummaryUploadedAt: deleteField(),
            updatedAt: now,
          });
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                enrollmentSummaryUrl: undefined,
                enrollmentSummaryFileName: undefined,
                enrollmentSummaryUploadedAt: undefined,
                enrollmentVerified: false,
                enrollmentVerifiedUntil: null,
                enrollmentVerificationReason: undefined,
              }
            : prev,
        );
        logInfo('Perfil', 'Resumo de matrícula PDF removido com sucesso', { uid: profile.uid });
      } catch (err) {
        logError('Perfil', 'AuthContext.removeEnrollmentSummaryPdf -> Storage/Firestore', err, {
          uid: profile.uid,
        });
        throw err;
      }
      return;
    }

    persistDemoProfile({
      ...profile,
      enrollmentSummaryUrl: undefined,
      enrollmentSummaryFileName: undefined,
      enrollmentSummaryUploadedAt: undefined,
      enrollmentVerified: false,
      enrollmentVerifiedUntil: null,
      enrollmentVerificationReason: undefined,
      updatedAt: now,
    });
  };

  const updateMembershipLocal = async (tier: MembershipTier, cycle: MembershipCycle) => {
    if (!profile) return;
    const months = cycle === 'mensal' ? 1 : 6;
    const nowIso = new Date().toISOString();
    const valid = new Date();
    valid.setMonth(valid.getMonth() + months);
    const updated: UserProfile = {
      ...profile,
      membershipTier: tier,
      membershipCycle: cycle,
      membershipActive: tier !== 'none',
      membershipSubscribedAt: tier === 'none' ? null : nowIso,
      membershipValidUntil: tier === 'none' ? null : valid.toISOString(),
      updatedAt: nowIso,
    };

    if (isFirebaseConfigured && db) {
      logInfo('Auth', 'Atualizando nível do Clube CAMBLU no Firestore users/{uid}', {
        uid: profile.uid,
        tier,
        cycle,
      });
      try {
        await setDoc(doc(db, 'users', profile.uid), stripUndefinedDeep(updated), { merge: true });
        setProfile(updated);
      } catch (err) {
        logError('Auth', 'AuthContext.updateMembershipLocal -> setDoc users', err, {
          uid: profile.uid,
          tier,
        });
        throw err;
      }
      return;
    }
    persistDemoProfile(updated);
  };

  const cancelClubMembership = async () => {
    if (!profile) return;
    const updatedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      logInfo('Auth', 'Cancelando assinatura do Clube CAMBLU via /api/club/cancel', { uid: profile.uid });
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/club/cancel`, {
          method: 'POST',
          headers,
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || `HTTP ${res.status} ao cancelar assinatura.`);
        }
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                membershipActive: false,
                membershipTier: 'none',
                membershipCycle: undefined,
                membershipValidUntil: null,
                updatedAt,
              }
            : prev,
        );
      } catch (err) {
        logError('Auth', 'AuthContext.cancelClubMembership -> POST /api/club/cancel', err, {
          uid: profile.uid,
        });
        throw err;
      }
      return;
    }

    persistDemoProfile({
      ...profile,
      membershipActive: false,
      membershipTier: 'none',
      membershipCycle: undefined,
      membershipValidUntil: null,
      updatedAt,
    });
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
        uploadEnrollmentSummaryPdf,
        verifyEnrollmentSummary,
        removeEnrollmentSummaryPdf,
        updateMembershipLocal,
        cancelClubMembership,
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
