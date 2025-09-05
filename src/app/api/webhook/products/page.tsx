import Image from "next/image";

export const revalidate = 300;

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN!;

interface ProductEdge {
  node: {
    id: string;
    title: string;
    handle: string;
    images: { edges: { node: { url: string; altText: string | null } }[] };
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  };
}

async function getProducts(): Promise<ProductEdge[]> {
  const query = `
    {
      products(first: 12) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) { edges { node { url altText } } }
            priceRange { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
  `;
  const response = await fetch(
    `https://${domain}/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      // Provide Next.js revalidation hint
      next: { revalidate: 300 },
    }
  );
  const { data } = await response.json();
  return data.products.edges;
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-accent-text">Danh sách sản phẩm</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((edge) => {
          const product = edge.node;
          const imageEdge = product.images.edges[0];
          const price = product.priceRange.minVariantPrice;
          return (
            <div key={product.id} className="rounded-lg p-4 accent-bg text-accent-text shadow-md">
              {imageEdge && (
                <div className="relative w-full h-60 mb-4">
                  <Image
                    src={imageEdge.node.url}
                    alt={imageEdge.node.altText ?? product.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              <h2 className="text-lg font-semibold mb-2">{product.title}</h2>
              <p className="text-sm mb-4">
                {price.amount} {price.currencyCode}
              </p>
              <a
                href={`https://${domain}/products/${product.handle}`}
                className="inline-block text-sm px-4 py-2 accent-text bg-accent-text text-white rounded hover:opacity-90"
              >
                Xem chi tiết
              </a>
            </div>
          );
        })}
      </div>
    </main>
  );
}
