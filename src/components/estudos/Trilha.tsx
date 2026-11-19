"use client";
import { useState } from "react";
import { MdArrowBack, MdCheck, MdLock, MdPlayArrow, MdEmojiEvents } from "react-icons/md";
import type { StudySubject, StudyTopic, StudyQuestion, StudyLog } from "@/types";
import { buildAllTrilhas, buildTrilha } from "@/lib/estudos/fases";
import type { PhaseInfo } from "@/lib/estudos/fases";

interface Props {
  subjects: StudySubject[];
  topics: StudyTopic[];
  questions: StudyQuestion[];
  logs: StudyLog[];
  accent: string;
  onPlayFase: (subjectId: string, topicId: string | null, faseName: string) => void;
}

const offsetFor = (index: number) => {
  const pattern = [0, 44, 72, 44, 0, -44, -72, -44];
  return pattern[index % pattern.length];
};

function PhaseNode({ phase, accent, onPlay }: { phase: PhaseInfo; accent: string; onPlay: () => void }) {
  const offset = offsetFor(phase.index);
  const locked = phase.status === "locked";
  const completed = phase.status === "completed";
  const color = completed ? "#7aab8a" : locked ? "var(--border)" : accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", marginBottom: "1.6rem" }}>
      <div style={{ transform: `translateX(${offset}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
        <button
          onClick={onPlay}
          disabled={locked}
          className={!locked ? "fase-node-pop" : undefined}
          style={{
            width: 60, height: 60, borderRadius: "50%", border: "none", cursor: locked ? "not-allowed" : "pointer",
            background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: locked ? "none" : `0 4px 0 ${completed ? "#5a8b6a" : accent + "aa"}`,
            fontSize: "1.4rem", flexShrink: 0,
          }}
          aria-label={phase.name}
        >
          {completed ? <MdCheck size={28} /> : locked ? <MdLock size={22} /> : <MdPlayArrow size={28} />}
        </button>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: locked ? "var(--text-muted)" : "var(--text-primary)", textAlign: "center", maxWidth: 110, lineHeight: 1.2 }}>
          {phase.name}
        </div>
        {phase.attempts > 0 && (
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{phase.correct}/{phase.requiredCorrect} acertos</div>
        )}
      </div>
    </div>
  );
}

function SubjectTrilha({ subject, topics, questions, logs, accent, onBack, onPlayFase }: {
  subject: StudySubject; topics: StudyTopic[]; questions: StudyQuestion[]; logs: StudyLog[]; accent: string;
  onBack: () => void; onPlayFase: (subjectId: string, topicId: string | null, faseName: string) => void;
}) {
  const trilha = buildTrilha(subject, topics, questions, logs);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
        <button onClick={onBack} aria-label="Voltar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
          <MdArrowBack size={22} />
        </button>
        <span style={{ fontSize: "1.3rem" }}>{subject.emoji}</span>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{subject.name}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{trilha.completedCount}/{trilha.totalCount} fases concluídas</div>
        </div>
      </div>

      <div style={{ padding: "0.5rem 0 1rem" }}>
        {trilha.phases.map((phase) => (
          <PhaseNode
            key={phase.topicId ?? "__geral__"}
            phase={phase}
            accent={accent}
            onPlay={() => onPlayFase(subject.id, phase.topicId, phase.name)}
          />
        ))}
        {trilha.completedCount === trilha.totalCount && trilha.totalCount > 0 && (
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <MdEmojiEvents size={36} color="#c99a40" />
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.3rem" }}>Trilha completa! 🎉</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes faseNodePop {
          0% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        .fase-node-pop:active { transform: scale(0.92); }
      `}</style>
    </div>
  );
}

export function Trilha({ subjects, topics, questions, logs, accent, onPlayFase }: Props) {
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);

  const trilhas = buildAllTrilhas(subjects, topics, questions, logs);
  const openSubject = openSubjectId ? subjects.find((s) => s.id === openSubjectId) : null;

  if (openSubject) {
    return (
      <SubjectTrilha
        subject={openSubject} topics={topics} questions={questions} logs={logs} accent={accent}
        onBack={() => setOpenSubjectId(null)} onPlayFase={onPlayFase}
      />
    );
  }

  if (trilhas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗺️</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Nenhuma trilha ainda
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Cadastre questões com assunto definido na aba Questões (ou importe um caderno) pra gerar as fases automaticamente
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {trilhas.map((t) => {
        const pct = t.totalCount ? Math.round((t.completedCount / t.totalCount) * 100) : 0;
        const done = t.completedCount === t.totalCount && t.totalCount > 0;
        return (
          <button
            key={t.subject.id}
            onClick={() => setOpenSubjectId(t.subject.id)}
            className="card"
            style={{ width: "100%", padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: "0.8rem", textAlign: "left", border: `1.5px solid ${done ? "#7aab8a" : "var(--border)"}`, cursor: "pointer", background: "var(--bg-card)", fontFamily: "inherit" }}
          >
            <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{t.subject.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {t.subject.name} {done && <MdEmojiEvents size={16} color="#c99a40" />}
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden", marginTop: "0.4rem" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: done ? "#7aab8a" : accent, borderRadius: 99 }} />
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{t.completedCount}/{t.totalCount}</span>
          </button>
        );
      })}
    </div>
  );
}
