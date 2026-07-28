"use client";
import { useState } from "react";
import { MdAdd, MdClose, MdCalendarToday, MdLocationOn } from "react-icons/md";

interface Memory {
  id: string; title: string; date: string; location?: string;
  tags: string[]; description?: string; color: string; emoji: string;
}

const mockMemories: Memory[] = [
  { id: "1", title: "Natal 2025", date: "2025-12-25", location: "Casa da vovó", tags: ["Família", "Natal"], description: "Um Natal inesquecível reunindo todos!", color: "#d06a6a", emoji: "🎄" },
  { id: "2", title: "Aniversário de Casamento", date: "2025-09-12", location: "Restaurante Vila Italiana", tags: ["Casal", "Especial"], description: "5 anos juntos ❤️", color: "#c07898", emoji: "💍" },
  { id: "3", title: "Viagem a Gramado", date: "2025-07-10", location: "Gramado, RS", tags: ["Viagem", "Férias"], description: "Primeira viagem dos dois juntos para o sul", color: "#6a9fd4", emoji: "🏔️" },
  { id: "4", title: "Mudança para o novo apê", date: "2025-04-01", location: "Rua das Flores", tags: ["Casa", "Marco"], description: "Começo de um novo capítulo!", color: "var(--brand)", emoji: "🏠" },
  { id: "5", title: "Formatura da Ana", date: "2024-12-10", location: "Universidade", tags: ["Conquista", "Estudo"], color: "#c99a40", emoji: "🎓" },
  { id: "6", title: "Primeiro dia de Pedro", date: "2025-08-05", location: "Casa", tags: ["Pet", "Amor"], description: "Pedro chegou e roubou nossos corações 🐶", color: "#88aa40", emoji: "🐾" },
];

const allTags = ["Todos", ...new Set(mockMemories.flatMap((m) => m.tags))];

export default function MemoriasPage() {
  const [memories, setMemories] = useState<Memory[]>(mockMemories);
  const [tagFilter, setTagFilter] = useState("Todos");
  const [selected, setSelected] = useState<Memory | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: "", date: "", location: "", description: "", emoji: "📸", color: "#7aab8a" });
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = memories.filter((m) => tagFilter === "Todos" || m.tags.includes(tagFilter));
  const sortedByYear = filtered.reduce<Record<string, Memory[]>>((acc, m) => {
    const year = new Date(m.date + "T12:00:00").getFullYear().toString();
    (acc[year] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          📸 Álbum de Memórias
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {memories.length} momentos especiais registrados. Toque em qualquer um para ver mais.
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setAddModal(true)}
        style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#c07898", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(192,120,152,0.35)", marginBottom: "1.75rem" }}
      >
        <MdAdd size={24} /> Registrar nova memória
      </button>

      {/* Filtro de tags */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.75rem" }}>
        {allTags.map((tag) => (
          <button key={tag} onClick={() => setTagFilter(tag)}
            style={{ padding: "0.5rem 1rem", borderRadius: "9999px", minHeight: 40, border: `1.5px solid ${tagFilter === tag ? "#c07898" : "var(--border)"}`, background: tagFilter === tag ? "rgba(192,120,152,0.12)" : "transparent", color: tagFilter === tag ? "#c07898" : "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap", fontWeight: tagFilter === tag ? 700 : 500 }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {Object.entries(sortedByYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => (
        <div key={year} style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ height: 2, flex: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-secondary)", padding: "0 0.875rem" }}>{year}</span>
            <div style={{ height: 2, flex: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {items.sort((a, b) => b.date.localeCompare(a.date)).map((m) => (
              <div key={m.id} onClick={() => setSelected(m)}
                style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "1px solid var(--border-light)", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${m.color}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div style={{ height: 140, background: `linear-gradient(135deg, ${m.color}35, ${m.color}12)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>
                  {m.emoji}
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-card)" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                    <MdCalendarToday size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </span>
                    {m.location && <>
                      <span style={{ color: "var(--border)" }}>·</span>
                      <MdLocationOn size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.location}</span>
                    </>}
                  </div>
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    {m.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: `${m.color}20`, color: m.color, fontWeight: 700 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Nenhuma memória com esse filtro.</p>
        </div>
      )}

      {/* Modal de detalhes */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden" }}>
            <div style={{ height: 180, background: `linear-gradient(135deg, ${selected.color}50, ${selected.color}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem", position: "relative" }}>
              {selected.emoji}
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(0,0,0,0.35)", border: "none", cursor: "pointer", color: "white", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MdClose size={20} />
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.625rem" }}>{selected.title}</h2>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <MdCalendarToday size={15} />
                  {new Date(selected.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {selected.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <MdLocationOn size={15} /> {selected.location}
                  </span>
                )}
              </div>
              {selected.description && <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>{selected.description}</p>}
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {selected.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: "0.8rem", padding: "0.2rem 0.625rem", borderRadius: "9999px", background: `${selected.color}20`, color: selected.color, fontWeight: 700 }}>{tag}</span>
                ))}
              </div>
              <button onClick={() => { showToast("📷 Foto adicionada!"); setSelected(null); }} className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "0.95rem", padding: "0.875rem", background: selected.color }}>
                <MdAdd size={18} /> Adicionar fotos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova memória */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Memória</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Qual foi o momento? *</label>
                <input type="text" value={newMemory.title} onChange={(e) => setNewMemory((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Natal, Aniversário, Viagem..." className="input-field" style={{ fontSize: "1rem" }} autoFocus />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Data *</label>
                  <input type="date" value={newMemory.date} onChange={(e) => setNewMemory((p) => ({ ...p, date: e.target.value }))} className="input-field" style={{ fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Local (opcional)</label>
                  <input type="text" value={newMemory.location} onChange={(e) => setNewMemory((p) => ({ ...p, location: e.target.value }))} placeholder="Onde foi?" className="input-field" style={{ fontSize: "0.95rem" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Descrição (opcional)</label>
                <textarea value={newMemory.description} onChange={(e) => setNewMemory((p) => ({ ...p, description: e.target.value }))} placeholder="Conta um pouco sobre esse momento..." rows={3} className="input-field" style={{ resize: "none", fontSize: "0.95rem" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setAddModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
                <button
                  onClick={() => {
                    if (!newMemory.title || !newMemory.date) return;
                    setMemories((prev) => [...prev, { ...newMemory, id: Date.now().toString(), tags: [] }]);
                    showToast("📸 Memória salva!");
                    setAddModal(false);
                    setNewMemory({ title: "", date: "", location: "", description: "", emoji: "📸", color: "#7aab8a" });
                  }}
                  disabled={!newMemory.title || !newMemory.date}
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800 }}
                >
                  <MdAdd size={20} /> Salvar memória
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
