import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SearchForm from "./components/SearchForm";
import SaveButton from "./components/SaveButton";
import BookmarksList from "./components/BookmarksList";
import SortDropdown from "./components/SortDropdown";
import { getThreatColor, getThreatLabel } from "@/lib/threatColors";
import { cn } from "@/lib/utils";
import { Bookmark, Globe, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, Calendar, User, Shield } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <main className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto space-y-6">
        <Card className="hero-panel border-0">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <CardDescription className="text-slate-600 dark:text-slate-300/80 flex items-center gap-2">
                  <Bookmark className="size-4" />
                  Collection
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">URLhaus Data Browser</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-300 max-w-2xl">
                  Curate, categorize, and revisit malicious URLs you care about.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-1">
                <Button
                  asChild
                  variant={view === "bookmarks" ? "default" : "ghost"}
                  size="sm"
                    className={cn(
                      view === "bookmarks" && "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-slate-600",
                      view !== "bookmarks" && "text-white dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/50"
                    )}
                >
                  <Link href={`/?view=bookmarks&page=1`}>
                    <Bookmark className="size-4 mr-2" />
                    My Bookmarks
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                >
                  <Link href={`/?view=urls&page=1`}>
                    <Globe className="size-4 mr-2" />
                    Recent URLs
                  </Link>
                </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hero-panel border-0">
          <CardContent className="pt-6">
            <Suspense fallback={
              <div className="text-center py-12 text-slate-300 dark:text-slate-400">
                <div className="inline-block animate-spin rounded-full size-8 border-4 border-slate-300 dark:border-slate-600 border-t-transparent mb-4"></div>
                <p>Loading bookmarks...</p>
              </div>
            }>
              <BookmarksList />
            </Suspense>
          </CardContent>
        </Card>
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
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>{e?.message ?? "Error loading data"}</CardDescription>
          </CardHeader>
        </Card>
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
    { label: "Loaded", value: items.length.toString(), icon: Globe },
    { label: "Showing", value: displayItems.length.toString(), icon: AlertCircle },
    { label: "Page", value: `${page}${totalPages ? ` / ${totalPages}` : ""}`, icon: Calendar },
  ];

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10 max-w-6xl mx-auto space-y-6">
      <Card className="hero-panel border-0">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <CardDescription className="text-slate-600 dark:text-slate-300/80 flex items-center gap-2">
                  <Globe className="size-4" />
                  Live Feed
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">URLhaus Data Browser</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-300 max-w-2xl">
                  Inspect the latest malicious URLs, filter by text, sort by key fields, and bookmark what matters.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Link href={`/?view=bookmarks&page=1`}>
                      <Bookmark className="size-4 mr-2" />
                      My Bookmarks
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant={view === "urls" ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      view === "urls" && "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600",
                      view !== "urls" && "text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <Link href={`/?view=urls&page=1`}>
                      <Globe className="size-4 mr-2" />
                      Recent URLs
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-4 text-slate-500 dark:text-slate-400" />
                      <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300/80 font-medium">{stat.label}</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="hero-panel border-0">
        <CardContent className="pt-6 space-y-6">
          {/* Search Bar */}
          <Suspense fallback={<div className="h-12 bg-slate-200 dark:bg-slate-800/50 rounded-lg mb-6 animate-pulse"></div>}>
            <SearchForm />
          </Suspense>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
                  Searching: &quot;{searchQuery}&quot;
                </Badge>
              )}
              <span className="text-slate-600 dark:text-slate-400">
                Page {page} {totalPages > 0 && `of ${totalPages}`} • Showing {displayItems.length} of {items.length} entries
              </span>
              {searchQuery && items.length === 0 && (
                <Badge variant="destructive" className="ml-2">
                  No matches found
                </Badge>
              )}
            </div>

            {/* Sort Dropdown */}
            <Suspense fallback={<div className="h-9 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>}>
              <SortDropdown currentSort={sortBy} />
            </Suspense>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700/50" />

          {displayItems.length === 0 ? (
            <div className="text-center py-12 text-slate-300 dark:text-slate-400">
              <AlertCircle className="size-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
              <p className="text-lg font-medium">No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayItems.map((u: any, idx: number) => (
                <Card key={idx} className="bg-white/95 dark:bg-slate-800/95 hover:shadow-lg hover:-translate-y-0.5 transition-all border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div className="font-mono text-sm break-all flex-1 min-w-0">
                        <a
                          href={u.url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline flex items-center gap-2 group"
                        >
                          {u.url ?? "—"}
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={u.url_status === "online" ? "destructive" : "secondary"}
                          className={u.url_status === "online" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" : ""}
                        >
                          {u.url_status ?? "unknown"}
                        </Badge>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Threat</span>
                        <Badge className={`${getThreatColor(u.threat)} border`}>
                          {getThreatLabel(u.threat)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Reporter</span>
                        <span className="text-foreground">{u.reporter ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">First seen</span>
                        <span className="text-foreground">{u.dateadded ?? u.date_added ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Blacklists</span>
                        <span className="text-foreground">{u.blacklists?.spamhaus_dbl ?? "—"}</span>
                      </div>
                    </div>
                    {u.tags && u.tags.length > 0 && (
                      <div className="mt-4 flex gap-1.5 flex-wrap">
                        {u.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              asChild
              disabled={!hasPrev}
              className="gap-2"
            >
              <Link href={hasPrev ? `/?view=${view}&page=${page - 1}${searchQuery ? `&q=${searchQuery}` : ""}${sortBy !== "date" ? `&sort=${sortBy}` : ""}` : "#"}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>
            
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} {totalPages > 0 && `of ${totalPages}`}
            </span>

            <Button
              variant="outline"
              asChild
              disabled={!hasNext}
              className="gap-2"
            >
              <Link href={hasNext ? `/?view=${view}&page=${page + 1}${searchQuery ? `&q=${searchQuery}` : ""}${sortBy !== "date" ? `&sort=${sortBy}` : ""}` : "#"}>
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
