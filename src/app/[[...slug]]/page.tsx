import type { Metadata } from 'next';
import ClientApp from '../ClientApp';
import { metadataForPath } from '../seo';

type Props = { params: Promise<{ slug?: string[] }> };

function pathFromSlug(slug?: string[]): string {
  return slug && slug.length > 0 ? `/${slug.join('/')}` : '/';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return metadataForPath(pathFromSlug(slug));
}

export default function Page() {
  return <ClientApp />;
}
