"use client";
import { useEffect, useState } from "react";
import { MdAdd, MdShoppingCart, MdClose, MdSearch } from "react-icons/md";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const MEALS = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const dayOfWeekFor: Record<string, number> = {
  Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6, Domingo: 0,
};
const mealTypeFor: Record<string, MealType> = {
  "Café da manhã": "breakfast", "Almoço": "lunch", "Jantar": "dinner", "Lanche": "snack",
};

interface RecipeRow {
  id: string;
  family_id: string;
  name: string;
  category: string;
  prep_time: number | null;
  servings: number;
  ingredients: string[];
  emoji: string;
}

interface PlanRow {
  id: string;
  family_id: string;
  week_start: string;
  day_of_week: number;
  meal_type: MealType;
  recipe_id: string | null;
}

const defaultRecipes = [
  { name: "Arroz e feijão", category: "Almoço", prep_time: 40, servings: 4, emoji: "🍚", ingredients: ["Arroz 2 xíc", "Feijão 1 xíc", "Alho", "Cebola", "Sal"] },
  { name: "Omelete de queijo", category: "Café da manhã", prep_time: 10, servings: 2, emoji: "🍳", ingredients: ["Ovos 3un", "Queijo 50g", "Sal", "Pimenta"] },
  { name: "Macarrão ao molho", category: "Jantar", prep_time: 25, servings: 4, emoji: "🍝", ingredients: ["Macarrão 500g", "Molho de tomate", "Carne moída 300g", "Alho"] },
  { name: "Frango grelhado", category: "Almoço", prep_time: 30, servings: 2, emoji: "🍗", ingredients: ["Frango 400g", "Limão", "Alho", "Azeite", "Sal"] },
  { name: "Vitamina de banana", category: "Café da manhã", prep_time: 5, servings: 2, emoji: "🥤", ingredients: ["Banana 2un", "Leite 200ml", "Mel"] },
  { name: "Salada mista", category: "Lanche", prep_time: 10, servings: 2, emoji: "🥗", ingredients: ["Alface", "Tomate", "Pepino", "Azeite", "Limão"] },
];

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split("T")[0];
}

export default function CardapioPage() {
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [planRows, setPlanRows] = useState<PlanRow[]>([]);
  const [selecting, setSelecting] = useState<{ day: string; meal: string } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const [toast, setToast] = useState("");

  const weekStart = mondayOf(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: me } = await supabase
      .from("acalanto_family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .single();
    if (!me) { setLoading(false); return; }
    setFamilyId(me.family_id);

    let { data: recipeRows } = await supabase
      .from("acalanto_recipes")
      .select("id, family_id, name, category, prep_time, servings, ingredients, emoji")
      .eq("family_id", me.family_id);

    if (!recipeRows || recipeRows.length === 0) {
      const seed = defaultRecipes.map((r) => ({ id: crypto.randomUUID(), family_id: me.family_id, ...r }));
      const { error } = await supabase.from("acalanto_recipes").insert(seed);
      if (!error) recipeRows = seed;
    }
    setRecipes(recipeRows ?? []);

    const week = mondayOf(new Date());
    const { data: planData } = await supabase
      .from("acalanto_meal_plan")
      .select("id, family_id, week_start, day_of_week, meal_type, recipe_id")
      .eq("family_id", me.family_id)
      .eq("week_start", week);
    setPlanRows(planData ?? []);

    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  function slotFor(day: string, meal: string) {
    const row = planRows.find((p) => p.day_of_week === dayOfWeekFor[day] && p.meal_type === mealTypeFor[meal]);
    if (!row || !row.recipe_id) return null;
    const recipe = recipeMap.get(row.recipe_id);
    return recipe ? { planRowId: row.id, name: recipe.name, emoji: recipe.emoji } : null;
  }

  async function assignMeal(recipe: RecipeRow) {
    if (!selecting) return;
    const supabase = createClient();
    const dow = dayOfWeekFor[selecting.day];
    const mtype = mealTypeFor[selecting.meal];
    const existing = planRows.find((p) => p.day_of_week === dow && p.meal_type === mtype);

    if (existing) {
      setPlanRows((prev) => prev.map((p) => p.id === existing.id ? { ...p, recipe_id: recipe.id } : p));
      await supabase.from("acalanto_meal_plan").update({ recipe_id: recipe.id }).eq("id", existing.id);
    } else {
      const id = crypto.randomUUID();
      const row: PlanRow = { id, family_id: familyId, week_start: weekStart, day_of_week: dow, meal_type: mtype, recipe_id: recipe.id };
      setPlanRows((prev) => [...prev, row]);
      await supabase.from("acalanto_meal_plan").insert(row);
    }
    showToast(`✅ ${recipe.name} adicionado!`);
    setSelecting(null);
  }

  async function clearMeal(day: string, meal: string) {
    const dow = dayOfWeekFor[day];
    const mtype = mealTypeFor[meal];
    const existing = planRows.find((p) => p.day_of_week === dow && p.meal_type === mtype);
    if (!existing) return;
    const supabase = createClient();
    setPlanRows((prev) => prev.filter((p) => p.id !== existing.id));
    await supabase.from("acalanto_meal_plan").delete().eq("id", existing.id);
  }

  async function exportToShoppingList() {
    const allIngredients: string[] = [];
    DAYS.forEach((day) => {
      MEALS.forEach((meal) => {
        const slot = slotFor(day, meal);
        if (slot) {
          const row = planRows.find((p) => p.day_of_week === dayOfWeekFor[day] && p.meal_type === mealTypeFor[meal]);
          const recipe = row?.recipe_id ? recipeMap.get(row.recipe_id) : null;
          if (recipe) allIngredients.push(...recipe.ingredients);
        }
      });
    });
    const unique = [...new Set(allIngredients)];
    if (unique.length === 0) {
      showToast("Nenhuma refeição planejada ainda");
      return;
    }

    const supabase = createClient();
    let { data: list } = await supabase
      .from("acalanto_shopping_lists")
      .select("id")
      .eq("family_id", familyId)
      .eq("status", "open")
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (!list) {
      const listId = crypto.randomUUID();
      const { error } = await supabase
        .from("acalanto_shopping_lists")
        .insert({ id: listId, family_id: familyId, name: "Nossa lista" });
      if (error) { showToast("Erro ao criar a lista de compras"); return; }
      list = { id: listId };
    }

    const rows = unique.map((name) => ({ id: crypto.randomUUID(), list_id: list!.id, name, emoji: "🍽️" }));
    const { error } = await supabase.from("acalanto_shopping_items").insert(rows);
    if (error) { showToast("Erro ao adicionar itens à lista"); return; }
    showToast(`🛒 ${unique.length} ingredientes adicionados à lista!`);
  }

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const plannedCount = DAYS.flatMap((day) => MEALS.map((meal) => slotFor(day, meal))).filter(Boolean).length;
  const totalSlots = DAYS.length * MEALS.length;
  const currentDay = DAYS[activeDay];

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: "#2a5a3a", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 14, zIndex: 999, fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
          🍽️ Cardápio Semanal
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {plannedCount}/{totalSlots} refeições planejadas esta semana
        </p>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden", marginBottom: "1.25rem" }}>
        <div style={{ height: "100%", width: `${(plannedCount / totalSlots) * 100}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)", borderRadius: 4, transition: "width 0.3s" }} />
      </div>

      {/* Botões de ação */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <button
          onClick={exportToShoppingList}
          style={{ width: "100%", padding: "1rem 1.25rem", borderRadius: 16, border: "1.5px solid var(--brand)", cursor: "pointer", background: "var(--brand-bg)", color: "var(--brand)", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem" }}
        >
          <MdShoppingCart size={22} /> Exportar lista de compras
        </button>
      </div>

      {/* Navegação por dia */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.35rem" }}>
        {DAYS.map((day, i) => {
          const filled = MEALS.filter((meal) => slotFor(day, meal)).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(i)}
              style={{
                padding: "0.625rem 1rem",
                borderRadius: "0.625rem",
                minHeight: 44,
                border: `1.5px solid ${activeDay === i ? "#22c55e" : "var(--border)"}`,
                background: activeDay === i ? "rgba(34,197,94,0.12)" : "transparent",
                color: activeDay === i ? "#22c55e" : "var(--text-secondary)",
                fontSize: "0.875rem",
                cursor: "pointer",
                fontWeight: activeDay === i ? 700 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {day.slice(0, 3)}
              {filled > 0 && <span style={{ marginLeft: "0.35rem", fontSize: "0.7rem", color: "#22c55e" }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* Visão do dia selecionado (mobile-first) */}
      <div className="day-view" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{currentDay}</h2>
        {MEALS.map((meal) => {
          const slot = slotFor(currentDay, meal);
          return (
            <div key={meal} className="card" style={{ padding: "1rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", minHeight: 72 }}>
              <div style={{ width: 80, fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{meal}</div>
              {slot ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{slot.emoji}</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{slot.name}</span>
                  <button onClick={() => clearMeal(currentDay, meal)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem", flexShrink: 0 }}>
                    <MdClose size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelecting({ day: currentDay, meal })}
                  style={{ flex: 1, padding: "0.5rem 0.875rem", border: "1.5px dashed var(--border)", borderRadius: 10, background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
                >
                  <MdAdd size={18} /> Escolher refeição
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Grade semanal — desktop */}
      <div className="week-grid" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 120, padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Refeição</th>
              {DAYS.map((day) => (
                <th key={day} style={{ padding: "0.5rem 0.375rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, minWidth: 110 }}>
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map((meal) => (
              <tr key={meal}>
                <td style={{ padding: "0.375rem 0.75rem", fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {meal}
                </td>
                {DAYS.map((day) => {
                  const slot = slotFor(day, meal);
                  return (
                    <td key={day} style={{ padding: "0.25rem 0.375rem" }}>
                      {slot ? (
                        <div
                          style={{
                            background: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            borderRadius: "0.5rem",
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                          onClick={() => clearMeal(day, meal)}
                          title="Clique para remover"
                        >
                          <div style={{ fontSize: "1rem", marginBottom: "0.15rem" }}>{slot.emoji}</div>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{slot.name}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelecting({ day, meal })}
                          style={{
                            width: "100%",
                            height: 56,
                            border: "1px dashed var(--border)",
                            borderRadius: "0.5rem",
                            background: "transparent",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MdAdd size={18} />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de seleção de receita */}
      {selecting && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setSelecting(null)}
        >
          <div style={{ background: "var(--bg-secondary)", borderRadius: "1.25rem 1.25rem 0 0", width: "100%", maxWidth: 520, padding: "1.5rem", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 1.25rem" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                  {selecting.meal}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{selecting.day}</p>
              </div>
              <button onClick={() => setSelecting(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.5rem" }}>
                <MdClose size={22} />
              </button>
            </div>
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <MdSearch size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)} placeholder="Buscar receita..." className="input-field" style={{ paddingLeft: "2.25rem" }} autoFocus />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {filteredRecipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => assignMeal(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: 72,
                  }}
                >
                  <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{r.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>{r.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {r.prep_time ? `⏱ ${r.prep_time} min · ` : ""}👥 {r.servings} porções · {r.category}
                    </div>
                  </div>
                  <MdAdd size={20} color="#22c55e" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .week-grid { display: none; }
        }
        @media (min-width: 701px) {
          .day-view { display: none; }
        }
      `}</style>
    </div>
  );
}
