/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
      },
      {
        protocol: "http",
        hostname: "cms",
        port: "1337",
      },
      {
        protocol: "https",
        hostname: "cms.novtecas.ru",
      },
    ],
  },
  async rewrites() {
    const strapiUrl =
      process.env.STRAPI_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_STRAPI_URL ||
      "http://localhost:1337";
    return [
      {
        source: "/uploads/:path*",
        destination: `${strapiUrl}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Company section
      { source: "/o-kompanii", destination: "/company/about", permanent: true },
      { source: "/o-kompanii/chernyy-spisok", destination: "/company/blacklist", permanent: true },
      { source: "/dokumenty", destination: "/company/documents", permanent: true },

      // Products
      { source: "/produkty", destination: "/products", permanent: true },
      { source: "/produkty/holodnyj-asfalt", destination: "/products", permanent: true },
      { source: "/produkty/holodnyj-asfalt/:path*", destination: "/products", permanent: true },
      { source: "/produkty/meshki-dlya-paketirovaniya-kholodnogo-asfalta", destination: "/products", permanent: true },
      { source: "/produkty/tyeplyy-asfalt-evotherm-3g", destination: "/products", permanent: true },
      { source: "/produkty/asfalt", destination: "/products", permanent: true },
      { source: "/prays", destination: "/products", permanent: true },
      { source: "/prays/:slug*", destination: "/products", permanent: true },

      // Portfolio (old: Projects)
      { source: "/proekty", destination: "/portfolio", permanent: true },
      { source: "/proekty/:slug*", destination: "/portfolio", permanent: true },

      // Dealers
      { source: "/dilery", destination: "/dealers", permanent: true },
      { source: "/maps", destination: "/dealers", permanent: true },

      // Media (old: News, Articles, Videos)
      { source: "/novosti", destination: "/media/news", permanent: true },
      { source: "/novosti/:slug*", destination: "/media/news", permanent: true },
      { source: "/stati", destination: "/media/articles", permanent: true },
      { source: "/stati/:slug*", destination: "/media/articles", permanent: true },
      { source: "/video", destination: "/media/videos", permanent: true },
      { source: "/video/:slug*", destination: "/media/videos", permanent: true },

      // Contacts
      { source: "/kontakty", destination: "/contacts", permanent: true },
      { source: "/obratnaya-svyaz", destination: "/contacts", permanent: true },

      // Privacy
      { source: "/politika-konfidentsialnosti", destination: "/privacy", permanent: true },

      // Misc
      { source: "/dostavka", destination: "/contacts", permanent: true },
      { source: "/karta-sayta", destination: "/", permanent: true },
      { source: "/zavody-i-oborudovanie", destination: "/products", permanent: true },
      { source: "/zavody-i-oborudovanie/:path*", destination: "/products", permanent: true },
    ];
  },
};

export default nextConfig;
