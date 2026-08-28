"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { LogoMark } from "@/components/brand/logo";
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
      const res = await apiFetch("/api/auth/login", {
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
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_12px_32px_rgba(34,64,154,0.16)] ring-1 ring-brand/10">
            <LogoMark size="xl" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/70">Welcome back</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Apna Notes</h1>
          <p className="text-sm text-muted">Your Personal Notebook</p>
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
