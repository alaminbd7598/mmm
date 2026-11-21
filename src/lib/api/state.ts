/** Typed calls for state reads and writes: /api/state, /api/state/meta, /api/admin/sync, /api/public/submit. */
import type {
  PublicSubmitRequest,
  PublicSubmitResponse,
  StateMetaResponse,
  StateResponse,
  SyncOp,
  SyncRequest,
  SyncResponse,
} from '../../server/contracts';
import { apiGet, apiPostKeepalive, type ApiResult } from './client';

export const fetchState = (signal?: AbortSignal): Promise<ApiResult<StateResponse>> =>
  apiGet<StateResponse>('/api/state', signal);

export const fetchStateMeta = (signal?: AbortSignal): Promise<ApiResult<StateMetaResponse>> =>
  apiGet<StateMetaResponse>('/api/state/meta', signal);

export const postAdminSync = (baseVersion: number, ops: SyncOp[]): Promise<ApiResult<SyncResponse>> =>
  apiPostKeepalive<SyncResponse>('/api/admin/sync', { baseVersion, ops } satisfies SyncRequest);

export const postPublicSubmit = (items: PublicSubmitRequest['items']): Promise<ApiResult<PublicSubmitResponse>> =>
  apiPostKeepalive<PublicSubmitResponse>('/api/public/submit', { items } satisfies PublicSubmitRequest);

/**
 * Upper bound for one sync request body. The server's admin sync limit is 12 MB; staying well
 * below it leaves room for the request envelope and multi-byte text.
 */
export const MAX_SYNC_REQUEST_BYTES = 8 * 1024 * 1024;
