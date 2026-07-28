"use client";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const incomeData = [7200, 8500, 7800, 9200, 8100, 8500];
const expenseData = [5100, 6200, 5800, 7100, 4900, 5050];

const categoryData = [
  { name: "Alimentação", value: 1650, color: "#22c55e" },
  { name: "Casa", value: 2200, color: "#3b82f6" },
  { name: "Transporte", value: 720, color: "#f59e0b" },
  { name: "Lazer", value: 380, color: "#8b5cf6" },
  { name: "Saúde", value: 67, color: "#ef4444" },
  { name: "Outros", value: 33, color: "#6b7280" },
];

const total = categoryData.reduce((s, d) => s + d.value, 0);

export function FinancialChart() {
  const maxVal = Math.max(...incomeData, ...expenseData);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Barras */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
          Receitas vs Gastos — últimos 6 meses
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: 160 }}>
          {months.map((month, i) => (
            <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", height: "100%" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "3px", width: "100%" }}>
                <div
                  style={{
                    flex: 1,
                    height: `${(incomeData[i] / maxVal) * 100}%`,
                    background: "#22c55e",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    opacity: i === months.length - 1 ? 1 : 0.6,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: `${(expenseData[i] / maxVal) * 100}%`,
                    background: "#f87171",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    opacity: i === months.length - 1 ? 1 : 0.6,
                  }}
                />
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{month}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#22c55e" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Receitas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#f87171" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gastos</span>
          </div>
        </div>
      </div>

      {/* Gastos por categoria */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
          Gastos por categoria — Junho
        </h3>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* SVG Pizza */}
          <div style={{ flexShrink: 0 }}>
            <svg width={120} height={120} viewBox="0 0 42 42">
              {(() => {
                let offset = 0;
                return categoryData.map(({ name, value, color }) => {
                  const pct = (value / total) * 100;
                  const dash = (pct / 100) * 131.9;
                  const el = (
                    <circle
                      key={name}
                      cx="21" cy="21" r="15.9"
                      fill="none"
                      stroke={color}
                      strokeWidth="5"
                      strokeDasharray={`${dash} ${131.9 - dash}`}
                      strokeDashoffset={-offset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
              <circle cx="21" cy="21" r="13" fill="var(--bg-card)" />
              <text x="21" y="21" textAnchor="middle" dominantBaseline="middle" fontSize="5" fill="var(--text-muted)">Gastos</text>
            </svg>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {categoryData.map(({ name, value, color }) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)" }}>{name}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  R$ {value.toLocaleString("pt-BR")}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: 36, textAlign: "right" }}>
                  {((value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
