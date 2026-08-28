import { Logo } from "@/components/brand/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Profile</h1>
        <p className="text-muted">Your Apna Notes workspace</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Logo showWordmark={false} href="" size="lg" />
          <div>
            <CardTitle>Apna Notes</CardTitle>
            <CardDescription>Your Personal Notebook</CardDescription>
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
