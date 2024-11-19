"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-serif">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-800 bg-black p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            <span className="text-[#ffd700]">Snap</span>
            <span className="text-white">Input</span>
          </h2>
          <p className="mt-2 text-gray-400">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white border-4 border-gray-600 hover:border-[#ffd700] transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
