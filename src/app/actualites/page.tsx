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
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Actualités de l&apos;Université</h1>
            <p className="text-sm text-gray-600 mt-1">
              Restez informé des dernières nouvelles et annonces de l&apos;UCAO-UUT
            </p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {/* Recherche */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans les actualités..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] text-gray-900"
                style={{ color: '#111827' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-600">Chargement des actualités...</div>
          ) : filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => router.push(`/actualites/${news.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
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
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{news.created_by.name}</span>
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(news.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3 mb-4">
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
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Aucune actualité ne correspond à votre recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
