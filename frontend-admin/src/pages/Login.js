import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Lock,
  Person,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setSnackbar({ open: true, message: '请输入用户名和密码', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await userApi.login(formData);
      
      if (response.data.code === 200) {
        const { token, user } = response.data.data;
        
        if (user.role !== 'admin') {
          setSnackbar({ open: true, message: '您没有管理员权限', severity: 'error' });
          return;
        }
        
        login(token, user);
        navigate('/dashboard');
      } else {
        setSnackbar({ open: true, message: response.data.message || '登录失败', severity: 'error' });
      }
    } catch (error) {
      console.error('登录失败:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || '登录失败，请检查网络连接', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      }}
    >
      <Grid container sx={{ maxWidth: 1000, mx: 2 }}>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            p: 4,
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <SmartToy sx={{ fontSize: 60, mr: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              图书馆管理系统
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ mb: 2, opacity: 0.9 }}>
            智能化图书借阅管理平台
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            支持AI智能对话、图书推荐、借阅管理、预约提醒等功能，
            为图书馆提供一站式数字化管理解决方案。
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <Lock sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                管理员登录
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                请使用管理员账号登录
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                name="username"
                label="用户名"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="large"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                disabled={loading}
              />

              <TextField
                name="password"
                label="密码"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="large"
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading || !formData.username || !formData.password}
              >
                {loading ? <CircularProgress size={24} /> : '登 录'}
              </Button>
            </form>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              提示：默认管理员账号 admin / admin123
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Login;
