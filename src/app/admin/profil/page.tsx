"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Building2 } from "lucide-react";
import { auth } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";
import { toE164 } from "@/lib/phone";
import PhoneInput from "react-phone-number-input";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  institute?: string | null;
  phone?: string | null;
  address?: string | null;
};

const instituteLabel: Record<string, string> = {
  DGI: "Département de Génie Informatique (DGI)",
  ISSJ: "Institut Supérieur des Sciences Juridiques (ISSJ)",
  ISEG: "Institut des Sciences Économiques et de Gestion (ISEG)",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "" as string | undefined,
    address: "",
  });

  useEffect(() => {
    auth
      .getUser()
      .then((data: UserProfile & { message?: string; _id?: string }) => {
        if (data.message) {
          setError(data.message);
          setProfile(null);
          return;
        }
        const p: UserProfile = {
          id: (data as { _id?: string })._id ?? data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          institute: data.institute ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
        };
        setProfile(p);
        setFormData({
          name: p.name,
          email: p.email,
          phone: p.phone ?? undefined,
          address: p.address ?? "",
        });
      })
      .catch(() => {
        setError("Impossible de charger le profil administrateur.");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? undefined,
      address: profile.address ?? "",
    });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const phoneE164 = formData.phone ? toE164(formData.phone) : undefined;
      await auth.updateProfile({
        name: formData.name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: phoneE164,
        address: formData.address.trim() || undefined,
      });
      toast.success("Profil administrateur mis à jour.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: formData.name,
              email: formData.email,
              phone: formData.phone ?? null,
              address: formData.address || null,
            }
          : prev,
      );
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde du profil.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Chargement du profil administrateur..." withSound={false} />;
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mon profil administrateur</h1>
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
          {error || "Profil indisponible."}
        </div>
      </div>
    );
  }

  const displayName = isEditing ? formData.name : profile.name;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil administrateur</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gérez vos informations personnelles et vos coordonnées de contact.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Carte principale */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start gap-3 md:w-1/3">
            <div className="relative w-20 h-20 rounded-full bg-[#023e8a] flex items-center justify-center text-white text-2xl font-semibold">
              <span>{getInitials(profile.name)}</span>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                <User className="w-3 h-3" />
                {profile.role === "admin" ? "Administrateur" : profile.role}
              </p>
              {profile.institute && (
                <p className="mt-1 text-xs text-gray-600 flex items-center justify-center md:justify-start gap-1">
                  <Building2 className="w-3 h-3" />
                  {instituteLabel[profile.institute] ?? profile.institute}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" /> Annuler
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" /> Modifier
                </>
              )}
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, name: e.target.value }))
                      }
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, email: e.target.value }))
                      }
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                      <Phone className="w-4 h-4" />
                    </span>
                    <PhoneInput
                      international
                      defaultCountry="TG"
                      value={formData.phone}
                      onChange={(value) =>
                        setFormData((f) => ({ ...f, phone: value || undefined }))
                      }
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#03045e] focus-within:border-[#03045e] text-gray-900 disabled:bg-gray-50 [&>input]:w-full [&>input]:border-0 [&>input]:focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, address: e.target.value }))
                      }
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              )}

              {isEditing && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

