import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
// Safely access req.body
  if (!req.body || !req.body.enteredCode) {
    return res.status(400).json({ success: false, message: 'No code provided' });
  }
  const password = req.body.enteredCode;
  const EDITOR_A_PASSWORD = process.env.ELI_PASSWORD;
  const EDITOR_B_PASSWORD = process.env.IN_PASSWORD;
  const EDITOR_C_PASSWORD = process.env.RES_PASSWORD;
  const EDITOR_D_PASSWORD = process.env.LEG_PASSWORD;

  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  if (password === EDITOR_A_PASSWORD) {
    return res.status(200).json({ success: true, role: 'editorA' });
  } else if (password === EDITOR_B_PASSWORD) {
    return res.status(200).json({ success: true, role: 'editorB' });
  } else if (password === EDITOR_B_PASSWORD) {
    return res.status(200).json({ success: true, role: 'editorB' });
  } else if (password === EDITOR_C_PASSWORD) {
    return res.status(200).json({ success: true, role: 'editorC' });
  } else if (password === EDITOR_D_PASSWORD) {
    return res.status(200).json({ success: true, role: 'editorD' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
}
