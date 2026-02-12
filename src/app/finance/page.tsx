"use client";
import MainLayout from "../layouts/MainLayout";
import Link from "next/link";
import { Wallet, LayoutDashboard } from "lucide-react";

export default function FinancePage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gérez vos transactions et paiements</p>
        </div>
        <div className="p-6">
          <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Wallet className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Fonctionnalité à venir</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Les informations financières (frais, reçus, paiements) seront disponibles ici dès que le module finance sera intégré.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
            >
              <LayoutDashboard className="w-4 h-4" /> Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
