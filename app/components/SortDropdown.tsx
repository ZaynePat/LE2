"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.set("page", "1"); // Reset to page 1 when sorting changes
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Sort by:</label>
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
      >
        <option value="date">Date Added (Newest)</option>
        <option value="threat">Threat Type</option>
        <option value="reporter">Reporter</option>
        <option value="url">URL (A-Z)</option>
      </select>
    </div>
  );
}
