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
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Library className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Erreur de chargement</h2>
              <p className="mx-auto mb-4 max-w-md text-gray-600 dark:text-gray-400">{error}</p>
              <Link href="/cours" className="font-medium text-[#03045e] hover:underline dark:text-blue-300">Voir mes cours</Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Library className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucune ressource pour le moment</h2>
              <p className="mx-auto mb-4 max-w-md text-gray-600 dark:text-gray-400">
                Les ressources de vos cours apparaîtront ici. En attendant, consultez chaque cours pour accéder à ses documents.
              </p>
              <Link
                href="/cours"
                className="inline-flex items-center gap-2 rounded-lg bg-[#03045e] px-4 py-2 font-medium text-white transition hover:bg-[#023e8a]"
              >
                <BookOpen className="h-4 w-4" /> Voir mes cours
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {items.length} ressource{items.length !== 1 ? "s" : ""} • Cliquez pour télécharger ou ouvrir le fichier.
              </p>
              <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:divide-gray-700">
                {items.map(({ courseId, courseTitle, resource }) => (
                  <li key={`${courseId}-${resource._id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{iconForType(resource.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{resource.name}</p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        Cours :{" "}
                        <Link href={`/cours/${courseId}`} className="text-[#03045e] hover:underline dark:text-blue-300">
                          {courseTitle}
                        </Link>
                      </p>
                    </div>
                    <a
                      href={`${API_BASE}${resource.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={resource.name}
                      className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-[#03045e]/10 px-3 py-2 text-sm font-medium text-[#03045e] transition hover:bg-[#03045e]/20 dark:bg-[#03045e]/30 dark:text-blue-300 dark:hover:bg-[#03045e]/40"
                    >
                      <Download className="h-4 w-4" /> Télécharger
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
