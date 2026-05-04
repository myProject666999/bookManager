import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Borrows from './pages/Borrows';
import Reserves from './pages/Reserves';
import Comments from './pages/Comments';
import Stats from './pages/Stats';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute requireAdmin>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="borrows" element={<Borrows />} />
          <Route path="reserves" element={<Reserves />} />
          <Route path="comments" element={<Comments />} />
          <Route path="stats" element={<Stats />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
