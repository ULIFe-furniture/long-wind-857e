export const runtime = 'edge';

// Dữ liệu sản phẩm mẫu cho ULIFe Furniture.
// Khi tích hợp Shopify thật, thay phần này bằng lệnh gọi Storefront/Admin API.
const PRODUCTS = [
  {
    id: 1,
    name: 'Bàn cà phê gỗ thông',
    price: 1850000,
    description: 'Bàn cà phê gỗ thông tự nhiên, phù hợp quán cà phê và phòng khách.',
    image: '/hero.jpg',
  },
  {
    id: 2,
    name: 'Ghế ăn tựa lưng',
    price: 690000,
    description: 'Ghế gỗ thông chắc chắn, tựa lưng thoải mái, dễ phối nội thất.',
    image: '/hero.jpg',
  },
  {
    id: 3,
    name: 'Kệ sách 4 tầng',
    price: 1290000,
    description: 'Kệ sách gỗ thông 4 tầng, tối ưu không gian lưu trữ.',
    image: '/hero.jpg',
  },
  {
    id: 4,
    name: 'Bàn làm việc tùy biến',
    price: 2450000,
    description: 'Bàn làm việc kích thước tùy chỉnh theo yêu cầu khách hàng.',
    image: '/hero.jpg',
  },
];

export async function GET() {
  return Response.json(PRODUCTS);
}
