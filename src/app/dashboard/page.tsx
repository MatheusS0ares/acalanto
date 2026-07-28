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

interface Module {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
  color: string;
}

const modules: Module[] = [
  { href: "/dashboard/compras",     icon: MdShoppingCart,  label: "Lista de Compras", desc: "Adicione itens e marque o que já comprou",   color: "#a07acc", badge: "14 itens", badgeColor: "purple" },
  { href: "/dashboard/tarefas",     icon: MdCheckBox,      label: "Tarefas",          desc: "Veja e conclua as tarefas da casa",            color: "#5aabb0", badge: "5 para fazer", badgeColor: "blue" },
  { href: "/dashboard/mantimentos", icon: MdKitchen,       label: "Dispensa",         desc: "O que está em falta na despensa",              color: "#c99a40", badge: "3 em falta", badgeColor: "yellow" },
  { href: "/dashboard/financeiro",  icon: MdAttachMoney,   label: "Financeiro",       desc: "Gastos, entradas e planejamento do mês",      color: "#7aab8a" },
  { href: "/dashboard/calendario",  icon: MdCalendarMonth, label: "Calendário",       desc: "Compromissos e eventos da família",            color: "#c07898" },
  { href: "/dashboard/saude",       icon: MdFavorite,      label: "Saúde",            desc: "Consultas, medicamentos e histórico",          color: "#d06a6a" },
  { href: "/dashboard/cardapio",    icon: MdRestaurant,    label: "Cardápio",         desc: "O que vai ter de almoço e jantar",             color: "#d07a6a" },
  { href: "/dashboard/pets",        icon: MdPets,          label: "Pets",             desc: "Vacinas, vet e cuidados dos animais",          color: "#88aa40" },
  { href: "/dashboard/memorias",    icon: MdPhotoLibrary,  label: "Memórias",         desc: "Fotos e momentos especiais da família",        color: "#c07898" },
  { href: "/dashboard/documentos",  icon: MdDescription,   label: "Documentos",       desc: "Guarde documentos importantes com segurança", color: "#6a9fd4" },
  { href: "/dashboard/reformas",    icon: MdBuild,         label: "Obras",            desc: "Reformas e melhorias da casa",                 color: "#7888d0" },
  { href: "/dashboard/veiculos",    icon: MdDirectionsCar, label: "Veículos",         desc: "IPVA, revisão e seguro dos carros",            color: "#8a96a0" },
  { href: "/dashboard/contatos",    icon: MdContactPhone,  label: "Emergência",       desc: "Telefones e contatos importantes",             color: "#d07a6a" },
  { href: "/dashboard/senhas",      icon: MdLock,          label: "Cofre de Senhas",  desc: "Senhas guardadas com segurança",               color: "#7888d0" },
];

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
        .from("family_members")
        .select("name")
        .eq("user_id", user.id)
        .single();
      if (member) setMemberName(member.name.split(" ")[0]);
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Saudação */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
          {greeting}, {memberName} 👋
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alerta */}
      <div style={{
        background: "rgba(201,154,64,0.1)", border: "1.5px solid rgba(201,154,64,0.3)",
        borderRadius: 14, padding: "1rem 1.125rem",
        display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2rem",
      }}>
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
          <div key={label} className="card" style={{ padding: "1.25rem" }}>
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

      {/* Módulos */}
      <div>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
            O que você quer fazer?
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Toque em qualquer área abaixo para entrar.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {modules.map(({ href, icon: Icon, label, desc, badge, badgeColor, color }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  padding: "1.375rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                  minHeight: 130,
                  borderLeft: `4px solid ${color}`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={28} color={color} />
                  </div>
                  {badge && (
                    <span className={`badge badge-${badgeColor}`}>{badge}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
