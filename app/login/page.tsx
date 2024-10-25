"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
            router.push("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#1C1F26]">
            <Card className="w-full max-w-[800px] flex overflow-hidden">
                <div className="w-1/2 relative">
                    <Image
                        src="/core.png"
                        alt="Colorful abstract shapes"
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
                <CardContent className="w-1/2 p-8 bg-[#1C1F26] text-white">
                    <h1 className="text-3xl font-bold mb-6">Sign In</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block mb-2">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#2A2E38] border-none text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-[#2A2E38] border-none text-white"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full bg-[#FFB800] text-black hover:bg-[#FFA500]">
                            SIGN IN
                        </Button>
                    </form>
                    <div className="absolute bottom-4 right-4">
                        <Image
                            src="/SnapInput Logo Square.png"
                            alt="SnapInput Logo"
                            width={120}
                            height={30}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
