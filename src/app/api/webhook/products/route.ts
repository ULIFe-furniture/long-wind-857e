import { NextRequest } from 'next/server';

export const runtime = 'edge';          // Cloudflare Pages Edge

const SHOP  = process.env.SHOPIFY_SHOP!;      // ulife.myshopify.com
const TOKEN = process.env.SHOPIFY_API_PWD!;   // Admin API access token

export async function GET(_: NextRequest) {
  const url =
    `https://${SHOP}/admin/api/2024-07/products.json?fields=id,title`;

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json'
    },
    // cache 5 phút trên Cloudflare
    next: { revalidate: 300 }
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `Shopify status ${res.status}` }),
      { status: 502 }
    );
  }

  return Response.json(await res.json());
}
