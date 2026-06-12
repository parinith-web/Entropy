import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Sign In — Entropy" }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return <AuthPage mode="login" onSuccess={() => navigate({ to: "/" })} />;
}
