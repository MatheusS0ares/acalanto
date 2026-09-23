"use client";
import { useEffect, useState } from "react";
import { MdCheck, MdLogin, MdPeople } from "react-icons/md";

interface Member {
  family_id: string;
  name: string;
  role: string;
  user_id: string;
}
interface FamilyRow {
  id: string;
  name: string;
  slug: string;
  disabled_tabs: string[] | null;
  created_at: string;
  members: Member[];
}

const TAB_OPTIONS = [
  { key: "financeiro", label: "Financeiro" },
  { key: "documentos", label: "Documentos" },
  { key: "mantimentos", label: "Mantimentos" },
  { key: "compras", label: "Compras" },
  { key: "cardapio", label: "Cardápio" },
  { key: "reformas", label: "Obras" },
  { key: "tarefas", label: "Tarefas" },
  { key: "calendario", label: "Calendário" },
  { key: "saude", label: "Saúde" },
  { key: "pets", label: "Pets" },
  { key: "memorias", label: "Memórias" },
  { key: "veiculos", label: "Veículos" },
  { key: "contatos", label: "Emergência" },
  { key: "senhas", label: "Cofre" },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/families");
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setFamilies(data.families ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleTab(family: FamilyRow, tabKey: string) {
    const current = family.disabled_tabs ?? [];
    const next = current.includes(tabKey) ? current.filter((t) => t !== tabKey) : [...current, tabKey];

    setFamilies((prev) => prev.map((f) => f.id === family.id ? { ...f, disabled_tabs: next } : f));
    setSavingId(family.id);

    const res = await fetch(`/api/admin/families/${family.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled_tabs: next }),
    });
    setSavingId(null);

    if (!res.ok) {
      showToast("Erro ao salvar — tente de novo");
      setFamilies((prev) => prev.map((f) => f.id === family.id ? { ...f, disabled_tabs: current } : f));
    }
  }

  async function impersonate(family: FamilyRow) {
    const ok = window.confirm(
      `Isso vai trocar sua sessão pela conta responsável por "${family.name}". Pra voltar a ser admin, você vai precisar sair e entrar de novo com sua conta. Continuar?`
    );
    if (!ok) return;

    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: family.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error ?? "Erro ao entrar como essa família");
      return;
    }
    window.location.href = data.actionLink;
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Acesso restrito</div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
          Essa área é só pra administração do sistema.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: "2rem" }}>
      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
          background: "#2a5a3a", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "999px",
          fontSize: "0.9rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 200, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          🛠️ Admin
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Gerencie todas as famílias do sistema — quais abas cada uma vê, e entre como qualquer uma pra ajudar.
        </p>
      </div>

      {families.map((family) => {
        const disabled = family.disabled_tabs ?? [];
        return (
          <div key={family.id} className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{family.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.2rem" }}>
                  <MdPeople size={14} /> {family.members.map((m) => m.name).join(", ") || "sem membros"}
                </div>
              </div>
              <button onClick={() => impersonate(family)} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
                <MdLogin size={16} /> Entrar como
              </button>
            </div>

            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Abas visíveis {savingId === family.id && "— salvando..."}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {TAB_OPTIONS.map((tab) => {
                const isOff = disabled.includes(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => toggleTab(family, tab.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.3rem 0.7rem", borderRadius: 999, cursor: "pointer",
                      border: `1px solid ${isOff ? "var(--border)" : "var(--brand)"}`,
                      background: isOff ? "transparent" : "rgba(122,171,138,0.12)",
                      color: isOff ? "var(--text-muted)" : "var(--brand)",
                      fontSize: "0.78rem", fontWeight: isOff ? 400 : 600,
                    }}
                  >
                    {!isOff && <MdCheck size={13} />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
