"use client";
import { useState } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdAttachMoney, MdSavings, MdClose } from "react-icons/md";
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

const categoryEmoji: Record<string, string> = {
  "Salário": "💰",
  "Casa": "🏠",
  "Carro": "🚗",
  "Celular": "📱",
  "Assinaturas": "📺",
  "Cuidados pessoais": "💅",
  "Saúde": "🏥",
  "Atividades das crianças": "⚽",
  "Prestadores & terceiros": "🧹",
  "Outros": "📦",
};
function catEmoji(name: string) {
  return categoryEmoji[name] ?? "📦";
}

const memberColors = ["#7aab8a", "#a07acc", "#5aabb0", "#c99a40", "#d06a6a", "#88aa40"];

type Period = "1m" | "3m" | "6m" | "12m";
const periodOptions: { id: Period; label: string; months: number }[] = [
  { id: "1m", label: "Este mês", months: 1 },
  { id: "3m", label: "3 meses", months: 3 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "12m", label: "12 meses", months: 12 },
];

interface DescPoint { date: string; amount: number }
interface DescHistoryEntry { description: string; category: string; points: DescPoint[] }

export function VisaoGeralFinanceiro({ transactions, categories, members, monthDate }: Props) {
  const [period, setPeriod] = useState<Period>("6m");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDescKey, setSelectedDescKey] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💰</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Ainda tá tudo zerado por aqui
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Assim que você registrar a primeira receita ou gasto, o resumo do mês aparece aqui — bonitinho e sempre certo
        </div>
      </div>
    );
  }

  const periodMonths = periodOptions.find((p) => p.id === period)!.months;
  const periodLabel = periodOptions.find((p) => p.id === period)!.label;
  const windowStart = new Date(monthDate.getFullYear(), monthDate.getMonth() - (periodMonths - 1), 1);
  const windowEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const inPeriod = transactions.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    return d >= windowStart && d <= windowEnd;
  });

  const income = inPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = inPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  // Tendência (mesmo número de meses do período selecionado)
  const monthlyTrend = Array.from({ length: periodMonths }, (_, idx) => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - (periodMonths - 1 - idx), 1);
    const key = monthKey(d);
    const monthTx = transactions.filter((t) => monthKey(new Date(t.date + "T12:00:00")) === key);
    return {
      label: monthLabels[d.getMonth()],
      receitas: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      gastos: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Gastos por categoria (no período)
  const categoryTotals = new Map<string, number>();
  inPeriod.filter((t) => t.type === "expense").forEach((t) => {
    const name = categoryMap.get(t.category_id)?.name ?? "Outros";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + t.amount);
  });
  const categoryChart = Array.from(categoryTotals.entries())
    .map(([name, total]) => ({ name, total, color: categories.find((c) => c.name === name)?.color ?? "#8a96a0" }))
    .sort((a, b) => b.total - a.total);

  // Receita por pessoa (no período)
  const memberTotals = new Map<string, number>();
  inPeriod.filter((t) => t.type === "income").forEach((t) => {
    const name = memberMap.get(t.member_id)?.name ?? "Outro";
    memberTotals.set(name, (memberTotals.get(name) ?? 0) + t.amount);
  });
  const memberChart = Array.from(memberTotals.entries())
    .map(([name, total]) => ({
      name, total,
      color: memberColors[Math.max(members.findIndex((m) => m.name === name), 0) % memberColors.length],
    }))
    .sort((a, b) => b.total - a.total);

  // Maiores gastos individuais no período (filtráveis por categoria)
  const topTransactions = inPeriod
    .filter((t) => t.type === "expense")
    .filter((t) => !selectedCategory || (categoryMap.get(t.category_id)?.name ?? "Outros") === selectedCategory)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Gastos recorrentes por descrição (ex: "Celular" todo mês) — pra ver se estão subindo
  const descHistory = new Map<string, DescHistoryEntry>();
  inPeriod.filter((t) => t.type === "expense").forEach((t) => {
    const key = t.description.trim().toLowerCase();
    const catName = categoryMap.get(t.category_id)?.name ?? "Outros";
    const entry = descHistory.get(key) ?? { description: t.description, category: catName, points: [] };
    entry.points.push({ date: t.date, amount: t.amount });
    descHistory.set(key, entry);
  });
  const descTrends = Array.from(descHistory.values())
    .map((entry) => {
      const points = [...entry.points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = points[0].amount;
      const last = points[points.length - 1].amount;
      const change = first > 0 ? ((last - first) / first) * 100 : 0;
      return { ...entry, points, first, last, change };
    })
    .filter((e) => e.points.length >= 2 && Math.abs(e.change) >= 1);
  const gettingPricier = descTrends.filter((e) => e.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);

  const selectedDesc = selectedDescKey ? descHistory.get(selectedDescKey) : null;
  const selectedDescStats = selectedDesc ? (() => {
    const amounts = selectedDesc.points.map((p) => p.amount);
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      total: amounts.reduce((s, a) => s + a, 0),
      count: selectedDesc.points.length,
    };
  })() : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Seletor de período */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {periodOptions.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              padding: "0.35rem 0.8rem", borderRadius: 999, border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 700,
              background: period === p.id ? "var(--brand)" : "var(--bg-secondary)",
              color: period === p.id ? "#fff" : "var(--text-muted)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

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
          Receitas x Gastos ({periodLabel.toLowerCase()})
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Gastos por categoria
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)", background: "rgba(122,171,138,0.12)", border: "none", borderRadius: 999, padding: "0.25rem 0.6rem", cursor: "pointer" }}
              >
                {selectedCategory} <MdClose size={12} />
              </button>
            )}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Toque numa categoria pra ver os maiores gastos dela abaixo
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryChart} dataKey="total" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2}
                    onClick={(d) => setSelectedCategory((prev) => prev === d.name ? null : d.name)}
                    style={{ cursor: "pointer" }}
                  >
                    {categoryChart.map((c) => (
                      <Cell key={c.name} fill={c.color} opacity={!selectedCategory || selectedCategory === c.name ? 1 : 0.3} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {categoryChart.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setSelectedCategory((prev) => prev === c.name ? null : c.name)}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", opacity: !selectedCategory || selectedCategory === c.name ? 1 : 0.45 }}
                >
                  <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{catEmoji(c.name)}</span>
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

      {/* Maiores gastos */}
      {topTransactions.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            Maiores gastos{selectedCategory ? ` — ${selectedCategory}` : ""}
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Toque num lançamento pra ver o histórico dessa conta
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {topTransactions.map((t, idx) => {
              const cat = categoryMap.get(t.category_id);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedDescKey(t.description.trim().toLowerCase())}
                  style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", width: 16, flexShrink: 0 }}>{idx + 1}</span>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{catEmoji(cat?.name ?? "Outros")}</span>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.description}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0, minWidth: 64, textAlign: "right" }}>
                    {fmt(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contas que estão subindo */}
      {gettingPricier.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            De olho nas contas
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Essas contas estão vindo cada vez mais caras nesse período.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {gettingPricier.map((e) => (
              <div
                key={e.description}
                onClick={() => setSelectedDescKey(e.description.trim().toLowerCase())}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
              >
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{catEmoji(e.category)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.description}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {fmt(e.first)} → {fmt(e.last)} · {e.points.length}x
                  </div>
                </div>
                <div style={{ width: 70, height: 32, flexShrink: 0 }}>
                  <ResponsiveContainer>
                    <LineChart data={e.points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Line type="monotone" dataKey="amount" stroke="#f87171" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: "#f87171", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0, minWidth: 56, justifyContent: "flex-end" }}>
                  <MdTrendingUp size={14} />
                  {e.change.toFixed(0)}%
                </div>
              </div>
            ))}
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
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", background: m.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 800, flexShrink: 0,
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{m.name}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4ade80" }}>{fmt(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalhe da conta */}
      {selectedDesc && selectedDescStats && (
        <div onClick={(e) => e.target === e.currentTarget && setSelectedDescKey(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, padding: "1.5rem", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{catEmoji(selectedDesc.category)}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>{selectedDesc.description}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selectedDesc.category}</div>
                </div>
              </div>
              <button onClick={() => setSelectedDescKey(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1.25rem", flexShrink: 0 }}>
              {[
                { label: "Total no período", value: fmt(selectedDescStats.total) },
                { label: "Menor valor", value: fmt(selectedDescStats.min) },
                { label: "Maior valor", value: fmt(selectedDescStats.max) },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "0.5rem 0.25rem", background: "var(--bg-secondary)", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>{s.label}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
                Histórico
              </div>
              {[...selectedDesc.points].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)" }}>{fmt(p.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
