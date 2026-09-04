"use client";
import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdShoppingCart, MdReceiptLong, MdClose } from "react-icons/md";
import type { ShoppingList, ShoppingItem } from "@/types";

interface Category {
  name: string;
  accent: string;
  emoji: string;
}

interface Props {
  items: ShoppingItem[];
  lists: ShoppingList[];
  categories: Category[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Period = "30d" | "3m" | "6m" | "12m" | "all";
const periodOptions: { id: Period; label: string }[] = [
  { id: "30d", label: "30 dias" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "12m", label: "12 meses" },
  { id: "all", label: "Tudo" },
];

interface ItemPoint {
  date: string;
  price: number;
  quantity: number;
  listName: string;
}
interface ItemHistoryEntry {
  name: string;
  emoji: string;
  category: string;
  points: ItemPoint[];
}

export function AnalisesCompras({ items, lists, categories }: Props) {
  const [period, setPeriod] = useState<Period>("6m");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  const allBought = items.filter((i) => i.checked && i.actual_price != null && i.checked_at);
  const spend = (i: ShoppingItem) => (i.actual_price ?? 0) * i.quantity;

  if (allBought.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Ainda não há dados suficientes
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Marque itens como comprados e registre o valor pago pra ver as análises aqui
        </div>
      </div>
    );
  }

  // Totais do mês atual x mês anterior (sempre absolutos, não mudam com o período escolhido)
  const now = new Date();
  const thisMonthKey = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthDate);
  let totalThisMonth = 0, totalLastMonth = 0;
  allBought.forEach((i) => {
    const mKey = monthKey(new Date(i.checked_at!));
    const s = spend(i);
    if (mKey === thisMonthKey) totalThisMonth += s;
    if (mKey === lastMonthKey) totalLastMonth += s;
  });
  const variacao = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : null;

  // Filtro por período — afeta tendência, categorias, listas e itens
  let cutoff: Date | null = null;
  if (period === "30d") cutoff = new Date(now.getTime() - 30 * 86400000);
  else if (period === "3m") cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  else if (period === "6m") cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  else if (period === "12m") cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  const bought = cutoff ? allBought.filter((i) => new Date(i.checked_at!) >= cutoff!) : allBought;
  const periodLabel = periodOptions.find((p) => p.id === period)?.label ?? "";

  const dayTotals = new Map<string, number>();
  const monthTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  const listTotals = new Map<string, number>();
  const itemTotals = new Map<string, { name: string; emoji: string; category: string; spend: number; count: number }>();
  const itemHistory = new Map<string, ItemHistoryEntry>();
  let totalPeriod = 0;

  bought.forEach((i) => {
    const s = spend(i);
    totalPeriod += s;

    const checkedDate = new Date(i.checked_at!);
    monthTotals.set(monthKey(checkedDate), (monthTotals.get(monthKey(checkedDate)) ?? 0) + s);
    dayTotals.set(dayKey(checkedDate), (dayTotals.get(dayKey(checkedDate)) ?? 0) + s);

    const cat = i.category ?? "Outros";
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + s);

    const listName = lists.find((l) => l.id === i.list_id)?.name ?? "Outra lista";
    listTotals.set(listName, (listTotals.get(listName) ?? 0) + s);

    const key = i.name.trim().toLowerCase();
    const entry = itemTotals.get(key) ?? { name: i.name, emoji: i.emoji ?? "📦", category: cat, spend: 0, count: 0 };
    entry.spend += s;
    entry.count += 1;
    itemTotals.set(key, entry);

    const hist = itemHistory.get(key) ?? { name: i.name, emoji: i.emoji ?? "📦", category: cat, points: [] };
    hist.points.push({ date: i.checked_at!, price: i.actual_price ?? 0, quantity: i.quantity, listName });
    itemHistory.set(key, hist);
  });

  const ticketMedio = dayTotals.size > 0 ? totalPeriod / dayTotals.size : 0;

  // Tendência: diária pros últimos 30 dias, mensal pros demais períodos
  let trendData: { label: string; total: number }[];
  if (period === "30d") {
    trendData = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date(now.getTime() - (29 - idx) * 86400000);
      return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: dayTotals.get(dayKey(d)) ?? 0 };
    });
  } else {
    const numMonths = period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 24;
    trendData = Array.from({ length: numMonths }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - idx), 1);
      return { label: monthLabels[d.getMonth()], total: monthTotals.get(monthKey(d)) ?? 0 };
    });
  }

  const categoryChart = Array.from(categoryTotals.entries())
    .map(([name, total]) => ({ name, total, color: categoryMap.get(name)?.accent ?? "#8a96a0", emoji: categoryMap.get(name)?.emoji ?? "📦" }))
    .sort((a, b) => b.total - a.total);

  const listChart = Array.from(listTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const topItems = Array.from(itemTotals.values())
    .filter((it) => !selectedCategory || it.category === selectedCategory)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8);

  const listColors = ["#7aab8a", "#a07acc", "#5aabb0", "#c99a40", "#d06a6a", "#88aa40"];

  // Tendência de preço por item (mesmo item, ao longo do tempo)
  const priceTrends = Array.from(itemHistory.values())
    .map((entry) => {
      const points = [...entry.points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = points[0].price;
      const last = points[points.length - 1].price;
      const change = first > 0 ? ((last - first) / first) * 100 : 0;
      return { ...entry, points, first, last, change };
    })
    .filter((e) => e.points.length >= 2 && Math.abs(e.change) >= 1);

  const gettingPricier = priceTrends.filter((e) => e.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const gettingCheaper = priceTrends.filter((e) => e.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

  const selectedItem = selectedItemKey ? itemHistory.get(selectedItemKey) : null;
  const selectedItemStats = selectedItem ? (() => {
    const prices = selectedItem.points.map((p) => p.price);
    const totalSpend = selectedItem.points.reduce((s, p) => s + p.price * p.quantity, 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((s, p) => s + p, 0) / prices.length,
      total: totalSpend,
      count: selectedItem.points.length,
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

      {bought.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗓️</div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Nenhuma compra registrada nos últimos {periodLabel.toLowerCase()}.
          </div>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
            <div className="card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <MdReceiptLong size={16} color="var(--brand)" />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Este mês</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(totalThisMonth)}</div>
              {variacao != null && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem", color: variacao > 0 ? "#d06a6a" : "#7aab8a", fontSize: "0.75rem", fontWeight: 700 }}>
                  {variacao > 0 ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
                  {Math.abs(variacao).toFixed(0)}% vs mês passado
                </div>
              )}
            </div>

            <div className="card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <MdShoppingCart size={16} color="var(--brand)" />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ticket médio</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(ticketMedio)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>por dia de compra</div>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <MdReceiptLong size={16} color="var(--brand)" />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total no período</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(totalPeriod)}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{bought.length} itens · {periodLabel.toLowerCase()}</div>
            </div>
          </div>

          {/* Tendência */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Gastos por {period === "30d" ? "dia" : "mês"} ({periodLabel.toLowerCase()})
            </h3>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} interval={period === "30d" ? 4 : 0} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#7aab8a" strokeWidth={3} dot={period !== "30d"} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Por categoria */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
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
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "-1rem", marginBottom: "1rem" }}>
              Toque numa categoria pra ver só os itens dela na lista abaixo
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
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.emoji} {c.name}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(c.total)}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: 34, textAlign: "right" }}>
                      {((c.total / totalPeriod) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Por lista */}
          {listChart.length > 1 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                Gastos por lista
              </h3>
              <div style={{ width: "100%", height: Math.max(120, listChart.length * 44) }}>
                <ResponsiveContainer>
                  <BarChart data={listChart} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {listChart.map((_, idx) => <Cell key={idx} fill={listColors[idx % listColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Itens mais comprados */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
              Itens que mais pesam no bolso{selectedCategory ? ` — ${selectedCategory}` : ""}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Toque num item pra ver o histórico completo de compras
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {topItems.map((it, idx) => (
                <div
                  key={it.name}
                  onClick={() => setSelectedItemKey(it.name.trim().toLowerCase())}
                  style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", width: 16, flexShrink: 0 }}>{idx + 1}</span>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{it.emoji}</span>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.name}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>{it.count}x</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0, minWidth: 64, textAlign: "right" }}>
                    {fmt(it.spend)}
                  </span>
                </div>
              ))}
              {topItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Nada nessa categoria nesse período.
                </div>
              )}
            </div>
          </div>

          {/* Tendência de preço por item */}
          {gettingPricier.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                De olho no preço
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Esses itens estão vindo cada vez mais caros — pode valer a pena comparar com outro mercado.
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {gettingPricier.map((e) => (
                  <div
                    key={e.name}
                    onClick={() => setSelectedItemKey(e.name.trim().toLowerCase())}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0",
                      borderBottom: "1px solid var(--border-light)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{e.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {fmt(e.first)} → {fmt(e.last)} · {e.points.length}x
                      </div>
                    </div>
                    <div style={{ width: 70, height: 32, flexShrink: 0 }}>
                      <ResponsiveContainer>
                        <LineChart data={e.points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="price" stroke="#d06a6a" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: "#d06a6a", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0, minWidth: 56, justifyContent: "flex-end" }}>
                      <MdTrendingUp size={14} />
                      {e.change.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              {gettingCheaper.length > 0 && (
                <>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "1rem 0 0.5rem" }}>
                    Esses ficaram mais baratos:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {gettingCheaper.map((e) => (
                      <div
                        key={e.name}
                        onClick={() => setSelectedItemKey(e.name.trim().toLowerCase())}
                        style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
                      >
                        <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{e.emoji}</span>
                        <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.name}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(e.first)} → {fmt(e.last)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: "#7aab8a", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                          <MdTrendingDown size={13} />
                          {Math.abs(e.change).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de detalhe do item */}
      {selectedItem && selectedItemStats && (
        <div onClick={(e) => e.target === e.currentTarget && setSelectedItemKey(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, padding: "1.5rem", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{selectedItem.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>{selectedItem.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selectedItem.category}</div>
                </div>
              </div>
              <button onClick={() => setSelectedItemKey(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.25rem", flexShrink: 0 }}>
              {[
                { label: "Total gasto", value: fmt(selectedItemStats.total) },
                { label: "Compras", value: String(selectedItemStats.count) },
                { label: "Menor preço", value: fmt(selectedItemStats.min) },
                { label: "Maior preço", value: fmt(selectedItemStats.max) },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "0.5rem 0.25rem", background: "var(--bg-secondary)", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>{s.label}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
                Histórico de compras
              </div>
              {[...selectedItem.points].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.listName} · {p.quantity > 1 ? `${p.quantity}x` : "1x"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)" }}>{fmt(p.price)}{p.quantity > 1 ? "/un" : ""}</div>
                    {p.quantity > 1 && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmt(p.price * p.quantity)} total</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
