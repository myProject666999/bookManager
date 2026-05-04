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
  Chip,
  Tooltip,
  Pagination,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Avatar,
} from '@mui/material';
import {
  Search,
  BookmarkAdded,
  CheckCircle,
  Close,
  Block,
  Visibility,
  Notifications,
} from '@mui/icons-material';
import { reserveApi } from '../services/api';

function Reserves() {
  const [tabValue, setTabValue] = useState(0);
  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = [
    { label: '全部', value: '' },
    { label: '预约中', value: 'pending' },
    { label: '已确认', value: 'confirmed' },
    { label: '已取消', value: 'cancelled' },
    { label: '已完成', value: 'completed' },
  ];

  useEffect(() => {
    fetchReserves();
  }, [searchParams]);

  useEffect(() => {
    setSearchParams(prev => ({ ...prev, status: tabs[tabValue].value, page: 1 }));
  }, [tabValue]);

  const fetchReserves = async () => {
    try {
      setLoading(true);
      const response = await reserveApi.getReserves(searchParams);
      if (response.data.code === 200) {
        const data = response.data.data;
        setReserves(data.list || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.page_size || 10,
        });
      }
    } catch (error) {
      console.error('获取预约列表失败:', error);
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

  const handleViewDetail = (reserve) => {
    setSelectedReserve(reserve);
    setDetailDialogOpen(true);
  };

  const handleCancelClick = (reserve) => {
    setSelectedReserve(reserve);
    setCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedReserve) return;
    try {
      setActionLoading(true);
      const response = await reserveApi.adminCancelReserve(selectedReserve.id, { reason: '管理员取消' });
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '取消成功', severity: 'success' });
        setCancelDialogOpen(false);
        fetchReserves();
      } else {
        setSnackbar({ open: true, message: response.data.message || '取消失败', severity: 'error' });
      }
    } catch (error) {
      console.error('取消预约失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '取消失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotify = async (reserve) => {
    try {
      setActionLoading(true);
      const response = await reserveApi.sendReserveNotify(reserve.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '通知发送成功', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.data.message || '发送失败', severity: 'error' });
      }
    } catch (error) {
      console.error('发送通知失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '发送失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const statusMap = {
    'pending': { label: '预约中', color: 'warning', icon: <BookmarkAdded /> },
    'confirmed': { label: '已确认', color: 'primary', icon: <CheckCircle /> },
    'cancelled': { label: '已取消', color: 'default', icon: <Close /> },
    'completed': { label: '已完成', color: 'success', icon: <CheckCircle /> },
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        预约管理
      </Typography>

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              name="keyword"
              label="关键词"
              placeholder="搜索书名、用户名"
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
          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={fetchReserves}
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
      ) : reserves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookmarkAdded sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无预约记录
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {reserves.map((reserve) => {
              const statusInfo = statusMap[reserve.status] || statusMap['pending'];
              return (
                <Grid item key={reserve.id} xs={12}>
                  <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <CardMedia
                      component="img"
                      sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 180, sm: 'auto' } }}
                      image={getBookCover(reserve.book)}
                      alt={reserve.book?.title}
                    />
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {reserve.book?.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                              {reserve.user?.nickname?.charAt(0) || reserve.user?.username?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              预约人: {reserve.user?.nickname || reserve.user?.username}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          icon={statusInfo.icon}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ my: 1 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">预约日期</Typography>
                          <Typography variant="body2">
                            {reserve.created_at ? new Date(reserve.created_at).toLocaleDateString() : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">预约日期</Typography>
                          <Typography variant="body2">
                            {reserve.reserve_date ? new Date(reserve.reserve_date).toLocaleDateString() : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">有效期至</Typography>
                          <Typography variant="body2">
                            {reserve.expire_date ? new Date(reserve.expire_date).toLocaleDateString() : '-'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {reserve.reason && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            备注/原因: {reserve.reason}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="查看详情">
                          <IconButton size="small" onClick={() => handleViewDetail(reserve)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        {(reserve.status === 'pending' || reserve.status === 'confirmed') && (
                          <>
                            <Tooltip title="发送通知">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSendNotify(reserve)}
                              >
                                <Notifications />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="取消预约">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelClick(reserve)}
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </CardContent>
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
        <DialogTitle>预约详情</DialogTitle>
        <DialogContent>
          {selectedReserve && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <CardMedia
                    component="img"
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                    image={getBookCover(selectedReserve.book)}
                    alt={selectedReserve.book?.title}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {selectedReserve.book?.title}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">作者</Typography>
                      <Typography variant="body1">{selectedReserve.book?.author || '未知'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">ISBN</Typography>
                      <Typography variant="body1">{selectedReserve.book?.isbn || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">预约人</Typography>
                      <Typography variant="body1">
                        {selectedReserve.user?.nickname || selectedReserve.user?.username}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">状态</Typography>
                      <Typography variant="body1">
                        <Chip
                          label={statusMap[selectedReserve.status]?.label || selectedReserve.status}
                          color={statusMap[selectedReserve.status]?.color || 'default'}
                          size="small"
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">预约时间</Typography>
                      <Typography variant="body1">
                        {selectedReserve.created_at ? new Date(selectedReserve.created_at).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">预约日期</Typography>
                      <Typography variant="body1">
                        {selectedReserve.reserve_date ? new Date(selectedReserve.reserve_date).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">有效期至</Typography>
                      <Typography variant="body1">
                        {selectedReserve.expire_date ? new Date(selectedReserve.expire_date).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {selectedReserve.reason && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">备注/原因</Typography>
                      <Typography variant="body1">{selectedReserve.reason}</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>确认取消</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            您确认要取消《{selectedReserve?.book?.title}》的预约吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认取消'}
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

export default Reserves;
