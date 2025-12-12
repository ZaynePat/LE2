This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Browse URLhaus Data**: View recent malicious URLs from the URLhaus API
- **Bookmark System**: Save URLs to a local SQLite database
- **Categories**: Organize bookmarks into custom categories with collapsible cards
- **Search**: Filter URLs by threat type, reporter, or URL pattern
- **Pagination**: Browse data with 5 items per page

## Dependencies

### Required
- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**

### NPM Packages
```json
{
  "next": "16.0.10",
  "react": "19.2.1",
  "react-dom": "19.2.1",
  "better-sqlite3": "^12.5.0",
  "@types/better-sqlite3": "^7.6.13",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### External Services
- **URLhaus API**: Requires a free Auth-Key from [URLhaus](https://urlhaus.abuse.ch/)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## URLhaus Integration

- Set your URLhaus Auth-Key in `.env.local`:

```
URLHAUS_AUTH_KEY=YOUR-AUTH-KEY-HERE
```

- The proxy route is at `/api/urlhaus/recent` and forwards to `https://urlhaus-api.abuse.ch/v1/payloads/recent/` with the required `Auth-Key` header.
- The homepage renders the most recent items using server-side fetch with caching.

### Optional base path
If you deploy behind a base path, set:

```
NEXT_PUBLIC_BASE_PATH=/your-base-path
```

## Try it locally

1. Create `.env.local` with `URLHAUS_AUTH_KEY`.
2. Install deps and run:

```
npm install
npm run dev
```

Open http://localhost:3000 to view recent payloads.
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
