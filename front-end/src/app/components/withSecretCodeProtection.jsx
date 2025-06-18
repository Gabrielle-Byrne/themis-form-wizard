"use client"
import React, { useState, useEffect } from 'react';
import { Lock, Key, Eye, EyeOff, Shield, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * withSecretCodeProtection - A Higher Order Component (HOC) that adds 
 * secret code access protection to any component
 * 
 * @param {React.Component} WrappedComponent - The component to protect
 * @param {Object} options - Configuration options
 * @returns {React.Component} - Protected component
 */
const withSecretCodeProtection = (
  WrappedComponent,
  options = {}
) => {
  // Default options that can be overridden
  const {
    secretCode = 'LegalAccess2025',
    maxAttempts = 5,
    lockTime = 60,
    storageKey = 'secretCodeAuthenticated',
    title = 'Restricted Access',
    description = 'Please enter the secret code to access this page',
    showLogoutButton = true,
  } = options;

  // Return the protected component
  return function ProtectedComponent(props) {
    // Authentication states
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimer, setLockTimer] = useState(0);

    // Check if user was previously authenticated (session storage)
    useEffect(() => {
      const storedAuth = sessionStorage.getItem(storageKey);
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }, [storageKey]);

    // Handle lock timer countdown
    useEffect(() => {
      let interval;
      if (isLocked && lockTimer > 0) {
        interval = setInterval(() => {
          setLockTimer(prevTime => prevTime - 1);
        }, 1000);
      } else if (lockTimer === 0 && isLocked) {
        setIsLocked(false);
      }

      return () => clearInterval(interval);
    }, [isLocked, lockTimer]);

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (isLocked) return;

      if (inputCode === secretCode) {
        setIsAuthenticated(true);
        setError('');
        // Store authentication state in session storage
        sessionStorage.setItem(storageKey, 'true');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError('Invalid secret code. Please try again.');
        
        // Lock the form after maxAttempts
        if (newAttempts >= maxAttempts) {
          setIsLocked(true);
          setLockTimer(lockTime);
          setError(`Too many failed attempts. Access locked for ${lockTime} seconds.`);
        }
      }
    };

    const handleLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem(storageKey);
    };

    // If authenticated, show the wrapped component with optional logout button
    if (isAuthenticated) {
      return (
        <>
          {showLogoutButton && (
            <div className="max-w-6xl mx-auto p-6">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  <Lock size={16} /> Logout
                </button>
              </div>
            </div>
          )}
          <WrappedComponent {...props} />
        </>
      );
    }

    // Otherwise, show the login form
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="secretCode" className="block text-sm font-medium text-gray-700 mb-2">
                Secret Code
              </label>
              <div className="relative">
                <input
                  id="secretCode"
                  name="secretCode"
                  type={showCode ? "text" : "password"}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  disabled={isLocked}
                  className="w-full pr-10 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter secret code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLocked}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLocked ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLocked ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" /> 
                    Locked ({lockTimer}s)
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Access Page
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>This page contains sensitive information.</p>
            <p>Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    );
  };
};

export default withSecretCodeProtection;