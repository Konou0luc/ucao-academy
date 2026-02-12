"use client";
import MainLayout from "../layouts/MainLayout";
import Link from "next/link";
import { CalendarCheck, LayoutDashboard, Calendar, BookOpen } from "lucide-react";

export default function AssiduityPage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Assiduité</h1>
          <p className="text-sm text-gray-600 mt-1">Suivez votre présence aux cours</p>
        </div>
        <div className="p-6">
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
            <CalendarCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Fonctionnalité à venir</h2>
            <p className="text-gray-600 mb-6">
              Les données d&apos;assiduité et de présence seront affichées ici dès que le module sera disponible. En attendant, consultez votre emploi du temps et vos cours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
              >
                <LayoutDashboard className="w-4 h-4" /> Tableau de bord
              </Link>
              <Link
                href="/emploi-du-temps"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <Calendar className="w-4 h-4" /> Emploi du temps
              </Link>
              <Link
                href="/cours"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                <BookOpen className="w-4 h-4" /> Mes cours
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
