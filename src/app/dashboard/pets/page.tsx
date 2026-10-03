"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

type Section = "saude" | "vacinas" | "rotina";
type HealthType = "consulta" | "vermifugo" | "pulgas" | "exame" | "outros";

interface PetRow {
  id: string;
  family_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  color: string;
  emoji: string;
  vet: string | null;
}

interface VaccineRow {
  id: string;
  pet_id: string;
  name: string;
  date: string;
  next_date: string | null;
  vet: string | null;
}

interface HealthRow {
  id: string;
  pet_id: string;
  type: HealthType;
  title: string;
  date: string;
  next_date: string | null;
  cost: number | null;
  notes: string | null;
}

const healthEmoji: Record<HealthType, string> = { consulta: "🩺", vermifugo: "💊", pulgas: "🪲", exame: "🔬", outros: "📋" };

const rotina = [
  { label: "Ração diária", desc: "3x por dia — 150g cada", icon: "🍖" },
  { label: "Banho", desc: "A cada 15 dias", icon: "🛁" },
  { label: "Escovação dos dentes", desc: "3x por semana", icon: "🦷" },
  { label: "Escovação do pelo", desc: "Diária", icon: "🪮" },
  { label: "Passeio", desc: "2x por dia — manhã e tarde", icon: "🦮" },
];

const speciesEmoji: Record<string, string> = { Cachorro: "🐕", Gato: "🐈", Ave: "🦜", Outros: "🐾" };
const petColors = ["#c99a40", "#6a9fd4", "#a07ac0", "#d07a6a", "#7aab8a"];

export default function PetsPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [pets, setPets] = useState<PetRow[]>([]);
  const [vaccines, setVaccines] = useState<VaccineRow[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [section, setSection] = useState<Section>("saude");
  const [addPetModal, setAddPetModal] = useState(false);
  const [addHealthModal, setAddHealthModal] = useState(false);
  const [addVaccineModal, setAddVaccineModal] = useState(false);
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

    const { data: petRows } = await supabase
      .from("acalanto_pets")
      .select("id, family_id, name, species, breed, birth_date, weight, color, emoji, vet")
      .eq("family_id", me.family_id)
      .order("created_at");
    const ps = petRows ?? [];
    setPets(ps);
    if (ps.length > 0) setSelectedId(ps[0].id);

    if (ps.length > 0) {
      const petIds = ps.map((p) => p.id);
      const [{ data: vaccineRows }, { data: healthRows }] = await Promise.all([
        supabase.from("acalanto_pet_vaccines").select("id, pet_id, name, date, next_date, vet").in("pet_id", petIds),
        supabase.from("acalanto_pet_health_records").select("id, pet_id, type, title, date, next_date, cost, notes").in("pet_id", petIds),
      ]);
      setVaccines(vaccineRows ?? []);
      setHealthRecords(healthRows ?? []);
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const selectedPet = pets.find((p) => p.id === selectedId) ?? null;
  const petVaccines = vaccines.filter((v) => v.pet_id === selectedId);
  const petHealth = healthRecords.filter((h) => h.pet_id === selectedId);

  const petAge = selectedPet?.birth_date ? (() => {
    const birth = new Date(selectedPet.birth_date!);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months < 12 ? `${months} meses` : `${Math.floor(months / 12)} anos`;
  })() : "idade não informada";

  const nextAlerts = [
    ...petVaccines.filter((v) => v.next_date).map((v) => ({ label: v.name, date: v.next_date!, type: "Vacina 💉", color: "var(--brand)" })),
    ...petHealth.filter((h) => h.next_date).map((h) => ({ label: h.title, date: h.next_date!, type: "Cuidado", color: "#c99a40" })),
  ].filter((a) => new Date(a.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "saude",   label: "Saúde",   icon: "🩺" },
    { id: "vacinas", label: "Vacinas", icon: "💉" },
    { id: "rotina",  label: "Rotina",  icon: "📋" },
  ];

  async function addPet(input: { name: string; species: string; breed: string; birthDate: string; weight: string }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: PetRow = {
      id, family_id: familyId, name: input.name, species: input.species,
      breed: input.breed || null, birth_date: input.birthDate || null,
      weight: Number(input.weight) || null, color: petColors[pets.length % petColors.length],
      emoji: speciesEmoji[input.species] ?? "🐾", vet: null,
    };
    setPets((prev) => [...prev, row]);
    setSelectedId(id);
    showToast(`🐾 ${input.name} cadastrado!`);
    setAddPetModal(false);
    const { error } = await supabase.from("acalanto_pets").insert({
      id, family_id: familyId, name: input.name, species: input.species,
      breed: input.breed || null, birth_date: input.birthDate || null,
      weight: Number(input.weight) || null, color: row.color, emoji: row.emoji,
    });
    if (error) {
      setPets((prev) => prev.filter((p) => p.id !== id));
      showToast("Erro ao cadastrar pet");
    }
  }

  async function addHealthRecord(input: { type: HealthType; title: string; date: string; nextDate: string; cost: string }) {
    if (!selectedPet) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: HealthRow = {
      id, pet_id: selectedPet.id, type: input.type, title: input.title, date: input.date,
      next_date: input.nextDate || null, cost: Number(input.cost) || null, notes: null,
    };
    setHealthRecords((prev) => [...prev, row]);
    showToast("✅ Registro salvo!");
    setAddHealthModal(false);
    const { error } = await supabase.from("acalanto_pet_health_records").insert({
      id, pet_id: selectedPet.id, type: input.type, title: input.title, date: input.date,
      next_date: input.nextDate || null, cost: Number(input.cost) || null,
    });
    if (error) setHealthRecords((prev) => prev.filter((h) => h.id !== id));
  }

  async function addVaccine(input: { name: string; date: string; nextDate: string }) {
    if (!selectedPet) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: VaccineRow = { id, pet_id: selectedPet.id, name: input.name, date: input.date, next_date: input.nextDate || null, vet: null };
    setVaccines((prev) => [...prev, row]);
    showToast("✅ Vacina registrada!");
    setAddVaccineModal(false);
    const { error } = await supabase.from("acalanto_pet_vaccines").insert({
      id, pet_id: selectedPet.id, name: input.name, date: input.date, next_date: input.nextDate || null,
    });
    if (error) setVaccines((prev) => prev.filter((v) => v.id !== id));
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
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          🐾 Pets da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Saúde, vacinas e rotina dos seus animais.
        </p>
      </div>

      {/* Seletor de pets */}
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => setSelectedId(pet.id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.875rem",
              padding: "1rem 1.25rem", borderRadius: 16, cursor: "pointer", flexShrink: 0,
              border: `2px solid ${selectedId === pet.id ? pet.color : "var(--border)"}`,
              background: selectedId === pet.id ? `${pet.color}18` : "var(--bg-card)",
            }}
          >
            <span style={{ fontSize: "2.25rem" }}>{pet.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{pet.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{pet.breed}</div>
            </div>
          </button>
        ))}
        <button
          onClick={() => setAddPetModal(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem 1.25rem", border: "2px dashed var(--border)", borderRadius: 16, background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, flexShrink: 0, minWidth: 120 }}
        >
          <MdAdd size={20} /> Novo pet
        </button>
      </div>

      {!selectedPet && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          Nenhum pet cadastrado ainda.
        </div>
      )}

      {selectedPet && (
      <>
      {/* Card do pet */}
      <div style={{ background: `linear-gradient(135deg, ${selectedPet.color}22, ${selectedPet.color}0a)`, border: `1.5px solid ${selectedPet.color}40`, borderRadius: 16, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "4rem" }}>{selectedPet.emoji}</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{selectedPet.name}</h2>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>{selectedPet.species} · {selectedPet.breed} · {petAge}</div>
          {selectedPet.vet && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>🩺 {selectedPet.vet}</div>}
        </div>
        {selectedPet.weight && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>{selectedPet.weight} kg</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Peso</div>
          </div>
        )}
      </div>

      {/* Alertas próximos */}
      {nextAlerts.length > 0 && (
        <div style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#c99a40", marginBottom: "0.875rem" }}>⚠️ Próximos cuidados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {nextAlerts.map((a, i) => {
              const days = Math.ceil((new Date(a.date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="card" style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: `4px solid ${a.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{a.label}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{a.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: days <= 7 ? "#d06a6a" : "var(--text-muted)" }}>Em {days} dias</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(a.date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seletor de seção */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", marginBottom: "1.5rem" }}>
        {sections.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setSection(id)}
            style={{ padding: "0.875rem", borderRadius: 14, border: `2px solid ${section === id ? selectedPet.color : "var(--border)"}`, background: section === id ? `${selectedPet.color}12` : "var(--bg-card)", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", color: section === id ? selectedPet.color : "var(--text-secondary)" }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Saúde */}
      {section === "saude" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {petHealth.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Nenhum registro de saúde ainda.</div>
          )}
          {petHealth.map((h) => (
            <div key={h.id} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
              <span style={{ fontSize: "1.75rem" }}>{healthEmoji[h.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{h.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>📅 {new Date(h.date + "T12:00:00").toLocaleDateString("pt-BR")}{h.notes ? ` · ${h.notes}` : ""}</div>
                {h.next_date && <div style={{ fontSize: "0.82rem", color: "#c99a40" }}>🔔 Próximo: {new Date(h.next_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
              </div>
              {h.cost != null && <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)", flexShrink: 0 }}>R$ {h.cost}</div>}
            </div>
          ))}
          <button onClick={() => setAddHealthModal(true)} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdAdd size={18} /> Novo registro de saúde
          </button>
        </div>
      )}

      {/* Vacinas */}
      {section === "vacinas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {petVaccines.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Nenhuma vacina registrada ainda.</div>
          )}
          {petVaccines.map((v) => {
            const daysToNext = v.next_date ? Math.ceil((new Date(v.next_date + "T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={v.id} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
                <span style={{ fontSize: "1.75rem" }}>💉</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{v.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>✅ Aplicada em {new Date(v.date + "T12:00:00").toLocaleDateString("pt-BR")}{v.vet ? ` · ${v.vet}` : ""}</div>
                </div>
                {v.next_date && daysToNext !== null && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: daysToNext <= 30 ? "#d06a6a" : "var(--brand)" }}>Reforço em {daysToNext}d</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(v.next_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setAddVaccineModal(true)} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdAdd size={18} /> Registrar nova vacina
          </button>
        </div>
      )}

      {/* Rotina */}
      {section === "rotina" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Sugestão geral de cuidados — ainda não personalizável por pet.</p>
          {rotina.map((r, i) => (
            <div key={i} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
              <span style={{ fontSize: "1.75rem" }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{r.label}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Modal novo pet */}
      {addPetModal && <AddPetModal onClose={() => setAddPetModal(false)} onAdd={addPet} />}
      {addHealthModal && selectedPet && <AddHealthModal onClose={() => setAddHealthModal(false)} onAdd={addHealthRecord} />}
      {addVaccineModal && selectedPet && <AddVaccineModal onClose={() => setAddVaccineModal(false)} onAdd={addVaccine} />}
    </div>
  );
}

function AddPetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: { name: string; species: string; breed: string; birthDate: string; weight: string }) => void }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cachorro");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");

  function save() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), species, breed, birthDate, weight });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo Pet</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nome do pet *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Rex, Mimi, Bolinha..." className="input-field" style={{ fontSize: "1rem" }} autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Animal</label>
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                <option>Cachorro</option><option>Gato</option><option>Ave</option><option>Outros</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Raça</label>
              <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Ex: Vira-lata" className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nascimento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Peso (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" step="0.1" min="0" className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
            <button onClick={save} disabled={!name.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800, opacity: name.trim() ? 1 : 0.6 }}>
              <MdAdd size={20} /> Cadastrar pet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddHealthModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: { type: HealthType; title: string; date: string; nextDate: string; cost: string }) => void }) {
  const [type, setType] = useState<HealthType>("consulta");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDate, setNextDate] = useState("");
  const [cost, setCost] = useState("");

  function save() {
    if (!title.trim()) return;
    onAdd({ type, title: title.trim(), date, nextDate, cost });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo registro de saúde</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as HealthType)} className="input-field" style={{ cursor: "pointer" }}>
              <option value="consulta">Consulta</option>
              <option value="vermifugo">Vermífugo</option>
              <option value="pulgas">Antipulgas</option>
              <option value="exame">Exame</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Título *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Consulta de rotina" className="input-field" autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Próximo (opcional)</label>
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Custo (R$)</label>
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" min="0" className="input-field" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!title.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, opacity: title.trim() ? 1 : 0.6 }}>
              <MdAdd size={20} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVaccineModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: { name: string; date: string; nextDate: string }) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDate, setNextDate] = useState("");

  function save() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), date, nextDate });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Vacina</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nome da vacina *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: V10, Antirrábica..." className="input-field" autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Data que tomou</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Próximo reforço</label>
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!name.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, opacity: name.trim() ? 1 : 0.6 }}>
              <MdAdd size={20} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
