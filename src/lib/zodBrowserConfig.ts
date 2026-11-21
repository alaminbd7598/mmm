/**
 * Imported first by src/App.tsx. The site's Content-Security-Policy forbids eval, so zod is told
 * not to probe for it (it would otherwise try `new Function` once and report a CSP violation).
 */
import { z } from 'zod';

z.config({ jitless: true });
