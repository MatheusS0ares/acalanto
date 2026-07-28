"use client";
import { useState } from "react";
import { MdAdd, MdFavorite, MdMedicalServices, MdVaccines, MdClose, MdNotifications } from "react-icons/md";

type Section = "consultas" | "medicamentos" | "vacinas";

const upcomingAppointments = [
  { id: "1", title: "Cardiologista", member: "Matheus", date: "2026-07-05", doctor: "Dr. Carlos Lima", location: "Clínica Vida", emoji: "❤️" },
  { id: "2", title: "Dentista", member: "Ana", date: "2026-07-10", doctor: "Dra. Priya Silva", location: "Odonto Plus", emoji: "🦷" },
  { id: "3", title: "Hemograma", member: "Matheus", date: "2026-07-03", location: "Lab Saúde", emoji: "🩸" },
];

const medications = [
  { id: "1", name: "Omeprazol 20mg", member: "Matheus", schedule: "1x por dia — manhã", stock: 15, emoji: "💊" },
  { id: "2", name: "Vitamina D 2000UI", member: "Ana", schedule: "1x por dia — almoço", stock: 30, emoji: "☀️" },
  { id: "3", name: "Anticoncepcional", member: "Ana", schedule: "1x por dia — noite", stock: 7, emoji: "💊" },
];

const vaccines = [
  { id: "1", name: "Gripe", member: "Matheus", date: "2026-01-10", next: "2027-01-10", emoji: "💉" },
  { id: "2", name: "COVID (dose 5)", member: "Ana", date: "2025-09-05", next: "2026-09-05", emoji: "💉" },
];

export default function SaudePage() {
  const [section, setSection] = useState<Section>("consultas");
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const sections: { id: Section; label: string; icon: string; desc: string }[] = [
    { id: "consultas",    label: "Consultas",    icon: "🏥", desc: "Médicos e exames agendados" },
    { id: "medicamentos", label: "Remédios",      icon: "💊", desc: "O que tomar e quando" },
    { id: "vacinas",      label: "Vacinas",       icon: "💉", desc: "Carteirinha da família" },
  ];

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
          ❤️ Saúde da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Próxima consulta: Hemograma do Matheus em 5 dias.
        </p>
      </div>

      {/* Alerta próxima consulta */}
      <div style={{ background: "rgba(208,106,106,0.1)", border: "1.5px solid rgba(208,106,106,0.3)", borderRadius: 14, padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
        <MdNotifications size={24} color="#d06a6a" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#d06a6a" }}>🩸 Hemograma — Matheus</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Sábado, 03/07 · Lab Saúde · Em 5 dias</div>
        </div>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setAddModal(true)}
        style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "none", cursor: "pointer", background: "#d06a6a", color: "#fff", fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", boxShadow: "0 4px 16px rgba(208,106,106,0.35)", marginBottom: "1.75rem" }}
      >
        <MdAdd size={24} /> Registrar consulta, remédio ou vacina
      </button>

      {/* Seletor de seção */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", marginBottom: "1.75rem" }}>
        {sections.map(({ id, label, icon, desc }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            style={{
              padding: "1rem 0.75rem", borderRadius: 14, border: `2px solid ${section === id ? "#d06a6a" : "var(--border)"}`,
              background: section === id ? "rgba(208,106,106,0.1)" : "var(--bg-card)",
              cursor: "pointer", textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>{icon}</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: section === id ? "#d06a6a" : "var(--text-primary)", marginBottom: "0.2rem" }}>{label}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{desc}</div>
          </button>
        ))}
      </div>

      {/* Consultas */}
      {section === "consultas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {upcomingAppointments.map((appt) => {
            const daysAway = Math.ceil((new Date(appt.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={appt.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80 }}>
                <span style={{ fontSize: "2rem", flexShrink: 0 }}>{appt.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{appt.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    👤 {appt.member} · {appt.location}
                  </div>
                  {appt.doctor && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>🩺 {appt.doctor}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {new Date(appt.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: daysAway <= 7 ? "#d06a6a" : "var(--text-muted)", fontWeight: 600 }}>
                    Em {daysAway} dias
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Medicamentos */}
      {section === "medicamentos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            Toque em "Tomei!" para registrar que o remédio foi tomado hoje.
          </p>
          {medications.map((med) => (
            <div key={med.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80, borderLeft: `4px solid ${med.stock <= 10 ? "#d06a6a" : "var(--brand)"}` }}>
              <span style={{ fontSize: "2rem", flexShrink: 0 }}>{med.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{med.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>🕐 {med.schedule}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>👤 {med.member}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: med.stock <= 10 ? "#d06a6a" : "var(--brand)" }}>
                  {med.stock <= 10 ? `⚠️ ${med.stock} restantes` : `${med.stock} em estoque`}
                </div>
                <button
                  onClick={() => showToast(`✅ ${med.name} registrado!`)}
                  style={{ padding: "0.4rem 0.875rem", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Tomei! ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vacinas */}
      {section === "vacinas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {vaccines.map((v) => {
            const daysToNext = Math.ceil((new Date(v.next).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={v.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80 }}>
                <span style={{ fontSize: "2rem", flexShrink: 0 }}>{v.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{v.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    👤 {v.member} · Tomada em {new Date(v.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: daysToNext <= 60 ? "#d06a6a" : "var(--brand)" }}>
                    Reforço em
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {new Date(v.next + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => showToast("✅ Vacina registrada!")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdVaccines size={20} /> Registrar nova vacina
          </button>
        </div>
      )}

      {/* Modal de novo registro */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>O que deseja registrar?</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "🏥 Nova consulta ou exame", color: "#d06a6a" },
                { label: "💊 Novo medicamento",        color: "var(--brand)" },
                { label: "💉 Nova vacina",             color: "#6a9fd4" },
              ].map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => { showToast("✅ Registro salvo!"); setAddModal(false); }}
                  style={{ width: "100%", padding: "1rem", borderRadius: 14, border: `1.5px solid ${color}`, background: "transparent", color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
