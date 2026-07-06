import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return {
    title: `فیلم - زینگو`,
    description: `دانلود فیلم با لینک مستقیم و زیرنویس فارسی از زینگو`,
    openGraph: {
      title: 'زینگو - دانلود فیلم',
      description: 'دانلود رایگان فیلم و سریال',
      type: 'video.movie',
      siteName: 'زینگو',
    },
  };
}
