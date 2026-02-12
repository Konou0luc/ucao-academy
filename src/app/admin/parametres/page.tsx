"use client";
import { useState, useEffect } from "react";
import { Settings, Save, Calendar, Lock, HardDrive } from "lucide-react";
import { admin, auth } from "@/lib/api";
import { toast } from "sonner";

const SEMESTRES = [
  { value: "harmattan", label: "Harmattan" },
  { value: "mousson", label: "Mousson" },
];

export default function ParametresAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [current_semester, setCurrentSemester] = useState<string>("harmattan");
  const [current_academic_year, setCurrentAcademicYear] = useState<string>("");
  const [max_upload_size_mb, setMaxUploadSizeMb] = useState<string>("50");

  useEffect(() => {
    auth.getUser().then((u: { role?: string; institute?: string | null }) => {
      setIsSuperAdmin(u?.role === "admin" && (u?.institute == null || u?.institute === ""));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    admin
      .getSettings()
      .then((data) => {
        setCurrentSemester(data.current_semester ?? "harmattan");
        setCurrentAcademicYear(
          data.current_academic_year != null ? String(data.current_academic_year) : new Date().getFullYear().toString()
        );
        setMaxUploadSizeMb(
          data.max_upload_size_mb != null ? String(data.max_upload_size_mb) : "50"
        );
      })
      .catch(() => toast.error("Impossible de charger les paramètres."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const year = current_academic_year ? parseInt(current_academic_year, 10) : undefined;
      const maxMb = max_upload_size_mb ? parseInt(max_upload_size_mb, 10) : undefined;
      await admin.updateSettings({
        current_semester: current_semester || undefined,
        current_academic_year: year,
        max_upload_size_mb: maxMb,
      });
      toast.success("Paramètres enregistrés.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Paramètres de la plateforme</h1>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-10 bg-gray-100 rounded w-full max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Paramètres de la plateforme</h1>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#03045e]/10 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#03045e]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contexte universitaire</h2>
            <p className="text-sm text-gray-500">
              Semestre et année en cours — utilisés pour les cours, emplois du temps et calendriers.
            </p>
          </div>
        </div>

        {!isSuperAdmin && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Seul le super-admin peut modifier ces paramètres. Affichage en lecture seule.</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semestre en cours</label>
            <select
              value={current_semester}
              onChange={(e) => setCurrentSemester(e.target.value)}
              disabled={!isSuperAdmin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              {SEMESTRES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Année universitaire en cours
            </label>
            <input
              type="number"
              min={2020}
              max={2035}
              value={current_academic_year}
              onChange={(e) => setCurrentAcademicYear(e.target.value)}
              disabled={!isSuperAdmin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="ex. 2025"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Taille max des fichiers / dossiers (Mo)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={max_upload_size_mb}
              onChange={(e) => setMaxUploadSizeMb(e.target.value)}
              disabled={!isSuperAdmin}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="50"
            />
            <p className="mt-1 text-sm text-gray-500">
              S’applique à l’upload des ressources de cours (PDF, images, Word, Excel, ZIP). Par défaut : 50 Mo.
            </p>
          </div>
          {isSuperAdmin && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
