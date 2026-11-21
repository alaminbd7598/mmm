/**
 * Maps each CollectionKey to its Prisma table (docs/ARCHITECTURE.md "Prisma schema").
 * All collection tables share the shape {id, position, data, ...indexed columns}; this module exposes
 * the handful of delegate methods the store needs behind one structural type so the store can treat
 * every table uniformly. `scope` narrows the generic CollectionItem table to one collection.
 */
import type { CollectionKey } from '../contracts';
import type { Prisma } from '../../generated/prisma/client';

export type Tx = Prisma.TransactionClient;

export interface CollectionRow {
  id: string;
  position: number;
  data: string;
  version?: number;
  passwordHash?: string | null;
  mustChangePassword?: boolean;
  sessionVersion?: number;
}

type Where = Record<string, unknown>;
type Data = Record<string, unknown>;
type OrderBy = Array<Record<string, 'asc' | 'desc'>>;
type Select = Record<string, true>;

/** The subset of a Prisma model delegate used by PrismaStore (identical across collection tables). */
export interface RowDelegate {
  findMany(args: { where?: Where; orderBy?: OrderBy; select?: Select }): Promise<CollectionRow[]>;
  findFirst(args: { where: Where; select?: Select }): Promise<CollectionRow | null>;
  aggregate(args: { where?: Where; _max: { position: true } }): Promise<{ _max: { position: number | null } }>;
  create(args: { data: Data }): Promise<unknown>;
  createMany(args: { data: Data[] }): Promise<{ count: number }>;
  updateMany(args: { where: Where; data: Data }): Promise<{ count: number }>;
  deleteMany(args: { where?: Where }): Promise<{ count: number }>;
}

export interface CollectionTable {
  delegate(tx: Tx): RowDelegate;
  /** Extra where/create fields (only the generic CollectionItem table uses one). */
  scope: Record<string, string>;
}

const table = (pick: (tx: Tx) => unknown): CollectionTable => ({
  delegate: (tx) => pick(tx) as RowDelegate,
  scope: {},
});

const generic = (collection: CollectionKey): CollectionTable => ({
  delegate: (tx) => tx.collectionItem as unknown as RowDelegate,
  scope: { collection },
});

export const COLLECTION_TABLES: Record<CollectionKey, CollectionTable> = {
  news: table((tx) => tx.newsItem),
  notices: table((tx) => tx.notice),
  courses: table((tx) => tx.course),
  events: table((tx) => tx.event),
  leads: table((tx) => tx.admissionLead),
  users: table((tx) => tx.user),
  emails: table((tx) => tx.emailLog),
  departmentVideos: generic('departmentVideos'),
  activityVideos: generic('activityVideos'),
  guardianReels: generic('guardianReels'),
  photoGallery: table((tx) => tx.galleryItem),
  complaints: table((tx) => tx.complaint),
  leaveRequests: table((tx) => tx.teacherLeave),
  careerJobs: table((tx) => tx.careerJob),
  careerApplications: table((tx) => tx.careerApplication),
  careerCandidates: table((tx) => tx.careerCandidate),
  admissionTokens2027: table((tx) => tx.admissionToken),
  blogPosts: table((tx) => tx.blogPost),
  calendarEvents: table((tx) => tx.calendarEvent),
  virtualOfficeSessions: table((tx) => tx.virtualOfficeSession),
};

export const POSITION_ORDER: OrderBy = [{ position: 'asc' }, { id: 'asc' }];
