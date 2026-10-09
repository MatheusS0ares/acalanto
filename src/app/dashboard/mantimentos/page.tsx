"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdWarning, MdCheckCircle, MdShoppingCart } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

const categories = ["Todos", "Grãos", "Laticínios", "Carnes", "Higiene", "Limpeza", "Bebidas", "Outros"];
const units = ["unid", "kg", "g", "L", "ml", "rolo", "cx", "pct"];

interface PantryItemRow {
  id: string;
  family_id: string;
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  emoji: string;
}

export default function MantimentosPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<PantryItemRow[]>([]);
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

    const { data: rows } = await supabase
      .from("acalanto_pantry_items")
      .select("id, family_id, name, category, unit, current_quantity, min_quantity, emoji")
      .eq("family_id", me.family_id)
      .order("name");
    setItems(rows ?? []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = items.filter((item) =>
    categoryFilter === "Todos" || item.category === categoryFilter
  );

  const low = filtered.filter((i) => i.current_quantity < i.min_quantity);
  const ok = filtered.filter((i) => i.current_quantity >= i.min_quantity);

  async function handleAddToList(item: PantryItemRow) {
    const supabase = createClient();
    let { data: list } = await supabase
      .from("acalanto_shopping_lists")
      .select("id")
      .eq("family_id", familyId)
      .eq("status", "open")
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (!list) {
      const listId = crypto.randomUUID();
      const { error } = await supabase
        .from("acalanto_shopping_lists")
        .insert({ id: listId, family_id: familyId, name: "Nossa lista", created_by: memberId });
      if (error) { showToast("Erro ao criar a lista de compras"); return; }
      list = { id: listId };
    }

    const qty = Math.max(item.min_quantity - item.current_quantity, 1);
    const { error } = await supabase.from("acalanto_shopping_items").insert({
      id: crypto.randomUUID(), list_id: list.id, name: item.name,
      quantity: qty, unit: item.unit, category: item.category, emoji: item.emoji,
    });
    if (error) { showToast("Erro ao adicionar à lista"); return; }
    showToast(`🛒 "${item.name}" adicionado à lista de compras!`);
  }

  async function handleQtyChange(item: PantryItemRow, delta: number) {
    const supabase = createClient();
    const next = Math.max(0, item.current_quantity + delta);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, current_quantity: next } : i));
    await supabase.from("acalanto_pantry_items").update({ current_quantity: next }).eq("id", item.id);
  }

  async function handleAdd(input: { name: string; category: string; unit: string; current: number; min: number }) {
    const supabase = createClient();
    const emojis: Record<string, string> = { Grãos: "🌾", Laticínios: "🥛", Carnes: "🥩", Higiene: "🧴", Limpeza: "🧹", Bebidas: "🧃", Outros: "📦" };
    const emoji = emojis[input.category] ?? "📦";
    const id = crypto.randomUUID();
    const row: PantryItemRow = {
      id, family_id: familyId, name: input.name, category: input.category,
      unit: input.unit, current_quantity: input.current, min_quantity: input.min, emoji,
    };
    setItems((prev) => [...prev, row]);
    showToast(`✅ "${input.name}" adicionado à dispensa!`);
    setShowModal(false);
    const { error } = await supabase.from("acalanto_pantry_items").insert({
      id, family_id: familyId, name: input.name, category: input.category,
      unit: input.unit, current_quantity: input.current, min_quantity: input.min,
      emoji, added_by: memberId,
    });
    if (error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Erro ao adicionar item");
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
          🏠 Dispensa da Casa
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Veja o que está em falta e atualize as quantidades.
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: "100%", padding: "1rem 1.25rem",
          borderRadius: 16, border: "none", cursor: "pointer",
          background: "var(--brand)", color: "#fff",
          fontSize: "1.05rem", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
          boxShadow: "0 4px 16px rgba(122,171,138,0.4)",
          marginBottom: "1.5rem",
        }}
      >
        <MdAdd size={24} /> Adicionar novo item à dispensa
      </button>

      {/* Filtro de categoria */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: `1.5px solid ${categoryFilter === cat ? "var(--brand)" : "var(--border)"}`,
              background: categoryFilter === cat ? "var(--brand-bg)" : "transparent",
              color: categoryFilter === cat ? "var(--brand)" : "var(--text-muted)",
              fontSize: "0.875rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: categoryFilter === cat ? 700 : 500,
              minHeight: 40,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          Nenhum item na dispensa ainda. Adicione o primeiro acima 👆
        </div>
      )}

      {/* Em falta */}
      {low.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MdWarning size={22} color="#d97706" />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#d97706" }}>
              ⚠️ Em falta ou quase acabando ({low.length})
            </h2>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.875rem" }}>
            Toque em "Adicionar à lista de compras" para incluir esses itens na próxima compra.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {low.map((item) => (
              <PantryItem
                key={item.id}
                item={item}
                variant="low"
                onQtyChange={(d) => handleQtyChange(item, d)}
                onAddToList={() => handleAddToList(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estoque ok */}
      {ok.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MdCheckCircle size={22} color="var(--brand)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              ✅ Estoque em ordem ({ok.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {ok.map((item) => (
              <PantryItem
                key={item.id}
                item={item}
                variant="ok"
                onQtyChange={(d) => handleQtyChange(item, d)}
                onAddToList={() => handleAddToList(item)}
              />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddPantryItemModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

interface PantryItemProps {
  item: PantryItemRow;
  onAddToList: () => void;
  onQtyChange: (delta: number) => void;
  variant: "low" | "ok";
}

function PantryItem({ item, onAddToList, onQtyChange, variant }: PantryItemProps) {
  const pct = Math.min((item.current_quantity / item.min_quantity) * 100, 100);

  return (
    <div
      className="card"
      style={{
        padding: "1rem 1.125rem",
        borderColor: variant === "low" ? "rgba(217,119,6,0.3)" : undefined,
        background: variant === "low" ? "rgba(217,119,6,0.04)" : undefined,
      }}
    >
      {/* Linha principal */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{item.emoji}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            {item.name}
          </div>
          <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
            {item.category} · mínimo: {item.min_quantity} {item.unit}
          </div>
        </div>

        {/* Quantidade */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <button
            onClick={() => onQtyChange(-1)}
            aria-label="Diminuir quantidade"
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: "var(--bg-secondary)", border: "1.5px solid var(--border)",
              cursor: "pointer", color: "var(--text-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", fontWeight: 700,
            }}
          >−</button>
          <span style={{ minWidth: 36, textAlign: "center", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {item.current_quantity}
          </span>
          <button
            onClick={() => onQtyChange(1)}
            aria-label="Aumentar quantidade"
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: "var(--bg-secondary)", border: "1.5px solid var(--border)",
              cursor: "pointer", color: "var(--text-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", fontWeight: 700,
            }}
          >+</button>
        </div>
      </div>

      {/* Barra de estoque */}
      <div style={{ marginTop: "0.75rem", marginLeft: "2.625rem" }}>
        <div style={{ height: 7, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden", marginBottom: "0.375rem" }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 4,
            background: pct === 0 ? "#ef4444" : pct < 100 ? "#f59e0b" : "var(--brand)",
            transition: "width 0.3s",
          }} />
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {item.current_quantity} de {item.min_quantity} {item.unit} — {pct < 100 ? "abaixo do mínimo" : "estoque ok"}
        </div>
      </div>

      {/* Botão adicionar à lista */}
      <button
        onClick={onAddToList}
        style={{
          marginTop: "0.875rem",
          marginLeft: "2.625rem",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.6rem 1rem",
          borderRadius: 10, border: "1.5px solid var(--brand)",
          background: "var(--brand-bg)", color: "var(--brand)",
          fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
        }}
      >
        <MdShoppingCart size={17} /> Adicionar à lista de compras
      </button>
    </div>
  );
}

type NewItem = { name: string; category: string; unit: string; current: number; min: number };

function AddPantryItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: NewItem) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[1]);
  const [unit, setUnit] = useState("unid");
  const [current, setCurrent] = useState(0);
  const [min, setMin] = useState(1);

  function save() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), category, unit, current, min });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--bg-card)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 540, padding: "1.5rem" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--border)", margin: "0 auto 1.5rem" }} />
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
          Novo item na dispensa
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
              Nome do item *
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arroz, Leite, Sabão..."
              className="input-field" style={{ fontSize: "1rem" }} autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Unidade</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Quanto tem agora</label>
              <input type="number" value={current} onChange={(e) => setCurrent(Number(e.target.value))} min="0" className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Mínimo necessário</label>
              <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} min="1" className="input-field" style={{ fontSize: "0.95rem" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: "0.95rem", padding: "0.875rem" }}>
              Cancelar
            </button>
            <button onClick={save} className="btn-primary" style={{ flex: 2, justifyContent: "center", fontSize: "1rem", padding: "0.875rem", fontWeight: 800 }} disabled={!name.trim()}>
              <MdAdd size={20} /> Salvar item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
