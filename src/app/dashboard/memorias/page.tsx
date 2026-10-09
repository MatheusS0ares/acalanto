"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdCalendarToday, MdLocationOn } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "acalanto-memory-photos";

interface MemoryRow {
  id: string;
  family_id: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  color: string;
  emoji: string;
  tags: string[];
}

interface PhotoRow {
  id: string;
  memory_id: string;
  file_url: string;
}

const defaultColors = ["#d06a6a", "#c07898", "#6a9fd4", "var(--brand)", "#c99a40", "#88aa40"];

export default function MemoriasPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [tagFilter, setTagFilter] = useState("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from("acalanto_family_members")
      .select("id, family_id")
      .eq("user_id", user.id)
      .single();
    if (!me) { setLoading(false); return; }
    setFamilyId(me.family_id);
    setMemberId(me.id);

    const { data: memoryRows } = await supabase
      .from("acalanto_memories")
      .select("id, family_id, title, date, location, description, color, emoji, tags")
      .eq("family_id", me.family_id)
      .order("date", { ascending: false });
    const ms = memoryRows ?? [];
    setMemories(ms);

    if (ms.length > 0) {
      const { data: photoRows } = await supabase
        .from("acalanto_memory_photos")
        .select("id, memory_id, file_url")
        .in("memory_id", ms.map((m) => m.id));
      setPhotos(photoRows ?? []);
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const allTags = ["Todos", ...new Set(memories.flatMap((m) => m.tags))];
  const filtered = memories.filter((m) => tagFilter === "Todos" || m.tags.includes(tagFilter));
  const sortedByYear = filtered.reduce<Record<string, MemoryRow[]>>((acc, m) => {
    const year = new Date(m.date + "T12:00:00").getFullYear().toString();
    (acc[year] ??= []).push(m);
    return acc;
  }, {});

  const selected = memories.find((m) => m.id === selectedId) ?? null;
  const selectedPhotos = photos.filter((p) => p.memory_id === selectedId);

  async function ensurePhotoUrl(photo: PhotoRow) {
    if (photoUrls.has(photo.id)) return;
    const supabase = createClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.file_url, 3600);
    if (data) setPhotoUrls((prev) => new Map(prev).set(photo.id, data.signedUrl));
  }

  useEffect(() => {
    selectedPhotos.forEach((p) => { ensurePhotoUrl(p); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, photos.length]);

  async function addMemory(input: { title: string; date: string; location: string; description: string }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const color = defaultColors[memories.length % defaultColors.length];
    const row: MemoryRow = {
      id, family_id: familyId, title: input.title, date: input.date,
      location: input.location || null, description: input.description || null,
      color, emoji: "📸", tags: [],
    };
    setMemories((prev) => [row, ...prev]);
    showToast("📸 Memória salva!");
    setAddModal(false);
    const { error } = await supabase.from("acalanto_memories").insert({
      id, family_id: familyId, title: input.title, date: input.date,
      location: input.location || null, description: input.description || null,
      color, emoji: "📸", created_by: memberId,
    });
    if (error) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      showToast("Erro ao salvar memória");
    }
  }

  async function uploadPhotos(memoryId: string, files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const newPhotos: PhotoRow[] = [];
    for (const file of Array.from(files)) {
      const path = `${familyId}/${memoryId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) continue;
      const id = crypto.randomUUID();
      const { error } = await supabase.from("acalanto_memory_photos").insert({ id, memory_id: memoryId, file_url: path });
      if (!error) newPhotos.push({ id, memory_id: memoryId, file_url: path });
    }
    setUploading(false);
    if (newPhotos.length === 0) { showToast("Erro ao enviar as fotos"); return; }
    setPhotos((prev) => [...prev, ...newPhotos]);
    showToast(`📷 ${newPhotos.length} foto(s) adicionada(s)!`);
  }

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
      {allTags.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.75rem" }}>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setTagFilter(tag)}
              style={{ padding: "0.5rem 1rem", borderRadius: "9999px", minHeight: 40, border: `1.5px solid ${tagFilter === tag ? "#c07898" : "var(--border)"}`, background: tagFilter === tag ? "rgba(192,120,152,0.12)" : "transparent", color: tagFilter === tag ? "#c07898" : "var(--text-muted)", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap", fontWeight: tagFilter === tag ? 700 : 500 }}>
              {tag}
            </button>
          ))}
        </div>
      )}

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
              <div key={m.id} onClick={() => setSelectedId(m.id)}
                style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "1px solid var(--border-light)" }}>
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
          onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ height: 180, background: `linear-gradient(135deg, ${selected.color}50, ${selected.color}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem", position: "relative" }}>
              {selected.emoji}
              <button onClick={() => setSelectedId(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(0,0,0,0.35)", border: "none", cursor: "pointer", color: "white", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

              {selectedPhotos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {selectedPhotos.map((p) => (
                    <div key={p.id} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", background: "var(--bg-secondary)" }}>
                      {photoUrls.get(p.id) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrls.get(p.id)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <label className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "0.95rem", padding: "0.875rem", background: selected.color, cursor: "pointer", opacity: uploading ? 0.7 : 1 }}>
                <input type="file" accept="image/*" multiple style={{ display: "none" }}
                  disabled={uploading}
                  onChange={(e) => { if (e.target.files?.length) uploadPhotos(selected.id, e.target.files); }} />
                <MdAdd size={18} /> {uploading ? "Enviando..." : "Adicionar fotos"}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova memória */}
      {addModal && <AddMemoryModal onClose={() => setAddModal(false)} onAdd={addMemory} />}
    </div>
  );
}

function AddMemoryModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (input: { title: string; date: string; location: string; description: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  function save() {
    if (!title || !date) return;
    onAdd({ title, date, location, description });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Memória</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Qual foi o momento? *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Natal, Aniversário, Viagem..." className="input-field" style={{ fontSize: "1rem" }} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Data *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Local (opcional)</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Onde foi?" className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conta um pouco sobre esse momento..." rows={3} className="input-field" style={{ resize: "none", fontSize: "0.95rem" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
            <button onClick={save} disabled={!title || !date} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800 }}>
              <MdAdd size={20} /> Salvar memória
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
