// This is a server component that can export generateStaticParams
import ComprobanteDetailPage from './page';

export async function generateStaticParams() {
  // For static site generation, we provide a default parameter
  // In a real app with actual data, you would return all possible IDs
  return [{ id: 'placeholder' }];
}

export default function ComprobanteDetailWrapper({ params }: { params: { id: string } }) {
  return <ComprobanteDetailPage />;
} 