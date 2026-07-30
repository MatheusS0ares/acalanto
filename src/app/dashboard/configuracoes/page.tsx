"use client";
import { useState } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import {
  MdLightMode, MdDarkMode, MdNotifications, MdSecurity, MdLogout,
  MdPerson, MdClose, MdCheck, MdVisibility, MdVisibilityOff,
} from "react-icons/md";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? "#22c55e" : "var(--bg-secondary)",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        transition: "left 0.2s",
        display: "block",
      }} />
    </button>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0",
        padding: "1.5rem", width: "100%", maxWidth: 520,
        boxShadow: "0 -4px 30px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
            <MdClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PerfilModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("Matheus");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    onSave(name.trim());
  }

  return (
    <ModalWrapper title="Meu Perfil" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, color: "white",
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            className="input-field"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            E-mail
          </label>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1.5px solid var(--border)",
            borderRadius: 12,
            padding: "0.65rem 0.95rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}>
            <span>matheus.nascimento@verticalsaude.com.br</span>
            <span style={{ fontSize: "0.7rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, padding: "0.15rem 0.4rem", whiteSpace: "nowrap", color: "var(--text-muted)" }}>
              fixo
            </span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", minHeight: 48, marginTop: "0.5rem", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </ModalWrapper>
  );
}

function SenhaModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [showNova, setShowNova] = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSave() {
    setErro("");
    if (nova.length < 6) { setErro("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (nova !== confirma) { setErro("As senhas não coincidem"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onSave();
  }

  return (
    <ModalWrapper title="Alterar Senha" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Nova senha
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showNova ? "text" : "password"}
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="input-field"
              style={{ width: "100%", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowNova(!showNova)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {showNova ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Confirmar nova senha
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirma ? "text" : "password"}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              placeholder="Repita a nova senha"
              className="input-field"
              style={{ width: "100%", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirma(!showConfirma)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {showConfirma ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>
        </div>

        {erro && (
          <p style={{ fontSize: "0.82rem", color: "#f87171", fontWeight: 500 }}>{erro}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !nova || !confirma}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", minHeight: 48, marginTop: "0.25rem", opacity: (saving || !nova || !confirma) ? 0.6 : 1 }}
        >
          {saving ? "Salvando..." : "Alterar senha"}
        </button>
      </div>
    </ModalWrapper>
  );
}

export default function ConfiguracoesPage() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [modal, setModal] = useState<"perfil" | "senha" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [notifVencimento, setNotifVencimento] = useState(true);
  const [notifTarefas, setNotifTarefas] = useState(true);

  function showToast(msg: string) { setToast(msg); }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {modal === "perfil" && (
        <PerfilModal
          onClose={() => setModal(null)}
          onSave={(name) => { setModal(null); showToast(`Perfil de ${name} salvo!`); }}
        />
      )}
      {modal === "senha" && (
        <SenhaModal
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); showToast("Senha alterada com sucesso!"); }}
        />
      )}

      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2rem" }}>
        Configurações
      </h1>

      {/* Aparência */}
      <SectionTitle>Aparência</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2rem" }}>
        <SettingsRow
          icon={theme === "dark" ? MdDarkMode : MdLightMode}
          label="Tema"
          desc={theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}
          onClick={toggle}
        >
          <span style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 600, whiteSpace: "nowrap" }}>
            {theme === "dark" ? "Mudar para claro" : "Mudar para escuro"}
          </span>
        </SettingsRow>
      </div>

      {/* Notificações */}
      <SectionTitle>Notificações</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2rem" }}>
        <SettingsRow
          icon={MdNotifications}
          label="Alertas de vencimento"
          desc="Documentos e veículos prestes a vencer"
          divider
        >
          <Toggle on={notifVencimento} onChange={setNotifVencimento} />
        </SettingsRow>
        <SettingsRow
          icon={MdNotifications}
          label="Lembretes de tarefas"
          desc="Tarefas com prazo próximo"
        >
          <Toggle on={notifTarefas} onChange={setNotifTarefas} />
        </SettingsRow>
      </div>

      {/* Segurança */}
      <SectionTitle>Segurança</SectionTitle>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2rem" }}>
        <SettingsRow
          icon={MdSecurity}
          label="Alterar senha"
          desc="Atualize sua senha de acesso"
          onClick={() => setModal("senha")}
          chevron
          divider
        />
        <SettingsRow
          icon={MdPerson}
          label="Meu perfil"
          desc="Nome, foto e informações pessoais"
          onClick={() => setModal("perfil")}
          chevron
        />
      </div>

      {/* Sair */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          padding: "0.875rem 1.25rem",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "0.75rem",
          color: "#f87171", fontSize: "0.875rem", fontWeight: 600,
          cursor: "pointer", width: "100%", justifyContent: "center",
          minHeight: 52,
        }}
      >
        <MdLogout size={18} /> Sair da conta
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem",
    }}>
      {children}
    </h2>
  );
}

function SettingsRow({
  icon: Icon, label, desc, onClick, children, chevron, divider,
}: {
  icon: React.ElementType; label: string; desc: string;
  onClick?: () => void; children?: React.ReactNode; chevron?: boolean; divider?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "1rem 1.25rem",
        borderBottom: divider ? "1px solid var(--border-light)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "10px",
        background: "var(--bg-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} color="var(--text-muted)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{label}</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{desc}</div>
      </div>
      {children}
      {chevron && (
        <span style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginLeft: "0.25rem" }}>›</span>
      )}
    </div>
  );
}
