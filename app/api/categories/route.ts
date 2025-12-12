import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const categories = db
      .prepare("SELECT * FROM categories ORDER BY created_at DESC")
      .all();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const stmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
    const result = stmt.run(name.trim());

    return NextResponse.json({
      message: "Category created",
      id: result.lastInsertRowid,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create category", details: error.message },
      { status: 500 }
    );
  }
}
