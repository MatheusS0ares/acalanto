"use client";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdLocalFireDepartment, MdPriorityHigh } from "react-icons/md";
import type { StudySubject, StudyTopic, StudyLog, FamilyMember, StudyConfidence } from "@/types";

interface Props {
  subjects: StudySubject[];
  topics: StudyTopic[];
  logs: StudyLog[];
  members: FamilyMember[];
  accent: string;
}

type Period = "7d" | "30d" | "90d" | "all";
const periodOptions: { id: Period; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "all", label: "Tudo" },
];

const confidenceConfig: Record<StudyConfidence, { label: string; emoji: string }> = {
  certeza: { label: "Certeza", emoji: "💪" },
  duvida: { label: "Dúvida", emoji: "🤔" },
  chute: { label: "Chute", emoji: "🎲" },
};

function accuracyColor(acc: number) {
  if (acc >= 70) return "#7aab8a";
  if (acc >= 50) return "#c99a40";
  return "#d06a6a";
}

function pct(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

export function AnalisesEstudos({ subjects, topics, logs, members, accent }: Props) {
  const [readerFilter, setReaderFilter] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("30d");

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  const byReader = readerFilter === "all" ? logs : logs.filter((l) => l.member_id === readerFilter);

  let cutoff: Date | null = null;
  const now = new Date();
  if (period === "7d") cutoff = new Date(now.getTime() - 7 * 86400000);
  else if (period === "30d") cutoff = new Date(now.getTime() - 30 * 86400000);
  else if (period === "90d") cutoff = new Date(now.getTime() - 90 * 86400000);
  const scoped = cutoff ? byReader.filter((l) => new Date(l.date + "T12:00:00") >= cutoff!) : byReader;

  if (logs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Ainda não há dados suficientes
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Registre questões na aba Praticar pra ver seus indicadores aqui
        </div>
      </div>
    );
  }

  const totalQuestions = scoped.length;
  const totalCorrect = scoped.filter((l) => l.correct).length;
  const overallAcc = pct(totalCorrect, totalQuestions);
  const activeSubjects = new Set(scoped.map((l) => l.subject_id)).size;

  // Sequência de dias estudando (streak)
  const loggedDays = new Set(byReader.map((l) => l.date));
  let streak = 0;
  const cursor = new Date();
  while (loggedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Acerto por matéria
  const bySubject = new Map<string, { label: string; emoji: string; total: number; correct: number }>();
  scoped.forEach((l) => {
    const s = subjectMap.get(l.subject_id);
    const entry = bySubject.get(l.subject_id) ?? { label: s?.name ?? "Matéria removida", emoji: s?.emoji ?? "📘", total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    bySubject.set(l.subject_id, entry);
  });
  const subjectChart = Array.from(bySubject.values())
    .map((s) => ({ name: `${s.emoji} ${s.label}`, acc: pct(s.correct, s.total), total: s.total }))
    .sort((a, b) => b.total - a.total);

  // Pontos fracos — por assunto (ou matéria quando sem assunto), mínimo 3 questões
  const byTopic = new Map<string, { label: string; total: number; correct: number }>();
  scoped.forEach((l) => {
    const s = subjectMap.get(l.subject_id);
    const t = l.topic_id ? topicMap.get(l.topic_id) : null;
    const key = l.topic_id ?? `subject-${l.subject_id}`;
    const label = t ? `${t.name} (${s?.name ?? "?"})` : `${s?.name ?? "Matéria removida"} (geral)`;
    const entry = byTopic.get(key) ?? { label, total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    byTopic.set(key, entry);
  });
  const weakSpots = Array.from(byTopic.values())
    .filter((t) => t.total >= 3)
    .map((t) => ({ ...t, acc: pct(t.correct, t.total) }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 5);

  // Evolução — % de acerto por semana
  function weekKey(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
  }
  const byWeek = new Map<string, { total: number; correct: number }>();
  byReader.forEach((l) => {
    const wk = weekKey(new Date(l.date + "T12:00:00"));
    const entry = byWeek.get(wk) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    byWeek.set(wk, entry);
  });
  const weeklyTrend = Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([wk, v]) => ({ label: new Date(wk + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), acc: pct(v.correct, v.total), total: v.total }));

  const trendDelta = weeklyTrend.length >= 2
    ? weeklyTrend[weeklyTrend.length - 1].acc - weeklyTrend[weeklyTrend.length - 2].acc
    : null;

  // Por banca
  const byBanca = new Map<string, { total: number; correct: number }>();
  scoped.forEach((l) => {
    if (!l.banca) return;
    const entry = byBanca.get(l.banca) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    byBanca.set(l.banca, entry);
  });
  const bancaChart = Array.from(byBanca.entries())
    .map(([label, v]) => ({ label, acc: pct(v.correct, v.total), total: v.total }))
    .sort((a, b) => b.total - a.total);

  // Por confiança
  const byConfidence = new Map<StudyConfidence, { total: number; correct: number }>();
  scoped.forEach((l) => {
    if (!l.confidence) return;
    const entry = byConfidence.get(l.confidence) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (l.correct) entry.correct += 1;
    byConfidence.set(l.confidence, entry);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {periodOptions.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "0.35rem 0.8rem", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontWeight: 700,
                background: period === p.id ? accent : "var(--bg-secondary)",
                color: period === p.id ? "#fff" : "var(--text-muted)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {members.length > 1 && (
          <select value={readerFilter} onChange={(e) => setReaderFilter(e.target.value)} className="input-field" style={{ width: "auto", fontSize: "0.82rem", cursor: "pointer" }}>
            <option value="all">Toda a família</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Questões no período</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{totalQuestions}</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>% de acerto</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: accuracyColor(overallAcc) }}>{overallAcc}%</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Sequência</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            {streak > 1 && <MdLocalFireDepartment size={18} color="#d06a6a" />} {streak}d
          </div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Matérias ativas</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeSubjects}</div>
        </div>
      </div>

      {/* Acerto por matéria */}
      {subjectChart.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Acerto por matéria
          </h3>
          <div style={{ width: "100%", height: Math.max(100, subjectChart.length * 40) }}>
            <ResponsiveContainer>
              <BarChart data={subjectChart} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(v: number, _n, p) => [`${v}% (${p.payload.total} questões)`, "Acerto"]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="acc" radius={[0, 6, 6, 0]}>
                  {subjectChart.map((s, idx) => <Cell key={idx} fill={accuracyColor(s.acc)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pontos fracos */}
      {weakSpots.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MdPriorityHigh size={18} color="#d06a6a" /> Pontos fracos
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
            Assuntos com pelo menos 3 questões e menor % de acerto — bons candidatos pra revisar
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {weakSpots.map((w) => (
              <div key={w.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.label}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{w.total}q</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: accuracyColor(w.acc), minWidth: 36, textAlign: "right" }}>{w.acc}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolução */}
      {weeklyTrend.length > 1 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            Evolução do % de acerto por semana
          </h3>
          {trendDelta != null && (
            <p style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem", color: trendDelta >= 0 ? "#7aab8a" : "#d06a6a", marginBottom: "0.9rem" }}>
              {trendDelta >= 0 ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
              {Math.abs(trendDelta)}pp vs semana anterior
            </p>
          )}
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number, _n, p) => [`${v}% (${p.payload.total} questões)`, "Acerto"]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="acc" stroke={accent} strokeWidth={3} dot isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Por banca */}
      {bancaChart.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
            Acerto por banca
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {bancaChart.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{b.label}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.total}q</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: accuracyColor(b.acc), minWidth: 36, textAlign: "right" }}>{b.acc}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por confiança */}
      {byConfidence.size > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            Acerto por nível de confiança
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
            Ajuda a ver se você erra por excesso de confiança ou acerta mesmo chutando
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(Object.keys(confidenceConfig) as StudyConfidence[]).map((c) => {
              const v = byConfidence.get(c);
              if (!v) return null;
              const acc = pct(v.correct, v.total);
              return (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{confidenceConfig[c].emoji} {confidenceConfig[c].label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{v.total}q</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: accuracyColor(acc), minWidth: 36, textAlign: "right" }}>{acc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
