"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, UserPlus } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    title: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Registration failed.");
      }

      saveAuthSession(payload);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ef_0%,_#f8fafc_42%,_#eef4ff_100%)] px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-brand/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(31,41,55,0.12)] backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-lg shadow-brand-orange/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange/80">Start today</p>
            <h1 className="text-2xl font-bold text-brand">Create your account</h1>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-brand">Full name</label>
              <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter full name" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">Title</label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Student / Employee / Business" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">Mobile number</label>
              <Input value={form.mobile} onChange={(e) => updateField("mobile", e.target.value)} type="tel" placeholder="+91 9876543210" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">Password</label>
              <Input value={form.password} onChange={(e) => updateField("password", e.target.value)} type="password" placeholder="Create password" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-brand">Confirm password</label>
              <Input value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} type="password" placeholder="Confirm password" required />
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Creating account..." : "Create account"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
