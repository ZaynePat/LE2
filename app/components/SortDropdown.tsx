"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

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
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[200px] h-9">
          <ArrowUpDown className="size-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date Added (Newest)</SelectItem>
          <SelectItem value="threat">Threat Type</SelectItem>
          <SelectItem value="reporter">Reporter</SelectItem>
          <SelectItem value="url">URL (A-Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
