/** Typed store errors so route handlers can map them to HTTP statuses (404 / 409 / 503). */

export class StoreNotFoundError extends Error {
  readonly code = 'NOT_FOUND';
}

/** A write would violate a unique index (e.g. two users with the same username). */
export class StoreConflictError extends Error {
  readonly code = 'CONFLICT';
}

/** The database is unreachable or its schema has not been created (`npm run db:push`). */
export class StoreUnavailableError extends Error {
  readonly code = 'STORE_UNAVAILABLE';
}
