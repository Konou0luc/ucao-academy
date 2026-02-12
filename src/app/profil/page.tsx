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
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gray-50 p-6 dark:bg-transparent">
          <p className="text-gray-600 dark:text-gray-400">Chargement du profil...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-transparent">
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-900/20">
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
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
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
              <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[#03045e] text-4xl font-bold text-white">
                    {getInitials(profile.name)}
                  </div>
                  <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{profile.filiere || "—"}</p>
                  {profile.niveau && (
                    <p className="text-sm font-medium text-[#03045e] dark:text-blue-400">{formatNiveau(profile.niveau)}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <GraduationCap className="h-5 w-5 text-[#03045e] dark:text-blue-400" />
                  Informations académiques
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Numéro d&apos;étudiant</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.student_number || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Institut</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.institute ? (instituteLabel[profile.institute] || profile.institute) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Filière</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.filiere || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Niveau</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatNiveau(profile.niveau)}</p>
                  </div>
                  {platformSettings && (
                    <div>
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Semestre en cours</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {semesterLabel[platformSettings.current_semester] || platformSettings.current_semester} {platformSettings.current_academic_year}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-900/20">
                  {saveError}
                </div>
              )}
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <User className="h-5 w-5 text-[#03045e] dark:text-blue-400" />
                  Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom complet</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </label>
                    {isEditing ? (
                      <PhoneInput
                        international
                        defaultCountry="TG"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value ?? undefined })}
                        placeholder="Numéro de téléphone"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:flex-1 [&_.PhoneInputCountrySelectArrow]:hidden"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile.phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4" />
                      Adresse
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Non renseigné"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile.address || "—"}</p>
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
