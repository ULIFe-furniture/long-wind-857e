// ----- Edge runtime & dynamic -----
export const runtime   = 'edge';          // chạy trên Cloudflare Edge
export const dynamic   = 'force-dynamic'; // không prerender khi build
export const fetchCache = 'force-no-store'; // tắt cache build-time
// -----------------------------------

import React from 'react';

export default async function ProductsPage() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const url  = base ? `${base}/products` : '/api/products';

  let products: any[] = [];
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) products = await res.json();
  } catch {
    // giữ mảng rỗng để build không fail
  }

  return (
    <main>
      <h1>Products</h1>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </main>
  );
}
