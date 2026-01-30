import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Models } from 'appwrite';

// Definisi Tipe Data Context
interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    checkUserStatus: () => Promise<void>;
}

// Inisialisasi Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkUserStatus = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            console.error("[Auth] Check Status Failed:", error);
            setUser(null); // Paksa logout jika error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkUserStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, checkUserStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook untuk mempermudah pemakaian
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
