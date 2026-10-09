"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdVaccines, MdClose, MdNotifications } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "@/types";

type Section = "consultas" | "medicamentos" | "vacinas";
type RecordType = "appointment" | "exam" | "vaccine";

interface HealthRecord {
  id: string;
  family_id: string;
  member_id: string | null;
  type: RecordType;
  title: string;
  date: string;
  doctor: string | null;
  location: string | null;
  next_date: string | null;
}

interface Medication {
  id: string;
  family_id: string;
  member_id: string | null;
  name: string;
  schedule: string | null;
  stock: number;
  refill_alert: number;
}

const emojiFor: Record<RecordType, string> = { appointment: "🏥", exam: "🩸", vaccine: "💉" };

type AddKind = "consulta" | "medicamento" | "vacina" | null;

export default function SaudePage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [section, setSection] = useState<Section>("consultas");
  const [addKind, setAddKind] = useState<AddKind>(null);
  const [toast, setToast] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from("acalanto_family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();
    if (!me) { setLoading(false); return; }
    setFamilyId(me.family_id);

    const { data: memberRows } = await supabase
      .from("acalanto_family_members")
      .select("*")
      .eq("family_id", me.family_id);
    setMembers(memberRows ?? []);

    const { data: recordRows } = await supabase
      .from("acalanto_health_records")
      .select("id, family_id, member_id, type, title, date, doctor, location, next_date")
      .eq("family_id", me.family_id)
      .order("date");
    setRecords(recordRows ?? []);

    const { data: medRows } = await supabase
      .from("acalanto_medications")
      .select("id, family_id, member_id, name, schedule, stock, refill_alert")
      .eq("family_id", me.family_id)
      .eq("active", true);
    setMedications(medRows ?? []);

    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const memberName = (id: string | null) => (id && memberMap.get(id)?.name) || "Família";

  const appointments = records.filter((r) => r.type === "appointment" || r.type === "exam");
  const vaccines = records.filter((r) => r.type === "vaccine");

  const nextAppointment = appointments
    .filter((a) => new Date(a.date + "T12:00:00").getTime() >= Date.now() - 86400000)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  async function addRecord(input: { type: RecordType; title: string; memberId: string; date: string; doctor?: string; location?: string; nextDate?: string }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: HealthRecord = {
      id, family_id: familyId, member_id: input.memberId || null, type: input.type,
      title: input.title, date: input.date, doctor: input.doctor || null,
      location: input.location || null, next_date: input.nextDate || null,
    };
    setRecords((prev) => [...prev, row]);
    showToast("✅ Registro salvo!");
    setAddKind(null);
    const { error } = await supabase.from("acalanto_health_records").insert({
      id, family_id: familyId, member_id: input.memberId || null, type: input.type,
      title: input.title, date: input.date, doctor: input.doctor || null,
      location: input.location || null, next_date: input.nextDate || null,
    });
    if (error) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast("Erro ao salvar registro");
    }
  }

  async function addMedication(input: { name: string; memberId: string; schedule: string; stock: number }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: Medication = { id, family_id: familyId, member_id: input.memberId || null, name: input.name, schedule: input.schedule || null, stock: input.stock, refill_alert: 10 };
    setMedications((prev) => [...prev, row]);
    showToast("✅ Remédio adicionado!");
    setAddKind(null);
    const { error } = await supabase.from("acalanto_medications").insert({
      id, family_id: familyId, member_id: input.memberId || null, name: input.name, schedule: input.schedule || null, stock: input.stock,
    });
    if (error) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      showToast("Erro ao adicionar remédio");
    }
  }

  async function takeMedication(med: Medication) {
    const supabase = createClient();
    const next = Math.max(0, med.stock - 1);
    setMedications((prev) => prev.map((m) => m.id === med.id ? { ...m, stock: next } : m));
    showToast(`✅ ${med.name} registrado!`);
    await supabase.from("acalanto_medications").update({ stock: next }).eq("id", med.id);
  }

  const sections: { id: Section; label: string; icon: string; desc: string }[] = [
    { id: "consultas",    label: "Consultas",    icon: "🏥", desc: "Médicos e exames agendados" },
    { id: "medicamentos", label: "Remédios",      icon: "💊", desc: "O que tomar e quando" },
    { id: "vacinas",      label: "Vacinas",       icon: "💉", desc: "Carteirinha da família" },
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
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
          ❤️ Saúde da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {nextAppointment ? `Próxima consulta: ${nextAppointment.title} de ${memberName(nextAppointment.member_id)}.` : "Nenhuma consulta agendada."}
        </p>
      </div>

      {/* Alerta próxima consulta */}
      {nextAppointment && (
        <div style={{ background: "rgba(208,106,106,0.1)", border: "1.5px solid rgba(208,106,106,0.3)", borderRadius: 14, padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
          <MdNotifications size={24} color="#d06a6a" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#d06a6a" }}>{emojiFor[nextAppointment.type]} {nextAppointment.title} — {memberName(nextAppointment.member_id)}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {new Date(nextAppointment.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
              {nextAppointment.location ? ` · ${nextAppointment.location}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* Botão principal */}
      <button
        onClick={() => setAddKind("consulta")}
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
          {appointments.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Nenhuma consulta registrada ainda.</div>
          )}
          {appointments.map((appt) => {
            const daysAway = Math.ceil((new Date(appt.date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={appt.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80 }}>
                <span style={{ fontSize: "2rem", flexShrink: 0 }}>{emojiFor[appt.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{appt.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    👤 {memberName(appt.member_id)}{appt.location ? ` · ${appt.location}` : ""}
                  </div>
                  {appt.doctor && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>🩺 {appt.doctor}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {new Date(appt.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: daysAway <= 7 ? "#d06a6a" : "var(--text-muted)", fontWeight: 600 }}>
                    {daysAway <= 0 ? "Já passou" : `Em ${daysAway} dias`}
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
          {medications.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Nenhum remédio cadastrado ainda.</div>
          )}
          {medications.map((med) => (
            <div key={med.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80, borderLeft: `4px solid ${med.stock <= med.refill_alert ? "#d06a6a" : "var(--brand)"}` }}>
              <span style={{ fontSize: "2rem", flexShrink: 0 }}>💊</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{med.name}</div>
                {med.schedule && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>🕐 {med.schedule}</div>}
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>👤 {memberName(med.member_id)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: med.stock <= med.refill_alert ? "#d06a6a" : "var(--brand)" }}>
                  {med.stock <= med.refill_alert ? `⚠️ ${med.stock} restantes` : `${med.stock} em estoque`}
                </div>
                <button
                  onClick={() => takeMedication(med)}
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
          {vaccines.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Nenhuma vacina registrada ainda.</div>
          )}
          {vaccines.map((v) => {
            const daysToNext = v.next_date ? Math.ceil((new Date(v.next_date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={v.id} className="card" style={{ padding: "1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 80 }}>
                <span style={{ fontSize: "2rem", flexShrink: 0 }}>💉</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{v.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    👤 {memberName(v.member_id)} · Tomada em {new Date(v.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                </div>
                {v.next_date && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: (daysToNext ?? 999) <= 60 ? "#d06a6a" : "var(--brand)" }}>
                      Reforço em
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {new Date(v.next_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "2-digit" })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setAddKind("vacina")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdVaccines size={20} /> Registrar nova vacina
          </button>
        </div>
      )}

      {/* Modal: escolher o que registrar */}
      {addKind && (
        <AddHealthModal
          kind={addKind}
          members={members}
          onClose={() => setAddKind(null)}
          onChangeKind={setAddKind}
          onAddRecord={addRecord}
          onAddMedication={addMedication}
        />
      )}
    </div>
  );
}

function AddHealthModal({ kind, members, onClose, onChangeKind, onAddRecord, onAddMedication }: {
  kind: "consulta" | "medicamento" | "vacina";
  members: FamilyMember[];
  onClose: () => void;
  onChangeKind: (k: AddKind) => void;
  onAddRecord: (input: { type: RecordType; title: string; memberId: string; date: string; doctor?: string; location?: string; nextDate?: string }) => void;
  onAddMedication: (input: { name: string; memberId: string; schedule: string; stock: number }) => void;
}) {
  const [recordType, setRecordType] = useState<RecordType>(kind === "vacina" ? "vaccine" : "appointment");
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [doctor, setDoctor] = useState("");
  const [location, setLocation] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [schedule, setSchedule] = useState("");
  const [stock, setStock] = useState("30");

  function save() {
    if (!title.trim()) return;
    if (kind === "medicamento") {
      onAddMedication({ name: title.trim(), memberId, schedule, stock: Number(stock) || 0 });
    } else {
      onAddRecord({ type: recordType, title: title.trim(), memberId, date, doctor, location, nextDate });
    }
  }

  const titleLabel = kind === "medicamento" ? "Nome do remédio *" : kind === "vacina" ? "Nome da vacina *" : "Consulta ou exame *";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo registro</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[
            { k: "consulta" as const, label: "🏥 Consulta/exame" },
            { k: "medicamento" as const, label: "💊 Remédio" },
            { k: "vacina" as const, label: "💉 Vacina" },
          ].map(({ k, label }) => (
            <button key={k} onClick={() => onChangeKind(k)}
              style={{ flex: 1, padding: "0.5rem", borderRadius: 10, border: `1.5px solid ${kind === k ? "#d06a6a" : "var(--border)"}`, background: kind === k ? "rgba(208,106,106,0.1)" : "transparent", color: kind === k ? "#d06a6a" : "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {kind === "consulta" && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["appointment", "exam"] as RecordType[]).map((t) => (
                <button key={t} onClick={() => setRecordType(t)}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: 10, border: `1.5px solid ${recordType === t ? "#d06a6a" : "var(--border)"}`, background: recordType === t ? "rgba(208,106,106,0.1)" : "transparent", color: recordType === t ? "#d06a6a" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  {t === "appointment" ? "Consulta" : "Exame"}
                </button>
              ))}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{titleLabel}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" autoFocus />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Quem?</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {kind !== "medicamento" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  {kind === "vacina" ? "Data que tomou" : "Data"}
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
              </div>
              {kind === "vacina" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Próximo reforço</label>
                  <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input-field" />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Local</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Clínica Vida" className="input-field" />
                </div>
              )}
            </div>
          )}

          {kind === "consulta" && (
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Médico (opcional)</label>
              <input type="text" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Ex: Dr. Carlos Lima" className="input-field" />
            </div>
          )}

          {kind === "medicamento" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Horário</label>
                <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ex: 1x por dia — manhã" className="input-field" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Estoque atual</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="input-field" />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!title.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, background: "#d06a6a", opacity: title.trim() ? 1 : 0.6 }}>
              <MdAdd size={20} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
