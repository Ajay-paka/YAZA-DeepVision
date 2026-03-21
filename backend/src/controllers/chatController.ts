import { Request, Response } from 'express';
import * as supabaseService from '../services/supabaseService.js';
import { processVideoLink } from '../services/linkProcessorService.js';
import { isValidVideoType } from '../services/uploadService.js';
import { isValidVideoLink } from '../utils/validators.js';
import fs from 'fs';
import path from 'path';

export const getHealth = (req: Request, res: Response) => {
  res.json({ 
    status: 'success', 
    message: 'YAZA DeepVision Backend is healthy',
    timestamp: new Date().toISOString() 
  });
};

export const getChats = async (req: Request, res: Response) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ 
      error: 'Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.' 
    });
  }

  try {
    const data = await supabaseService.fetchChats();
    res.json(data);
  } catch (error: any) {
    console.error('Supabase fetch error:', error);
    res.status(500).json({ 
      error: `Supabase error: ${error.message}`,
      details: error.details,
      hint: error.hint
    });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await supabaseService.fetchChatMessages(id);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChat = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pinned, archived, title } = req.body;
  try {
    const data = await supabaseService.updateChat(id, { pinned, archived, title });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await supabaseService.deleteChat(id);
    res.json({ status: 'success' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveAnalysis = async (req: Request, res: Response) => {
  const { title, analysis, userMessage } = req.body;

  if (!analysis || !title || !userMessage) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  try {
    const chatId = await supabaseService.saveAnalysisToSupabase(title, analysis, userMessage);
    res.json({
      status: 'success',
      chatId
    });
  } catch (error: any) {
    console.error('Failed to save analysis:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const uploadVideo = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ status: 'error', message: 'No video file uploaded' });
  }

  if (!isValidVideoType(file.mimetype)) {
    if (file.path) fs.unlinkSync(file.path);
    return res.status(400).json({ 
      status: 'error', 
      message: 'Unsupported file format. Supported: MP4, MOV, AVI, WEBM' 
    });
  }

  res.json({
    status: 'success',
    videoUrl: `/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype
  });
};

export const processLink = async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL is required' });
  }

  if (!isValidVideoLink(url)) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Unsupported video source. Please use YouTube, Google Drive, or Dropbox.' 
    });
  }

  try {
    const result = await processVideoLink(url);
    res.json({
      status: 'success',
      videoUrl: result.path,
      filename: result.filename,
      mimeType: 'video/mp4'
    });
  } catch (error: any) {
    console.error('Link processing failed:', error);
    let clientMessage = error.message;
    if (error.message.includes('YouTube is blocking this request')) {
      clientMessage = 'YouTube is blocking this request due to bot detection. Please provide a YOUTUBE_COOKIE in your secrets or upload the video directly.';
    } else if (error.message.includes('YouTube currently blocked this link due to platform restrictions')) {
      clientMessage = 'YouTube currently blocked this link due to platform restrictions. Please upload the video directly.';
    } else if (error.message.includes('empty file') || error.message.includes('does not exist')) {
      clientMessage = 'Link processing failed: Downloaded file is invalid or empty.';
    }
    const responseBody: any = { 
      status: 'error', 
      message: clientMessage
    };
    if (!error.message.includes('YouTube currently blocked this link due to platform restrictions')) {
      responseBody.details = error.stack || String(error);
    }
    res.status(500).json(responseBody);
  }
};

export const cleanupVideo = async (req: Request, res: Response) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename required' });

  const filePath = path.join(process.cwd(), 'uploads', filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ status: 'success' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: 'Failed to cleanup file' });
  }
};
