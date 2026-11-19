"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MdAdd, MdClose, MdCheck, MdSchool, MdBarChart, MdDelete, MdEdit, MdQuiz, MdEditNote, MdChecklist, MdUploadFile,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type {
  FamilyMember, StudySubject, StudyTopic, StudyLog, StudyConfidence,
  StudyEdital, StudyQuestion, StudySimulado, QuestionFormat, QuestionAlternative,
  StudyNote, StudyNoteType,
} from "@/types";
import { AnalisesEstudos } from "@/components/estudos/AnalisesEstudos";
import { QuestionBank } from "@/components/estudos/QuestionBank";
import { Simulados } from "@/components/estudos/Simulados";
import { ResumoDoDia } from "@/components/estudos/ResumoDoDia";
import { NotesChecklist } from "@/components/estudos/NotesChecklist";
import { ImportCaderno, type ImportPayload } from "@/components/estudos/ImportCaderno";

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
  const [editais, setEditais] = useState<StudyEdital[]>([]);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [simulados, setSimulados] = useState<StudySimulado[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [view, setView] = useState<"praticar" | "questoes" | "simulados" | "notas" | "indicadores">("praticar");
  const [importModal, setImportModal] = useState(false);

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

    const { data: editalRows } = await supabase
      .from("acalanto_study_editais")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at");
    setEditais(editalRows ?? []);

    const { data: questionRows } = await supabase
      .from("acalanto_study_questions")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setQuestions(questionRows ?? []);

    const { data: simuladoRows } = await supabase
      .from("acalanto_study_simulados")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setSimulados(simuladoRows ?? []);

    const { data: noteRows } = await supabase
      .from("acalanto_study_notes")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setNotes(noteRows ?? []);

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

  async function addEdital(input: { name: string; banca: string; formatoPadrao: QuestionFormat; pontosCerto: number; pontosErrado: number; pontosBranco: number }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudyEdital = {
      id, family_id: familyId, member_id: studentId || null, name: input.name,
      banca: input.banca || null, formato_padrao: input.formatoPadrao,
      pontos_certo: input.pontosCerto, pontos_errado: input.pontosErrado, pontos_branco: input.pontosBranco,
      created_at: new Date().toISOString(),
    };
    setEditais((prev) => [...prev, row]);
    showToast(`✓ Edital "${input.name}" criado!`);
    const { error } = await supabase.from("acalanto_study_editais").insert({
      id, family_id: familyId, member_id: studentId || null, name: input.name,
      banca: input.banca || null, formato_padrao: input.formatoPadrao,
      pontos_certo: input.pontosCerto, pontos_errado: input.pontosErrado, pontos_branco: input.pontosBranco,
    });
    if (error) { setEditais((prev) => prev.filter((e) => e.id !== id)); showToast("Erro ao criar edital"); }
  }

  async function removeEdital(edital: StudyEdital) {
    const supabase = createClient();
    setEditais((prev) => prev.filter((e) => e.id !== edital.id));
    await supabase.from("acalanto_study_editais").delete().eq("id", edital.id);
  }

  async function saveQuestion(input: {
    id?: string; subjectId: string; topicId: string | null; editalId: string | null; format: QuestionFormat;
    statement: string; alternatives: QuestionAlternative[] | null; correctAnswer: string;
    explanation: string | null; mnemonic: string | null; mindMap: string | null;
  }) {
    const supabase = createClient();
    const patch = {
      subject_id: input.subjectId, topic_id: input.topicId, edital_id: input.editalId, format: input.format,
      statement: input.statement, alternatives: input.alternatives, correct_answer: input.correctAnswer,
      explanation: input.explanation, mnemonic: input.mnemonic, mind_map: input.mindMap,
    };
    if (input.id) {
      setQuestions((prev) => prev.map((q) => q.id === input.id ? { ...q, ...patch } : q));
      showToast("✓ Questão atualizada!");
      const { error } = await supabase.from("acalanto_study_questions").update(patch).eq("id", input.id);
      if (error) showToast("Erro ao salvar questão");
    } else {
      const id = crypto.randomUUID();
      const row: StudyQuestion = { id, family_id: familyId, created_at: new Date().toISOString(), ...patch };
      setQuestions((prev) => [row, ...prev]);
      showToast("✓ Questão adicionada!");
      const { error } = await supabase.from("acalanto_study_questions").insert({ id, family_id: familyId, ...patch });
      if (error) { setQuestions((prev) => prev.filter((q) => q.id !== id)); showToast("Erro ao adicionar questão"); }
    }
  }

  async function removeQuestion(question: StudyQuestion) {
    const supabase = createClient();
    setQuestions((prev) => prev.filter((q) => q.id !== question.id));
    await supabase.from("acalanto_study_questions").delete().eq("id", question.id);
  }

  async function createSimulado(input: { name: string; editalId: string | null; subjectIds: string[]; quantity: number }): Promise<StudySimulado | null> {
    const pool = input.subjectIds.length ? questions.filter((q) => input.subjectIds.includes(q.subject_id)) : questions;
    if (pool.length === 0) { showToast("Nenhuma questão disponível com esse filtro"); return null; }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(input.quantity, shuffled.length));
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudySimulado = {
      id, family_id: familyId, member_id: studentId || null, edital_id: input.editalId, name: input.name,
      question_ids: selected.map((q) => q.id), answers: {}, started_at: new Date().toISOString(),
      finished_at: null, score: null, max_score: null, created_at: new Date().toISOString(),
    };
    setSimulados((prev) => [row, ...prev]);
    const { error } = await supabase.from("acalanto_study_simulados").insert({
      id, family_id: familyId, member_id: studentId || null, edital_id: input.editalId, name: input.name,
      question_ids: row.question_ids, answers: {}, started_at: row.started_at,
    });
    if (error) { setSimulados((prev) => prev.filter((s) => s.id !== id)); showToast("Erro ao montar simulado"); return null; }
    return row;
  }

  async function submitSimulado(simulado: StudySimulado, answers: Record<string, string | null>): Promise<StudySimulado | null> {
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const edital = simulado.edital_id ? editais.find((e) => e.id === simulado.edital_id) : null;
    const pontosCerto = edital?.pontos_certo ?? 1;
    const pontosErrado = edital?.pontos_errado ?? 0;
    const pontosBranco = edital?.pontos_branco ?? 0;

    let score = 0;
    const newLogs: StudyLog[] = [];
    simulado.question_ids.forEach((qid) => {
      const q = questionMap.get(qid);
      if (!q) return;
      const given = answers[qid] ?? null;
      if (given == null) { score += pontosBranco; return; }
      const correct = given === q.correct_answer;
      score += correct ? pontosCerto : pontosErrado;
      newLogs.push({
        id: crypto.randomUUID(), family_id: familyId, member_id: simulado.member_id, subject_id: q.subject_id,
        topic_id: q.topic_id, correct, banca: edital?.banca ?? null, confidence: null, note: null,
        date: todayStr(), created_at: new Date().toISOString(),
      });
    });
    const maxScore = simulado.question_ids.length * pontosCerto;
    const finishedAt = new Date().toISOString();
    const updated: StudySimulado = { ...simulado, answers, finished_at: finishedAt, score, max_score: maxScore };

    setSimulados((prev) => prev.map((s) => s.id === simulado.id ? updated : s));
    setLogs((prev) => [...newLogs, ...prev]);

    const supabase = createClient();
    const { error } = await supabase.from("acalanto_study_simulados").update({
      answers, finished_at: finishedAt, score, max_score: maxScore,
    }).eq("id", simulado.id);
    if (error) { showToast("Erro ao salvar resultado do simulado"); return null; }
    if (newLogs.length) {
      await supabase.from("acalanto_study_logs").insert(newLogs.map((l) => ({
        id: l.id, family_id: l.family_id, member_id: l.member_id, subject_id: l.subject_id,
        topic_id: l.topic_id, correct: l.correct, banca: l.banca, confidence: l.confidence, date: l.date,
      })));
    }
    showToast(`🏁 Simulado finalizado: ${score}/${maxScore} pts`);
    return updated;
  }

  async function removeSimulado(simulado: StudySimulado) {
    const supabase = createClient();
    setSimulados((prev) => prev.filter((s) => s.id !== simulado.id));
    await supabase.from("acalanto_study_simulados").delete().eq("id", simulado.id);
  }

  async function addNote(input: { type: StudyNoteType; title: string; content: string | null; dueDate: string | null; subjectId: string | null; editalId: string | null }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: StudyNote = {
      id, family_id: familyId, member_id: studentId || null, edital_id: input.editalId, subject_id: input.subjectId,
      type: input.type, title: input.title, content: input.content, done: false, due_date: input.dueDate,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [row, ...prev]);
    showToast(input.type === "checklist" ? "✓ Item adicionado!" : "✓ Nota adicionada!");
    const { error } = await supabase.from("acalanto_study_notes").insert({
      id, family_id: familyId, member_id: studentId || null, edital_id: input.editalId, subject_id: input.subjectId,
      type: input.type, title: input.title, content: input.content, done: false, due_date: input.dueDate,
    });
    if (error) { setNotes((prev) => prev.filter((n) => n.id !== id)); showToast("Erro ao adicionar"); }
  }

  async function toggleNoteDone(note: StudyNote) {
    const supabase = createClient();
    const done = !note.done;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, done } : n));
    await supabase.from("acalanto_study_notes").update({ done }).eq("id", note.id);
  }

  async function removeNote(note: StudyNote) {
    const supabase = createClient();
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await supabase.from("acalanto_study_notes").delete().eq("id", note.id);
  }

  async function importCaderno(payload: ImportPayload): Promise<boolean> {
    const supabase = createClient();
    const norm = (s: string) => s.trim().toLowerCase();

    let editalRealId: string | null = null;
    let newEdital: StudyEdital | null = null;
    if (payload.edital) {
      const existing = editais.find((e) => norm(e.name) === norm(payload.edital!.name));
      if (existing) {
        editalRealId = existing.id;
      } else {
        const id = crypto.randomUUID();
        newEdital = {
          id, family_id: familyId, member_id: studentId || null, name: payload.edital.name,
          banca: payload.edital.banca || null, formato_padrao: payload.edital.formatoPadrao ?? "multipla_escolha",
          pontos_certo: payload.edital.pontosCerto ?? 1, pontos_errado: payload.edital.pontosErrado ?? 0,
          pontos_branco: payload.edital.pontosBranco ?? 0, created_at: new Date().toISOString(),
        };
        editalRealId = id;
      }
    }

    const refToSubjectId = new Map<string, string>();
    const newSubjects: StudySubject[] = [];
    (payload.subjects ?? []).forEach((s) => {
      const existing = subjects.find((x) => norm(x.name) === norm(s.name));
      if (existing) { refToSubjectId.set(s.ref, existing.id); return; }
      const id = crypto.randomUUID();
      refToSubjectId.set(s.ref, id);
      newSubjects.push({ id, family_id: familyId, member_id: studentId || null, name: s.name, emoji: s.emoji || "📘", created_at: new Date().toISOString() });
    });

    const refToTopicId = new Map<string, string>();
    const newTopics: StudyTopic[] = [];
    (payload.topics ?? []).forEach((t) => {
      const subjectId = refToSubjectId.get(t.subjectRef);
      if (!subjectId) return;
      const existing = topics.find((x) => x.subject_id === subjectId && norm(x.name) === norm(t.name))
        ?? newTopics.find((x) => x.subject_id === subjectId && norm(x.name) === norm(t.name));
      if (existing) { refToTopicId.set(t.ref, existing.id); return; }
      const id = crypto.randomUUID();
      refToTopicId.set(t.ref, id);
      newTopics.push({ id, family_id: familyId, subject_id: subjectId, name: t.name, created_at: new Date().toISOString() });
    });

    const newQuestions: StudyQuestion[] = (payload.questions ?? []).flatMap((q) => {
      const subjectId = refToSubjectId.get(q.subjectRef);
      if (!subjectId) return [];
      const topicId = q.topicRef ? refToTopicId.get(q.topicRef) ?? null : null;
      return [{
        id: crypto.randomUUID(), family_id: familyId, subject_id: subjectId, topic_id: topicId,
        edital_id: editalRealId, format: q.format, statement: q.statement,
        alternatives: q.alternatives ?? null, correct_answer: q.correctAnswer,
        explanation: q.explanation ?? null, mnemonic: q.mnemonic ?? null, mind_map: q.mindMap ?? null,
        created_at: new Date().toISOString(),
      }];
    });

    const newNotes: StudyNote[] = (payload.notes ?? []).map((n) => ({
      id: crypto.randomUUID(), family_id: familyId, member_id: studentId || null,
      edital_id: n.editalRef ? editalRealId : null,
      subject_id: n.subjectRef ? refToSubjectId.get(n.subjectRef) ?? null : null,
      type: n.type, title: n.title, content: n.content ?? null, done: false, due_date: n.dueDate ?? null,
      created_at: new Date().toISOString(),
    }));

    if (newEdital) {
      const { error } = await supabase.from("acalanto_study_editais").insert({
        id: newEdital.id, family_id: newEdital.family_id, member_id: newEdital.member_id, name: newEdital.name,
        banca: newEdital.banca, formato_padrao: newEdital.formato_padrao, pontos_certo: newEdital.pontos_certo,
        pontos_errado: newEdital.pontos_errado, pontos_branco: newEdital.pontos_branco,
      });
      if (error) { showToast("Erro ao importar edital"); return false; }
    }
    if (newSubjects.length) {
      const { error } = await supabase.from("acalanto_study_subjects").insert(newSubjects.map((s) => ({ id: s.id, family_id: s.family_id, member_id: s.member_id, name: s.name, emoji: s.emoji })));
      if (error) { showToast("Erro ao importar matérias"); return false; }
    }
    if (newTopics.length) {
      const { error } = await supabase.from("acalanto_study_topics").insert(newTopics.map((t) => ({ id: t.id, family_id: t.family_id, subject_id: t.subject_id, name: t.name })));
      if (error) { showToast("Erro ao importar assuntos"); return false; }
    }
    if (newQuestions.length) {
      const { error } = await supabase.from("acalanto_study_questions").insert(newQuestions.map((q) => ({
        id: q.id, family_id: q.family_id, subject_id: q.subject_id, topic_id: q.topic_id, edital_id: q.edital_id,
        format: q.format, statement: q.statement, alternatives: q.alternatives, correct_answer: q.correct_answer,
        explanation: q.explanation, mnemonic: q.mnemonic, mind_map: q.mind_map,
      })));
      if (error) { showToast("Erro ao importar questões"); return false; }
    }
    if (newNotes.length) {
      const { error } = await supabase.from("acalanto_study_notes").insert(newNotes.map((n) => ({
        id: n.id, family_id: n.family_id, member_id: n.member_id, edital_id: n.edital_id, subject_id: n.subject_id,
        type: n.type, title: n.title, content: n.content, done: n.done, due_date: n.due_date,
      })));
      if (error) { showToast("Erro ao importar notas"); return false; }
    }

    if (newEdital) setEditais((prev) => [...prev, newEdital!]);
    if (newSubjects.length) setSubjects((prev) => [...prev, ...newSubjects]);
    if (newTopics.length) setTopics((prev) => [...prev, ...newTopics]);
    if (newQuestions.length) setQuestions((prev) => [...newQuestions, ...prev]);
    if (newNotes.length) setNotes((prev) => [...newNotes, ...prev]);
    showToast(`✓ Importado: ${newSubjects.length} matérias, ${newTopics.length} assuntos, ${newQuestions.length} questões, ${newNotes.length} notas`);
    return true;
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

      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            🎓 Estudos
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {view === "praticar" ? "Registre as questões que você resolveu"
              : view === "questoes" ? "Seu banco de questões"
              : view === "simulados" ? "Simulados e avaliações"
              : view === "notas" ? "Notas e checklist"
              : "Seus indicadores de desempenho"}
          </p>
        </div>
        <button
          onClick={() => setImportModal(true)}
          className="btn-secondary"
          style={{ flexShrink: 0, padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          aria-label="Importar caderno"
        >
          <MdUploadFile size={16} /> Importar
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {([
          { id: "praticar" as const, label: "Praticar", icon: MdSchool },
          { id: "questoes" as const, label: "Questões", icon: MdEditNote },
          { id: "simulados" as const, label: "Simulados", icon: MdQuiz },
          { id: "notas" as const, label: "Notas", icon: MdChecklist },
          { id: "indicadores" as const, label: "Indicadores", icon: MdBarChart },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1, minWidth: 110, padding: "0.55rem 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              background: view === id ? ACCENT : "var(--bg-secondary)",
              color: view === id ? "#fff" : "var(--text-muted)",
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {(view === "praticar" || view === "questoes") && (
        <div style={{ marginBottom: "1.25rem" }}>
          <ResumoDoDia
            subjects={subjects} topics={topics} questions={questions} logs={logs} accent={ACCENT}
            onSelectTopic={(sId, tId) => { setSubjectId(sId); setTopicId(tId ?? ""); setView("praticar"); }}
          />
        </div>
      )}

      {view === "indicadores" && (
        <AnalisesEstudos subjects={subjects} topics={topics} logs={logs} members={members} accent={ACCENT} />
      )}

      {view === "questoes" && (
        <QuestionBank
          subjects={subjects} topics={topics} editais={editais} questions={questions} accent={ACCENT}
          onAddEdital={addEdital} onRemoveEdital={removeEdital}
          onSaveQuestion={saveQuestion} onRemoveQuestion={removeQuestion}
        />
      )}

      {view === "simulados" && (
        <Simulados
          subjects={subjects} topics={topics} editais={editais} questions={questions} simulados={simulados}
          members={members} studentId={studentId} accent={ACCENT}
          onCreateSimulado={createSimulado} onSubmitSimulado={submitSimulado} onRemoveSimulado={removeSimulado}
        />
      )}

      {view === "notas" && (
        <NotesChecklist
          notes={notes} subjects={subjects} editais={editais} accent={ACCENT}
          onAddNote={addNote} onToggleDone={toggleNoteDone} onRemoveNote={removeNote}
        />
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

      {importModal && (
        <ImportCaderno accent={ACCENT} onClose={() => setImportModal(false)} onImport={importCaderno} />
      )}
    </div>
  );
}
