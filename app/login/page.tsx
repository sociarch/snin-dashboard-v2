"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false);
    const router = useRouter();
    const { signIn, completeNewPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        try {
            if (isNewPasswordRequired) {
                if (newPassword.length < 8) {
                    setError("Password must be at least 8 characters long");
                    return;
                }
                await completeNewPassword(newPassword);
                router.push("/dashboard");
                return;
            }

            await signIn(email, password);
            router.push("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'NEW_PASSWORD_REQUIRED') {
                    setIsNewPasswordRequired(true);
                    return;
                }
                setError(err.message || "Failed to log in");
            } else {
                setError("Failed to log in");
            }
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-[#0a0d16]">
            <div className="w-full flex justify-center items-center p-8">
                <div className="w-full max-w-md bg-[#1a1f2e] rounded-lg shadow-lg p-8 flex flex-col">
                    <h2 className="text-4xl font-serif mb-8 text-white">
                        {isNewPasswordRequired ? "Set New Password" : "Sign In"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
                        {!isNewPasswordRequired ? (
                            <>
                                <div>
                                    <label htmlFor="email" className="block text-base text-white mb-2">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-transparent border-gray-600 text-white h-12"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-base text-white mb-2">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-transparent border-gray-600 text-white h-12"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="newPassword" className="block text-base text-white mb-2">
                                    New Password
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full bg-transparent border-gray-600 text-white h-12"
                                    placeholder="Enter your new password"
                                />
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            className="w-full bg-[#ffd700] hover:bg-[#e6c200] text-black h-12 text-lg font-medium rounded-md"
                        >
                            {isNewPasswordRequired ? "Set New Password" : "Sign In"}
                        </Button>
                    </form>
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                    
                    {/* Logo at bottom */}
                    <div className="mt-8">
                        <h1 className="text-xl font-bold">
                            <span className="text-[#ffd700]">Snap</span>
                            <span className="text-white">Input</span>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}
