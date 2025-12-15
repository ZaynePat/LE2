import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateURL, sanitizeURL } from "@/lib/urlValidator";

export async function GET() {
  try {
    const bookmarks = db
      .prepare("SELECT * FROM bookmarks ORDER BY created_at DESC")
      .all();
    return NextResponse.json({ bookmarks });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch bookmarks", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, threat, reporter, date_added, status, tags, notes, category_id } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    const validation = validateURL(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize and normalize URL
    const sanitizedUrl = sanitizeURL(url);

    // Check for duplicates (case-insensitive)
    const existing = db
      .prepare("SELECT id FROM bookmarks WHERE LOWER(url) = LOWER(?)")
      .get(sanitizedUrl);

    if (existing) {
      return NextResponse.json(
        { error: "This URL is already bookmarked" },
        { status: 409 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO bookmarks (url, threat, reporter, date_added, status, tags, notes, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sanitizedUrl,
      threat || null,
      reporter || null,
      date_added || null,
      status || null,
      tags ? JSON.stringify(tags) : null,
      notes || null,
      category_id || null
    );

    return NextResponse.json({
      message: "Bookmark saved",
      id: result.lastInsertRowid,
    });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "This URL is already bookmarked" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save bookmark", details: error.message },
      { status: 500 }
    );
  }
}
