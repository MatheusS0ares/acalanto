"use client";
import { useMemo, useState } from "react";
import { MdClose, MdCheck, MdLink, MdLinkOff } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingItem, ProductAlias } from "@/types";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

interface Row {
  key: string;
  label: string;
  emoji: string;
  count: number;
  mergedInto: string | null;
}

interface Props {
  items: ShoppingItem[];
  aliases: ProductAlias[];
  familyId: string;
  onClose: () => void;
  onChanged: () => void;
}

export function ProductAliasManager({ items, aliases, familyId, onClose, onChanged }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [canonicalLabel, setCanonicalLabel] = useState("");
  const [canonicalEmoji, setCanonicalEmoji] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const aliasMap = useMemo(() => new Map(aliases.map((a) => [a.alias_name, a])), [aliases]);

  const rows = useMemo(() => {
    const map = new Map<string, Row>();
    items.forEach((i) => {
      const key = normalize(i.name);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      const a = aliasMap.get(key);
      map.set(key, {
        key,
        label: i.name,
        emoji: i.emoji ?? "📦",
        count: 1,
        mergedInto: a ? a.canonical_label : null,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items, aliasMap]);

  const filtered = search.trim()
    ? rows.filter((r) => normalize(r.label).includes(normalize(search)))
    : rows;

  const pickedForComposer = rows.filter((r) => selected.has(r.key));
  const bestPick = [...pickedForComposer].sort((a, b) => b.count - a.count)[0];

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function confirmMerge() {
    const label = (canonicalLabel || bestPick?.label || "").trim();
    if (!label || selected.size < 2 || !familyId) return;
    setSaving(true);
    const supabase = createClient();
    const emoji = (canonicalEmoji || bestPick?.emoji || "📦").trim() || "📦";
    const rowsToUpsert = Array.from(selected).map((aliasKey) => ({
      family_id: familyId,
      alias_name: aliasKey,
      canonical_name: normalize(label),
      canonical_label: label,
      canonical_emoji: emoji,
    }));
    const { error } = await supabase
      .from("acalanto_product_aliases")
      .upsert(rowsToUpsert, { onConflict: "family_id,alias_name" });
    setSaving(false);
    if (!error) {
      setSelected(new Set());
      setCanonicalLabel("");
      setCanonicalEmoji("");
      onChanged();
    }
  }

  async function unlink(key: string) {
    const supabase = createClient();
    await supabase.from("acalanto_product_aliases").delete().eq("family_id", familyId).eq("alias_name", key);
    onChanged();
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 350 }}
    >
      <div style={{ background: "var(--bg-card)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", padding: "1.5rem 1.25rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <MdLink size={20} /> Unificar itens duplicados
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <MdClose size={20} />
          </button>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.9rem" }}>
          Selecione dois ou mais nomes que são o mesmo produto (ex: &quot;ovo&quot; e &quot;ovos&quot;) pra juntá-los nas análises e relatórios. A lista de compras continua mostrando do jeito que você digitou.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="input-field"
          style={{ marginBottom: "0.8rem", fontSize: "0.85rem" }}
        />

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.1rem", marginBottom: "0.9rem" }}>
          {filtered.map((r) => (
            <div
              key={r.key}
              onClick={() => toggle(r.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.4rem", borderRadius: 10, cursor: "pointer",
                background: selected.has(r.key) ? "rgba(122,171,138,0.14)" : "transparent",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${selected.has(r.key) ? "var(--brand)" : "var(--border)"}`,
                background: selected.has(r.key) ? "var(--brand)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected.has(r.key) && <MdCheck size={13} color="white" />}
              </div>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>{r.emoji}</span>
              <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.label}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{r.count}x</span>
              {r.mergedInto && (
                <span
                  onClick={(e) => { e.stopPropagation(); unlink(r.key); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--brand)", background: "rgba(122,171,138,0.14)", borderRadius: 999, padding: "0.1rem 0.5rem", cursor: "pointer", flexShrink: 0 }}
                >
                  = {r.mergedInto} <MdLinkOff size={11} />
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Nada encontrado.
            </div>
          )}
        </div>

        {selected.size >= 2 && (
          <div style={{ padding: "0.9rem", background: "var(--bg-secondary)", borderRadius: 12 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Unificando {pickedForComposer.map((p) => `"${p.label}"`).join(", ")} em:
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={canonicalEmoji || bestPick?.emoji || "📦"}
                onChange={(e) => setCanonicalEmoji(e.target.value)}
                style={{ width: 46, textAlign: "center", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-card)", fontSize: "1.1rem" }}
              />
              <input
                type="text"
                value={canonicalLabel || bestPick?.label || ""}
                onChange={(e) => setCanonicalLabel(e.target.value)}
                placeholder="Nome final (ex: Ovo)"
                className="input-field"
                style={{ flex: 1 }}
              />
            </div>
            <button
              onClick={confirmMerge}
              disabled={saving}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.6rem" }}
            >
              <MdLink size={16} /> {saving ? "Unificando..." : `Unificar ${selected.size} itens`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
