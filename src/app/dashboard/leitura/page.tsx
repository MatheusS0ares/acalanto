"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MdAdd, MdClose, MdEdit, MdBarChart, MdMenuBook,
  MdStar, MdStarBorder, MdPlayArrow, MdCheckCircle, MdBlock,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { Book, BookStatus, FamilyMember } from "@/types";
import { AnalisesLeitura } from "@/components/leitura/AnalisesLeitura";

const statusConfig: Record<BookStatus, { label: string; emoji: string; color: string }> = {
  quero_ler: { label: "Quero ler", emoji: "📚", color: "#8a96a0" },
  lendo: { label: "Lendo", emoji: "📖", color: "#c99a40" },
  lido: { label: "Lido", emoji: "✅", color: "#7aab8a" },
  abandonado: { label: "Abandonado", emoji: "🚫", color: "#d06a6a" },
};

type TabFilter = "todos" | "quero_ler" | "lendo" | "lido";
const tabOptions: { id: TabFilter; label: string }[] = [
  { id: "quero_ler", label: "📚 Quero ler" },
  { id: "lendo", label: "📖 Lendo" },
  { id: "lido", label: "✅ Lido" },
  { id: "todos", label: "Todos" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function StarRating({ value, onChange, size = 17 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "0.1rem" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const Icon = filled ? MdStar : MdStarBorder;
        return (
          <span
            key={n}
            onClick={onChange ? () => onChange(n) : undefined}
            style={{ cursor: onChange ? "pointer" : "default", color: filled ? "#c99a40" : "var(--border)", display: "flex" }}
          >
            <Icon size={size} />
          </span>
        );
      })}
    </div>
  );
}

export default function LeituraPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<"estante" | "indicadores">("estante");

  const [readerFilter, setReaderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TabFilter>("lendo");

  const [addModal, setAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [pages, setPages] = useState("");
  const [status, setStatus] = useState<BookStatus>("quero_ler");
  const [startedAt, setStartedAt] = useState("");
  const [finishedAt, setFinishedAt] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [readerId, setReaderId] = useState("");
  const [saving, setSaving] = useState(false);

  const [finishingBook, setFinishingBook] = useState<Book | null>(null);
  const [finishRating, setFinishRating] = useState(0);
  const [finishDate, setFinishDate] = useState(todayStr());

  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

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
    setReaderId(me.id);

    const { data: memberRows } = await supabase
      .from("acalanto_family_members")
      .select("*")
      .eq("family_id", me.family_id);
    setMembers(memberRows ?? []);

    const { data: bookRows } = await supabase
      .from("acalanto_books")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setBooks(bookRows ?? []);
    setLoading(false);
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const readerName = (id: string | null) => (id && memberMap.get(id)?.name) || "Família";
  const genreOptions = useMemo(
    () => Array.from(new Set(books.map((b) => b.genre).filter((g): g is string => !!g?.trim()))),
    [books]
  );

  function openAdd() {
    setEditingId(null);
    setTitle(""); setAuthor(""); setGenre(""); setPages("");
    setStatus("quero_ler"); setStartedAt(""); setFinishedAt(""); setRating(0); setNotes("");
    setReaderId(readerFilter !== "all" ? readerFilter : memberId);
    setAddModal(true);
  }

  function openEdit(book: Book) {
    setEditingId(book.id);
    setTitle(book.title); setAuthor(book.author ?? ""); setGenre(book.genre ?? "");
    setPages(book.pages != null ? String(book.pages) : "");
    setStatus(book.status); setStartedAt(book.started_at ?? ""); setFinishedAt(book.finished_at ?? "");
    setRating(book.rating ?? 0); setNotes(book.notes ?? ""); setReaderId(book.reader_id ?? memberId);
    setAddModal(true);
  }

  function closeModal() {
    setAddModal(false);
    setEditingId(null);
  }

  async function saveBook() {
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: title.trim(),
      author: author.trim() || null,
      genre: genre.trim() || null,
      status,
      pages: pages.trim() ? parseInt(pages, 10) : null,
      rating: status === "lido" && rating > 0 ? rating : null,
      started_at: status !== "quero_ler" ? (startedAt || todayStr()) : null,
      finished_at: status === "lido" ? (finishedAt || todayStr()) : null,
      reader_id: readerId || null,
      notes: notes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("acalanto_books").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) { showToast("Erro ao salvar alterações"); return; }
      setBooks((prev) => prev.map((b) => b.id === editingId ? { ...b, ...payload } : b));
      showToast(`"${payload.title}" atualizado`);
    } else {
      const id = crypto.randomUUID();
      const { error } = await supabase.from("acalanto_books").insert({ id, family_id: familyId, ...payload });
      setSaving(false);
      if (error) { showToast("Erro ao adicionar livro"); return; }
      setBooks((prev) => [{ id, family_id: familyId, created_at: new Date().toISOString(), ...payload } as Book, ...prev]);
      showToast(`✓ "${payload.title}" adicionado!`);
    }
    closeModal();
  }

  async function removeBook(book: Book) {
    const supabase = createClient();
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    await supabase.from("acalanto_books").delete().eq("id", book.id);
    showToast(`"${book.title}" removido`);
  }

  async function startReading(book: Book) {
    const supabase = createClient();
    const patch = { status: "lendo" as BookStatus, started_at: book.started_at ?? todayStr() };
    setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, ...patch } : b));
    await supabase.from("acalanto_books").update(patch).eq("id", book.id);
    showToast(`📖 Começou a ler "${book.title}"`);
  }

  async function abandonBook(book: Book) {
    const supabase = createClient();
    const patch = { status: "abandonado" as BookStatus };
    setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, ...patch } : b));
    await supabase.from("acalanto_books").update(patch).eq("id", book.id);
    showToast(`"${book.title}" marcado como abandonado`);
  }

  function openFinishModal(book: Book) {
    setFinishingBook(book);
    setFinishRating(book.rating ?? 0);
    setFinishDate(book.finished_at ?? todayStr());
  }

  async function confirmFinish() {
    if (!finishingBook) return;
    const supabase = createClient();
    const patch = {
      status: "lido" as BookStatus,
      finished_at: finishDate || todayStr(),
      rating: finishRating || null,
      started_at: finishingBook.started_at ?? (finishDate || todayStr()),
    };
    setBooks((prev) => prev.map((b) => b.id === finishingBook.id ? { ...b, ...patch } : b));
    await supabase.from("acalanto_books").update(patch).eq("id", finishingBook.id);
    showToast(`✅ "${finishingBook.title}" concluído!`);
    setFinishingBook(null);
  }

  const byReader = readerFilter === "all" ? books : books.filter((b) => b.reader_id === readerFilter);
  const counts = {
    quero_ler: byReader.filter((b) => b.status === "quero_ler").length,
    lendo: byReader.filter((b) => b.status === "lendo").length,
    lido: byReader.filter((b) => b.status === "lido").length,
    todos: byReader.length,
  };

  const visible = statusFilter === "todos" ? byReader : byReader.filter((b) => b.status === statusFilter);

  const sortedVisible = useMemo(() => {
    const list = [...visible];
    if (statusFilter === "lendo") {
      list.sort((a, b) => (a.started_at ?? "").localeCompare(b.started_at ?? ""));
    } else if (statusFilter === "lido") {
      list.sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""));
    } else if (statusFilter === "quero_ler") {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      list.sort((a, b) => (b.finished_at ?? b.started_at ?? b.created_at).localeCompare(a.finished_at ?? a.started_at ?? a.created_at));
    }
    return list;
  }, [visible, statusFilter]);

  const lidoByYear = useMemo(() => {
    if (statusFilter !== "lido") return [];
    const map = new Map<string, Book[]>();
    sortedVisible.forEach((b) => {
      const year = b.finished_at ? b.finished_at.slice(0, 4) : "Sem data";
      const arr = map.get(year) ?? [];
      arr.push(b);
      map.set(year, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [sortedVisible, statusFilter]);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando sua estante...
      </div>
    );
  }

  function renderCard(book: Book) {
    const cfg = statusConfig[book.status];
    return (
      <div key={book.id} className="card" style={{ padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem" }}>
          <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{cfg.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{book.title}</div>
            {book.author && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{book.author}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.35rem" }}>
              {members.length > 1 && (
                <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                  {readerName(book.reader_id)}
                </span>
              )}
              {book.genre && (
                <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                  {book.genre}
                </span>
              )}
              {book.pages != null && (
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{book.pages} págs.</span>
              )}
            </div>
            {book.status === "lendo" && book.started_at && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Começou em {new Date(book.started_at + "T12:00:00").toLocaleDateString("pt-BR")} · {daysBetween(book.started_at, todayStr())} dias lendo
              </div>
            )}
            {book.status === "lido" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.3rem" }}>
                {book.finished_at && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Concluído em {new Date(book.finished_at + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
                {book.rating != null && <StarRating value={book.rating} size={14} />}
              </div>
            )}
            {book.notes && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem", fontStyle: "italic" }}>
                &quot;{book.notes}&quot;
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
          {book.status === "quero_ler" && (
            <button onClick={() => startReading(book)} className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem" }}>
              <MdPlayArrow size={15} /> Começar a ler
            </button>
          )}
          {book.status === "lendo" && (
            <>
              <button onClick={() => openFinishModal(book)} className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem" }}>
                <MdCheckCircle size={15} /> Terminei
              </button>
              <button onClick={() => abandonBook(book)} aria-label="Abandonar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.35rem" }}>
                <MdBlock size={16} />
              </button>
            </>
          )}
          <button onClick={() => openEdit(book)} aria-label={`Editar ${book.title}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.35rem" }}>
            <MdEdit size={16} />
          </button>
          <button onClick={() => removeBook(book)} aria-label={`Remover ${book.title}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.35rem" }}>
            <MdClose size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "2rem" }}>
      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
          background: "#2a5a3a", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "999px",
          fontSize: "0.9rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 200, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          📚 Leitura
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {view === "estante" ? "Sua estante, o que está lendo e a fila" : "Seus indicadores de leitura ao longo do ano"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          onClick={() => setView("estante")}
          style={{
            flex: 1, padding: "0.55rem 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: view === "estante" ? "var(--brand)" : "var(--bg-secondary)",
            color: view === "estante" ? "#fff" : "var(--text-muted)",
          }}
        >
          <MdMenuBook size={16} /> Estante
        </button>
        <button
          onClick={() => setView("indicadores")}
          style={{
            flex: 1, padding: "0.55rem 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: view === "indicadores" ? "var(--brand)" : "var(--bg-secondary)",
            color: view === "indicadores" ? "#fff" : "var(--text-muted)",
          }}
        >
          <MdBarChart size={16} /> Indicadores
        </button>
      </div>

      {view === "indicadores" && <AnalisesLeitura books={books} members={members} />}

      {view === "estante" && (
        <>
          {members.length > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setReaderFilter("all")}
                style={{
                  padding: "0.4rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
                  fontSize: "0.8rem", fontWeight: 700,
                  background: readerFilter === "all" ? "var(--brand)" : "var(--bg-secondary)",
                  color: readerFilter === "all" ? "#fff" : "var(--text-muted)",
                }}
              >
                Todos
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setReaderFilter(m.id)}
                  style={{
                    padding: "0.4rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
                    fontSize: "0.8rem", fontWeight: 700,
                    background: readerFilter === m.id ? "var(--brand)" : "var(--bg-secondary)",
                    color: readerFilter === m.id ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {tabOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                style={{
                  padding: "0.4rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
                  fontSize: "0.8rem", fontWeight: 700,
                  background: statusFilter === t.id ? "var(--brand)" : "var(--bg-secondary)",
                  color: statusFilter === t.id ? "#fff" : "var(--text-muted)",
                }}
              >
                {t.label} {counts[t.id] > 0 && `(${counts[t.id]})`}
              </button>
            ))}
          </div>

          <button
            onClick={openAdd}
            style={{
              width: "100%", padding: "1rem", borderRadius: "16px", background: "var(--brand)",
              color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.6rem", fontSize: "1.02rem", fontWeight: 800,
              boxShadow: "0 4px 16px rgba(122,171,138,0.35)", marginBottom: "1.25rem",
            }}
          >
            <MdAdd size={22} /> Adicionar livro
          </button>

          {sortedVisible.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📚</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                Nada por aqui ainda
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Adicione um livro pra começar a registrar sua leitura
              </div>
            </div>
          )}

          {statusFilter === "lido" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {lidoByYear.map(([year, yearBooks]) => (
                <div key={year}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{year}</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {yearBooks.length} {yearBooks.length === 1 ? "livro" : "livros"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {yearBooks.map(renderCard)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {sortedVisible.map(renderCard)}
            </div>
          )}
        </>
      )}

      {/* Modal terminar livro */}
      {finishingBook && (
        <div onClick={(e) => e.target === e.currentTarget && setFinishingBook(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
              ✅ Terminou &quot;{finishingBook.title}&quot;?
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.1rem" }}>
              O que achou do livro?
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <StarRating value={finishRating} onChange={setFinishRating} size={28} />
            </div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Data de conclusão</label>
            <input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} className="input-field" style={{ marginBottom: "1.25rem" }} />
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setFinishingBook(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
              <button onClick={confirmFinish} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Concluir livro</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal adicionar/editar livro */}
      {addModal && (
        <div onClick={(e) => e.target === e.currentTarget && closeModal()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {editingId ? "✏️ Editar livro" : "📚 Adicionar livro"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Título</label>
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: O Nome do Vento" className="input-field" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Autor</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex: Patrick Rothfuss" className="input-field" />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Gênero</label>
                  <input
                    type="text" list="genre-options" value={genre} onChange={(e) => setGenre(e.target.value)}
                    placeholder="Ex: Fantasia" className="input-field"
                  />
                  <datalist id="genre-options">
                    {genreOptions.map((g) => <option key={g} value={g} />)}
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Páginas</label>
                  <input type="number" min={1} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="320" className="input-field" />
                </div>
              </div>

              {members.length > 1 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Quem está lendo</label>
                  <select value={readerId} onChange={(e) => setReaderId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Status</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {(Object.keys(statusConfig) as BookStatus[]).map((s) => (
                    <button
                      key={s} type="button" onClick={() => setStatus(s)}
                      style={{
                        padding: "0.4rem 0.8rem", borderRadius: 999, fontSize: "0.78rem", cursor: "pointer",
                        border: `1.5px solid ${status === s ? statusConfig[s].color : "var(--border)"}`,
                        background: status === s ? `${statusConfig[s].color}18` : "transparent",
                        color: status === s ? statusConfig[s].color : "var(--text-muted)",
                        fontWeight: status === s ? 700 : 400,
                      }}
                    >
                      {statusConfig[s].emoji} {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {status !== "quero_ler" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Data de início</label>
                  <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className="input-field" />
                </div>
              )}

              {status === "lido" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Data de conclusão</label>
                    <input type="date" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Nota</label>
                    <StarRating value={rating} onChange={setRating} size={24} />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Notas (opcional)</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que você achou, trechos marcantes..."
                  style={{
                    width: "100%", minHeight: 70, background: "var(--bg-secondary)", color: "var(--text-primary)",
                    border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.9rem", fontSize: "0.88rem",
                    resize: "vertical", outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>

              <button onClick={saveBook} disabled={!title.trim() || saving} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.3rem", opacity: title.trim() ? 1 : 0.5 }}>
                <MdAdd size={18} /> {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
