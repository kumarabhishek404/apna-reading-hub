"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Login failed.");
      }

      saveAuthSession(payload);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#edf4ff_0%,_#f8fafc_38%,_#eef3ff_100%)] px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-brand/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(34,64,154,0.12)] backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/70">Welcome back</p>
            <h1 className="text-2xl font-bold text-brand">Apna Sathi</h1>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand">Mobile number</label>
            <Input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-brand underline-offset-4 hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
