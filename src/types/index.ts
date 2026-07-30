export interface Family {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  role: "owner" | "admin" | "member";
  avatar_url?: string;
  created_at: string;
}

// Financeiro
export interface Transaction {
  id: string;
  family_id: string;
  member_id: string;
  member?: FamilyMember;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  category?: FinanceCategory;
  payment_method: "cash" | "debit" | "credit_card" | "pix" | "transfer";
  credit_card_id?: string;
  date: string;
  is_recurring: boolean;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly";
  created_at: string;
}

export interface FinanceCategory {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}

export interface CreditCard {
  id: string;
  family_id: string;
  name: string;
  last_digits: string;
  limit: number;
  closing_day: number;
  due_day: number;
  color: string;
}

// Documentos
export interface Document {
  id: string;
  family_id: string;
  owner_member_id?: string;
  name: string;
  type: "rg" | "cpf" | "cnh" | "passport" | "birth_certificate" | "marriage" | "other";
  file_url: string;
  file_size: number;
  expires_at?: string;
  notes?: string;
  created_at: string;
}

// Mantimentos
export interface PantryItem {
  id: string;
  family_id: string;
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  added_by?: string;
  updated_at: string;
}

// Lista de Compras
export interface ShoppingList {
  id: string;
  family_id: string;
  name: string;
  status: "open" | "shopping" | "done";
  store?: string;
  created_by: string;
  created_at: string;
  finished_at?: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_price?: number;
  actual_price?: number;
  category?: string;
  emoji?: string;
  checked: boolean;
  checked_by?: string;
  checked_at?: string;
  created_at: string;
}

// Tarefas
export interface Task {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_member?: FamilyMember;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string;
  is_recurring: boolean;
  recurrence?: "daily" | "weekly" | "monthly";
  points: number;
  created_at: string;
}

// Calendário
export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day: boolean;
  color: string;
  created_by: string;
  notify_all: boolean;
}

// Saúde
export interface HealthRecord {
  id: string;
  family_id: string;
  member_id: string;
  member?: FamilyMember;
  type: "appointment" | "medication" | "vaccine" | "exam";
  title: string;
  description?: string;
  date: string;
  doctor?: string;
  location?: string;
  file_url?: string;
  next_date?: string;
}

// Veículos
export interface Vehicle {
  id: string;
  family_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuel_type: "gasoline" | "ethanol" | "diesel" | "electric" | "hybrid" | "flex";
  ipva_due?: string;
  insurance_due?: string;
  next_revision?: string;
}

// Contatos de Emergência
export interface EmergencyContact {
  id: string;
  family_id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  priority: number;
}
