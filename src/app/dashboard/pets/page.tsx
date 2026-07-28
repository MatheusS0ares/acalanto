"use client";
import { useState } from "react";
import { MdAdd, MdClose } from "react-icons/md";

type Section = "saude" | "vacinas" | "rotina";

interface Pet {
  id: string; name: string; species: string; breed: string;
  birthDate: string; weight: number; color: string; emoji: string;
  vet?: string; chip?: string;
}

const mockPets: Pet[] = [{
  id: "1", name: "Pedro", species: "Cachorro", breed: "Golden Retriever",
  birthDate: "2024-03-15", weight: 28, color: "#c99a40", emoji: "🐕",
  chip: "900250000012345", vet: "Dr. Rodrigo (Clínica Pet Vida)",
}];

const mockVaccines = [
  { id: "1", name: "V10 (Múltipla)", date: "2025-08-05", nextDate: "2026-08-05", vet: "Dr. Rodrigo" },
  { id: "2", name: "Antirrábica", date: "2025-08-05", nextDate: "2026-08-05", vet: "Dr. Rodrigo" },
  { id: "3", name: "Giardia", date: "2025-09-10", nextDate: "2026-09-10" },
];

const mockHealth = [
  { id: "1", type: "vermifugo", title: "Vermífugo mensal", date: "2026-06-01", nextDate: "2026-07-01", cost: 35, emoji: "💊" },
  { id: "2", type: "pulgas", title: "Antipulgas (Nexgard)", date: "2026-06-01", nextDate: "2026-07-01", cost: 65, emoji: "🪲" },
  { id: "3", type: "consulta", title: "Consulta de rotina", date: "2026-05-20", cost: 120, notes: "Tudo ok! Peso ideal.", emoji: "🩺" },
];

const rotina = [
  { label: "Ração diária", desc: "3x por dia — 150g cada", icon: "🍖" },
  { label: "Banho", desc: "A cada 15 dias", icon: "🛁" },
  { label: "Escovação dos dentes", desc: "3x por semana", icon: "🦷" },
  { label: "Escovação do pelo", desc: "Diária", icon: "🪮" },
  { label: "Passeio", desc: "2x por dia — manhã e tarde", icon: "🦮" },
];

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>(mockPets);
  const [selectedPet, setSelectedPet] = useState<Pet>(mockPets[0]);
  const [section, setSection] = useState<Section>("saude");
  const [addPetModal, setAddPetModal] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("Cachorro");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetBirth, setNewPetBirth] = useState("");
  const [newPetWeight, setNewPetWeight] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const petAge = (() => {
    const birth = new Date(selectedPet.birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return months < 12 ? `${months} meses` : `${Math.floor(months / 12)} anos`;
  })();

  const nextAlerts = [
    ...mockVaccines.filter((v) => v.nextDate).map((v) => ({ label: v.name, date: v.nextDate!, type: "Vacina 💉", color: "var(--brand)" })),
    ...mockHealth.filter((h) => h.nextDate).map((h) => ({ label: h.title, date: h.nextDate!, type: "Cuidado", color: "#c99a40" })),
  ].filter((a) => new Date(a.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "saude",   label: "Saúde",   icon: "🩺" },
    { id: "vacinas", label: "Vacinas", icon: "💉" },
    { id: "rotina",  label: "Rotina",  icon: "📋" },
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
            onClick={() => setSelectedPet(pet)}
            style={{
              display: "flex", alignItems: "center", gap: "0.875rem",
              padding: "1rem 1.25rem", borderRadius: 16, cursor: "pointer", flexShrink: 0,
              border: `2px solid ${selectedPet.id === pet.id ? pet.color : "var(--border)"}`,
              background: selectedPet.id === pet.id ? `${pet.color}18` : "var(--bg-card)",
            }}
          >
            <span style={{ fontSize: "2.25rem" }}>{pet.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{pet.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{pet.breed} · {petAge}</div>
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

      {/* Card do pet */}
      <div style={{ background: `linear-gradient(135deg, ${selectedPet.color}22, ${selectedPet.color}0a)`, border: `1.5px solid ${selectedPet.color}40`, borderRadius: 16, padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "4rem" }}>{selectedPet.emoji}</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{selectedPet.name}</h2>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>{selectedPet.species} · {selectedPet.breed} · {petAge}</div>
          {selectedPet.vet && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>🩺 {selectedPet.vet}</div>}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>{selectedPet.weight} kg</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Peso</div>
        </div>
      </div>

      {/* Alertas próximos */}
      {nextAlerts.length > 0 && (
        <div style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#c99a40", marginBottom: "0.875rem" }}>⚠️ Próximos cuidados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {nextAlerts.map((a, i) => {
              const days = Math.ceil((new Date(a.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
          {mockHealth.map((h) => (
            <div key={h.id} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
              <span style={{ fontSize: "1.75rem" }}>{h.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{h.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>📅 {new Date(h.date + "T12:00:00").toLocaleDateString("pt-BR")}{h.notes ? ` · ${h.notes}` : ""}</div>
                {h.nextDate && <div style={{ fontSize: "0.82rem", color: "#c99a40" }}>🔔 Próximo: {new Date(h.nextDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
              </div>
              {h.cost && <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)", flexShrink: 0 }}>R$ {h.cost}</div>}
            </div>
          ))}
          <button onClick={() => showToast("✅ Registro salvo!")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdAdd size={18} /> Novo registro de saúde
          </button>
        </div>
      )}

      {/* Vacinas */}
      {section === "vacinas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mockVaccines.map((v) => {
            const daysToNext = v.nextDate ? Math.ceil((new Date(v.nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={v.id} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
                <span style={{ fontSize: "1.75rem" }}>💉</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{v.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>✅ Aplicada em {new Date(v.date + "T12:00:00").toLocaleDateString("pt-BR")}{v.vet ? ` · ${v.vet}` : ""}</div>
                </div>
                {v.nextDate && daysToNext !== null && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: daysToNext <= 30 ? "#d06a6a" : "var(--brand)" }}>Reforço em {daysToNext}d</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{new Date(v.nextDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => showToast("✅ Vacina registrada!")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            <MdAdd size={18} /> Registrar nova vacina
          </button>
        </div>
      )}

      {/* Rotina */}
      {section === "rotina" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {rotina.map((r, i) => (
            <div key={i} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
              <span style={{ fontSize: "1.75rem" }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{r.label}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{r.desc}</div>
              </div>
            </div>
          ))}
          <button onClick={() => showToast("✅ Rotina atualizada!")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>
            Editar rotina do {selectedPet.name}
          </button>
        </div>
      )}

      {/* Modal novo pet */}
      {addPetModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddPetModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo Pet</h2>
              <button onClick={() => setAddPetModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nome do pet *</label>
                <input type="text" placeholder="Ex: Rex, Mimi, Bolinha..." className="input-field" style={{ fontSize: "1rem" }} autoFocus />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Animal</label>
                  <select value={newPetSpecies} onChange={(e) => setNewPetSpecies(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                    <option>Cachorro</option><option>Gato</option><option>Ave</option><option>Outros</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Raça</label>
                  <input type="text" value={newPetBreed} onChange={(e) => setNewPetBreed(e.target.value)} placeholder="Ex: Vira-lata" className="input-field" style={{ fontSize: "0.95rem" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Nascimento</label>
                  <input type="date" value={newPetBirth} onChange={(e) => setNewPetBirth(e.target.value)} className="input-field" style={{ fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Peso (kg)</label>
                  <input type="number" value={newPetWeight} onChange={(e) => setNewPetWeight(e.target.value)} placeholder="0.0" step="0.1" min="0" className="input-field" style={{ fontSize: "0.95rem" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setAddPetModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem" }}>Cancelar</button>
                <button
                  disabled={!newPetName.trim()}
                  onClick={() => {
                    const emojiMap: Record<string, string> = { Cachorro: "🐕", Gato: "🐈", Ave: "🦜", Outros: "🐾" };
                    const colors = ["#c99a40", "#6a9fd4", "#a07ac0", "#d07a6a", "#7aab8a"];
                    const newPet: Pet = {
                      id: Date.now().toString(), name: newPetName.trim(), species: newPetSpecies,
                      breed: newPetBreed || "Sem raça definida", birthDate: newPetBirth || new Date().toISOString().split("T")[0],
                      weight: Number(newPetWeight) || 0, color: colors[pets.length % colors.length],
                      emoji: emojiMap[newPetSpecies] ?? "🐾",
                    };
                    setPets((prev) => [...prev, newPet]);
                    setSelectedPet(newPet);
                    showToast(`🐾 ${newPetName.trim()} cadastrado!`);
                    setNewPetName(""); setNewPetSpecies("Cachorro"); setNewPetBreed(""); setNewPetBirth(""); setNewPetWeight("");
                    setAddPetModal(false);
                  }}
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontSize: "1rem", fontWeight: 800, opacity: newPetName.trim() ? 1 : 0.6 }}
                >
                  <MdAdd size={20} /> Cadastrar pet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
