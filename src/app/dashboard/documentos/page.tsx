"use client";
import { useState } from "react";
import { MdAdd, MdDescription, MdPerson, MdSearch, MdUpload, MdCloudDownload, MdFolder, MdClose, MdWarning } from "react-icons/md";

const categories = ["Todos", "Identidade", "Habilitação", "Veículos", "Imóvel", "Saúde", "Certidões", "Outros"];

const mockDocs = [
  { id: "1", name: "RG — Matheus", category: "Identidade", owner: "Matheus", expires: null, size: "2.1 MB", emoji: "🪪", date: "2024-03-10" },
  { id: "2", name: "CNH — Matheus", category: "Habilitação", owner: "Matheus", expires: "2028-05-22", size: "1.8 MB", emoji: "🚗", date: "2023-05-22" },
  { id: "3", name: "RG — Ana", category: "Identidade", owner: "Ana", expires: null, size: "1.5 MB", emoji: "🪪", date: "2025-01-15" },
  { id: "4", name: "CRLV 2026", category: "Veículos", owner: "Família", expires: "2026-12-31", size: "0.9 MB", emoji: "📄", date: "2026-01-05" },
  { id: "5", name: "Certidão de Casamento", category: "Certidões", owner: "Família", expires: null, size: "3.2 MB", emoji: "💍", date: "2020-09-12" },
  { id: "6", name: "Escritura do Imóvel", category: "Imóvel", owner: "Família", expires: null, size: "12.4 MB", emoji: "🏠", date: "2021-04-03" },
  { id: "7", name: "Carteirinha do Plano", category: "Saúde", owner: "Família", expires: "2026-12-31", size: "0.4 MB", emoji: "❤️‍🩹", date: "2026-01-01" },
];

export default function DocumentosPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [uploadModal, setUploadModal] = useState(false);

  const filtered = mockDocs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "Todos" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const expiringSoon = mockDocs.filter((d) => {
    if (!d.expires) return false;
    const days = (new Date(d.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 90;
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          📄 Documentos da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{mockDocs.length} documentos guardados com segurança.</p>
      </div>
      <button onClick={() => setUploadModal(true)} style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#6a9fd4", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(106,159,212,0.35)", marginBottom: "1.5rem" }}>
        <MdUpload size={24} /> Enviar novo documento
      </button>

      {/* Alerta de vencimento */}
      {expiringSoon.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <MdWarning size={18} color="#fbbf24" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fbbf24", marginBottom: "0.3rem" }}>
              {expiringSoon.length} documento(s) vencem em breve
            </div>
            {expiringSoon.map((d) => (
              <div key={d.id} style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {d.emoji} {d.name} — vence {new Date(d.expires! + "T12:00:00").toLocaleDateString("pt-BR")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <div style={{ position: "relative", marginBottom: "0.875rem" }}>
        <MdSearch size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documento..." className="input-field" style={{ paddingLeft: "2.5rem" }} />
      </div>

      {/* Categorias */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.35rem" }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            style={{ padding: "0.5rem 1rem", borderRadius: "9999px", minHeight: 40, border: `1.5px solid ${categoryFilter === cat ? "#6a9fd4" : "var(--border)"}`, background: categoryFilter === cat ? "rgba(106,159,212,0.12)" : "transparent", color: categoryFilter === cat ? "#6a9fd4" : "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap", fontWeight: categoryFilter === cat ? 700 : 500 }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de documentos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
        {filtered.map((doc) => {
          const daysToExpiry = doc.expires
            ? (new Date(doc.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            : null;
          const expiring = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 90;

          return (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: "1.25rem",
                cursor: "pointer",
                borderColor: expiring ? "rgba(251,191,36,0.3)" : undefined,
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", textAlign: "center" }}>{doc.emoji}</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>{doc.category}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><MdPerson size={11} /> {doc.owner}</span>
                <span>{doc.size}</span>
              </div>
              {expiring && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#fbbf24", fontWeight: 600 }}>
                  ⚠ Vence em {Math.floor(daysToExpiry!)} dias
                </div>
              )}
              <button
                style={{
                  marginTop: "0.75rem", width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                  padding: "0.4rem", borderRadius: "0.5rem",
                  background: "var(--bg-secondary)", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontSize: "0.78rem", cursor: "pointer",
                }}
              >
                <MdCloudDownload size={14} /> Baixar
              </button>
            </div>
          );
        })}

        {/* Card de upload */}
        <div
          onClick={() => setUploadModal(true)}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            cursor: "pointer",
            minHeight: 160,
            color: "var(--text-muted)",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLElement).style.color = "#60a5fa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <MdAdd size={28} />
          <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>Enviar documento</span>
        </div>
      </div>

      {uploadModal && <UploadModal onClose={() => setUploadModal(false)} />}
    </div>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 500, padding: "1.5rem" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Enviar Documento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Área de drag&drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); }}
            style={{
              border: `2px dashed ${dragging ? "#3b82f6" : "var(--border)"}`,
              borderRadius: "0.875rem",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <MdUpload size={32} color={dragging ? "#60a5fa" : "var(--text-muted)"} style={{ marginBottom: "0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Arraste o arquivo aqui ou{" "}
              <span style={{ color: "#60a5fa", cursor: "pointer" }}>clique para selecionar</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PDF, JPG, PNG — até 20MB</p>
          </div>
          <input type="text" placeholder="Nome do documento" className="input-field" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Categoria</label>
              <select className="input-field" style={{ cursor: "pointer" }}>
                {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Vencimento (opcional)</label>
              <input type="date" className="input-field" />
            </div>
          </div>
          <button onClick={onClose} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: "#3b82f6" }}>
            <MdUpload size={18} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
