"use client";
import { useEffect, useState } from "react";
import { MdCheckCircle, MdCancel } from "react-icons/md";

export interface FeedbackEvent {
  id: number;
  correct: boolean;
  xp: number;
}

interface Props {
  event: FeedbackEvent | null;
  onDone: () => void;
}

const PRAISE_CERTO = ["Mandou bem!", "Isso aí!", "Na mosca!", "Show de bola!", "É isso mesmo!"];
const PRAISE_ERRADO = ["Quase lá!", "Bora revisar isso.", "Anota esse pra não esquecer.", "Faz parte, continua!"];

export function AnswerFeedback({ event, onDone }: Props) {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (!event) return;
    const pool = event.correct ? PRAISE_CERTO : PRAISE_ERRADO;
    setPhrase(pool[Math.floor(Math.random() * pool.length)]);
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  if (!event) return null;

  return (
    <div
      style={{
        position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 250, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
      }}
    >
      <div
        className="answer-feedback-pop"
        style={{
          background: event.correct ? "#2a5a3a" : "#5a2a2a", color: "#fff", borderRadius: "999px",
          padding: "0.7rem 1.4rem", display: "flex", alignItems: "center", gap: "0.55rem",
          boxShadow: "0 10px 28px rgba(0,0,0,0.45)", fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap",
        }}
      >
        {event.correct ? <MdCheckCircle size={22} className="feedback-bounce" /> : <MdCancel size={22} className="feedback-shake" />}
        {phrase}
        {event.correct && <span style={{ opacity: 0.85, fontSize: "0.8rem", fontWeight: 800 }}>+{event.xp} XP</span>}
      </div>

      <style>{`
        @keyframes feedbackPop {
          0% { opacity: 0; transform: translateY(-10px) scale(0.85); }
          15% { opacity: 1; transform: translateY(0) scale(1.05); }
          25% { transform: scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px) scale(0.96); }
        }
        .answer-feedback-pop { animation: feedbackPop 1.1s ease both; }
        @keyframes feedbackBounce {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.3); }
          55% { transform: scale(0.9); }
        }
        .feedback-bounce { animation: feedbackBounce 0.5s ease; }
        @keyframes feedbackShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .feedback-shake { animation: feedbackShake 0.4s ease; }
      `}</style>
    </div>
  );
}
