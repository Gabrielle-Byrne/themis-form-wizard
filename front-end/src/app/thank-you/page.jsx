"use client"
import React from 'react';
import { CheckCircle, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Thank You
          </h1>
          
          <p className="mt-4 text-gray-600">
            Your application has been successfully submitted. Our team will review your
            information and contact you within 2-3 business days.
          </p>

          <div className="mt-8 space-y-3">
            <Link 
              href="/"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm 
                font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
            
            {/* <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm 
                font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Submit Another Application
            </Link> */}
          </div>

          <p className="mt-6 text-sm text-gray-500">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}