import { generateEmailHTML } from '../../src/lib/email-template';
import { randomUUID } from 'crypto'; 
import { validateAndSanitizeForm } from './validateClean';
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const submissionId = randomUUID();
  const formData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000';

  const configet = await fetch(`${BASE_URL}/api/eligibility`);
  const data = await configet.json();
  if (!configet.ok) {
    throw new Error(`Error fetching data: ${data || 'Unknown error'}`);
  }
  const dataForm = data[data.length-1];

  const uncleanData: Record<string, any> = formData.formData as Record<string, any>;
  
  const cleanData = validateAndSanitizeForm(uncleanData, dataForm.formConfig);
  const emailContent = generateEmailHTML(cleanData);
  
  const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT), 
  secure: false, 
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD, 
  },
  tls: {
    ciphers: 'SSLv3'
  }
  });

  const mailOptions = {
    from: `"Eligibility Screening" <${process.env.EMAIL_USERNAME}>`,
    to: process.env.EMAIL_TO, 
    subject: `New Eligibility Form Submission: ${submissionId}`,
    html: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully', submissionId  });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email', error: err.message, submissionId });
  }
  return null;
}
