"use client";
import { MdLock } from "react-icons/md";
import { BADGES } from "@/lib/estudos/gamification";
import type { SubjectRankEntry } from "@/lib/estudos/gamification";

const medal = ["🥇", "🥈", "🥉"];

export function BadgesGrid({ unlockedKeys }: { unlockedKeys: Set<string> }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
        🏅 Conquistas
      </h3>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
        {unlockedKeys.size}/{BADGES.length} desbloqueadas
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: "0.6rem" }}>
        {BADGES.map((b) => {
          const unlocked = unlockedKeys.has(b.key);
          return (
            <div
              key={b.key}
              title={b.desc}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                padding: "0.7rem 0.4rem", borderRadius: 12,
                background: unlocked ? "var(--bg-secondary)" : "transparent",
                border: `1.5px solid ${unlocked ? "transparent" : "var(--border)"}`,
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: "1.6rem", position: "relative" }}>
                {unlocked ? b.emoji : <MdLock size={22} color="var(--text-muted)" />}
              </div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: unlocked ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>
                {b.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SubjectLeaderboard({ ranking }: { ranking: SubjectRankEntry[] }) {
  if (ranking.length === 0) return null;
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.9rem" }}>
        🏆 Ranking por matéria
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {ranking.map((r, idx) => (
          <div key={r.subjectId} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ width: 20, textAlign: "center", fontSize: "0.9rem" }}>{medal[idx] ?? idx + 1}</span>
            <span style={{ fontSize: "1rem" }}>{r.emoji}</span>
            <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>nível {r.level}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)", minWidth: 50, textAlign: "right" }}>{r.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
