import Link from "next/link";
import { Suspense } from "react";
import SearchForm from "./components/SearchForm";
import SaveButton from "./components/SaveButton";
import BookmarksList from "./components/BookmarksList";
import SortDropdown from "./components/SortDropdown";
import { getThreatColor, getThreatLabel } from "@/lib/threatColors";

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
  searchParams?: Promise<{ page?: string; view?: string; q?: string; sort?: string }>;
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
  
  const sortParam = params?.sort;
  const sortRaw = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  const sortBy = sortRaw === "threat" || sortRaw === "reporter" || sortRaw === "url" ? sortRaw : "date";
  
  // For bookmarks view, render client component
  if (view === "bookmarks") {
    return (
      <main className="px-6 py-10 max-w-6xl mx-auto space-y-8">
        <section className="hero-panel p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="muted-label text-slate-200">Collection</p>
              <h1 className="text-3xl font-bold">URLhaus Data Browser</h1>
              <p className="text-slate-200 max-w-2xl">
                Curate, categorize, and revisit malicious URLs you care about. Toggle below to switch views.
              </p>
            </div>
            <div className="pill-toggle bg-white/15">
              <Link
                href={`/?view=bookmarks&page=1`}
                className="bg-white text-slate-900 shadow-sm"
              >
                My Bookmarks
              </Link>
              <Link
                href={`/?view=urls&page=1`}
                className="text-white/80 hover:text-white"
              >
                Recent URLs
              </Link>
            </div>
          </div>
        </section>

        <section className="hero-panel p-4 md:p-6 text-white">
          <Suspense fallback={<div className="text-center py-8">Loading bookmarks...</div>}>
            <BookmarksList />
          </Suspense>
        </section>
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
  
  // Sort items based on selected option
  items.sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.date_added ?? 0).getTime() - new Date(a.date_added ?? 0).getTime();
      case "threat":
        return (a.threat ?? "").localeCompare(b.threat ?? "");
      case "reporter":
        return (a.reporter ?? "").localeCompare(b.reporter ?? "");
      case "url":
        return (a.url ?? "").localeCompare(b.url ?? "");
      default:
        return 0;
    }
  });
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = items.slice(start, end);
  // Has next if we have more items than current page end, or if we fetched the full limit (might be more)
  const hasNext = items.length > end || items.length >= fetchLimit;
  const hasPrev = page > 1;
  const totalPages = Math.ceil(items.length / pageSize);
  const stats = [
    { label: "Loaded", value: items.length.toString() },
    { label: "Showing", value: displayItems.length.toString() },
    { label: "Page", value: `${page}${totalPages ? ` / ~${totalPages}` : ""}` },
  ];

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto space-y-8">
      <section className="hero-panel p-6 md:p-8 text-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="muted-label text-slate-200">Live Feed</p>
              <h1 className="text-3xl font-bold">URLhaus Data Browser</h1>
              <p className="text-slate-200 max-w-2xl">
                Inspect the latest malicious URLs, filter by text, sort by key fields, and bookmark what matters.
              </p>
            </div>
            <div className="pill-toggle bg-white/15">
              <Link
                href={`/?view=bookmarks&page=1`}
                className="text-white/80 hover:text-white"
              >
                My Bookmarks
              </Link>
              <Link
                href={`/?view=urls&page=1`}
                className="bg-white text-slate-900 shadow-sm"
              >
                Recent URLs
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-100">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-200/80">{stat.label}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-panel p-4 md:p-6 space-y-6 text-white">
        {/* Search Bar */}
        <Suspense fallback={<div className="h-12 bg-gray-100 rounded mb-6 animate-pulse"></div>}>
          <SearchForm />
        </Suspense>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-slate-100">
            {searchQuery && (
              <span className="mr-2 px-2 py-1 bg-blue-900/50 text-blue-200 rounded text-xs font-semibold">
                Searching: "{searchQuery}"
              </span>
            )}
            Page {page} {totalPages > 0 && `of ~${totalPages}`} • Showing {displayItems.length} of {items.length} entries
            {searchQuery && items.length === 0 && (
              <span className="ml-2 text-orange-300">No matches found</span>
            )}
          </div>

          {/* Sort Dropdown */}
          <Suspense fallback={<div className="h-8 w-48 bg-gray-100 rounded animate-pulse"></div>}>
            <SortDropdown currentSort={sortBy} />
          </Suspense>
        </div>

      {displayItems.length === 0 ? (
        <div className="mt-4 text-gray-500">No data available.</div>
      ) : (
        <div className="space-y-4">
          {displayItems.map((u: any, idx: number) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-mono text-sm break-all flex-1">
                  <a
                    href={u.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
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
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700 mt-3">
                <div className="flex items-center gap-2">
                  <span className="muted-label">Threat</span>
                  <span className={`px-2 py-0.5 text-xs rounded border ${getThreatColor(u.threat)}`}>
                    {getThreatLabel(u.threat)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="muted-label">Reporter</span>
                  <span>{u.reporter ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="muted-label">First seen</span>
                  <span>{u.dateadded ?? u.date_added ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="muted-label">Blacklists</span>
                  <span>{u.blacklists?.spamhaus_dbl ?? "—"}</span>
                </div>
              </div>
              {u.tags && u.tags.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {u.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
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
              ? "bg-white hover:bg-slate-50 text-slate-700"
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
              ? "bg-white hover:bg-slate-50 text-slate-700"
              : "opacity-40 cursor-not-allowed text-gray-400"
          }`}
          aria-disabled={!hasNext}
        >
          Next →
        </Link>
      </div>
      </section>
    </main>
  );
}
