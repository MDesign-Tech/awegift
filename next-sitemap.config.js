/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://awegift.vercel.app", // Your production domain
  generateRobotsTxt: true, // Generate robots.txt file
  sitemapSize: 7000, // Maximum number of URLs per sitemap file
  changefreq: "daily", // Default change frequency for pages
  priority: 0.7, // Default priority for pages
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/*", "/account/*", "/cart", "/checkout"], // Disallow private or admin routes
      },
    ],
  },
  transform: async (config, path) => {
    return {
      loc: path, // URL path
      changefreq: config.changefreq,
      priority: path === "/" ? 1.0 : config.priority, // Higher priority for homepage
      lastmod: new Date().toISOString(), // Last modified date
      alternateRefs: [], // Add alternate language references if needed
    };
  },
};

module.exports = config;
