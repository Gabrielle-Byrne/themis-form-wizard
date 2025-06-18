// pages/api/content.js
import { list, put } from '@vercel/blob';

// Secret code for admin access
const secretCode = 'your-secret-code-here';
const contentKey = 'content.json';

// Default content
const defaultContent = {
  clinicInfo: {
    name: "Legal Clinic Services",
    aboutText: "The UNB Legal Clinic, located at 750 Brunswick Street, Fredericton, NB, provides free legal services to individuals who cannot afford representation and do not qualify for legal aid. Services include assistance with housing and tenancy issues, employment law, human rights, small claims, immigration, uncontested divorce, and more. The clinic operates Monday to Friday, 8:30 a.m. to 4:30 p.m., and offers in-person, phone, and virtual appointments. Financial eligibility is assessed using a means test, focusing on those with low or no income. Clients should bring identification, proof of income, and relevant legal documents to appointments. Contact: 506-452-6313 or lawclinic@unb.ca.",
    services: [
      "Family law consultations",
      "Landlord-tenant dispute resolution",
      "Immigration assistance",
      "Small claims court representation",
      "Document review and preparation"
    ],
    contactInfo: {
      address: "123 Legal Street, Suite 101",
      phone: "(555) 123-4567",
      email: "info@legalclinic.org",
      hours: "Mon-Fri, 9am-5pm"
    },
    calendlyLink: "https://calendly.com/your-account/your-event",
    logoUrl: "/uploads/logo-09c10f70-f30f-4bcb-8853-dd02197e0173.jpg" // Updated to your actual logo path
  },
  announcements: [
    {
      id: "1",
      title: "Holiday Hours",
      content: "Our clinic will be closed on April 15th for staff training.",
      type: "info",
      active: true
    }
  ],
  lastUpdated: new Date().toISOString()
};

export default async function handler(req, res) {
  // Ensure we respond to all methods, even if just to reject them
  const allowedMethods = ['GET', 'POST'];
  
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
  
  // Handle GET request - return the content
  if (req.method === 'GET') {
    try {
      // List blobs to check if content exists
      const { blobs } = await list();
      const contentBlob = blobs.find(blob => blob.pathname === contentKey);
      
      if (contentBlob) {
        // Content exists, fetch it
        const response = await fetch(contentBlob.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
        
        const content = await response.json();
        return res.status(200).json(content);
      } else {
        // Create default content
        const { url } = await put(contentKey, JSON.stringify(defaultContent), {
          contentType: 'application/json',
          access: 'public',
          allowOverwrite: true // Added allowOverwrite option
        });
        
        return res.status(200).json(defaultContent);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Error fetching content', error: error.message });
    }
  }
  
  // Handle POST request - update the content
  if (req.method === 'POST') {
    try {
      const { content, secretCode: providedCode } = req.body;
      
      // Verify secret code
      if (providedCode !== secretCode) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Validate content structure
      if (!content) {
        return res.status(400).json({ message: 'Invalid content format' });
      }
      
      // Update lastUpdated field
      content.lastUpdated = new Date().toISOString();
      
      // Store content in Blob storage
      const { url } = await put(contentKey, JSON.stringify(content), {
        contentType: 'application/json',
        access: 'public',
        allowOverwrite: true // Added allowOverwrite option
      });
      
      return res.status(200).json({ message: 'Content updated successfully', content });
    } catch (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ message: 'Error updating content', error: error.message });
    }
  }
}