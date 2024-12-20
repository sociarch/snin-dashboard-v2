"use client";

import { userPool } from "@/lib/awsConfig";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios';
import { useRouter } from "next/navigation";

export interface AuthContextType {
    signOut: () => Promise<void>;
    remainingQuestions: number | null;
    userAttributes: Record<string, any>;
    userGroups: string[];
    isAuthenticated: boolean;
    user: any;
    signIn: (username: string, password: string) => Promise<void>;
    signUp: (username: string, password: string, attributes: Record<string, string>) => Promise<void>;
    confirmSignUp: (username: string, code: string) => Promise<void>;
    resendConfirmationCode: (username: string) => Promise<void>;
    forgotPassword: (username: string) => Promise<void>;
    forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<void>;
    updateUserAttributes: (attributes: Record<string, string>) => Promise<void>;
    loading: boolean;
    completeNewPassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<CognitoUser | null>(null);
    const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
    const [userAttributes, setUserAttributes] = useState<{ [key: string]: string } | null>(null);
    const [userGroups, setUserGroups] = useState<string[]>([]);
    const [tempUser, setTempUser] = useState<CognitoUser | null>(null);

    useEffect(() => {
        const currentUser = userPool.getCurrentUser();
        if (currentUser) {
            currentUser.getSession((err: any, session: any) => {
                if (err) {
                    console.error(err);
                } else if (session.isValid()) {
                    setIsAuthenticated(true);
                    setUser(currentUser);
                    // Fetch user attributes when session is valid
                    fetchUserAttributes(currentUser);
                }
            });
        }
    }, []);

    const fetchUserAttributes = (cognitoUser: CognitoUser) => {
        cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
                console.error("Error getting user attributes:", err);
                return;
            }
            if (attributes) {
                const attrs: { [key: string]: string } = {};
                attributes.forEach((attr) => {
                    attrs[attr.getName()] = attr.getValue();
                });
                setUserAttributes(attrs);
                console.log("User attributes:", attrs);

                const qsRemain = attributes.find((attr) => attr.getName() === "custom:qs_remain");
                if (qsRemain) {
                    setRemainingQuestions(parseInt(qsRemain.getValue(), 10));
                }
            }
        });
    };

    const signIn = (username: string, password: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const authenticationDetails = new AuthenticationDetails({
                Username: username,
                Password: password,
            });

            const cognitoUser = new CognitoUser({
                Username: username,
                Pool: userPool,
            });

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    setIsAuthenticated(true);
                    setUser(cognitoUser);
                    fetchUserAttributes(cognitoUser);
                    resolve();
                },
                onFailure: (err) => {
                    console.error("Login error:", err);
                    reject(err);
                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    // Store the cognitoUser temporarily
                    setTempUser(cognitoUser);
                    // Redirect to the new password page
                    router.push("/new-password");
                    // Reject with specific error to handle in UI
                    reject(new Error('NEW_PASSWORD_REQUIRED'));
                }
            });
        });
    };

    const completeNewPassword = async (newPassword: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!tempUser) {
                reject(new Error('No temporary user found'));
                return;
            }

            tempUser.completeNewPasswordChallenge(newPassword, {}, {
                onSuccess: (result) => {
                    setIsAuthenticated(true);
                    setUser(tempUser);
                    setTempUser(null);
                    fetchUserAttributes(tempUser);
                    resolve();
                },
                onFailure: (err) => {
                    console.error("Error completing new password challenge:", err);
                    reject(err);
                }
            });
        });
    };

    const signOut = () => {
        if (user) {
            user.signOut();
            setIsAuthenticated(false);
            setUser(null);
            setUserAttributes(null);
        }
    };

    useEffect(() => {
        const fetchUserGroups = async () => {
            if (userAttributes && userAttributes.sub) {
                console.log('Fetching user groups for sub:', userAttributes.sub);
                try {
                    const response = await axios.get(
                        `https://0odsntgafl.execute-api.ap-southeast-1.amazonaws.com/Prod/usergroups?user_sub=${userAttributes.sub}`
                    );
                    console.log('User groups API response:', response.data);
                    
                    if (response.data.success) {
                        const groups = response.data.response;
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Setting user groups:', groups);
                        }
                        setUserGroups(groups);
                    } else {
                        console.error('Failed to fetch user groups:', response.data);
                    }
                } catch (error) {
                    console.error('Error fetching user groups:', error);
                    if (axios.isAxiosError(error)) {
                        console.error('Axios error details:', {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status
                        });
                    }
                }
            } else {
                console.log('No user sub available yet');
            }
        };

        fetchUserGroups();
    }, [userAttributes]);

    const value: AuthContextType = {
        isAuthenticated,
        user,
        remainingQuestions,
        userAttributes: userAttributes || {},
        signIn,
        signOut: () => {
            signOut();
            return Promise.resolve();
        },
        userGroups,
        signUp: async () => {},
        confirmSignUp: async () => {},
        resendConfirmationCode: async () => {},
        forgotPassword: async () => {},
        forgotPasswordSubmit: async () => {},
        updateUserAttributes: async () => {},
        loading: false,
        completeNewPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
