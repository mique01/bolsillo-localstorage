'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold mb-4">404 - Página no encontrada</h1>
        <p className="text-lg text-gray-400 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Link 
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
} 