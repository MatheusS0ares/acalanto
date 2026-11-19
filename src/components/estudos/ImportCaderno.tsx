"use client";
import { useState } from "react";
import { MdClose, MdUploadFile } from "react-icons/md";

export interface ImportPayload {
  edital?: {
    name: string; banca?: string; formatoPadrao?: "certo_errado" | "multipla_escolha";
    pontosCerto?: number; pontosErrado?: number; pontosBranco?: number;
  } | null;
  subjects?: { ref: string; name: string; emoji?: string }[];
  topics?: { ref: string; subjectRef: string; name: string }[];
  questions?: {
    subjectRef: string; topicRef?: string; format: "certo_errado" | "multipla_escolha";
    statement: string; alternatives?: { key: string; text: string }[]; correctAnswer: string;
    explanation?: string; mnemonic?: string; mindMap?: string;
  }[];
  notes?: {
    type: "nota" | "checklist"; title: string; content?: string; dueDate?: string;
    subjectRef?: string; editalRef?: boolean;
  }[];
}

interface Props {
  accent: string;
  onClose: () => void;
  onImport: (payload: ImportPayload) => Promise<boolean>;
}

const placeholder = `{
  "edital": { "name": "DPDF TI 2026", "banca": "Instituto ACCESS", "formatoPadrao": "multipla_escolha", "pontosCerto": 1, "pontosErrado": 0, "pontosBranco": 0 },
  "subjects": [{ "ref": "s1", "name": "Banco de Dados", "emoji": "🗄️" }],
  "topics": [{ "ref": "t1", "subjectRef": "s1", "name": "Normalização" }],
  "questions": [{
    "subjectRef": "s1", "topicRef": "t1", "format": "multipla_escolha",
    "statement": "...", "alternatives": [{"key":"A","text":"..."}], "correctAnswer": "A",
    "explanation": "...", "mnemonic": "...", "mindMap": "..."
  }],
  "notes": [{ "type": "checklist", "title": "Pagar taxa", "dueDate": "2027-01-08", "editalRef": true }]
}`;

export function ImportCaderno({ accent, onClose, onImport }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    setError("");
    let payload: ImportPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setError("JSON inválido — confere se copiou o conteúdo completo.");
      return;
    }
    setImporting(true);
    const ok = await onImport(payload);
    setImporting(false);
    if (ok) onClose();
    else setError("Não deu pra importar tudo — confere o toast de erro no canto da tela.");
  }

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 600, padding: "1.5rem 1.5rem 2rem", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MdUploadFile size={22} /> Importar caderno
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Cole aqui o JSON que eu te mandar quando você trouxer um novo caderno do NotebookLM. Matérias e assuntos com o mesmo nome dos que já existem não duplicam.
        </p>
        <textarea
          autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", minHeight: 280, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.8rem 0.9rem", fontSize: "0.78rem", resize: "vertical", outline: "none", fontFamily: "monospace", marginBottom: "0.75rem" }}
        />
        {error && (
          <div style={{ background: "rgba(208,106,106,0.1)", border: "1px solid rgba(208,106,106,0.3)", borderRadius: 10, padding: "0.6rem 0.8rem", fontSize: "0.82rem", color: "#d06a6a", marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <button onClick={handleImport} disabled={!text.trim() || importing} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent, opacity: text.trim() ? 1 : 0.5 }}>
          <MdUploadFile size={18} /> {importing ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}
