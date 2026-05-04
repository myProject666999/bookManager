import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  TextField,
  Button,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Edit,
  Save,
  Cancel,
  Lock,
  Visibility,
  VisibilityOff,
  Badge,
  LocalLibrary,
  BookmarkAdded,
  Chat,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userApi, borrowApi, reserveApi, commentApi } from '../services/api';

function Profile() {
  const { user, setUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalBorrows: 0,
    currentBorrows: 0,
    totalReserves: 0,
    totalComments: 0,
  });

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const [borrowsRes, reservesRes, commentsRes] = await Promise.all([
        borrowApi.getMyBorrows({ page: 1, page_size: 100 }),
        reserveApi.getMyReserves({ page: 1, page_size: 100 }),
        commentApi.getMyComments({ page: 1, page_size: 100 }),
      ]);

      const borrows = borrowsRes.data?.data?.list || [];
      const reserves = reservesRes.data?.data?.list || [];
      const comments = commentsRes.data?.data?.list || [];

      const currentBorrows = borrows.filter(b => b.status === 'borrowing').length;

      setStats({
        totalBorrows: borrows.length,
        currentBorrows,
        totalReserves: reserves.length,
        totalComments: comments.length,
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userApi.updateUser(formData);
      if (response.data.code === 200) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSnackbar({ open: true, message: '个人信息更新成功', severity: 'success' });
        setEditing(false);
      } else {
        setSnackbar({ open: true, message: response.data.message || '更新失败', severity: 'error' });
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '更新失败', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setSnackbar({ open: true, message: '两次输入的密码不一致', severity: 'error' });
      return;
    }

    if (passwordData.new_password.length < 6) {
      setSnackbar({ open: true, message: '密码长度至少6位', severity: 'error' });
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await userApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '密码修改成功', severity: 'success' });
        setPasswordDialog(false);
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        setSnackbar({ open: true, message: response.data.message || '密码修改失败', severity: 'error' });
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '密码修改失败', severity: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const statItems = [
    { label: '总借阅次数', value: stats.totalBorrows, icon: <LocalLibrary />, color: 'primary' },
    { label: '当前借阅', value: stats.currentBorrows, icon: <LocalLibrary />, color: 'success' },
    { label: '预约次数', value: stats.totalReserves, icon: <BookmarkAdded />, color: 'warning' },
    { label: '评论数量', value: stats.totalComments, icon: <Chat />, color: 'info' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        个人中心
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: 40,
                  mb: 2,
                }}
              >
                {user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {user?.nickname || user?.username}
              </Typography>
              <Chip
                label={user?.role === 'admin' ? '管理员' : '普通用户'}
                color={user?.role === 'admin' ? 'primary' : 'default'}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    用户名
                  </Typography>
                  <Typography variant="body1">
                    {user?.username}
                  </Typography>
                </Box>
              </Box>

              {editing ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    昵称
                  </Typography>
                  <TextField
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    placeholder="请输入昵称"
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      昵称
                    </Typography>
                    <Typography variant="body1">
                      {user?.nickname || '未设置'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {editing ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    邮箱
                  </Typography>
                  <TextField
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    placeholder="请输入邮箱"
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      邮箱
                    </Typography>
                    <Typography variant="body1">
                      {user?.email || '未设置'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {editing ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    手机号
                  </Typography>
                  <TextField
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    placeholder="请输入手机号"
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      手机号
                    </Typography>
                    <Typography variant="body1">
                      {user?.phone || '未设置'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {editing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : '保存'}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Cancel />}
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      nickname: user?.nickname || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                    });
                  }}
                >
                  取消
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                >
                  编辑资料
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialog(true)}
                  color="secondary"
                >
                  修改密码
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              借阅统计
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {statItems.map((item, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ bgcolor: `${item.color}.light`, height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: `${item.color}.main`,
                              color: 'white',
                            }}
                          >
                            {item.icon}
                          </Avatar>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              账号信息
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    注册时间
                  </Typography>
                  <Typography variant="body1">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '未知'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    账号状态
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={user?.status === 1 ? '正常' : '禁用'}
                      color={user?.status === 1 ? 'success' : 'error'}
                      size="small"
                    />
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Lock sx={{ mr: 1 }} />
            修改密码
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="old_password"
              label="原密码"
              type={showOldPassword ? 'text' : 'password'}
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              name="new_password"
              label="新密码"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              helperText="密码长度至少6位"
            />
            <TextField
              name="confirm_password"
              label="确认新密码"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={passwordLoading || !passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password}
          >
            {passwordLoading ? <CircularProgress size={20} /> : '确认修改'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Profile;
