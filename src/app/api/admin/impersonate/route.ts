import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const admin_user = await requireSuperAdmin();
  if (!admin_user) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { familyId } = await req.json();
  if (!familyId) {
    return NextResponse.json({ error: "familyId é obrigatório." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: owner } = await admin
    .from("acalanto_family_members")
    .select("user_id")
    .eq("family_id", familyId)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (!owner) {
    return NextResponse.json({ error: "Não achei o responsável dessa família." }, { status: 404 });
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(owner.user_id);
  if (userError || !userData.user?.email) {
    return NextResponse.json({ error: "Não consegui achar o e-mail dessa conta." }, { status: 404 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
  });

  if (linkError || !linkData) {
    return NextResponse.json({ error: "Erro ao gerar o link de acesso." }, { status: 500 });
  }

  return NextResponse.json({ actionLink: linkData.properties.action_link });
}
