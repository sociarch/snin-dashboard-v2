"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewPasswordPage() {
    const { completeNewPassword } = useAuth();
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const validatePasswords = () => {
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validatePasswords()) {
            return;
        }

        try {
            await completeNewPassword(newPassword);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black font-serif">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-800 bg-black p-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">Set New Password</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Please enter your new password twice to confirm
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                        />
                        <Input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#ffd700] transition-colors duration-200"
                    >
                        Set Password
                    </Button>
                </form>
            </div>
        </div>
    );
} 