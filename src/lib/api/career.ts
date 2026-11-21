/**
 * Career candidate account endpoints (cookie `mmm_candidate`). Payload shapes defined here are
 * the client side of the contract for /api/public/career/*:
 *
 *  POST register {fullName, email, phone, password} -> {ok, candidate: CandidateProfile}
 *  POST login    {email, password}                  -> {ok, candidate: CandidateProfile}
 *  POST logout   {}                                 -> {ok}
 *  GET  me                                          -> {ok, candidate: CandidateProfile, applications: CareerApplicationItem[]}
 *                                                      (401 when no candidate session)
 *  POST status   {query}                            -> {ok, applications: ApplicationStatusEntry[]}
 *                                                      (no-login tracker; status fields only)
 */
import { z } from 'zod';
import type { CareerApplicationItem } from '../../types/cms';
import { apiGet, apiPost, type ApiFailure, type ApiResult } from './client';

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface CandidateRegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface CandidateLoginRequest {
  email: string;
  password: string;
}

export interface CandidateAuthResponse {
  ok: true;
  candidate: CandidateProfile;
}

export interface CandidateMeResponse {
  ok: true;
  candidate: CandidateProfile;
  applications: CareerApplicationItem[];
}

const candidateSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().default(''),
});

const applicationSchema = z.looseObject({
  id: z.string().min(1),
  jobTitleBn: z.string(),
  status: z.string(),
  submittedAt: z.string(),
});

const authSchema = z.object({ candidate: candidateSchema });
const meSchema = z.object({ candidate: candidateSchema, applications: z.array(applicationSchema).default([]) });

const badShape = (status: number): ApiFailure => ({
  ok: false,
  status,
  code: 'BAD_RESPONSE',
  error: 'Unexpected response from the career service.',
});

function parseAuth(res: ApiResult<unknown>): ApiResult<CandidateAuthResponse> {
  if (!res.ok) return res;
  const parsed = authSchema.safeParse(res.data);
  if (!parsed.success) return badShape(res.status);
  return { ok: true, status: res.status, data: { ok: true, candidate: parsed.data.candidate } };
}

export async function registerCandidate(input: CandidateRegisterRequest): Promise<ApiResult<CandidateAuthResponse>> {
  return parseAuth(await apiPost<unknown>('/api/public/career/register', input));
}

export async function loginCandidate(input: CandidateLoginRequest): Promise<ApiResult<CandidateAuthResponse>> {
  return parseAuth(await apiPost<unknown>('/api/public/career/login', input));
}

export const logoutCandidate = (): Promise<ApiResult<{ ok: true }>> =>
  apiPost<{ ok: true }>('/api/public/career/logout');

export async function fetchCandidateMe(): Promise<ApiResult<CandidateMeResponse>> {
  const res = await apiGet<unknown>('/api/public/career/me');
  if (!res.ok) return res;
  const parsed = meSchema.safeParse(res.data);
  if (!parsed.success) return badShape(res.status);
  return {
    ok: true,
    status: res.status,
    data: {
      ok: true,
      candidate: parsed.data.candidate,
      applications: parsed.data.applications as unknown as CareerApplicationItem[],
    },
  };
}

/** No-login status tracker entry (POST /api/public/career/status {query} -> {ok, applications}). */
export interface ApplicationStatusEntry {
  id: string;
  applicantName: string;
  jobTitleBn: string;
  status: CareerApplicationItem['status'];
  submittedAt: string;
  hrNote?: string;
}

const statusEntrySchema = z.object({
  id: z.string().min(1),
  applicantName: z.string().catch(''),
  jobTitleBn: z.string().catch(''),
  status: z.string(),
  submittedAt: z.string().catch(''),
  hrNote: z.string().optional(),
});
const statusSchema = z.object({ applications: z.array(statusEntrySchema).default([]) });

export async function lookupApplicationStatus(query: string): Promise<ApiResult<{ applications: ApplicationStatusEntry[] }>> {
  const res = await apiPost<unknown>('/api/public/career/status', { query });
  if (!res.ok) return res;
  const parsed = statusSchema.safeParse(res.data);
  if (!parsed.success) return badShape(res.status);
  return {
    ok: true,
    status: res.status,
    data: { applications: parsed.data.applications as ApplicationStatusEntry[] },
  };
}
