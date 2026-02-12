"use client";
import MainLayout from "../layouts/MainLayout";
import Link from "next/link";
import { CalendarCheck, LayoutDashboard, Calendar, BookOpen } from "lucide-react";

export default function AssiduityPage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assiduité</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Suivez votre présence aux cours</p>
        </div>
        <div className="p-6">
          <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <CalendarCheck className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Fonctionnalité à venir</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Les données d&apos;assiduité et de présence seront affichées ici dès que le module sera disponible. En attendant, consultez votre emploi du temps et vos cours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#03045e] px-4 py-2 font-medium text-white transition hover:bg-[#023e8a]"
              >
                <LayoutDashboard className="h-4 w-4" /> Tableau de bord
              </Link>
              <Link
                href="/emploi-du-temps"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Calendar className="h-4 w-4" /> Emploi du temps
              </Link>
              <Link
                href="/cours"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <BookOpen className="h-4 w-4" /> Mes cours
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
