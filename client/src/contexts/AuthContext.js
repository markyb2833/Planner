import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Logout function defined first so it can be used in useEffect
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Disconnect socket
        socketService.disconnect();
    };

    useEffect(() => {
        // Check if user is logged in on mount
        const initAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));

                    // Verify token is still valid
                    const response = await authAPI.getCurrentUser();
                    setUser(response.data.user);
                    localStorage.setItem('user', JSON.stringify(response.data.user));

                    // Connect socket
                    socketService.connect(storedToken);
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await authAPI.login({ identifier, password });
            const { token: newToken, user: newUser } = response.data;

            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            // Connect socket
            socketService.connect(newToken);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await authAPI.register({ username, email, password });
            const { token: newToken, user: newUser } = response.data;

            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            // Connect socket
            socketService.connect(newToken);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            await authAPI.requestPasswordReset(email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to request password reset'
            };
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            await authAPI.resetPassword(token, newPassword);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to reset password'
            };
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
