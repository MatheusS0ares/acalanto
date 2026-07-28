"use client";
import { MdMenu, MdLightMode, MdDarkMode, MdNotifications, MdSearch } from "react-icons/md";
import { useTheme } from "./ThemeProvider";

interface TopBarProps {
  onMenuClick: () => void;
  memberName?: string;
}

export function TopBar({ onMenuClick, memberName }: TopBarProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      style={{
        height: 60,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 1rem",
        gap: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="menu-btn"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          padding: "0.375rem",
          borderRadius: "0.375rem",
          display: "none",
        }}
      >
        <MdMenu size={24} />
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <div style={{ position: "relative" }}>
          <MdSearch
            size={18}
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="input-field"
            style={{ paddingLeft: "2.25rem", paddingTop: "0.45rem", paddingBottom: "0.45rem" }}
          />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Notificações */}
      <button
        style={{
          background: "none",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--text-secondary)",
          padding: "0.375rem",
          borderRadius: "0.5rem",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <MdNotifications size={20} />
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--brand)",
          }}
        />
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          background: "none",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--text-secondary)",
          padding: "0.375rem",
          borderRadius: "0.5rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {theme === "dark" ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
      </button>

      {/* Avatar */}
      {memberName && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7aab8a, #5a8b6a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "white",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          {memberName.charAt(0).toUpperCase()}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
