"use client";

import { useState, useEffect } from "react";

interface SaveButtonProps {
  url: string;
  threat?: string;
  reporter?: string;
  date_added?: string;
  url_status?: string;
  tags?: string[];
}

export default function SaveButton({ url, threat, reporter, date_added, url_status, tags }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleSave = async (categoryId?: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          threat,
          reporter,
          date_added,
          status: url_status,
          tags,
          category_id: categoryId || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setShowCategoryModal(false);
        setTimeout(() => setSaved(false), 2000);
      } else if (res.status === 409) {
        alert("URL already bookmarked");
      } else {
        alert("Failed to save bookmark");
      }
    } catch (error) {
      alert("Error saving bookmark");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowCategoryModal(true)}
        disabled={saving || saved}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          saved
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        }`}
      >
        {saved ? "✓ Saved" : saving ? "Saving..." : "Bookmark"}
      </button>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-gray-900">Save to Category</h3>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={selectedCategory === ""}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
                <span className="text-gray-700">No category (Uncategorized)</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={selectedCategory === String(cat.id)}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  <span className="text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(selectedCategory || undefined)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
