"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { admin } from "@/lib/api";

type UserData = {
  _id?: string;
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

const formatNiveau = (n: string | null | undefined) => {
  if (!n) return "—";
  if (n === "licence1") return "Licence 1";
  if (n === "licence2") return "Licence 2";
  if (n === "licence3") return "Licence 3";
  return n;
};

export default function VoirEtudiantAdmin() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    admin
      .getUser(id)
      .then((data: UserData) => setUser(data))
      .catch(() => {
        setNotFound(true);
        toast.error("Étudiant introuvable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/etudiants" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-600">
          Chargement...
        </div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/etudiants" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition">
            <ArrowLeft className="w-5 h-5" />
            Retour aux étudiants
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 mb-4">Étudiant introuvable.</p>
          <Link href="/admin/etudiants" className="text-[#03045e] font-medium hover:underline">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/admin/etudiants" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition">
          <ArrowLeft className="w-5 h-5" />
          Retour aux étudiants
        </Link>
        <Link
          href={`/admin/etudiants/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg hover:bg-[#023e8a] transition font-medium"
        >
          <Pencil className="w-4 h-4" />
          Modifier
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Détails de l&apos;étudiant</h1>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nom</dt>
            <dd className="mt-1 text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Numéro étudiant</dt>
            <dd className="mt-1 text-gray-900">{user.student_number || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Institut</dt>
            <dd className="mt-1 text-gray-900">{user.institute || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Filière</dt>
            <dd className="mt-1 text-gray-900">{user.filiere || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Niveau</dt>
            <dd className="mt-1 text-gray-900">{formatNiveau(user.niveau)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Statut identité</dt>
            <dd className="mt-1">
              {user.identity_verified ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Vérifié</span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">En attente</span>
              )}
            </dd>
          </div>
          {user.phone && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
              <dd className="mt-1 text-gray-900">{user.phone}</dd>
            </div>
          )}
          {user.address && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Adresse</dt>
              <dd className="mt-1 text-gray-900">{user.address}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
