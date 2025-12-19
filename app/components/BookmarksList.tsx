"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getThreatColor, getThreatLabel } from "@/lib/threatColors";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FolderPlus,
  Shield,
  User,
  Calendar,
  Bookmark as BookmarkIcon,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: number;
  category_id: number | null;
  url: string;
  threat: string | null;
  reporter: string | null;
  date_added: string | null;
  status: string | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  created_at: string;
}

export default function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Bookmark>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<number | null>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookmarksRes, categoriesRes] = await Promise.all([
        fetch("/api/bookmarks"),
        fetch("/api/categories"),
      ]);
      const bookmarksData = await bookmarksRes.json();
      const categoriesData = await categoriesRes.json();
      setBookmarks(bookmarksData.bookmarks || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number | null) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (res.ok) {
        await fetchData();
        setNewCategoryName("");
        setShowNewCategory(false);
      } else {
        alert("Failed to create category");
      }
    } catch (error) {
      alert("Error creating category");
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    if (!editCategoryName.trim()) return;

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCategoryName }),
      });

      if (res.ok) {
        await fetchData();
        setEditingCategory(null);
        setEditCategoryName("");
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      alert("Error updating category");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Delete this category? Bookmarks will become uncategorized.")) return;

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to delete category");
      }
    } catch (error) {
      alert("Error deleting category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bookmark?")) return;

    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarks(bookmarks.filter((b) => b.id !== id));
      } else {
        alert("Failed to delete bookmark");
      }
    } catch (error) {
      alert("Error deleting bookmark");
    }
  };

  const startEdit = (bookmark: Bookmark) => {
    setEditing(bookmark.id);
    setEditForm(bookmark);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleUpdate = async (id: number) => {
    const originalBookmark = bookmarks.find(b => b.id === id);
    
    // Check if category has actually changed
    if (originalBookmark && originalBookmark.category_id === editForm.category_id) {
      setEditing(null);
      setEditForm({});
      return; // No changes, just close edit mode
    }

    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: editForm.category_id }),
      });

      if (res.ok) {
        await fetchData();
        setEditing(null);
        setEditForm({});
      } else {
        alert("Failed to update bookmark");
      }
    } catch (error) {
      alert("Error updating bookmark");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-300 dark:text-slate-400">
        <div className="inline-block animate-spin rounded-full size-8 border-4 border-slate-300 dark:border-slate-600 border-t-transparent mb-4"></div>
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  const uncategorized = bookmarks.filter((b) => b.category_id === null);
  const categorizedBookmarks = categories.map((cat) => ({
    category: cat,
    bookmarks: bookmarks.filter((b) => b.category_id === cat.id),
  }));

  const allEmpty = bookmarks.length === 0;

  if (allEmpty) {
    return (
      <div className="text-center py-12 text-slate-300 dark:text-slate-400">
        <BookmarkIcon className="size-16 mx-auto mb-4 text-slate-400 dark:text-slate-500 opacity-50" />
        <p className="text-lg font-medium mb-2">No bookmarks yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">Switch to &quot;Recent URLs&quot; tab and bookmark some malicious URLs</p>
      </div>
    );
  }

  const renderBookmark = (bookmark: Bookmark, index: number) => {
    let tags: string[] = [];
    try {
      const parsed = bookmark.tags ? JSON.parse(bookmark.tags) : [];
      tags = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      tags = [];
    }
    const isEditing = editing === bookmark.id;

    return (
      <Card key={bookmark.id} className="bg-white/95 dark:bg-slate-800/95 hover:shadow-lg hover:-translate-y-1 transition-all border-slate-200 dark:border-slate-700 group relative overflow-hidden">
        {/* Number badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center justify-center size-9 rounded-lg bg-gradient-to-br from-slate-200/80 to-slate-100/60 dark:from-slate-700/80 dark:to-slate-600/60 border-2 border-slate-300/60 dark:border-slate-500/60 text-slate-700 dark:text-slate-300 font-bold text-sm shadow-md backdrop-blur-sm">
            <span className="drop-shadow-sm">#{index + 1}</span>
          </div>
        </div>
        <CardContent className="pt-6 pl-16">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Move to Category</label>
                <Select
                  value={editForm.category_id?.toString() || ""}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, category_id: value ? Number(value) : null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdate(bookmark.id)}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="size-4" />
                  Save
                </Button>
                <Button onClick={cancelEdit} variant="outline" size="sm" className="gap-2">
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* URL Header Section */}
              <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm break-all text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors inline-flex items-center gap-2 group/link"
                    >
                      <span>{bookmark.url}</span>
                      <ExternalLink className="size-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                    </a>
                  </div>
                  <Badge
                    variant={bookmark.status === "online" ? "destructive" : "secondary"}
                    className={cn(
                      "shrink-0",
                      bookmark.status === "online" 
                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" 
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {bookmark.status ?? "unknown"}
                  </Badge>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <Shield className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Threat</span>
                  <Badge className={`${getThreatColor(bookmark.threat)} border ml-auto`}>
                    {getThreatLabel(bookmark.threat)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Reporter</span>
                  <span className="text-foreground font-medium ml-auto">{bookmark.reporter ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">First seen</span>
                  <span className="text-foreground font-medium ml-auto">{bookmark.date_added ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <BookmarkIcon className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wide">Bookmarked</span>
                  <span className="text-foreground font-medium ml-auto">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {bookmark.notes && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-amber-900 dark:text-amber-200">Notes:</strong>
                      <p className="text-amber-800 dark:text-amber-300 mt-1">{bookmark.notes}</p>
                    </div>
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  {tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => startEdit(bookmark)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit2 className="size-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(bookmark.id)}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* New Category Button */}
      <div className="flex gap-2">
        {showNewCategory ? (
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              autoFocus
            />
            <Button
              onClick={handleCreateCategory}
              size="default"
              className="gap-2"
            >
              <Save className="size-4" />
              Create
            </Button>
            <Button
              onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName("");
              }}
              variant="outline"
              size="default"
              className="gap-2"
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowNewCategory(true)}
            size="default"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FolderPlus className="size-4" />
            New Category
          </Button>
        )}
      </div>

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <Card className="hero-panel border-0">
          <CardHeader className="pb-0 py-4">
            <div className="flex items-center justify-between min-h-[2.5rem]">
              <Button
                onClick={() => toggleCategory(null)}
                variant="ghost"
                className="flex-1 justify-between items-center p-0 h-auto hover:bg-transparent text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 dark:from-emerald-500/30 dark:to-emerald-400/20 border-2 border-emerald-500/50 dark:border-emerald-400/60 text-emerald-700 dark:text-emerald-300 font-bold text-base shadow-lg backdrop-blur-sm ring-2 ring-emerald-500/20 dark:ring-emerald-400/30 shrink-0">
                    <span className="drop-shadow-sm">1</span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Uncategorized ({uncategorized.length})
                  </CardTitle>
                </div>
                {expandedCategories.has(null) ? (
                  <ChevronUp className="size-5 text-slate-600 dark:text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="size-5 text-slate-600 dark:text-slate-400 shrink-0" />
                )}
              </Button>
            </div>
          </CardHeader>
              {expandedCategories.has(null) && (
            <>
              <Separator className="bg-slate-200 dark:bg-slate-700/50 my-4" />
              <CardContent className="space-y-4">
                {uncategorized.map((bookmark, index) => renderBookmark(bookmark, index))}
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Categorized */}
      {categorizedBookmarks.map(({ category, bookmarks: catBookmarks }, categoryIndex) => {
        const categoryNumber = uncategorized.length > 0 ? categoryIndex + 2 : categoryIndex + 1;
        return (
        <Card key={category.id} className="hero-panel border-0">
          <CardHeader className="pb-0 py-4">
            <div className="flex items-center justify-between gap-2 min-h-[2.5rem]">
              <Button
                onClick={() => toggleCategory(category.id)}
                variant="ghost"
                className="flex-1 justify-between items-center p-0 h-auto hover:bg-transparent text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 dark:from-emerald-500/30 dark:to-emerald-400/20 border-2 border-emerald-500/50 dark:border-emerald-400/60 text-emerald-700 dark:text-emerald-300 font-bold text-base shadow-lg backdrop-blur-sm ring-2 ring-emerald-500/20 dark:ring-emerald-400/30 shrink-0">
                    <span className="drop-shadow-sm">{categoryNumber}</span>
                  </div>
                  {editingCategory === category.id ? (
                    <Input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") handleUpdateCategory(category.id);
                        if (e.key === "Escape") {
                          setEditingCategory(null);
                          setEditCategoryName("");
                        }
                      }}
                      className="text-lg font-semibold text-foreground bg-white dark:bg-slate-800"
                      autoFocus
                    />
                  ) : (
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {category.name} ({catBookmarks.length})
                    </CardTitle>
                  )}
                </div>
                {expandedCategories.has(category.id) ? (
                  <ChevronUp className="size-5 text-slate-600 dark:text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="size-5 text-slate-600 dark:text-slate-400 shrink-0" />
                )}
              </Button>
              <div className="flex gap-2 items-center">
                {editingCategory === category.id ? (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateCategory(category.id);
                      }}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="size-4" />
                      Save
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(null);
                        setEditCategoryName("");
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category.id);
                        setEditCategoryName(category.name);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20"
                      title="Edit category name"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300"
                      title="Delete category"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          {expandedCategories.has(category.id) && catBookmarks.length > 0 && (
            <>
              <Separator className="bg-slate-200 dark:bg-slate-700/50 my-4" />
              <CardContent className="space-y-4">
                {catBookmarks.map((bookmark, index) => renderBookmark(bookmark, index))}
              </CardContent>
            </>
          )}
        </Card>
        );
      })}
    </div>
  );
}
