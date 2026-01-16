import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatProvider } from '@/lib/chat-context';

export default function Layout({ children }) {
    return (
        <ChatProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </ChatProvider>
    );
}
