/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...các config khác của bạn...

  async redirects() {
    return [
      {
        source: '/',                    // đường dẫn gốc trước đây
        destination: 'https://beta.noithatgotunhien-ulife.com',
        permanent: true,                // 308 – SEO tốt
      },
      {
        source: '/:path*',              // redirect mọi slug còn lại
        destination: 'https://beta.noithatgotunhien-ulife.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
