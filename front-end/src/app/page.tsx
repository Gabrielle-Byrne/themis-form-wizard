// import HomeHeader from './components/Home';
"use client"

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import tclogo from './components/tclogo.png';
import Image from 'next/image';
import FormWizard from './components/FormWizard';
import HomeHeader from './components/Home';
import AdditionalResources from './components/AdditionalResources';

// Important: Make sure these imports match your actual file structure
// If you don't have this file, remove or replace this import
import resourceData from "./lib/additional.json";

// Added for announcements display
const Announcement = ({ title, content, type = 'info' }) => {
  const styles = {
    info: 'bg-blue-100 border-blue-300 text-blue-800',
    success: 'bg-green-100 border-green-300 text-green-800',
    warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    error: 'bg-red-100 border-red-300 text-red-800'
  };

  return (
    <div className={`${styles[type]} border rounded-md p-3 mb-2`}>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm">{content}</p>
    </div>
  );
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[500px]">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
);

const TabButton = ({ tab, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: isActive ? 1 : 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      flex items-center gap-2
      px-6 py-3
      rounded-lg
      font-medium
      transition-all duration-300
      ${isActive 
        ? 'bg-white text-blue-700 shadow-lg border border-blue-100' 
        : 'text-blue-600 hover:bg-white/70'
      }
    `}
  >
    <span className="text-lg">{tab.icon}</span>
    <span>{tab.label}</span>
  </motion.button>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch content from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        setContent(data);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Define tab items (adjust component references as needed)
  const tabItems = [
    {
      id: 0,
      label: "Home",
      icon: "🏠",
      description: "Welcome to our clinic",
      component: () => (
        <div className="space-y-6">
          {/* About section */}
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-blue-800 mb-3">About Us</h2>
            <div className="text-gray-700">{content?.clinicInfo?.aboutText || "Information not available."}</div>
          </div>
          
          {/* Services section */}
          <div>
            <h2 className="text-xl font-bold text-blue-800 mb-3">Our Services</h2>
            {content?.clinicInfo?.services && content.clinicInfo.services.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {content.clinicInfo.services.map((service, index) => (
                  <li key={index} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    {service}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No services listed at this time.</p>
            )}
          </div>
          
          {/* Contact information */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-blue-800 mb-3">Contact Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p>{content?.clinicInfo?.contactInfo?.address || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p>{content?.clinicInfo?.contactInfo?.phone || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{content?.clinicInfo?.contactInfo?.email || "Not available"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hours</p>
                <p>{content?.clinicInfo?.contactInfo?.hours || "Not available"}</p>
              </div>
            </div>
          </div>

           {/* Display active announcements */}
      {content?.announcements && content.announcements.length > 0 && (
        <div className="bg-gray-50 py-2">
          <h2 className="text-xl font-bold text-blue-800 mb-3 px-3">Announcements</h2>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="space-y-2">
              {content.announcements
                .filter(announcement => announcement.active)
                .map(announcement => (
                  <Announcement 
                    key={announcement.id} 
                    title={announcement.title}
                    content={announcement.content}
                    type={announcement.type}
                  />
                ))
              }
            </div>
          </div>
        </div>
      )}
          
          {/* Calendly integration */}
          {content?.clinicInfo?.calendlyLink && (
            <div className="mt-4">
              <a 
                href={content.clinicInfo.calendlyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Schedule an Appointment
              </a>
            </div>
          )}
        </div>
      )
    },
    {
      id: 1,
      label: "Intake Form",
      icon: "📝",
      description: "Check if you qualify for our services",
      component: () => <FormWizard />
    },
    {
      id: 2,
      label: "Resources",
      icon: "📚",
      description: "Access helpful legal resources",
      component: () => <AdditionalResources resources={resourceData} />
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Pass the logo URL to HomeHeader */}
      <HomeHeader />
      
      
      <div className="container mx-auto px-4 py-2 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex flex-col items-center mb-6">
              <div className="inline-flex rounded-xl bg-blue-50 p-1.5 gap-1 shadow-sm">
                {tabItems.map((tab) => (
                  <TabButton
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </div>
              {/* <p className="text-gray-600 text-sm">
                {tabItems[activeTab].description}
              </p> */}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[500px]"
              >
                <Suspense fallback={<LoadingFallback />}>
                  {loading && activeTab === 0 ? (
                    <div className="flex items-center justify-center min-h-[500px]">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-2" />
                      <span>Loading clinic information...</span>
                    </div>
                  ) : error && activeTab === 0 ? (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                      <p className="text-red-700">
                        Error loading clinic information: {error}
                      </p>
                      <p className="text-gray-600 mt-2">
                        Please try again later or contact support.
                      </p>
                    </div>
                  ) : (
                    tabItems[activeTab].component()
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center mt-8 text-blue-600 pb-8">
          <p className="text-sm">
            <a href="https://www.unb.ca/fredericton/law/services/legalclinic.html">
            © {new Date().getFullYear()} {content?.clinicInfo?.name || "Legal Clinic Services"}
            </a>
            <span className="flex items-center justify-center">
              <span className="mr-2 text-gray-900">Developed by</span>
              <a href="https://themiscore.com">
              <Image 
                src={tclogo}
                alt="TC Logo" 
                width={110}
                height={110}
                className="object-contain"
                priority
              />
            </a>
            </span>
          </p>
          {content?.lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(content.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}