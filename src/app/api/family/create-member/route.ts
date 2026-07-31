import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
    return NextResponse.json({ error: "Preencha nome, e-mail e uma senha com pelo menos 8 caracteres." }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("acalanto_family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .single();

  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Só o administrador da família pode criar novos membros." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });

  if (createError || !created.user) {
    const message = createError?.message?.includes("already been registered")
      ? "Esse e-mail já está cadastrado."
      : createError?.message ?? "Erro ao criar o usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: memberError } = await admin.from("acalanto_family_members").insert({
    family_id: me.family_id,
    user_id: created.user.id,
    name: name.trim(),
    role: "member",
  });

  if (memberError) {
    return NextResponse.json({ error: "Usuário criado, mas houve um erro ao vincular à família." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
