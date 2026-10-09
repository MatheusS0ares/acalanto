"use client";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { MdSearch, MdClose, MdTrendingUp, MdTrendingDown, MdTrendingFlat, MdAnalytics } from "react-icons/md";
import type { ShoppingList, ShoppingItem } from "@/types";

interface Category {
  name: string;
  accent: string;
  emoji: string;
}

export type DimType = "list" | "product" | "category" | "store";

export interface Selection {
  type: DimType;
  key: string;
}

interface Props {
  items: ShoppingItem[];
  lists: ShoppingList[];
  categories: Category[];
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
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

function normalize(s: string) {
  return s.trim().toLowerCase();
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const NO_STORE = "__sem_mercado__";

interface Event {
  date: string;
  price: number;
  quantity: number;
  listId: string;
  listName: string;
  store: string | null;
  category: string;
  name: string;
  emoji: string;
}

function tripKey(e: Event) {
  return `${e.listId}|${dayKey(new Date(e.date))}`;
}

const dimLabels: Record<DimType, { label: string; plural: string; icon: string }> = {
  list: { label: "Lista", plural: "Listas", icon: "🗂️" },
  product: { label: "Produto", plural: "Produtos", icon: "📦" },
  category: { label: "Categoria", plural: "Categorias", icon: "🏷️" },
  store: { label: "Mercado", plural: "Mercados", icon: "🏬" },
};

function entityKey(e: Event, type: DimType): string {
  if (type === "list") return e.listId;
  if (type === "product") return normalize(e.name);
  if (type === "category") return e.category;
  return e.store ? normalize(e.store) : NO_STORE;
}

function entityLabel(e: Event, type: DimType): string {
  if (type === "list") return e.listName;
  if (type === "product") return e.name;
  if (type === "category") return e.category;
  return e.store ?? "Sem mercado definido";
}

function entityEmoji(e: Event, type: DimType, categories: Category[]): string {
  if (type === "product") return e.emoji;
  if (type === "category") return categories.find((c) => c.name === e.category)?.emoji ?? "📦";
  if (type === "store") return "🏬";
  return "🗂️";
}

interface Group {
  key: string;
  label: string;
  emoji: string;
  total: number;
  count: number;
  events: Event[];
}

function buildGroups(events: Event[], type: DimType, categories: Category[]): Map<string, Group> {
  const map = new Map<string, Group>();
  events.forEach((e) => {
    const key = entityKey(e, type);
    const g = map.get(key) ?? { key, label: entityLabel(e, type), emoji: entityEmoji(e, type, categories), total: 0, count: 0, events: [] };
    g.total += e.price * e.quantity;
    g.count += 1;
    g.events.push(e);
    map.set(key, g);
  });
  return map;
}

function groupPurchaseCount(group: Group, type: DimType) {
  if (type === "list" || type === "store") {
    return new Set(group.events.map(tripKey)).size;
  }
  return group.count;
}

export function useShoppingEvents(items: ShoppingItem[], lists: ShoppingList[]): Event[] {
  return useMemo(() => {
    const listMap = new Map(lists.map((l) => [l.id, l]));
    return items
      .filter((i) => i.checked && i.actual_price != null && i.checked_at)
      .map((i) => {
        const list = listMap.get(i.list_id);
        return {
          date: i.checked_at!,
          price: i.actual_price ?? 0,
          quantity: i.quantity,
          listId: i.list_id,
          listName: list?.name ?? "Outra lista",
          store: list?.store ?? null,
          category: i.category ?? "Outros",
          name: i.name,
          emoji: i.emoji ?? "📦",
        };
      });
  }, [items, lists]);
}

export function ExplorerPicker({ events, categories, selection, onSelect }: {
  events: Event[];
  categories: Category[];
  selection: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  const [tab, setTab] = useState<DimType>(selection?.type ?? "list");
  const [search, setSearch] = useState("");

  const groups = useMemo(() => buildGroups(events, tab, categories), [events, tab, categories]);
  const sorted = useMemo(() => Array.from(groups.values()).sort((a, b) => b.total - a.total), [groups]);
  const filtered = search.trim() ? sorted.filter((g) => normalize(g.label).includes(normalize(search))) : sorted;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <MdAnalytics size={18} /> Explorar e analisar
      </h3>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Escolha uma lista, produto, categoria ou mercado pra ver a análise completa: gastos, comparação e previsão.
      </p>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.9rem", flexWrap: "wrap" }}>
        {(Object.keys(dimLabels) as DimType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            style={{
              padding: "0.4rem 0.8rem", borderRadius: 999, border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700,
              background: tab === t ? "var(--brand)" : "var(--bg-secondary)",
              color: tab === t ? "#fff" : "var(--text-muted)",
            }}
          >
            {dimLabels[t].icon} {dimLabels[t].plural}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: "0.9rem" }}>
        <MdSearch size={16} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar ${dimLabels[tab].label.toLowerCase()}...`}
          className="input-field" style={{ paddingLeft: "2.2rem", fontSize: "0.85rem" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", maxHeight: 280, overflowY: "auto" }}>
        {filtered.map((g) => {
          const isSelected = selection?.type === tab && selection.key === g.key;
          return (
            <div
              key={g.key}
              onClick={() => onSelect({ type: tab, key: g.key })}
              style={{
                display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer",
                padding: "0.55rem 0.5rem", borderRadius: 10,
                background: isSelected ? "rgba(122,171,138,0.14)" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{g.emoji}</span>
              <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: isSelected ? 700 : 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.label}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>{groupPurchaseCount(g, tab)}x</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0, minWidth: 64, textAlign: "right" }}>{fmt(g.total)}</span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Nada por aqui ainda.
          </div>
        )}
      </div>
    </div>
  );
}

export function InsightPanel({ selection, events, categories, onSelect, onClose }: {
  selection: Selection;
  events: Event[];
  categories: Category[];
  onSelect: (s: Selection) => void;
  onClose: () => void;
}) {
  const { type, key } = selection;
  const categoryMap = new Map(categories.map((c) => [c.name, c]));

  const allGroupsOfType = useMemo(() => buildGroups(events, type, categories), [events, type, categories]);
  const group = allGroupsOfType.get(key);

  if (!group) {
    return (
      <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Sem dados suficientes pra essa análise ainda.</p>
        <button onClick={onClose} className="btn-secondary" style={{ marginTop: "0.75rem" }}>Fechar</button>
      </div>
    );
  }

  const myEvents = [...group.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalSpend = group.total;
  const purchaseCount = groupPurchaseCount(group, type);
  const firstDate = new Date(myEvents[0].date);
  const lastDate = new Date(myEvents[myEvents.length - 1].date);
  const avgPrice = myEvents.reduce((s, e) => s + e.price, 0) / myEvents.length;

  // Totais globais do mesmo tipo, pra comparação e % de participação
  const allTotal = Array.from(allGroupsOfType.values()).reduce((s, g) => s + g.total, 0);
  const share = allTotal > 0 ? (totalSpend / allTotal) * 100 : 0;
  const ranked = Array.from(allGroupsOfType.values()).sort((a, b) => b.total - a.total);
  const myRank = ranked.findIndex((g) => g.key === key) + 1;

  const comparisonChart = ranked.slice(0, 6).map((g) => ({ name: g.label, total: g.total, isMe: g.key === key }));
  if (!comparisonChart.some((c) => c.isMe) && myRank > 0) {
    comparisonChart.push({ name: group.label, total: group.total, isMe: true });
  }

  // Série mensal (desde a primeira compra até agora)
  const monthTotals = new Map<string, number>();
  myEvents.forEach((e) => {
    const mk = monthKey(new Date(e.date));
    monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + e.price * e.quantity);
  });
  const now = new Date();
  const spanMonths = Math.max(1, (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1);
  const trendMonths = Math.min(spanMonths, 12);
  const trendData = Array.from({ length: trendMonths }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (trendMonths - 1 - idx), 1);
    return { label: `${monthLabels[d.getMonth()]}${trendMonths > 6 ? `/${String(d.getFullYear()).slice(2)}` : ""}`, total: monthTotals.get(monthKey(d)) ?? 0 };
  });

  // Previsão: média dos últimos 3 meses com atividade x média dos 3 anteriores
  const last3 = trendData.slice(-3);
  const prev3 = trendData.slice(-6, -3);
  const last3Avg = last3.reduce((s, m) => s + m.total, 0) / (last3.length || 1);
  const prev3Avg = prev3.length ? prev3.reduce((s, m) => s + m.total, 0) / prev3.length : null;
  const monthlyAvgAllTime = totalSpend / spanMonths;
  const projection = last3Avg > 0 ? last3Avg : monthlyAvgAllTime;
  let projectionTrend: "up" | "down" | "flat" = "flat";
  if (prev3Avg != null && prev3Avg > 0) {
    const diff = ((last3Avg - prev3Avg) / prev3Avg) * 100;
    if (diff > 8) projectionTrend = "up";
    else if (diff < -8) projectionTrend = "down";
  }

  // Previsão de próxima compra (intervalo médio entre eventos) — mais útil pra produto/mercado/lista
  let nextPurchaseText: string | null = null;
  if (myEvents.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < myEvents.length; i++) {
      gaps.push((new Date(myEvents[i].date).getTime() - new Date(myEvents[i - 1].date).getTime()) / 86400000);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (avgGap >= 1) {
      const nextDate = new Date(lastDate.getTime() + avgGap * 86400000);
      const daysFromNow = Math.round((nextDate.getTime() - now.getTime()) / 86400000);
      nextPurchaseText = daysFromNow > 0
        ? `Com base no intervalo médio de ${Math.round(avgGap)} dias, a próxima compra deve rolar por volta de ${nextDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} (em ~${daysFromNow} dias), por uns ${fmt(avgPrice)}`
        : `Já passou do intervalo médio de ${Math.round(avgGap)} dias desde a última vez — pode estar na hora de repor`;
    }
  }

  // Detalhamento específico por tipo
  const byProduct = new Map<string, { label: string; emoji: string; total: number; count: number }>();
  const byCategory = new Map<string, { label: string; emoji: string; total: number }>();
  const byList = new Map<string, { label: string; total: number }>();
  const byStore = new Map<string, { label: string; total: number }>();
  myEvents.forEach((e) => {
    const pk = normalize(e.name);
    const p = byProduct.get(pk) ?? { label: e.name, emoji: e.emoji, total: 0, count: 0 };
    p.total += e.price * e.quantity; p.count += 1;
    byProduct.set(pk, p);

    const ck = e.category;
    const c = byCategory.get(ck) ?? { label: ck, emoji: categoryMap.get(ck)?.emoji ?? "📦", total: 0 };
    c.total += e.price * e.quantity;
    byCategory.set(ck, c);

    const lk = e.listId;
    const l = byList.get(lk) ?? { label: e.listName, total: 0 };
    l.total += e.price * e.quantity;
    byList.set(lk, l);

    const sk = e.store ? normalize(e.store) : NO_STORE;
    const st = byStore.get(sk) ?? { label: e.store ?? "Sem mercado definido", total: 0 };
    st.total += e.price * e.quantity;
    byStore.set(sk, st);
  });

  const topProducts = Array.from(byProduct.entries()).sort(([, a], [, b]) => b.total - a.total).slice(0, 6);
  const topCategories = Array.from(byCategory.entries()).sort(([, a], [, b]) => b.total - a.total).slice(0, 5);
  const topLists = Array.from(byList.entries()).sort(([, a], [, b]) => b.total - a.total).slice(0, 5);
  const topStores = Array.from(byStore.entries()).sort(([, a], [, b]) => b.total - a.total).slice(0, 5);

  const trendIcon = projectionTrend === "up" ? <MdTrendingUp size={16} /> : projectionTrend === "down" ? <MdTrendingDown size={16} /> : <MdTrendingFlat size={16} />;
  const trendColor = projectionTrend === "up" ? "#d06a6a" : projectionTrend === "down" ? "#7aab8a" : "var(--text-muted)";

  return (
    <div className="card" style={{ padding: "1.25rem", border: "1.5px solid var(--brand)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.6rem" }}>{group.emoji}</span>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
              {dimLabels[type].label}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{group.label}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={22} /></button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total gasto", value: fmt(totalSpend) },
          { label: type === "product" ? "Vezes comprado" : "Compras", value: String(purchaseCount) },
          { label: type === "product" ? "Preço médio" : "Ticket médio", value: fmt(type === "product" ? avgPrice : totalSpend / purchaseCount) },
          { label: `% d${type === "category" ? "as categorias" : type === "store" ? "os mercados" : type === "list" ? "as listas" : "os produtos"}`, value: `${share.toFixed(0)}%` },
        ].map((k) => (
          <div key={k.label} style={{ textAlign: "center", padding: "0.6rem 0.4rem", background: "var(--bg-secondary)", borderRadius: 10 }}>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{k.label}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tendência */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.6rem" }}>Gastos por mês</h4>
        <div style={{ width: "100%", height: 150 }}>
          <ResponsiveContainer>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#7aab8a" strokeWidth={3} dot isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Previsão futura */}
      <div style={{ padding: "0.9rem 1rem", background: "rgba(122,171,138,0.08)", border: "1px solid rgba(122,171,138,0.25)", borderRadius: 12, marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>🔮 Previsão</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: trendColor, fontSize: "0.75rem", fontWeight: 700 }}>
            {trendIcon} {projectionTrend === "up" ? "em alta" : projectionTrend === "down" ? "em queda" : "estável"}
          </span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: nextPurchaseText ? "0.4rem" : 0 }}>
          Baseado no histórico, a previsão é gastar cerca de <strong style={{ color: "var(--brand)" }}>{fmt(projection)}</strong> no próximo mês com {type === "list" ? "essa lista" : type === "product" ? "esse produto" : type === "category" ? "essa categoria" : "esse mercado"}.
        </div>
        {nextPurchaseText && (
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{nextPurchaseText}</div>
        )}
      </div>

      {/* Comparação com outras do mesmo tipo */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
          Comparado com {dimLabels[type].plural.toLowerCase()}
        </h4>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
          {myRank > 0 ? `${myRank}º lugar entre ${ranked.length} ${dimLabels[type].plural.toLowerCase()}` : ""}
        </p>
        <div style={{ width: "100%", height: Math.max(100, comparisonChart.length * 36) }}>
          <ResponsiveContainer>
            <BarChart data={comparisonChart} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {comparisonChart.map((c, idx) => <Cell key={idx} fill={c.isMe ? "#7aab8a" : "var(--border)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalhamento por tipo */}
      {type !== "product" && topProducts.length > 0 && (
        <DetailList title="Produtos" rows={topProducts.map(([k, p]) => ({ key: k, label: p.label, emoji: p.emoji, total: p.total, sub: `${p.count}x` }))}
          onPick={(k) => onSelect({ type: "product", key: k })} />
      )}
      {type !== "category" && topCategories.length > 0 && (
        <DetailList title="Categorias" rows={topCategories.map(([k, c]) => ({ key: k, label: c.label, emoji: c.emoji, total: c.total }))}
          onPick={(k) => onSelect({ type: "category", key: k })} />
      )}
      {type !== "list" && topLists.length > 0 && (
        <DetailList title="Listas" rows={topLists.map(([k, l]) => ({ key: k, label: l.label, emoji: "🗂️", total: l.total }))}
          onPick={(k) => onSelect({ type: "list", key: k })} />
      )}
      {type !== "store" && topStores.some(([k]) => k !== NO_STORE) && (
        <DetailList title="Mercados" rows={topStores.filter(([k]) => k !== NO_STORE).map(([k, s]) => ({ key: k, label: s.label, emoji: "🏬", total: s.total }))}
          onPick={(k) => onSelect({ type: "store", key: k })} />
      )}

      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
        Primeira compra em {firstDate.toLocaleDateString("pt-BR")} · última em {lastDate.toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}

function DetailList({ title, rows, onPick }: {
  title: string;
  rows: { key: string; label: string; emoji: string; total: number; sub?: string }[];
  onPick: (key: string) => void;
}) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
        {rows.map((r) => (
          <div
            key={r.key}
            onClick={() => onPick(r.key)}
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.3rem", borderRadius: 8, cursor: "pointer" }}
          >
            <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{r.emoji}</span>
            <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            {r.sub && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.sub}</span>}
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--brand)", flexShrink: 0 }}>{fmt(r.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
