"use client";
import { useState } from "react";
import { MdAdd, MdTrendingUp, MdTrendingDown, MdFilterList, MdSearch } from "react-icons/md";

const mockTransactions = [
  { id: "1", date: "2026-06-27", description: "Supermercado", category: "Alimentação", amount: -312.50, method: "Débito", member: "Ana" },
  { id: "2", date: "2026-06-27", description: "Salário", category: "Salário", amount: 8500, method: "Transferência", member: "Matheus" },
  { id: "3", date: "2026-06-26", description: "Posto de gasolina", category: "Transporte", amount: -180, method: "Crédito", member: "Matheus" },
  { id: "4", date: "2026-06-25", description: "Netflix", category: "Lazer", amount: -39.90, method: "Crédito", member: "Família" },
  { id: "5", date: "2026-06-25", description: "Farmácia", category: "Saúde", amount: -67.30, method: "Pix", member: "Ana" },
  { id: "6", date: "2026-06-24", description: "Aluguel", category: "Casa", amount: -2200, method: "Transferência", member: "Matheus" },
  { id: "7", date: "2026-06-23", description: "Freelance", category: "Freelance", amount: 1200, method: "Pix", member: "Matheus" },
];

interface Props {
  onAdd: () => void;
}

export function TransactionList({ onAdd }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = mockTransactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "income" ? t.amount > 0 : t.amount < 0);
    return matchSearch && matchFilter;
  });

  const grouped = filtered.reduce<Record<string, typeof mockTransactions>>((acc, t) => {
    const key = t.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div>
      {/* Barra de filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <MdSearch size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="input-field"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "0.5rem",
                border: `1px solid ${filter === f ? "#22c55e" : "var(--border)"}`,
                background: filter === f ? "rgba(34,197,94,0.12)" : "transparent",
                color: filter === f ? "#22c55e" : "var(--text-muted)",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === "all" ? "Todos" : f === "income" ? "Receitas" : "Gastos"}
            </button>
          ))}
        </div>
        <button onClick={onAdd} className="btn-primary" style={{ fontSize: "0.85rem" }}>
          <MdAdd size={16} /> Novo
        </button>
      </div>

      {/* Lista agrupada por data */}
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, transactions]) => (
          <div key={date} style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
              {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="card" style={{ overflow: "hidden", padding: 0 }}>
              {transactions.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.875rem 1rem",
                    borderBottom: i < transactions.length - 1 ? "1px solid var(--border-light)" : "none",
                    gap: "0.875rem",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      background: t.amount > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {t.amount > 0
                      ? <MdTrendingUp size={18} color="#4ade80" />
                      : <MdTrendingDown size={18} color="#f87171" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {t.category} · {t.method} · {t.member}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: t.amount > 0 ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>
                    {t.amount > 0 ? "+" : ""}R$ {Math.abs(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
