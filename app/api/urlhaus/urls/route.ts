import { NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rateLimiter';

export const revalidate = 300;

// 10 requests per minute per IP
const limiter = rateLimit({ maxRequests: 10, windowMs: 60000 });

export async function GET(request: Request) {
  // Check rate limit
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetTime } = limiter.check(clientIP);

  if (!allowed) {
    const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${waitSeconds} seconds.` },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': waitSeconds.toString(),
        },
      }
    );
  }

  const authKey = process.env.URLHAUS_AUTH_KEY;
  if (!authKey) {
    return NextResponse.json({ error: 'Missing URLHAUS_AUTH_KEY' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? Math.min(1000, Math.max(1, limitParam)) : 100;

  const upstream = `https://urlhaus-api.abuse.ch/v1/urls/recent/limit/${limit}/`;

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
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
    },
  });
}
