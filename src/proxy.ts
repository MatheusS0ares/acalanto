import { type NextRequest, NextResponse } from "next/server";

// Auth disabled during development — to restore, replace with:
// import { updateSession } from "@/lib/supabase/middleware";
// export async function proxy(request: NextRequest) { return updateSession(request); }

export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
