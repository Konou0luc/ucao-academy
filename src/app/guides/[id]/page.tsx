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
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <Link href="/guides" className="mb-2 inline-flex items-center gap-2 font-medium text-[#03045e] hover:underline dark:text-blue-300">
            <ArrowLeft className="h-4 w-4" /> Retour aux guides
          </Link>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
            </div>
          )}
          {error && <p className="font-medium text-red-600 dark:text-red-400">{error}</p>}
          {guide && <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{guide.title}</h1>}
        </div>
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#03045e]" />
            </div>
          )}
          {error && !loading && (
            <div className="rounded-xl border border-gray-100 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-4 text-gray-600 dark:text-gray-300">{error}</p>
              <Link href="/guides" className="font-medium text-[#03045e] hover:underline dark:text-blue-300">Retour aux guides</Link>
            </div>
          )}
          {guide && !loading && (
            <article className="max-w-3xl rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div
                className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 dark:prose-invert dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, "<br />") }}
              />
            </article>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
