"use client";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdAttachMoney, MdSavings } from "react-icons/md";
import type { Transaction, FinanceCategory, FamilyMember } from "@/types";

interface Props {
  transactions: Transaction[];
  categories: FinanceCategory[];
  members: FamilyMember[];
  monthDate: Date;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function VisaoGeralFinanceiro({ transactions, categories, members, monthDate }: Props) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const selectedKey = monthKey(monthDate);

  const inMonth = transactions.filter((t) => monthKey(new Date(t.date + "T12:00:00")) === selectedKey);
  const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💰</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Nenhum lançamento ainda
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Registre receitas e gastos pra ver o resumo do mês aqui
        </div>
      </div>
    );
  }

  // Tendência dos últimos 6 meses (relativos ao mês selecionado)
  const monthlyTrend = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - (5 - idx), 1);
    const key = monthKey(d);
    const monthTx = transactions.filter((t) => monthKey(new Date(t.date + "T12:00:00")) === key);
    return {
      label: monthLabels[d.getMonth()],
      receitas: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      gastos: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Gastos por categoria (mês selecionado)
  const categoryTotals = new Map<string, number>();
  inMonth.filter((t) => t.type === "expense").forEach((t) => {
    const name = categoryMap.get(t.category_id)?.name ?? "Outros";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + t.amount);
  });
  const categoryChart = Array.from(categoryTotals.entries())
    .map(([name, total]) => ({ name, total, color: categories.find((c) => c.name === name)?.color ?? "#8a96a0" }))
    .sort((a, b) => b.total - a.total);

  // Receita por pessoa (mês selecionado)
  const memberTotals = new Map<string, number>();
  inMonth.filter((t) => t.type === "income").forEach((t) => {
    const name = memberMap.get(t.member_id)?.name ?? "Outro";
    memberTotals.set(name, (memberTotals.get(name) ?? 0) + t.amount);
  });
  const memberChart = Array.from(memberTotals.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <MdTrendingUp size={16} color="#4ade80" />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Receitas</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(income)}</div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <MdTrendingDown size={16} color="#f87171" />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Gastos</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(expense)}</div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <MdAttachMoney size={16} color="var(--brand)" />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Saldo</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: balance >= 0 ? "var(--text-primary)" : "#f87171" }}>{fmt(balance)}</div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <MdSavings size={16} color="#a78bfa" />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Taxa de poupança</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{savingsRate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Tendência mensal */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Receitas x Gastos (últimos 6 meses)
        </h3>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: "#4ade80" }} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#f87171" strokeWidth={3} dot={{ r: 4, fill: "#f87171" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Por categoria */}
      {categoryChart.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
            Gastos por categoria
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryChart} dataKey="total" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {categoryChart.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {categoryChart.map((c) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.name}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(c.total)}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: 34, textAlign: "right" }}>
                    {((c.total / expense) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Por pessoa */}
      {memberChart.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Receita por pessoa
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {memberChart.map((m) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{m.name}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4ade80" }}>{fmt(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
