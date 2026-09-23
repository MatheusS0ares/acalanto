"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdHome, MdAttachMoney, MdDescription, MdShoppingCart,
  MdCheckBox, MdCalendarMonth, MdFavorite, MdDirectionsCar,
  MdContactPhone, MdKitchen, MdSettings, MdLogout, MdClose,
  MdPeople, MdRestaurant, MdBuild, MdLock, MdPhotoLibrary, MdPets,
  MdAdminPanelSettings,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { key: "inicio", href: "/dashboard", icon: MdHome, label: "Início", group: "" },
  { key: "financeiro", href: "/dashboard/financeiro", icon: MdAttachMoney, label: "Financeiro", group: "Casa" },
  { key: "documentos", href: "/dashboard/documentos", icon: MdDescription, label: "Documentos", group: "Casa" },
  { key: "mantimentos", href: "/dashboard/mantimentos", icon: MdKitchen, label: "Mantimentos", group: "Casa" },
  { key: "compras", href: "/dashboard/compras", icon: MdShoppingCart, label: "Compras", group: "Casa" },
  { key: "cardapio", href: "/dashboard/cardapio", icon: MdRestaurant, label: "Cardápio", group: "Casa" },
  { key: "reformas", href: "/dashboard/reformas", icon: MdBuild, label: "Obras", group: "Casa" },
  { key: "tarefas", href: "/dashboard/tarefas", icon: MdCheckBox, label: "Tarefas", group: "Família" },
  { key: "calendario", href: "/dashboard/calendario", icon: MdCalendarMonth, label: "Calendário", group: "Família" },
  { key: "saude", href: "/dashboard/saude", icon: MdFavorite, label: "Saúde", group: "Família" },
  { key: "pets", href: "/dashboard/pets", icon: MdPets, label: "Pets", group: "Família" },
  { key: "memorias", href: "/dashboard/memorias", icon: MdPhotoLibrary, label: "Memórias", group: "Família" },
  { key: "veiculos", href: "/dashboard/veiculos", icon: MdDirectionsCar, label: "Veículos", group: "Outros" },
  { key: "contatos", href: "/dashboard/contatos", icon: MdContactPhone, label: "Emergência", group: "Outros" },
  { key: "senhas", href: "/dashboard/senhas", icon: MdLock, label: "Cofre", group: "Outros" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  familyName?: string;
  disabledTabs?: string[];
  isSuperAdmin?: boolean;
}

export function Sidebar({ open, onClose, familyName, disabledTabs = [], isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleNavItems = navItems.filter((item) => item.key === "inicio" || !disabledTabs.includes(item.key));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        style={{
          width: 240,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          transition: "transform 0.25s ease",
          zIndex: 50,
        }}
        className={`sidebar ${open ? "sidebar-open" : ""}`}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #7aab8a, #5a8b6a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdHome size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                Casa Portal
              </div>
              {familyName && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  {familyName}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="close-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "0.25rem",
              display: "none",
            }}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, minHeight: 0, padding: "0.75rem 0.5rem", overflowY: "auto" }}>
          {(() => {
            let lastGroup = "";
            return visibleNavItems.map(({ href, icon: Icon, label, group }) => {
              const showHeader = group && group !== lastGroup;
              if (group) lastGroup = group;
              return (
                <div key={href}>
                  {showHeader && (
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.75rem 0.75rem 0.25rem" }}>
                      {group}
                    </div>
                  )}
                  <Link
                    href={href}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.5rem",
                      marginBottom: "0.1rem",
                      textDecoration: "none",
                      color: isActive(href) ? "var(--brand)" : "var(--text-secondary)",
                      background: isActive(href) ? "var(--brand-bg)" : "transparent",
                      fontWeight: isActive(href) ? 600 : 400,
                      fontSize: "0.85rem",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                </div>
              );
            });
          })()}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {isSuperAdmin && (
            <Link
              href="/dashboard/admin"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: isActive("/dashboard/admin") ? "var(--brand)" : "#c99a40",
                background: isActive("/dashboard/admin") ? "var(--brand-bg)" : "transparent",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "0.125rem",
              }}
            >
              <MdAdminPanelSettings size={20} />
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/familia"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.125rem",
            }}
          >
            <MdPeople size={20} />
            Minha Família
          </Link>
          <Link
            href="/dashboard/configuracoes"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.125rem",
            }}
          >
            <MdSettings size={20} />
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              color: "#f87171",
              fontSize: "0.875rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <MdLogout size={20} />
            Sair
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            height: -webkit-fill-available;
            height: 100dvh;
            max-height: 100dvh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            transform: translateX(-100%);
          }
          .sidebar-open {
            transform: translateX(0) !important;
          }
          .sidebar-footer {
            padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px)) !important;
          }
          .mobile-overlay { display: block !important; }
          .close-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
