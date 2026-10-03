"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdCheck } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

type ItemStatus = "pending" | "approved" | "done";
type ReformStatus = "planning" | "executing" | "done";

interface ReformRow {
  id: string;
  family_id: string;
  name: string;
  room: string | null;
  emoji: string;
  budget: number;
  status: ReformStatus;
}

interface ReformItemRow {
  id: string;
  reform_id: string;
  description: string;
  category: string | null;
  supplier: string | null;
  budgeted: number;
  actual: number | null;
  status: ItemStatus;
}

const statusConfig: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "var(--text-muted)", bg: "var(--bg-secondary)" },
  approved: { label: "Aprovado", color: "#60a5fa", bg: "rgba(59,130,246,0.1)" },
  done: { label: "Concluído", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};

const roomEmojis: Record<string, string> = { Sala: "🛋️", Cozinha: "🍳", Banheiro: "🚿", Quarto: "🛏️", Varanda: "🌿", Garagem: "🚗", Outros: "🔨" };

export default function ReformasPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [reforms, setReforms] = useState<ReformRow[]>([]);
  const [items, setItems] = useState<ReformItemRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [addItemModal, setAddItemModal] = useState(false);
  const [addReformModal, setAddReformModal] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemBudget, setNewItemBudget] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Outros");

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

    const { data: reformRows } = await supabase
      .from("acalanto_reforms")
      .select("id, family_id, name, room, emoji, budget, status")
      .eq("family_id", me.family_id)
      .order("created_at");
    const rs = reformRows ?? [];
    setReforms(rs);
    if (rs.length > 0) setSelectedId(rs[0].id);

    if (rs.length > 0) {
      const { data: itemRows } = await supabase
        .from("acalanto_reform_items")
        .select("id, reform_id, description, category, supplier, budgeted, actual, status")
        .in("reform_id", rs.map((r) => r.id));
      setItems(itemRows ?? []);
    }
    setLoading(false);
  }

  const current = reforms.find((r) => r.id === selectedId) ?? null;
  const currentItems = items.filter((i) => i.reform_id === selectedId);
  const totalBudgeted = currentItems.reduce((s, i) => s + i.budgeted, 0);
  const totalActual = currentItems.reduce((s, i) => s + (i.actual ?? 0), 0);
  const totalDonePct = currentItems.length > 0
    ? (currentItems.filter((i) => i.status === "done").length / currentItems.length) * 100
    : 0;
  const overBudget = current ? totalActual > totalBudgeted : false;

  async function advanceStatus(item: ReformItemRow) {
    const supabase = createClient();
    const next: ItemStatus = item.status === "pending" ? "approved" : "done";
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i));
    await supabase.from("acalanto_reform_items").update({ status: next }).eq("id", item.id);
  }

  async function addItem() {
    if (!newItemDesc || !newItemBudget || !current) return;
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: ReformItemRow = {
      id, reform_id: current.id, description: newItemDesc, category: newItemCategory,
      supplier: null, budgeted: Number(newItemBudget), actual: null, status: "pending",
    };
    setItems((prev) => [...prev, row]);
    setNewItemDesc(""); setNewItemBudget("");
    setAddItemModal(false);
    const { error } = await supabase.from("acalanto_reform_items").insert({
      id, reform_id: current.id, description: newItemDesc, category: newItemCategory,
      budgeted: Number(newItemBudget), status: "pending",
    });
    if (error) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function addReform(input: { name: string; room: string; budget: number }) {
    const supabase = createClient();
    const id = crypto.randomUUID();
    const row: ReformRow = { id, family_id: familyId, name: input.name, room: input.room, emoji: roomEmojis[input.room] ?? "🔨", budget: input.budget, status: "planning" };
    setReforms((prev) => [...prev, row]);
    setSelectedId(id);
    setAddReformModal(false);
    const { error } = await supabase.from("acalanto_reforms").insert({
      id, family_id: familyId, name: input.name, room: input.room, emoji: row.emoji, budget: input.budget, status: "planning",
    });
    if (error) setReforms((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          🔨 Obras e Reformas
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Acompanhe o orçamento e andamento das obras da casa.</p>
      </div>
      <button onClick={() => setAddReformModal(true)} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "1rem", borderRadius: 16, fontSize: "1.05rem", fontWeight: 800, marginBottom: "1.5rem" }}>
        <MdAdd size={24} /> Adicionar nova obra
      </button>

      {!current && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          Nenhuma obra cadastrada ainda. Adicione a primeira acima 👆
        </div>
      )}

      {current && (
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.5rem" }} className="reform-grid">
        {/* Lista de obras */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {reforms.map((r) => {
              const spent = items.filter((i) => i.reform_id === r.id).reduce((s, i) => s + (i.actual ?? 0), 0);
              const pct = Math.min((spent / r.budget) * 100, 100);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.875rem 1rem",
                    background: selectedId === r.id ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
                    border: `1px solid ${selectedId === r.id ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{r.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: "0.4rem", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct > 95 ? "#ef4444" : "#22c55e", borderRadius: 2 }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe */}
        <div>
          {/* Resumo financeiro */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Orçamento", value: `R$ ${current.budget.toLocaleString("pt-BR")}`, color: "var(--text-primary)" },
              { label: "Previsto nos itens", value: `R$ ${totalBudgeted.toLocaleString("pt-BR")}`, color: totalBudgeted > current.budget ? "#f87171" : "var(--text-primary)" },
              { label: "Gasto até agora", value: `R$ ${totalActual.toLocaleString("pt-BR")}`, color: overBudget ? "#f87171" : "#22c55e" },
              { label: "Progresso", value: `${totalDonePct.toFixed(0)}%`, color: "#22c55e" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>{label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Itens */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Itens ({currentItems.length})</h3>
            <button onClick={() => setAddItemModal(true)} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
              <MdAdd size={14} /> Adicionar item
            </button>
          </div>

          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            {currentItems.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Nenhum item cadastrado ainda.
              </div>
            )}
            {currentItems.map((item, i) => {
              const cfg = statusConfig[item.status];
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    borderBottom: i < currentItems.length - 1 ? "1px solid var(--border-light)" : "none",
                  }}
                >
                  <button
                    onClick={() => advanceStatus(item)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      border: item.status === "done" ? "none" : "2px solid var(--border)",
                      background: item.status === "done" ? "#22c55e" : "transparent",
                      cursor: item.status === "done" ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    {item.status === "done" && <MdCheck size={14} color="white" />}
                    {item.status === "approved" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa" }} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem", textDecoration: item.status === "done" ? "line-through" : "none" }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {item.category}{item.supplier ? ` · ${item.supplier}` : ""}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: item.actual && item.actual > item.budgeted ? "#f87171" : "var(--text-primary)" }}>
                      {item.actual ? `R$ ${item.actual.toLocaleString("pt-BR")}` : `~R$ ${item.budgeted.toLocaleString("pt-BR")}`}
                    </div>
                    {item.actual && item.actual !== item.budgeted && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        orç. R$ {item.budgeted.toLocaleString("pt-BR")}
                      </div>
                    )}
                  </div>

                  <span style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {addItemModal && current && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setAddItemModal(false)}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Novo Item</h2>
              <button onClick={() => setAddItemModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} placeholder="Descrição do item" className="input-field" autoFocus />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Categoria</label>
                  <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    {["Marcenaria", "Piso/Revestimento", "Hidráulica", "Elétrica", "Pintura", "Vidraçaria", "Gesso", "Outros"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Orçamento (R$)</label>
                  <input type="number" value={newItemBudget} onChange={(e) => setNewItemBudget(e.target.value)} placeholder="0,00" min="0" step="0.01" className="input-field" />
                </div>
              </div>
              <button onClick={addItem} disabled={!newItemDesc || !newItemBudget} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                <MdAdd size={18} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {addReformModal && <AddReformModal onClose={() => setAddReformModal(false)} onAdd={addReform} />}

      <style>{`
        @media (max-width: 700px) {
          .reform-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function AddReformModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: { name: string; room: string; budget: number }) => void }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("Sala");
  const [budget, setBudget] = useState("");

  function save() {
    if (!name.trim() || !budget) return;
    onAdd({ name: name.trim(), room, budget: Number(budget) });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Nova Obra</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}><MdClose size={22} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Nome da obra *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reforma da Cozinha" className="input-field" autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Cômodo</label>
              <select value={room} onChange={(e) => setRoom(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                {Object.keys(roomEmojis).map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Orçamento (R$) *</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0,00" min="0" className="input-field" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "0.875rem" }}>Cancelar</button>
            <button onClick={save} disabled={!name.trim() || !budget} className="btn-primary" style={{ flex: 2, justifyContent: "center", padding: "0.875rem", fontWeight: 800, opacity: (name.trim() && budget) ? 1 : 0.6 }}>
              <MdAdd size={20} /> Criar obra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
