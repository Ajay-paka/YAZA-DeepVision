import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

export const chatService = {
  async getChats() {
    const response = await api.get('/chats');
    return response.data;
  },
  async getChatMessages(id: string) {
    const response = await api.get(`/chats/${id}/messages`);
    return response.data;
  },
  async updateChat(id: string, updates: any) {
    const response = await api.patch(`/chats/${id}`, updates);
    return response.data;
  },
  async deleteChat(id: string) {
    const response = await api.delete(`/chats/${id}`);
    return response.data;
  },
  async saveAnalysis(title: string, analysis: any, userMessage: string) {
    const response = await api.post('/save-analysis', { title, analysis, userMessage });
    return response.data;
  }
};

export const uploadService = {
  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('video', file);
    const response = await api.post('/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  async processLink(url: string) {
    const response = await api.post('/process-link', { url });
    return response.data;
  },
  async cleanupVideo(filename: string) {
    const response = await api.post('/cleanup-video', { filename });
    return response.data;
  }
};
