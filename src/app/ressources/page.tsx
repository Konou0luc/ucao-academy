"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../layouts/MainLayout";
import { Library, Download, BookOpen, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { courses as coursesApi } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://ucao-backend.vercel.app/api").replace(/\/api\/?$/, "");

type ResourceItem = { _id: string; name: string; type: string; url: string };
type CourseWithResources = { _id: string; title: string; resources: ResourceItem[] };

export default function RessourcesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<{ courseId: string; courseTitle: string; resource: ResourceItem }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    coursesApi
      .getAll()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? (data as CourseWithResources[]) : [];
        const aggregated: { courseId: string; courseTitle: string; resource: ResourceItem }[] = [];
        for (const course of list) {
          const resources = Array.isArray(course.resources) ? course.resources : [];
          for (const res of resources) {
            if (res && res.name && res.url) {
              aggregated.push({
                courseId: String(course._id),
                courseTitle: course.title || "Sans titre",
                resource: { _id: res._id || `${course._id}-${res.name}`, name: res.name, type: res.type || "file", url: res.url },
              });
            }
          }
        }
        setItems(aggregated);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les ressources.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const iconForType = (type: string) => {
    if (type === "image" || type?.toLowerCase().includes("image")) return <ImageIcon className="w-4 h-4 text-gray-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ressources</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Toutes les ressources de vos cours en un seul endroit</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#03045e] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
              <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-4">{error}</p>
              <Link href="/cours" className="text-[#03045e] hover:underline font-medium">Voir mes cours</Link>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
              <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune ressource pour le moment</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                Les ressources de vos cours apparaîtront ici. En attendant, consultez chaque cours pour accéder à ses documents.
              </p>
              <Link
                href="/cours"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
              >
                <BookOpen className="w-4 h-4" /> Voir mes cours
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {items.length} ressource{items.length !== 1 ? "s" : ""} • Cliquez pour télécharger ou ouvrir le fichier.
              </p>
              <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {items.map(({ courseId, courseTitle, resource }) => (
                  <li key={`${courseId}-${resource._id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                    <span className="flex-shrink-0 text-gray-400">{iconForType(resource.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{resource.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        Cours :{" "}
                        <Link href={`/cours/${courseId}`} className="text-[#03045e] hover:underline">
                          {courseTitle}
                        </Link>
                      </p>
                    </div>
                    <a
                      href={`${API_BASE}${resource.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={resource.name}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#03045e] bg-[#03045e]/10 rounded-lg hover:bg-[#03045e]/20 transition"
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
