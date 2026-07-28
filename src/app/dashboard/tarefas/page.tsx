"use client";
import { useState } from "react";
import { MdAdd, MdCheck, MdStar, MdClose } from "react-icons/md";

type Priority = "low" | "medium" | "high";
type Status = "pending" | "done";

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  recurring?: string;
  points: number;
  emoji: string;
}

const mockTasks: Task[] = [
  { id: "1", title: "Lavar louça", assignedTo: "Ana", priority: "medium", status: "pending", recurring: "daily", points: 5, emoji: "🍽️" },
  { id: "2", title: "Aspirar sala", assignedTo: "Matheus", priority: "medium", status: "pending", dueDate: "2026-06-28", points: 10, emoji: "🏠" },
  { id: "3", title: "Pagar contas", assignedTo: "Matheus", priority: "high", status: "pending", dueDate: "2026-06-30", points: 15, emoji: "💳" },
  { id: "4", title: "Trocar filtro da água", assignedTo: "Ana", priority: "low", status: "done", points: 8, emoji: "💧" },
  { id: "5", title: "Limpar banheiro", assignedTo: "Ana", priority: "medium", status: "done", recurring: "weekly", points: 12, emoji: "🚿" },
  { id: "6", title: "Comprar remédio", assignedTo: "Matheus", priority: "high", status: "pending", dueDate: "2026-06-27", points: 10, emoji: "💊" },
];

const members = ["Todos", "Ana", "Matheus"];

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

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [memberFilter, setMemberFilter] = useState("Todos");
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = tasks.filter((t) => memberFilter === "Todos" || t.assignedTo === memberFilter);
  const pending = filtered.filter((t) => t.status !== "done");
  const done = filtered.filter((t) => t.status === "done");

  const scores = members.slice(1).map((name) => ({
    name,
    pts: tasks.filter((t) => t.status === "done" && t.assignedTo === name).reduce((s, t) => s + t.points, 0),
  }));

  function completeTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "done" as Status } : t));
    if (task) showToast(`✅ "${task.title}" concluída! +${task.points} pontos`);
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

      {/* Filtro por membro */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {members.map((m) => (
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
              <TaskCard key={task.id} task={task} onComplete={() => completeTask(task.id)} />
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
            {done.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {addModal && (
        <AddTaskModal
          onClose={() => setAddModal(false)}
          onAdd={(task) => {
            setTasks((prev) => [task, ...prev]);
            showToast(`✅ "${task.title}" adicionada!`);
            setAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onComplete }: { task: Task; onComplete?: () => void }) {
  const pc = priorityConfig[task.priority];
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();

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
            👤 {task.assignedTo}
          </span>
          {task.recurring && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              🔁 {recurringLabel[task.recurring] ?? task.recurring}
            </span>
          )}
          {task.dueDate && !isDone && (
            <span style={{ fontSize: "0.8rem", color: isOverdue ? "#e07878" : "var(--text-muted)", fontWeight: isOverdue ? 700 : 500 }}>
              {isOverdue ? "⚠️ Venceu " : "📅 Vence "}
              {new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
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

const emojis: Record<Priority, string> = { low: "📋", medium: "⚡", high: "🔴" };

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("Ana");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState("");

  function save() {
    if (!title.trim()) return;
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      assignedTo,
      priority,
      status: "pending",
      dueDate: dueDate || undefined,
      recurring: recurring || undefined,
      points: priority === "high" ? 15 : priority === "medium" ? 10 : 5,
      emoji: emojis[priority],
    });
    onClose();
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
                <option>Ana</option>
                <option>Matheus</option>
                <option>Família</option>
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
              <select value={recurring} onChange={(e) => setRecurring(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
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
