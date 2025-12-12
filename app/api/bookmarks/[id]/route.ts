import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stmt = db.prepare("DELETE FROM bookmarks WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bookmark deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete bookmark", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { url, threat, reporter, date_added, status, tags, notes, category_id } = body;

    const stmt = db.prepare(`
      UPDATE bookmarks 
      SET url = ?, threat = ?, reporter = ?, date_added = ?, status = ?, tags = ?, notes = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      url,
      threat || null,
      reporter || null,
      date_added || null,
      status || null,
      tags ? JSON.stringify(tags) : null,
      notes || null,
      category_id || null,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bookmark updated" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update bookmark", details: error.message },
      { status: 500 }
    );
  }
}
