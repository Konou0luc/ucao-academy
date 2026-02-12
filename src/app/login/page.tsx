"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/api";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const data = await auth.login(form.email, form.password);
      if (data.message) {
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      if (data.errors?.length) {
        const msg = data.errors[0].msg || "Erreur de validation.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.niveau) {
          localStorage.setItem("studentLevel", data.user.niveau);
        }
        toast.success("Connexion réussie");
        const role = data.user.role;
        const redirect = role === "admin" ? "/admin/dashboard" : role === "formateur" ? "/formateur" : "/dashboard";
        setTimeout(() => router.push(redirect), 300);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau ou serveur.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 w-10 h-10 flex items-center justify-center text-gray-700 hover:text-[#03045e] transition-colors bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:bg-white"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Left Section - Promotional */}
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
        <div className="relative z-10 flex flex-col p-12 text-white h-full">
          {/* Logo at top */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 relative">
              <Image
                src="/images/logo.png"
                alt="Logo UCAO-UUT"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Web Academy</h1>
              <p className="text-sm text-white/80">UCAO-UUT</p>
            </div>
          </div>
          
          {/* Content centered vertically */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-5xl font-bold mb-6 leading-tight">Espace de Connexion</h2>
            <p className="text-xl text-white/90 max-w-lg leading-relaxed">
              Votre plateforme sécurisée pour accéder à vos cours, discussions et ressources académiques.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 relative">
              <Image
                src="/images/logo.png"
                alt="Logo UCAO-UUT"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-[#03045e]">Web Academy</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Connectez-vous à votre compte
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                  error && !form.email ? "border-red-500" : "border-gray-300"
                }`}
                style={{ color: '#111827' }}
                placeholder="Email"
              />
              {error && !form.email && (
                <p className="mt-1 text-sm text-red-600">L&apos;email est obligatoire</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{ color: '#111827' }}
                  placeholder="Mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:ring-offset-0 rounded"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && form.email && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#03045e] text-white py-3 rounded-lg font-semibold hover:bg-[#023e8a] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Connexion"}
            </button>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Vous n&apos;avez pas encore de compte ?{" "}
                <Link href="/signup" className="text-[#03045e] hover:text-[#023e8a] font-medium">
                  Inscription
                </Link>
              </p>
              <Link
                href="/forgot-password"
                className="block text-sm text-[#03045e] hover:text-[#023e8a] font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
