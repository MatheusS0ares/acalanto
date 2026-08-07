"use client";
import { useEffect, useState } from "react";
import {
  MdAdd, MdCheck, MdClose, MdDescription, MdEdit,
  MdContentCopy, MdShare, MdList, MdContentPaste, MdArrowBack,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingList, ShoppingItem } from "@/types";

interface Category {
  name: string;
  accent: string;
  emoji: string;
}

const categories: Category[] = [
  { name: "Carnes & Proteínas",   accent: "#d06a6a", emoji: "🥩" },
  { name: "Laticínios",           accent: "#c99a40", emoji: "🥛" },
  { name: "Mercearia",            accent: "#7aab8a", emoji: "🛒" },
  { name: "Snacks & Guloseimas",  accent: "#c07898", emoji: "🍿" },
  { name: "Frutas",               accent: "#88aa40", emoji: "🍎" },
  { name: "Limpeza",              accent: "#5aabb0", emoji: "🧹" },
  { name: "Outros",               accent: "#8a96a0", emoji: "📦" },
];
const categoryMap = new Map(categories.map((c) => [c.name, c]));
const units = ["unid", "kg", "g", "L", "ml", "cx", "pct"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const categoryKeywords: Record<string, string[]> = {
  "Frutas": ["maracuja", "mexerica", "abacaxi", "maca", "uva", "manga", "banana", "laranja", "limao", "melancia", "mamao", "pera", "morango", "tangerina", "goiaba", "kiwi"],
  "Laticínios": ["leite", "queijo", "iogurte", "manteiga", "requeijao", "creme de leite"],
  "Carnes & Proteínas": ["carne", "frango", "peixe", "linguica", "bacon", "hamburguer", "salsicha", "presunto", "file", "costela"],
  "Snacks & Guloseimas": ["pipoca", "biscoito", "bolacha", "chocolate", "bala", "gelatina", "salgadinho", "bolinho", "refrigerante", "doce", "monster", "energetico", "refri"],
  "Limpeza": ["sabao", "desinfetante", "detergente", "sanitaria", "amaciante", "bucha", "esponja", "papel toalha", "papel higienico", "alcool", "veja"],
  "Mercearia": ["arroz", "feijao", "macarrao", "farinha", "acucar", "sal", "oleo", "molho", "extrato", "cafe", "achocolatado", "nescau", "pao", "sardinha", "atum", "ovo"],
};

function guessCategory(name: string): string {
  const n = normalize(name);
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (kw.includes(" ")) { if (n.includes(kw)) return cat; continue; }
      if (words.some((w) => w === kw || w === `${kw}s`)) return cat;
    }
  }
  return "Outros";
}

interface BulkRow {
  name: string;
  quantity: number;
  category: string;
}

function parseBulkText(text: string): BulkRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s*[xX]?\s+(.+)/);
      const quantity = match ? parseInt(match[1], 10) : 1;
      const name = match ? match[2].trim() : line;
      return { name, quantity, category: guessCategory(name) };
    });
}

export default function ComprasPage() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [listFilter, setListFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");

  const [priceModalItem, setPriceModalItem] = useState<ShoppingItem | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState("unid");
  const [newCategory, setNewCategory] = useState(categories[2].name);
  const [newListId, setNewListId] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const [newListModal, setNewListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  const [bulkModal, setBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<"paste" | "review">("paste");
  const [bulkText, setBulkText] = useState("");
  const [bulkListId, setBulkListId] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [reportModal, setReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    const supabase = createClient();

    // getUser()/a busca do membro podem falhar transitoriamente em redes ruins —
    // tenta algumas vezes antes de desistir.
    let user = null;
    for (let attempt = 0; attempt < 3 && !user; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500));
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    if (!user) { setLoading(false); setLoadFailed(true); return; }

    let me: { id: string; family_id: string } | null = null;
    for (let attempt = 0; attempt < 3 && !me; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500));
      const { data } = await supabase
        .from("acalanto_family_members")
        .select("id, family_id")
        .eq("user_id", user.id)
        .single();
      me = data;
    }
    if (!me) { setLoading(false); setLoadFailed(true); return; }

    setFamilyId(me.family_id);
    setMemberId(me.id);

    let { data: listRows, error: listsError } = await supabase
      .from("acalanto_shopping_lists")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at");

    if (listsError) showToast("Erro ao carregar listas — tente recarregar a página");

    if (!listsError && (!listRows || listRows.length === 0)) {
      const newListId = crypto.randomUUID();
      const { error: createListError } = await supabase
        .from("acalanto_shopping_lists")
        .insert({ id: newListId, family_id: me.family_id, name: "Nossa lista", created_by: me.id });
      if (createListError) {
        showToast("Erro ao criar a lista inicial — toque em + pra tentar de novo");
      } else {
        listRows = [{
          id: newListId, family_id: me.family_id, name: "Nossa lista",
          status: "open", created_by: me.id, created_at: new Date().toISOString(),
        }];
      }
    }

    setLists(listRows ?? []);
    setNewListId(listRows?.[0]?.id ?? "");

    const listIds = (listRows ?? []).map((l) => l.id);
    const { data: itemRows } = listIds.length
      ? await supabase.from("acalanto_shopping_items").select("*").in("list_id", listIds).order("created_at")
      : { data: [] };

    setItems(itemRows ?? []);
    setLoading(false);
  }

  const filteredByList = listFilter === "all" ? items : items.filter((i) => i.list_id === listFilter);
  const filtered = filteredByList.filter((i) => {
    if (statusFilter === "done") return i.checked;
    if (statusFilter === "pending") return !i.checked;
    return true;
  });

  const totalItems = filteredByList.length;
  const doneCount = filteredByList.filter((i) => i.checked).length;
  const progress = totalItems ? Math.round((doneCount / totalItems) * 100) : 0;
  const totalGasto = filteredByList
    .filter((i) => i.checked && i.actual_price != null)
    .reduce((s, i) => s + (i.actual_price ?? 0) * i.quantity, 0);

  function listName(listId: string) {
    return lists.find((l) => l.id === listId)?.name ?? "";
  }

  async function toggleCheck(item: ShoppingItem) {
    const supabase = createClient();
    const nowChecked = !item.checked;
    const nowIso = new Date().toISOString();
    const dbPatch = nowChecked
      ? { checked: true, checked_by: memberId, checked_at: nowIso }
      : { checked: false, checked_by: null, checked_at: null };
    const statePatch: Partial<ShoppingItem> = nowChecked
      ? { checked: true, checked_by: memberId ?? undefined, checked_at: nowIso }
      : { checked: false, checked_by: undefined, checked_at: undefined };

    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, ...statePatch } : i));
    await supabase.from("acalanto_shopping_items").update(dbPatch).eq("id", item.id);

    if (nowChecked) {
      setPriceModalItem(item);
      setPriceInput(item.actual_price != null ? String(item.actual_price).replace(".", ",") : "");
    }
  }

  async function savePrice() {
    if (priceModalItem) {
      const val = parseFloat(priceInput.replace(",", "."));
      if (!isNaN(val) && val >= 0) {
        const supabase = createClient();
        await supabase.from("acalanto_shopping_items").update({ actual_price: val }).eq("id", priceModalItem.id);
        setItems((prev) => prev.map((i) => i.id === priceModalItem.id ? { ...i, actual_price: val } : i));
      }
    }
    setPriceModalItem(null);
  }

  async function removeItem(item: ShoppingItem) {
    const supabase = createClient();
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase.from("acalanto_shopping_items").delete().eq("id", item.id);
    showToast(`"${item.name}" removido`);
  }

  function openAddItem() {
    setEditingItemId(null);
    setNewName(""); setNewQty(1); setNewUnit("unid"); setNewCategory(categories[2].name);
    setNewListId(listFilter !== "all" ? listFilter : (lists[0]?.id ?? ""));
    setAddModal(true);
  }

  function openEditItem(item: ShoppingItem) {
    setEditingItemId(item.id);
    setNewName(item.name);
    setNewQty(item.quantity);
    setNewUnit(item.unit);
    setNewCategory(item.category ?? categories[2].name);
    setNewListId(item.list_id);
    setAddModal(true);
  }

  function closeItemModal() {
    setAddModal(false);
    setEditingItemId(null);
    setNewName(""); setNewQty(1); setNewUnit("unid"); setNewCategory(categories[2].name);
  }

  async function saveItem() {
    if (!newName.trim() || !newListId) return;
    setSavingItem(true);
    const supabase = createClient();
    const cat = categoryMap.get(newCategory);
    const name = newName.trim();

    if (editingItemId) {
      const patch = {
        name, quantity: newQty, unit: newUnit,
        category: newCategory, emoji: cat?.emoji ?? "📦", list_id: newListId,
      };
      const { error } = await supabase.from("acalanto_shopping_items").update(patch).eq("id", editingItemId);
      setSavingItem(false);
      if (error) { showToast("Erro ao salvar alterações"); return; }
      setItems((prev) => prev.map((i) => i.id === editingItemId ? { ...i, ...patch } : i));
      showToast(`"${name}" atualizado`);
    } else {
      const id = crypto.randomUUID();
      const { error } = await supabase.from("acalanto_shopping_items").insert({
        id, list_id: newListId, name, quantity: newQty, unit: newUnit,
        category: newCategory, emoji: cat?.emoji ?? "📦",
      });
      setSavingItem(false);
      if (error) { showToast("Erro ao adicionar item"); return; }
      const newItem: ShoppingItem = {
        id, list_id: newListId, name, quantity: newQty, unit: newUnit,
        category: newCategory, emoji: cat?.emoji ?? "📦", checked: false,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      showToast(`✓ "${name}" adicionado!`);
    }
    closeItemModal();
  }

  async function addList() {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    if (!familyId || !memberId) {
      showToast("Ainda carregando sua família, tente de novo em instantes");
      return;
    }

    setCreatingList(true);
    try {
      const supabase = createClient();
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from("acalanto_shopping_lists")
        .insert({ id, family_id: familyId, name: trimmed, created_by: memberId });

      if (error) {
        showToast("Erro ao criar lista. Tente novamente.");
        return;
      }

      const newList: ShoppingList = {
        id,
        family_id: familyId,
        name: trimmed,
        status: "open",
        created_by: memberId,
        created_at: new Date().toISOString(),
      };
      setLists((prev) => [...prev, newList]);
      setListFilter(newList.id);
      setNewListId(newList.id);
      showToast(`Lista "${trimmed}" criada!`);
      setNewListName("");
      setNewListModal(false);
    } catch {
      showToast("Erro ao criar lista. Tente novamente.");
    } finally {
      setCreatingList(false);
    }
  }

  function openBulkModal() {
    setBulkText("");
    setBulkRows([]);
    setBulkStep("paste");
    setBulkListId(listFilter !== "all" ? listFilter : (lists[0]?.id ?? ""));
    setBulkModal(true);
  }

  function analyzeBulkText() {
    const rows = parseBulkText(bulkText);
    if (!rows.length) return;
    setBulkRows(rows);
    setBulkStep("review");
  }

  function updateBulkRow(index: number, patch: Partial<BulkRow>) {
    setBulkRows((prev) => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  }

  function removeBulkRow(index: number) {
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirmBulkAdd() {
    if (!bulkRows.length || !bulkListId) return;
    setBulkSaving(true);
    const supabase = createClient();
    const rows = bulkRows.map((r) => ({
      list_id: bulkListId,
      name: r.name,
      quantity: r.quantity,
      unit: "unid",
      category: r.category,
      emoji: categoryMap.get(r.category)?.emoji ?? "📦",
    }));
    const { data, error } = await supabase.from("acalanto_shopping_items").insert(rows).select();
    setBulkSaving(false);

    if (!error && data) {
      setItems((prev) => [...prev, ...data]);
      showToast(`✓ ${data.length} itens adicionados!`);
    }
    setBulkModal(false);
  }

  function generateReport() {
    const now = new Date().toLocaleString("pt-BR");
    let text = `📋 RELATÓRIO DE COMPRAS\n🗓️ ${now}\n${"─".repeat(32)}\n\n`;

    lists.forEach((list) => {
      const listItems = items.filter((i) => i.list_id === list.id);
      if (!listItems.length) return;
      const done = listItems.filter((i) => i.checked);
      const pending = listItems.filter((i) => !i.checked);
      const subtotal = done.filter((i) => i.actual_price != null).reduce((s, i) => s + (i.actual_price ?? 0) * i.quantity, 0);

      text += `🗂️ ${list.name.toUpperCase()}\n${"─".repeat(24)}\n`;
      if (done.length) {
        text += `✅ Comprados (${done.length})\n`;
        done.forEach((i) => {
          text += `  ${i.emoji ?? "📦"} ${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""} — ${i.actual_price != null ? fmt(i.actual_price) : "sem valor"}\n`;
        });
      }
      if (pending.length) {
        text += `⏳ Pendentes (${pending.length})\n`;
        pending.forEach((i) => {
          text += `  ${i.emoji ?? "📦"} ${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}\n`;
        });
      }
      if (subtotal > 0) text += `💰 Subtotal: ${fmt(subtotal)}\n`;
      text += "\n";
    });

    const grand = items.filter((i) => i.checked && i.actual_price != null).reduce((s, i) => s + (i.actual_price ?? 0) * i.quantity, 0);
    text += `${"═".repeat(32)}\n✅ Total comprados: ${items.filter((i) => i.checked).length}/${items.length}\n`;
    if (grand > 0) text += `💰 Total geral: ${fmt(grand)}\n`;
    text += `${"═".repeat(32)}\n`;

    setReportText(text);
    setReportModal(true);
    setCopied(false);
  }

  function copyReport() {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }

  function shareReport() {
    if (navigator.share) {
      navigator.share({ text: reportText }).catch(() => {});
    } else {
      copyReport();
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando sua lista...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📶</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Não conseguimos carregar seus dados
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Pode ter sido a conexão. Toque para tentar de novo.
        </div>
        <button onClick={load} className="btn-primary" style={{ margin: "0 auto" }}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "2rem" }}>

      {toast && (
        <div style={{
          position: "fixed", top: "1.25rem", left: "50%", transform: "translateX(-50%)",
          background: "#2a5a3a", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "999px",
          fontSize: "0.9rem", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 200, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <MdCheck size={18} /> {toast}
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            🛒 Lista de Compras
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Adicione durante a semana, confira ao fazer as compras
          </p>
        </div>
        <button
          onClick={generateReport}
          className="btn-secondary"
          style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
        >
          <MdDescription size={16} /> Relatório
        </button>
      </div>

      {/* Total gasto */}
      {totalGasto > 0 && (
        <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>💰 Total gasto</span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand)" }}>{fmt(totalGasto)}</span>
        </div>
      )}

      {/* Abas de lista */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setListFilter("all")}
          style={{
            padding: "0.4rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 700,
            background: listFilter === "all" ? "var(--brand)" : "var(--bg-secondary)",
            color: listFilter === "all" ? "#fff" : "var(--text-muted)",
          }}
        >
          Todas
        </button>
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setListFilter(l.id)}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700,
              background: listFilter === l.id ? "var(--brand)" : "var(--bg-secondary)",
              color: listFilter === l.id ? "#fff" : "var(--text-muted)",
            }}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setNewListModal(true)}
          aria-label="Nova lista"
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "1.5px dashed var(--border)",
            background: "none", color: "var(--text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <MdAdd size={18} />
        </button>
      </div>

      {/* Progresso */}
      {totalItems > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{doneCount} de {totalItems} itens</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--brand)" }}>{progress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: "var(--brand)", transition: "width 0.4s ease" }} />
          </div>
        </div>
      )}

      {/* Filtro de status */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {([["all", "Todos"], ["pending", "Pendentes"], ["done", "Feitos"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            style={{
              flex: 1, padding: "0.5rem 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 700,
              background: statusFilter === val ? "var(--brand)" : "var(--bg-secondary)",
              color: statusFilter === val ? "#fff" : "var(--text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Botões adicionar (ou aviso pra criar a primeira lista) */}
      {lists.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "1.5rem 1.25rem", borderRadius: "16px",
          border: "2px dashed var(--border)", marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
            Você ainda não tem uma lista
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Crie uma lista (ex: &quot;Nossa lista&quot;) pra começar a adicionar itens
          </div>
          <button
            onClick={() => setNewListModal(true)}
            className="btn-primary"
            style={{ justifyContent: "center", margin: "0 auto" }}
          >
            <MdAdd size={18} /> Criar minha primeira lista
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
          <button
            onClick={openAddItem}
            style={{
              width: "100%", padding: "1rem", borderRadius: "16px", background: "var(--brand)",
              color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.6rem", fontSize: "1.02rem", fontWeight: 800,
              boxShadow: "0 4px 16px rgba(122,171,138,0.35)",
            }}
          >
            <MdAdd size={22} /> Adicionar item
          </button>
          <button
            onClick={openBulkModal}
            style={{
              width: "100%", padding: "0.8rem", borderRadius: "16px", background: "var(--bg-secondary)",
              color: "var(--text-secondary)", border: "1.5px solid var(--border)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              fontSize: "0.9rem", fontWeight: 700,
            }}
          >
            <MdContentPaste size={18} /> Colar lista (vários itens de uma vez)
          </button>
        </div>
      )}

      {/* Itens por categoria */}
      {categories.map((cat) => {
        const catItems = filtered.filter((i) => i.category === cat.name);
        if (!catItems.length) return null;
        const catAll = filteredByList.filter((i) => i.category === cat.name);
        const catDone = catAll.filter((i) => i.checked).length;

        return (
          <div key={cat.name} className="card" style={{ marginBottom: "1rem", overflow: "hidden", padding: 0 }}>
            <div style={{
              padding: "0.7rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `2px solid ${cat.accent}22`, background: `${cat.accent}0d`,
            }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: cat.accent }}>{cat.emoji} {cat.name}</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cat.accent, background: `${cat.accent}18`, padding: "0.15rem 0.6rem", borderRadius: 999 }}>
                {catDone}/{catAll.length}
              </span>
            </div>
            {catItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem",
                  borderBottom: idx < catItems.length - 1 ? "1px solid var(--border-light)" : "none",
                  background: item.checked ? `${cat.accent}08` : "transparent",
                }}
              >
                <button
                  onClick={() => toggleCheck(item)}
                  aria-label={item.checked ? "Desmarcar" : "Marcar como comprado"}
                  style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    border: `2px solid ${item.checked ? cat.accent : "var(--border)"}`,
                    background: item.checked ? cat.accent : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {item.checked && <MdCheck size={16} color="white" />}
                </button>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.emoji ?? "📦"}</span>
                <button
                  onClick={() => toggleCheck(item)}
                  style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.92rem", fontWeight: 600,
                      color: item.checked ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: item.checked ? "line-through" : "none",
                    }}>
                      {item.name}{item.quantity > 1 && <span style={{ color: cat.accent, fontWeight: 700 }}> ×{item.quantity}{item.unit !== "unid" ? ` ${item.unit}` : ""}</span>}
                    </span>
                    {listFilter === "all" && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)", padding: "0.1rem 0.5rem", borderRadius: 999 }}>
                        {listName(item.list_id)}
                      </span>
                    )}
                  </div>
                  {item.checked && item.actual_price != null && (
                    <div style={{ fontSize: "0.78rem", color: "var(--brand)", fontWeight: 700, marginTop: "0.1rem" }}>
                      {fmt(item.actual_price)}
                    </div>
                  )}
                  {item.checked && item.actual_price == null && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPriceModalItem(item); setPriceInput(""); }}
                      style={{ fontSize: "0.72rem", color: cat.accent, background: "none", border: `1px solid ${cat.accent}44`, borderRadius: 6, padding: "0.05rem 0.5rem", cursor: "pointer", marginTop: "0.15rem" }}
                    >
                      + valor
                    </button>
                  )}
                </button>
                <button
                  onClick={() => openEditItem(item)}
                  aria-label={`Editar ${item.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.3rem", flexShrink: 0 }}
                >
                  <MdEdit size={16} />
                </button>
                <button
                  onClick={() => removeItem(item)}
                  aria-label={`Remover ${item.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.3rem", flexShrink: 0 }}
                >
                  <MdClose size={16} />
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Estado vazio */}
      {filtered.length === 0 && totalItems > 0 && (
        <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Nada por aqui com esse filtro.
        </div>
      )}

      {totalItems === 0 && lists.length > 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
            Sua lista está vazia
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Toque no botão acima pra adicionar o primeiro item
          </div>
        </div>
      )}

      {totalItems > 0 && doneCount === totalItems && (
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginTop: "0.4rem" }}>Tudo comprado!</div>
          {totalGasto > 0 && <div style={{ color: "var(--brand)", fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem" }}>Total: {fmt(totalGasto)}</div>}
        </div>
      )}

      {/* Modal de preço */}
      {priceModalItem && (
        <div onClick={(e) => e.target === e.currentTarget && setPriceModalItem(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>{priceModalItem.emoji ?? "📦"}</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{priceModalItem.name}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.1rem" }}>Quanto você pagou?</div>
            <div style={{ display: "flex", alignItems: "center", background: "var(--bg-secondary)", borderRadius: 12, border: "1.5px solid var(--border)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.05rem", color: "var(--brand)", fontWeight: 700, marginRight: "0.5rem" }}>R$</span>
              <input
                autoFocus type="number" inputMode="decimal" placeholder="0,00"
                value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && savePrice()}
                style={{ flex: 1, border: "none", background: "transparent", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setPriceModalItem(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Pular</button>
              <button onClick={savePrice} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Salvar valor</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal adicionar/editar item */}
      {addModal && (
        <div onClick={(e) => e.target === e.currentTarget && closeItemModal()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {editingItemId ? "✏️ Editar item" : "➕ Adicionar item"}
              </h2>
              <button onClick={closeItemModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Nome</label>
                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Arroz" className="input-field" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Quantidade</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                    <button
                      type="button" onClick={() => setNewQty((q) => Math.max(1, q - 1))}
                      style={{ width: 44, height: 44, border: "none", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-primary)", fontSize: "1.3rem", fontWeight: 700 }}
                    >
                      −
                    </button>
                    <span style={{ width: 48, textAlign: "center", fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {newQty}
                    </span>
                    <button
                      type="button" onClick={() => setNewQty((q) => q + 1)}
                      style={{ width: 44, height: 44, border: "none", background: "var(--bg-secondary)", cursor: "pointer", color: "var(--text-primary)", fontSize: "1.3rem", fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>
                  <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="input-field" style={{ cursor: "pointer", flex: 1 }}>
                    {units.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Categoria</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {categories.map((c) => (
                    <button
                      key={c.name} type="button" onClick={() => setNewCategory(c.name)}
                      style={{
                        padding: "0.4rem 0.8rem", borderRadius: 999, fontSize: "0.78rem", cursor: "pointer",
                        border: `1.5px solid ${newCategory === c.name ? c.accent : "var(--border)"}`,
                        background: newCategory === c.name ? `${c.accent}18` : "transparent",
                        color: newCategory === c.name ? c.accent : "var(--text-muted)",
                        fontWeight: newCategory === c.name ? 700 : 400,
                      }}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Lista</label>
                <select value={newListId} onChange={(e) => setNewListId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                  {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <button onClick={saveItem} disabled={!newName.trim() || savingItem} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "0.3rem", opacity: newName.trim() ? 1 : 0.5 }}>
                <MdCheck size={18} /> {savingItem ? "Salvando..." : editingItemId ? "Salvar alterações" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova lista */}
      {newListModal && (
        <div onClick={(e) => e.target === e.currentTarget && setNewListModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, padding: "1.5rem 1.5rem 2rem" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MdList size={20} /> Nova lista
              </h2>
              <button onClick={() => setNewListModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <input
              autoFocus type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addList()}
              placeholder="Ex: Mãe da Morgana, Farmácia..."
              className="input-field" style={{ marginBottom: "1rem" }}
            />
            <button onClick={addList} disabled={!newListName.trim() || creatingList} className="btn-primary" style={{ width: "100%", justifyContent: "center", opacity: newListName.trim() ? 1 : 0.5 }}>
              <MdCheck size={18} /> {creatingList ? "Criando..." : "Criar lista"}
            </button>
          </div>
        </div>
      )}

      {/* Modal colar lista */}
      {bulkModal && (
        <div onClick={(e) => e.target === e.currentTarget && setBulkModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, padding: "1.5rem 1.5rem 2rem", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: "var(--border)", margin: "0 auto 1.25rem", flexShrink: 0 }} />

            {bulkStep === "paste" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>📋 Colar lista</h2>
                  <button onClick={() => setBulkModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Cole o texto com um item por linha. Pode começar com a quantidade, tipo &quot;3 maracujá&quot;. Depois você revisa antes de salvar.
                </p>
                <textarea
                  autoFocus
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"Pipoca\n3 maracujá\nLeite em pó\nSabão em pó\n..."}
                  style={{
                    width: "100%", minHeight: 220, background: "var(--bg-secondary)", color: "var(--text-primary)",
                    border: "1.5px solid var(--border)", borderRadius: 12, padding: "0.9rem", fontSize: "0.9rem",
                    lineHeight: 1.6, resize: "vertical", outline: "none", marginBottom: "1rem", fontFamily: "inherit",
                  }}
                />
                <button onClick={analyzeBulkText} disabled={!bulkText.trim()} className="btn-primary" style={{ width: "100%", justifyContent: "center", opacity: bulkText.trim() ? 1 : 0.5 }}>
                  Analisar lista
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <button onClick={() => setBulkStep("paste")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", padding: 0 }}>
                    <MdArrowBack size={16} /> Voltar
                  </button>
                  <button onClick={() => setBulkModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
                </div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                  Confira antes de salvar
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  {bulkRows.length} {bulkRows.length === 1 ? "item" : "itens"} — ajuste categoria, quantidade ou remova algum antes de confirmar.
                </p>

                <div style={{ marginBottom: "0.9rem" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Adicionar em qual lista?</label>
                  <select value={bulkListId} onChange={(e) => setBulkListId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  {bulkRows.map((row, idx) => {
                    const cat = categoryMap.get(row.category);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.6rem", borderRadius: 10, background: "var(--bg-secondary)" }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>{cat?.emoji ?? "📦"}</span>
                        <input
                          type="text" value={row.name} onChange={(e) => updateBulkRow(idx, { name: e.target.value })}
                          style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600 }}
                        />
                        <input
                          type="number" min={1} value={row.quantity}
                          onChange={(e) => updateBulkRow(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                          style={{ width: 42, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: "0.8rem", textAlign: "center", padding: "0.2rem" }}
                        />
                        <select
                          value={row.category} onChange={(e) => updateBulkRow(idx, { category: e.target.value })}
                          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, color: cat?.accent ?? "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem", maxWidth: 90 }}
                        >
                          {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <button onClick={() => removeBulkRow(idx)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem", flexShrink: 0 }}>
                          <MdClose size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {bulkRows.length === 0 && (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Nenhum item sobrou. Volte e cole a lista de novo.
                    </div>
                  )}
                </div>

                <button
                  onClick={confirmBulkAdd}
                  disabled={!bulkRows.length || !bulkListId || bulkSaving}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", opacity: bulkRows.length && bulkListId ? 1 : 0.5, flexShrink: 0 }}
                >
                  <MdCheck size={18} /> {bulkSaving ? "Salvando..." : `Adicionar ${bulkRows.length} ${bulkRows.length === 1 ? "item" : "itens"}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal relatório */}
      {reportModal && (
        <div onClick={(e) => e.target === e.currentTarget && setReportModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "20px 20px 0 0", padding: "1.5rem 1.25rem 2rem", width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>📄 Relatório</span>
              <button onClick={() => setReportModal(false)} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
                <MdClose size={16} /> Fechar
              </button>
            </div>
            <textarea
              readOnly value={reportText}
              style={{
                flex: 1, minHeight: 240, background: "var(--bg-card)", color: "var(--text-primary)",
                border: "1px solid var(--border)", borderRadius: 12, padding: "0.9rem", fontSize: "0.78rem",
                fontFamily: "monospace", lineHeight: 1.7, resize: "none", outline: "none", overflowY: "auto",
              }}
            />
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
              <button onClick={copyReport} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                <MdContentCopy size={16} /> {copied ? "Copiado!" : "Copiar"}
              </button>
              <button onClick={shareReport} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                <MdShare size={16} /> Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
