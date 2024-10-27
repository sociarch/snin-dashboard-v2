"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { CognitoUser, AuthenticationDetails, CognitoUserAttribute } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/awsConfig";

interface AuthContextType {
    isAuthenticated: boolean;
    user: CognitoUser | null;
    remainingQuestions: number | null;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<CognitoUser | null>(null);
    const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);

    useEffect(() => {
        const currentUser = userPool.getCurrentUser();
        if (currentUser) {
            currentUser.getSession((err: any, session: any) => {
                if (err) {
                    console.error(err);
                } else if (session.isValid()) {
                    setIsAuthenticated(true);
                    setUser(currentUser);
                }
            });
        }
    }, []);

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
                    console.log("Login response:", result);

                    // Retrieve and log all user attributes
                    cognitoUser.getUserAttributes((err, attributes) => {
                        if (err) {
                            console.error("Error getting user attributes:", err);
                            return;
                        }
                        if (attributes) {
                            const qsRemain = attributes.find((attr) => attr.getName() === "custom:qs_remain");
                            if (qsRemain) {
                                setRemainingQuestions(parseInt(qsRemain.getValue(), 10));
                            }
                        }
                    });

                    resolve();
                },
                onFailure: (err) => {
                    console.error("Login error:", err);
                    reject(err);
                },
            });
        });
    };

    const signOut = () => {
        if (user) {
            user.signOut();
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    return <AuthContext.Provider value={{ isAuthenticated, user, remainingQuestions, signIn, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
