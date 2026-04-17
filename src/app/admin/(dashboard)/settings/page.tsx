import { ModuleToggles } from "@/components/module-toggles";

export const metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control access and feature visibility across the site
        </p>
      </div>

      <div className="max-w-3xl">
        <ModuleToggles />
      </div>
    </div>
  );
}
