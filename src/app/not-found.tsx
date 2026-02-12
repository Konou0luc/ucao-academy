"use client";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
              <h1 className="text-2xl font-bold">UCAO Academy</h1>
              <p className="text-sm text-white/80">UCAO-UUT</p>
            </div>
          </div>
          
          {/* Content centered vertically */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-8xl font-extrabold mb-6 leading-tight">404</h1>
            <h2 className="text-4xl font-bold mb-4">Page non trouvée</h2>
            <p className="text-xl text-white/90 max-w-lg leading-relaxed">
              Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Content */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
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

          {/* 404 Error - Mobile/Tablet */}
          <div className="lg:hidden mb-8">
            <h1 className="text-8xl font-extrabold text-[#03045e] mb-4">404</h1>
            <div className="w-24 h-1 bg-[#03045e] mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Page non trouvée
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
          </div>

          {/* Desktop Content */}
          <div className="hidden lg:block mb-8">
            <p className="text-gray-600 text-lg">
              Nous vous aidons à retrouver votre chemin.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-[#03045e] text-white rounded-lg font-semibold hover:bg-[#023e8a] transition shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold hover:border-[#03045e] hover:text-[#03045e] transition flex items-center justify-center gap-2"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

