"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MdAdd, MdClose, MdCheck, MdSchool, MdBarChart, MdDelete, MdEdit,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember, StudySubject, StudyTopic, StudyLog, StudyConfidence } from "@/types";
import { AnalisesEstudos } from "@/components/estudos/AnalisesEstudos";

const ACCENT = "#5b7fd4";

const subjectEmojis = ["📘", "📗", "📙", "📕", "⚖️", "🧮", "🌍", "🔬", "💻", "🗣️", "📐", "🏛️"];

const confidenceConfig: Record<StudyConfidence, { label: string; emoji: string }> = {
  certeza: { label: "Certeza", emoji: "💪" },
  duvida: { label: "Dúvida", emoji: "🤔" },
  chute: { label: "Chute", emoji: "🎲" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function EstudosPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [view, setView] = useState<"praticar" | "indicadores">("praticar");

  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [banca, setBanca] = useState("");
  const [confidence, setConfidence] = useState<StudyConfidence | null>(null);
  const [sessionStats, setSessionStats] = useState({ count: 0, correct: 0 });

  const [subjectModal, setSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectEmoji, setNewSubjectEmoji] = useState(subjectEmojis[0]);

  const [topicModal, setTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  const [noteModal, setNoteModal] = useState<StudyLog | null>(null);
  const [noteText, setNoteText] = useState("");

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
    setStudentId(me.id);

    const { data: memberRows } = await supabase
      .from("acalanto_family_members")
      .select("*")
      .eq("family_id", me.family_id);
    setMembers(memberRows ?? []);

    const { data: subjectRows } = await supabase
      .from("acalanto_study_subjects")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at");
    setSubjects(subjectRows ?? []);
    if (subjectRows && subjectRows.length > 0) setSubjectId(subjectRows[0].id);

    const { data: topicRows } = await supabase
      .from("acalanto_study_topics")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at");
    setTopics(topicRows ?? []);

    const { data: logRows } = await supabase
      .from("acalanto_study_logs")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setLogs(logRows ?? []);

    setLoading(false);
  }

  const topicsForSubject = topics.filter((t) => t.subject_id === subjectId);

  useEffect(() => {
    if (topicId && !topicsForSubject.some((t) => t.id === topicId)) setTopicId("");
  }, [subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudySubject = { id, family_id: familyId, member_id: studentId || null, name, emoji: newSubjectEmoji, created_at: new Date().toISOString() };
    setSubjects((prev) => [...prev, row]);
    setSubjectId(id);
    setSubjectModal(false);
    setNewSubjectName("");
    setNewSubjectEmoji(subjectEmojis[0]);
    showToast(`✓ "${name}" adicionada!`);
    const { error } = await supabase.from("acalanto_study_subjects").insert({
      id, family_id: familyId, member_id: studentId || null, name, emoji: newSubjectEmoji,
    });
    if (error) { setSubjects((prev) => prev.filter((s) => s.id !== id)); showToast("Erro ao adicionar matéria"); }
  }

  async function removeSubject(subject: StudySubject) {
    const supabase = createClient();
    setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
    setTopics((prev) => prev.filter((t) => t.subject_id !== subject.id));
    setLogs((prev) => prev.filter((l) => l.subject_id !== subject.id));
    if (subjectId === subject.id) setSubjectId("");
    await supabase.from("acalanto_study_subjects").delete().eq("id", subject.id);
  }

  async function addTopic() {
    const name = newTopicName.trim();
    if (!name || !subjectId) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudyTopic = { id, family_id: familyId, subject_id: subjectId, name, created_at: new Date().toISOString() };
    setTopics((prev) => [...prev, row]);
    setTopicId(id);
    setTopicModal(false);
    setNewTopicName("");
    showToast(`✓ "${name}" adicionado!`);
    const { error } = await supabase.from("acalanto_study_topics").insert({ id, family_id: familyId, subject_id: subjectId, name });
    if (error) { setTopics((prev) => prev.filter((t) => t.id !== id)); showToast("Erro ao adicionar assunto"); }
  }

  async function removeTopic(topic: StudyTopic) {
    const supabase = createClient();
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));
    setLogs((prev) => prev.filter((l) => l.topic_id !== topic.id));
    if (topicId === topic.id) setTopicId("");
    await supabase.from("acalanto_study_topics").delete().eq("id", topic.id);
  }

  async function logAnswer(correct: boolean) {
    if (!subjectId) { showToast("Escolha uma matéria primeiro"); return; }
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudyLog = {
      id, family_id: familyId, member_id: studentId || null, subject_id: subjectId, topic_id: topicId || null,
      correct, banca: banca.trim() || null, confidence, note: null, date: todayStr(), created_at: new Date().toISOString(),
    };
    setLogs((prev) => [row, ...prev]);
    setSessionStats((prev) => ({ count: prev.count + 1, correct: prev.correct + (correct ? 1 : 0) }));
    const { error } = await supabase.from("acalanto_study_logs").insert({
      id, family_id: familyId, member_id: studentId || null, subject_id: subjectId, topic_id: topicId || null,
      correct, banca: banca.trim() || null, confidence, date: todayStr(),
    });
    if (error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      showToast("Erro ao registrar questão");
      return;
    }
    if (!correct) {
      showToast("❌ Registrado — toque aqui pra anotar o motivo");
      setNoteModal(row);
      setNoteText("");
    }
  }

  async function saveNote() {
    if (!noteModal) return;
    const supabase = createClient();
    const text = noteText.trim() || null;
    setLogs((prev) => prev.map((l) => l.id === noteModal.id ? { ...l, note: text } : l));
    await supabase.from("acalanto_study_logs").update({ note: text }).eq("id", noteModal.id);
    setNoteModal(null);
  }

  async function removeLog(log: StudyLog) {
    const supabase = createClient();
    setLogs((prev) => prev.filter((l) => l.id !== log.id));
    await supabase.from("acalanto_study_logs").delete().eq("id", log.id);
  }

  function resetSession() {
    setSessionStats({ count: 0, correct: 0 });
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const bancaOptions = Array.from(new Set(logs.map((l) => l.banca).filter((b): b is string => !!b?.trim())));

  const recentLogs = logs.slice(0, 20);

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando seus estudos...
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
          🎓 Estudos
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {view === "praticar" ? "Registre as questões que você resolveu" : "Seus indicadores de desempenho"}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          onClick={() => setView("praticar")}
          style={{
            flex: 1, padding: "0.55rem 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: view === "praticar" ? ACCENT : "var(--bg-secondary)",
            color: view === "praticar" ? "#fff" : "var(--text-muted)",
          }}
        >
          <MdSchool size={16} /> Praticar
        </button>
        <button
          onClick={() => setView("indicadores")}
          style={{
            flex: 1, padding: "0.55rem 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: view === "indicadores" ? ACCENT : "var(--bg-secondary)",
            color: view === "indicadores" ? "#fff" : "var(--text-muted)",
          }}
        >
          <MdBarChart size={16} /> Indicadores
        </button>
      </div>

      {view === "indicadores" && (
        <AnalisesEstudos subjects={subjects} topics={topics} logs={logs} members={members} accent={ACCENT} />
      )}

      {view === "praticar" && (
        <>
          {subjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1.25rem", borderRadius: 16, border: "2px dashed var(--border)", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                Você ainda não tem matérias cadastradas
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Crie uma matéria (ex: &quot;Direito Constitucional&quot;) pra começar a registrar questões
              </div>
              <button onClick={() => setSubjectModal(true)} className="btn-primary" style={{ justifyContent: "center", margin: "0 auto", background: ACCENT }}>
                <MdAdd size={18} /> Criar primeira matéria
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem", border: `1.5px solid ${ACCENT}` }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                Sessão de estudo
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {members.length > 1 && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Quem está estudando</label>
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                      {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Matéria</label>
                    <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); resetSession(); }} className="input-field" style={{ cursor: "pointer" }}>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setSubjectModal(true)} aria-label="Nova matéria" className="btn-secondary" style={{ padding: "0.6rem", flexShrink: 0 }}>
                    <MdAdd size={18} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Assunto (opcional)</label>
                    <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input-field" style={{ cursor: "pointer" }} disabled={!subjectId}>
                      <option value="">Geral</option>
                      {topicsForSubject.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setTopicModal(true)} aria-label="Novo assunto" className="btn-secondary" style={{ padding: "0.6rem", flexShrink: 0 }} disabled={!subjectId}>
                    <MdAdd size={18} />
                  </button>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Banca (opcional)</label>
                  <input type="text" list="banca-options" value={banca} onChange={(e) => setBanca(e.target.value)} placeholder="Ex: CESPE, FGV..." className="input-field" />
                  <datalist id="banca-options">
                    {bancaOptions.map((b) => <option key={b} value={b} />)}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Confiança (opcional)</label>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {(Object.keys(confidenceConfig) as StudyConfidence[]).map((c) => (
                      <button key={c} type="button" onClick={() => setConfidence(confidence === c ? null : c)}
                        style={{ flex: 1, padding: "0.5rem 0.4rem", borderRadius: 10, border: `1.5px solid ${confidence === c ? ACCENT : "var(--border)"}`, background: confidence === c ? `${ACCENT}18` : "transparent", color: confidence === c ? ACCENT : "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                        {confidenceConfig[c].emoji} {confidenceConfig[c].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.9rem" }}>
                <button
                  onClick={() => logAnswer(true)}
                  disabled={!subjectId}
                  style={{ flex: 1, padding: "1.1rem 0", borderRadius: 14, border: "none", cursor: subjectId ? "pointer" : "not-allowed", background: "#7aab8a", color: "#fff", fontSize: "1.05rem", fontWeight: 800, opacity: subjectId ? 1 : 0.5 }}
                >
                  ✅ Acertei
                </button>
                <button
                  onClick={() => logAnswer(false)}
                  disabled={!subjectId}
                  style={{ flex: 1, padding: "1.1rem 0", borderRadius: 14, border: "none", cursor: subjectId ? "pointer" : "not-allowed", background: "#d06a6a", color: "#fff", fontSize: "1.05rem", fontWeight: 800, opacity: subjectId ? 1 : 0.5 }}
                >
                  ❌ Errei
                </button>
              </div>

              {sessionStats.count > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>
                    Nessa sessão: <strong style={{ color: "var(--text-primary)" }}>{sessionStats.count} questões</strong> · {sessionStats.correct} acertos ({Math.round((sessionStats.correct / sessionStats.count) * 100)}%)
                  </span>
                  <button onClick={resetSession} style={{ background: "none", border: "none", color: ACCENT, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                    Zerar
                  </button>
                </div>
              )}
            </div>
          )}

          {subjects.length > 0 && (
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
                Matérias e assuntos
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {subjects.map((s) => {
                  const subjectLogs = logs.filter((l) => l.subject_id === s.id);
                  const correct = subjectLogs.filter((l) => l.correct).length;
                  const acc = subjectLogs.length ? Math.round((correct / subjectLogs.length) * 100) : null;
                  const myTopics = topics.filter((t) => t.subject_id === s.id);
                  return (
                    <div key={s.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>{s.emoji}</span>
                        <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.name}</span>
                        {acc != null && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: acc >= 70 ? "#7aab8a" : acc >= 50 ? "#c99a40" : "#d06a6a" }}>
                            {acc}% · {subjectLogs.length}q
                          </span>
                        )}
                        <button onClick={() => removeSubject(s)} aria-label={`Remover ${s.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem" }}>
                          <MdDelete size={15} />
                        </button>
                      </div>
                      {myTopics.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.45rem", marginLeft: "1.7rem" }}>
                          {myTopics.map((t) => (
                            <span key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                              {t.name}
                              <button onClick={() => removeTopic(t)} aria-label={`Remover ${t.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                                <MdClose size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recentLogs.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
                Histórico recente
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentLogs.map((log) => {
                  const subject = subjectMap.get(log.subject_id);
                  const topic = log.topic_id ? topicMap.get(log.topic_id) : null;
                  return (
                    <div key={log.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{log.correct ? "✅" : "❌"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {subject?.emoji} {subject?.name}{topic ? ` · ${topic.name}` : ""}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {new Date(log.date + "T12:00:00").toLocaleDateString("pt-BR")}
                          {members.length > 1 ? ` · ${memberMap.get(log.member_id ?? "")?.name ?? "Família"}` : ""}
                          {log.banca ? ` · ${log.banca}` : ""}
                          {log.confidence ? ` · ${confidenceConfig[log.confidence].emoji} ${confidenceConfig[log.confidence].label}` : ""}
                        </div>
                        {log.note && <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontStyle: "italic", marginTop: "0.15rem" }}>&quot;{log.note}&quot;</div>}
                      </div>
                      {!log.correct && (
                        <button onClick={() => { setNoteModal(log); setNoteText(log.note ?? ""); }} aria-label="Editar anotação" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                          <MdEdit size={14} />
                        </button>
                      )}
                      <button onClick={() => removeLog(log)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                        <MdClose size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal nova matéria */}
      {subjectModal && (
        <div onClick={(e) => e.target === e.currentTarget && setSubjectModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>📘 Nova matéria</h2>
              <button onClick={() => setSubjectModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <input
              autoFocus type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              placeholder="Ex: Direito Constitucional" className="input-field" style={{ marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {subjectEmojis.map((e) => (
                <button key={e} type="button" onClick={() => setNewSubjectEmoji(e)}
                  style={{ width: 40, height: 40, borderRadius: 10, fontSize: "1.1rem", cursor: "pointer", border: `1.5px solid ${newSubjectEmoji === e ? ACCENT : "var(--border)"}`, background: newSubjectEmoji === e ? `${ACCENT}18` : "transparent" }}>
                  {e}
                </button>
              ))}
            </div>
            <button onClick={addSubject} disabled={!newSubjectName.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: ACCENT, opacity: newSubjectName.trim() ? 1 : 0.5 }}>
              <MdCheck size={18} /> Criar matéria
            </button>
          </div>
        </div>
      )}

      {/* Modal novo assunto */}
      {topicModal && (
        <div onClick={(e) => e.target === e.currentTarget && setTopicModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo assunto</h2>
              <button onClick={() => setTopicModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <input
              autoFocus type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              placeholder="Ex: Controle de Constitucionalidade" className="input-field" style={{ marginBottom: "1.25rem" }}
            />
            <button onClick={addTopic} disabled={!newTopicName.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: ACCENT, opacity: newTopicName.trim() ? 1 : 0.5 }}>
              <MdCheck size={18} /> Criar assunto
            </button>
          </div>
        </div>
      )}

      {/* Modal anotação de erro */}
      {noteModal && (
        <div onClick={(e) => e.target === e.currentTarget && setNoteModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              Por que errou essa?
            </div>
            <textarea
              autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: Confundi com outro artigo..."
              style={{ width: "100%", minHeight: 80, background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.75rem 0.9rem", fontSize: "0.9rem", resize: "vertical", outline: "none", marginBottom: "1.25rem", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setNoteModal(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Pular</button>
              <button onClick={saveNote} className="btn-primary" style={{ flex: 2, justifyContent: "center", background: ACCENT }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
