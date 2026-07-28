"use client";
import { useState } from "react";
import { MdAdd, MdCreditCard, MdCalendarToday } from "react-icons/md";

const mockCards = [
  { id: "1", name: "Nubank", last: "1234", limit: 5000, used: 1850, closing: 5, due: 12, color: "#8b5cf6" },
  { id: "2", name: "Inter", last: "5678", limit: 3000, used: 720, closing: 10, due: 17, color: "#f97316" },
  { id: "3", name: "Itaú", last: "9012", limit: 8000, used: 4200, closing: 20, due: 28, color: "#f59e0b" },
];

export function CreditCards() {
  const [selected, setSelected] = useState(mockCards[0].id);
  const card = mockCards.find((c) => c.id === selected)!;
  const usedPct = (card.used / card.limit) * 100;

  return (
    <div>
      {/* Cards */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {mockCards.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelected(c.id)}
            style={{
              minWidth: 240,
              height: 140,
              borderRadius: "1rem",
              background: `linear-gradient(135deg, ${c.color}, ${c.color}99)`,
              padding: "1.25rem",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: selected === c.id ? "2px solid white" : "2px solid transparent",
              transition: "border 0.15s, transform 0.15s",
              transform: selected === c.id ? "scale(1.02)" : "scale(1)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{c.name}</span>
              <MdCreditCard size={22} color="rgba(255,255,255,0.8)" />
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>
                **** **** **** {c.last}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
                R$ {c.used.toLocaleString("pt-BR")} / {c.limit.toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            minWidth: 100,
            height: 140,
            borderRadius: "1rem",
            border: "2px dashed var(--border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            flexShrink: 0,
          }}
        >
          <MdAdd size={20} />
          Adicionar
        </div>
      </div>

      {/* Detalhes do cartão selecionado */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
          {card.name} — Detalhes
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Limite total", value: `R$ ${card.limit.toLocaleString("pt-BR")}` },
            { label: "Utilizado", value: `R$ ${card.used.toLocaleString("pt-BR")}`, highlight: true },
            { label: "Disponível", value: `R$ ${(card.limit - card.used).toLocaleString("pt-BR")}` },
            { label: "Fechamento", value: `Dia ${card.closing}` },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{label}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: highlight ? card.color : "var(--text-primary)" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Barra de uso */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Uso do limite</span>
            <span style={{ fontSize: "0.78rem", color: usedPct > 80 ? "#f87171" : "var(--text-muted)", fontWeight: 600 }}>
              {usedPct.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${usedPct}%`,
                borderRadius: 4,
                background: usedPct > 80 ? "#ef4444" : card.color,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "0.5rem" }}>
          <MdCalendarToday size={16} color="var(--text-muted)" />
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Fatura fecha dia {card.closing} · Vence dia {card.due}
          </span>
        </div>
      </div>
    </div>
  );
}
