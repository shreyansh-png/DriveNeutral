import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [city, setCity] = useState(() => localStorage.getItem('dn_city') || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password, selectedCity) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setCity(selectedCity);
        localStorage.setItem('dn_city', selectedCity);
        setUser(data.user);
        return data;
    };

    const signUp = async (email, password, selectedCity) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setCity(selectedCity);
        localStorage.setItem('dn_city', selectedCity);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCity('');
        localStorage.removeItem('dn_city');
    };

    const updateCity = (newCity) => {
        setCity(newCity);
        localStorage.setItem('dn_city', newCity);
    };

    return (
        <AuthContext.Provider value={{ user, city, loading, login, signUp, logout, updateCity }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
