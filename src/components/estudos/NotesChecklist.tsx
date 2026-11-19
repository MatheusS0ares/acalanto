"use client";
import { useState } from "react";
import { MdAdd, MdClose, MdCheck, MdDelete, MdExpandMore, MdExpandLess, MdChecklist, MdStickyNote2 } from "react-icons/md";
import type { StudySubject, StudyEdital, StudyNote, StudyNoteType } from "@/types";

interface Props {
  notes: StudyNote[];
  subjects: StudySubject[];
  editais: StudyEdital[];
  accent: string;
  onAddNote: (input: { type: StudyNoteType; title: string; content: string | null; dueDate: string | null; subjectId: string | null; editalId: string | null }) => void;
  onToggleDone: (note: StudyNote) => void;
  onRemoveNote: (note: StudyNote) => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function NotesChecklist({ notes, subjects, editais, accent, onAddNote, onToggleDone, onRemoveNote }: Props) {
  const [modal, setModal] = useState(false);
  const [type, setType] = useState<StudyNoteType>("checklist");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [editalId, setEditalId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const editalMap = new Map(editais.map((e) => [e.id, e]));

  const checklistItems = notes
    .filter((n) => n.type === "checklist")
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
  const freeNotes = notes.filter((n) => n.type === "nota").sort((a, b) => b.created_at.localeCompare(a.created_at));

  function openModal(initialType: StudyNoteType) {
    setType(initialType);
    setTitle("");
    setContent("");
    setDueDate("");
    setSubjectId("");
    setEditalId("");
    setModal(true);
  }

  function save() {
    const t = title.trim();
    if (!t) return;
    onAddNote({
      type, title: t,
      content: type === "nota" ? (content.trim() || null) : null,
      dueDate: type === "checklist" ? (dueDate || null) : null,
      subjectId: subjectId || null, editalId: editalId || null,
    });
    setModal(false);
  }

  const today = todayStr();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button onClick={() => openModal("checklist")} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
          <MdChecklist size={18} /> Novo item de checklist
        </button>
        <button onClick={() => openModal("nota")} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
          <MdStickyNote2 size={18} /> Nova nota
        </button>
      </div>

      {checklistItems.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MdChecklist size={18} /> Checklist
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {checklistItems.map((item) => {
              const overdue = !item.done && item.due_date != null && item.due_date < today;
              const soon = !item.done && item.due_date != null && !overdue && item.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              const subject = item.subject_id ? subjectMap.get(item.subject_id) : null;
              const edital = item.edital_id ? editalMap.get(item.edital_id) : null;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border-light)" }}>
                  <button
                    onClick={() => onToggleDone(item)}
                    aria-label={item.done ? "Desmarcar" : "Marcar como feito"}
                    style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0, border: `2px solid ${item.done ? accent : "var(--border)"}`,
                      background: item.done ? accent : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {item.done && <MdCheck size={15} color="white" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: item.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
                      {item.title}
                    </div>
                    {(subject || edital) && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {subject ? `${subject.emoji} ${subject.name}` : ""}{subject && edital ? " · " : ""}{edital?.name ?? ""}
                      </div>
                    )}
                  </div>
                  {item.due_date && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: overdue ? "#d06a6a" : soon ? "#c99a40" : "var(--text-muted)", flexShrink: 0 }}>
                      {new Date(item.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  )}
                  <button onClick={() => onRemoveNote(item)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                    <MdClose size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {freeNotes.length === 0 && checklistItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Nenhuma nota ou item de checklist ainda.
          </div>
        )}
        {freeNotes.map((note) => {
          const expanded = expandedId === note.id;
          const subject = note.subject_id ? subjectMap.get(note.subject_id) : null;
          const edital = note.edital_id ? editalMap.get(note.edital_id) : null;
          return (
            <div key={note.id} className="card" style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: note.content ? "pointer" : "default" }} onClick={() => note.content && setExpandedId(expanded ? null : note.id)}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>📝</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{note.title}</div>
                  {(subject || edital) && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {subject ? `${subject.emoji} ${subject.name}` : ""}{subject && edital ? " · " : ""}{edital?.name ?? ""}
                    </div>
                  )}
                  {expanded && note.content && (
                    <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "0.6rem", whiteSpace: "pre-wrap" }}>{note.content}</div>
                  )}
                </div>
                {note.content && <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{expanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}</span>}
                <button onClick={(e) => { e.stopPropagation(); onRemoveNote(note); }} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{type === "checklist" ? "Novo item de checklist" : "Nova nota"}</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
              {(["checklist", "nota"] as StudyNoteType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: 10, border: `1.5px solid ${type === t ? accent : "var(--border)"}`, background: type === t ? `${accent}18` : "transparent", color: type === t ? accent : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {t === "checklist" ? "Checklist" : "Nota"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Título</label>
                <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "checklist" ? "Ex: Pagar taxa de inscrição" : "Ex: Resumo LC 840/2011"} className="input-field" />
              </div>

              {type === "checklist" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Prazo (opcional)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Conteúdo (opcional)</label>
                  <textarea
                    value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detalhes, pontos-chave..."
                    style={{ width: "100%", minHeight: 100, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.9rem", fontSize: "0.88rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Matéria (opcional)</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    <option value="">Nenhuma</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Edital (opcional)</label>
                  <select value={editalId} onChange={(e) => setEditalId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    <option value="">Nenhum</option>
                    {editais.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={save} disabled={!title.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent, opacity: title.trim() ? 1 : 0.5 }}>
                <MdAdd size={18} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
