// ----- Edge runtime & dynamic -----
export const runtime    = 'edge';          // chạy trên Cloudflare Edge
export const dynamic    = 'force-dynamic'; // không prerender khi build
export const fetchCache = 'force-no-store'; // tắt cache build-time
// -----------------------------------

import React from 'react';
import Image from 'next/image';
import { headers } from 'next/headers';

type Product = {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
};

// Định dạng giá theo tiền tệ Việt Nam.
function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

// Dựng URL tuyệt đối: server component không fetch được URL tương đối.
function resolveApiUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/products`;

  const h = headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}/api/products`;
}

export default async function ProductsPage() {
  let products: Product[] = [];
  try {
    const res = await fetch(resolveApiUrl(), { cache: 'no-store' });
    if (res.ok) products = await res.json();
  } catch {
    // giữ mảng rỗng để build không fail
  }

  return (
    <main className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold text-center mb-2">Sản phẩm</h1>
      <p className="text-center mb-10">
        Đồ gỗ thông tự nhiên, thiết kế tùy biến cho không gian của bạn.
      </p>

      {products.length === 0 ? (
        <p className="text-center">Hiện chưa có sản phẩm để hiển thị.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded overflow-hidden shadow accent-bg flex flex-col"
            >
              <div className="relative w-full h-48">
                <Image
                  src={product.image ?? '/hero.jpg'}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
                {product.description && (
                  <p className="text-sm mb-4 flex-1">{product.description}</p>
                )}
                <p className="font-bold">{formatPrice(product.price)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
