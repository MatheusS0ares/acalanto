"use client";
import { useState } from "react";
import { MdLocalFireDepartment, MdEdit, MdClose } from "react-icons/md";
import type { GameState } from "@/lib/estudos/gamification";
import { setDailyGoal } from "@/lib/estudos/gamification";

interface Props {
  game: GameState;
  accent: string;
  onGoalChange: (n: number) => void;
}

export function GameBar({ game, accent, onGoalChange }: Props) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(game.dailyGoal));

  const goalDone = Math.min(game.todayCount, game.dailyGoal);
  const goalPct = game.dailyGoal ? Math.round((goalDone / game.dailyGoal) * 100) : 0;
  const ringDeg = Math.round((goalPct / 100) * 360);
  const goalReached = game.todayCount >= game.dailyGoal;

  function saveGoal() {
    const n = Math.max(1, parseInt(goalInput, 10) || 10);
    setDailyGoal(n);
    onGoalChange(n);
    setEditingGoal(false);
  }

  return (
    <div
      className="card game-bar-pop"
      style={{
        padding: "0.85rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center",
        gap: "1rem", flexWrap: "wrap", border: `1.5px solid ${accent}33`,
        background: `linear-gradient(135deg, ${accent}10, transparent)`,
      }}
    >
      {/* Streak */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <MdLocalFireDepartment size={22} color={game.streak > 0 ? "#e08a3c" : "var(--text-muted)"} className={game.streak > 0 ? "flame-pulse" : ""} />
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{game.streak}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>dias seguidos</div>
        </div>
      </div>

      <div style={{ width: 1, height: 32, background: "var(--border)" }} />

      {/* XP / nível */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: accent }}>Nível {game.level.level} · {game.levelLabel}</span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>{game.level.xpIntoLevel}/{game.level.xpForNextLevel} XP</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round(game.level.progress * 100)}%`, background: accent, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
      </div>

      <div style={{ width: 1, height: 32, background: "var(--border)" }} />

      {/* Meta diária */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0, position: "relative",
            background: `conic-gradient(${goalReached ? "#7aab8a" : accent} ${ringDeg}deg, var(--bg-secondary) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>
            {goalReached ? "✅" : "🎯"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{game.todayCount}/{game.dailyGoal}</div>
          <button onClick={() => { setGoalInput(String(game.dailyGoal)); setEditingGoal(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--text-muted)", fontSize: "0.62rem", fontWeight: 600 }}>
            meta hoje <MdEdit size={10} />
          </button>
        </div>
      </div>

      {editingGoal && (
        <div onClick={(e) => e.target === e.currentTarget && setEditingGoal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1.5rem" }}>
          <div className="card" style={{ padding: "1.25rem", width: "100%", maxWidth: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Meta diária</h3>
              <button onClick={() => setEditingGoal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={18} /></button>
            </div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Questões por dia</label>
            <input type="number" min={1} value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="input-field" style={{ marginBottom: "0.9rem" }} />
            <button onClick={saveGoal} className="btn-primary" style={{ width: "100%", justifyContent: "center", background: accent }}>Salvar</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .flame-pulse { animation: flamePulse 1.6s ease-in-out infinite; }
        @keyframes gameBarPop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .game-bar-pop { animation: gameBarPop 0.35s ease both; }
      `}</style>
    </div>
  );
}
