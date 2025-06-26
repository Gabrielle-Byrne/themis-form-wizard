import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import validator from 'validator';

const timingSafeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return (
    bufA.length === bufB.length &&
    crypto.timingSafeEqual(bufA, bufB)
  );
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const inputPassword = validator.trim(req.body?.enteredCode || '');

  const roles = [
    { role: 'editorD', secret: process.env.LEG_PASSWORD },
    { role: 'editorA', secret: process.env.ELI_PASSWORD },
    { role: 'editorB', secret: process.env.IN_PASSWORD },
    { role: 'editorC', secret: process.env.RES_PASSWORD }
  ];

  const matched = roles.find(({ secret }) =>
    timingSafeCompare(inputPassword, secret || '')
  );

  if (!matched) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // You could set a session, return token, or respond with role
  return res.status(200).json({ success: true, role: matched.role });
}