import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// O cliente do navegador usa fluxo PKCE — todo link mágico (magic link,
// convite, etc.) precisa passar por aqui pra trocar o "code" da URL por
// uma sessão de verdade (cookies), antes de seguir pro destino final.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
