"use client";

import { useState, useEffect } from "react";
import { getThreatColor, getThreatLabel } from "@/lib/threatColors";

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
    return <div className="text-center py-8 text-gray-600">Loading bookmarks...</div>;
  }

  const uncategorized = bookmarks.filter((b) => b.category_id === null);
  const categorizedBookmarks = categories.map((cat) => ({
    category: cat,
    bookmarks: bookmarks.filter((b) => b.category_id === cat.id),
  }));

  const allEmpty = bookmarks.length === 0;

  if (allEmpty) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No bookmarks yet</p>
        <p className="text-sm">Switch to "Recent URLs" tab and bookmark some malicious URLs</p>
      </div>
    );
  }

  const renderBookmark = (bookmark: Bookmark) => {
    let tags: string[] = [];
    try {
      const parsed = bookmark.tags ? JSON.parse(bookmark.tags) : [];
      tags = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      tags = [];
    }
    const isEditing = editing === bookmark.id;

    return (
      <div key={bookmark.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Move to Category</label>
              <select
                value={editForm.category_id || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, category_id: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(bookmark.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button onClick={cancelEdit} className="px-4 py-2 border rounded hover:bg-gray-100 text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div className="font-mono text-sm break-all flex-1 text-blue-600">
                {bookmark.url}
              </div>
              <span
                className={`ml-3 px-2 py-1 text-xs rounded ${
                  bookmark.status === "online" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {bookmark.status ?? "unknown"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-700 mt-3">
              <div className="flex items-center gap-2">
                <span className="muted-label">Threat</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${getThreatColor(bookmark.threat)}`}>
                  {getThreatLabel(bookmark.threat)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="muted-label">Reporter</span>
                <span>{bookmark.reporter ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="muted-label">First seen</span>
                <span>{bookmark.date_added ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="muted-label">Bookmarked</span>
                <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {bookmark.notes && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-sm">
                <strong>Notes:</strong> {bookmark.notes}
              </div>
            )}
            {tags.length > 0 && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => startEdit(bookmark)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(bookmark.id)}
                className="px-3 py-1.5 text-sm text-white rounded-lg"
                style={{ backgroundColor: '#E8083E' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C70735'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8083E'}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* New Category Button */}
      <div className="flex gap-2">
        {showNewCategory ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            />
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName("");
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewCategory(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            + New Category
          </button>
        )}
      </div>

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div className="border rounded-xl hero-panel shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/50">
            <button
              onClick={() => toggleCategory(null)}
              className="flex-1 flex items-center justify-between"
            >
              <span className="font-medium text-lg text-slate-100">Uncategorized ({uncategorized.length})</span>
              <span className="text-2xl ml-2 text-slate-300">{expandedCategories.has(null) ? "−" : "+"}</span>
            </button>
          </div>
          {expandedCategories.has(null) && (
            <div className="p-4 space-y-3 border-t">{uncategorized.map(renderBookmark)}</div>
          )}
        </div>
      )}

      {/* Categorized */}
      {categorizedBookmarks.map(({ category, bookmarks: catBookmarks }) => (
        <div key={category.id} className="border rounded-xl hero-panel shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/50">
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex-1 flex items-center justify-between"
            >
              {editingCategory === category.id ? (
                <input
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
                  className="font-medium text-lg px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                  autoFocus
                />
              ) : (
                <span className="font-medium text-lg text-slate-100">
                  {category.name} ({catBookmarks.length})
                </span>
              )}
              <span className="text-2xl ml-2 text-slate-300">{expandedCategories.has(category.id) ? "−" : "+"}</span>
            </button>
            <div className="flex gap-2 ml-2">
              {editingCategory === category.id ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateCategory(category.id);
                    }}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(null);
                      setEditCategoryName("");
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100 text-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(category.id);
                      setEditCategoryName(category.name);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-sm border rounded hover:bg-gray-100 text-gray-700"
                    title="Edit category name"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-sm text-white rounded"
                    style={{ backgroundColor: '#E8083E' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C70735'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8083E'}
                    title="Delete category"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
          {expandedCategories.has(category.id) && catBookmarks.length > 0 && (
            <div className="p-4 space-y-3 border-t">{catBookmarks.map(renderBookmark)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
