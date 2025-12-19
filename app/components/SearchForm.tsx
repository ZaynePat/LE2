"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reset to page 1 on new search
    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by URL, threat, reporter..."
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" size="default">
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}
