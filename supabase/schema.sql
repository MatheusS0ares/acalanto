-- ============================================================
-- Casa Portal — Schema Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FAMÍLIAS
-- ============================================================
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- ============================================================
-- FINANCEIRO
-- ============================================================
CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#6b7280',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  last_digits CHAR(4),
  card_limit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES finance_categories(id),
  payment_method TEXT CHECK (payment_method IN ('cash', 'debit', 'credit_card', 'pix', 'transfer')),
  credit_card_id UUID REFERENCES credit_cards(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTOS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  owner_member_id UUID REFERENCES family_members(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other' CHECK (type IN ('rg', 'cpf', 'cnh', 'passport', 'birth_certificate', 'marriage', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_name TEXT,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MANTIMENTOS
-- ============================================================
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  unit TEXT NOT NULL DEFAULT 'unid',
  current_quantity NUMERIC(10, 2) DEFAULT 0,
  min_quantity NUMERIC(10, 2) DEFAULT 1,
  emoji TEXT DEFAULT '🛒',
  added_by UUID REFERENCES family_members(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LISTA DE COMPRAS
-- ============================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Lista de compras',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'shopping', 'done')),
  store TEXT,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2) DEFAULT 1,
  unit TEXT DEFAULT 'unid',
  estimated_price NUMERIC(10, 2),
  actual_price NUMERIC(10, 2),
  category TEXT DEFAULT 'Outros',
  emoji TEXT DEFAULT '🛒',
  checked BOOLEAN DEFAULT FALSE,
  checked_by UUID REFERENCES family_members(id),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TAREFAS
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES family_members(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  points INTEGER DEFAULT 5,
  emoji TEXT DEFAULT '✅',
  completed_by UUID REFERENCES family_members(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CALENDÁRIO
-- ============================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#22c55e',
  created_by UUID REFERENCES family_members(id),
  notify_all BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAÚDE
-- ============================================================
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id),
  type TEXT NOT NULL CHECK (type IN ('appointment', 'medication', 'vaccine', 'exam')),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  doctor TEXT,
  location TEXT,
  file_url TEXT,
  next_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id),
  name TEXT NOT NULL,
  dosage TEXT,
  schedule TEXT,
  stock INTEGER DEFAULT 0,
  refill_alert INTEGER DEFAULT 10,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEÍCULOS
-- ============================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  plate TEXT,
  color TEXT DEFAULT '#1e40af',
  fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'ethanol', 'diesel', 'electric', 'hybrid', 'flex')),
  ipva_due DATE,
  insurance_due DATE,
  next_revision DATE,
  current_km INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  km INTEGER,
  cost NUMERIC(10, 2),
  workshop TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTATOS DE EMERGÊNCIA
-- ============================================================
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT DEFAULT 'Outros',
  priority INTEGER DEFAULT 3,
  emoji TEXT DEFAULT '📞',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para pegar o family_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas: somente membros da mesma família podem ver e alterar dados

CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (family_id = get_user_family_id());
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (family_id = get_user_family_id() OR user_id = auth.uid());
CREATE POLICY "family_members_update" ON family_members FOR UPDATE USING (family_id = get_user_family_id());

CREATE POLICY "families_select" ON families FOR SELECT USING (id = get_user_family_id());
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "families_update" ON families FOR UPDATE USING (id = get_user_family_id());

-- Macro para criar políticas CRUD por family_id
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['finance_categories','credit_cards','transactions','documents','pantry_items','shopping_lists','tasks','calendar_events','health_records','medications','vehicles','emergency_contacts']
  LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON %s FOR SELECT USING (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %s FOR INSERT WITH CHECK (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %s FOR UPDATE USING (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %s FOR DELETE USING (family_id = get_user_family_id())', t, t);
  END LOOP;
END $$;

-- Shopping items (via list)
CREATE POLICY "shopping_items_select" ON shopping_items FOR SELECT
  USING (list_id IN (SELECT id FROM shopping_lists WHERE family_id = get_user_family_id()));
CREATE POLICY "shopping_items_insert" ON shopping_items FOR INSERT
  WITH CHECK (list_id IN (SELECT id FROM shopping_lists WHERE family_id = get_user_family_id()));
CREATE POLICY "shopping_items_update" ON shopping_items FOR UPDATE
  USING (list_id IN (SELECT id FROM shopping_lists WHERE family_id = get_user_family_id()));
CREATE POLICY "shopping_items_delete" ON shopping_items FOR DELETE
  USING (list_id IN (SELECT id FROM shopping_lists WHERE family_id = get_user_family_id()));

-- Vehicle maintenances (via vehicle)
CREATE POLICY "vehicle_maintenances_select" ON vehicle_maintenances FOR SELECT
  USING (vehicle_id IN (SELECT id FROM vehicles WHERE family_id = get_user_family_id()));
CREATE POLICY "vehicle_maintenances_insert" ON vehicle_maintenances FOR INSERT
  WITH CHECK (vehicle_id IN (SELECT id FROM vehicles WHERE family_id = get_user_family_id()));
CREATE POLICY "vehicle_maintenances_update" ON vehicle_maintenances FOR UPDATE
  USING (vehicle_id IN (SELECT id FROM vehicles WHERE family_id = get_user_family_id()));
CREATE POLICY "vehicle_maintenances_delete" ON vehicle_maintenances FOR DELETE
  USING (vehicle_id IN (SELECT id FROM vehicles WHERE family_id = get_user_family_id()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Execute no Dashboard do Supabase > Storage > New Bucket:
-- 1. "family-documents" (privado) — para documentos da família
-- 2. "avatars" (público) — para fotos de perfil

-- ============================================================
-- DADOS INICIAIS (categorias padrão — inserir após criar família)
-- ============================================================
-- Exemplo de seed de categorias (chamar no código após criar família):
-- INSERT INTO finance_categories (family_id, name, icon, color, type) VALUES
-- ('{family_id}', 'Alimentação', 'restaurant', '#22c55e', 'expense'),
-- ('{family_id}', 'Transporte', 'car', '#3b82f6', 'expense'),
-- ('{family_id}', 'Saúde', 'favorite', '#ef4444', 'expense'),
-- ('{family_id}', 'Lazer', 'sports_esports', '#8b5cf6', 'expense'),
-- ('{family_id}', 'Casa', 'home', '#f59e0b', 'expense'),
-- ('{family_id}', 'Educação', 'school', '#06b6d4', 'expense'),
-- ('{family_id}', 'Roupas', 'checkroom', '#ec4899', 'expense'),
-- ('{family_id}', 'Salário', 'account_balance', '#22c55e', 'income'),
-- ('{family_id}', 'Freelance', 'work', '#3b82f6', 'income');

-- ============================================================
-- CARDÁPIO SEMANAL
-- ============================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Refeição',
  prep_time INTEGER,
  servings INTEGER DEFAULT 2,
  ingredients JSONB DEFAULT '[]',
  instructions TEXT,
  emoji TEXT DEFAULT '🍽️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meal_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES recipes(id),
  custom_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OBRAS E REFORMAS
-- ============================================================
CREATE TABLE reforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room TEXT,
  emoji TEXT DEFAULT '🔧',
  budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'executing', 'done')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reform_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reform_id UUID REFERENCES reforms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  supplier TEXT,
  budgeted NUMERIC(10, 2) NOT NULL DEFAULT 0,
  actual NUMERIC(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'done')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COFRE DE SENHAS (senha armazenada criptografada)
-- ============================================================
CREATE TABLE password_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  username TEXT,
  -- senha criptografada com AES-256 no lado do cliente antes do insert
  encrypted_password TEXT NOT NULL,
  url TEXT,
  category TEXT DEFAULT 'Outros',
  emoji TEXT DEFAULT '🔑',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMÓRIAS FAMILIARES
-- ============================================================
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  description TEXT,
  color TEXT DEFAULT '#22c55e',
  emoji TEXT DEFAULT '📸',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PETS
-- ============================================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date DATE,
  weight NUMERIC(6, 2),
  color TEXT DEFAULT '#f59e0b',
  emoji TEXT DEFAULT '🐾',
  chip TEXT,
  vet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pet_vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  next_date DATE,
  vet TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pet_health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('consulta', 'vermifugo', 'pulgas', 'exame', 'outros')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  next_date DATE,
  cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONFIGURAÇÕES DE FAMÍLIA (2FA, PIN, preferências)
-- ============================================================
CREATE TABLE family_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE UNIQUE,
  vault_pin_hash TEXT,
  two_factor_required BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (segurança — quem fez o quê)
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS para novos módulos
-- ============================================================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE reforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reform_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipes','meal_plan','reforms','password_vault','memories','pets','family_settings','audit_logs']
  LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON %s FOR SELECT USING (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %s FOR INSERT WITH CHECK (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %s FOR UPDATE USING (family_id = get_user_family_id())', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %s FOR DELETE USING (family_id = get_user_family_id())', t, t);
  END LOOP;
END $$;

-- Reform items via reform
CREATE POLICY "reform_items_select" ON reform_items FOR SELECT
  USING (reform_id IN (SELECT id FROM reforms WHERE family_id = get_user_family_id()));
CREATE POLICY "reform_items_insert" ON reform_items FOR INSERT
  WITH CHECK (reform_id IN (SELECT id FROM reforms WHERE family_id = get_user_family_id()));
CREATE POLICY "reform_items_update" ON reform_items FOR UPDATE
  USING (reform_id IN (SELECT id FROM reforms WHERE family_id = get_user_family_id()));
CREATE POLICY "reform_items_delete" ON reform_items FOR DELETE
  USING (reform_id IN (SELECT id FROM reforms WHERE family_id = get_user_family_id()));

-- Memory photos via memory
CREATE POLICY "memory_photos_select" ON memory_photos FOR SELECT
  USING (memory_id IN (SELECT id FROM memories WHERE family_id = get_user_family_id()));
CREATE POLICY "memory_photos_insert" ON memory_photos FOR INSERT
  WITH CHECK (memory_id IN (SELECT id FROM memories WHERE family_id = get_user_family_id()));
CREATE POLICY "memory_photos_delete" ON memory_photos FOR DELETE
  USING (memory_id IN (SELECT id FROM memories WHERE family_id = get_user_family_id()));

-- Pet sub-records via pet
CREATE POLICY "pet_vaccines_select" ON pet_vaccines FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_vaccines_insert" ON pet_vaccines FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_vaccines_update" ON pet_vaccines FOR UPDATE
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_vaccines_delete" ON pet_vaccines FOR DELETE
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));

CREATE POLICY "pet_health_select" ON pet_health_records FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_health_insert" ON pet_health_records FOR INSERT
  WITH CHECK (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_health_update" ON pet_health_records FOR UPDATE
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));
CREATE POLICY "pet_health_delete" ON pet_health_records FOR DELETE
  USING (pet_id IN (SELECT id FROM pets WHERE family_id = get_user_family_id()));

-- ============================================================
-- STORAGE — SIGNED URLS (execute via Supabase Dashboard > Storage)
-- ============================================================
-- Bucket: family-documents (private)
-- Política: somente membros da mesma família podem ler/escrever
-- Signed URLs expiram em 1 hora (gerados server-side)
--
-- Bucket: memory-photos (private)  
-- Bucket: avatars (public)
--
-- No código Next.js, gere signed URLs assim:
-- const { data } = await supabase.storage
--   .from('family-documents')
--   .createSignedUrl(filePath, 3600); // expira em 1h
