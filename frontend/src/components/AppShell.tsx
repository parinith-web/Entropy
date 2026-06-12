import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { GitCompare, Map, TrendingUp, LogOut, User, BookOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRegionsData } from "@/hooks/useRegionsData";
import { useForecastWindow } from "@/hooks/useForecastWindow";
import entropyMark from "@/assets/entropy-mark.svg";
import entropyWordmark from "@/assets/entropy-wordmark.png";
import { clearAuthSession } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const NAV = [
  { to: "/", label: "Live map", icon: Map },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/theory", label: "Math & Theory", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const { nationalStats } = useRegionsData();
  const { headerLabel: forecastLabel } = useForecastWindow(nationalStats);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      const storedEmail = localStorage.getItem("userEmail");
      if (storedName) {
        setUserName(storedName);
      }
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    }
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <header className="relative z-20 flex h-[62px] items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
        <div className="flex items-center">
          <Link
            to="/"
            className="relative -translate-y-[4px] h-[45px] w-[110.319px] shrink-0 overflow-hidden"
            aria-label="entropy home"
          >
            <img
              src={entropyMark}
              alt=""
              className="absolute left-[2.9px] top-[10.16px] h-[27.495px] w-[23.944px] max-w-none"
            />
            <span className="pointer-events-none absolute left-[32.71px] top-[11.97px] block h-[25.533px] w-[77.397px] overflow-hidden">
              <img
                src={entropyWordmark}
                alt=""
                className="absolute max-w-none"
                style={{
                  height: "127.99%",
                  left: "0.32%",
                  top: "-0.92%",
                  width: "99.8%",
                }}
              />
            </span>
          </Link>

          <nav className="ml-8 flex items-start">
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`ml-1 first:ml-0 flex items-center rounded-md px-3 py-2 text-sm font-medium leading-5 ${
                    active ? "bg-[#e0f2fe] text-[#0369a1]" : "text-[#4b5563] hover:bg-[#f3f4f6]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  <span className="ml-2">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center">
          <div className="flex items-center rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-[17px] py-[7px] text-sm leading-5 text-[#6b7280]">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="ml-2">
              Live · model v0.4 · 3-hr surge forecast · {forecastLabel}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-4 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-black text-white hover:opacity-85 transition focus:outline-none"
                aria-label="Account menu"
                type="button"
              >
                <User className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 bg-white border border-[#e5e7eb] shadow-md rounded-md p-1 z-50">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-[#6b7280]">
                My Account
              </DropdownMenuLabel>
              <div className="px-2 py-1 text-sm font-medium text-[#111827] truncate">
                {userName}
              </div>
              {userEmail && (
                <div className="px-2 pb-1 text-xs text-[#9ca3af] truncate">
                  {userEmail}
                </div>
              )}
              <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-[#f3f4f6]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium text-[#ef4444] hover:bg-[#fef2f2] focus:bg-[#fef2f2] outline-none"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
