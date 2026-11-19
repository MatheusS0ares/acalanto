"use client";
import { MdPriorityHigh, MdAutoAwesome } from "react-icons/md";
import type { StudySubject, StudyTopic, StudyQuestion, StudyLog } from "@/types";

interface Props {
  subjects: StudySubject[];
  topics: StudyTopic[];
  questions: StudyQuestion[];
  logs: StudyLog[];
  accent: string;
  onSelectTopic?: (subjectId: string, topicId: string | null) => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ResumoDoDia({ subjects, topics, questions, logs, accent, onSelectTopic }: Props) {
  if (logs.length === 0 && questions.length === 0) return null;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const today = todayStr();
  const todayLogs = logs.filter((l) => l.date === today);
  const todayCorrect = todayLogs.filter((l) => l.correct).length;
  const todayAcc = todayLogs.length ? Math.round((todayCorrect / todayLogs.length) * 100) : null;

  // Pontos fracos — por assunto, mínimo 3 questões, pior % de acerto
  const byTopic = new Map<string, { subjectId: string; topicId: string | null; label: string; emoji: string; total: number; correct: number }>();
  logs.forEach((l) => {
    const s = subjectMap.get(l.subject_id);
    const t = l.topic_id ? topicMap.get(l.topic_id) : null;
    const key = l.topic_id ?? `subject-${l.subject_id}`;
    const label = t ? `${t.name} (${s?.name ?? "?"})` : `${s?.name ?? "Matéria"} (geral)`;
    const entry = byTopic.get(key) ?? { subjectId: l.subject_id, topicId: l.topic_id, label, emoji: s?.emoji ?? "📘", total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    byTopic.set(key, entry);
  });
  const weakSpots = Array.from(byTopic.values())
    .filter((t) => t.total >= 3)
    .map((t) => ({ ...t, acc: Math.round((t.correct / t.total) * 100) }))
    .filter((t) => t.acc < 70)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 2);

  // Últimos 7 dias de atividade -> tópicos recentes -> mnemônicos/mapas disponíveis neles
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentTopicIds = new Set(logs.filter((l) => l.date >= weekAgo && l.topic_id).map((l) => l.topic_id as string));
  const recentSubjectIds = new Set(logs.filter((l) => l.date >= weekAgo).map((l) => l.subject_id));
  const enrichedQuestions = questions.filter((q) =>
    (q.mnemonic || q.mind_map) &&
    (q.topic_id ? recentTopicIds.has(q.topic_id) : recentSubjectIds.has(q.subject_id))
  ).slice(0, 3);

  if (todayLogs.length === 0 && weakSpots.length === 0 && enrichedQuestions.length === 0) return null;

  return (
    <div className="card" style={{ padding: "1.25rem", border: `1.5px solid ${accent}` }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <MdAutoAwesome size={18} color={accent} /> Resumo de hoje
      </h3>

      {todayLogs.length > 0 && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.9rem" }}>
          Hoje: <strong style={{ color: "var(--text-primary)" }}>{todayLogs.length} questões</strong>{todayAcc != null ? ` · ${todayAcc}% de acerto` : ""}
        </p>
      )}

      {weakSpots.length > 0 && (
        <div style={{ marginBottom: enrichedQuestions.length > 0 ? "0.9rem" : 0 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d06a6a", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
            <MdPriorityHigh size={14} /> Pra revisar hoje
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {weakSpots.map((w) => (
              <div
                key={w.label}
                onClick={() => onSelectTopic?.(w.subjectId, w.topicId)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: onSelectTopic ? "pointer" : "default" }}
              >
                <span style={{ fontSize: "0.95rem" }}>{w.emoji}</span>
                <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{w.label}</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#d06a6a" }}>{w.acc}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {enrichedQuestions.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>🧠 Mnemônicos e mapas recentes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {enrichedQuestions.map((q) => (
              <div key={q.id} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "0.5rem 0.7rem", borderRadius: 8 }}>
                {q.mnemonic ? `🧠 ${q.mnemonic}` : `🗺️ ${(q.mind_map ?? "").split("\n")[0]}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
