import type { StudyLog, StudySimulado, StudyQuestion, StudySubject } from "@/types";

export const XP_PER_CORRECT = 10;
export const XP_PER_WRONG = 2;

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function calcXp(logs: StudyLog[]): number {
  return logs.reduce((sum, l) => sum + (l.correct ? XP_PER_CORRECT : XP_PER_WRONG), 0);
}

const LEVEL_BASE = 80;
const LEVEL_GROWTH = 20;

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
}

export function calcLevel(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  let need = LEVEL_BASE;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = LEVEL_BASE + (level - 1) * LEVEL_GROWTH;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: need, progress: need ? remaining / need : 0 };
}

const LEVEL_TITLES = ["Iniciante", "Aprendiz", "Dedicado(a)", "Estudioso(a)", "Avançado(a)", "Mestre", "Lenda"];

export function levelTitle(level: number) {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[Math.max(0, idx)];
}

export function daysWithActivity(logs: StudyLog[]): Set<string> {
  return new Set(logs.map((l) => l.date));
}

export function calcStreak(logs: StudyLog[]): number {
  const days = daysWithActivity(logs);
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calcTodayCount(logs: StudyLog[]): number {
  const today = todayStr();
  return logs.filter((l) => l.date === today).length;
}

export const DEFAULT_DAILY_GOAL = 10;
const DAILY_GOAL_KEY = "acalanto_estudos_daily_goal";

export function getDailyGoal(): number {
  if (typeof window === "undefined") return DEFAULT_DAILY_GOAL;
  try {
    const raw = window.localStorage.getItem(DAILY_GOAL_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_GOAL;
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

export function setDailyGoal(n: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAILY_GOAL_KEY, String(Math.max(1, n)));
  } catch {
    // ignora — preferência de dispositivo, não é crítico
  }
}

export interface BadgeDef {
  key: string;
  emoji: string;
  label: string;
  desc: string;
}

export const BADGES: BadgeDef[] = [
  { key: "primeira_questao", emoji: "🌱", label: "Primeiro passo", desc: "Responda sua primeira questão" },
  { key: "dez_acertos", emoji: "🔟", label: "Dez acertos", desc: "Acerte 10 questões no total" },
  { key: "cinquenta_acertos", emoji: "⭐", label: "Meio-centenário", desc: "Acerte 50 questões no total" },
  { key: "cem_acertos", emoji: "💯", label: "Cem acertos", desc: "Acerte 100 questões no total" },
  { key: "streak_3", emoji: "🔥", label: "Pegando o ritmo", desc: "Estude 3 dias seguidos" },
  { key: "streak_7", emoji: "🔥", label: "Semana cheia", desc: "Estude 7 dias seguidos" },
  { key: "streak_30", emoji: "🔥", label: "Imparável", desc: "Estude 30 dias seguidos" },
  { key: "multidisciplinar", emoji: "🧭", label: "Multidisciplinar", desc: "Pratique pelo menos 3 matérias diferentes" },
  { key: "simulado_completo", emoji: "🏁", label: "Primeiro simulado", desc: "Finalize um simulado" },
  { key: "simulado_perfeito", emoji: "🏆", label: "Nota máxima", desc: "Acerte 100% das questões em um simulado" },
  { key: "nivel_5", emoji: "🚀", label: "Nível 5", desc: "Alcance o nível 5" },
  { key: "nivel_10", emoji: "👑", label: "Nível 10", desc: "Alcance o nível 10" },
];

export interface GameState {
  xp: number;
  level: LevelInfo;
  levelLabel: string;
  streak: number;
  todayCount: number;
  dailyGoal: number;
  totalCorrect: number;
  totalQuestions: number;
  unlockedKeys: Set<string>;
}

function isSimuladoPerfeito(s: StudySimulado, questionMap: Map<string, StudyQuestion>): boolean {
  if (!s.finished_at || s.question_ids.length === 0) return false;
  return s.question_ids.every((qid) => {
    const q = questionMap.get(qid);
    const given = s.answers[qid];
    return q != null && given != null && given === q.correct_answer;
  });
}

export function buildGameState(logs: StudyLog[], simulados: StudySimulado[], questions: StudyQuestion[], dailyGoal: number): GameState {
  const xp = calcXp(logs);
  const level = calcLevel(xp);
  const streak = calcStreak(logs);
  const todayCount = calcTodayCount(logs);
  const totalCorrect = logs.filter((l) => l.correct).length;
  const totalQuestions = logs.length;
  const subjectsCount = new Set(logs.map((l) => l.subject_id)).size;
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const hasFinishedSimulado = simulados.some((s) => s.finished_at != null);
  const hasPerfectSimulado = simulados.some((s) => isSimuladoPerfeito(s, questionMap));

  const flags: Record<string, boolean> = {
    primeira_questao: totalQuestions >= 1,
    dez_acertos: totalCorrect >= 10,
    cinquenta_acertos: totalCorrect >= 50,
    cem_acertos: totalCorrect >= 100,
    streak_3: streak >= 3,
    streak_7: streak >= 7,
    streak_30: streak >= 30,
    multidisciplinar: subjectsCount >= 3,
    simulado_completo: hasFinishedSimulado,
    simulado_perfeito: hasPerfectSimulado,
    nivel_5: level.level >= 5,
    nivel_10: level.level >= 10,
  };
  const unlockedKeys = new Set(Object.entries(flags).filter(([, v]) => v).map(([k]) => k));

  return {
    xp, level, levelLabel: levelTitle(level.level), streak, todayCount, dailyGoal,
    totalCorrect, totalQuestions, unlockedKeys,
  };
}

export interface SubjectRankEntry {
  subjectId: string;
  name: string;
  emoji: string;
  xp: number;
  level: number;
  total: number;
  correct: number;
  accuracy: number;
}

export function calcSubjectRanking(logs: StudyLog[], subjects: StudySubject[]): SubjectRankEntry[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const bySubject = new Map<string, StudyLog[]>();
  logs.forEach((l) => {
    const arr = bySubject.get(l.subject_id) ?? [];
    arr.push(l);
    bySubject.set(l.subject_id, arr);
  });
  return Array.from(bySubject.entries())
    .map(([subjectId, subjectLogs]) => {
      const s = subjectMap.get(subjectId);
      const xp = calcXp(subjectLogs);
      const correct = subjectLogs.filter((l) => l.correct).length;
      return {
        subjectId,
        name: s?.name ?? "Matéria removida",
        emoji: s?.emoji ?? "📘",
        xp,
        level: calcLevel(xp).level,
        total: subjectLogs.length,
        correct,
        accuracy: subjectLogs.length ? Math.round((correct / subjectLogs.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.xp - a.xp);
}
