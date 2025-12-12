import Link from "next/link";
import { Suspense } from "react";
import SearchForm from "./components/SearchForm";
import SaveButton from "./components/SaveButton";
import BookmarksList from "./components/BookmarksList";

export const revalidate = 300;

type ViewType = "bookmarks" | "urls";

async function fetchData(view: ViewType, limit: number) {
  if (view === "bookmarks") {
    return { urls: [] }; // Bookmarks handled client-side
  }
  
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const endpoint = "/api/urlhaus/urls";
  const urlObj = new URL(endpoint, base);
  urlObj.searchParams.set("limit", String(limit));

  const res = await fetch(urlObj.toString(), {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error ? ` - ${err.error}` : "";
    } catch (e) {
      // ignore parse errors
    }
    throw new Error(`Failed to fetch data: ${res.status}${detail}`);
  }
  return res.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; view?: string; q?: string }>;
}) {
  const params = await searchParams;
  const pageSize = 5;
  const pageParam = params?.page;
  const pageRaw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const pageParsed = Number.parseInt(pageRaw ?? "1", 10);
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;
  
  const viewParam = params?.view;
  const viewRaw = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const view: ViewType = viewRaw === "urls" ? "urls" : "bookmarks";
  
  const queryParam = params?.q;
  const searchQuery = (Array.isArray(queryParam) ? queryParam[0] : queryParam)?.toLowerCase().trim() ?? "";
  
  // For bookmarks view, render client component
  if (view === "bookmarks") {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">URLhaus Data Browser</h1>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 border-b">
          <Link
            href={`/?view=bookmarks&page=1`}
            className="px-4 py-2 font-medium border-b-2 border-blue-600 text-blue-600"
          >
            My Bookmarks
          </Link>
          <Link
            href={`/?view=urls&page=1`}
            className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
          >
            Recent URLs
          </Link>
        </div>

        <Suspense fallback={<div className="text-center py-8">Loading bookmarks...</div>}>
          <BookmarksList />
        </Suspense>
      </main>
    );
  }
  
  const fetchLimit = Math.min(100, pageSize * page + 10);

  let data: any = null;
  try {
    data = await fetchData(view, fetchLimit);
  } catch (e: any) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">URLhaus Data Browser</h1>
        <div className="mt-3 text-red-600">{e?.message ?? "Error loading data"}</div>
      </main>
    );
  }

  // Extract items from the correct property based on view type
  let items: any[] = Array.isArray(data?.urls) ? data.urls : [];
  
  // Filter items based on search query
  if (searchQuery) {
    items = items.filter((item) => {
      const url = (item.url ?? "").toLowerCase();
      const threat = (item.threat ?? "").toLowerCase();
      const reporter = (item.reporter ?? "").toLowerCase();
      const filename = (item.filename ?? "").toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";
      
      return (
        url.includes(searchQuery) ||
        threat.includes(searchQuery) ||
        reporter.includes(searchQuery) ||
        filename.includes(searchQuery) ||
        tags.includes(searchQuery)
      );
    });
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = items.slice(start, end);
  // Has next if we have more items than current page end, or if we fetched the full limit (might be more)
  const hasNext = items.length > end || items.length >= fetchLimit;
  const hasPrev = page > 1;
  const totalPages = Math.ceil(items.length / pageSize);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">URLhaus Data Browser</h1>

      {/* Search Bar */}
      <Suspense fallback={<div className="h-12 bg-gray-100 rounded mb-6 animate-pulse"></div>}>
        <SearchForm />
      </Suspense>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6 border-b">
        <Link
          href={`/?view=bookmarks&page=1`}
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          My Bookmarks
        </Link>
        <Link
          href={`/?view=urls&page=1`}
          className="px-4 py-2 font-medium border-b-2 border-blue-600 text-blue-600"
        >
          Recent URLs
        </Link>
      </div>

      {/* Page Indicator */}
      <div className="mb-4 text-sm text-gray-600">
        {searchQuery && (
          <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            Searching: "{searchQuery}"
          </span>
        )}
        Page {page} {totalPages > 0 && `of ~${totalPages}`} • Showing {displayItems.length} of {items.length} entries
        {searchQuery && items.length === 0 && (
          <span className="ml-2 text-orange-600">No matches found</span>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className="mt-4 text-gray-500">No data available.</div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((u: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="font-mono text-sm break-all flex-1">
                  <a href={u.url ?? "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {u.url ?? "—"}
                  </a>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    u.url_status === "online" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {u.url_status ?? "unknown"}
                  </span>
                  <SaveButton
                    url={u.url}
                    threat={u.threat}
                    reporter={u.reporter}
                    date_added={u.dateadded ?? u.date_added}
                    url_status={u.url_status}
                    tags={u.tags}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                <div><strong>Threat:</strong> {u.threat ?? "—"}</div>
                <div><strong>Reporter:</strong> {u.reporter ?? "—"}</div>
                <div><strong>First seen:</strong> {u.dateadded ?? u.date_added ?? "—"}</div>
                <div><strong>Blacklists:</strong> {u.blacklists?.spamhaus_dbl ?? "—"}</div>
              </div>
              {u.tags && u.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {u.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <Link
          href={hasPrev ? `/?view=${view}&page=${page - 1}` : "#"}
          className={`px-4 py-2 rounded border font-medium ${
            hasPrev
              ? "bg-white hover:bg-gray-50 text-gray-700"
              : "opacity-40 cursor-not-allowed text-gray-400"
          }`}
          aria-disabled={!hasPrev}
        >
          ← Previous
        </Link>
        
        <span className="text-sm text-gray-600">
          Page {page} {totalPages > 0 && `of ~${totalPages}`}
        </span>

        <Link
          href={hasNext ? `/?view=${view}&page=${page + 1}` : "#"}
          className={`px-4 py-2 rounded border font-medium ${
            hasNext
              ? "bg-white hover:bg-gray-50 text-gray-700"
              : "opacity-40 cursor-not-allowed text-gray-400"
          }`}
          aria-disabled={!hasNext}
        >
          Next →
        </Link>
      </div>
    </main>
  );
}
