"use client";
import { useState } from "react";
import { MdAdd, MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const defaultEvents = [
  { date: "2026-06-27", title: "Consulta cardiologista", color: "#d06a6a", member: "Matheus", emoji: "❤️" },
  { date: "2026-06-30", title: "Pagar aluguel", color: "var(--brand)", member: "Família", emoji: "🏠" },
  { date: "2026-07-05", title: "Aniversário da Ana 🎂", color: "#c07898", member: "Família", emoji: "🎂" },
  { date: "2026-07-10", title: "Dentista", color: "#6a9fd4", member: "Ana", emoji: "🦷" },
  { date: "2026-07-15", title: "Reunião escola", color: "#c99a40", member: "Família", emoji: "🏫" },
];

export default function CalendarioPage() {
  const today = new Date();
  const [events, setEvents] = useState(defaultEvents);
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMember, setNewMember] = useState("Família");
  const [newDate, setNewDate] = useState("");
  const [toast, setToast] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.date + "T12:00:00") >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          📅 Agenda da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Toque em um dia para ver os eventos. Toque no botão verde para adicionar.
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setAddModal(true)}
        style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "var(--brand)", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(122,171,138,0.4)", marginBottom: "1.75rem" }}
      >
        <MdAdd size={24} /> Adicionar evento à agenda
      </button>

      {/* Calendário */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Navegação de mês */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1.5px solid var(--border)", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <MdChevronLeft size={24} />
          </button>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-secondary)", border: "1.5px solid var(--border)", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <MdChevronRight size={24} />
          </button>
        </div>

        {/* Dias da semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", padding: "0.4rem 0" }}>{d}</div>
          ))}
        </div>

        {/* Grade de dias */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const dayEvents = getEventsForDay(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  minHeight: 52,
                  padding: "0.3rem 0.2rem",
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? "var(--brand)" : isToday ? "var(--brand-border)" : "transparent"}`,
                  background: isSelected ? "var(--brand-bg)" : isToday ? "rgba(122,171,138,0.06)" : "transparent",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.88rem", fontWeight: isToday || isSelected ? 800 : 400, color: isSelected ? "var(--brand)" : isToday ? "var(--brand)" : "var(--text-secondary)", marginBottom: "3px" }}>
                  {day}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
                  {dayEvents.slice(0, 2).map((ev, j) => (
                    <div key={j} style={{ height: 5, borderRadius: 3, background: ev.color, width: "80%", margin: "0 auto" }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Eventos do dia selecionado */}
      {selectedDay && (
        <div style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>
            📌 Dia {selectedDay} de {MONTHS[month]}
          </h3>
          {selectedEvents.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>😊</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Nenhum evento neste dia.</p>
              <button onClick={() => setAddModal(true)} style={{ marginTop: "1rem", padding: "0.625rem 1.25rem", borderRadius: 12, border: "1.5px solid var(--brand)", background: "var(--brand-bg)", color: "var(--brand)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                <MdAdd size={16} /> Adicionar evento
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {selectedEvents.map((ev) => (
                <div key={ev.date + ev.title} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72, borderLeft: `4px solid ${ev.color}` }}>
                  <span style={{ fontSize: "1.75rem" }}>{ev.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{ev.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>👤 {ev.member}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Próximos eventos */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>
          🔜 Próximos eventos
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {upcomingEvents.map((ev) => {
            const daysAway = Math.ceil((new Date(ev.date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={ev.date + ev.title} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 68, borderLeft: `4px solid ${ev.color}` }}>
                <span style={{ fontSize: "1.5rem" }}>{ev.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{ev.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>👤 {ev.member}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {new Date(ev.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: daysAway <= 3 ? "#d06a6a" : "var(--text-muted)" }}>
                    {daysAway <= 0 ? "Hoje!" : `Em ${daysAway} dias`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo Evento</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>O que vai acontecer? *</label>
                <input
                  type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Consulta médica, aniversário, reunião..."
                  className="input-field" style={{ fontSize: "1rem" }} autoFocus
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Data *</label>
                  <input
                    type="date" value={newDate || (selectedDateStr ?? "")}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input-field" style={{ fontSize: "0.95rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Quem?</label>
                  <select value={newMember} onChange={(e) => setNewMember(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                    <option>Família</option>
                    <option>Ana</option>
                    <option>Matheus</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setAddModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
                <button
                  disabled={!newTitle.trim() || (!newDate && !selectedDateStr)}
                  onClick={() => {
                    const date = newDate || selectedDateStr!;
                    setEvents((prev) => [...prev, { date, title: newTitle.trim(), color: "var(--brand)", member: newMember, emoji: "📅" }]);
                    showToast("✅ Evento adicionado!");
                    setNewTitle(""); setNewDate(""); setNewMember("Família");
                    setAddModal(false);
                  }}
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800, opacity: (newTitle.trim() && (newDate || selectedDateStr)) ? 1 : 0.6 }}
                >
                  <MdAdd size={20} /> Salvar evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
