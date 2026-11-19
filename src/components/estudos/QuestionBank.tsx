"use client";
import { useState } from "react";
import { MdAdd, MdClose, MdCheck, MdDelete, MdEdit, MdExpandMore, MdExpandLess } from "react-icons/md";
import type { StudySubject, StudyTopic, StudyEdital, StudyQuestion, QuestionFormat, QuestionAlternative } from "@/types";

interface Props {
  subjects: StudySubject[];
  topics: StudyTopic[];
  editais: StudyEdital[];
  questions: StudyQuestion[];
  accent: string;
  onAddEdital: (input: { name: string; banca: string; formatoPadrao: QuestionFormat; pontosCerto: number; pontosErrado: number; pontosBranco: number }) => void;
  onRemoveEdital: (edital: StudyEdital) => void;
  onSaveQuestion: (input: {
    id?: string; subjectId: string; topicId: string | null; editalId: string | null; format: QuestionFormat;
    statement: string; alternatives: QuestionAlternative[] | null; correctAnswer: string;
    explanation: string | null; mnemonic: string | null; mindMap: string | null;
  }) => void;
  onRemoveQuestion: (question: StudyQuestion) => void;
}

const defaultAlternatives: QuestionAlternative[] = ["A", "B", "C", "D", "E"].map((k) => ({ key: k, text: "" }));

export function QuestionBank({ subjects, topics, editais, questions, accent, onAddEdital, onRemoveEdital, onSaveQuestion, onRemoveQuestion }: Props) {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editalModal, setEditalModal] = useState(false);
  const [newEditalName, setNewEditalName] = useState("");
  const [newEditalBanca, setNewEditalBanca] = useState("");
  const [newEditalFormato, setNewEditalFormato] = useState<QuestionFormat>("certo_errado");
  const [newEditalCerto, setNewEditalCerto] = useState("1");
  const [newEditalErrado, setNewEditalErrado] = useState("-1");
  const [newEditalBranco, setNewEditalBranco] = useState("0");

  const [questionModal, setQuestionModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qSubjectId, setQSubjectId] = useState("");
  const [qTopicId, setQTopicId] = useState("");
  const [qEditalId, setQEditalId] = useState("");
  const [qFormat, setQFormat] = useState<QuestionFormat>("certo_errado");
  const [qStatement, setQStatement] = useState("");
  const [qAlternatives, setQAlternatives] = useState<QuestionAlternative[]>(defaultAlternatives);
  const [qCorrectCE, setQCorrectCE] = useState<"certo" | "errado">("certo");
  const [qCorrectME, setQCorrectME] = useState("A");
  const [qExplanation, setQExplanation] = useState("");
  const [qMnemonic, setQMnemonic] = useState("");
  const [qMindMap, setQMindMap] = useState("");

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const editalMap = new Map(editais.map((e) => [e.id, e]));
  const topicsForFilter = subjectFilter === "all" ? [] : topics.filter((t) => t.subject_id === subjectFilter);
  const topicsForQSubject = topics.filter((t) => t.subject_id === qSubjectId);

  const filtered = questions.filter((q) => {
    if (subjectFilter !== "all" && q.subject_id !== subjectFilter) return false;
    if (topicFilter !== "all" && q.topic_id !== topicFilter) return false;
    return true;
  });

  function openNewQuestion() {
    setEditingId(null);
    setQSubjectId(subjects[0]?.id ?? "");
    setQTopicId("");
    setQEditalId("");
    setQFormat("certo_errado");
    setQStatement("");
    setQAlternatives(defaultAlternatives);
    setQCorrectCE("certo");
    setQCorrectME("A");
    setQExplanation("");
    setQMnemonic("");
    setQMindMap("");
    setQuestionModal(true);
  }

  function openEditQuestion(q: StudyQuestion) {
    setEditingId(q.id);
    setQSubjectId(q.subject_id);
    setQTopicId(q.topic_id ?? "");
    setQEditalId(q.edital_id ?? "");
    setQFormat(q.format);
    setQStatement(q.statement);
    setQAlternatives(q.alternatives && q.alternatives.length ? q.alternatives : defaultAlternatives);
    if (q.format === "certo_errado") setQCorrectCE(q.correct_answer === "errado" ? "errado" : "certo");
    else setQCorrectME(q.correct_answer || "A");
    setQExplanation(q.explanation ?? "");
    setQMnemonic(q.mnemonic ?? "");
    setQMindMap(q.mind_map ?? "");
    setQuestionModal(true);
  }

  function saveEdital() {
    const name = newEditalName.trim();
    if (!name) return;
    onAddEdital({
      name, banca: newEditalBanca.trim(),
      formatoPadrao: newEditalFormato,
      pontosCerto: parseFloat(newEditalCerto) || 0,
      pontosErrado: parseFloat(newEditalErrado) || 0,
      pontosBranco: parseFloat(newEditalBranco) || 0,
    });
    setEditalModal(false);
    setNewEditalName(""); setNewEditalBanca(""); setNewEditalFormato("certo_errado");
    setNewEditalCerto("1"); setNewEditalErrado("-1"); setNewEditalBranco("0");
  }

  function saveQuestion() {
    if (!qSubjectId || !qStatement.trim()) return;
    onSaveQuestion({
      id: editingId ?? undefined,
      subjectId: qSubjectId,
      topicId: qTopicId || null,
      editalId: qEditalId || null,
      format: qFormat,
      statement: qStatement.trim(),
      alternatives: qFormat === "multipla_escolha" ? qAlternatives.filter((a) => a.text.trim()) : null,
      correctAnswer: qFormat === "certo_errado" ? qCorrectCE : qCorrectME,
      explanation: qExplanation.trim() || null,
      mnemonic: qMnemonic.trim() || null,
      mindMap: qMindMap.trim() || null,
    });
    setQuestionModal(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Editais */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editais.length ? "0.9rem" : 0 }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Provas / editais</h3>
          <button onClick={() => setEditalModal(true)} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.7rem" }}>
            <MdAdd size={15} /> Novo edital
          </button>
        </div>
        {editais.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {editais.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.7rem", background: "var(--bg-secondary)", borderRadius: 999, fontSize: "0.78rem" }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{e.name}</span>
                {e.banca && <span style={{ color: "var(--text-muted)" }}>· {e.banca}</span>}
                <span style={{ color: "var(--text-muted)" }}>· {e.pontos_certo >= 0 ? "+" : ""}{e.pontos_certo}/{e.pontos_errado >= 0 ? "+" : ""}{e.pontos_errado}</span>
                <button onClick={() => onRemoveEdital(e)} aria-label={`Remover ${e.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                  <MdClose size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros + nova questão */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setTopicFilter("all"); }} className="input-field" style={{ width: "auto", fontSize: "0.82rem", cursor: "pointer" }}>
          <option value="all">Todas as matérias</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
        {subjectFilter !== "all" && topicsForFilter.length > 0 && (
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="input-field" style={{ width: "auto", fontSize: "0.82rem", cursor: "pointer" }}>
            <option value="all">Todos os assuntos</option>
            {topicsForFilter.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      <button
        onClick={openNewQuestion}
        disabled={subjects.length === 0}
        style={{ width: "100%", padding: "1rem", borderRadius: 16, background: accent, color: "#fff", border: "none", cursor: subjects.length ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "1.02rem", fontWeight: 800, opacity: subjects.length ? 1 : 0.5 }}
      >
        <MdAdd size={22} /> Nova questão
      </button>
      {subjects.length === 0 && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Crie uma matéria na aba Praticar antes de cadastrar questões.</p>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Nenhuma questão por aqui ainda.
          </div>
        )}
        {filtered.map((q) => {
          const subject = subjectMap.get(q.subject_id);
          const topic = q.topic_id ? topicMap.get(q.topic_id) : null;
          const edital = q.edital_id ? editalMap.get(q.edital_id) : null;
          const expanded = expandedId === q.id;
          return (
            <div key={q.id} className="card" style={{ padding: "1rem 1.1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : q.id)}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{subject?.emoji ?? "📘"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2, WebkitBoxOrient: "vertical" }}>
                    {q.statement}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                      {subject?.name}{topic ? ` · ${topic.name}` : ""}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                      {q.format === "certo_errado" ? "Certo/Errado" : "Múltipla escolha"}
                    </span>
                    {edital && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: `${accent}18`, color: accent, padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                        {edital.name}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); openEditQuestion(q); }} aria-label="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                  <MdEdit size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemoveQuestion(q); }} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                  <MdDelete size={16} />
                </button>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{expanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}</span>
              </div>

              {expanded && (
                <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {q.format === "multipla_escolha" && q.alternatives && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {q.alternatives.map((a) => (
                        <div key={a.key} style={{ fontSize: "0.82rem", color: a.key === q.correct_answer ? "#7aab8a" : "var(--text-secondary)", fontWeight: a.key === q.correct_answer ? 700 : 400 }}>
                          {a.key}) {a.text} {a.key === q.correct_answer ? "✓" : ""}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.format === "certo_errado" && (
                    <div style={{ fontSize: "0.82rem", color: "#7aab8a", fontWeight: 700 }}>
                      Gabarito: {q.correct_answer === "certo" ? "Certo" : "Errado"}
                    </div>
                  )}
                  {q.explanation && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Explicação</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{q.explanation}</div>
                    </div>
                  )}
                  {q.mnemonic && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>🧠 Mnemônico</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{q.mnemonic}</div>
                    </div>
                  )}
                  {q.mind_map && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>🗺️ Mapa mental</div>
                      <pre style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap", fontFamily: "inherit", background: "var(--bg-secondary)", padding: "0.6rem 0.75rem", borderRadius: 10 }}>{q.mind_map}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal novo edital */}
      {editalModal && (
        <div onClick={(e) => e.target === e.currentTarget && setEditalModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo edital</h2>
              <button onClick={() => setEditalModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome</label>
                <input autoFocus type="text" value={newEditalName} onChange={(e) => setNewEditalName(e.target.value)} placeholder="Ex: DPDF TI 2026" className="input-field" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Banca</label>
                <input type="text" value={newEditalBanca} onChange={(e) => setNewEditalBanca(e.target.value)} placeholder="Ex: Instituto AOCP" className="input-field" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Formato padrão</label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {(["certo_errado", "multipla_escolha"] as QuestionFormat[]).map((f) => (
                    <button key={f} type="button" onClick={() => setNewEditalFormato(f)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: 10, border: `1.5px solid ${newEditalFormato === f ? accent : "var(--border)"}`, background: newEditalFormato === f ? `${accent}18` : "transparent", color: newEditalFormato === f ? accent : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                      {f === "certo_errado" ? "Certo/Errado" : "Múltipla escolha"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Pontuação (acerto / erro / branco)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="number" step="0.5" value={newEditalCerto} onChange={(e) => setNewEditalCerto(e.target.value)} className="input-field" />
                  <input type="number" step="0.5" value={newEditalErrado} onChange={(e) => setNewEditalErrado(e.target.value)} className="input-field" />
                  <input type="number" step="0.5" value={newEditalBranco} onChange={(e) => setNewEditalBranco(e.target.value)} className="input-field" />
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>Ex. CESPE: 1 / -1 / 0. Múltipla escolha sem penalidade: 1 / 0 / 0.</p>
              </div>
              <button onClick={saveEdital} disabled={!newEditalName.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent, opacity: newEditalName.trim() ? 1 : 0.5 }}>
                <MdCheck size={18} /> Criar edital
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova/editar questão */}
      {questionModal && (
        <div onClick={(e) => e.target === e.currentTarget && setQuestionModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, padding: "1.5rem 1.5rem 2rem", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{editingId ? "Editar questão" : "Nova questão"}</h2>
              <button onClick={() => setQuestionModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Matéria</label>
                  <select value={qSubjectId} onChange={(e) => { setQSubjectId(e.target.value); setQTopicId(""); }} className="input-field" style={{ cursor: "pointer" }}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Assunto</label>
                  <select value={qTopicId} onChange={(e) => setQTopicId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    <option value="">Geral</option>
                    {topicsForQSubject.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Edital (opcional)</label>
                <select value={qEditalId} onChange={(e) => setQEditalId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                  <option value="">Nenhum</option>
                  {editais.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Formato</label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {(["certo_errado", "multipla_escolha"] as QuestionFormat[]).map((f) => (
                    <button key={f} type="button" onClick={() => setQFormat(f)}
                      style={{ flex: 1, padding: "0.5rem", borderRadius: 10, border: `1.5px solid ${qFormat === f ? accent : "var(--border)"}`, background: qFormat === f ? `${accent}18` : "transparent", color: qFormat === f ? accent : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                      {f === "certo_errado" ? "Certo/Errado" : "Múltipla escolha"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Enunciado</label>
                <textarea
                  value={qStatement} onChange={(e) => setQStatement(e.target.value)} placeholder="Cole ou digite o enunciado da questão..."
                  style={{ width: "100%", minHeight: 90, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.9rem", fontSize: "0.88rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                />
              </div>

              {qFormat === "certo_errado" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Gabarito</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {(["certo", "errado"] as const).map((c) => (
                      <button key={c} type="button" onClick={() => setQCorrectCE(c)}
                        style={{ flex: 1, padding: "0.6rem", borderRadius: 10, border: `1.5px solid ${qCorrectCE === c ? "#7aab8a" : "var(--border)"}`, background: qCorrectCE === c ? "rgba(122,171,138,0.14)" : "transparent", color: qCorrectCE === c ? "#7aab8a" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                        {c === "certo" ? "Certo" : "Errado"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Alternativas (marque a correta)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {qAlternatives.map((alt, idx) => (
                      <div key={alt.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button type="button" onClick={() => setQCorrectME(alt.key)}
                          style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1.5px solid ${qCorrectME === alt.key ? "#7aab8a" : "var(--border)"}`, background: qCorrectME === alt.key ? "rgba(122,171,138,0.14)" : "transparent", color: qCorrectME === alt.key ? "#7aab8a" : "var(--text-muted)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                          {alt.key}
                        </button>
                        <input
                          type="text" value={alt.text}
                          onChange={(e) => setQAlternatives((prev) => prev.map((a, i) => i === idx ? { ...a, text: e.target.value } : a))}
                          placeholder={`Texto da alternativa ${alt.key}`} className="input-field" style={{ flex: 1 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Explicação / correção (o que mostrar se errar)</label>
                <textarea
                  value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Por que o gabarito é esse, o que estudar..."
                  style={{ width: "100%", minHeight: 70, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.9rem", fontSize: "0.88rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>🧠 Mnemônico (opcional)</label>
                <input type="text" value={qMnemonic} onChange={(e) => setQMnemonic(e.target.value)} placeholder="Ex: PICOLÉ pra lembrar dos princípios..." className="input-field" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>🗺️ Mapa mental (opcional, texto livre)</label>
                <textarea
                  value={qMindMap} onChange={(e) => setQMindMap(e.target.value)} placeholder={"Tema\n- Ramo 1\n  - Detalhe\n- Ramo 2"}
                  style={{ width: "100%", minHeight: 70, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.9rem", fontSize: "0.85rem", resize: "vertical", outline: "none", fontFamily: "monospace" }}
                />
              </div>

              <button onClick={saveQuestion} disabled={!qSubjectId || !qStatement.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent, opacity: qSubjectId && qStatement.trim() ? 1 : 0.5 }}>
                <MdCheck size={18} /> {editingId ? "Salvar alterações" : "Adicionar questão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
