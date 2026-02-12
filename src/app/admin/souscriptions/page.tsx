"use client";
import { CreditCard } from "lucide-react";

export default function SouscriptionsAdmin() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Souscriptions</h1>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-[#03045e]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-[#03045e]" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Fonctionnalité à venir</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          La gestion des souscriptions et paiements sera disponible ici lorsque le module finance sera intégré au backend.
        </p>
      </div>
    </div>
  );
}
