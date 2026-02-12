"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MainLayout from "../../layouts/MainLayout";
import { ArrowLeft, Loader2 } from "lucide-react";
import { guides as guidesApi } from "@/lib/api";

export default function GuideDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [guide, setGuide] = useState<{ _id: string; title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    guidesApi
      .getOne(id)
      .then((data) => {
        if (data.message) {
          setError((data as { message: string }).message);
          setGuide(null);
          return;
        }
        setGuide({
          _id: (data as { _id: string })._id,
          title: (data as { title: string }).title,
          content: (data as { content: string }).content || "",
        });
      })
      .catch(() => {
        setError("Guide introuvable.");
        setGuide(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Link href="/guides" className="inline-flex items-center gap-2 text-[#03045e] hover:underline font-medium mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux guides
          </Link>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" /> Chargement...
            </div>
          )}
          {error && <p className="text-red-600 font-medium">{error}</p>}
          {guide && <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{guide.title}</h1>}
        </div>
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 text-[#03045e] animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/guides" className="text-[#03045e] hover:underline font-medium">Retour aux guides</Link>
            </div>
          )}
          {guide && !loading && (
            <article className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
              <div
                className="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, "<br />") }}
              />
            </article>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
