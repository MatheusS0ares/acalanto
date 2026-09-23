import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin_user = await requireSuperAdmin();
  if (!admin_user) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: families, error } = await admin
    .from("acalanto_families")
    .select("id, name, slug, disabled_tabs, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erro ao carregar famílias." }, { status: 500 });
  }

  const { data: members } = await admin
    .from("acalanto_family_members")
    .select("family_id, name, role, user_id");

  const familiesWithMembers = (families ?? []).map((f) => ({
    ...f,
    members: (members ?? []).filter((m) => m.family_id === f.id),
  }));

  return NextResponse.json({ families: familiesWithMembers });
}
