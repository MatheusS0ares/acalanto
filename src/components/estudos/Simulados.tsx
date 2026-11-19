"use client";
import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdClose, MdCheck, MdPlayArrow, MdDelete, MdEmojiEvents } from "react-icons/md";
import type { StudySubject, StudyTopic, StudyEdital, StudyQuestion, StudySimulado, FamilyMember } from "@/types";
import { XP_PER_CORRECT, XP_PER_WRONG } from "@/lib/estudos/gamification";

interface Props {
  subjects: StudySubject[];
  topics: StudyTopic[];
  editais: StudyEdital[];
  questions: StudyQuestion[];
  simulados: StudySimulado[];
  members: FamilyMember[];
  studentId: string;
  accent: string;
  onCreateSimulado: (input: { name: string; editalId: string | null; subjectIds: string[]; quantity: number }) => Promise<StudySimulado | null>;
  onSubmitSimulado: (simulado: StudySimulado, answers: Record<string, string | null>) => Promise<StudySimulado | null>;
  onRemoveSimulado: (simulado: StudySimulado) => void;
  focusSimuladoId?: string | null;
  onFocusHandled?: () => void;
}

function fmtScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function Simulados({ subjects, topics, editais, questions, simulados, members, studentId, accent, onCreateSimulado, onSubmitSimulado, onRemoveSimulado, focusSimuladoId, onFocusHandled }: Props) {
  const [mode, setMode] = useState<"list" | "building" | "taking" | "review">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!focusSimuladoId) return;
    const s = simulados.find((x) => x.id === focusSimuladoId);
    if (!s) return;
    setActiveId(s.id);
    setAnswers(s.answers ?? {});
    setMode(s.finished_at ? "review" : "taking");
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSimuladoId]);

  const [buildName, setBuildName] = useState("");
  const [buildEditalId, setBuildEditalId] = useState("");
  const [buildSubjectIds, setBuildSubjectIds] = useState<string[]>([]);
  const [buildQty, setBuildQty] = useState("10");
  const [saving, setSaving] = useState(false);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const editalMap = new Map(editais.map((e) => [e.id, e]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const active = simulados.find((s) => s.id === activeId) ?? null;
  const availableCount = useMemo(() => {
    if (buildSubjectIds.length === 0) return questions.length;
    return questions.filter((q) => buildSubjectIds.includes(q.subject_id)).length;
  }, [questions, buildSubjectIds]);

  function openBuilder() {
    setBuildName(`Simulado ${new Date().toLocaleDateString("pt-BR")}`);
    setBuildEditalId("");
    setBuildSubjectIds([]);
    setBuildQty("10");
    setMode("building");
  }

  function toggleSubject(id: string) {
    setBuildSubjectIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function createSimulado() {
    const name = buildName.trim();
    if (!name) return;
    setSaving(true);
    const result = await onCreateSimulado({
      name, editalId: buildEditalId || null, subjectIds: buildSubjectIds,
      quantity: Math.max(1, parseInt(buildQty, 10) || 10),
    });
    setSaving(false);
    if (result) {
      setActiveId(result.id);
      setAnswers({});
      setMode("taking");
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: prev[questionId] === value ? null : value }));
  }

  async function finish() {
    if (!active) return;
    setSaving(true);
    const result = await onSubmitSimulado(active, answers);
    setSaving(false);
    if (result) {
      setActiveId(result.id);
      setMode("review");
    }
  }

  function openReview(s: StudySimulado) {
    setActiveId(s.id);
    setMode("review");
  }

  if (mode === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <button
          onClick={openBuilder}
          disabled={questions.length === 0}
          style={{ width: "100%", padding: "1rem", borderRadius: 16, background: accent, color: "#fff", border: "none", cursor: questions.length ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "1.02rem", fontWeight: 800, opacity: questions.length ? 1 : 0.5 }}
        >
          <MdAdd size={22} /> Novo simulado
        </button>
        {questions.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Cadastre questões na aba Questões antes de montar um simulado.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {simulados.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Nenhum simulado ainda.</div>
          )}
          {simulados.map((s) => {
            const edital = s.edital_id ? editalMap.get(s.edital_id) : null;
            const done = s.finished_at != null;
            const acc = done && s.question_ids.length
              ? Math.round((s.question_ids.filter((qid) => s.answers[qid] != null && questionMap.get(qid)?.correct_answer === s.answers[qid]).length / s.question_ids.length) * 100)
              : null;
            return (
              <div key={s.id} className="card" style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{done ? "🏁" : "⏳"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {s.question_ids.length} questões{edital ? ` · ${edital.name}` : ""}
                    {members.length > 1 ? ` · ${memberMap.get(s.member_id ?? "")?.name ?? "Família"}` : ""}
                    {done && s.score != null ? ` · ${fmtScore(s.score)}/${fmtScore(s.max_score ?? 0)} pts (${acc}%)` : " · em andamento"}
                  </div>
                </div>
                <button
                  onClick={() => { if (done) openReview(s); else { setActiveId(s.id); setAnswers(s.answers ?? {}); setMode("taking"); } }}
                  className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", flexShrink: 0 }}
                >
                  {done ? "Revisar" : "Continuar"}
                </button>
                <button onClick={() => onRemoveSimulado(s)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                  <MdDelete size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === "building") {
    return (
      <div className="card" style={{ padding: "1.25rem", border: `1.5px solid ${accent}`, display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>Montar simulado</h3>
          <button onClick={() => setMode("list")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome</label>
          <input type="text" value={buildName} onChange={(e) => setBuildName(e.target.value)} className="input-field" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Edital (opcional — define a pontuação)</label>
          <select value={buildEditalId} onChange={(e) => setBuildEditalId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
            <option value="">Nenhum (1 ponto por acerto)</option>
            {editais.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Matérias (vazio = todas)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {subjects.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                style={{ padding: "0.35rem 0.7rem", borderRadius: 999, border: `1.5px solid ${buildSubjectIds.includes(s.id) ? accent : "var(--border)"}`, background: buildSubjectIds.includes(s.id) ? `${accent}18` : "transparent", color: buildSubjectIds.includes(s.id) ? accent : "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Quantidade de questões</label>
          <input type="number" min={1} value={buildQty} onChange={(e) => setBuildQty(e.target.value)} className="input-field" />
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{availableCount} questões disponíveis com esse filtro.</p>
        </div>

        <button onClick={createSimulado} disabled={!buildName.trim() || saving || availableCount === 0} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent, opacity: buildName.trim() && availableCount > 0 ? 1 : 0.5 }}>
          <MdPlayArrow size={18} /> {saving ? "Montando..." : "Montar e começar"}
        </button>
      </div>
    );
  }

  if (!active) return null;

  if (mode === "taking") {
    const answeredCount = active.question_ids.filter((qid) => answers[qid] != null).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, border: `1.5px solid ${accent}` }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{active.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{answeredCount}/{active.question_ids.length} respondidas</div>
          </div>
          <button onClick={finish} disabled={saving} className="btn-primary" style={{ background: accent }}>
            <MdCheck size={16} /> {saving ? "Enviando..." : "Finalizar"}
          </button>
        </div>

        {active.question_ids.map((qid, idx) => {
          const q = questionMap.get(qid);
          if (!q) return null;
          const subject = subjectMap.get(q.subject_id);
          const topic = q.topic_id ? topicMap.get(q.topic_id) : null;
          const given = answers[qid] ?? null;
          return (
            <div key={qid} className="card" style={{ padding: "1.1rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
                Questão {idx + 1} · {subject?.emoji} {subject?.name}{topic ? ` · ${topic.name}` : ""}
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.9rem", whiteSpace: "pre-wrap" }}>{q.statement}</div>
              {q.format === "certo_errado" ? (
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {(["certo", "errado"] as const).map((c) => (
                    <button key={c} onClick={() => setAnswer(qid, c)}
                      style={{ flex: 1, padding: "0.75rem", borderRadius: 12, border: `1.5px solid ${given === c ? accent : "var(--border)"}`, background: given === c ? `${accent}18` : "transparent", color: given === c ? accent : "var(--text-secondary)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                      {c === "certo" ? "Certo" : "Errado"}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {(q.alternatives ?? []).map((a) => (
                    <button key={a.key} onClick={() => setAnswer(qid, a.key)}
                      style={{ textAlign: "left", padding: "0.65rem 0.8rem", borderRadius: 10, border: `1.5px solid ${given === a.key ? accent : "var(--border)"}`, background: given === a.key ? `${accent}18` : "transparent", color: given === a.key ? accent : "var(--text-secondary)", fontWeight: given === a.key ? 700 : 500, fontSize: "0.85rem", cursor: "pointer" }}>
                      {a.key}) {a.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={finish} disabled={saving} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent }}>
          <MdCheck size={18} /> {saving ? "Enviando..." : "Finalizar simulado"}
        </button>
      </div>
    );
  }

  // review
  const total = active.question_ids.length;
  const correctCount = active.question_ids.filter((qid) => active.answers[qid] != null && questionMap.get(qid)?.correct_answer === active.answers[qid]).length;
  const blankCount = active.question_ids.filter((qid) => active.answers[qid] == null).length;
  const wrongCount = total - correctCount - blankCount;
  const xpEarned = correctCount * XP_PER_CORRECT + wrongCount * XP_PER_WRONG;
  const acc = total ? Math.round((correctCount / total) * 100) : 0;
  const celebration = acc >= 90
    ? { emoji: "🏆", title: "Excelente!", color: "#c99a40" }
    : acc >= 70
    ? { emoji: "🎉", title: "Muito bem!", color: "#7aab8a" }
    : acc >= 50
    ? { emoji: "💪", title: "Pode melhorar!", color: "#5b7fd4" }
    : { emoji: "📚", title: "Hora de revisar!", color: "#d06a6a" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card simulado-celebrate" style={{ padding: "1.5rem", border: `1.5px solid ${celebration.color}`, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {acc >= 70 && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", justifyContent: "space-around", top: "-0.5rem" }}>
            {["🎉", "✨", "🎊", "✨", "🎉"].map((e, i) => (
              <span key={i} className="confetti-fall" style={{ animationDelay: `${i * 0.15}s`, fontSize: "1.1rem" }}>{e}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: "2.2rem" }} className="celebrate-bounce">{celebration.emoji}</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: celebration.color, marginTop: "0.2rem" }}>{celebration.title}</div>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>
          {active.score != null ? `${fmtScore(active.score)} / ${fmtScore(active.max_score ?? 0)} pontos` : `${correctCount}/${total}`}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{correctCount} de {total} corretas ({acc}%)</div>
        {xpEarned > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.6rem", background: "var(--bg-secondary)", padding: "0.3rem 0.8rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 800, color: accent }}>
            <MdEmojiEvents size={16} /> +{xpEarned} XP
          </div>
        )}
        <div>
          <button onClick={() => setMode("list")} className="btn-secondary" style={{ marginTop: "0.9rem", justifyContent: "center" }}>Voltar aos simulados</button>
        </div>
      </div>

      <style>{`
        @keyframes celebrateBounce {
          0% { transform: scale(0.4) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
        .celebrate-bounce { animation: celebrateBounce 0.6s cubic-bezier(.34,1.56,.64,1) both; display: inline-block; }
        @keyframes confettiFall {
          0% { transform: translateY(-14px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(40px) rotate(60deg); opacity: 0; }
        }
        .confetti-fall { animation: confettiFall 1.6s ease-in infinite; }
      `}</style>

      {active.question_ids.map((qid, idx) => {
        const q = questionMap.get(qid);
        if (!q) return null;
        const given = active.answers[qid] ?? null;
        const correct = given != null && given === q.correct_answer;
        const subject = subjectMap.get(q.subject_id);
        return (
          <div key={qid} className="card" style={{ padding: "1.1rem", borderLeft: `4px solid ${given == null ? "var(--border)" : correct ? "#7aab8a" : "#d06a6a"}` }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
              Questão {idx + 1} · {subject?.emoji} {subject?.name} · {given == null ? "Em branco" : correct ? "✅ Acertou" : "❌ Errou"}
            </div>
            <div style={{ fontSize: "0.88rem", color: "var(--text-primary)", marginBottom: "0.6rem", whiteSpace: "pre-wrap" }}>{q.statement}</div>

            {q.format === "multipla_escolha" && q.alternatives ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.6rem" }}>
                {q.alternatives.map((a) => (
                  <div key={a.key} style={{
                    fontSize: "0.82rem", padding: "0.3rem 0.5rem", borderRadius: 6,
                    background: a.key === q.correct_answer ? "rgba(122,171,138,0.14)" : a.key === given ? "rgba(208,106,106,0.14)" : "transparent",
                    color: a.key === q.correct_answer ? "#7aab8a" : a.key === given ? "#d06a6a" : "var(--text-secondary)",
                    fontWeight: a.key === q.correct_answer || a.key === given ? 700 : 400,
                  }}>
                    {a.key}) {a.text} {a.key === q.correct_answer ? "✓ gabarito" : a.key === given ? "✗ sua resposta" : ""}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.82rem", marginBottom: "0.6rem" }}>
                <span style={{ color: "#7aab8a", fontWeight: 700 }}>Gabarito: {q.correct_answer === "certo" ? "Certo" : "Errado"}</span>
                {given != null && <span style={{ color: "var(--text-muted)" }}> · Você marcou: {given === "certo" ? "Certo" : "Errado"}</span>}
              </div>
            )}

            {!correct && q.explanation && (
              <div style={{ background: "rgba(91,127,212,0.08)", border: `1px solid ${accent}44`, borderRadius: 10, padding: "0.7rem 0.9rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: accent, marginBottom: "0.25rem" }}>📖 Explicação</div>
                <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{q.explanation}</div>
              </div>
            )}
            {q.mnemonic && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>🧠 {q.mnemonic}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
