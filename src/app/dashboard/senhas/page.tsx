"use client";
import { useEffect, useState } from "react";
import {
  MdAdd, MdLock, MdVisibility, MdVisibilityOff, MdContentCopy,
  MdSearch, MdClose, MdSecurity, MdShield,
  MdRefresh,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import { deriveVaultKey, encryptString, decryptString, randomSaltB64 } from "@/lib/vaultCrypto";

interface PasswordRow {
  id: string;
  family_id: string;
  title: string;
  username: string | null;
  encrypted_password: string;
  url: string | null;
  category: string;
  emoji: string;
}

const categories = ["Todos", "Streaming", "Wi-Fi", "Banco", "Email", "Social", "Serviços", "Outros"];
const emojiByCategory: Record<string, string> = {
  Streaming: "🎬", "Wi-Fi": "📶", Banco: "💜", Email: "📧", Social: "👥", Serviços: "🔧", Outros: "🔑",
};

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
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [vaultHash, setVaultHash] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<PasswordRow[]>([]);

  const [unlocked, setUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [working, setWorking] = useState(false);

  const [decrypted, setDecrypted] = useState<Map<string, string>>(new Map());
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [copied, setCopied] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from("acalanto_family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();
    if (!me) { setLoading(false); return; }
    setFamilyId(me.family_id);

    const { data: settings } = await supabase
      .from("acalanto_family_settings")
      .select("vault_pin_hash")
      .eq("family_id", me.family_id)
      .maybeSingle();
    setVaultHash(settings?.vault_pin_hash ?? null);

    const { data: rows } = await supabase
      .from("acalanto_password_vault")
      .select("id, family_id, title, username, encrypted_password, url, category, emoji")
      .eq("family_id", me.family_id);
    setPasswords(rows ?? []);

    setLoading(false);
  }

  async function createPin() {
    if (pinInput.length < 4) { setPinError("O PIN precisa ter pelo menos 4 dígitos."); return; }
    if (pinInput !== pinConfirm) { setPinError("Os PINs não são iguais."); return; }
    setWorking(true);
    const salt = randomSaltB64();
    const { key, verifierB64 } = await deriveVaultKey(pinInput, salt);
    const hash = `${salt}:${verifierB64}`;
    const supabase = createClient();
    const { error } = await supabase
      .from("acalanto_family_settings")
      .upsert({ family_id: familyId, vault_pin_hash: hash }, { onConflict: "family_id" });
    setWorking(false);
    if (error) { setPinError("Erro ao criar o PIN. Tente de novo."); return; }
    setVaultHash(hash);
    setVaultKey(key);
    setUnlocked(true);
    setPinInput(""); setPinConfirm(""); setPinError("");
  }

  async function unlock() {
    if (!vaultHash) return;
    setWorking(true);
    const [salt, storedVerifier] = vaultHash.split(":");
    const { key, verifierB64 } = await deriveVaultKey(pinInput, salt);
    setWorking(false);
    if (verifierB64 !== storedVerifier) {
      setPinError("PIN incorreto. Tente de novo.");
      setPinInput("");
      return;
    }
    setVaultKey(key);
    setUnlocked(true);
    setPinInput(""); setPinError("");
  }

  function lock() {
    setUnlocked(false);
    setVaultKey(null);
    setDecrypted(new Map());
    setVisible(new Set());
  }

  async function reveal(entry: PasswordRow) {
    if (!vaultKey) return;
    if (!decrypted.has(entry.id)) {
      try {
        const plain = await decryptString(vaultKey, entry.encrypted_password);
        setDecrypted((prev) => new Map(prev).set(entry.id, plain));
      } catch {
        return;
      }
    }
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
      return next;
    });
  }

  async function copyPassword(entry: PasswordRow) {
    if (!vaultKey) return;
    let plain = decrypted.get(entry.id);
    if (!plain) {
      try {
        plain = await decryptString(vaultKey, entry.encrypted_password);
        setDecrypted((prev) => new Map(prev).set(entry.id, plain!));
      } catch {
        return;
      }
    }
    navigator.clipboard.writeText(plain);
    setCopied(`pass-${entry.id}`);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function addPassword(input: { title: string; username: string; password: string; category: string; url: string }) {
    if (!vaultKey) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const encrypted = await encryptString(vaultKey, input.password);
    const emoji = emojiByCategory[input.category] ?? "🔑";
    const row: PasswordRow = {
      id, family_id: familyId, title: input.title, username: input.username || null,
      encrypted_password: encrypted, url: input.url || null, category: input.category, emoji,
    };
    setPasswords((prev) => [...prev, row]);
    setDecrypted((prev) => new Map(prev).set(id, input.password));
    setAddModal(false);
    const { error } = await supabase.from("acalanto_password_vault").insert({
      id, family_id: familyId, title: input.title, username: input.username || null,
      encrypted_password: encrypted, url: input.url || null, category: input.category, emoji,
    });
    if (error) setPasswords((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = passwords.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.username ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || p.category === category;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  if (!unlocked) {
    const creatingPin = !vaultHash;
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.75rem" }}>
            <MdShield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>🔒 Cofre de Senhas</h1>
          {creatingPin ? (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                Primeira vez aqui — crie um PIN pra proteger o cofre da família.
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
                Guarde bem esse PIN: sem ele, as senhas salvas não têm como ser recuperadas.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Novo PIN (mín. 4 dígitos)" maxLength={8} autoFocus
                  className="input-field" style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em", padding: "1rem" }}
                />
                <input
                  type="password" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPin()}
                  placeholder="Confirme o PIN" maxLength={8}
                  className="input-field" style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em", padding: "1rem" }}
                />
                {pinError && (
                  <div style={{ background: "rgba(224,120,120,0.1)", border: "1.5px solid rgba(224,120,120,0.3)", borderRadius: 12, padding: "0.75rem", fontSize: "0.9rem", color: "#e07878", fontWeight: 600 }}>
                    ❌ {pinError}
                  </div>
                )}
                <button onClick={createPin} disabled={working} style={{ width: "100%", padding: "1rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", opacity: working ? 0.7 : 1 }}>
                  <MdLock size={22} /> {working ? "Criando..." : "Criar PIN e abrir cofre"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                Esta seção é protegida com PIN.
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
                Digite o PIN da família para ver as senhas.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && unlock()}
                  placeholder="Digite seu PIN" maxLength={8} autoFocus
                  className="input-field"
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.4em", padding: "1rem", borderColor: pinError ? "#ef4444" : undefined, borderWidth: pinError ? "2px" : undefined }}
                />
                {pinError && (
                  <div style={{ background: "rgba(224,120,120,0.1)", border: "1.5px solid rgba(224,120,120,0.3)", borderRadius: 12, padding: "0.75rem", fontSize: "0.9rem", color: "#e07878", fontWeight: 600 }}>
                    ❌ {pinError}
                  </div>
                )}
                <button onClick={unlock} disabled={working} style={{ width: "100%", padding: "1rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#6366f1", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", opacity: working ? 0.7 : 1 }}>
                  <MdLock size={22} /> {working ? "Verificando..." : "Abrir cofre"}
                </button>
              </div>
            </>
          )}
          <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            💡 As senhas são criptografadas no seu navegador com o PIN antes de serem salvas.
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
          <button onClick={lock} className="btn-secondary" style={{ fontSize: "0.875rem" }}>
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
          As senhas são criptografadas com AES-256 no seu navegador antes de serem salvas. Nunca enviamos suas senhas em texto claro.
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
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Nenhuma senha salva ainda.</div>
        )}
        {filtered.map((entry) => {
          const isVisible = visible.has(entry.id);
          const plain = decrypted.get(entry.id);
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
              {entry.username && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--bg-secondary)", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 60 }}>Usuário</span>
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.username}</span>
                  <button onClick={() => copyText(entry.username!, `user-${entry.id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: copied === `user-${entry.id}` ? "#22c55e" : "var(--text-muted)", padding: "0.1rem" }}>
                    <MdContentCopy size={15} />
                  </button>
                </div>
              )}

              {/* Senha */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "var(--bg-secondary)", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 60 }}>Senha</span>
                <span style={{ flex: 1, fontSize: "0.85rem", fontWeight: isVisible ? 600 : 400, color: "var(--text-primary)", letterSpacing: isVisible ? "0.02em" : "0.15em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isVisible && plain ? plain : maskPassword(plain ?? "••••••••••••")}
                </span>
                <button onClick={() => reveal(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.1rem" }}>
                  {isVisible ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                </button>
                <button onClick={() => copyPassword(entry)} style={{ background: "none", border: "none", cursor: "pointer", color: copied === `pass-${entry.id}` ? "#22c55e" : "var(--text-muted)", padding: "0.1rem" }}>
                  <MdContentCopy size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de nova senha */}
      {addModal && <AddPasswordModal onClose={() => setAddModal(false)} onAdd={addPassword} />}
    </div>
  );
}

function AddPasswordModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (input: { title: string; username: string; password: string; category: string; url: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("Outros");
  const [url, setUrl] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  function save() {
    if (!title || !password) return;
    onAdd({ title, username, password, category, url });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 520, padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Nova Senha</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Nome</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Netflix" className="input-field" autoFocus />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Usuário / E-mail</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="usuario@email.com" className="input-field" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Senha</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="input-field"
                  style={{ paddingRight: "2.25rem" }}
                />
                <button onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  {showNewPass ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                </button>
              </div>
              <button
                onClick={() => setPassword(generatePassword())}
                title="Gerar senha forte"
                style={{ padding: "0.625rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                <MdRefresh size={18} />
              </button>
            </div>
            {password && (() => {
              const s = getStrength(password);
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
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (opcional)" className="input-field" />
          <button
            onClick={save}
            disabled={!title || !password}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", background: "#6366f1", opacity: (!title || !password) ? 0.6 : 1 }}
          >
            <MdShield size={18} /> Salvar no cofre
          </button>
        </div>
      </div>
    </div>
  );
}
