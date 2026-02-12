"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_DEFAULT = 20;

type Props = {
  page: number;
  total: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export default function PaginationBar({ page, total, pageSize = PAGE_SIZE_DEFAULT, loading = false, onPageChange, itemLabel = "élément" }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-gray-600">
        Page {page} sur {totalPages} ({total} {itemLabel}{total !== 1 ? "s" : ""})
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
        >
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
