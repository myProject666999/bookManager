import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  Avatar,
  Divider,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  Person,
  Email,
  Phone,
  Block,
  CheckCircle,
  Visibility,
  LocalLibrary,
} from '@mui/icons-material';
import { userApi, borrowApi } from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBorrows, setUserBorrows] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, [searchParams]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers(searchParams);
      if (response.data.code === 200) {
        const data = response.data.data;
        setUsers(data.list || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.page_size || 10,
        });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (e, page) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await userApi.toggleUserStatus(user.id);
      if (response.data.code === 200) {
        setSnackbar({ 
          open: true, 
          message: user.status === 1 ? '已禁用用户' : '已启用用户', 
          severity: 'success' 
        });
        fetchUsers();
      } else {
        setSnackbar({ open: true, message: response.data.message || '操作失败', severity: 'error' });
      }
    } catch (error) {
      console.error('切换用户状态失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '操作失败', severity: 'error' });
    }
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
    
    try {
      const response = await borrowApi.getBorrows({ user_id: user.id, page_size: 100 });
      if (response.data.code === 200) {
        setUserBorrows(response.data.data?.list || []);
      }
    } catch (error) {
      console.error('获取用户借阅记录失败:', error);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const statusMap = {
    1: { label: '正常', color: 'success', icon: <CheckCircle /> },
    0: { label: '禁用', color: 'error', icon: <Block /> },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        用户管理
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              name="keyword"
              label="关键词"
              placeholder="搜索用户名、昵称、邮箱"
              value={searchParams.keyword}
              onChange={handleSearchChange}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              name="status"
              label="状态"
              select
              value={searchParams.status}
              onChange={handleSearchChange}
              fullWidth
              size="small"
              SelectProps={{
                native: true,
              }}
            >
              <option value="">全部状态</option>
              <option value="1">正常</option>
              <option value="0">禁用</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={fetchUsers}
              fullWidth
            >
              搜索
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无用户数据
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {users.map((user) => {
              const statusInfo = statusMap[user.status] || statusMap[1];
              return (
                <Grid item key={user.id} xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: user.status === 1 ? 'primary.main' : 'text.secondary',
                            mr: 2,
                            fontSize: 24,
                          }}
                        >
                          {user.nickname?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {user.nickname || user.username}
                            </Typography>
                            <Chip
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                              icon={statusInfo.icon}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            用户名: {user.username}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Email sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {user.email || '未设置'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Phone sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {user.phone || '未设置'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalLibrary sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            角色: {user.role === 'admin' ? '管理员' : '普通用户'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                      <Tooltip title="查看详情">
                        <IconButton size="small" onClick={() => handleViewDetail(user)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {user.role !== 'admin' && (
                        <Tooltip title={user.status === 1 ? '禁用用户' : '启用用户'}>
                          <IconButton
                            size="small"
                            color={user.status === 1 ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === 1 ? <Block /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            用户详情
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">用户名</Typography>
                  <Typography variant="body1">{selectedUser.username}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">昵称</Typography>
                  <Typography variant="body1">{selectedUser.nickname || '未设置'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">邮箱</Typography>
                  <Typography variant="body1">{selectedUser.email || '未设置'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">手机号</Typography>
                  <Typography variant="body1">{selectedUser.phone || '未设置'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">角色</Typography>
                  <Typography variant="body1">
                    <Chip 
                      label={selectedUser.role === 'admin' ? '管理员' : '普通用户'} 
                      size="small" 
                      color={selectedUser.role === 'admin' ? 'primary' : 'default'} 
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">状态</Typography>
                  <Typography variant="body1">
                    <Chip 
                      label={selectedUser.status === 1 ? '正常' : '禁用'} 
                      size="small" 
                      color={selectedUser.status === 1 ? 'success' : 'error'} 
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">注册时间</Typography>
                  <Typography variant="body1">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '未知'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                借阅记录
              </Typography>
              {userBorrows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  暂无借阅记录
                </Typography>
              ) : (
                <Box>
                  {userBorrows.slice(0, 5).map((borrow) => (
                    <Paper key={borrow.id} sx={{ p: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {borrow.book?.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            借阅日期: {borrow.borrow_date ? new Date(borrow.borrow_date).toLocaleDateString() : '未知'}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            borrow.status === 'borrowing' ? '借阅中' :
                            borrow.status === 'returned' ? '已归还' :
                            borrow.status === 'overdue' ? '已逾期' : borrow.status
                          }
                          color={
                            borrow.status === 'borrowing' ? 'primary' :
                            borrow.status === 'returned' ? 'success' :
                            borrow.status === 'overdue' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </Box>
                    </Paper>
                  ))}
                  {userBorrows.length > 5 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                      还有 {userBorrows.length - 5} 条记录...
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>关闭</Button>
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

export default Users;
