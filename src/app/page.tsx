import { redirect } from "next/navigation";

// Dev mode: bypass landing page, go straight to dashboard.
// To restore landing page, revert this file from git history.
export default function HomePage() {
  redirect("/dashboard");
}
