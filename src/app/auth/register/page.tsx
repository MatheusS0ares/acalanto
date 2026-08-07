"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MdHome, MdEmail, MdLock, MdPerson, MdFamilyRestroom,
  MdVisibility, MdVisibilityOff, MdArrowBack, MdCheck
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/family/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, familyName, email, password, inviteCode }),
    });
    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Conta criada! Faça login para continuar.");
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <button
          onClick={() => step === 2 ? setStep(1) : router.push("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85rem",
            marginBottom: "2rem",
            padding: 0,
          }}
        >
          <MdArrowBack size={16} /> {step === 2 ? "Voltar" : "Página inicial"}
        </button>

        {/* Progress */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          {([1, 2] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: step >= s ? "var(--brand)" : "var(--border)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: step === 1 ? "linear-gradient(135deg, #7aab8a, #5a8b6a)" : "linear-gradient(135deg, #6a9fd4, #4a7fb4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              transition: "background 0.3s",
            }}
          >
            {step === 1 ? <MdFamilyRestroom size={28} color="white" /> : <MdHome size={28} color="white" />}
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            {step === 1 ? "Quem é você?" : "Configurar sua família"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {step === 1 ? "Passo 1 de 2 — Dados pessoais" : "Passo 2 de 2 — Dados da família"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {step === 1 && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                  Código de convite
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código que você recebeu"
                  required
                  className="input-field"
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  O cadastro é só pra quem recebeu um código — sua família fica 100% separada das demais
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                  Seu nome
                </label>
                <div style={{ position: "relative" }}>
                  <MdPerson size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você se chama?"
                    required
                    className="input-field"
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

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

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                  Senha
                </label>
                <div style={{ position: "relative" }}>
                  <MdLock size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    minLength={8}
                    required
                    className="input-field"
                    style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                  >
                    {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>
                  Nome da família
                </label>
                <div style={{ position: "relative" }}>
                  <MdFamilyRestroom size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Ex: Família Silva"
                    required
                    className="input-field"
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  Você poderá convidar outros membros depois
                </p>
              </div>

              <div
                className="card"
                style={{ padding: "1rem", background: "rgba(34, 197, 94, 0.06)", borderColor: "rgba(34, 197, 94, 0.2)" }}
              >
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  Você vai ser o administrador e terá acesso a:
                </p>
                {["Controle financeiro", "Gestão de documentos", "Lista de compras", "Calendário familiar", "E muito mais..."].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <MdCheck size={14} color="var(--brand)" />
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            {loading ? "Criando..." : step === 1 ? "Continuar" : "Criar minha família"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/auth/login" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
