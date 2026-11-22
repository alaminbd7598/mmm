import type { generateHafizCertificatePdf as GenerateHafizCertificatePdf } from './certificatePdf';

/**
 * Same call as `generateHafizCertificatePdf`, but the PDF and QR libraries are downloaded only
 * when a visitor actually asks for a certificate, so public pages do not carry them.
 */
export const generateHafizCertificatePdf: typeof GenerateHafizCertificatePdf = async (opts) => {
  const { generateHafizCertificatePdf: generate } = await import('./certificatePdf');
  return generate(opts);
};
