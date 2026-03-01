import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    updateEmail: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (password: string) => Promise<{ error: string | null }>;
    updateName: (name: string) => Promise<{ error: string | null }>;
    disableAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.user_metadata?.disabled) {
                supabase.auth.signOut();
                setSession(null);
                setUser(null);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
            }
            setIsLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user?.user_metadata?.disabled) {
                    await supabase.auth.signOut();
                    setSession(null);
                    setUser(null);
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            return { error: error.message };
        }

        if (data?.user?.user_metadata?.disabled) {
            await supabase.auth.signOut();
            return { error: "Your account is disabled. In order to be re-enabled, please contact support." };
        }

        return { error: null };
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateEmail = async (email: string) => {
        const { error } = await supabase.auth.updateUser({ email });
        return { error: error ? error.message : null };
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error ? error.message : null };
    };

    const updateName = async (name: string) => {
        const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
        return { error: error ? error.message : null };
    };

    const disableAccount = async () => {
        const { error } = await supabase.auth.updateUser({ data: { disabled: true } });
        if (!error) {
            await signOut();
        }
        return { error: error ? error.message : null };
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updateEmail, updatePassword, updateName, disableAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
