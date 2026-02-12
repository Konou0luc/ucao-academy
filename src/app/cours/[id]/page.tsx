"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../../layouts/MainLayout";
import { ArrowLeft, Download, User, Building2, FileText, Play, Video } from "lucide-react";
import { courses as coursesApi } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://ucao-backend.vercel.app/api").replace(/\/api\/?$/, "");

type ResourceItem = { _id: string; name: string; type: string; url: string };

export default function CourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<{
    id: string;
    title: string;
    description: string;
    fullDescription?: string;
    filiere?: string;
    niveau?: string;
    institution?: string;
    category?: string;
    video_url?: string;
    created_by?: { name: string; email?: string };
    modules?: { id: number; title: string; duration: string; lessons: number }[];
    resources?: ResourceItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    coursesApi
      .getOne(id)
      .then((data) => {
        if (data.message) {
          setError(data.message);
          setCourse(null);
          return;
        }
        const resources = Array.isArray((data as { resources?: ResourceItem[] }).resources)
          ? (data as { resources: ResourceItem[] }).resources
          : [];
        setCourse({
          id: String(data._id),
          title: data.title,
          description: data.description,
          fullDescription: data.description,
          filiere: data.filiere,
          niveau: data.niveau,
          institution: data.institution,
          category: data.category,
          video_url: data.video_url,
          created_by: data.created_by,
          modules: [],
          resources,
        });
      })
      .catch(() => {
        setError("Cours introuvable.");
        toast.error("Cours introuvable.");
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  /** Retourne l’URL d’embed pour YouTube/Vimeo, ou null si lien direct (vidéo HTML5). */
  const getVideoEmbed = (url: string): { type: "embed"; src: string } | { type: "video"; src: string } | null => {
    if (!url?.trim()) return null;
    const u = url.trim();
    const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return { type: "embed", src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { type: "embed", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    return { type: "video", src: u };
  };

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
      
      if (trimmed === '') {
        closeList();
        html += '<br />';
        return;
      }

      if (trimmed.startsWith('- ')) {
        if (!inList) {
          closeList();
          inList = true;
        }
        const text = trimmed.substring(2);
        listItems.push(`<li>${text}</li>`);
        return;
      }

      closeList();
      html += `<p class="mb-4 text-gray-700 leading-relaxed">${trimmed}</p>`;
    });

    closeList();
    return html;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !course) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">
            {error || "Cours introuvable."}
          </div>
          <Link href="/cours" className="inline-flex items-center gap-2 mt-4 text-[#03045e] font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour aux cours
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
              href="/cours"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Détails du cours</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Consultez et téléchargez les ressources du cours
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête du cours */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md font-medium">
                    {course.filiere}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-md font-medium">
                    {course.niveau}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md font-medium">
                    {course.category}
                  </span>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                  {course.title}
                </h1>
                <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
                  {course.description}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {course.created_by && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{course.created_by.name}</span>
                  </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{course.institution}</span>
                  </div>
                </div>
              </div>

              {/* Description complète */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  À propos de ce cours
                </h2>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatContent(course.fullDescription || course.description) }}
                />
              </div>

              {/* Vidéo du cours */}
              {course.video_url?.trim() && (() => {
                const video = getVideoEmbed(course.video_url);
                if (!video) return null;
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                      <Video className="h-6 w-6 text-[#03045e]" />
                      Vidéo du cours
                    </h2>
                    <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden bg-black">
                      {video.type === "embed" ? (
                        <iframe
                          src={video.src}
                          title="Vidéo du cours"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <video src={video.src} controls className="w-full h-full" />
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Modules du cours */}
              {(course.modules?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
<h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Programme du cours
                </h2>
                <div className="space-y-3">
                  {course.modules!.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#03045e]/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#03045e] rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {module.lessons} leçons • {module.duration}
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-[#03045e] text-white rounded-lg hover:bg-[#023e8a] transition text-sm font-medium flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Voir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Ressources */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#03045e]" />
                  Ressources
                </h3>
                <div className="space-y-3">
                  {(course.resources?.length ?? 0) > 0 ? course.resources!.map((resource) => (
                    <div
                      key={resource._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#03045e]/30 transition group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resource.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{resource.type === "image" ? "Image" : "Fichier"}</p>
                      </div>
                      <a
                        href={`${API_BASE}${resource.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={resource.name}
                        className="px-3 py-1.5 bg-[#03045e] text-white rounded-lg hover:bg-[#023e8a] transition text-xs font-medium flex items-center gap-1 flex-shrink-0 no-underline"
                      >
                        <Download className="w-3 h-3" />
                        Télécharger
                      </a>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 py-2">Aucune ressource pour le moment.</p>
                  )}
                </div>
              </div>

              {/* Informations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Filière</span>
                    <span className="text-gray-900 font-medium">{course.filiere}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Niveau</span>
                    <span className="text-gray-900 font-medium capitalize">{course.niveau}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Institution</span>
                    <span className="text-gray-900 font-medium">{course.institution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formateur</span>
                    <span className="text-gray-900 font-medium">{course.created_by?.name ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
