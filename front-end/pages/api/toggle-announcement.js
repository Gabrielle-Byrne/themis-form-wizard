// pages/api/toggle-announcement.js
import { list, put } from '@vercel/blob';

// Secret code for admin access
const secretCode = 'your-secret-code-here';
const contentKey = 'content.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { announcementId, active, secretCode: providedCode } = req.body;
    
    // Verify secret code
    if (providedCode !== secretCode) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!announcementId) {
      return res.status(400).json({ message: 'Announcement ID is required' });
    }
    
    // Get the current content
    const { blobs } = await list();
    const contentBlob = blobs.find(blob => blob.pathname === contentKey);
    
    if (!contentBlob) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    const response = await fetch(contentBlob.url);
    if (!response.ok) {
      return res.status(500).json({ 
        message: `Failed to fetch content: ${response.status}` 
      });
    }
    
    const content = await response.json();
    
    // Find the announcement
    const announcementIndex = content.announcements.findIndex(a => a.id === announcementId);
    
    if (announcementIndex === -1) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Update the active status
    content.announcements[announcementIndex].active = active;
    
    // Update the lastUpdated timestamp
    content.lastUpdated = new Date().toISOString();
    
    // Save the updated content
    await put(contentKey, JSON.stringify(content), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true
    });
    
    // Return the updated announcement
    return res.status(200).json({ 
      success: true,
      announcement: content.announcements[announcementIndex],
      message: `Announcement ${active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    return res.status(500).json({ 
      message: 'Error toggling announcement', 
      error: error.message 
    });
  }
}