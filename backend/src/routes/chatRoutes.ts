import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { upload } from '../services/uploadService.js';

const router = Router();

// Health check
router.get('/health', chatController.getHealth);

// Chat management
router.get('/chats', chatController.getChats);
router.get('/chats/:id/messages', chatController.getChatMessages);
router.patch('/chats/:id', chatController.updateChat);
router.delete('/chats/:id', chatController.deleteChat);

// Analysis and processing
router.post('/save-analysis', chatController.saveAnalysis);
router.post('/upload-video', upload.single('video'), chatController.uploadVideo);
router.post('/process-link', chatController.processLink);
router.post('/cleanup-video', chatController.cleanupVideo);

export default router;
