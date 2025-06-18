// components/api/server.js
import { generateEmailHTML } from '../../src/lib/email-template'; // if you're using baseUrl in tsconfig
import { randomUUID } from 'crypto'; 
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // const openpgp = require('openpgp');
  const fs = require('fs');
  const submissionId = randomUUID();
  const formdata = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const emailContent = generateEmailHTML(formdata.formData);
  // const pkArmor = fs.readFileSync('pages/api/publicKey.asc', 'utf8');

  // const publicKey = await openpgp.readKey({ armoredKey: pkArmor });

  // const encrypted = await openpgp.encrypt({
  //   message: await openpgp.createMessage({ text: emailContent }),
  //   encryptionKeys: publicKey
  // });

      // fs.writeFileSync('encrypt.asc', encrypted);


  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // App password
    },
  });

  const mailOptions = {
    from: `"Eligibility Screening" <${process.env.EMAIL_TO}>`,
    to: process.env.EMAIL_TO, 
    subject: `New Eligibility Form Submission: ${submissionId}`,
    html: emailContent,
  };


  try {
    fs.writeFileSync('encrypt.asc', emailContent);
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully', submissionId  });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email', error: err.message, submissionId });
  }
}
