export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
