"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, onAuthChange } from "@/lib/firebase/auth";
import { getTeacherProfile, createOrUpdateTeacherProfile } from "@/lib/firebase/firestore";

interface ExtendedAuthUser extends AuthUser {
    isPremium?: boolean;
}

interface AuthContextType {
    user: ExtendedAuthUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<ExtendedAuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (authUser) => {
            if (authUser) {
                let profile = await getTeacherProfile(authUser.uid);
                if (!profile) {
                    await createOrUpdateTeacherProfile(authUser.uid, {
                        email: authUser.email,
                        displayName: authUser.displayName,
                        isPremium: false,
                        subscriptionEndsAt: null,
                    });
                    profile = await getTeacherProfile(authUser.uid);
                }
                setUser({ ...authUser, isPremium: profile?.isPremium ?? false });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
