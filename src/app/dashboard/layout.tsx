"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MdHome, MdCheck } from "react-icons/md";

function FamilySetupForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [name, setName] = useState((user.user_metadata?.name as string) ?? "");
  const [familyName, setFamilyName] = useState((user.user_metadata?.family_name as string) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !familyName.trim()) return;
    setLoading(true);
    setError("");
    const supabase = createClient();

    const slug = familyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const familyId = crypto.randomUUID();
    const { error: familyError } = await supabase
      .from("acalanto_families")
      .insert({ id: familyId, name: familyName.trim(), slug: `${slug}-${Date.now()}` });

    if (familyError) {
      setError("Erro ao criar família. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("acalanto_family_members").insert({
      family_id: familyId,
      user_id: user.id,
      name: name.trim(),
      role: "owner",
    });

    if (memberError) {
      setError("Erro ao vincular sua conta à família.");
      setLoading(false);
      return;
    }

    onDone();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #7aab8a, #5a8b6a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <MdHome size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            Falta só um passo
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sua conta já existe, mas ainda não tem uma família vinculada. Vamos criar agora.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Seu nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como você se chama?"
              required
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Nome da família
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Ex: Família Silva"
              required
              className="input-field"
            />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            <MdCheck size={18} />
            {loading ? "Criando..." : "Criar minha família"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [checking, setChecking] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChecking(false); return; }
    setAuthUser(user);

    const { data: member } = await supabase
      .from("acalanto_family_members")
      .select("name, acalanto_families(name)")
      .eq("user_id", user.id)
      .single();

    if (member) {
      setMemberName(member.name);
      const fam = member.acalanto_families as unknown as { name: string } | null;
      if (fam) setFamilyName(fam.name);
      setNeedsSetup(false);
    } else {
      setNeedsSetup(true);
    }
    setChecking(false);
  }

  useEffect(() => { loadUser(); }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", background: "var(--bg-primary)" }}>
        Carregando...
      </div>
    );
  }

  if (needsSetup && authUser) {
    return <FamilySetupForm user={authUser} onDone={() => window.location.reload()} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      <img
        src="/family-bg.png"
        alt=""
        aria-hidden
        className="family-watermark"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 260,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} familyName={familyName} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} memberName={memberName} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
          }}
        >
          {children}
        </main>
      </div>
      <style>{`
        .family-watermark {
          opacity: 0.5;
          -webkit-mask-image: radial-gradient(circle at bottom right, black 25%, transparent 70%);
          mask-image: radial-gradient(circle at bottom right, black 25%, transparent 70%);
        }
        [data-theme="light"] .family-watermark {
          opacity: 0.85;
        }
        @media (max-width: 640px) {
          .family-watermark { width: 170px; }
        }
      `}</style>
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
