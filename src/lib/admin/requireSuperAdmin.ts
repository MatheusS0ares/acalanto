import { createClient as createServerClient } from "@/lib/supabase/server";

// Só o e-mail configurado em NEXT_PUBLIC_SUPER_ADMIN_EMAIL pode usar as
// rotas de administração. Não é um segredo (é só um e-mail), mas a
// autorização de verdade é sempre conferida aqui no servidor, nunca no
// cliente — o valor "público" só decide se o link "Admin" aparece no menu.
export async function requireSuperAdmin() {
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) return null;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== superAdminEmail) return null;

  return user;
}
