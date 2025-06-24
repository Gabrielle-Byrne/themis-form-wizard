// components/api/server.js
import { generateEmailHTML } from '../../src/lib/email-template';
import { randomUUID } from 'crypto'; 
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const fs = require('fs');
  const submissionId = randomUUID();
  const formdata = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const emailContent = generateEmailHTML(formdata.formData);
  
  const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // 'smtp.office365.com'
  port: parseInt(process.env.EMAIL_PORT), //587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD, // App password
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
}
