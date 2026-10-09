"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdBuild } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

type FuelType = "gasoline" | "ethanol" | "diesel" | "electric" | "hybrid" | "flex";

interface VehicleRow {
  id: string;
  family_id: string;
  name: string;
  brand: string | null;
  plate: string | null;
  color: string;
  fuel_type: FuelType | null;
  ipva_due: string | null;
  insurance_due: string | null;
  next_revision: string | null;
}

interface MaintenanceRow {
  id: string;
  vehicle_id: string;
  title: string;
  date: string;
  km: number | null;
  cost: number | null;
}

const fuelLabel: Record<FuelType, string> = {
  gasoline: "Gasolina", ethanol: "Etanol", diesel: "Diesel",
  electric: "Elétrico", hybrid: "Híbrido", flex: "Flex",
};

const colors = ["#1e40af", "#7aab8a", "#c99a40", "#d07a6a", "#6a4fd4"];

export default function VeiculosPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [history, setHistory] = useState<MaintenanceRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [addMaintenanceModal, setAddMaintenanceModal] = useState(false);
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

    const { data: vehicleRows } = await supabase
      .from("acalanto_vehicles")
      .select("id, family_id, name, brand, plate, color, fuel_type, ipva_due, insurance_due, next_revision")
      .eq("family_id", me.family_id)
      .order("created_at");
    const vs = vehicleRows ?? [];
    setVehicles(vs);
    if (vs.length > 0) setSelectedId(vs[0].id);

    if (vs.length > 0) {
      const { data: maintRows } = await supabase
        .from("acalanto_vehicle_maintenances")
        .select("id, vehicle_id, title, date, km, cost")
        .in("vehicle_id", vs.map((v) => v.id))
        .order("date", { ascending: false });
      setHistory(maintRows ?? []);
    }
    setLoading(false);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  const alerts = selected ? [
    { label: "IPVA", date: selected.ipva_due, color: "#f59e0b" },
    { label: "Seguro", date: selected.insurance_due, color: "#3b82f6" },
    { label: "Revisão", date: selected.next_revision, color: "#22c55e" },
  ]
    .filter((a): a is { label: string; date: string; color: string } => !!a.date)
    .map((a) => ({
      ...a,
      days: Math.ceil((new Date(a.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    })) : [];

  async function addVehicle(input: { name: string; brand: string; plate: string; fuel: FuelType; ipva: string; insurance: string; revision: string }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: VehicleRow = {
      id, family_id: familyId, name: input.name, brand: input.brand || null,
      plate: input.plate || null, color: colors[Math.floor(Math.random() * colors.length)],
      fuel_type: input.fuel, ipva_due: input.ipva || null,
      insurance_due: input.insurance || null, next_revision: input.revision || null,
    };
    setVehicles((prev) => [...prev, row]);
    setSelectedId(id);
    showToast(`🚗 ${input.name} adicionado!`);
    setAddVehicleModal(false);
    const { error } = await supabase.from("acalanto_vehicles").insert({
      id, family_id: familyId, name: input.name, brand: input.brand || null,
      plate: input.plate || null, color: row.color, fuel_type: input.fuel,
      ipva_due: input.ipva || null, insurance_due: input.insurance || null, next_revision: input.revision || null,
    });
    if (error) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      showToast("Erro ao adicionar veículo");
    }
  }

  async function addMaintenance(input: { title: string; date: string; km: string; cost: string }) {
    if (!selected) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const km = input.km ? Number(input.km.replace(/\D/g, "")) : null;
    const cost = Number(input.cost) || 0;
    const row: MaintenanceRow = { id, vehicle_id: selected.id, title: input.title, date: input.date, km, cost };
    setHistory((prev) => [row, ...prev]);
    showToast("🔧 Manutenção registrada!");
    setAddMaintenanceModal(false);
    const { error } = await supabase.from("acalanto_vehicle_maintenances").insert({
      id, vehicle_id: selected.id, title: input.title, date: input.date, km, cost,
    });
    if (error) {
      setHistory((prev) => prev.filter((m) => m.id !== id));
      showToast("Erro ao registrar manutenção");
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

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

      {!selected && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          Nenhum veículo ainda. Adicione o primeiro acima 👆
        </div>
      )}

      {vehicles.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.25rem" }}>
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "9999px", whiteSpace: "nowrap",
                border: `1.5px solid ${selectedId === v.id ? "var(--brand)" : "var(--border)"}`,
                background: selectedId === v.id ? "var(--brand-bg)" : "transparent",
                color: selectedId === v.id ? "var(--brand)" : "var(--text-muted)",
                fontWeight: selectedId === v.id ? 700 : 500, cursor: "pointer", fontSize: "0.9rem",
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {selected && (
      <>
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
        <span style={{ fontSize: "3.5rem" }}>🚗</span>
        <div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: "0.2rem" }}>{selected.name}</div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{selected.brand} · {selected.plate}</div>
          {selected.fuel_type && (
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", marginTop: "0.25rem" }}>
              Combustível: {fuelLabel[selected.fuel_type]}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <>
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
        </>
      )}

      {/* Histórico de manutenções */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>🔧 Histórico de Manutenção</h2>
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        {history.filter((m) => m.vehicle_id === selected.id).map((m, i, arr) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem", borderBottom: i < arr.length - 1 ? "1px solid var(--border-light)" : "none" }}>
            <span style={{ fontSize: "1.4rem" }}>🔧</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{m.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR")}{m.km ? ` · ${m.km.toLocaleString("pt-BR")} km` : ""}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              R$ {(m.cost ?? 0).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
        {history.filter((m) => m.vehicle_id === selected.id).length === 0 && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Nenhuma manutenção registrada ainda.
          </div>
        )}
      </div>

      <button onClick={() => setAddMaintenanceModal(true)} className="btn-secondary" style={{ marginTop: "1rem", width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem", fontWeight: 700 }}>
        <MdBuild size={18} /> Registrar nova manutenção
      </button>
      </>
      )}

      {addVehicleModal && <AddVehicleModal onClose={() => setAddVehicleModal(false)} onAdd={addVehicle} />}
      {addMaintenanceModal && selected && <AddMaintenanceModal onClose={() => setAddMaintenanceModal(false)} onAdd={addMaintenance} />}
    </div>
  );
}

function AddVehicleModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: { name: string; brand: string; plate: string; fuel: FuelType; ipva: string; insurance: string; revision: string }) => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [plate, setPlate] = useState("");
  const [fuel, setFuel] = useState<FuelType>("flex");
  const [ipva, setIpva] = useState("");
  const [insurance, setInsurance] = useState("");
  const [revision, setRevision] = useState("");

  function save() {
    if (!name.trim() || !plate.trim()) return;
    onAdd({ name: name.trim(), brand: brand.trim(), plate: plate.trim().toUpperCase(), fuel, ipva, insurance, revision });
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
              <select value={fuel} onChange={(e) => setFuel(e.target.value as FuelType)} className="input-field" style={{ cursor: "pointer" }}>
                <option value="flex">Flex</option><option value="gasoline">Gasolina</option>
                <option value="ethanol">Etanol</option><option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option><option value="hybrid">Híbrido</option>
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

function AddMaintenanceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: { title: string; date: string; km: string; cost: string }) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [km, setKm] = useState("");
  const [cost, setCost] = useState("");

  function save() {
    if (!title.trim() || !date) return;
    onAdd({ title: title.trim(), date, km, cost });
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
              <input type="text" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ex: 52000" className="input-field" />
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
