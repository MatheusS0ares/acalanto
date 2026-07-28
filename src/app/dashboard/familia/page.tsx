"use client";
import { useState } from "react";
import { MdPersonAdd, MdStar, MdEmail, MdContentCopy, MdCheck, MdClose } from "react-icons/md";

const mockMembers = [
  { id: "1", name: "Matheus", role: "owner", email: "matheus@email.com", points: 45 },
  { id: "2", name: "Ana", role: "member", email: "ana@email.com", points: 60 },
];

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  setTimeout(onDone, 2500);
  return (
    <div style={{
      position: "fixed", bottom: "5rem", left: "50%", transform: "translateX(-50%)",
      background: "#2a5a3a", color: "#fff", borderRadius: "0.75rem",
      padding: "0.75rem 1.25rem", fontSize: "0.9rem", fontWeight: 600,
      zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap",
    }}>
      <MdCheck size={18} /> {msg}
    </div>
  );
}

export default function FamiliaPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/auth/invite?fid=familia-silva`
    : "/auth/invite?fid=familia-silva";

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast("Link copiado!");
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setToast("Digite um e-mail válido");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setToast(`Convite enviado para ${inviteEmail}`);
    setInviteEmail("");
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Minha Família
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Família Silva · {mockMembers.length} membros
        </p>
      </div>

      {/* Membros */}
      <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        Membros
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
        {mockMembers.map((m) => (
          <div key={m.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "1rem", color: "white", flexShrink: 0,
            }}>
              {m.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{m.name}</span>
                {m.role === "owner" && (
                  <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontWeight: 600 }}>
                    Admin
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <MdEmail size={12} /> {m.email}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem" }}>
                <MdStar size={16} /> {m.points}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>pontos</div>
            </div>
          </div>
        ))}
      </div>

      {/* Convidar */}
      <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        Convidar membro
      </h2>
      <div className="card" style={{ padding: "1.25rem" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Compartilhe o link de convite ou envie por e-mail. O novo membro criará o próprio login.
        </p>

        {/* Link de convite */}
        <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="input-field"
            style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 200 }}
          />
          <button onClick={copyLink} className="btn-secondary" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
            {copied ? <MdCheck size={14} /> : <MdContentCopy size={14} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        {/* Enviar por e-mail */}
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MdEmail size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              placeholder="email@exemplo.com"
              className="input-field"
              style={{ paddingLeft: "2.25rem", width: "100%" }}
            />
          </div>
          <button
            onClick={sendInvite}
            disabled={sending}
            className="btn-primary"
            style={{ fontSize: "0.85rem", whiteSpace: "nowrap", opacity: sending ? 0.7 : 1 }}
          >
            <MdPersonAdd size={16} />
            {sending ? "Enviando..." : "Enviar convite"}
          </button>
        </div>
      </div>
    </div>
  );
}
