"use client";
import { useEffect, useState } from "react";
import {
  MdAdd, MdCheck, MdClose, MdEdit, MdPieChart, MdReceipt, MdSavings,
  MdCreditCard, MdChevronLeft, MdChevronRight, MdTrendingUp, MdTrendingDown,
  MdSearch, MdContentCopy,
} from "react-icons/md";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, FinanceCategory, CreditCard as CreditCardT, FamilyMember } from "@/types";
import { VisaoGeralFinanceiro } from "@/components/financeiro/VisaoGeralFinanceiro";

type Tab = "geral" | "lancamentos" | "contas" | "cartoes";

const tabs: { id: Tab; label: string; icon: typeof MdPieChart }[] = [
  { id: "geral", label: "Visão Geral", icon: MdPieChart },
  { id: "lancamentos", label: "Lançamentos", icon: MdReceipt },
  { id: "contas", label: "Contas fixas", icon: MdSavings },
  { id: "cartoes", label: "Cartões", icon: MdCreditCard },
];

const defaultCategories: { name: string; color: string; type: "income" | "expense" }[] = [
  { name: "Salário", color: "#7aab8a", type: "income" },
  { name: "Outros", color: "#88aa40", type: "income" },
  { name: "Casa", color: "#5aabb0", type: "expense" },
  { name: "Carro", color: "#c99a40", type: "expense" },
  { name: "Celular", color: "#7a90cc", type: "expense" },
  { name: "Assinaturas", color: "#a07acc", type: "expense" },
  { name: "Cuidados pessoais", color: "#c07898", type: "expense" },
  { name: "Saúde", color: "#d06a6a", type: "expense" },
  { name: "Outros", color: "#8a96a0", type: "expense" },
];

const cardColors = ["#8b5cf6", "#f97316", "#f59e0b", "#3b82f6", "#22c55e", "#ec4899"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro", debit: "Débito", credit_card: "Crédito", pix: "Pix", transfer: "Transferência",
};

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<Tab>("geral");
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [toast, setToast] = useState("");
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // Modal de lançamento
  const [txModal, setTxModal] = useState<null | "income" | "expense">(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txMemberId, setTxMemberId] = useState("");
  const [txDate, setTxDate] = useState(todayStr());
  const [txPaymentMethod, setTxPaymentMethod] = useState("pix");
  const [txCreditCardId, setTxCreditCardId] = useState("");
  const [txRecurring, setTxRecurring] = useState(false);
  const [savingTx, setSavingTx] = useState(false);

  // Modal de cartão
  const [cardModal, setCardModal] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardLast, setCardLast] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosing, setCardClosing] = useState("5");
  const [cardDue, setCardDue] = useState("12");
  const [savingCard, setSavingCard] = useState(false);

  // Lançamentos: busca/filtro
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    const supabase = createClient();

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

    const { data: memberRows } = await supabase
      .from("acalanto_family_members")
      .select("*")
      .eq("family_id", me.family_id);
    setMembers(memberRows ?? []);
    setTxMemberId((prev) => prev || me!.id);

    let { data: categoryRows } = await supabase
      .from("acalanto_finance_categories")
      .select("*")
      .eq("family_id", me.family_id);

    if (!categoryRows || categoryRows.length === 0) {
      const rows = defaultCategories.map((c) => ({ id: crypto.randomUUID(), family_id: me!.family_id, name: c.name, color: c.color, type: c.type }));
      const { error } = await supabase.from("acalanto_finance_categories").insert(rows);
      if (!error) categoryRows = rows as FinanceCategory[];
    }
    setCategories(categoryRows ?? []);

    const { data: cardRows } = await supabase
      .from("acalanto_credit_cards")
      .select("*")
      .eq("family_id", me.family_id)
      .order("created_at");
    setCreditCards(cardRows ?? []);

    const { data: txRows } = await supabase
      .from("acalanto_transactions")
      .select("*")
      .eq("family_id", me.family_id)
      .order("date", { ascending: false });
    setTransactions(txRows ?? []);

    setLoading(false);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const selectedKey = monthKey(monthDate);
  const inMonth = transactions.filter((t) => monthKey(new Date(t.date + "T12:00:00")) === selectedKey);
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function openTxModal(type: "income" | "expense") {
    setEditingTxId(null);
    setTxDescription("");
    setTxAmount("");
    setTxCategoryId("");
    setTxMemberId(memberId ?? "");
    setTxDate(todayStr());
    setTxPaymentMethod("pix");
    setTxCreditCardId("");
    setTxRecurring(false);
    setTxModal(type);
  }

  function openEditTx(t: Transaction) {
    setEditingTxId(t.id);
    setTxDescription(t.description);
    setTxAmount(String(t.amount).replace(".", ","));
    setTxCategoryId(t.category_id);
    setTxMemberId(t.member_id);
    setTxDate(t.date);
    setTxPaymentMethod(t.payment_method ?? "pix");
    setTxCreditCardId(t.credit_card_id ?? "");
    setTxRecurring(t.is_recurring);
    setTxModal(t.type);
  }

  function closeTxModal() {
    setTxModal(null);
    setEditingTxId(null);
  }

  async function saveTx() {
    if (!txModal || !txDescription.trim() || !txCategoryId || !txMemberId || !familyId) return;
    const amount = parseFloat(txAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;

    setSavingTx(true);
    const supabase = createClient();
    const patch = {
      type: txModal,
      amount,
      description: txDescription.trim(),
      category_id: txCategoryId,
      member_id: txMemberId,
      date: txDate,
      payment_method: txModal === "expense" ? txPaymentMethod : null,
      credit_card_id: txModal === "expense" && txPaymentMethod === "credit_card" && txCreditCardId ? txCreditCardId : null,
      is_recurring: txRecurring,
      recurrence: txRecurring ? "monthly" : null,
    };

    if (editingTxId) {
      const { error } = await supabase.from("acalanto_transactions").update(patch).eq("id", editingTxId);
      setSavingTx(false);
      if (error) { showToast("Erro ao salvar alterações"); return; }
      setTransactions((prev) => prev.map((t) => t.id === editingTxId ? { ...t, ...patch } as Transaction : t));
      showToast("Lançamento atualizado");
    } else {
      const id = crypto.randomUUID();
      const { error } = await supabase.from("acalanto_transactions").insert({ id, family_id: familyId, ...patch });
      setSavingTx(false);
      if (error) { showToast("Erro ao salvar lançamento"); return; }
      const newTx: Transaction = { id, family_id: familyId, created_at: new Date().toISOString(), ...patch } as Transaction;
      setTransactions((prev) => [newTx, ...prev]);
      showToast(txModal === "income" ? "✓ Receita registrada!" : "✓ Gasto registrado!");
    }
    closeTxModal();
  }

  async function removeTx(t: Transaction) {
    const supabase = createClient();
    setTransactions((prev) => prev.filter((x) => x.id !== t.id));
    await supabase.from("acalanto_transactions").delete().eq("id", t.id);
    showToast("Lançamento removido");
  }

  function openCardModal() {
    setCardName(""); setCardLast(""); setCardLimit(""); setCardClosing("5"); setCardDue("12");
    setCardModal(true);
  }

  async function saveCard() {
    if (!cardName.trim() || !familyId) return;
    setSavingCard(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const patch = {
      name: cardName.trim(),
      last_digits: cardLast.trim() || null,
      card_limit: parseFloat(cardLimit.replace(",", ".")) || 0,
      closing_day: parseInt(cardClosing, 10) || null,
      due_day: parseInt(cardDue, 10) || null,
      color: cardColors[creditCards.length % cardColors.length],
    };
    const { error } = await supabase.from("acalanto_credit_cards").insert({ id, family_id: familyId, ...patch });
    setSavingCard(false);
    if (error) { showToast("Erro ao adicionar cartão"); return; }
    setCreditCards((prev) => [...prev, { id, family_id: familyId, created_at: new Date().toISOString(), ...patch } as CreditCardT]);
    setCardModal(false);
    showToast("Cartão adicionado!");
  }

  // Contas fixas: gastos recorrentes mensais do mês selecionado
  const contasFixas = inMonth.filter((t) => t.type === "expense" && t.is_recurring);
  const totalContasFixas = contasFixas.reduce((s, t) => s + t.amount, 0);

  async function copiarContasDoMesAnterior() {
    if (!familyId) return;
    const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const prevKey = monthKey(prevMonth);
    const prevContas = transactions.filter((t) => t.type === "expense" && t.is_recurring && monthKey(new Date(t.date + "T12:00:00")) === prevKey);

    if (prevContas.length === 0) {
      showToast("Não há contas fixas no mês anterior pra copiar");
      return;
    }

    const supabase = createClient();
    const rows = prevContas.map((t) => {
      const day = Math.min(new Date(t.date + "T12:00:00").getDate(), 28);
      const newDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day).toISOString().split("T")[0];
      return {
        id: crypto.randomUUID(),
        family_id: familyId,
        type: "expense" as const,
        amount: t.amount,
        description: t.description,
        category_id: t.category_id,
        member_id: t.member_id,
        payment_method: t.payment_method,
        credit_card_id: t.credit_card_id ?? null,
        date: newDate,
        is_recurring: true,
        recurrence: "monthly" as const,
      };
    });

    const { error } = await supabase.from("acalanto_transactions").insert(rows);
    if (error) { showToast("Erro ao copiar contas"); return; }
    setTransactions((prev) => [...rows.map((r) => ({ ...r, created_at: new Date().toISOString() } as Transaction)), ...prev]);
    showToast(`✓ ${rows.length} contas copiadas pra ${monthLabel}`);
  }

  // Lançamentos filtrados
  const filteredTx = inMonth.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.type === filter;
    return matchSearch && matchFilter;
  });
  const groupedTx = filteredTx.reduce<Record<string, Transaction[]>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando suas finanças...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem", textAlign: "center" }}>
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
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "2rem" }}>
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

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          💰 Financeiro
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))} aria-label="Mês anterior" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem" }}>
            <MdChevronLeft size={22} />
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: 600, textTransform: "capitalize", minWidth: 140, textAlign: "center" }}>
            {monthLabel}
          </span>
          <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))} aria-label="Próximo mês" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.2rem" }}>
            <MdChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Botões de ação */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <button onClick={() => openTxModal("income")} className="btn-secondary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem", fontWeight: 700, minHeight: 52 }}>
          <MdTrendingUp size={20} /> Registrar entrada
        </button>
        <button onClick={() => openTxModal("expense")} className="btn-primary" style={{ justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem", fontWeight: 800, minHeight: 52 }}>
          <MdAdd size={20} /> Registrar gasto
        </button>
      </div>

      {/* Seletor de seção */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
              padding: "0.75rem 0.5rem",
              background: tab === id ? "rgba(122,171,138,0.12)" : "var(--bg-card)",
              border: `1.5px solid ${tab === id ? "var(--brand)" : "var(--border)"}`,
              borderRadius: "0.75rem",
              cursor: "pointer",
              color: tab === id ? "var(--brand)" : "var(--text-muted)",
              fontSize: "0.72rem",
              fontWeight: tab === id ? 700 : 500,
              minHeight: 64,
              transition: "all 0.15s",
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <VisaoGeralFinanceiro transactions={transactions} categories={categories} members={members} monthDate={monthDate} />
      )}

      {tab === "lancamentos" && (
        <div>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <MdSearch size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lançamento..." className="input-field" style={{ paddingLeft: "2.25rem" }} />
            </div>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {(["all", "income", "expense"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
                    border: `1px solid ${filter === f ? "var(--brand)" : "var(--border)"}`,
                    background: filter === f ? "rgba(122,171,138,0.12)" : "transparent",
                    color: filter === f ? "var(--brand)" : "var(--text-muted)",
                    fontSize: "0.82rem", cursor: "pointer", fontWeight: filter === f ? 600 : 400,
                  }}
                >
                  {f === "all" ? "Todos" : f === "income" ? "Receitas" : "Gastos"}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(groupedTx).sort(([a], [b]) => b.localeCompare(a)).map(([date, txs]) => (
            <div key={date} style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
                {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                {txs.map((t, i) => {
                  const cat = categoryMap.get(t.category_id);
                  const member = memberMap.get(t.member_id);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "0.875rem 1rem", borderBottom: i < txs.length - 1 ? "1px solid var(--border-light)" : "none", gap: "0.875rem" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "10px", background: t.type === "income" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {t.type === "income" ? <MdTrendingUp size={18} color="#4ade80" /> : <MdTrendingDown size={18} color="#f87171" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {cat?.name ?? "Outros"} · {member?.name ?? ""}{t.payment_method ? ` · ${paymentLabels[t.payment_method] ?? t.payment_method}` : ""}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: t.type === "income" ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </div>
                      <button onClick={() => openEditTx(t)} aria-label="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.3rem" }}>
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => removeTx(t)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.3rem" }}>
                        <MdClose size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredTx.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Nenhum lançamento em {monthLabel}.
            </div>
          )}
        </div>
      )}

      {tab === "contas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Contas fixas de {monthLabel}</h2>
            <button onClick={copiarContasDoMesAnterior} className="btn-secondary" style={{ fontSize: "0.8rem" }}>
              <MdContentCopy size={14} /> Copiar do mês anterior
            </button>
          </div>

          {contasFixas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", borderRadius: "16px", border: "2px dashed var(--border)" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                Nenhuma conta fixa cadastrada em {monthLabel}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Registre um gasto e marque &quot;Lançamento recorrente&quot;, ou copie as contas do mês anterior.
              </div>
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden", padding: 0, marginBottom: "1rem" }}>
              {contasFixas.map((t, i) => {
                const cat = categoryMap.get(t.category_id);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "0.875rem 1rem", borderBottom: i < contasFixas.length - 1 ? "1px solid var(--border-light)" : "none", gap: "0.75rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat?.color ?? "#8a96a0", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{t.description}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {cat?.name ?? "Outros"}{t.credit_card_id ? " · vai na fatura" : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{fmt(t.amount)}</div>
                    <button onClick={() => openEditTx(t)} aria-label="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.3rem" }}>
                      <MdEdit size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {contasFixas.length > 0 && (
            <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total de contas fixas</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand)" }}>{fmt(totalContasFixas)}</span>
            </div>
          )}
        </div>
      )}

      {tab === "cartoes" && (
        <div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {creditCards.map((c) => {
              const usedThisMonth = inMonth.filter((t) => t.credit_card_id === c.id).reduce((s, t) => s + t.amount, 0);
              return (
                <div key={c.id} style={{ minWidth: 240, height: 140, borderRadius: "1rem", background: `linear-gradient(135deg, ${c.color}, ${c.color}99)`, padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{c.name}</span>
                    <MdCreditCard size={22} color="rgba(255,255,255,0.8)" />
                  </div>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>
                      {c.last_digits ? `**** **** **** ${c.last_digits}` : "Fatura estimada"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
                      {fmt(usedThisMonth)} / {fmt(c.card_limit)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div onClick={openCardModal} style={{ minWidth: 100, height: 140, borderRadius: "1rem", border: "2px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.375rem", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}>
              <MdAdd size={20} />
              Adicionar
            </div>
          </div>

          {creditCards.length === 0 && (
            <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Nenhum cartão cadastrado ainda.
            </div>
          )}

          {creditCards.map((c) => {
            const usedThisMonth = inMonth.filter((t) => t.credit_card_id === c.id).reduce((s, t) => s + t.amount, 0);
            const usedPct = c.card_limit > 0 ? (usedThisMonth / c.card_limit) * 100 : 0;
            return (
              <div key={c.id} className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
                  {c.name} — fatura estimada de {monthLabel}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Nesse mês</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: c.color }}>{fmt(usedThisMonth)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Limite</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(c.card_limit)}</div>
                  </div>
                  {c.closing_day && (
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Fecha / vence</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Dia {c.closing_day} / {c.due_day}</div>
                    </div>
                  )}
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(usedPct, 100)}%`, borderRadius: 4, background: usedPct > 80 ? "#ef4444" : c.color, transition: "width 0.4s ease" }} />
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
                  Soma dos gastos lançados nesse cartão em {monthLabel} — é uma estimativa com base no que você registrou, não sincroniza com o banco.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de lançamento */}
      {txModal && (
        <div onClick={(e) => e.target === e.currentTarget && closeTxModal()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 520, padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {editingTxId ? "Editar lançamento" : txModal === "expense" ? "Novo gasto" : "Nova receita"}
              </h2>
              <button onClick={closeTxModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>

            <div style={{ textAlign: "center", padding: "1.5rem", background: `${txModal === "expense" ? "#f87171" : "#4ade80"}10`, border: `1px solid ${txModal === "expense" ? "#f87171" : "#4ade80"}30`, borderRadius: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {txModal === "expense" ? "Quanto gastou?" : "Quanto recebeu?"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: "1.5rem", color: txModal === "expense" ? "#f87171" : "#4ade80", fontWeight: 600 }}>R$</span>
                <input
                  autoFocus type="text" inputMode="decimal" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0,00"
                  style={{ background: "none", border: "none", outline: "none", fontSize: "2.5rem", fontWeight: 700, color: txModal === "expense" ? "#f87171" : "#4ade80", width: "160px", textAlign: "center" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Descrição</label>
                <input type="text" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} placeholder={txModal === "expense" ? "Ex: Conta de luz" : "Ex: Salário"} className="input-field" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Categoria</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {(txModal === "expense" ? expenseCategories : incomeCategories).map((cat) => (
                    <button key={cat.id} type="button" onClick={() => setTxCategoryId(cat.id)}
                      style={{
                        padding: "0.4rem 0.875rem", borderRadius: "9999px",
                        border: `1px solid ${txCategoryId === cat.id ? cat.color : "var(--border)"}`,
                        background: txCategoryId === cat.id ? `${cat.color}18` : "transparent",
                        color: txCategoryId === cat.id ? cat.color : "var(--text-muted)",
                        fontSize: "0.8rem", cursor: "pointer", fontWeight: txCategoryId === cat.id ? 600 : 400,
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Quem</label>
                <select value={txMemberId} onChange={(e) => setTxMemberId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Data</label>
                  <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="input-field" />
                </div>
                {txModal === "expense" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Pagamento</label>
                    <select value={txPaymentMethod} onChange={(e) => setTxPaymentMethod(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                      <option value="pix">Pix</option>
                      <option value="debit">Débito</option>
                      <option value="credit_card">Crédito</option>
                      <option value="cash">Dinheiro</option>
                      <option value="transfer">Transferência</option>
                    </select>
                  </div>
                )}
              </div>

              {txModal === "expense" && txPaymentMethod === "credit_card" && creditCards.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: 500 }}>Cartão</label>
                  <select value={txCreditCardId} onChange={(e) => setTxCreditCardId(e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
                    <option value="">Selecione...</option>
                    {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {txModal === "expense" && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <div onClick={() => setTxRecurring(!txRecurring)} style={{ width: 44, height: 24, borderRadius: 12, background: txRecurring ? "#f87171" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: txRecurring ? 23 : 3, transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Conta fixa (recorrente todo mês)</span>
                </label>
              )}

              <button
                onClick={saveTx}
                disabled={savingTx || !txDescription.trim() || !txAmount || !txCategoryId || !txMemberId}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", background: txModal === "expense" ? "#dc2626" : "#16a34a", marginTop: "0.5rem" }}
              >
                {savingTx ? "Salvando..." : editingTxId ? "Salvar alterações" : txModal === "expense" ? "Registrar gasto" : "Registrar receita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de novo cartão */}
      {cardModal && (
        <div onClick={(e) => e.target === e.currentTarget && setCardModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Novo cartão</h2>
              <button onClick={() => setCardModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MdClose size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input autoFocus type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Nome (ex: Nubank)" className="input-field" />
              <input type="text" value={cardLast} onChange={(e) => setCardLast(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Últimos 4 dígitos (opcional)" className="input-field" />
              <input type="text" inputMode="decimal" value={cardLimit} onChange={(e) => setCardLimit(e.target.value)} placeholder="Limite (R$)" className="input-field" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <input type="number" min={1} max={31} value={cardClosing} onChange={(e) => setCardClosing(e.target.value)} placeholder="Dia fechamento" className="input-field" />
                <input type="number" min={1} max={31} value={cardDue} onChange={(e) => setCardDue(e.target.value)} placeholder="Dia vencimento" className="input-field" />
              </div>
              <button onClick={saveCard} disabled={!cardName.trim() || savingCard} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {savingCard ? "Salvando..." : "Adicionar cartão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
