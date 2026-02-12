"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, User, Building2, FileText, Video, Pencil } from "lucide-react";
import { courses as coursesApi } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://ucao-backend.vercel.app/api").replace(/\/api\/?$/, "");

type ResourceItem = { _id: string; name: string; type: string; url: string };

function getVideoEmbed(url: string): { type: "embed"; src: string } | { type: "video"; src: string } | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "embed", src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: "embed", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  return { type: "video", src: u };
}

function formatContent(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let listItems: string[] = [];
  const closeList = () => {
    if (inList && listItems.length > 0) {
      html += `<ul class="list-disc list-inside mb-4 space-y-2 text-gray-700">${listItems.join("")}</ul>`;
      listItems = [];
      inList = false;
    }
  };
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      closeList();
      html += "<br />";
      return;
    }
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        closeList();
        inList = true;
      }
      listItems.push(`<li>${trimmed.substring(2)}</li>`);
      return;
    }
    closeList();
    html += `<p class="mb-4 text-gray-700 leading-relaxed">${trimmed}</p>`;
  });
  closeList();
  return html;
}

export default function VoirCoursAdmin() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
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
    status?: string;
    created_by?: { name: string; email?: string };
    resources?: ResourceItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    coursesApi
      .getOne(id)
      .then((data: Record<string, unknown> & { message?: string; resources?: ResourceItem[] }) => {
        if (data.message) {
          setNotFound(true);
          return;
        }
        setCourse({
          id: String(data._id),
          title: (data.title as string) ?? "",
          description: (data.description as string) ?? "",
          fullDescription: (data.description as string) ?? "",
          filiere: (data.filiere as string) ?? undefined,
          niveau: (data.niveau as string) ?? undefined,
          institution: (data.institution as string) ?? undefined,
          category: (data.category as string) ?? undefined,
          video_url: (data.video_url as string) ?? undefined,
          status: (data.status as string) ?? undefined,
          created_by: data.created_by as { name: string; email?: string } | undefined,
          resources: Array.isArray(data.resources) ? data.resources : [],
        });
      })
      .catch(() => {
        setNotFound(true);
        toast.error("Cours introuvable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Chargement du cours...</p>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">Cours introuvable.</div>
        <Link href="/admin/formations" className="inline-flex items-center gap-2 mt-4 text-[#03045e] font-medium">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const video = course.video_url?.trim() ? getVideoEmbed(course.video_url) : null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/formations"
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Détails du cours</h1>
              <p className="text-sm text-gray-600 mt-1">Vue admin — ressources et vidéo</p>
            </div>
          </div>
          <Link
            href={`/admin/formations/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#03045e] text-white rounded-lg font-medium hover:bg-[#023e8a] transition"
          >
            <Pencil className="w-4 h-4" />
            Éditer le cours
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {course.status && (
                  <span
                    className={`px-3 py-1 text-sm rounded-md font-medium ${
                      course.status === "published"
                        ? "bg-green-100 text-green-700"
                        : course.status === "draft"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {course.status === "published" ? "Publié" : course.status === "draft" ? "Brouillon" : course.status}
                  </span>
                )}
                {course.filiere && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md font-medium">
                    {course.filiere}
                  </span>
                )}
                {course.niveau && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-md font-medium">
                    {course.niveau}
                  </span>
                )}
                {course.category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md font-medium">
                    {course.category}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{course.title}</h2>
              <p className="text-gray-600 mb-6">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {course.created_by && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{course.created_by.name}</span>
                  </div>
                )}
                {course.institution && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{course.institution}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">À propos de ce cours</h3>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formatContent(course.fullDescription || course.description),
                }}
              />
            </div>

            {video && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#03045e]" />
                  Vidéo du cours
                </h3>
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
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#03045e]" />
                Ressources
              </h3>
              <div className="space-y-3">
                {(course.resources?.length ?? 0) > 0 ? (
                  course.resources!.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {r.type === "image" ? (
                          <div className="w-10 h-10 relative rounded overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image
                              src={`${API_BASE}${r.url}`}
                              alt={r.name}
                              fill
                              className="object-cover"
                              unoptimized
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">{r.name}</span>
                      </div>
                      <a
                        href={`${API_BASE}${r.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={r.name}
                        className="ml-2 px-3 py-1.5 bg-[#03045e] text-white rounded-lg hover:bg-[#023e8a] text-xs font-medium flex items-center gap-1 flex-shrink-0 no-underline"
                      >
                        <Download className="w-3 h-3" />
                        Télécharger
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-2">Aucune ressource.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Filière</span>
                  <span className="text-gray-900 font-medium">{course.filiere ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Niveau</span>
                  <span className="text-gray-900 font-medium capitalize">{course.niveau ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Institution</span>
                  <span className="text-gray-900 font-medium">{course.institution ?? "—"}</span>
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
  );
}
