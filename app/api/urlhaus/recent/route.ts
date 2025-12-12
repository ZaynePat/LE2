import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET(request: Request) {
  const authKey = process.env.URLHAUS_AUTH_KEY;
  if (!authKey) {
    return NextResponse.json({ error: 'Missing URLHAUS_AUTH_KEY' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? Math.min(1000, Math.max(1, limitParam)) : 100;

  const upstream = `https://urlhaus-api.abuse.ch/v1/payloads/recent/limit/${limit}/`;

  const res = await fetch(upstream, {
    headers: {
      'Auth-Key': authKey,
      'Accept': 'application/json',
    },
    // Cache at Next server layer
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Upstream failed', status: res.status },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
