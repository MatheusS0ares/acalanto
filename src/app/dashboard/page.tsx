"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdAttachMoney, MdDescription, MdShoppingCart,
  MdCheckBox, MdCalendarMonth, MdFavorite, MdDirectionsCar,
  MdContactPhone, MdKitchen, MdTrendingUp, MdTrendingDown,
  MdArrowForward, MdWarning, MdRestaurant, MdBuild,
  MdLock, MdPhotoLibrary, MdPets,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

type Group = "casa" | "familia" | "seguranca";

interface Module {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  color: string;
  group: Group;
  quick?: { label: string };
}

const modules: Module[] = [
  { href: "/dashboard/compras",     icon: MdShoppingCart,  label: "Lista de Compras", desc: "Adicione itens e marque o que já comprou",   color: "#a07acc", badge: "14 itens", badgeColor: "purple", group: "casa", quick: { label: "Comprar algo" } },
  { href: "/dashboard/financeiro",  icon: MdAttachMoney,   label: "Financeiro",       desc: "Gastos, entradas e planejamento do mês",      color: "#7aab8a", group: "casa", quick: { label: "Registrar gasto" } },
  { href: "/dashboard/mantimentos", icon: MdKitchen,       label: "Dispensa",         desc: "O que está em falta na despensa",              color: "#c99a40", badge: "3 em falta", badgeColor: "yellow", group: "casa" },
  { href: "/dashboard/cardapio",    icon: MdRestaurant,    label: "Cardápio",         desc: "O que vai ter de almoço e jantar",             color: "#d07a6a", group: "casa", quick: { label: "Ver cardápio" } },
  { href: "/dashboard/reformas",    icon: MdBuild,         label: "Obras",            desc: "Reformas e melhorias da casa",                 color: "#7888d0", group: "casa" },
  { href: "/dashboard/tarefas",     icon: MdCheckBox,      label: "Tarefas",          desc: "Veja e conclua as tarefas da casa",            color: "#5aabb0", badge: "5 para fazer", badgeColor: "blue", group: "familia", quick: { label: "Nova tarefa" } },
  { href: "/dashboard/calendario",  icon: MdCalendarMonth, label: "Calendário",       desc: "Compromissos e eventos da família",            color: "#c07898", group: "familia" },
  { href: "/dashboard/saude",       icon: MdFavorite,      label: "Saúde",            desc: "Consultas, medicamentos e histórico",          color: "#d06a6a", group: "familia" },
  { href: "/dashboard/pets",        icon: MdPets,          label: "Pets",             desc: "Vacinas, vet e cuidados dos animais",          color: "#88aa40", group: "familia" },
  { href: "/dashboard/memorias",    icon: MdPhotoLibrary,  label: "Memórias",         desc: "Fotos e momentos especiais da família",        color: "#c07898", group: "familia" },
  { href: "/dashboard/documentos",  icon: MdDescription,   label: "Documentos",       desc: "Guarde documentos importantes com segurança", color: "#6a9fd4", group: "seguranca" },
  { href: "/dashboard/veiculos",    icon: MdDirectionsCar, label: "Veículos",         desc: "IPVA, revisão e seguro dos carros",            color: "#8a96a0", group: "seguranca" },
  { href: "/dashboard/contatos",    icon: MdContactPhone,  label: "Emergência",       desc: "Telefones e contatos importantes",             color: "#d07a6a", group: "seguranca" },
  { href: "/dashboard/senhas",      icon: MdLock,          label: "Cofre de Senhas",  desc: "Senhas guardadas com segurança",               color: "#7888d0", group: "seguranca" },
];

const quickAccess = modules.filter((m) => m.quick);

const groupInfo: Record<Group, { title: string; subtitle: string }> = {
  casa:       { title: "🏠 Casa",                    subtitle: "O dia a dia, sem complicação" },
  familia:    { title: "👨‍👩‍👧 Família",              subtitle: "Cuidando de quem você ama" },
  seguranca:  { title: "🔒 Documentos & Segurança",  subtitle: "Tudo guardado em um só lugar" },
};

export default function DashboardPage() {
  const [memberName, setMemberName] = useState("Usuário");
  const [greeting, setGreeting] = useState("Bom dia");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase
        .from("acalanto_family_members")
        .select("name")
        .eq("user_id", user.id)
        .single();
      if (member) setMemberName(member.name.split(" ")[0]);
    }
    load();
  }, []);

  let delayStep = 0;
  const nextDelay = () => (delayStep++ * 45);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Saudação */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
          {greeting}, {memberName} 👋
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
          Tudo o que a casa precisa, em um lugar só. Toque em qualquer coisa abaixo — é bem simples 💛
        </p>
      </div>

      {/* Acesso rápido */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          O que você precisa agora?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
          {quickAccess.map(({ href, icon: Icon, color, quick }, i) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div
                className="dash-fade quick-btn"
                style={{
                  animationDelay: `${nextDelay()}ms`,
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  borderRadius: "18px",
                  padding: "1.1rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: `0 6px 18px ${color}40`,
                  minHeight: 100,
                  justifyContent: "center",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={22} color="#fff" />
                </div>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
                  {quick!.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerta */}
      <div
        className="dash-fade"
        style={{
          animationDelay: `${nextDelay()}ms`,
          background: "rgba(201,154,64,0.1)", border: "1.5px solid rgba(201,154,64,0.3)",
          borderRadius: 14, padding: "1rem 1.125rem",
          display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2rem",
        }}
      >
        <MdWarning size={24} color="#c99a40" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.95rem", color: "#c99a40", fontWeight: 700 }}>⚠️ 3 itens em falta na dispensa</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>IPVA do carro vence em 15 dias</div>
        </div>
        <Link href="/dashboard/mantimentos" style={{
          fontSize: "0.85rem", color: "#c99a40", textDecoration: "none",
          fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.25rem",
        }}>
          Ver tudo <MdArrowForward size={16} />
        </Link>
      </div>

      {/* Números rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "2.25rem" }}>
        {[
          { label: "Saldo do mês",  value: "R$ 3.450", sub: "+12% vs. mês passado", icon: MdAttachMoney,  color: "#7aab8a", trend: "up" as const },
          { label: "Gastos hoje",   value: "R$ 127",   sub: "3 transações",          icon: MdTrendingDown, color: "#d06a6a", trend: "down" as const },
          { label: "Tarefas feitas", value: "7 de 12",  sub: "Esta semana",           icon: MdCheckBox,    color: "#5aabb0" },
          { label: "Lista de compras", value: "14 itens", sub: "Lista aberta",        icon: MdShoppingCart, color: "#a07acc" },
        ].map(({ label, value, sub, icon: Icon, color, trend }) => (
          <div key={label} className="card dash-fade" style={{ padding: "1.25rem", animationDelay: `${nextDelay()}ms` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color={color} />
              </div>
              {trend && (
                <span style={{ color: trend === "up" ? "#7aab8a" : "#d06a6a" }}>
                  {trend === "up" ? <MdTrendingUp size={18} /> : <MdTrendingDown size={18} />}
                </span>
              )}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Módulos, agrupados por assunto */}
      {(["casa", "familia", "seguranca"] as Group[]).map((groupKey) => (
        <section key={groupKey} style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
              {groupInfo[groupKey].title}
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {groupInfo[groupKey].subtitle}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {modules.filter((m) => m.group === groupKey).map(({ href, icon: Icon, label, desc, badge, badgeColor, color }) => (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  className="card dash-fade dash-card"
                  style={{
                    animationDelay: `${nextDelay()}ms`,
                    padding: "1.375rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.875rem",
                    minHeight: 138,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: 16,
                      background: `linear-gradient(135deg, ${color}30, ${color}12)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={28} color={color} />
                    </div>
                    {badge && (
                      <span className={`badge badge-${badgeColor}`}>{badge}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.02rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <style>{`
        @keyframes dashFadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-fade {
          animation: dashFadeInUp 0.5s ease both;
        }
        .dash-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .dash-card:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow: var(--shadow-lg);
        }
        .dash-card:active {
          transform: translateY(-1px) scale(0.98);
        }
        .quick-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .quick-btn:hover {
          transform: translateY(-2px);
        }
        .quick-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
