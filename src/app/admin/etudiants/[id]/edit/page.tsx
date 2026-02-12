"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { admin, filieres } from "@/lib/api";
import { toE164 } from "@/lib/phone";
import { INSTITUTES } from "@/lib/filieres";
import PhoneInput from "react-phone-number-input";

const NIVEAUX = [
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];

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
};

export default function EditEtudiantAdmin() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "etudiant" as "formateur" | "etudiant" | "admin",
    student_number: "",
    institute: "",
    filiere: "",
    niveau: "",
    phone: "" as string | undefined,
    address: "",
  });
  const [filieresList, setFilieresList] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    if (!form.institute) {
      setFilieresList([]);
      return;
    }
    filieres.get(form.institute).then((list) => setFilieresList(list)).catch(() => setFilieresList([]));
  }, [form.institute]);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setError("");
    admin
      .getUser(id)
      .then((data: UserData) => {
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          role: (data.role as "formateur" | "etudiant" | "admin") ?? "etudiant",
          student_number: data.student_number ?? "",
          institute: data.institute ?? "",
          filiere: data.filiere ?? "",
          niveau: data.niveau ?? "",
          phone: toE164(data.phone) ?? undefined,
          address: data.address ?? "",
        });
      })
      .catch(() => {
        setNotFound(true);
        toast.error("Étudiant introuvable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nom et email sont requis.");
      toast.error("Nom et email sont requis.");
      return;
    }
    setSaving(true);
    try {
      await admin.updateUser(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        student_number: form.student_number || undefined,
        institute: form.institute || undefined,
        filiere: form.filiere || undefined,
        niveau: form.niveau || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      toast.success("Étudiant enregistré.");
      router.push("/admin/etudiants");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin/etudiants"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
          >
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

  if (notFound) {
    return (
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin/etudiants"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux étudiants
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 mb-4">Étudiant introuvable.</p>
          <Link
            href="/admin/etudiants"
            className="text-[#03045e] font-medium hover:underline"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/etudiants"
          className="flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier l&apos;étudiant</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "formateur" | "etudiant" | "admin" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                <option value="etudiant">Étudiant</option>
                <option value="formateur">Formateur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro étudiant</label>
              <input
                type="text"
                value={form.student_number}
                onChange={(e) => setForm((f) => ({ ...f, student_number: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                placeholder="ex. 2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut</label>
              <select
                value={form.institute}
                onChange={(e) => setForm((f) => ({ ...f, institute: e.target.value, filiere: "" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {INSTITUTES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={form.filiere}
                onChange={(e) => setForm((f) => ({ ...f, filiere: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                disabled={!form.institute}
              >
                <option value="">—</option>
                {filieresList.map((f) => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
                {form.filiere && !filieresList.some((f) => f.name === form.filiere) && (
                  <option value={form.filiere}>{form.filiere} (actuelle)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select
                value={form.niveau}
                onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <PhoneInput
                international
                defaultCountry="TG"
                value={form.phone}
                onChange={(value) => setForm((f) => ({ ...f, phone: value ?? undefined }))}
                placeholder="Numéro de téléphone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:flex-1 [&_.PhoneInputCountrySelectArrow]:hidden"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              placeholder="Optionnel"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <Link
              href="/admin/etudiants"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
