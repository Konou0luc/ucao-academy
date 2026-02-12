"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { admin } from "@/lib/api";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  student_number?: string | null;
  institute?: string | null;
  filiere?: string | null;
  niveau?: string | null;
  phone?: string | null;
  address?: string | null;
  identity_verified?: boolean;
};

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 20;

export default function EtudiantsAdmin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [userToVerify, setUserToVerify] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState<"delete" | "verify" | null>(null);

  const load = useCallback((searchTerm: string, pageNum: number) => {
    setLoading(true);
    setError("");
    admin
      .getUsers({ role: "etudiant", search: searchTerm || undefined, limit: PAGE_SIZE, page: pageNum })
      .then((res: UserItem[] | { data: UserItem[]; total: number }) => {
        if (Array.isArray(res)) {
          setUsers(res);
          setTotal(res.length);
        } else {
          setUsers(res.data || []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load(search, page);
  }, [search, page, load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async () => {
    if (!userToDelete) return;
    setActionLoading("delete");
    try {
      const res = await admin.deleteUser(userToDelete._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
      }
      toast.success("Utilisateur supprimé.");
      load(search, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!userToVerify) return;
    setActionLoading("verify");
    try {
      await admin.verifyStudentIdentity(userToVerify._id);
      toast.success("Identité confirmée. Un email a été envoyé à l'étudiant.");
      load(search, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
      setUserToVerify(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des étudiants</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (nom, email, n° étudiant)</label>
        <div className="relative max-w-md">
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
      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-600 bg-white rounded-xl border border-gray-100">Aucun étudiant trouvé.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">N° étudiant</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Institut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Filière</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Niveau</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.student_number || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{u.institute || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{u.filiere || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.niveau === "licence1" ? "Licence 1" : u.niveau === "licence2" ? "Licence 2" : u.niveau === "licence3" ? "Licence 3" : u.niveau || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.identity_verified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Vérifié</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">En attente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {!u.identity_verified && (
                      <button
                        onClick={() => setUserToVerify(u)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Confirmer l&apos;identité
                      </button>
                    )}
                    <Link
                      href={`/admin/etudiants/${u._id}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition inline-flex"
                      title="Voir le détail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/etudiants/${u._id}/edit`}
                      className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm inline-block"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="bg-[#d90429] hover:bg-[#b0031f] text-white px-3 py-1.5 rounded text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} sur {totalPages} ({total} étudiant{total !== 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Modale confirmation identité */}
      {userToVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirmer l&apos;identité</h2>
            <p className="text-sm text-gray-700 mb-4">
              Voulez-vous vraiment confirmer l&apos;identité de{" "}
              <span className="font-semibold">{userToVerify.name}</span> ({userToVerify.email}) ?<br />
              L&apos;étudiant pourra alors se connecter à la plateforme.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToVerify(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                disabled={actionLoading === "verify"}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleVerifyIdentity}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium disabled:opacity-60"
                disabled={actionLoading === "verify"}
              >
                {actionLoading === "verify" ? "Confirmation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression étudiant */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 text-red-700">Supprimer l&apos;étudiant</h2>
            <p className="text-sm text-gray-700 mb-4">
              Vous êtes sur le point de supprimer définitivement le compte de{" "}
              <span className="font-semibold">{userToDelete.name}</span> ({userToDelete.email}).<br />
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                disabled={actionLoading === "delete"}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-[#d90429] text-white hover:bg-[#b0031f] text-sm font-medium disabled:opacity-60"
                disabled={actionLoading === "delete"}
              >
                {actionLoading === "delete" ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
