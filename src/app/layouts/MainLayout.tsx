"use client";
import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/api";
import {
  FileText, BookOpen, Book, Wrench, BarChart3, Calendar,
  CheckSquare, Euro, FolderOpen, LogOut, LayoutDashboard, Menu, X, User
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleCheckDone, setRoleCheckDone] = useState(false);

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
      <div className="min-h-screen bg-gray-50">
        <LoadingScreen message="Chargement..." withSound />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-[#1e3a5f] transition-all duration-300 flex flex-col text-white shadow-lg fixed lg:static h-screen z-50 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                <Image
                  src="/images/logo.png"
                  alt="Logo UCAO-UUT"
                  fill
                  className="object-contain"
                />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-white">Web Academy</h1>
                  <p className="text-xs text-blue-300/80 font-medium">UCAO-UUT</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block text-blue-300/80 hover:text-white transition"
                title={sidebarOpen ? "Réduire" : "Agrandir"}
              >
                {sidebarOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden text-blue-300/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-8">
            <p className={`text-xs uppercase text-blue-300/70 mb-4 font-semibold tracking-wider ${!sidebarOpen && "hidden"}`}>
              CURSUS
            </p>
            <ul className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                        isActive
                          ? "bg-[#d90429] text-white shadow-sm"
                          : "text-blue-200/90 hover:bg-white/5 hover:text-white"
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-blue-300/80"}`} />
                      {sidebarOpen && (
                        <span className={`font-medium text-sm ${isActive ? "text-white" : "text-blue-200/90"}`}>
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
            <p className={`text-xs uppercase text-blue-300/70 mb-4 font-semibold tracking-wider ${!sidebarOpen && "hidden"}`}>
              PARAMÈTRES
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/profil"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-blue-200/90 hover:bg-white/5 hover:text-white transition-all duration-200"
                  title={!sidebarOpen ? "Mon profil" : undefined}
                >
                  <User className="w-5 h-5 flex-shrink-0 text-blue-300/80" />
                  {sidebarOpen && <span className="font-medium text-sm">Mon profil</span>}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-blue-200/90 hover:bg-white/5 hover:text-white transition-all duration-200"
                  title={!sidebarOpen ? "Déconnexion" : undefined}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0 text-blue-300/80" />
                  {sidebarOpen && <span className="font-medium text-sm">Déconnexion</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-[#1e3a5f] text-white p-2 rounded-lg shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        {children}
      </main>
    </div>
  );
}

