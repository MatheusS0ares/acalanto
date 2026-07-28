"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [familyName, setFamilyName] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase
        .from("family_members")
        .select("name, families(name)")
        .eq("user_id", user.id)
        .single();
      if (member) {
        setMemberName(member.name);
        const fam = member.families as unknown as { name: string } | null;
        if (fam) setFamilyName(fam.name);
      }
    }
    loadUser();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} familyName={familyName} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} memberName={memberName} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            background: "var(--bg-primary)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}
