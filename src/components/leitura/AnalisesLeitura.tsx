"use client";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MdTrendingUp, MdTrendingDown, MdMenuBook, MdAutoStories } from "react-icons/md";
import type { Book, FamilyMember } from "@/types";

interface Props {
  books: Book[];
  members: FamilyMember[];
}

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const pieColors = ["#7aab8a", "#a07acc", "#5aabb0", "#c99a40", "#d06a6a", "#88aa40", "#6a9fd4", "#c07898"];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

export function AnalisesLeitura({ books, members }: Props) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const readerName = (id: string | null) => (id && memberMap.get(id)?.name) || "Família";

  const finishedAll = useMemo(
    () => books.filter((b) => b.status === "lido" && b.finished_at),
    [books]
  );

  const years = useMemo(() => {
    const set = new Set<number>(finishedAll.map((b) => Number(b.finished_at!.slice(0, 4))));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [finishedAll]);

  const [year, setYear] = useState(new Date().getFullYear());
  const [readerFilter, setReaderFilter] = useState<string>("all");

  const byReader = readerFilter === "all" ? books : books.filter((b) => b.reader_id === readerFilter);
  const finished = byReader.filter((b) => b.status === "lido" && b.finished_at);

  const finishedThisYear = finished.filter((b) => b.finished_at!.startsWith(String(year)));
  const finishedLastYear = finished.filter((b) => b.finished_at!.startsWith(String(year - 1)));

  const booksCount = finishedThisYear.length;
  const booksCountDelta = finishedLastYear.length > 0
    ? ((booksCount - finishedLastYear.length) / finishedLastYear.length) * 100
    : null;

  const totalPages = finishedThisYear.reduce((s, b) => s + (b.pages ?? 0), 0);
  const ratedBooks = finishedThisYear.filter((b) => b.rating != null);
  const avgRating = ratedBooks.length ? ratedBooks.reduce((s, b) => s + (b.rating ?? 0), 0) / ratedBooks.length : null;

  const pacedBooks = finishedThisYear.filter((b) => b.started_at && b.finished_at && daysBetween(b.started_at, b.finished_at) >= 0);
  const avgPaceDays = pacedBooks.length
    ? pacedBooks.reduce((s, b) => s + daysBetween(b.started_at!, b.finished_at!), 0) / pacedBooks.length
    : null;

  const monthlyChart = Array.from({ length: 12 }, (_, idx) => {
    const count = finishedThisYear.filter((b) => Number(b.finished_at!.slice(5, 7)) - 1 === idx).length;
    return { label: monthLabels[idx], count };
  });

  const genreTotals = new Map<string, { label: string; count: number }>();
  finishedThisYear.forEach((b) => {
    const key = b.genre ? normalize(b.genre) : "__sem_genero__";
    const g = genreTotals.get(key) ?? { label: b.genre?.trim() || "Sem gênero", count: 0 };
    g.count += 1;
    genreTotals.set(key, g);
  });
  const genreChart = Array.from(genreTotals.values()).sort((a, b) => b.count - a.count);

  const memberChart = readerFilter === "all" && members.length > 1
    ? members.map((m) => ({
        name: m.name,
        count: finished.filter((b) => b.reader_id === m.id && b.finished_at!.startsWith(String(year))).length,
      })).filter((m) => m.count > 0).sort((a, b) => b.count - a.count)
    : [];

  const currentlyReading = [...byReader.filter((b) => b.status === "lendo")]
    .sort((a, b) => (a.started_at ?? "").localeCompare(b.started_at ?? ""));

  const backlogCount = byReader.filter((b) => b.status === "quero_ler").length;
  const allTimeFinished = finished.length;
  const allTimePages = finished.reduce((s, b) => s + (b.pages ?? 0), 0);

  if (books.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Ainda não há dados suficientes
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Adicione livros na aba Estante pra ver seus indicadores aqui
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: "0.35rem 0.8rem", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontWeight: 700,
                background: year === y ? "var(--brand)" : "var(--bg-secondary)",
                color: year === y ? "#fff" : "var(--text-muted)",
              }}
            >
              {y}
            </button>
          ))}
        </div>
        {members.length > 1 && (
          <select value={readerFilter} onChange={(e) => setReaderFilter(e.target.value)} className="input-field" style={{ width: "auto", fontSize: "0.82rem", cursor: "pointer" }}>
            <option value="all">Toda a família</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Livros lidos em {year}</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{booksCount}</div>
          {booksCountDelta != null && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem", color: booksCountDelta >= 0 ? "#7aab8a" : "#d06a6a", fontSize: "0.75rem", fontWeight: 700 }}>
              {booksCountDelta >= 0 ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
              {Math.abs(booksCountDelta).toFixed(0)}% vs {year - 1}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Páginas lidas</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{totalPages.toLocaleString("pt-BR")}</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Nota média</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{avgRating != null ? avgRating.toFixed(1) : "—"}</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Ritmo médio</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{avgPaceDays != null ? `${Math.round(avgPaceDays)}d` : "—"}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>por livro</div>
        </div>
      </div>

      {/* Livros por mês */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Livros concluídos por mês em {year}
        </h3>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#7aab8a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Por gênero */}
      {genreChart.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
            Por gênero em {year}
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 130, height: 130, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={genreChart} dataKey="count" nameKey="label" innerRadius={32} outerRadius={60} paddingAngle={2}>
                    {genreChart.map((g, idx) => <Cell key={g.label} fill={pieColors[idx % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {genreChart.map((g, idx) => (
                <div key={g.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: pieColors[idx % pieColors.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{g.label}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Por membro */}
      {memberChart.length > 1 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
            Quem leu mais em {year}
          </h3>
          <div style={{ width: "100%", height: Math.max(100, memberChart.length * 44) }}>
            <ResponsiveContainer>
              <BarChart data={memberChart} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#7aab8a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lendo agora */}
      {currentlyReading.length > 0 && (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MdAutoStories size={18} /> Lendo agora
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
            {currentlyReading.length} {currentlyReading.length === 1 ? "livro em andamento" : "livros em andamento"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {currentlyReading.map((b) => {
              const days = b.started_at ? Math.round(daysBetween(b.started_at, new Date().toISOString().slice(0, 10))) : null;
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>📖</span>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.title}{members.length > 1 ? ` · ${readerName(b.reader_id)}` : ""}
                  </span>
                  {days != null && (
                    <span style={{ fontSize: "0.72rem", color: days > 30 ? "#d06a6a" : "var(--text-muted)", fontWeight: 700, flexShrink: 0 }}>
                      {days}d lendo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo geral */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MdMenuBook size={16} color="var(--brand)" />
          <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{allTimeFinished}</strong> livros lidos desde sempre
          </span>
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{allTimePages.toLocaleString("pt-BR")}</strong> páginas no total
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{backlogCount}</strong> na fila pra ler
        </div>
      </div>
    </div>
  );
}
