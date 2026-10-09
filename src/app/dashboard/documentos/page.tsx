"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdPerson, MdSearch, MdUpload, MdCloudDownload, MdClose, MdWarning } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "acalanto-family-documents";

const categories = ["Todos", "Identidade", "Habilitação", "Veículos", "Imóvel", "Saúde", "Certidões", "Outros"];
const emojiByCategory: Record<string, string> = {
  Identidade: "🪪", Habilitação: "🚗", Veículos: "📄", Imóvel: "🏠", Saúde: "❤️‍🩹", Certidões: "💍", Outros: "📄",
};

interface DocRow {
  id: string;
  family_id: string;
  name: string;
  category: string;
  file_url: string;
  file_size: number | null;
  file_name: string | null;
  expires_at: string | null;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [uploadModal, setUploadModal] = useState(false);
  const [toast, setToast] = useState("");

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

    const { data: rows } = await supabase
      .from("acalanto_documents")
      .select("id, family_id, name, category, file_url, file_size, file_name, expires_at")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setDocs(rows ?? []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function uploadDoc(input: { file: File; name: string; category: string; expiresAt: string }) {
    const supabase = createClient();
    const path = `${familyId}/${crypto.randomUUID()}-${input.file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file);
    if (uploadError) {
      showToast("Erro ao enviar o arquivo");
      return;
    }
    const id = crypto.randomUUID();
    const row: DocRow = {
      id, family_id: familyId, name: input.name, category: input.category,
      file_url: path, file_size: input.file.size, file_name: input.file.name,
      expires_at: input.expiresAt || null,
    };
    const { error } = await supabase.from("acalanto_documents").insert({
      id, family_id: familyId, name: input.name, category: input.category,
      file_url: path, file_size: input.file.size, file_name: input.file.name,
      expires_at: input.expiresAt || null,
    });
    if (error) {
      showToast("Erro ao salvar o documento");
      return;
    }
    setDocs((prev) => [row, ...prev]);
    showToast(`✅ "${input.name}" enviado!`);
    setUploadModal(false);
  }

  async function downloadDoc(doc: DocRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_url, 3600);
    if (error || !data) {
      showToast("Erro ao gerar link do arquivo");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const filtered = docs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "Todos" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const expiringSoon = docs.filter((d) => {
    if (!d.expires_at) return false;
    const days = (new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 90;
  });

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

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
          📄 Documentos da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{docs.length} documentos guardados com segurança.</p>
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
                {emojiByCategory[d.category] ?? "📄"} {d.name} — vence {new Date(d.expires_at! + "T12:00:00").toLocaleDateString("pt-BR")}
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
          const daysToExpiry = doc.expires_at
            ? (new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            : null;
          const expiring = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 90;

          return (
            <div
              key={doc.id}
              className="card"
              style={{
                padding: "1.25rem",
                borderColor: expiring ? "rgba(251,191,36,0.3)" : undefined,
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", textAlign: "center" }}>{emojiByCategory[doc.category] ?? "📄"}</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>{doc.category}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><MdPerson size={11} /> Família</span>
                <span>{fmtSize(doc.file_size)}</span>
              </div>
              {expiring && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#fbbf24", fontWeight: 600 }}>
                  ⚠ Vence em {Math.floor(daysToExpiry!)} dias
                </div>
              )}
              <button
                onClick={() => downloadDoc(doc)}
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
          }}
        >
          <MdAdd size={28} />
          <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>Enviar documento</span>
        </div>
      </div>

      {uploadModal && <UploadModal onClose={() => setUploadModal(false)} onUpload={uploadDoc} />}
    </div>
  );
}

function UploadModal({ onClose, onUpload }: {
  onClose: () => void;
  onUpload: (input: { file: File; name: string; category: string; expiresAt: string }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[1]);
  const [expiresAt, setExpiresAt] = useState("");
  const [sending, setSending] = useState(false);

  function pickFile(f: File) {
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function save() {
    if (!file || !name.trim()) return;
    setSending(true);
    await onUpload({ file, name: name.trim(), category, expiresAt });
    setSending(false);
  }

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
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
            style={{
              border: `2px dashed ${dragging ? "#3b82f6" : "var(--border)"}`,
              borderRadius: "0.875rem",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
              display: "block",
            }}
          >
            <input type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
            <MdUpload size={32} color={dragging ? "#60a5fa" : "var(--text-muted)"} style={{ marginBottom: "0.75rem" }} />
            {file ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600 }}>{file.name}</p>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Arraste o arquivo aqui ou <span style={{ color: "#60a5fa" }}>clique para selecionar</span>
              </p>
            )}
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do documento" className="input-field" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Vencimento (opcional)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input-field" />
            </div>
          </div>
          <button onClick={save} disabled={!file || !name.trim() || sending} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: "#3b82f6", opacity: (!file || !name.trim() || sending) ? 0.6 : 1 }}>
            <MdUpload size={18} /> {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
