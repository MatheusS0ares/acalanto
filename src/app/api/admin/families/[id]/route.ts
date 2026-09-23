import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin_user = await requireSuperAdmin();
  if (!admin_user) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const { disabled_tabs } = await req.json();

  if (!Array.isArray(disabled_tabs) || !disabled_tabs.every((t) => typeof t === "string")) {
    return NextResponse.json({ error: "disabled_tabs precisa ser uma lista de strings." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("acalanto_families")
    .update({ disabled_tabs })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
