const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"

export default {
  async redirects() {
    return [
      {
        source: '/templates',
        has: [{ type: 'query', key: 'tab', value: 'design' }],
        destination: '/templates?tab=smart',
        permanent: true,
      },
    ];
  },
  // existing config
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/templates/previews/:path*',
        destination: `${backendUrl}/templates/previews/:path*`,
      },
    ];
  },
};
