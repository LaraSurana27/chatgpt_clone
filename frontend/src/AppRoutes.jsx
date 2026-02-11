import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequireAuth from './components/RequireAuth';
import ChatLayout from './components/ChatLayout';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            
            <Route element={<RequireAuth />}>
                <Route path="/chat" element={<ChatLayout />} />
                <Route path="/chat/:chatId" element={<ChatLayout />} />
                <Route path="/" element={<Navigate to="/chat" replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
    );
};

export default AppRoutes;