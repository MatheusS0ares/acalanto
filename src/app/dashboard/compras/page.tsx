"use client";
import { useState } from "react";
import { MdAdd, MdCheck, MdDelete, MdClose, MdHistory, MdStore, MdEdit } from "react-icons/md";

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  checked: boolean;
}

const initialItems: Item[] = [
  { id: "1", name: "Arroz",          quantity: 5, unit: "kg",   unitPrice: 6.5,  checked: false },
  { id: "2", name: "Feijão",         quantity: 2, unit: "kg",   unitPrice: 8.9,  checked: false },
  { id: "3", name: "Leite",          quantity: 6, unit: "L",    unitPrice: 4.79, checked: false },
  { id: "4", name: "Sabão em pó",    quantity: 2, unit: "kg",   unitPrice: 15,   checked: false },
  { id: "5", name: "Pão de forma",   quantity: 2, unit: "unid", unitPrice: 8.5,  checked: true  },
  { id: "6", name: "Queijo",         quantity: 1, unit: "unid", unitPrice: 22,   checked: true  },
];

const mockHistory = [
  { id: "1", date: "2026-06-15", store: "Carrefour", items: 24, total: 387.50 },
  { id: "2", date: "2026-06-02", store: "Extra",     items: 18, total: 256.80 },
  { id: "3", date: "2026-05-20", store: "Atacadão",  items: 35, total: 623.40 },
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function itemTotal(item: Item) {
  return (item.unitPrice ?? 0) * item.quantity;
}

export default function ComprasPage() {
  const [items, setItems]         = useState<Item[]>(initialItems);
  const [addModal, setAddModal]   = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast]         = useState("");

  const pending  = items.filter((i) => !i.checked);
  const inCart   = items.filter((i) => i.checked);

  const totalGeral = items.reduce((sum, i) => sum + itemTotal(i), 0);
  const totalCarrinho = inCart.reduce((sum, i) => sum + itemTotal(i), 0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function toggleCheck(id: string) {
    const item = items.find((i) => i.id === id)!;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
    showToast(item.checked ? `"${item.name}" voltou para a lista` : `✓ "${item.name}" marcado!`);
  }

  function removeItem(id: string) {
    const item = items.find((i) => i.id === id)!;
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`"${item.name}" removido`);
  }

  function clearCart() {
    showToast(`Carrinho limpo · total R$ ${formatMoney(totalCarrinho)}`);
    setItems((prev) => prev.filter((i) => !i.checked));
  }

  function addItem(name: string, quantity: number, unit: string, unitPrice?: number) {
    setItems((prev) => [...prev, { id: Date.now().toString(), name, quantity, unit, unitPrice, checked: false }]);
    setAddModal(false);
    showToast(`✓ "${name}" adicionado!`);
  }

  function updateItem(id: string, name: string, quantity: number, unit: string, unitPrice?: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, name, quantity, unit, unitPrice } : i));
    setEditingItem(null);
    showToast(`"${name}" atualizado`);
  }

  if (showHistory) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button
          onClick={() => setShowHistory(false)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", padding: 0 }}
        >
          ← Voltar para a lista
        </button>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Compras anteriores</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Veja o que você comprou antes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mockHistory.map((h) => (
            <div key={h.id} className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "14px", background: "var(--brand-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdStore size={24} color="var(--brand)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{h.store}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {new Date(h.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} · {h.items} itens
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                R$ {formatMoney(h.total)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
          background: "#2a2723", color: "var(--text-primary)",
          padding: "0.75rem 1.5rem", borderRadius: "999px",
          fontSize: "0.9rem", fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 200, whiteSpace: "nowrap",
          border: "1px solid var(--border)",
        }}>
          {toast}
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              🛒 Lista de Compras
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Toque no item quando colocar no carrinho
            </p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem", padding: "0.5rem" }}
          >
            <MdHistory size={22} />
            <span style={{ fontSize: "0.68rem" }}>Histórico</span>
          </button>
        </div>
      </div>

      {/* Totais */}
      {items.length > 0 && (
        <div className="card" style={{ display: "flex", padding: "1rem 1.25rem", marginBottom: "1.25rem", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
              Total no carrinho
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--brand)" }}>
              R$ {formatMoney(totalCarrinho)}
            </div>
          </div>
          <div style={{ width: 1, background: "var(--border-light)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
              Total estimado da lista
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
              R$ {formatMoney(totalGeral)}
            </div>
          </div>
        </div>
      )}

      {/* Progresso visual */}
      {items.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {inCart.length} de {items.length} itens no carrinho
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)" }}>
              {Math.round((inCart.length / items.length) * 100)}%
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(inCart.length / items.length) * 100}%`,
              borderRadius: 99,
              background: "var(--brand)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}

      {/* Botão principal — destaque máximo */}
      <button
        onClick={() => setAddModal(true)}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "16px",
          background: "var(--brand)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          fontSize: "1.05rem",
          fontWeight: 800,
          marginBottom: "1.75rem",
          boxShadow: "0 4px 16px rgba(122,171,138,0.4)",
          letterSpacing: "0.01em",
        }}
      >
        <MdAdd size={24} /> Adicionar item à lista
      </button>

      {/* Lista — Para comprar */}
      {pending.length > 0 ? (
        <section style={{ marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            Para comprar — {pending.length} {pending.length === 1 ? "item" : "itens"}
          </h2>
          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            {pending.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                onCheck={() => toggleCheck(item.id)}
                onRemove={() => removeItem(item.id)}
                onEdit={() => setEditingItem(item)}
                last={i === pending.length - 1}
              />
            ))}
          </div>
        </section>
      ) : (
        <div style={{
          textAlign: "center", padding: "2.5rem 1rem",
          border: "2px dashed var(--border)", borderRadius: "16px",
          marginBottom: "1.75rem",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Tudo comprado!
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Sua lista está vazia. Adicione itens acima.
          </div>
        </div>
      )}

      {/* Lista — No carrinho */}
      {inCart.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ✓ No carrinho — {inCart.length} {inCart.length === 1 ? "item" : "itens"}
            </h2>
            <button
              onClick={clearCart}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "underline", fontFamily: "inherit" }}
            >
              Limpar carrinho
            </button>
          </div>
          <div className="card" style={{ overflow: "hidden", padding: 0, opacity: 0.75 }}>
            {inCart.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                onCheck={() => toggleCheck(item.id)}
                onRemove={() => removeItem(item.id)}
                onEdit={() => setEditingItem(item)}
                last={i === inCart.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio inicial */}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛒</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Sua lista está vazia
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Toque no botão verde acima<br />para adicionar o primeiro item
          </div>
        </div>
      )}

      {/* Modal de adicionar */}
      {addModal && (
        <ItemModal onClose={() => setAddModal(false)} onSave={addItem} />
      )}

      {/* Modal de editar */}
      {editingItem && (
        <ItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(name, qty, unit, unitPrice) => updateItem(editingItem.id, name, qty, unit, unitPrice)}
        />
      )}
    </div>
  );
}

/* ── Linha de item ─────────────────────────────────────── */
function ItemRow({ item, onCheck, onRemove, onEdit, last }: {
  item: Item;
  onCheck: () => void;
  onRemove: () => void;
  onEdit: () => void;
  last: boolean;
}) {
  const hasPrice = !!item.unitPrice;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      padding: "0.875rem 1rem",
      gap: "0.875rem",
      borderBottom: last ? "none" : "1px solid var(--border-light)",
      minHeight: 64,
    }}>
      {/* Checkbox grande */}
      <button
        onClick={onCheck}
        aria-label={item.checked ? "Desmarcar item" : "Marcar como comprado"}
        style={{
          width: 40, height: 40,
          borderRadius: "50%",
          border: item.checked ? "none" : "2.5px solid var(--border)",
          background: item.checked ? "var(--brand)" : "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {item.checked && <MdCheck size={22} color="white" />}
      </button>

      {/* Nome, quantidade e valores — toca para editar */}
      <button
        onClick={onEdit}
        aria-label={`Editar ${item.name}`}
        style={{
          flex: 1, minWidth: 0, textAlign: "left",
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          fontSize: "1rem", fontWeight: 600,
          color: item.checked ? "var(--text-muted)" : "var(--text-primary)",
          textDecoration: item.checked ? "line-through" : "none",
          marginBottom: "0.1rem",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span>{item.quantity} {item.unit}</span>
          {hasPrice && <span>· R$ {formatMoney(item.unitPrice!)}/{item.unit}</span>}
          {hasPrice && <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>= R$ {formatMoney(itemTotal(item))}</span>}
        </div>
      </button>

      {/* Editar */}
      <button
        onClick={onEdit}
        aria-label={`Editar ${item.name}`}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", padding: "0.5rem",
          display: "flex", alignItems: "center", borderRadius: "8px",
          flexShrink: 0,
        }}
      >
        <MdEdit size={18} />
      </button>

      {/* Remover */}
      <button
        onClick={onRemove}
        aria-label={`Remover ${item.name}`}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", padding: "0.5rem",
          display: "flex", alignItems: "center", borderRadius: "8px",
          flexShrink: 0,
        }}
      >
        <MdDelete size={20} />
      </button>
    </div>
  );
}

/* ── Modal de adicionar/editar ─────────────────────────── */
function ItemModal({ item, onClose, onSave }: {
  item?: Item;
  onClose: () => void;
  onSave: (name: string, qty: number, unit: string, unitPrice?: number) => void;
}) {
  const [name, setName]           = useState(item?.name ?? "");
  const [qty, setQty]             = useState(item?.quantity ?? 1);
  const [unit, setUnit]           = useState(item?.unit ?? "unid");
  const [priceInput, setPriceInput] = useState(item?.unitPrice != null ? String(item.unitPrice) : "");
  const valid = name.trim().length > 0 && qty > 0;

  const units = ["unid", "kg", "g", "L", "ml", "cx", "pct"];
  const unitPrice = priceInput.trim() === "" ? undefined : Number(priceInput.replace(",", "."));
  const subtotal = unitPrice != null && !isNaN(unitPrice) ? unitPrice * qty : undefined;

  function save() {
    if (!valid) return;
    onSave(name.trim(), qty, unit, unitPrice != null && !isNaN(unitPrice) ? unitPrice : undefined);
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 520,
        padding: "1.5rem 1.5rem 2rem",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.5rem" }} />

        {/* Título */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {item ? "Editar item" : "O que você precisa comprar?"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
            <MdClose size={22} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Campo de nome — destaque */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Nome do item
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Ex: Arroz, Leite, Detergente..."
              className="input-field"
              autoFocus
              style={{ fontSize: "1rem", padding: "0.875rem 1rem" }}
            />
          </div>

          {/* Quantidade */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Quantidade
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: "0", border: "1.5px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{ width: 48, height: 48, border: "none", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-primary)", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0 }}
                >
                  −
                </button>
                <span style={{ width: 52, textAlign: "center", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  style={{ width: 48, height: 48, border: "none", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-primary)", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0 }}
                >
                  +
                </button>
              </div>

              {/* Unidade */}
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-field"
                style={{ maxWidth: 120, height: 48, cursor: "pointer", fontSize: "0.95rem" }}
              >
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Valor unitário */}
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Valor unitário <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 600 }}>
                R$
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="input-field"
                style={{ paddingLeft: "2.5rem", fontSize: "1rem" }}
              />
            </div>
          </div>

          {/* Subtotal calculado */}
          {subtotal !== undefined && !isNaN(subtotal) && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.875rem 1rem", borderRadius: "14px",
              background: "var(--brand-bg)",
            }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                {qty} {unit} × R$ {formatMoney(unitPrice!)}
              </span>
              <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--brand)" }}>
                R$ {formatMoney(subtotal)}
              </span>
            </div>
          )}

          {/* Botões */}
          <button
            onClick={save}
            disabled={!valid}
            style={{
              width: "100%", padding: "1rem",
              borderRadius: "14px",
              background: valid ? "var(--brand)" : "var(--bg-secondary)",
              color: valid ? "#fff" : "var(--text-muted)",
              border: "none", cursor: valid ? "pointer" : "not-allowed",
              fontSize: "1rem", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              boxShadow: valid ? "0 4px 14px rgba(122,171,138,0.35)" : "none",
            }}
          >
            <MdCheck size={22} /> {item ? "Salvar alterações" : "Adicionar à lista"}
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "0.875rem",
              borderRadius: "14px",
              background: "transparent",
              color: "var(--text-muted)",
              border: "1.5px solid var(--border)",
              cursor: "pointer", fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
