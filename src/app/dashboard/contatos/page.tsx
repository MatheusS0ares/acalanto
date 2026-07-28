"use client";
import { useState } from "react";
import { MdAdd, MdPhone, MdClose } from "react-icons/md";

const contacts = [
  { id: "1", name: "Dr. Carlos Lima", relation: "Cardiologista do Matheus", phone: "(11) 99999-1111", category: "Saúde", priority: 1, emoji: "👨‍⚕️" },
  { id: "2", name: "UPA Centro", relation: "Pronto-socorro mais próximo", phone: "(11) 3333-2222", category: "Emergência", priority: 1, emoji: "🏥" },
  { id: "3", name: "Bombeiros", relation: "Incêndio e resgate", phone: "193", category: "Emergência", priority: 0, emoji: "🚒" },
  { id: "4", name: "SAMU", relation: "Emergência médica", phone: "192", category: "Emergência", priority: 0, emoji: "🚑" },
  { id: "5", name: "Polícia Militar", relation: "Segurança e emergência", phone: "190", category: "Emergência", priority: 0, emoji: "🚔" },
  { id: "6", name: "João — Vizinho", relation: "Vizinho do 302", phone: "(11) 99888-7777", category: "Vizinhos", priority: 2, emoji: "🤝" },
  { id: "7", name: "Condomínio", relation: "Portaria", phone: "(11) 3333-9999", category: "Serviços", priority: 2, emoji: "🏢" },
  { id: "8", name: "Eletricista", relation: "João Elétrica", phone: "(11) 99777-6666", category: "Serviços", priority: 3, emoji: "⚡" },
];

const categories = ["Todos", "Emergência", "Saúde", "Vizinhos", "Serviços"];

export default function ContatosPage() {
  const [allContacts, setAllContacts] = useState(contacts);
  const [filter, setFilter] = useState("Todos");
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Serviços");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = allContacts.filter((c) => filter === "Todos" || c.category === filter);
  const urgent = filtered.filter((c) => c.priority <= 1);
  const others = filtered.filter((c) => c.priority > 1);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          📞 Contatos Importantes
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Toque no número para ligar diretamente.
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setAddModal(true)}
        style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#d07a6a", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(208,122,106,0.35)", marginBottom: "1.75rem" }}
      >
        <MdAdd size={24} /> Adicionar contato
      </button>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", overflowX: "auto", paddingBottom: "0.35rem" }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: "0.5rem 1rem", borderRadius: "9999px", minHeight: 42, border: `1.5px solid ${filter === cat ? "#d07a6a" : "var(--border)"}`, background: filter === cat ? "rgba(208,122,106,0.12)" : "transparent", color: filter === cat ? "#d07a6a" : "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap", fontWeight: filter === cat ? 700 : 500 }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Emergência — liga com um toque */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#d07a6a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
            🚨 Liga com um toque
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Toque em qualquer um desses cartões para ligar agora.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
            {urgent.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.phone.replace(/\D/g, "")}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem", padding: "1.25rem", background: "rgba(208,122,106,0.1)", border: "1.5px solid rgba(208,122,106,0.3)", borderRadius: 16, textDecoration: "none", cursor: "pointer", minHeight: 120 }}
              >
                <span style={{ fontSize: "2.5rem" }}>{c.emoji}</span>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>{c.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{c.relation}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#d07a6a" }}>{c.phone}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Outros contatos */}
      {others.length > 0 && (
        <div>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
            Outros contatos
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {others.map((c) => (
              <div key={c.id} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
                <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{c.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{c.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.relation}</div>
                </div>
                <a
                  href={`tel:${c.phone.replace(/\D/g, "")}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", background: "var(--brand-bg)", border: "1.5px solid var(--brand-border)", borderRadius: 12, color: "var(--brand)", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  <MdPhone size={18} /> Ligar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo Contato</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nome *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Dr. João, Eletricista..." className="input-field" style={{ fontSize: "1rem" }} autoFocus />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Descrição</label>
                <input type="text" value={newRelation} onChange={(e) => setNewRelation(e.target.value)} placeholder="Ex: Médico da família, vizinho..." className="input-field" style={{ fontSize: "0.95rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Telefone *</label>
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(11) 99999-0000" className="input-field" style={{ fontSize: "1.1rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Categoria</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                  {["Emergência", "Saúde", "Vizinhos", "Serviços"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setAddModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
                <button
                  disabled={!newName.trim() || !newPhone.trim()}
                  onClick={() => {
                    const emojisMap: Record<string, string> = { Emergência: "🚨", Saúde: "❤️", Vizinhos: "🤝", Serviços: "🔧" };
                    setAllContacts((prev) => [...prev, {
                      id: Date.now().toString(), name: newName.trim(), relation: newRelation.trim() || newCategory,
                      phone: newPhone.trim(), category: newCategory, priority: 3, emoji: emojisMap[newCategory] ?? "📞",
                    }]);
                    showToast(`✅ "${newName.trim()}" adicionado!`);
                    setNewName(""); setNewRelation(""); setNewPhone(""); setNewCategory("Serviços");
                    setAddModal(false);
                  }}
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800, background: "#d07a6a", opacity: (newName.trim() && newPhone.trim()) ? 1 : 0.6 }}
                >
                  <MdAdd size={20} /> Salvar contato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
