"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../../layouts/MainLayout";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { news as newsApi } from "@/lib/api";

function getVideoEmbedUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  const youtuBeMatch = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
  const vimeoMatch = u.match(/(?:vimeo\.com\/)(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function isVideoUrl(url: string): boolean {
  return !!getVideoEmbedUrl(url);
}

const formatContent = (content: string) => {
  const lines = content.split('\n');
  let html = '';
  let inList = false;
  let listItems: string[] = [];

  const closeList = () => {
    if (inList && listItems.length > 0) {
      html += `<ul class="list-disc list-inside mb-4 space-y-2 text-gray-700">${listItems.join('')}</ul>`;
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Ligne vide
    if (trimmed === '') {
      closeList();
      html += '<br />';
      return;
    }

    // Titre en gras (markdown **)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      closeList();
      const text = trimmed.replace(/\*\*/g, '');
      html += `<h3 class="font-semibold text-gray-900 mb-3 mt-6 text-lg">${text}</h3>`;
      return;
    }

    // Liste à puces (-)
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        closeList();
        inList = true;
      }
      const text = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      listItems.push(`<li>${text}</li>`);
      return;
    }

    // Liste numérotée (1. 2. etc.)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      if (!inList) {
        closeList();
        inList = true;
      }
      const text = numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      listItems.push(`<li>${text}</li>`);
      return;
    }

    // Paragraphe normal
    closeList();
    const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    html += `<p class="mb-4 text-gray-700 leading-relaxed">${formatted}</p>`;
  });

  closeList();
  return html;
};

export default function ActualiteDetailPage() {
  const params = useParams();
  const newsId = params.id as string;
  const [news, setNews] = useState<{ id: string; title: string; content: string; image: string | null; created_by: { name: string }; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!newsId) {
      setLoading(false);
      return;
    }
    newsApi
      .getOne(newsId)
      .then((data) => {
        if (data.message) {
          setError(data.message);
          toast.error(data.message);
          setNews(null);
          return;
        }
        setNews({
          id: String(data._id),
          title: data.title,
          content: data.content,
          image: data.image || null,
          created_by: data.created_by ? { name: data.created_by.name } : { name: "UCAO-UUT" },
          created_at: data.createdAt || new Date().toISOString(),
        });
      })
      .catch(() => {
        setError("Actualité introuvable.");
        toast.error("Actualité introuvable.");
        setNews(null);
      })
      .finally(() => setLoading(false));
  }, [newsId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleShare = async () => {
    if (!news) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: news.title, text: news.content?.slice(0, 200) || news.title, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        toast.success("Lien partagé.");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié dans le presse-papiers.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Lien copié dans le presse-papiers.");
        } catch {
          toast.error("Impossible de partager.");
        }
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
          <p className="text-gray-600">Chargement de l&apos;actualité...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !news) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">
            {error || "Actualité introuvable."}
          </div>
          <Link href="/actualites" className="inline-flex items-center gap-2 mt-4 text-[#03045e] font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour aux actualités
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/actualites"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Actualité</h1>
              <p className="text-sm text-gray-600 mt-1">
                Détails de l&apos;actualité
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Article */}
            <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Image ou vidéo (ressource) */}
              {news.image ? (
                isVideoUrl(news.image) ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={getVideoEmbedUrl(news.image)!}
                      title={news.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative h-80 w-full">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 896px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )
              ) : null}

              {/* Content */}
              <div className="p-8">
                {/* Metadata */}
                <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{news.created_by.name}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.created_at)}</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {news.title}
                </h1>

                {/* Content */}
                <div 
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(news.content) }}
                />
              </div>
            </article>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <Link
                href="/actualites"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux actualités
              </Link>
              <button type="button" onClick={handleShare} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 font-medium">
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
