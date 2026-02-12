"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Newspaper, Search, Calendar, User, ChevronRight, Video } from "lucide-react";
import Image from "next/image";
import { news as newsApi } from "@/lib/api";

function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.trim().toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com");
}

export default function ActualitesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [newsList, setNewsList] = useState<{ id: string; title: string; content: string; image: string | null; created_by: { name: string }; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    newsApi
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNewsList(
          list.map((n: { _id: string; title: string; content: string; image?: string | null; created_by?: { name: string }; createdAt?: string }) => ({
            id: String(n._id),
            title: n.title,
            content: n.content,
            image: n.image || null,
            created_by: n.created_by ? { name: n.created_by.name } : { name: "UCAO-UUT" },
            created_at: n.createdAt || new Date().toISOString(),
          }))
        );
      })
      .catch(() => {
        setNewsList([]);
        setError("Impossible de charger les actualités.");
        toast.error("Impossible de charger les actualités.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredNews = newsList.filter((news) =>
    searchTerm === "" ||
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Actualités de l&apos;Université</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Restez informé des dernières nouvelles et annonces de l&apos;UCAO-UUT
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {/* Recherche */}
          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans les actualités..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-600 dark:text-gray-400">Chargement des actualités...</div>
          ) : filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => router.push(`/actualites/${news.id}`)}
                  className="cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  {news.image ? (
                    isVideoUrl(news.image) ? (
                      <div className="h-48 w-full bg-[#03045e]/10 flex items-center justify-center">
                        <Video className="w-12 h-12 text-[#03045e]/40" />
                      </div>
                    ) : (
                      <div className="relative h-48 w-full">
                        <Image
                          src={news.image}
                          alt={news.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )
                  ) : (
                    <div className="h-48 w-full bg-[#03045e]/10 flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-[#03045e]/40" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{news.created_by.name}</span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(news.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <h3 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900 dark:text-white">
                      {news.title}
                    </h3>
                    <p className="mb-4 line-clamp-3 text-gray-600 dark:text-gray-400">
                      {news.content}
                    </p>
                    <div className="flex items-center gap-2 text-[#03045e] font-medium text-sm">
                      <span>Lire la suite</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Newspaper className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Aucune actualité ne correspond à votre recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
