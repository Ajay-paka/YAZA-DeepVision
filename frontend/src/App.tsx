import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </ThemeProvider>
  );
}
