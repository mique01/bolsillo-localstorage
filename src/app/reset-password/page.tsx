'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [message, setMessage] = useState('');
  
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('In this simplified version, password reset is not needed since we only use username authentication. Please login with your username.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Recovery
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Return to login
            </Link>
          </p>
        </div>
        
        {message ? (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-blue-700">{message}</div>
            <div className="mt-4">
              <Link 
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <p className="text-center text-sm text-gray-600">
              In this simplified version, just enter any username to sign in.
              <br />
              No password is required.
            </p>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 