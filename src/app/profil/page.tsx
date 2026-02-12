"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { User, Mail, Phone, MapPin, GraduationCap, Edit2, Save, X } from "lucide-react";
import { auth, settings } from "@/lib/api";
import { toE164 } from "@/lib/phone";
import PhoneInput from "react-phone-number-input";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  student_number?: string | null;
  institute?: string | null;
  filiere?: string | null;
  niveau?: string | null;
  phone?: string | null;
  address?: string | null;
};

const formatNiveau = (niveau: string | null | undefined) => {
  if (!niveau) return "—";
  if (niveau === "licence1") return "Licence 1";
  if (niveau === "licence2") return "Licence 2";
  if (niveau === "licence3") return "Licence 3";
  return niveau;
};

const instituteLabel: Record<string, string> = {
  DGI: "Département de Génie Informatique (DGI)",
  ISSJ: "Institut Supérieur des Sciences Juridiques (ISSJ)",
  ISEG: "Institut des Sciences Economiques et de Gestion (ISEG)",
};

const semesterLabel: Record<string, string> = {
  mousson: "Mousson",
  harmattan: "Harmattan",
};

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [platformSettings, setPlatformSettings] = useState<{ current_semester: string; current_academic_year: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "" as string | undefined,
    address: "",
  });

  useEffect(() => {
    settings.get().then(setPlatformSettings).catch(() => setPlatformSettings(null));
  }, []);

  useEffect(() => {
    auth
      .getUser()
      .then((data) => {
        if (data.message) {
          setError(data.message);
          setProfile(null);
          return;
        }
        const user = {
          id: String(data.id ?? data._id),
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role,
          student_number: data.student_number ?? null,
          institute: data.institute ?? null,
          filiere: data.filiere ?? null,
          niveau: data.niveau ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
        };
        setProfile(user);
        setFormData({
          name: user.name,
          email: user.email,
          phone: toE164(user.phone) ?? undefined,
          address: user.address ?? "",
        });
      })
      .catch(() => {
        setError("Session expirée ou non connecté.");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const data = await auth.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone?.trim() || undefined,
        address: formData.address || undefined,
      });
      if (data.message) {
        setSaveError(data.message);
        toast.error(data.message);
        return;
      }
      const savedPhone = data.phone ?? formData.phone ?? null;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: data.name ?? formData.name,
              email: data.email ?? formData.email,
              phone: savedPhone,
              address: data.address ?? (formData.address || null),
            }
          : null
      );
      setFormData({
        name: data.name ?? formData.name,
        email: data.email ?? formData.email,
        phone: savedPhone ?? undefined,
        address: data.address ?? formData.address ?? "",
      });
      setIsEditing(false);
      toast.success("Profil enregistré avec succès.");
    } catch {
      setSaveError("Impossible d'enregistrer les modifications. Réessayez.");
      toast.error("Impossible d'enregistrer les modifications. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: toE164(profile.phone) ?? undefined,
        address: profile.address ?? "",
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">
            {error || "Profil introuvable."} Veuillez vous reconnecter.
          </div>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
          >
            Se connecter
          </button>
        </div>
      </MainLayout>
    );
  }

  const displayName = isEditing ? formData.name : profile.name;

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gérez vos informations personnelles et académiques
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-[#03045e] rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {getInitials(profile.name)}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h2>
                  <p className="text-sm text-gray-600 mb-4">{profile.filiere || "—"}</p>
                  {profile.niveau && (
                    <p className="text-sm text-[#03045e] font-medium">{formatNiveau(profile.niveau)}</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#03045e]" />
                  Informations académiques
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Numéro d&apos;étudiant</p>
                    <p className="text-sm font-medium text-gray-900">{profile.student_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Institut</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.institute ? (instituteLabel[profile.institute] || profile.institute) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Filière</p>
                    <p className="text-sm font-medium text-gray-900">{profile.filiere || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Niveau</p>
                    <p className="text-sm font-medium text-gray-900">{formatNiveau(profile.niveau)}</p>
                  </div>
                  {platformSettings && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Semestre en cours</p>
                      <p className="text-sm font-medium text-gray-900">
                        {semesterLabel[platformSettings.current_semester] || platformSettings.current_semester} {platformSettings.current_academic_year}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                  {saveError}
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#03045e]" />
                  Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                        style={{ color: "#111827" }}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                        style={{ color: "#111827" }}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    {isEditing ? (
                      <PhoneInput
                        international
                        defaultCountry="TG"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value ?? undefined })}
                        placeholder="Numéro de téléphone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:flex-1 [&_.PhoneInputCountrySelectArrow]:hidden"
                        style={{ color: "#111827" }}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Adresse
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                        style={{ color: "#111827" }}
                        placeholder="Non renseigné"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
