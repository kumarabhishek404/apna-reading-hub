import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Profile</h1>
        <p className="text-muted">Your Apna Sathi workspace</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Image
            src="/icons/apna-sathi-logo.png"
            alt="Apna Sathi"
            width={64}
            height={64}
            className="rounded-2xl object-contain"
          />
          <div>
            <CardTitle>Apna Sathi User</CardTitle>
            <CardDescription>A small initiative by Apna Rojgar</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>Organize notes, PDFs, links, reminders, and alarms — all for free.</p>
          <p className="font-medium text-brand">Apni jankari, hamesha saath.</p>
        </CardContent>
      </Card>
    </div>
  );
}
