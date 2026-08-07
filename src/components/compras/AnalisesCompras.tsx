"use client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdShoppingCart, MdReceiptLong } from "react-icons/md";
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

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function AnalisesCompras({ items, lists, categories }: Props) {
  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  const bought = items.filter((i) => i.checked && i.actual_price != null && i.checked_at);
  const spend = (i: ShoppingItem) => (i.actual_price ?? 0) * i.quantity;

  if (bought.length === 0) {
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

  // Totais do mês atual x mês anterior
  const now = new Date();
  const thisMonthKey = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthDate);

  let totalThisMonth = 0, totalLastMonth = 0, totalAllTime = 0;
  const monthTotals = new Map<string, number>();
  const dayTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  const listTotals = new Map<string, number>();
  const itemTotals = new Map<string, { name: string; emoji: string; spend: number; count: number }>();

  bought.forEach((i) => {
    const s = spend(i);
    totalAllTime += s;

    const checkedDate = new Date(i.checked_at!);
    const mKey = monthKey(checkedDate);
    monthTotals.set(mKey, (monthTotals.get(mKey) ?? 0) + s);
    if (mKey === thisMonthKey) totalThisMonth += s;
    if (mKey === lastMonthKey) totalLastMonth += s;

    const dKey = checkedDate.toISOString().slice(0, 10);
    dayTotals.set(dKey, (dayTotals.get(dKey) ?? 0) + s);

    const cat = i.category ?? "Outros";
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + s);

    const listName = lists.find((l) => l.id === i.list_id)?.name ?? "Outra lista";
    listTotals.set(listName, (listTotals.get(listName) ?? 0) + s);

    const key = i.name.trim().toLowerCase();
    const entry = itemTotals.get(key) ?? { name: i.name, emoji: i.emoji ?? "📦", spend: 0, count: 0 };
    entry.spend += s;
    entry.count += 1;
    itemTotals.set(key, entry);
  });

  const variacao = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : null;
  const ticketMedio = dayTotals.size > 0 ? totalAllTime / dayTotals.size : 0;

  // Últimos 6 meses (incluindo meses sem gasto)
  const monthlyTrend = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const key = monthKey(d);
    return { label: monthLabels[d.getMonth()], total: monthTotals.get(key) ?? 0 };
  });

  const categoryChart = Array.from(categoryTotals.entries())
    .map(([name, total]) => ({ name, total, color: categoryMap.get(name)?.accent ?? "#8a96a0", emoji: categoryMap.get(name)?.emoji ?? "📦" }))
    .sort((a, b) => b.total - a.total);

  const listChart = Array.from(listTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const topItems = Array.from(itemTotals.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8);

  const listColors = ["#7aab8a", "#a07acc", "#5aabb0", "#c99a40", "#d06a6a", "#88aa40"];

  // Tendência de preço por item (mesmo item, ao longo do tempo)
  const priceHistory = new Map<string, { name: string; emoji: string; points: { date: string; price: number }[] }>();
  bought.forEach((i) => {
    if (i.actual_price == null) return;
    const key = i.name.trim().toLowerCase();
    const entry = priceHistory.get(key) ?? { name: i.name, emoji: i.emoji ?? "📦", points: [] };
    entry.points.push({ date: i.checked_at!, price: i.actual_price });
    priceHistory.set(key, entry);
  });

  const priceTrends = Array.from(priceHistory.values())
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total gasto</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{fmt(totalAllTime)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{bought.length} itens comprados</div>
        </div>
      </div>

      {/* Tendência mensal */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Gastos por mês (últimos 6 meses)
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
              <Line type="monotone" dataKey="total" stroke="#7aab8a" strokeWidth={3} dot={{ r: 4, fill: "#7aab8a" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Por categoria */}
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
                <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.emoji} {c.name}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(c.total)}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: 34, textAlign: "right" }}>
                  {((c.total / totalAllTime) * 100).toFixed(0)}%
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
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Itens que mais pesam no bolso
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {topItems.map((it, idx) => (
            <div key={it.name} style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0",
                  borderBottom: "1px solid var(--border-light)",
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
                  <div key={e.name} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
    </div>
  );
}
