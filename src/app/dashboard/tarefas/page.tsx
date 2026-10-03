"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdCheck, MdStar, MdClose } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "@/types";

type Priority = "low" | "medium" | "high";
type Status = "pending" | "in_progress" | "done";
type Recurrence = "daily" | "weekly" | "monthly";

interface TaskRow {
  id: string;
  family_id: string;
  title: string;
  assigned_to: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  recurrence: Recurrence | null;
  points: number;
  emoji: string;
  completed_by: string | null;
  completed_at: string | null;
}

const priorityConfig: Record<Priority, { color: string; bg: string; label: string }> = {
  low:    { color: "var(--brand)", bg: "var(--brand-bg)", label: "Baixa prioridade" },
  medium: { color: "#c99a40", bg: "rgba(201,154,64,0.12)", label: "Prioridade média" },
  high:   { color: "#e07878", bg: "rgba(220,80,80,0.12)", label: "Alta prioridade" },
};

const recurringLabel: Record<string, string> = {
  daily: "Tarefa diária",
  weekly: "Tarefa semanal",
  monthly: "Tarefa mensal",
};

const emojis: Record<Priority, string> = { low: "📋", medium: "⚡", high: "🔴" };

export default function TarefasPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [memberFilter, setMemberFilter] = useState("Todos");
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState("");

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

    const { data: memberRows } = await supabase
      .from("acalanto_family_members")
      .select("*")
      .eq("family_id", me.family_id);
    setMembers(memberRows ?? []);

    const { data: taskRows } = await supabase
      .from("acalanto_tasks")
      .select("id, family_id, title, assigned_to, priority, status, due_date, recurrence, points, emoji, completed_by, completed_at")
      .eq("family_id", me.family_id)
      .order("created_at", { ascending: false });
    setTasks(taskRows ?? []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const memberName = (id: string | null) => (id && memberMap.get(id)?.name) || "Família";

  const filtered = tasks.filter((t) => memberFilter === "Todos" || memberName(t.assigned_to) === memberFilter);
  const pending = filtered.filter((t) => t.status !== "done");
  const done = filtered.filter((t) => t.status === "done");

  const scores = members.map((m) => ({
    name: m.name,
    pts: tasks.filter((t) => t.status === "done" && t.completed_by === m.id).reduce((s, t) => s + t.points, 0),
  }));

  async function completeTask(task: TaskRow) {
    const supabase = createClient();
    setTasks((prev) => prev.map((t) => t.id === task.id
      ? { ...t, status: "done" as Status, completed_by: memberId, completed_at: new Date().toISOString() }
      : t));
    showToast(`✅ "${task.title}" concluída! +${task.points} pontos`);
    await supabase
      .from("acalanto_tasks")
      .update({ status: "done", completed_by: memberId, completed_at: new Date().toISOString() })
      .eq("id", task.id);
  }

  async function addTask(input: { title: string; assignedTo: string; priority: Priority; dueDate?: string; recurring?: Recurrence }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const points = input.priority === "high" ? 15 : input.priority === "medium" ? 10 : 5;
    const row: TaskRow = {
      id, family_id: familyId, title: input.title,
      assigned_to: input.assignedTo || null,
      priority: input.priority, status: "pending",
      due_date: input.dueDate || null,
      recurrence: input.recurring || null,
      points, emoji: emojis[input.priority],
      completed_by: null, completed_at: null,
    };
    setTasks((prev) => [row, ...prev]);
    showToast(`✅ "${input.title}" adicionada!`);
    setAddModal(false);
    const { error } = await supabase.from("acalanto_tasks").insert({
      id, family_id: familyId, title: input.title,
      assigned_to: input.assignedTo || null,
      priority: input.priority, status: "pending",
      due_date: input.dueDate || null,
      is_recurring: !!input.recurring,
      recurrence: input.recurring || null,
      points, emoji: emojis[input.priority],
    });
    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Erro ao criar tarefa");
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem",
          borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          ✅ Tarefas da Casa
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {pending.length > 0
            ? `${pending.length} tarefa${pending.length > 1 ? "s" : ""} para fazer. Toque no círculo ao lado da tarefa para marcar como pronta.`
            : "Parabéns! Todas as tarefas estão concluídas. 🎉"}
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setAddModal(true)}
        style={{
          width: "100%", padding: "1rem 1.25rem",
          borderRadius: 16, border: "none", cursor: "pointer",
          background: "var(--brand)", color: "#fff",
          fontSize: "1.05rem", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
          boxShadow: "0 4px 16px rgba(122,171,138,0.4)",
          marginBottom: "1.75rem",
        }}
      >
        <MdAdd size={24} /> Adicionar nova tarefa
      </button>

      {/* Placar */}
      {scores.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.75rem" }}>
          {scores.map(({ name, pts }) => (
            <div key={name} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "white", fontSize: "1rem", flexShrink: 0,
              }}>
                {name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>{name}</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <MdStar size={18} color="#c99a40" /> {pts} pontos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtro por membro */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["Todos", ...members.map((m) => m.name)].map((m) => (
          <button
            key={m}
            onClick={() => setMemberFilter(m)}
            style={{
              padding: "0.5rem 1.125rem", minHeight: 44,
              borderRadius: "9999px",
              border: `1.5px solid ${memberFilter === m ? "var(--brand)" : "var(--border)"}`,
              background: memberFilter === m ? "var(--brand-bg)" : "transparent",
              color: memberFilter === m ? "var(--brand)" : "var(--text-muted)",
              fontSize: "0.9rem", cursor: "pointer",
              fontWeight: memberFilter === m ? 700 : 500,
            }}
          >
            {m === "Todos" ? "👨‍👩‍👧 Todos" : m}
          </button>
        ))}
      </div>

      {/* Pendentes */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.875rem" }}>
            Para fazer — {pending.length}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} assignedName={memberName(task.assigned_to)} onComplete={() => completeTask(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Concluídas */}
      {done.length > 0 && (
        <div>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.875rem" }}>
            Concluídas — {done.length}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", opacity: 0.65 }}>
            {done.map((task) => <TaskCard key={task.id} task={task} assignedName={memberName(task.assigned_to)} />)}
          </div>
        </div>
      )}

      {pending.length === 0 && done.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          Nenhuma tarefa ainda. Adicione a primeira acima 👆
        </div>
      )}

      {addModal && (
        <AddTaskModal
          members={members}
          onClose={() => setAddModal(false)}
          onAdd={addTask}
        />
      )}
    </div>
  );
}

function TaskCard({ task, assignedName, onComplete }: { task: TaskRow; assignedName: string; onComplete?: () => void }) {
  const pc = priorityConfig[task.priority];
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      className="card"
      style={{
        padding: "1rem 1.125rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        minHeight: 72,
        borderLeft: `4px solid ${isDone ? "var(--border)" : pc.color}`,
      }}
    >
      {/* Check button */}
      {!isDone && onComplete ? (
        <button
          onClick={onComplete}
          aria-label={`Marcar "${task.title}" como concluída`}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `2.5px solid ${pc.color}`,
            background: "transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MdCheck size={22} color={pc.color} />
        </button>
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <MdCheck size={22} color="white" />
        </div>
      )}

      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{task.emoji}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)",
          textDecoration: isDone ? "line-through" : "none", marginBottom: "0.3rem",
        }}>
          {task.title}
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
            👤 {assignedName}
          </span>
          {task.recurrence && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              🔁 {recurringLabel[task.recurrence] ?? task.recurrence}
            </span>
          )}
          {task.due_date && !isDone && (
            <span style={{ fontSize: "0.8rem", color: isOverdue ? "#e07878" : "var(--text-muted)", fontWeight: isOverdue ? 700 : 500 }}>
              {isOverdue ? "⚠️ Venceu " : "📅 Vence "}
              {new Date(task.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0 }}>
        <span style={{
          fontSize: "0.75rem", fontWeight: 700,
          background: pc.bg, color: pc.color,
          padding: "0.2rem 0.55rem", borderRadius: 8,
        }}>
          {pc.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.8rem", color: "#c99a40", fontWeight: 700 }}>
          <MdStar size={14} /> {task.points} pts
        </span>
      </div>
    </div>
  );
}

function AddTaskModal({ members, onClose, onAdd }: {
  members: FamilyMember[];
  onClose: () => void;
  onAdd: (t: { title: string; assignedTo: string; priority: Priority; dueDate?: string; recurring?: Recurrence }) => void;
}) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState(members[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState<Recurrence | "">("");

  function save() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      assignedTo,
      priority,
      dueDate: dueDate || undefined,
      recurring: recurring || undefined,
    });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Tarefa</h2>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}>
            <MdClose size={22} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
              O que precisa ser feito? *
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lavar louça, pagar conta..."
              className="input-field" style={{ fontSize: "1rem" }} autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Quem vai fazer?</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Urgência</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta / Urgente</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Prazo (opcional)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Repetir?</label>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as Recurrence | "")} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                <option value="">Não</option>
                <option value="daily">Todo dia</option>
                <option value="weekly">Toda semana</option>
                <option value="monthly">Todo mês</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "0.95rem", padding: "0.875rem" }}>
              Cancelar
            </button>
            <button onClick={save} disabled={!title.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", fontSize: "1rem", padding: "0.875rem", fontWeight: 800, opacity: title.trim() ? 1 : 0.6 }}>
              <MdAdd size={20} /> Criar tarefa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
