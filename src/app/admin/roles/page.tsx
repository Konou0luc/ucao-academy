"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, admin } from "@/lib/api";
import { INSTITUTES } from "@/lib/filieres";
import { toast } from "sonner";
import { Search, UserCog } from "lucide-react";
import PaginationBar from "@/components/PaginationBar";

const PAGE_SIZE = 20;

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  institute?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  formateur: "Formateur",
  etudiant: "Étudiant",
};

const INSTITUTE_LABEL: Record<string, string> = {
  DGI: "DGI",
  ISSJ: "ISSJ",
  ISEG: "ISEG",
};

export default function RolesAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: "etudiant", institute: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    auth
      .getUser()
      .then((u: { role?: string; institute?: string | null }) => {
        const superAdmin = u?.role === "admin" && (u?.institute == null || u?.institute === "");
        setIsSuperAdmin(superAdmin);
        if (!superAdmin) {
          toast.error("Accès réservé au super-admin.");
          router.replace("/admin/dashboard");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const loadUsers = useCallback(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    admin
      .getUsers({ search: search || undefined, limit: PAGE_SIZE, page })
      .then((res: UserItem[] | { data: UserItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setUsers(res);
          setTotal(res.length);
        } else {
          setUsers(res.data || []);
          setTotal(res.total ?? 0);
        }
      })
      .catch(() => toast.error("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [isSuperAdmin, search, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const startEdit = (u: UserItem) => {
    setEditingId(u._id);
    setEditForm({
      role: u.role || "etudiant",
      institute: u.institute || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (editForm.role === "admin" && !editForm.institute) {
      toast.error("Un administrateur doit avoir un institut (DGI, ISSJ ou ISEG).");
      return;
    }
    setSaving(true);
    try {
      await admin.updateUser(editingId, {
        role: editForm.role,
        institute: editForm.role === "admin" ? editForm.institute : undefined,
      });
      toast.success("Rôle mis à jour.");
      setEditingId(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Redirection...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des rôles</h1>
      <p className="text-gray-600 mb-6">
        En tant que super-admin, vous pouvez afficher tous les utilisateurs et leur affecter un rôle (Étudiant, Formateur, Administrateur d&apos;institut). Un administrateur doit être rattaché à un institut.
      </p>

      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (nom, email, matricule)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rôle actuel</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                  {editingId === u._id ? (
                    <>
                      <td colSpan={5} className="px-4 py-3">
                        <form onSubmit={handleSaveRole} className="flex flex-wrap items-center gap-4">
                          <span className="font-medium text-gray-900">{u.name}</span>
                          <span className="text-gray-500 text-sm">{u.email}</span>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Rôle :</label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 bg-white"
                            >
                              <option value="etudiant">Étudiant</option>
                              <option value="formateur">Formateur</option>
                              <option value="admin">Administrateur</option>
                            </select>
                          </div>
                          {editForm.role === "admin" && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Institut :</label>
                              <select
                                value={editForm.institute}
                                onChange={(e) => setEditForm((f) => ({ ...f, institute: e.target.value }))}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                required
                              >
                                <option value="">— Choisir —</option>
                                {INSTITUTES.map((i) => (
                                  <option key={i.value} value={i.value}>{i.label}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm"
                          >
                            {saving ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                          >
                            Annuler
                          </button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium bg-[#03045e]/10 text-[#03045e]">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {u.role === "admin"
                          ? u.institute
                            ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#03045e]/15 text-[#03045e] border border-[#03045e]/20">
                                  {INSTITUTE_LABEL[u.institute] ?? u.institute}
                                </span>
                              )
                            : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  Super-admin
                                </span>
                              )
                          : u.institute
                            ? (INSTITUTE_LABEL[u.institute] ?? u.institute)
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#03045e] hover:text-[#023e8a]"
                        >
                          <UserCog className="w-4 h-4" />
                          Modifier le rôle
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-500">Aucun utilisateur trouvé.</div>
          )}
        </div>
      )}
      <PaginationBar
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        loading={loading}
        onPageChange={setPage}
        itemLabel="utilisateur"
      />
    </div>
  );
}
