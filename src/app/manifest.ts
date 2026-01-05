import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Business Operations Diagnostic',
    short_name: 'Ops Diagnostic',
    description: 'Discover your real operational chaos score',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
