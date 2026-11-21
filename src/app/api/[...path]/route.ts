import { jsonError } from '@/src/server/http';

/** Unknown /api paths answer 404 JSON instead of falling through to the website shell. */
const notFound = () => jsonError(404, 'API route not found.', 'NOT_FOUND');

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };
