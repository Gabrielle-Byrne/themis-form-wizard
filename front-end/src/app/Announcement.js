// components/Announcement.js
"use client"

import { useState } from 'react';
import { X } from 'lucide-react';

const Announcement = ({ title, content, type = 'info' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Define styles based on announcement type
  const styles = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconBg: 'bg-blue-100'
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-100'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100'
    }
  };

  const currentStyle = styles[type] || styles.info;

  // Icons based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'error':
        return '⛔';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`${currentStyle.bgColor} ${currentStyle.borderColor} border rounded-lg p-3 relative`}>
      <div className="flex items-start">
        <div className={`${currentStyle.iconBg} ${currentStyle.textColor} rounded-full p-1 mr-3 flex-shrink-0`}>
          <span>{getIcon()}</span>
        </div>
        <div className="flex-grow">
          <h3 className={`font-semibold ${currentStyle.textColor}`}>{title}</h3>
          <p className="text-gray-700 text-sm">{content}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
          aria-label="Close announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Announcement;