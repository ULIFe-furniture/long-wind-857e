export const runtime = 'edge';

export async function GET() {
  // stub data để build không fail
  return Response.json([
    { id: 1, name: 'Sample product', price: 240000 }
  ]);
}
