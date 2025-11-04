import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || "";
    const parsed = url ? new URL(url) : null;

    
    const runtime = await query(
      "select current_database() as db, current_user as user"
    );

    const counts = await query(
      "select \
         (select count(*) from farms) as farms, \
         (select count(*) from products) as products, \
         (select count(*) from premade_packages) as premade_packages"
    );

    return NextResponse.json({
      envHost: parsed ? parsed.host : null,
      envDb: parsed ? parsed.pathname : null,
      runtime: runtime.rows?.[0] ?? null,
      counts: counts.rows?.[0] ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch DB info" },
      { status: 500 }
    );
  }
}


