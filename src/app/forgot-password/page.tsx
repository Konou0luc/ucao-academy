"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await auth.forgotPassword(email);
      if (data.errors?.length) {
        const msg = data.errors[0].msg || "Email invalide.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      if (data.message) {
        setSent(true);
        toast.success(data.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  if (sent) {
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
            <h2 className="text-3xl font-bold mb-4">Vérifiez votre boîte mail</h2>
            <p className="text-white/90 max-w-sm">
              Un lien de réinitialisation vous a été envoyé si un compte existe avec cet email.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-3/5 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center gap-3 mb-6">
              <div className="w-10 h-10 relative">
                <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-[#03045e]">Web Academy</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vérifiez votre boîte mail</h2>
            <p className="text-gray-600 mb-6">
              Si un compte existe avec l&apos;email indiqué, un lien de réinitialisation vous a été envoyé. Consultez votre boîte de réception (et les spams) puis cliquez sur le lien reçu.
            </p>
            <Link
              href="/login"
              className="inline-block w-full sm:w-auto px-6 py-3 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition"
            >
              Retour à la connexion
            </Link>
          </div>
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
          <h2 className="text-3xl font-bold mb-4">Mot de passe oublié ?</h2>
          <p className="text-white/90 max-w-sm">
            Saisissez l&apos;email de votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Réinitialiser le mot de passe</h2>
          <p className="text-gray-600 mb-6">Indiquez l&apos;email associé à votre compte.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                style={{ color: "#111827" }}
                placeholder="votre@email.com"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#03045e] text-white py-3 rounded-lg font-semibold hover:bg-[#023e8a] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
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
