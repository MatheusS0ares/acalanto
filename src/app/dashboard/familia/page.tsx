"use client";
import { useEffect, useState } from "react";
import { MdPersonAdd, MdEmail, MdContentCopy, MdCheck, MdEdit, MdDelete, MdClose } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { Family, FamilyMember } from "@/types";

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

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
  const [loading, setLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from("acalanto_family_members")
      .select("id, family_id, role")
      .eq("user_id", user.id)
      .single();
    if (!me) { setLoading(false); return; }

    setMyMemberId(me.id);
    setMyRole(me.role);

    const [{ data: fam }, { data: mems }] = await Promise.all([
      supabase.from("acalanto_families").select("*").eq("id", me.family_id).single(),
      supabase.from("acalanto_family_members").select("*").eq("family_id", me.family_id).order("created_at"),
    ]);

    if (fam) { setFamily(fam); setNameDraft(fam.name); }
    if (mems) setMembers(mems);
    setLoading(false);
  }

  async function saveName() {
    if (!family) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === family.name) { setEditingName(false); setNameDraft(family.name); return; }

    setSavingName(true);
    const supabase = createClient();
    const { error } = await supabase.from("acalanto_families").update({ name: trimmed }).eq("id", family.id);
    setSavingName(false);

    if (error) { setToast("Erro ao salvar nome"); return; }
    setFamily({ ...family, name: trimmed });
    setEditingName(false);
    setToast("Nome da família atualizado!");
  }

  async function removeMember(id: string) {
    setRemovingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("acalanto_family_members").delete().eq("id", id);
    setRemovingId(null);
    setConfirmRemoveId(null);

    if (error) { setToast("Erro ao remover membro"); return; }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setToast("Membro removido");
  }

  const canManage = myRole === "owner" || myRole === "admin";
  const inviteLink = family && typeof window !== "undefined"
    ? `${window.location.origin}/auth/invite?fid=${family.id}&family=${encodeURIComponent(family.name)}`
    : "";

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast("Link copiado!");
  }

  function sendInviteEmail() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) { setToast("Digite um e-mail válido"); return; }
    const subject = encodeURIComponent(`Convite para ${family?.name ?? "a família"} no Acalanto`);
    const body = encodeURIComponent(
      `Você foi convidado(a) para a família ${family?.name ?? ""} no Acalanto!\n\nAcesse o link abaixo para entrar:\n${inviteLink}`
    );
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    setInviteEmail("");
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando família...
      </div>
    );
  }

  if (!family) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Não encontramos uma família associada à sua conta.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div style={{ marginBottom: "1.75rem" }}>
        {editingName ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="input-field"
              autoFocus
              style={{ fontSize: "1.1rem", fontWeight: 700, maxWidth: 280 }}
            />
            <button onClick={saveName} disabled={savingName} className="btn-primary" style={{ padding: "0.5rem 0.75rem" }}>
              <MdCheck size={18} />
            </button>
            <button
              onClick={() => { setEditingName(false); setNameDraft(family.name); }}
              className="btn-secondary"
              style={{ padding: "0.5rem 0.75rem" }}
            >
              <MdClose size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {family.name}
            </h1>
            {canManage && (
              <button
                onClick={() => setEditingName(true)}
                aria-label="Editar nome da família"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
              >
                <MdEdit size={18} />
              </button>
            )}
          </div>
        )}
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {members.length} {members.length === 1 ? "membro" : "membros"}
        </p>
      </div>

      {/* Membros */}
      <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        Membros
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "2rem" }}>
        {members.map((m) => {
          const isMe = m.id === myMemberId;
          const canRemove = canManage && !isMe && m.role !== "owner";
          const confirming = confirmRemoveId === m.id;

          return (
            <div key={m.id} className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "1rem", color: "white", flexShrink: 0,
              }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {m.name}{isMe && " (você)"}
                  </span>
                  {(m.role === "owner" || m.role === "admin") && (
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontWeight: 600 }}>
                      Admin
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Desde {new Date(m.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </div>
              </div>

              {confirming ? (
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={removingId === m.id}
                    style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "0.4rem 0.7rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    {removingId === m.id ? "..." : "Remover"}
                  </button>
                  <button
                    onClick={() => setConfirmRemoveId(null)}
                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "8px", padding: "0.4rem 0.7rem", fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : canRemove ? (
                <button
                  onClick={() => setConfirmRemoveId(m.id)}
                  aria-label={`Remover ${m.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem", flexShrink: 0 }}
                >
                  <MdDelete size={20} />
                </button>
              ) : null}
            </div>
          );
        })}
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
              onKeyDown={(e) => e.key === "Enter" && sendInviteEmail()}
              placeholder="email@exemplo.com"
              className="input-field"
              style={{ paddingLeft: "2.25rem", width: "100%" }}
            />
          </div>
          <button onClick={sendInviteEmail} className="btn-primary" style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            <MdPersonAdd size={16} />
            Enviar convite
          </button>
        </div>
      </div>
    </div>
  );
}
