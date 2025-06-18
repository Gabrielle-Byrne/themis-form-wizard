"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import defaultLogo from './legallogo.jpg'; // Keep as fallback

const HomeHeader = () => {
  const [logoSrc, setLogoSrc] = useState(defaultLogo);
  const [isCustomLogo, setIsCustomLogo] = useState(false);
  // Add a timestamp state to force re-render when we need it
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    // Fetch the content data to get the logo URL
    const fetchLogoUrl = async () => {
      try {
        // Add cache busting to the content fetch
        const response = await fetch('/api/content', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.clinicInfo?.logoUrl) {
            // Either use this to fix the URL directly:
            // setLogoSrc('https://hrslupcbk4ltavbb.public.blob.vercel-storage.com/logo.jpg');
            
            // Or use the URL from the content but with forced cache busting:
            setLogoSrc(`${data.clinicInfo.logoUrl}?t=${Date.now()}`);
            
            setIsCustomLogo(true);
            
            // Update timestamp to force re-render
            setTimestamp(Date.now());
          }
        }
      } catch (error) {
        console.error('Error fetching logo URL:', error);
        // Keep using the default logo in case of error
      }
    };

    fetchLogoUrl();
  }, []);

  return (
    <header className="bg-white relative">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 w-full"></div>
      
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-6">
          {/* Logo - Keeping original styling */}
          <div className="mb-2">
            {isCustomLogo ? (
              // For dynamically loaded logo from Vercel Blob
              <Image 
                src={logoSrc}
                alt="Legal Clinic Logo" 
                width={400}
                height={400}
                className="object-contain"
                priority
                unoptimized={true} // This is crucial - bypasses Next.js image optimization
                key={timestamp} // Force rerender when timestamp changes
              />
            ) : (
              // For the imported default logo
              <Image 
                src={logoSrc}
                alt="Legal Clinic Logo" 
                width={400}
                height={400}
                className="object-contain"
                priority
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;