"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

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
        setOpen(false);
        setTimeout(() => {
          setSaved(false);
          setSelectedCategory("");
        }, 2000);
      } else {
        const data = await res.json();
        const errorMessage = data.error || "Failed to save bookmark";
        alert(errorMessage);
      }
    } catch (error) {
      alert("Error saving bookmark");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={saved ? "default" : "default"}
          size="sm"
          disabled={saving || saved}
          className={cn(
            saved && "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          {saved ? (
            <>
              <BookmarkCheck className="size-4" />
              Saved
            </>
          ) : saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Bookmark className="size-4" />
              Bookmark
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Category</DialogTitle>
          <DialogDescription>
            Choose a category for this bookmark, or leave it uncategorized.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <input
              type="radio"
              name="category"
              value=""
              checked={selectedCategory === ""}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="size-4"
            />
            <span className="text-sm font-medium">No category (Uncategorized)</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="category"
                value={cat.id}
                checked={selectedCategory === String(cat.id)}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="size-4"
              />
              <span className="text-sm font-medium">{cat.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave(selectedCategory || undefined)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
