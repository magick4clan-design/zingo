export default function robots() {
  return {
    rules: [
      {
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      : 'http://localhost:3000/sitemap.xml',
  };
}
