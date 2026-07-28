"use client";
import { useState } from "react";
import { MdClose, MdAttachMoney, MdCalendarToday, MdCategory, MdDescription, MdCreditCard } from "react-icons/md";

const categories = {
  expense: ["Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Casa", "Roupas", "Outros"],
  income: ["Salário", "Freelance", "Investimentos", "Benefícios", "Outros"],
};

interface Props {
  type: "income" | "expense";
  onClose: () => void;
}

export function TransactionModal({ type, onClose }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!description || !amount || !category) return;
    setLoading(true);
    // TODO: salvar no Supabase
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    onClose();
  }

  const isExpense = type === "expense";
  const accentColor = isExpense ? "#f87171" : "#4ade80";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
        padding: "0",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "100%",
          maxWidth: 520,
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {isExpense ? "Novo Gasto" : "Nova Receita"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
            <MdClose size={20} />
          </button>
        </div>

        {/* Valor — campo principal em destaque */}
        <div
          style={{
            textAlign: "center",
            padding: "1.5rem",
            background: `${accentColor}10`,
            border: `1px solid ${accentColor}30`,
            borderRadius: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            {isExpense ? "Quanto gastou?" : "Quanto recebeu?"}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "1.5rem", color: accentColor, fontWeight: 600 }}>R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontSize: "2.5rem",
                fontWeight: 700,
                color: accentColor,
                width: "160px",
                textAlign: "center",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Descrição */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Descrição
            </label>
            <div style={{ position: "relative" }}>
              <MdDescription size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Aluguel..."
                className="input-field"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
              Categoria
            </label>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {categories[type].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "0.4rem 0.875rem",
                    borderRadius: "9999px",
                    border: `1px solid ${category === cat ? accentColor : "var(--border)"}`,
                    background: category === cat ? `${accentColor}18` : "transparent",
                    color: category === cat ? accentColor : "var(--text-muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: category === cat ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Data + Forma de pagamento em linha */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                Data
              </label>
              <div style={{ position: "relative" }}>
                <MdCalendarToday size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
            {isExpense && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                  Forma de pagamento
                </label>
                <div style={{ position: "relative" }}>
                  <MdCreditCard size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "2.25rem", cursor: "pointer" }}
                  >
                    <option value="pix">Pix</option>
                    <option value="debit">Débito</option>
                    <option value="credit_card">Crédito</option>
                    <option value="cash">Dinheiro</option>
                    <option value="transfer">Transferência</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Recorrente */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
            <div
              onClick={() => setRecurring(!recurring)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: recurring ? accentColor : "var(--border)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left: recurring ? 23 : 3,
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Lançamento recorrente</span>
          </label>

          <button
            onClick={handleSave}
            disabled={loading || !description || !amount || !category}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              background: isExpense ? "#dc2626" : "#16a34a",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Salvando..." : isExpense ? "Registrar Gasto" : "Registrar Receita"}
          </button>
        </div>
      </div>
    </div>
  );
}
