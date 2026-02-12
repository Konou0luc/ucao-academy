"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Folder, FileText, ChevronRight, ChevronDown, Search, BookOpen, GraduationCap } from "lucide-react";
import { courses as coursesApi, auth } from "@/lib/api";

// Construire l'arbre Filière > Niveau > Cours à partir de la liste plate API
function buildCourseTree(courses: { _id: string; title: string; description?: string; filiere?: string | null; niveau?: string | null; institution?: string }[]): FileItem[] {
  const byFiliere: Record<string, Record<string, FileItem[]>> = {};
  for (const c of courses) {
    const filiere = c.filiere || "Autre";
    const niveau = c.niveau || "autre";
    if (!byFiliere[filiere]) byFiliere[filiere] = {};
    if (!byFiliere[filiere][niveau]) byFiliere[filiere][niveau] = [];
    byFiliere[filiere][niveau].push({
      id: String(c._id),
      name: c.title,
      type: "file",
      description: c.description,
      filiere,
      niveau,
      institution: c.institution || undefined,
    });
  }
  const result: FileItem[] = [];
  for (const [filiereName, byNiveau] of Object.entries(byFiliere)) {
    const niveauItems: FileItem[] = [];
    for (const [niveauName, list] of Object.entries(byNiveau)) {
      niveauItems.push({
        id: `${filiereName}-${niveauName}`,
        name: niveauName === "licence1" ? "Licence 1" : niveauName === "licence2" ? "Licence 2" : niveauName === "licence3" ? "Licence 3" : niveauName,
        type: "folder",
        children: list,
      });
    }
    result.push({
      id: filiereName,
      name: filiereName,
      type: "folder",
      children: niveauItems,
    });
  }
  return result;
}

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  description?: string;
  filiere?: string;
  niveau?: string;
  institution?: string;
  children?: FileItem[];
}

const DEBOUNCE_MS = 400;

export default function CoursPage() {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [studentLevel, setStudentLevel] = useState<string>("licence1");
  const [studentFiliere, setStudentFiliere] = useState<string | null>(null);
  const [courseTree, setCourseTree] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userLevel = localStorage.getItem("studentLevel") || "licence1";
    setStudentLevel(userLevel);
    const storedFiliere = localStorage.getItem("studentFiliere");
    if (storedFiliere) setStudentFiliere(storedFiliere);
    auth.getUser().then((u: { filiere?: string; niveau?: string }) => {
      if (u?.filiere) {
        setStudentFiliere(u.filiere);
        localStorage.setItem("studentFiliere", u.filiere);
      }
      if (u?.niveau) {
        setStudentLevel(u.niveau);
        localStorage.setItem("studentLevel", u.niveau);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const filters: { niveau: string; filiere?: string; search?: string } = { niveau: studentLevel };
    if (studentFiliere) filters.filiere = studentFiliere;
    if (search?.trim()) filters.search = search.trim();
    coursesApi
      .getAll(filters)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        let tree = buildCourseTree(list);
        if (studentFiliere) {
          tree = tree.filter((item) => item.name === studentFiliere);
        }
        setCourseTree(tree);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible de charger les cours.");
          toast.error("Impossible de charger les cours.");
          setCourseTree([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [studentLevel, studentFiliere, search]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Fonction pour filtrer la structure par niveau de l'étudiant
  const filterByStudentLevel = (items: FileItem[]): FileItem[] => {
    return items
      .map((item): FileItem | null => {
        if (item.type === "file") {
          // Si c'est un fichier, on le garde seulement si le niveau correspond
          return item.niveau === studentLevel ? item : null;
        } else {
          // Si c'est un dossier, on filtre récursivement ses enfants
          const filteredChildren = item.children
            ? filterByStudentLevel(item.children)
            : [];
          
          // Si le dossier a des enfants après filtrage, on le garde
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren,
            } as FileItem;
          }
          return null;
        }
      })
      .filter((item): item is FileItem => item !== null);
  };

  const flattenStructure = (items: FileItem[]): FileItem[] => {
    let result: FileItem[] = [];
    items.forEach((item) => {
      result.push(item);
      if (item.children) {
        result = result.concat(flattenStructure(item.children));
      }
    });
    return result;
  };

  const filteredByLevel = filterByStudentLevel(courseTree);
  const allItems = flattenStructure(filteredByLevel);
  // Les données sont déjà filtrées par l'API (search + niveau)
  const filteredItems = filteredByLevel;

  const getNiveauColor = (niveau?: string) => {
    if (niveau === "licence1" || niveau === "licence2" || niveau === "licence3") {
      return "bg-[#03045e]/10 text-[#03045e] border-[#03045e]/20 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    }
    return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600";
  };

  const renderItem = (item: FileItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    if (item.type === "folder") {
      return (
        <div key={item.id}>
          <div
            onClick={() => hasChildren && toggleFolder(item.id)}
            className={`mx-2 my-1 flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
              hasChildren
                ? "cursor-pointer hover:bg-[#03045e]/5 dark:hover:bg-gray-700"
                : "cursor-not-allowed opacity-60"
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            {hasChildren ? (
              <div className="flex items-center justify-center w-5 h-5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0 text-[#03045e] dark:text-white" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-[#03045e] dark:text-white" />
                )}
              </div>
            ) : (
              <div className="w-5 h-5" />
            )}
            <Folder className={`w-5 h-5 flex-shrink-0 ${
              hasChildren ? "text-[#03045e] dark:text-white" : "text-gray-400 dark:text-gray-400"
            }`} />
            <span className={`text-sm font-medium ${
              hasChildren ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}>
              {item.name}
            </span>
            {hasChildren && (
              <span className="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-white">
                {item.children?.length}
              </span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {item.children?.map((child) => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={item.id}
          onClick={() => router.push(`/cours/${item.id}`)}
          className="group mx-2 my-1 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-4 py-3 transition-all hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-gray-700 dark:hover:border-gray-600"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <FileText className="w-4 h-4 text-gray-400 transition-colors group-hover:text-[#03045e] dark:text-gray-400 dark:group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900 transition-colors group-hover:text-[#03045e] dark:text-white dark:group-hover:text-white">
                {item.name}
              </span>
              {item.niveau && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getNiveauColor(item.niveau)}`}>
                  {item.niveau}
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-300">{item.description}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-[#03045e] dark:text-gray-400 dark:group-hover:text-white" />
        </div>
      );
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-transparent">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <div className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Cours</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-white">
                  Parcourez les cours organisés par filière et niveau d&apos;étude
                </p>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-lg border border-[#03045e]/20 bg-[#03045e]/10 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <GraduationCap className="h-4 w-4 shrink-0 text-[#03045e] dark:text-white" />
                <span className="text-sm font-medium capitalize text-[#03045e] dark:text-white">
                  {studentLevel}
                </span>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 dark:text-white" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-[#03045e] focus:ring-2 focus:ring-[#03045e] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-200"
            />
          </div>
        </div>

        {/* File Explorer */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white">
                <span className="text-gray-400 dark:text-white">web-academy</span>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-white" />
                <span className="font-medium text-gray-900 dark:text-white">cours</span>
              </div>
            </div>

            {/* File Tree */}
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {error && (
                <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="py-12 text-center">
                  <p className="text-gray-600 dark:text-white">Chargement des cours...</p>
                </div>
              ) : (
                <div className="py-2">
                  {!loading && filteredItems.length > 0 ? (
                    filteredItems.map((item) => renderItem(item, 0))
                  ) : (
                    <div className="py-12 text-center">
                      <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-white" />
                      <p className="text-gray-600 dark:text-white">
                        {search ? "Aucun cours trouvé" : "Aucun cours disponible"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-200">
                        {search
                          ? "Essayez de modifier votre recherche"
                          : "Aucun cours n'est disponible pour votre niveau d'étude"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Footer */}
            {!searchInput && (
              <div className="mt-4">
                <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white">
                    <BookOpen className="h-4 w-4 text-[#03045e] dark:text-white" />
                    <span className="font-medium">
                      {allItems.filter((item) => item.type === "file").length} cours disponibles pour votre niveau
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
