"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, ChevronRight, Users, BookOpen, Award, ArrowRight, 
  MessageSquare, Calendar, 
  Star, CheckCircle2, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram,
  Menu, X, LayoutDashboard
} from "lucide-react";
import { auth } from "@/lib/api";

const heroImages = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80",
    title: "Excellence Académique",
    subtitle: "Formez-vous avec les meilleurs experts",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?w=1920&q=80",
    title: "Innovation Pédagogique",
    subtitle: "Des méthodes d'apprentissage modernes",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80",
    title: "Communauté Dynamique",
    subtitle: "Rejoignez une communauté d'apprenants passionnés",
  },
];

const stats = [
  { icon: Users, value: "DGI • ISSJ • ISEG", label: "Instituts UCAO-UUT déjà intégrés" },
  { icon: BookOpen, value: "Cours · Emplois du temps · Examens", label: "Modules actuellement disponibles sur la plateforme" },
  { icon: Award, value: "Étudiants · Formateurs · Admins", label: "Rôles gérés par Web Academy" },
];

const features = [
  {
    title: "Cours par Filière",
    description: "Organisez votre apprentissage selon votre domaine d'étude",
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80",
  },
  {
    title: "Discussions Interactives",
    description: "Échangez avec vos pairs et formateurs en temps réel",
    icon: MessageSquare,
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",
  },
  {
    title: "Planning Flexible",
    description: "Consultez vos emplois du temps et calendriers d'évaluation",
    icon: Calendar,
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80",
  },
];

const testimonials = [
  {
    name: "Marie Kouassi",
    role: "Étudiante en Informatique",
    content: "Web Academy a transformé ma façon d'apprendre. Les cours sont bien structurés et les discussions avec les autres étudiants sont très enrichissantes.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    name: "Jean Amevor",
    role: "Étudiant en Gestion",
    content: "La plateforme est intuitive et facile à utiliser. J'apprécie particulièrement le système de planning qui me permet de m'organiser efficacement.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    name: "Sophie Togbe",
    role: "Étudiante en Marketing",
    content: "Les ressources disponibles sont excellentes et les formateurs sont toujours disponibles pour répondre à nos questions.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
];

type UserInfo = { name: string; email: string; role?: string };

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      return;
    }
    auth
      .getUser()
      .then((data: UserInfo & { message?: string }) => {
        if (data.message) setUser(null);
        else setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  const dashboardHref =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "formateur"
        ? "/formateur"
        : user?.role === "etudiant"
          ? "/dashboard"
          : "/login";

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('header')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Menu Full Screen */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 lg:hidden">
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 relative">
                  <Image
                    src="/images/logo.png"
                    alt="Logo UCAO-UUT"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Web Academy</h1>
                  <p className="text-xs text-gray-600">UCAO-UUT</p>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Navigation */}
            <nav className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                <Link 
                  href="/cours" 
                  className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 backdrop-blur-sm text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Cours</span>
                </Link>
                <Link 
                  href="/discussions" 
                  className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 backdrop-blur-sm text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Discussions</span>
                </Link>
                <Link 
                  href="/actualites" 
                  className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 backdrop-blur-sm text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Actualités</span>
                </Link>
                <Link 
                  href="/calendrier" 
                  className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 backdrop-blur-sm text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Calendrier</span>
                </Link>
                <Link 
                  href="/emploi-du-temps" 
                  className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 backdrop-blur-sm text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Emploi du temps</span>
                </Link>
              </div>

              {/* Separator */}
              <div className="my-6 border-t border-white/20 max-w-md mx-auto" />

              {/* Auth Section */}
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                {user ? (
                  <Link
                    href={dashboardHref}
                    className="px-6 py-4 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition-all duration-200 text-center shadow-lg text-lg flex items-center justify-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Mon espace
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-6 py-4 text-gray-700 hover:text-[#03045e] hover:bg-white/50 rounded-lg font-medium transition-all duration-200 text-center backdrop-blur-sm text-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/signup"
                      className="px-6 py-4 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition-all duration-200 text-center shadow-lg text-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Créer un compte
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
        <Image
                  src="/images/logo.png"
                  alt="Logo UCAO-UUT"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Web Academy</h1>
                <p className="text-xs text-gray-600">UCAO-UUT</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/cours" className="text-gray-700 hover:text-[#03045e] font-medium transition-colors">
                Cours
              </Link>
              <Link href="/discussions" className="text-gray-700 hover:text-[#03045e] font-medium transition-colors">
                Discussions
              </Link>
              <Link href="/actualites" className="text-gray-700 hover:text-[#03045e] font-medium transition-colors">
                Actualités
              </Link>
              <Link href="/calendrier" className="text-gray-700 hover:text-[#03045e] font-medium transition-colors">
                Calendrier
              </Link>
              <Link href="/emploi-du-temps" className="text-gray-700 hover:text-[#03045e] font-medium transition-colors">
                Emploi du temps
              </Link>
            </nav>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <Link
                  href={dashboardHref}
                  className="px-6 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition shadow-lg flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-[#03045e] font-medium transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="px-6 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition shadow-lg"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-[#03045e] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="relative h-[500px] sm:h-[600px] mt-14 sm:mt-16 overflow-hidden">
        {heroImages.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-[#03045e]/80" />
            </div>
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 animate-fade-in">
                    {slide.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-6 sm:mb-8 animate-fade-in-delay">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-delay-2">
                    <Link
                      href="/cours"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-[#d90429] text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-[#b0031f] transition shadow-xl flex items-center justify-center gap-2"
                    >
                      Explorer les cours
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link
                      href="/discussions"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-lg font-semibold text-base sm:text-lg hover:bg-white/20 transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Voir les discussions</span>
                      <span className="sm:hidden">Discussions</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 sm:h-3 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-6 sm:w-8" : "bg-white/50 w-2 sm:w-3"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow text-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#d90429] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Pourquoi choisir Web Academy ?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              La plateforme officielle de l&apos;UCAO-UUT pour suivre vos cours, discussions, emplois du temps et examens.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                <div className="relative h-40 sm:h-48 overflow-hidden">
          <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                    <div className="absolute inset-0 bg-[#03045e]/70" />
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#d90429]/90 backdrop-blur-md rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Ce que disent nos étudiants</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Découvrez les témoignages de notre communauté</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0">
          <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      sizes="(max-width: 768px) 64px, 64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-gray-900">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="flex gap-1 mt-3 sm:mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-[#03045e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#d90429]/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
            Prêt à commencer votre parcours à l&apos;UCAO-UUT ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Rejoignez les étudiants de l&apos;UCAO-UUT qui utilisent Web Academy pour organiser leurs cours, examens et projets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/cours"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-[#d90429] text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-[#b0031f] transition shadow-xl flex items-center justify-center gap-2"
            >
              Découvrir les cours
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            {user ? (
              <Link
                href={dashboardHref}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                Accéder à mon espace
              </Link>
            ) : (
              <Link
                href="/signup"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Créer un compte
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 relative flex-shrink-0">
          <Image
                    src="/images/logo.png"
                    alt="Logo UCAO-UUT"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Web Academy</h3>
                  <p className="text-xs text-gray-400">UCAO-UUT</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                Plateforme de gestion des cours, emplois du temps, discussions et examens pour l&apos;UCAO-UUT.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition" aria-label="Facebook">
                  <Facebook className="w-4 h-4 text-gray-300" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition" aria-label="Twitter">
                  <Twitter className="w-4 h-4 text-gray-300" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4 text-gray-300" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition" aria-label="Instagram">
                  <Instagram className="w-4 h-4 text-gray-300" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <Link href="/cours" className="hover:text-white transition">
                    Cours
                  </Link>
                </li>
                <li>
                  <Link href="/discussions" className="hover:text-white transition">
                    Discussions
                  </Link>
                </li>
                <li>
                  <Link href="/actualites" className="hover:text-white transition">
                    Actualités
                  </Link>
                </li>
                <li>
                  <Link href="/calendrier" className="hover:text-white transition">
                    Calendrier
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Ressources</h4>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <Link href="/guides" className="hover:text-white transition">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link href="/ressources" className="hover:text-white transition">
                    Bibliothèque
                  </Link>
                </li>
                <li>
                  <Link href="/tools" className="hover:text-white transition">
                    Outils
                  </Link>
                </li>
              </ul>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
              <div className="space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Université Catholique de l&apos;Afrique de l&apos;Ouest<br />
                    Unité Universitaire de Togo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:contact@ucao-uut.tg" className="hover:text-white transition break-all">
                    contact@ucao-uut.tg
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-gray-400">Contact téléphonique à renseigner par l&apos;administration</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm px-4">
            <p>&copy; {new Date().getFullYear()} Web Academy UCAO-UUT. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.2s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
}
