"use client";
import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LayoutDashboard, BookOpen, User, LogOut, MessageSquare } from "lucide-react";
import { auth } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";

type UserType = { name: string; email: string; role?: string; [key: string]: unknown };

function Sidebar({
  open,
  onClose,
  pathname,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  onLogout: () => void;
}) {
  const items = [
    { href: "/formateur", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/formateur/cours", label: "Mes cours", icon: BookOpen },
    { href: "/formateur/discussions", label: "Discussions", icon: MessageSquare },
    { href: "/formateur/profil", label: "Mon profil", icon: User },
  ];
  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] text-white flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-blue-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">UCAO Academy</h1>
              <p className="text-xs text-blue-300/80">Espace Formateur</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden p-2 text-blue-300/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4">
          <p className="text-xs uppercase text-blue-300/70 mb-4 font-semibold tracking-wider">Menu</p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/formateur" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                      isActive ? "bg-[#d90429] text-white" : "text-blue-100 hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-blue-800/30">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-blue-200 hover:bg-white/10 transition text-left"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
    </>
  );
}

export default function FormateurLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    auth
      .getUser()
      .then((data: UserType & { message?: string }) => {
        if (data.message) {
          router.push("/login");
          return;
        }
        if (data.role !== "formateur") {
          if (data.role === "admin") router.push("/admin/dashboard");
          else router.push("/dashboard");
          return;
        }
        setUser(data);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingScreen message="Chargement de l'espace formateur..." withSound />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[#d90429] hover:bg-red-50 rounded-lg transition"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
