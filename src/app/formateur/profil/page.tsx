"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, Edit2, Save, X, BookOpen, Calendar, Building2 } from "lucide-react";
import { auth } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";
import { toE164 } from "@/lib/phone";
import PhoneInput from "react-phone-number-input";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string | null;
  address?: string | null;
};

type AssignmentItem = {
  _id: string;
  institut: string;
  semester: string;
  academic_year: number;
  course_id?: string;
  course_title: string;
};

const instituteLabel: Record<string, string> = {
  DGI: "DGI",
  ISSJ: "ISSJ",
  ISEG: "ISEG",
};

const semesterLabel: Record<string, string> = {
  mousson: "Mousson",
  harmattan: "Harmattan",
};

export default function FormateurProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
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
        const user: UserProfile = {
          id: String(data.id ?? data._id),
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role,
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

  useEffect(() => {
    if (!profile) return;
    auth
      .getMyAssignments()
      .then((list: AssignmentItem[]) => setAssignments(Array.isArray(list) ? list : []))
      .catch(() => setAssignments([]));
  }, [profile]);

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
      if ((data as { message?: string }).message) {
        setSaveError((data as { message: string }).message);
        toast.error((data as { message: string }).message);
        return;
      }
      const d = data as UserProfile & { name?: string; email?: string; phone?: string | null; address?: string | null };
      const savedPhone = d.phone ?? formData.phone ?? null;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: d.name ?? formData.name,
              email: d.email ?? formData.email,
              phone: savedPhone,
              address: d.address ?? (formData.address || null),
            }
          : null
      );
      setFormData({
        name: d.name ?? formData.name,
        email: d.email ?? formData.email,
        phone: toE164(savedPhone) ?? formData.phone,
        address: d.address ?? formData.address ?? "",
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
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <LoadingScreen message="Chargement du profil..." withSound={false} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          {error || "Profil introuvable."} Veuillez vous reconnecter.
        </div>
      </div>
    );
  }

  const displayName = isEditing ? formData.name : profile.name;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="button"
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
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-[#03045e] rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {getInitials(profile.name)}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#03045e]/10 text-[#03045e] rounded-full text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  Formateur
                </span>
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#03045e]" />
                Mes affectations
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Instituts, semestres et cours qui vous sont assignés.
              </p>
              {assignments.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune affectation pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-2 pr-4 font-medium">Institut</th>
                        <th className="py-2 pr-4 font-medium">Semestre</th>
                        <th className="py-2 pr-4 font-medium">Année</th>
                        <th className="py-2 font-medium">Cours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a._id} className="border-b border-gray-100">
                          <td className="py-3 pr-4 text-gray-900 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                            {instituteLabel[a.institut] ?? a.institut}
                          </td>
                          <td className="py-3 pr-4 text-gray-900">{semesterLabel[a.semester] ?? a.semester}</td>
                          <td className="py-3 pr-4 text-gray-900">{a.academic_year}</td>
                          <td className="py-3 text-gray-900">{a.course_title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
