import { IncomingForm } from 'formidable';
import { list, put } from '@vercel/blob';

// Content key for Vercel Blob
const contentKey = 'content.json';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // The secret code - in a real app, use an environment variable
  const secretCode = 'your-secret-code-here';
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Parse the form data (in memory, not on filesystem)
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    multiples: false,
  });
  
  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        res.status(500).json({ message: 'Error uploading file' });
        return resolve();
      }
      
      // Verify the secret code
      const providedCode = Array.isArray(fields.secretCode) 
        ? fields.secretCode[0] 
        : fields.secretCode;
        
      if (providedCode !== secretCode) {
        res.status(401).json({ message: 'Unauthorized' });
        return resolve();
      }
      
      try {
        const file = Array.isArray(files.logo) ? files.logo[0] : files.logo;
        
        // Check if it's an image
        if (!file.mimetype.startsWith('image/')) {
          res.status(400).json({ message: 'File must be an image' });
          return resolve();
        }
        
        // Always use the same filename: logo.png (or keep extension from original)
        const extension = file.originalFilename.substring(file.originalFilename.lastIndexOf('.'));
        const fileName = `logo${extension}`;
        
        // Add a timestamp to the filename to prevent caching
        const timestampedFileName = `logo_${Date.now()}${extension}`;
        
        // Read the file content
        const fileBuffer = await require('fs').promises.readFile(file.filepath);
        
        // Upload directly to Vercel Blob with the timestamped name to avoid caching issues
        const { url: uploadedUrl } = await put(timestampedFileName, fileBuffer, {
          contentType: file.mimetype,
          access: 'public',
        });
        
        // Update the logo URL in the content stored in Vercel Blob
        let content;
        
        try {
          // Get content from Vercel Blob
          const { blobs } = await list();
          const contentBlob = blobs.find(blob => blob.pathname === contentKey);
          
          if (contentBlob) {
            // Content exists, fetch it
            const response = await fetch(contentBlob.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch content: ${response.status}`);
            }
            
            content = await response.json();
          } else {
            // Create default content
            content = {
              clinicInfo: {
                name: "Legal Clinic Services",
                aboutText: "Our legal clinic provides quality legal assistance.",
                services: [],
                contactInfo: {},
                calendlyLink: ""
              },
              announcements: [],
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (error) {
          console.error('Error fetching content:', error);
          res.status(500).json({ message: 'Error fetching existing content: ' + error.message });
          return resolve();
        }
        
        // Make sure clinicInfo exists
        if (!content.clinicInfo) {
          content.clinicInfo = {};
        }
        
        // Update the logo URL to use the new timestamped URL
        content.clinicInfo.logoUrl = uploadedUrl;
        
        // Update lastUpdated timestamp
        content.lastUpdated = new Date().toISOString();
        
        // Save the updated content to Vercel Blob
        await put(contentKey, JSON.stringify(content), {
          contentType: 'application/json',
          access: 'public',
          allowOverwrite: true
        });
        
        // Return the logo URL
        res.status(200).json({ logoUrl: uploadedUrl });
        return resolve();
      } catch (error) {
        console.error('Error handling logo upload:', error);
        res.status(500).json({ message: 'Error processing upload: ' + error.message });
        return resolve();
      }
    });
  });
}