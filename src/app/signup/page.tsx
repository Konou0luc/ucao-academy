"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, GraduationCap, User, Lock, Eye, EyeOff } from "lucide-react";
import { auth, filieres } from "@/lib/api";
import { INSTITUTES } from "@/lib/filieres";

const LEVELS = [
  { value: "licence1", label: "Licence 1" },
  { value: "licence2", label: "Licence 2" },
  { value: "licence3", label: "Licence 3" },
];

const STEPS = [
  { id: 1, title: "Informations personnelles", icon: User },
  { id: 2, title: "Informations académiques", icon: GraduationCap },
  { id: 3, title: "Sécurité", icon: Lock }
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    // Étape 1: Informations personnelles
    name: "",
    email: "",
    // Étape 2: Informations académiques
    student_number: "",
    institute: "",
    filiere: "",
    niveau: "",
    // Étape 3: Sécurité
    password: "",
    password_confirmation: "",
    role: "student"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [filieresList, setFilieresList] = useState<{ _id: string; institut: string; name: string }[]>([]);
  const router = useRouter();

  // Charger toutes les filières dès l’étape 2 (liste publique), puis filtrer par institut côté client
  useEffect(() => {
    if (currentStep !== 2) return;
    filieres
      .get()
      .then((list) => setFilieresList(Array.isArray(list) ? list : []))
      .catch(() => {
        setFilieresList([]);
        toast.error("Impossible de charger les filières. Réessayez plus tard.");
      });
  }, [currentStep]);

  const filieresForInstitute = form.institute
    ? filieresList.filter((f) => f.institut === form.institute)
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "institute") {
      setForm((prev) => ({ ...prev, institute: value, filiere: "" }));
    } else {
      setForm({ ...form, [name]: value });
    }
    if (error) setError("");
    if (infoMessage) setInfoMessage("");
  };

  const validateStep = (step: number): boolean => {
    setError("");
    
    switch (step) {
      case 1:
        if (!form.name.trim()) {
          setError("Le nom complet est requis.");
          toast.error("Le nom complet est requis.");
          return false;
        }
        if (!form.email.trim()) {
          setError("L'email est requis.");
          toast.error("L'email est requis.");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError("Veuillez entrer un email valide.");
          toast.error("Veuillez entrer un email valide.");
          return false;
        }
        return true;
      
      case 2:
        if (!form.student_number.trim()) {
          setError("Le numéro matricule est requis.");
          toast.error("Le numéro matricule est requis.");
          return false;
        }
        if (!form.institute) {
          setError("Veuillez sélectionner votre institut.");
          toast.error("Veuillez sélectionner votre institut.");
          return false;
        }
        if (!form.filiere) {
          setError("Veuillez sélectionner votre filière.");
          toast.error("Veuillez sélectionner votre filière.");
          return false;
        }
        if (!form.niveau) {
          setError("Veuillez sélectionner votre niveau.");
          toast.error("Veuillez sélectionner votre niveau.");
          return false;
        }
        return true;
      
      case 3:
        if (!form.password) {
          setError("Le mot de passe est requis.");
          toast.error("Le mot de passe est requis.");
          return false;
        }
        if (form.password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.");
          toast.error("Le mot de passe doit contenir au moins 8 caractères.");
          return false;
        }
        if (form.password !== form.password_confirmation) {
          setError("Les mots de passe ne correspondent pas.");
          toast.error("Les mots de passe ne correspondent pas.");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const data = await auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        student_number: form.student_number,
        institute: form.institute,
        filiere: form.filiere,
        niveau: form.niveau
      });
      
      // Succès : compte étudiant créé, en attente de vérification (pas de token)
      if (data.user && (data.user as { identity_verified?: boolean }).identity_verified === false && !data.token) {
        setInfoMessage(data.message || "Compte créé. Vous recevrez un email lorsque votre identité sera confirmée par l'administration.");
        toast.success(data.message || "Compte créé. Vous recevrez un email lorsque votre identité sera confirmée par l'administration.");
        setTimeout(() => router.push("/login"), 300);
        setLoading(false);
        return;
      }
      if (data.message) {
        setError(data.message);
        toast.error(data.message);
        setLoading(false);
        return;
      }
      if (data.errors?.length) {
        const msg = data.errors.map((e: { msg?: string }) => e.msg).filter(Boolean).join(". ") || "Erreur de validation.";
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
        toast.success("Inscription réussie. Bienvenue !");
        const role = (data.user as { role?: string }).role;
        const destination = role === "admin" ? "/admin/dashboard" : role === "formateur" ? "/formateur" : "/dashboard";
        setTimeout(() => router.push(destination), 300);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau ou serveur.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    return (currentStep / STEPS.length) * 100;
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
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 flex flex-col p-12 text-white h-full">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 relative">
              <Image
                src="/images/logo.png"
                alt="Logo UCAO-UUT"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">UCAO Academy</h1>
              <p className="text-sm text-white/80">UCAO-UUT</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-5xl font-bold mb-6 leading-tight">Rejoignez-nous</h2>
            <p className="text-xl text-white/90 max-w-lg leading-relaxed">
              Créez votre compte étudiant et accédez à tous les cours, ressources et outils de votre université.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-2xl">
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
            <span className="text-2xl font-bold text-[#03045e]">UCAO Academy</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? "bg-[#03045e] border-[#03045e] text-white"
                            : isActive
                            ? "bg-[#03045e] border-[#03045e] text-white"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isActive || isCompleted ? "text-[#03045e] font-medium" : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 -mt-6 ${
                          isCompleted ? "bg-[#03045e]" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#03045e] h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {STEPS[currentStep - 1].title}
          </h2>

          {/* Form */}
          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {/* Étape 1: Informations personnelles */}
            {currentStep === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900"
                    style={{ color: '#111827' }}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                      error && error.includes("email") ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ color: '#111827' }}
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </>
            )}

            {/* Étape 2: Informations académiques */}
            {currentStep === 2 && (
              <>
                <div>
                  <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro matricule <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="student_number"
                    name="student_number"
                    value={form.student_number}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                      error && error.includes("matricule") ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ color: '#111827' }}
                    placeholder="Ex: 2024-001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce numéro permet de vérifier que vous êtes bien inscrit à l&apos;UCAO-UUT
                  </p>
                </div>

                <div>
                  <label htmlFor="institute" className="block text-sm font-medium text-gray-700 mb-2">
                    Institut <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="institute"
                    name="institute"
                    value={form.institute}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 bg-white ${
                      error && error.includes("institut") ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ color: '#111827' }}
                  >
                    <option value="">Sélectionnez votre institut</option>
                    {INSTITUTES.map((institute) => (
                      <option key={institute.value} value={institute.value} style={{ color: '#111827' }}>
                        {institute.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filiere" className="block text-sm font-medium text-gray-700 mb-2">
                    Filière <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="filiere"
                    name="filiere"
                    value={form.filiere}
                    onChange={handleChange}
                    required
                    disabled={!form.institute}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      error && error.includes("filière") ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ color: '#111827' }}
                  >
                    <option value="">
                      {form.institute ? "Sélectionnez votre filière" : "Sélectionnez d'abord votre institut"}
                    </option>
                    {filieresForInstitute.map((f) => (
                      <option key={f._id} value={f.name} style={{ color: '#111827' }}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="niveau" className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="niveau"
                    name="niveau"
                    value={form.niveau}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 bg-white ${
                      error && error.includes("niveau") ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ color: '#111827' }}
                  >
                    <option value="">Sélectionnez votre niveau</option>
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value} style={{ color: '#111827' }}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Étape 3: Sécurité */}
            {currentStep === 3 && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
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
                        error && error.includes("mot de passe") ? "border-red-500" : "border-gray-300"
                      }`}
                      style={{ color: '#111827' }}
                      placeholder="Minimum 8 caractères"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Le mot de passe doit contenir au moins 8 caractères
                  </p>
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={form.password_confirmation}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] transition text-gray-900 ${
                        error && error.includes("correspondent") ? "border-red-500" : "border-gray-300"
                      }`}
                      style={{ color: '#111827' }}
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#03045e] focus:ring-offset-0 rounded"
                      aria-label={showPasswordConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Message info (compte créé, en attente de vérification) */}
            {infoMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <span className="text-blue-600 shrink-0 mt-0.5">ℹ</span>
                <p className="text-sm text-blue-800">{infoMessage}</p>
              </div>
            )}
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Précédent
                </button>
              ) : (
                <div />
              )}
              
              {currentStep < 3 ? (
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition flex items-center gap-2 ml-auto"
                >
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                >
                  {loading ? "Création..." : "Créer mon compte"}
                </button>
              )}
            </div>

            {/* Link to Login */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-[#03045e] hover:text-[#023e8a] font-medium">
                Connexion
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
