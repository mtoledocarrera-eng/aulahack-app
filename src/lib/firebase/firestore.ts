import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./index";
import type { ProjectPlan } from "@/lib/ai/schemas";

// ─── Collections ─────────────────────────────────────────────────
const COLLECTIONS = {
    PLANS: "lesson_plans",
    TEACHERS: "teachers",
    SETTINGS: "settings",
} as const;

// ─── Teacher Profile CRUD ────────────────────────────────────────

export interface StoredTeacherProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    isPremium: boolean;
    subscriptionEndsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getTeacherProfile(uid: string): Promise<StoredTeacherProfile | null> {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, COLLECTIONS.TEACHERS, uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        uid: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        isPremium: data.isPremium ?? false,
        subscriptionEndsAt: data.subscriptionEndsAt?.toDate() ?? null,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
}

export async function createOrUpdateTeacherProfile(
    uid: string,
    data: Partial<Omit<StoredTeacherProfile, "uid" | "createdAt" | "updatedAt">>
): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, COLLECTIONS.TEACHERS, uid);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
        await setDoc(docRef, {
            ...data,
            isPremium: data.isPremium ?? false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    } else {
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }
}

// ─── Lesson Plan CRUD ────────────────────────────────────────────

export interface StoredLessonPlan {
    id: string;
    teacherUid: string;
    plan: ProjectPlan;
    createdAt: Date;
    updatedAt: Date;
    subject: string;
    level: string;
    title: string;
    versions?: { version: number; updatedAt: Date; plan: ProjectPlan }[];
}

export async function saveLessonPlan(
    teacherUid: string,
    plan: ProjectPlan,
    meta: { subject: string; level: string; title: string }
): Promise<string> {
    const db = getFirebaseDb();
    const docRef = await addDoc(collection(db, COLLECTIONS.PLANS), {
        teacherUid,
        plan,
        ...meta,
        versions: [{ version: 1, updatedAt: Timestamp.now(), plan }],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function getLessonPlan(planId: string): Promise<StoredLessonPlan | null> {
    const db = getFirebaseDb();
    const docSnap = await getDoc(doc(db, COLLECTIONS.PLANS, planId));
    if (!docSnap.exists()) return null;
    return mapDocToStoredPlan(docSnap.id, docSnap.data());
}

export async function getTeacherPlans(teacherUid: string): Promise<StoredLessonPlan[]> {
    const db = getFirebaseDb();
    try {
        // Query con índice compuesto (teacherUid + createdAt desc)
        const q = query(
            collection(db, COLLECTIONS.PLANS),
            where("teacherUid", "==", teacherUid),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => mapDocToStoredPlan(d.id, d.data()));
    } catch (error: unknown) {
        // Firestore lanza error si el índice no existe o está construyéndose.
        // Fallback: traer planes sin ordenar para no romper la UX.
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("index") || msg.includes("Index")) {
            console.warn("[Firestore] Índice compuesto no disponible. Usando fallback sin orderBy:", msg);
            const fallbackQ = query(
                collection(db, COLLECTIONS.PLANS),
                where("teacherUid", "==", teacherUid)
            );
            const snapshot = await getDocs(fallbackQ);
            const plans = snapshot.docs.map((d) => mapDocToStoredPlan(d.id, d.data()));
            // Ordenar en memoria como fallback
            return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        throw error;
    }
}

export async function updateLessonPlan(
    planId: string,
    updates: Partial<Pick<StoredLessonPlan, "plan" | "title">>
): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, COLLECTIONS.PLANS, planId);

    if (updates.plan) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const currentVersions = data.versions || [];
            const newVersionNum = currentVersions.length > 0 ? currentVersions[currentVersions.length - 1].version + 1 : 2;

            await updateDoc(docRef, {
                ...updates,
                versions: [...currentVersions, { version: newVersionNum, updatedAt: Timestamp.now(), plan: updates.plan }],
                updatedAt: Timestamp.now(),
            });
            return;
        }
    }

    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteLessonPlan(planId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, COLLECTIONS.PLANS, planId));
}

// ─── Helpers ─────────────────────────────────────────────────────

function mapDocToStoredPlan(id: string, data: DocumentData): StoredLessonPlan {
    return {
        id,
        teacherUid: data.teacherUid,
        plan: data.plan,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        subject: data.subject,
        level: data.level,
        title: data.title,
        versions: data.versions?.map((v: any) => ({
            version: v.version,
            updatedAt: v.updatedAt?.toDate() ?? new Date(),
            plan: v.plan
        })) ?? []
    };
}
