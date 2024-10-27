"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await signIn(email, password);
            router.push("/dashboard"); // This should now point to the new DashboardPage
        } catch (err) {
            setError("Failed to log in");
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900">
            <div className="w-full  flex justify-center items-center p-8">
                <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8 min-h-[500px] flex flex-col justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-white">Sign In</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-gray-800 border-gray-700 text-white"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-gray-800 border-gray-700 text-white pr-10"
                                        placeholder="Enter your password"
                                    />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded">
                                SIGN IN
                            </Button>
                        </form>
                        {error && <p className="mt-4 text-red-500">{error}</p>}
                    </div>
                    <div className="mt-6">
                        <span className="text-yellow-500 font-bold text-xl">Snap</span>
                        <span className="text-white font-bold text-xl">Input</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
