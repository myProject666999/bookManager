import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import BookSearch from './pages/BookSearch';
import BookDetail from './pages/BookDetail';
import MyBorrows from './pages/MyBorrows';
import MyReserves from './pages/MyReserves';
import MyComments from './pages/MyComments';
import Notifications from './pages/Notifications';
import AIChat from './pages/AIChat';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="books" element={<BookSearch />} />
          <Route path="books/:id" element={<BookDetail />} />
          <Route path="borrows" element={<MyBorrows />} />
          <Route path="reserves" element={<MyReserves />} />
          <Route path="comments" element={<MyComments />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
