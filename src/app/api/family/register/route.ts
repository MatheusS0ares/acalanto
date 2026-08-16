import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { name, familyName, email, password, inviteCode } = await req.json();

  if (!name?.trim() || !familyName?.trim() || !email?.trim() || !password || password.length < 8) {
    return NextResponse.json({ error: "Preencha todos os campos (senha com no mínimo 8 caracteres)." }, { status: 400 });
  }

  const expectedCode = process.env.FAMILY_INVITE_CODE;
  if (!expectedCode || inviteCode?.trim() !== expectedCode) {
    return NextResponse.json({ error: "Código de convite inválido." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), family_name: familyName.trim() },
  });

  if (createError || !created.user) {
    const message = createError?.message?.includes("already been registered")
      ? "Esse e-mail já está cadastrado."
      : createError?.message ?? "Erro ao criar o usuário.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const slug = familyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const familyId = crypto.randomUUID();

  const { error: familyError } = await admin
    .from("acalanto_families")
    .insert({ id: familyId, name: familyName.trim(), slug: `${slug}-${Date.now()}` });

  if (familyError) {
    return NextResponse.json({ error: "Conta criada, mas houve um erro ao criar a família." }, { status: 500 });
  }

  const { error: memberError } = await admin.from("acalanto_family_members").insert({
    family_id: familyId,
    user_id: created.user.id,
    name: name.trim(),
    role: "owner",
  });

  if (memberError) {
    return NextResponse.json({ error: "Conta criada, mas houve um erro ao vincular sua família." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
