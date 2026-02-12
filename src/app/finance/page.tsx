"use client";
import MainLayout from "../layouts/MainLayout";
import Link from "next/link";
import { Wallet, LayoutDashboard } from "lucide-react";

export default function FinancePage() {
  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-600 mt-1">Gérez vos transactions et paiements</p>
        </div>
        <div className="p-6">
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-lg mx-auto">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Fonctionnalité à venir</h2>
            <p className="text-gray-600 mb-6">
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
