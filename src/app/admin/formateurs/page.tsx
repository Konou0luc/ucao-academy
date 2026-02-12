"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";
import { admin } from "@/lib/api";
import PaginationBar from "@/components/PaginationBar";
import ConfirmDialog from "@/components/ConfirmDialog";

const PAGE_SIZE = 20;

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
};

const DEBOUNCE_MS = 400;

export default function FormateursAdmin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [teacherToDelete, setTeacherToDelete] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback((searchTerm: string, pageNum: number) => {
    setLoading(true);
    setError("");
    admin
      .getUsers({ role: "formateur", search: searchTerm || undefined, limit: PAGE_SIZE, page: pageNum })
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
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load(search, page);
  }, [search, page, load]);

  const handleDelete = async () => {
    if (!teacherToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await admin.deleteUser(teacherToDelete._id);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? "Erreur lors de la suppression.");
      }
      toast.success("Formateur supprimé.");
      load(search, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setTeacherToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des formateurs</h1>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher (nom, email)</label>
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
        <Link
          href="/admin/formateurs/nouveau"
          className="bg-[#d90429] hover:bg-[#b0031f] text-white px-5 py-2 rounded-lg font-semibold transition shrink-0 inline-block"
        >
          + Créer un formateur
        </Link>
      </div>
      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-600 bg-white rounded-xl border border-gray-100">Aucun formateur trouvé.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Téléphone</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    <Link
                      href={`/admin/formateurs/${u._id}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition inline-flex"
                      title="Voir le détail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/formateurs/${u._id}/edit`}
                      className="bg-[#03045e] hover:bg-[#023e8a] text-white px-3 py-1.5 rounded text-sm inline-block"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => setTeacherToDelete(u)}
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
      <PaginationBar page={page} total={total} pageSize={PAGE_SIZE} loading={loading} onPageChange={setPage} itemLabel="formateur" />

      <ConfirmDialog
        open={!!teacherToDelete}
        title="Supprimer le formateur"
        description={
          teacherToDelete ? (
            <p>
              Vous êtes sur le point de supprimer définitivement le compte du formateur{" "}
              <span className="font-semibold">{teacherToDelete.name}</span> ({teacherToDelete.email}).<br />
              Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            </p>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => !deleteLoading && setTeacherToDelete(null)}
      />
    </div>
  );
}
