import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { title: "Appearance", description: "Theme and display preferences" },
  { title: "Notifications", description: "Reminders and alarm alerts" },
  { title: "Security", description: "Privacy and data settings" },
  { title: "Language", description: "Choose your preferred language" },
  { title: "About", description: "Apna Sathi by Apna Rojgar" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Settings</h1>
        <p className="text-muted">Customize your Apna Sathi experience</p>
      </div>
      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="hover:border-brand/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-brand-orange" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">Coming soon</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
