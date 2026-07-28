"use client";
import { useState } from "react";
import { MdAdd, MdClose, MdBuild } from "react-icons/md";

const defaultVehicles = [
  { id: "1", name: "Civic 2021", brand: "Honda", plate: "ABC-1D23", color: "#1e40af", fuel: "flex", ipva: "2026-07-31", insurance: "2026-10-15", revision: "2026-09-01", emoji: "🚗" },
];

const defaultHistory = [
  { id: "1", vid: "1", date: "2026-05-10", title: "Troca de óleo", km: "52.000", cost: 280, emoji: "🛢️" },
  { id: "2", vid: "1", date: "2026-03-22", title: "Alinhamento e balanceamento", km: "50.000", cost: 150, emoji: "⚙️" },
  { id: "3", vid: "1", date: "2026-01-15", title: "Revisão 50.000 km", km: "50.000", cost: 890, emoji: "🔧" },
];

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState(defaultVehicles);
  const [history, setHistory] = useState(defaultHistory);
  const [selected, setSelected] = useState(defaultVehicles[0]);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [addMaintenanceModal, setAddMaintenanceModal] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  const alerts = [
    { label: "IPVA", date: selected.ipva, color: "#f59e0b" },
    { label: "Seguro", date: selected.insurance, color: "#3b82f6" },
    { label: "Revisão", date: selected.revision, color: "#22c55e" },
  ].map((a) => ({
    ...a,
    days: Math.ceil((new Date(a.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  }));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          🚗 Veículos da Família
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>IPVA, seguro, revisão e histórico de manutenção.</p>
      </div>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>{toast}</div>
      )}
      <button onClick={() => setAddVehicleModal(true)} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "1rem", borderRadius: 16, fontSize: "1.05rem", fontWeight: 800, marginBottom: "1.5rem" }}>
        <MdAdd size={24} /> Adicionar veículo
      </button>

      {/* Card do veículo */}
      <div
        style={{
          background: `linear-gradient(135deg, ${selected.color}, ${selected.color}99)`,
          borderRadius: "1.25rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <span style={{ fontSize: "3.5rem" }}>{selected.emoji}</span>
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: "0.2rem" }}>{selected.name}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{selected.brand} · {selected.plate}</div>
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", marginTop: "0.25rem", textTransform: "capitalize" }}>
            Combustível: {selected.fuel}
          </div>
        </div>
      </div>

      {/* Alertas */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>📅 Vencimentos importantes</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
        {alerts.map(({ label, date, color, days }) => (
          <div key={label} className="card" style={{ padding: "1.125rem", borderLeft: `4px solid ${color}`, minHeight: 90 }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color, marginBottom: "0.5rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              {new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: days <= 30 ? "#d06a6a" : "var(--text-muted)" }}>
              {days <= 0 ? "⚠️ Vencido!" : `Em ${days} dias`}
            </div>
          </div>
        ))}
      </div>

      {/* Histórico de manutenções */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>🔧 Histórico de Manutenção</h2>
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {history.filter((m) => m.vid === selected.id).map((m, i, arr) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem", borderBottom: i < arr.length - 1 ? "1px solid var(--border-light)" : "none" }}>
            <span style={{ fontSize: "1.4rem" }}>{m.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{m.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR")} · {m.km} km
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              R$ {m.cost.toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
        {history.filter((m) => m.vid === selected.id).length === 0 && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Nenhuma manutenção registrada ainda.
          </div>
        )}
      </div>

      <button onClick={() => setAddMaintenanceModal(true)} className="btn-secondary" style={{ marginTop: "1rem", width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem", fontWeight: 700 }}>
        <MdBuild size={18} /> Registrar nova manutenção
      </button>

      {addVehicleModal && <AddVehicleModal onClose={() => setAddVehicleModal(false)} onAdd={(v) => { setVehicles((p) => [...p, v]); setSelected(v); showToast(`🚗 ${v.name} adicionado!`); setAddVehicleModal(false); }} />}
      {addMaintenanceModal && <AddMaintenanceModal vid={selected.id} onClose={() => setAddMaintenanceModal(false)} onAdd={(m) => { setHistory((p) => [m, ...p]); showToast("🔧 Manutenção registrada!"); setAddMaintenanceModal(false); }} />}
    </div>
  );
}

function AddVehicleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: typeof defaultVehicles[0]) => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [plate, setPlate] = useState("");
  const [fuel, setFuel] = useState("flex");
  const [ipva, setIpva] = useState("");
  const [insurance, setInsurance] = useState("");
  const [revision, setRevision] = useState("");

  const colors = ["#1e40af", "#7aab8a", "#c99a40", "#d07a6a", "#6a4fd4"];

  function save() {
    if (!name.trim() || !plate.trim()) return;
    const next = new Date(); next.setFullYear(next.getFullYear() + 1);
    const nextStr = next.toISOString().split("T")[0];
    onAdd({
      id: Date.now().toString(), name: name.trim(), brand: brand.trim() || "Outro",
      plate: plate.trim().toUpperCase(), color: colors[Math.floor(Math.random() * colors.length)],
      fuel, emoji: "🚗",
      ipva: ipva || nextStr, insurance: insurance || nextStr, revision: revision || nextStr,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Novo Veículo</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Nome / Modelo *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Civic 2021" className="input-field" autoFocus />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Marca</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Honda" className="input-field" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Placa *</label>
              <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC-1D23" className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Combustível</label>
              <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                <option value="flex">Flex</option><option value="gasolina">Gasolina</option>
                <option value="etanol">Etanol</option><option value="diesel">Diesel</option><option value="elétrico">Elétrico</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>IPVA</label>
              <input type="date" value={ipva} onChange={(e) => setIpva(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Seguro</label>
              <input type="date" value={insurance} onChange={(e) => setInsurance(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Revisão</label>
              <input type="date" value={revision} onChange={(e) => setRevision(e.target.value)} className="input-field" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!name.trim() || !plate.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, opacity: (name.trim() && plate.trim()) ? 1 : 0.6 }}>
              <MdAdd size={20} /> Salvar veículo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMaintenanceModal({ vid, onClose, onAdd }: { vid: string; onClose: () => void; onAdd: (m: typeof defaultHistory[0]) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [km, setKm] = useState("");
  const [cost, setCost] = useState("");

  function save() {
    if (!title.trim() || !date) return;
    onAdd({ id: Date.now().toString(), vid, date, title: title.trim(), km: km || "—", cost: Number(cost) || 0, emoji: "🔧" });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Manutenção</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>O que foi feito? *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Troca de óleo, alinhamento..." className="input-field" autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Data *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>KM</label>
              <input type="text" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ex: 52.000" className="input-field" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Custo (R$)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" min="0" className="input-field" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!title.trim()} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, opacity: title.trim() ? 1 : 0.6 }}>
              <MdBuild size={20} /> Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
