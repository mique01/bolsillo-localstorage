import ComprobanteDetailClient from './ComprobanteDetail';

// This function is needed for static site generation
export async function generateStaticParams() {
  // For static site generation, we provide default parameters
  // In a real app with actual data, you would return all possible IDs
  return [
    { id: 'placeholder' },
    { id: 'example1' },
    { id: 'example2' }
  ];
}

export default function ComprobanteDetailPage({ params }: { params: { id: string } }) {
  return <ComprobanteDetailClient params={params} />;
} 