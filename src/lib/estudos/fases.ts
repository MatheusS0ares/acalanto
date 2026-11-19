import type { StudySubject, StudyTopic, StudyQuestion, StudyLog } from "@/types";

// Uma "fase" é um assunto (StudyTopic) com questões cadastradas. A ordem das
// fases segue a ordem de criação dos assuntos — por isso, ao importar um
// caderno novo (ImportCaderno), os assuntos devem vir na ordem pedagógica
// desejada: eles entram automaticamente no fim da trilha da matéria.
//
// Uma fase é considerada concluída de forma permanente (nunca "desconclui")
// assim que o total de acertos acumulados nela atinge o limite — por isso
// usamos contagem de acertos, não %, que poderia cair com erros depois.
export const PHASE_PASS_CORRECT = 3;

export type PhaseStatus = "locked" | "available" | "completed";

export interface PhaseInfo {
  topicId: string | null; // null = fase "Geral" (questões sem assunto)
  name: string;
  index: number;
  questionCount: number;
  attempts: number;
  correct: number;
  accuracy: number;
  requiredCorrect: number;
  status: PhaseStatus;
}

export interface TrilhaInfo {
  subject: StudySubject;
  phases: PhaseInfo[];
  completedCount: number;
  totalCount: number;
}

export function buildTrilha(subject: StudySubject, topics: StudyTopic[], questions: StudyQuestion[], logs: StudyLog[]): TrilhaInfo {
  const subjectQuestions = questions.filter((q) => q.subject_id === subject.id);
  const subjectLogs = logs.filter((l) => l.subject_id === subject.id);

  const questionsByTopic = new Map<string, number>();
  subjectQuestions.forEach((q) => {
    const key = q.topic_id ?? "__geral__";
    questionsByTopic.set(key, (questionsByTopic.get(key) ?? 0) + 1);
  });

  const logsByTopic = new Map<string, StudyLog[]>();
  subjectLogs.forEach((l) => {
    const key = l.topic_id ?? "__geral__";
    const arr = logsByTopic.get(key) ?? [];
    arr.push(l);
    logsByTopic.set(key, arr);
  });

  const subjectTopics = topics
    .filter((t) => t.subject_id === subject.id && (questionsByTopic.get(t.id) ?? 0) > 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const ordered: { topicId: string | null; name: string }[] = [];
  if ((questionsByTopic.get("__geral__") ?? 0) > 0) ordered.push({ topicId: null, name: "Geral" });
  subjectTopics.forEach((t) => ordered.push({ topicId: t.id, name: t.name }));

  let unlocked = true;
  const phases: PhaseInfo[] = ordered.map((o, index) => {
    const key = o.topicId ?? "__geral__";
    const questionCount = questionsByTopic.get(key) ?? 0;
    const topicLogs = logsByTopic.get(key) ?? [];
    const attempts = topicLogs.length;
    const correct = topicLogs.filter((l) => l.correct).length;
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    const requiredCorrect = Math.min(PHASE_PASS_CORRECT, questionCount);
    const completed = correct >= requiredCorrect;
    const status: PhaseStatus = completed ? "completed" : unlocked ? "available" : "locked";
    unlocked = completed; // só libera a próxima se esta foi concluída
    return { topicId: o.topicId, name: o.name, index, questionCount, attempts, correct, accuracy, requiredCorrect, status };
  });

  return { subject, phases, completedCount: phases.filter((p) => p.status === "completed").length, totalCount: phases.length };
}

export function buildAllTrilhas(subjects: StudySubject[], topics: StudyTopic[], questions: StudyQuestion[], logs: StudyLog[]): TrilhaInfo[] {
  return subjects
    .map((s) => buildTrilha(s, topics, questions, logs))
    .filter((t) => t.totalCount > 0);
}
