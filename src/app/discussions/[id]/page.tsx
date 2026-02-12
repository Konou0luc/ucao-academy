"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import MainLayout from "../../layouts/MainLayout";
import { ArrowLeft, Send, Pin, Clock, MessageSquare, BookOpen } from "lucide-react";
import Link from "next/link";
import { discussions as discussionsApi } from "@/lib/api";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-[#03045e]",
    "bg-[#d90429]",
    "bg-blue-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-orange-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

type ReplyItem = {
  id: string;
  content: string;
  user: { name: string; email?: string };
  created_at: string;
  is_instructor?: boolean;
};

export default function DiscussionDetailPage() {
  const params = useParams();
  const discussionId = params.id as string;
  const [replyContent, setReplyContent] = useState("");
  const [discussion, setDiscussion] = useState<{
    id: string;
    title: string;
    content: string;
    course_title: string | null;
    user: { name: string; email?: string };
    is_pinned: boolean;
    created_at: string;
    replies: ReplyItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!discussionId) {
      setLoading(false);
      return;
    }
    discussionsApi
      .getOne(discussionId)
      .then((data) => {
        if (data.message) {
          setError(data.message);
          toast.error(data.message);
          setDiscussion(null);
          return;
        }
        setDiscussion({
          id: String(data._id),
          title: data.title,
          content: data.content,
          course_title: data.course_id?.title ?? null,
          user: data.user_id || { name: "Anonyme" },
          is_pinned: !!data.is_pinned,
          created_at: data.createdAt || new Date().toISOString(),
          replies: (Array.isArray(data.replies) ? data.replies : []).map((r: { _id: string; content: string; user_id?: { name: string; email?: string }; createdAt?: string }) => ({
            id: String(r._id),
            content: r.content,
            user: r.user_id || { name: "Anonyme" },
            created_at: r.createdAt || new Date().toISOString(),
          })),
        });
      })
      .catch(() => {
        setError("Discussion introuvable.");
        toast.error("Discussion introuvable.");
        setDiscussion(null);
      })
      .finally(() => setLoading(false));
  }, [discussionId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !discussionId || !discussion) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Connectez-vous pour répondre.");
      toast.error("Connectez-vous pour répondre.");
      return;
    }
    setSubmittingReply(true);
    try {
      const data = await discussionsApi.addReply(discussionId, replyContent.trim());
      if (data.message) {
        setError(data.message);
        toast.error(data.message);
      } else {
        const newReply: ReplyItem = {
          id: String(data._id),
          content: data.content,
          user: data.user_id || { name: "Anonyme" },
          created_at: data.createdAt || new Date().toISOString(),
        };
        setDiscussion((prev) => prev ? { ...prev, replies: [...prev.replies, newReply] } : null);
        setReplyContent("");
        toast.success("Réponse envoyée.");
      }
    } catch {
      setError("Erreur lors de l'envoi de la réponse.");
      toast.error("Erreur lors de l'envoi de la réponse.");
    } finally {
      setSubmittingReply(false);
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center p-6">
          <p className="text-gray-600">Chargement de la discussion...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !discussion) {
    return (
      <MainLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">
            {error || "Discussion introuvable."}
          </div>
          <Link href="/discussions" className="inline-flex items-center gap-2 mt-4 text-[#03045e] font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour aux discussions
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
              href="/discussions"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discussion</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Participez à la conversation et partagez vos connaissances
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Discussion principale */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header de la discussion */}
              <div className="bg-gradient-to-r from-[#03045e] to-[#023e8a] px-6 py-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {discussion.is_pinned && (
                    <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-md font-semibold flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      Épinglé
                    </span>
                  )}
                  {discussion.course_title && (
                    <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-md font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {discussion.course_title}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {discussion.title}
                </h1>
              </div>

              {/* Contenu de la discussion */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 ${getAvatarColor(discussion.user.name)} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {getInitials(discussion.user.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {discussion.user.name}
                      </h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(discussion.created_at)}
                      </span>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {discussion.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Réponses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#03045e]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {discussion.replies.length} Réponse{discussion.replies.length > 1 ? "s" : ""}
                </h2>
              </div>
              <div className="space-y-4">
                {discussion.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 ${getAvatarColor(reply.user.name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                        {getInitials(reply.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {reply.user.name}
                          </h3>
                          {reply.is_instructor && (
                            <span className="px-2 py-0.5 bg-[#03045e] text-white text-xs rounded-md font-medium">
                              Formateur
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire de réponse */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#03045e]" />
                Ajouter une réponse
              </h2>
              <form onSubmit={handleReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#03045e] focus:border-[#03045e] resize-none text-gray-900 placeholder:text-gray-500"
                  style={{ color: "#111827" }}
                  required
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Votre réponse sera visible par tous les participants
                  </p>
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="px-6 py-2 bg-[#d90429] text-white rounded-lg font-semibold hover:bg-[#b0031f] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submittingReply ? "Envoi..." : "Publier la réponse"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
