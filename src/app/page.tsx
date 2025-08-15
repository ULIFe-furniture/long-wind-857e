import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex flex-col items-center text-center">
      {/* Hero Section */}
      <section className="relative w-full h-96 flex items-center justify-center overflow-hidden">
        <Image src="/hero.jpg" alt="Hero" fill style={{ objectFit: 'cover' }} priority />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-accent-text mb-4">ULife Furniture</h1>
          <p className="text-lg md:text-xl text-accent-text">Gỗ thông tự nhiên & thiết kế tùy biến cho không gian của bạn</p>
        </div>
      </section>
      {/* Why Choose Us */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">Vì sao chọn chúng tôi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-accent-bg rounded shadow">
            <h3 className="text-xl font-semibold mb-2">Chất lượng vượt trội</h3>
            <p className="text-accent-text">Sử dụng gỗ thông tự nhiên, xử lý kỹ lưỡng, bền bỉ với thời gian.</p>
          </div>
          <div className="p-6 bg-accent-bg rounded shadow">
            <h3 className="text-xl font-semibold mb-2">Tùy biến linh hoạt</h3>
            <p className="text-accent-text">
              Thiết kế theo yêu cầu, phù hợp mọi không gian quán cà phê, nhà hàng.
            </p>
          </div>
          <div className="p-6 bg-accent-bg rounded shadow">
            <h3 className="text-xl font-semibold mb-2">Giá thành hợp lý</h3>
            <p className="text-accent-text">Tối ưu quy trình sản xuất, mang đến mức giá cạnh tranh nhất.</p>
          </div>
        </div>
      </section>
      {/* About Us */}
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">Giới thiệu về chúng tôi</h2>
        <p className="text-center text-accent-text">
          ULife là xưởng nội thất chuyên đồ gỗ thông tự nhiên với kinh nghiệm nhiều năm trong lĩnh vực thiết kế và thi công. Chúng tôi mang đến những sản phẩm chất lượng, thẩm mỹ và thân thiện với môi trường.
        </p>
      </section>
      {/* Contact Section */}
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">Liên hệ</h2>
        <p className="text-center text-accent-text mb-4">
          Hãy liên hệ với chúng tôi để được tư vấn và báo giá nhanh nhất.
        </p>
        <div className="flex justify-center">
          <a
            href="https://zalo.me/123456789"
            className="px-6 py-3 bg-accent-bg text-accent-text rounded shadow hover:bg-accent-text hover:text-white transition"
          >
            Chat qua Zalo
          </a>
        </div>
      </section>
    </main>
  );
}
