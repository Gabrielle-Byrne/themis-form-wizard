"use client"
// Import global styles - add this line
import '@/app/globals.css'; // This ensures Tailwind styles are loaded
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEditor() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  // Static secret code for now - in production, use an environment variable
  const secretCode = 'your-secret-code-here';
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Tab state for editor sections
  const [activeTab, setActiveTab] = useState('general');
  
  // State for new announcement
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    active: true
  });

  useEffect(() => {
    // Fetch the content when authenticated
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content', {
          cache: 'no-store', // Tell fetch not to use cached response
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
        const data = await response.json();
        setContent(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading content:', error);
        setMessage('Error loading content: ' + error.message);
        setLoading(false);
      }
    };
    
    if (authenticated) {
      fetchContent();
    }
  }, [authenticated]);

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (enteredCode === secretCode) {
      setAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Invalid code');
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          secretCode // Send the secret code to verify the request
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error saving content');
      }
      
      setMessage('Content saved successfully!');
    } catch (error) {
      setMessage('Error saving content: ' + error.message);
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      setMessage('Title and content are required for announcements');
      return;
    }
    
    const announcement = {
      ...newAnnouncement,
      id: Date.now().toString(), // Simple unique ID
    };
    
    // Initialize announcements array if it doesn't exist
    if (!content.announcements) {
      content.announcements = [];
    }
    
    setContent({
      ...content,
      announcements: [...content.announcements, announcement]
    });
    
    // Reset the form
    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      active: true
    });
    
    setMessage('Announcement added. Remember to save changes!');
  };

  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setContent({
        ...content,
        announcements: content.announcements.filter(a => a.id !== id)
      });
      setMessage('Announcement deleted. Remember to save changes!');
    }
  };

  // Updated toggle function with immediate server update
  // Replace your existing handleToggleAnnouncementActive function with this:
// Replace your handleToggleAnnouncementActive function with this:
const handleToggleAnnouncementActive = async (id) => {
  // Find the current announcement
  const announcement = content.announcements.find(a => a.id === id);
  if (!announcement) return;

  // Get the new status (opposite of current)
  const newActiveStatus = !announcement.active;
  
  // Update UI optimistically 
  setContent({
    ...content,
    announcements: content.announcements.map(a => 
      a.id === id ? {...a, active: newActiveStatus} : a
    )
  });
  
  // Show saving indicator
  setSaving(true);
  setMessage(`${newActiveStatus ? 'Activating' : 'Deactivating'} announcement...`);
  
  try {
    // Call the dedicated toggle API instead of the general content API
    const response = await fetch('/api/toggle-announcement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId: id,
        active: newActiveStatus,
        secretCode
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating announcement');
    }
    
    const result = await response.json();
    setMessage(result.message || `Announcement ${newActiveStatus ? 'activated' : 'deactivated'} successfully!`);
    
    // We don't need to refresh the entire content since our dedicated API
    // only updated the announcement status
  } catch (error) {
    // Revert UI change on error
    setContent({
      ...content,
      announcements: content.announcements.map(a => 
        a.id === id ? {...a, active: announcement.active} : a
      )
    });
    setMessage(`Error: ${error.message}`);
    console.error('Error toggling announcement:', error);
  } finally {
    setSaving(false);
  }
};
  // Updated logo upload with better error handling and cache busting
  // Replace your existing handleLogoUpload function with this:
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }
    
    // Show loading state
    setSaving(true);
    setMessage('Uploading logo...');
    
    // Create a FormData object
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('secretCode', secretCode);
    
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error uploading logo');
      }
      
      const data = await response.json();
      
      // Use the URL directly from the API response - it already has the timestamp
      const logoUrl = data.logoUrl;
      
      // Fetch the latest content to ensure we're working with the most current data
      const contentResponse = await fetch('/api/content', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!contentResponse.ok) {
        throw new Error('Error fetching updated content');
      }
      
      // Update the local state with the freshly fetched content
      const updatedContent = await contentResponse.json();
      setContent(updatedContent);
      
      setMessage('Logo uploaded successfully!');
    } catch (error) {
      setMessage('Error handling logo: ' + error.message);
      console.error('Error handling logo:', error);
    } finally {
      setSaving(false);
    }
  };










  const handlePKChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }
    
    // Show loading state
    setSaving(true);
    setMessage('Uploading logo...');
    
    // Create a FormData object
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('secretCode', secretCode);
    
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error uploading logo');
      }
      
      const data = await response.json();
      
      // Use the URL directly from the API response - it already has the timestamp
      const logoUrl = data.logoUrl;
      
      // Fetch the latest content to ensure we're working with the most current data
      const contentResponse = await fetch('/api/content', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!contentResponse.ok) {
        throw new Error('Error fetching updated content');
      }
      
      // Update the local state with the freshly fetched content
      const updatedContent = await contentResponse.json();
      setContent(updatedContent);
      
      setMessage('Logo uploaded successfully!');
    } catch (error) {
      setMessage('Error handling logo: ' + error.message);
      console.error('Error handling logo:', error);
    } finally {
      setSaving(false);
    }
  };

  // Render login form if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Editor Access</h1>
          
          <form onSubmit={handleAuthenticate}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Enter Secret Code
              </label>
              <input
                type="password"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            {message && (
              <div className="mb-4 text-red-500 text-sm text-center">
                {message}
              </div>
            )}
            
            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Access Editor
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Content Editor</h1>
          <div className="flex items-center">
            <span className="text-green-600 mr-4">
              {saving ? 'Saving...' : (message || 'Ready to edit')}
            </span>
            <button
              onClick={handleSaveContent}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-5">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Information
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('logo')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Logo
            </button>
          </nav>
        </div>
        
        {/* General Information Tab */}
        {activeTab === 'general' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Clinic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name
                </label>
                <input
                  type="text"
                  value={content.clinicInfo?.name || ''}
                  onChange={(e) => setContent({
                    ...content,
                    clinicInfo: {
                      ...content.clinicInfo,
                      name: e.target.value
                    }
                  })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About Text
                </label>
                <textarea
                  rows="4"
                  value={content.clinicInfo?.aboutText || ''}
                  onChange={(e) => setContent({
                    ...content,
                    clinicInfo: {
                      ...content.clinicInfo,
                      aboutText: e.target.value
                    }
                  })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services (one per line)
                </label>
                <textarea
                  rows="5"
                  value={content.clinicInfo?.services?.join('\n') || ''}
                  onChange={(e) => setContent({
                    ...content,
                    clinicInfo: {
                      ...content.clinicInfo,
                      services: e.target.value.split('\n').filter(s => s.trim())
                    }
                  })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendly Link
                </label>
                <input
                  type="text"
                  value={content.clinicInfo?.calendlyLink || ''}
                  onChange={(e) => setContent({
                    ...content,
                    clinicInfo: {
                      ...content.clinicInfo,
                      calendlyLink: e.target.value
                    }
                  })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                    <input
                      type="text"
                      value={content.clinicInfo?.contactInfo?.address || ''}
                      onChange={(e) => setContent({
                        ...content,
                        clinicInfo: {
                          ...content.clinicInfo,
                          contactInfo: {
                            ...(content.clinicInfo?.contactInfo || {}),
                            address: e.target.value
                          }
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={content.clinicInfo?.contactInfo?.phone || ''}
                      onChange={(e) => setContent({
                        ...content,
                        clinicInfo: {
                          ...content.clinicInfo,
                          contactInfo: {
                            ...(content.clinicInfo?.contactInfo || {}),
                            phone: e.target.value
                          }
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="text"
                      value={content.clinicInfo?.contactInfo?.email || ''}
                      onChange={(e) => setContent({
                        ...content,
                        clinicInfo: {
                          ...content.clinicInfo,
                          contactInfo: {
                            ...(content.clinicInfo?.contactInfo || {}),
                            email: e.target.value
                          }
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hours</label>
                    <input
                      type="text"
                      value={content.clinicInfo?.contactInfo?.hours || ''}
                      onChange={(e) => setContent({
                        ...content,
                        clinicInfo: {
                          ...content.clinicInfo,
                          contactInfo: {
                            ...(content.clinicInfo?.contactInfo || {}),
                            hours: e.target.value
                          }
                        }
                      })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Announcements</h2>
            
            {/* Add New Announcement Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium text-gray-700 mb-3">Add New Announcement</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value})}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    rows="3"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
                
                <div className="sm:col-span-2 flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={newAnnouncement.active}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddAnnouncement}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Announcement
                  </button>
                </div>
              </div>
            </div>
            
            {/* Existing Announcements */}
            <h3 className="text-md font-medium text-gray-700 mb-3">Current Announcements</h3>
            
            {content.announcements?.length === 0 ? (
              <p className="text-gray-500 text-sm">No announcements yet.</p>
            ) : (
              <div className="space-y-4">
                {content.announcements?.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className={`border rounded-md p-4 ${
                      announcement.active 
                        ? announcement.type === 'info' 
                          ? 'bg-blue-50 border-blue-200' 
                          : announcement.type === 'success'
                          ? 'bg-green-50 border-green-200'
                          : announcement.type === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium">{announcement.title}</h4>
                        <p className="text-sm mt-1">{announcement.content}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className={`mr-2 px-2 py-0.5 rounded-full ${
                            announcement.type === 'info' 
                              ? 'bg-blue-100 text-blue-800' 
                              : announcement.type === 'success'
                              ? 'bg-green-100 text-green-800'
                              : announcement.type === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {announcement.type}
                          </span>
                          <span>
                            {announcement.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleAnnouncementActive(announcement.id)}
                          className={`inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white ${
                            announcement.active 
                              ? 'bg-gray-400 hover:bg-gray-500' 
                              : 'bg-green-600 hover:bg-green-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          title={announcement.active ? 'Deactivate' : 'Activate'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {announcement.active 
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            }
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Logo Tab */}
        {activeTab === 'logo' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Logo Management</h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4 border p-4 rounded-md bg-gray-50">
              {content.clinicInfo?.logoUrl ? (
  <img 
    src={`${content.clinicInfo.logoUrl}?t=${Date.now()}`} 
    alt="Current Logo" 
    className="max-w-xs max-h-40 object-contain"
    onError={(e) => {
      console.error('Error loading image:', e);
      // Retry with a different cache-busting approach if first fails
      e.target.src = `${content.clinicInfo.logoUrl}?reload=${Math.random()}`;
    }}
  />
) : (
  <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
    <span className="text-gray-500">No logo set</span>
  </div>
)}
           
              </div>
              
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Logo
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, or GIF. Recommended size: 200x200px or larger.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}