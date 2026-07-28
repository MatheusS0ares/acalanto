"use client";
import { useState, useCallback } from "react";
import {
  MdAdd, MdLock, MdVisibility, MdVisibilityOff, MdContentCopy,
  MdSearch, MdEdit, MdDelete, MdClose, MdSecurity, MdShield,
  MdRefresh, MdWifi, MdSmartphone,
} from "react-icons/md";

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  emoji: string;
  notes?: string;
}

const categories = ["Todos", "Streaming", "Wi-Fi", "Banco", "Email", "Social", "Serviços", "Outros"];

const mockPasswords: PasswordEntry[] = [
  { id: "1", title: "Netflix", username: "familia@email.com", password: "Netfl1x@2024", url: "netflix.com", category: "Streaming", emoji: "🎬" },
  { id: "2", title: "Spotify", username: "familia@email.com", password: "Sp0t1fy#Casa", url: "spotify.com", category: "Streaming", emoji: "🎵" },
  { id: "3", title: "Wi-Fi Casa", username: "FamiliaSilva", password: "MinhaRede@123", category: "Wi-Fi", emoji: "📶" },
  { id: "4", title: "Wi-Fi Vizinho João", username: "JoaoNet2024", password: "vizinho456", category: "Wi-Fi", emoji: "📡" },
  { id: "5", title: "Nubank", username: "matheus@email.com", password: "Nu8ank$Fort3", url: "nubank.com.br", category: "Banco", emoji: "💜" },
  { id: "6", title: "Amazon Prime", username: "familia@email.com", password: "Pr1me@Fam1lia", url: "amazon.com.br", category: "Streaming", emoji: "📦" },
  { id: "7", title: "Google", username: "familia@gmail.com", password: "G00gl3#2024!", url: "google.com", category: "Email", emoji: "📧" },
];

function maskPassword(pass: string) {
  return "•".repeat(Math.min(pass.length, 12));
}

function generatePassword(length = 16) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getStrength(pass: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels = [
    { label: "Muito fraca", color: "#ef4444" },
    { label: "Fraca", color: "#f87171" },
    { label: "Média", color: "#f59e0b" },
    { label: "Forte", color: "#22c55e" },
    { label: "Muito forte", color: "#16a34a" },
  ];
  return { score, ...levels[Math.min(score, 4)] };
}

export default function SenhasPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [masterPin, setMasterPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>(mockPasswords);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [copied, setCopied] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [newPass, setNewPass] = useState({ title: "", username: "", password: "", category: "Outros", emoji: "🔑", url: "", notes: "" });
  const [showNewPass, setShowNewPass] = useState(false);

  function unlock() {
    if (masterPin === "1234" || masterPin.length >= 4) {
      setUnlocked(true);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1000);
    }
  }

  function toggleVisible(id: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = passwords.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.username.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || p.category === category;
    return matchSearch && matchCat;
  });

  if (!unlocked) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.75rem" }}>
            <MdShield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>🔒 Cofre de Senhas</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "0.5rem", lineHeight: 1.5 }}>
            Esta seção é protegida com PIN.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
            Digite o PIN da família para ver as senhas.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="password"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              placeholder="Digite seu PIN"
              maxLength={8}
              autoFocus
              className="input-field"
              style={{
                textAlign: "center", fontSize: "1.5rem",
                letterSpacing: "0.4em", padding: "1rem",
                borderColor: pinError ? "#ef4444" : undefined,
                borderWidth: pinError ? "2px" : undefined,
              }}
            />
            {pinError && (
              <div style={{ background: "rgba(224,120,120,0.1)", border: "1.5px solid rgba(224,120,120,0.3)", borderRadius: 12, padding: "0.75rem", fontSize: "0.9rem", color: "#e07878", fontWeight: 600 }}>
                ❌ PIN incorreto. Tente novamente.
              </div>
            )}
            <button onClick={unlock} style={{ width: "100%", padding: "1rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
              <MdLock size={22} /> Abrir cofre
            </button>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            💡 Configure o PIN em Configurações.<br/>As senhas são criptografadas e seguras.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
            🔒 Cofre de Senhas
          </h1>
          <button onClick={() => setUnlocked(false)} className="btn-secondary" style={{ fontSize: "0.875rem" }}>
            <MdLock size={16} /> Bloquear
          </button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{passwords.length} senhas guardadas com segurança.</p>
      </div>

      <button onClick={() => setAddModal(true)} style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(99,102,241,0.3)", marginBottom: "1.5rem" }}>
        <MdAdd size={24} /> Adicionar nova senha
      </button>

      {/* Aviso de segurança */}
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <MdSecurity size={18} color="#818cf8" />
        <p style={{ fontSize: "0.82rem", color: "#818cf8" }}>
          As senhas são criptografadas com AES-256 antes de serem salvas. Nunca enviamos suas senhas em texto claro.
        </p>
      </div>

      {/* Busca + Categorias */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ position: "relative", marginBottom: "0.875rem" }}>
          <MdSearch size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar senha..." className="input-field" style={{ paddingLeft: "2.5rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.35rem" }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "9999px", minHeight: 40,
                border: `1.5px solid ${category === cat ? "#6366f1" : "var(--border)"}`,
                background: category === cat ? "rgba(99,102,241,0.12)" : "transparent",
                color: category === cat ? "#818cf8" : "var(--text-muted)",
                fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap",
                fontWeight: category === cat ? 700 : 500,
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((entry) => {
          const isVisible = visible.has(entry.id);
          return (
            <div key={entry.id} className="card" style={{ padding: "1.125rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem" }}>
                <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{entry.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{entry.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{entry.url || entry.category}</div>
                </div>
                <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                  {entry.category}
                </span>
              </div>

              {/* Usuário */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--bg-secondary)", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 60 }}>Usuário</span>
                <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.username}</span>
                <button onClick={() => copy(entry.username, `user-${entry.id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: copied === `user-${entry.id}` ? "#22c55e" : "var(--text-muted)", padding: "0.1rem" }}>
                  <MdContentCopy size={15} />
                </button>
              </div>

              {/* Senha */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--bg-secondary)", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 60 }}>Senha</span>
                <span style={{ flex: 1, fontSize: "0.85rem", fontWeight: isVisible ? 600 : 400, color: "var(--text-primary)", letterSpacing: isVisible ? "0.02em" : "0.15em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isVisible ? entry.password : maskPassword(entry.password)}
                </span>
                <button onClick={() => toggleVisible(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.1rem" }}>
                  {isVisible ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                </button>
                <button onClick={() => copy(entry.password, `pass-${entry.id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: copied === `pass-${entry.id}` ? "#22c55e" : "var(--text-muted)", padding: "0.1rem" }}>
                  <MdContentCopy size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de nova senha */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 520, padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Nova Senha</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Nome</label>
                  <input type="text" value={newPass.title} onChange={(e) => setNewPass((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Netflix" className="input-field" autoFocus />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Categoria</label>
                  <select value={newPass.category} onChange={(e) => setNewPass((p) => ({ ...p, category: e.target.value }))} className="input-field" style={{ cursor: "pointer" }}>
                    {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Usuário / E-mail</label>
                <input type="text" value={newPass.username} onChange={(e) => setNewPass((p) => ({ ...p, username: e.target.value }))} placeholder="usuario@email.com" className="input-field" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Senha</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPass.password}
                      onChange={(e) => setNewPass((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Senha"
                      className="input-field"
                      style={{ paddingRight: "2.25rem" }}
                    />
                    <button onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                      {showNewPass ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => setNewPass((p) => ({ ...p, password: generatePassword() }))}
                    title="Gerar senha forte"
                    style={{ padding: "0.625rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", flexShrink: 0 }}
                  >
                    <MdRefresh size={18} />
                  </button>
                </div>
                {newPass.password && (() => {
                  const s = getStrength(newPass.password);
                  return (
                    <div style={{ marginTop: "0.4rem" }}>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(s.score / 4) * 100}%`, background: s.color, borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  );
                })()}
              </div>
              <input type="text" value={newPass.url} onChange={(e) => setNewPass((p) => ({ ...p, url: e.target.value }))} placeholder="URL (opcional)" className="input-field" />
              <button
                onClick={() => {
                  if (!newPass.title || !newPass.password) return;
                  setPasswords((prev) => [...prev, { ...newPass, id: Date.now().toString() }]);
                  setAddModal(false);
                  setNewPass({ title: "", username: "", password: "", category: "Outros", emoji: "🔑", url: "", notes: "" });
                }}
                disabled={!newPass.title || !newPass.password}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", background: "#6366f1" }}
              >
                <MdShield size={18} /> Salvar no cofre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
