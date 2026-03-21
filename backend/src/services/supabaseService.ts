import { supabase } from '../config/supabase.js';

export async function saveAnalysisToSupabase(title: string, analysis: any, userMessage: string) {
  try {
    // 1. Create Chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ title })
      .select()
      .single();

    if (chatError) throw chatError;

    // 2. Save User Message
    await supabase.from('messages').insert({
      chat_id: chat.id,
      role: 'user',
      content: userMessage
    });

    // 3. Save Assistant Message (Summary)
    await supabase.from('messages').insert({
      chat_id: chat.id,
      role: 'assistant',
      content: analysis.summary
    });

    // 4. Save Analysis Results
    await supabase.from('analysis_results').insert({
      chat_id: chat.id,
      summary: analysis.summary,
      steps: analysis.steps,
      notes: analysis.notes,
      prompt_output: analysis.prompt
    });

    return chat.id;
  } catch (err) {
    console.error('Supabase save error:', err);
    return null;
  }
}

export async function fetchChats() {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchChatMessages(chatId: string) {
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const { data: analysis, error: analysisError } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('chat_id', chatId)
    .single();

  return { messages, analysis: analysis || null };
}

export async function updateChat(chatId: string, updates: any) {
  const { data, error } = await supabase
    .from('chats')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString() 
    })
    .eq('id', chatId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
  return true;
}
