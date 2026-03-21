import { config } from '../config/env.js';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const YT_DLP_TIMEOUT_MS = 120000;
const YT_DLP_PYTHON = process.platform === 'win32'
  ? path.join(process.cwd(), 'venv', 'Scripts', 'python.exe')
  : 'python';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function processVideoLink(url: string) {
  const tempFilename = `link-${Date.now()}.mp4`;
  const tempPath = path.join(UPLOADS_DIR, tempFilename);

  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      console.log('Processing YouTube link:', url);
      try {
        if (url.includes('youtube.com/shorts/')) {
          url = url.replace(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([^?\/]+).*$/, 'https://www.youtube.com/watch?v=$1');
          console.log('Converted URL:', url);
        }
        await downloadYouTube(url, tempPath);
      } catch (err: any) {
        console.error('YouTube download failed:', err.message);
        console.log('Fallback to yt-dlp activated');
        try {
          await downloadYouTubeWithYtDlp(url, tempPath);
        } catch (fallbackErr: any) {
          console.error('yt-dlp fallback failed:', fallbackErr.message);
          throw new Error('YouTube currently blocked this link due to platform restrictions. Please upload the video directly.');
        }
      }
    } else if (url.includes('drive.google.com')) {
      console.log('Processing Google Drive link:', url);
      try {
        await downloadGoogleDrive(url, tempPath);
      } catch (err: any) {
        console.error('Google Drive download failed:', err.message);
        throw new Error(`Google Drive download failed: ${err.message}`);
      }
    } else if (url.includes('dropbox.com')) {
      console.log('Processing Dropbox link:', url);
      try {
        await downloadDropbox(url, tempPath);
      } catch (err: any) {
        console.error('Dropbox download failed:', err.message);
        throw new Error(`Dropbox download failed: ${err.message}`);
      }
    } else {
      throw new Error('Unsupported video source');
    }

    console.log('Video downloaded successfully to:', tempPath);
    if (fs.existsSync(tempPath)) {
      const stats = fs.statSync(tempPath);
      console.log(`File size: ${stats.size} bytes`);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }
    } else {
      throw new Error('Downloaded file does not exist');
    }

    return {
      filename: tempFilename,
      path: `/uploads/${tempFilename}`
    };
  } catch (error) {
    console.error('Link processing error:', error);
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

async function downloadYouTube(url: string, dest: string) {
  const cookiePreview = config.YOUTUBE_COOKIE?.slice(0, 50);
  if (config.YOUTUBE_COOKIE) {
    console.log('YouTube Download: Using YOUTUBE_COOKIE');
    console.log(cookiePreview);
  } else {
    console.warn('YouTube Download: No YOUTUBE_COOKIE found. Bot detection is likely.');
  }

  // Add request options to look more like a browser and avoid bot detection
  const options: ytdl.downloadOptions = {
    filter: 'videoandaudio',
    quality: 'lowest',
    requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cookie': config.YOUTUBE_COOKIE || '',
        }
    }
  };

  try {
    // Fetch info first, this can help with bot detection
    const info = await ytdl.getInfo(url, options);
    console.log('Fetched YouTube info for:', info.videoDetails.title);

    return new Promise<void>((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, options);
      const writeStream = fs.createWriteStream(dest);
      
      stream.pipe(writeStream);
      
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => {
        console.error('YouTube write stream error:', err);
        reject(err);
      });
      stream.on('error', (err) => {
        console.error('YouTube download stream error:', err);
        if (err.message.includes('Sign in to confirm you’re not a bot')) {
          reject(new Error(config.YOUTUBE_COOKIE
            ? 'Cookie loaded correctly, but YouTube still blocked this request. Upload video directly or refresh cookie.'
            : 'YouTube is blocking this request due to bot detection. Please provide a YOUTUBE_COOKIE in your secrets or upload the video directly.'));
        } else {
          reject(err);
        }
      });
    });
  } catch (err: any) {
    console.error('YouTube getInfo error:', err);
    if (err.message.includes('Sign in to confirm you’re not a bot')) {
      throw new Error(config.YOUTUBE_COOKIE
        ? 'Cookie loaded correctly, but YouTube still blocked this request. Upload video directly or refresh cookie.'
        : 'YouTube is blocking this request due to bot detection. Please provide a YOUTUBE_COOKIE in your secrets or upload the video directly.');
    }
    throw err;
  }
}

async function downloadYouTubeWithYtDlp(url: string, dest: string) {
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(YT_DLP_PYTHON, ['-m', 'yt_dlp', '--cookies', 'cookies.txt', '-o', dest, url], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('yt-dlp timeout'));
    }, YT_DLP_TIMEOUT_MS);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0 && fs.existsSync(dest)) {
        resolve();
        return;
      }
      reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
  });
}

async function downloadGoogleDrive(url: string, dest: string) {
  const fileIdMatch = url.match(/\/d\/([^\/]+)/);
  if (!fileIdMatch) throw new Error('Invalid Google Drive URL');
  
  const fileId = fileIdMatch[1];
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  const response = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
}

async function downloadDropbox(url: string, dest: string) {
  // Convert to direct download link
  const downloadUrl = url.replace('?dl=0', '?dl=1');
  
  const response = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
}
