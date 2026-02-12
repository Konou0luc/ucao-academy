"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) setError("Lien invalide : token manquant.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const data = await auth.resetPassword(token, password);
      if (data.errors?.length) {
        const msg = data.errors[0].msg || "Données invalides.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      if (data.message) {
        if (data.message.includes("mis à jour") || data.message.includes("Vous pouvez vous connecter")) {
          toast.success(data.message);
          router.push("/login");
          return;
        }
        setError(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-10 h-10 relative">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold text-[#03045e]">Web Academy</span>
          </div>
          <p className="text-gray-600 mb-6">Ce lien de réinitialisation est invalide ou incomplet. Veuillez refaire une demande depuis la page « Mot de passe oublié ».</p>
          <Link href="/forgot-password" className="inline-block px-6 py-3 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition">
            Mot de passe oublié
          </Link>
          <p className="mt-4">
            <Link href="/login" className="text-[#03045e] hover:underline">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Link
        href="/login"
        className="absolute top-6 left-6 z-50 w-10 h-10 flex items-center justify-center text-gray-700 hover:text-[#03045e] transition-colors bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:bg-white"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="hidden lg:flex lg:w-2/5 relative min-h-screen">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80"
            alt="Background"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 flex flex-col p-12 text-white h-full justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 relative">
              <Image src="/images/logo.png" alt="Logo UCAO-UUT" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Web Academy</h1>
              <p className="text-sm text-white/80">UCAO-UUT</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Nouveau mot de passe</h2>
          <p className="text-white/90 max-w-sm">
            Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
          </p>
        </div>
      </div>
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 relative">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold text-[#03045e]">Web Academy</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choisir un nouveau mot de passe</h2>
          <p className="text-gray-600 mb-6">Saisissez puis confirmez votre nouveau mot de passe.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{ color: "#111827" }}
                  placeholder="Au moins 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirm"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{ color: "#111827" }}
                  placeholder="Répétez le mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded"
                  aria-label={showConfirm ? "Masquer" : "Afficher"}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#03045e] text-white py-3 rounded-lg font-semibold hover:bg-[#023e8a] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-[#03045e] hover:text-[#023e8a] font-medium">
                Retour à la connexion
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Chargement...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
