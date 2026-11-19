"use client";
import { useState } from "react";
import Link from "next/link";
import { MdHome, MdEmail, MdArrowBack } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não deu pra enviar o e-mail agora. Tente de novo em alguns minutos.");
      return;
    }
    setSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "2rem" }}>
          <MdArrowBack size={16} /> Voltar pro login
        </Link>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #7aab8a, #5a8b6a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <MdHome size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            Esqueci minha senha
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Digite seu e-mail e mandamos um link pra você criar uma senha nova
          </p>
        </div>

        {sent ? (
          <div style={{ background: "rgba(122,171,138,0.12)", border: "1px solid rgba(122,171,138,0.35)", borderRadius: "0.75rem", padding: "1rem 1.1rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>
            Se <strong>{email}</strong> tiver uma conta no Acalanto, enviamos um link de redefinição pra esse e-mail. Confira também a caixa de spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <MdEmail size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="input-field"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
