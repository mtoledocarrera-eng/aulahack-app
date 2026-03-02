import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
    type Unsubscribe,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "./index";

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

function mapUser(user: User): AuthUser {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
    };
}

export async function registerUser(
    email: string,
    password: string,
    displayName: string
): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return mapUser(credential.user);
}

export async function loginUser(
    email: string,
    password: string
): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(credential.user);
}

export async function loginWithGoogle(): Promise<AuthUser> {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    // Forzamos selección de cuenta por si el usuario tiene múltiples cuentas
    provider.setCustomParameters({
        prompt: "select_account"
    });
    const credential = await signInWithPopup(auth, provider);
    return mapUser(credential.user);
}

export async function logoutUser(): Promise<void> {
    const auth = getFirebaseAuth();
    await signOut(auth);
}

export function onAuthChange(callback: (user: AuthUser | null) => void): Unsubscribe {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
        callback(user ? mapUser(user) : null);
    });
}
