"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, admin } from "@/lib/api";
import { INSTITUTES } from "@/lib/filieres";
import { toast } from "sonner";
import { ShieldCheck, Plus, Eye, EyeOff } from "lucide-react";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  institute?: string | null;
};

const INSTITUTE_LABEL: Record<string, string> = {
  DGI: "DGI",
  ISSJ: "ISSJ",
  ISEG: "ISEG",
};

export default function AdministrateursAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    institute: "DGI",
  });

  useEffect(() => {
    auth
      .getUser()
      .then((u: { role?: string; institute?: string | null }) => {
        const superAdmin = u?.role === "admin" && (u?.institute == null || u?.institute === "");
        setIsSuperAdmin(superAdmin);
        if (!superAdmin) {
          toast.error("Accès réservé au super-admin.");
          router.replace("/admin/dashboard");
          return;
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    admin
      .getUsers({ role: "admin" })
      .then((list: AdminUser[]) => setAdmins(Array.isArray(list) ? list : []))
      .catch(() => toast.error("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  const handleCreate = () => {
    setCreating(true);
    setForm({ name: "", email: "", password: "", institute: "DGI" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Nom, email et mot de passe sont requis.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSaving(true);
    try {
      await admin.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "admin",
        institute: form.institute,
      });
      toast.success("Administrateur créé.");
      setCreating(false);
      const list = await admin.getUsers({ role: "admin" });
      setAdmins(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Supprimer l'administrateur « ${user.name} » (${user.email}) ?`)) return;
    try {
      const res = await admin.deleteUser(user._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success("Administrateur supprimé.");
      setAdmins((prev) => prev.filter((a) => a._id !== user._id));
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  if (!isSuperAdmin && admins.length === 0 && !loading) {
    return null;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Redirection...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Administrateurs d&apos;institut</h1>
      <p className="text-gray-600 mb-6">
        En tant que super-admin, vous seul pouvez créer et supprimer les comptes administrateurs. Chaque admin gère uniquement son institut (DGI, ISSJ, ISEG).
      </p>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un administrateur
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 max-w-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvel administrateur d&apos;institut</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut *</label>
              <select
                value={form.institute}
                onChange={(e) => setForm((f) => ({ ...f, institute: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white"
                required
              >
                {INSTITUTES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="Ex. Jean Dupont"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="admin-dgi@ucao-uut.tg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
              >
                {saving ? "Création..." : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.institute ? INSTITUTE_LABEL[user.institute] ?? user.institute : "Super-admin"}
                  </td>
                  <td className="px-4 py-3">
                    {user.institute != null && user.institute !== "" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        className="text-[#d90429] hover:text-[#b0031f] text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
