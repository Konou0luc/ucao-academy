"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { admin } from "@/lib/api";
import PhoneInput from "react-phone-number-input";

const INSTITUTS = ["DGI", "ISSJ", "ISEG"] as const;

export default function NouveauFormateurAdmin() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "" as string | undefined,
    address: "",
    institute: "" as "" | "DGI" | "ISSJ" | "ISEG",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Nom, email et mot de passe sont requis.");
      toast.error("Nom, email et mot de passe sont requis.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSaving(true);
    try {
      await admin.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "formateur",
        phone: form.phone?.trim() || undefined,
        address: form.address.trim() || undefined,
        institute: form.institute || undefined,
      });
      toast.success("Formateur créé avec succès.");
      router.push("/admin/formateurs");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la création.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/formateurs"
          className="flex items-center gap-2 text-gray-600 hover:text-[#03045e] transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Créer un formateur</h1>
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
                placeholder="Ex. Dr. Jean Dupont"
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
                placeholder="exemple@ucao-uut.tg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe * (min. 6 caractères)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 rounded"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institut</label>
              <select
                value={form.institute}
                onChange={(e) => setForm((f) => ({ ...f, institute: e.target.value as "" | "DGI" | "ISSJ" | "ISEG" }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
              >
                <option value="">—</option>
                {INSTITUTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
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
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#03045e] hover:bg-[#023e8a] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold transition"
            >
              {saving ? "Création..." : "Créer le formateur"}
            </button>
            <Link
              href="/admin/formateurs"
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
