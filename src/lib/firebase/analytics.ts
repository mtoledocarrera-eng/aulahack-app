import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "./index";

const COLLECTIONS = {
    FEEDBACK: "user_feedback",
    ANALYTICS: "analytics_events",
} as const;

export interface FeedbackData {
    userId: string | null;
    planId: string;
    rating: number;
    comment: string;
    userAgent?: string;
}

export async function saveUserFeedback(data: FeedbackData): Promise<string> {
    const db = getFirebaseDb();
    const docRef = await addDoc(collection(db, COLLECTIONS.FEEDBACK), {
        ...data,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export type AnalyticsEventType =
    | "plan_generated"
    | "ai_error_429"
    | "validation_error_zod"
    | "pdf_downloaded";

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    userId: string | null;
    metadata?: Record<string, any>;
}

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
        const db = getFirebaseDb();
        await addDoc(collection(db, COLLECTIONS.ANALYTICS), {
            ...event,
            createdAt: Timestamp.now(),
        });
    } catch (e) {
        // Silently fail telemetry so it doesn't break the user experience
        console.warn("[Analytics] Failed to log event:", e);
    }
}

export async function getLatestFeedback(limitCount = 50) {
    const { getDocs, query, orderBy, limit } = await import("firebase/firestore");
    const db = getFirebaseDb();
    const q = query(
        collection(db, COLLECTIONS.FEEDBACK),
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
    }));
}

export async function getAnalyticsSummary() {
    const { getDocs, query, where } = await import("firebase/firestore");
    const db = getFirebaseDb();
    const snapshot = await getDocs(collection(db, COLLECTIONS.ANALYTICS));

    const summary = {
        plan_generated: 0,
        ai_error_429: 0,
        validation_error_zod: 0,
        pdf_downloaded: 0,
    };

    snapshot.forEach(doc => {
        const type = doc.data().type as keyof typeof summary;
        if (summary[type] !== undefined) {
            summary[type]++;
        }
    });

    return summary;
}
