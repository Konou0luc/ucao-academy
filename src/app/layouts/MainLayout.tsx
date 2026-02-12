"use client";
import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/api";
import {
  FileText, BookOpen, Book, Wrench, BarChart3, Calendar,
  CheckSquare, Euro, FolderOpen, LogOut, LayoutDashboard, Menu, X, User,
  Sun, Moon
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const THEME_KEY = "ucao-academy-theme";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleCheckDone, setRoleCheckDone] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Thème : lecture au montage + application sur le document
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = stored === "dark" || (stored !== "light" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    auth
      .getUser()
      .then((data: { role?: string; message?: string }) => {
        if (data.role === "formateur") {
          router.replace("/formateur");
          return;
        }
        if (data.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        setRoleCheckDone(true);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const menuItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/cours", label: "Cours", icon: Book },
    { href: "/discussions", label: "Discussions", icon: FileText },
    { href: "/actualites", label: "Actualités", icon: BookOpen },
    { href: "/emploi-du-temps", label: "Planning", icon: Calendar },
    { href: "/calendrier", label: "Calendrier", icon: Calendar },
    { href: "/results", label: "Résultats", icon: BarChart3 },
    { href: "/exams", label: "Examens", icon: BookOpen },
    { href: "/guides", label: "Guides", icon: FileText },
    { href: "/tools", label: "Outils", icon: Wrench },
    { href: "/assiduity", label: "Assiduité", icon: CheckSquare },
    { href: "/finance", label: "Finance", icon: Euro },
    { href: "/ressources", label: "Ressources", icon: FolderOpen },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!roleCheckDone) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingScreen message="Chargement..." withSound />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Topbar : uniquement sur mobile — hamburger à gauche, mode jour/nuit à droite */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={darkMode ? "Mode clair" : "Mode sombre"}
            title={darkMode ? "Mode clair" : "Mode sombre"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay mobile : clic ferme le sidebar (pas de croix dans le sidebar) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
        )}

        {/* Sidebar : mobile = pleine hauteur (top-0, h-screen), sans croix ; desktop = à gauche */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-blue-800/30 bg-[#1e3a5f] text-white shadow-lg transition-all duration-300 lg:static lg:h-full ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-blue-800/30 px-4 py-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <Image src="/images/logo.png" alt="Logo UCAO-UUT" fill className="object-contain" />
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-white">UCAO Academy</h1>
                  <p className="truncate text-xs font-medium text-blue-300/80">UCAO-UUT</p>
                </div>
              )}
            </div>
            {/* Bouton réduire/agrandir : uniquement sur desktop (pas de croix sur mobile) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden text-blue-300/80 transition hover:text-white lg:block"
              title={sidebarOpen ? "Réduire" : "Agrandir"}
            >
              {sidebarOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="mb-8">
              <p className={`mb-4 text-xs font-semibold uppercase tracking-wider text-blue-300/70 ${!sidebarOpen && "hidden"}`}>
                CURSUS
              </p>
              <ul className="space-y-0.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 ${
                          isActive
                            ? "bg-[#d90429] text-white shadow-sm"
                            : "text-blue-200/90 hover:bg-white/5 hover:text-white"
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-blue-300/80"}`} />
                        {sidebarOpen && (
                          <span className={`text-sm font-medium ${isActive ? "text-white" : "text-blue-200/90"}`}>
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className={`mb-4 text-xs font-semibold uppercase tracking-wider text-blue-300/70 ${!sidebarOpen && "hidden"}`}>
                PARAMÈTRES
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/profil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-blue-200/90 transition-all duration-200 hover:bg-white/5 hover:text-white"
                    title={!sidebarOpen ? "Mon profil" : undefined}
                  >
                    <User className="h-5 w-5 shrink-0 text-blue-300/80" />
                    {sidebarOpen && <span className="text-sm font-medium">Mon profil</span>}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-blue-200/90 transition-all duration-200 hover:bg-white/5 hover:text-white"
                    title={!sidebarOpen ? "Déconnexion" : undefined}
                  >
                    <LogOut className="h-5 w-5 shrink-0 text-blue-300/80" />
                    {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Zone de contenu : plus de bouton flottant, contenu propre sous la topbar */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
