"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MdFamilyRestroom, MdPerson, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function InviteContent() {
  const params = useSearchParams();
  const familyName = params.get("family") ?? "a família";
  const familyId = params.get("fid") ?? "";
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.updateUser({ password });
    if (authErr || !user) {
      setError("Erro ao configurar senha.");
      setLoading(false);
      return;
    }
    await supabase.from("acalanto_family_members").insert({ family_id: familyId, user_id: user.id, name, role: "member" });
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <MdFamilyRestroom size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            Você foi convidado!
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Entre para a <strong style={{ color: "var(--text-primary)" }}>{familyName}</strong>
          </p>
        </div>

        <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Seu nome</label>
            <div style={{ position: "relative" }}>
              <MdPerson size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você se chama?" required className="input-field" style={{ paddingLeft: "2.5rem" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Crie sua senha</label>
            <div style={{ position: "relative" }}>
              <MdLock size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 8 caracteres" minLength={8} required className="input-field" style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.85rem", color: "#f87171" }}>{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", background: "#3b82f6" }}>
            {loading ? "Entrando..." : "Entrar para a família"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
