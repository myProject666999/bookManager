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
} from '@mui/material';
import {
  Search,
  LocalLibrary,
  CheckCircle,
  Warning,
  Block,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { borrowApi } from '../services/api';

function Borrows() {
  const [tabValue, setTabValue] = useState(0);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditStatus, setAuditStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = [
    { label: '全部', value: '' },
    { label: '借阅中', value: 'borrowing' },
    { label: '已归还', value: 'returned' },
    { label: '已逾期', value: 'overdue' },
  ];

  useEffect(() => {
    fetchBorrows();
  }, [searchParams]);

  useEffect(() => {
    setSearchParams(prev => ({ ...prev, status: tabs[tabValue].value, page: 1 }));
  }, [tabValue]);

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const response = await borrowApi.getBorrows(searchParams);
      if (response.data.code === 200) {
        const data = response.data.data;
        setBorrows(data.list || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.page_size || 10,
        });
      }
    } catch (error) {
      console.error('获取借阅列表失败:', error);
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

  const handleViewDetail = (borrow) => {
    setSelectedBorrow(borrow);
    setDetailDialogOpen(true);
  };

  const handleReturnClick = (borrow) => {
    setSelectedBorrow(borrow);
    setReturnDialogOpen(true);
  };

  const handleReturn = async () => {
    if (!selectedBorrow) return;
    try {
      setActionLoading(true);
      const response = await borrowApi.adminReturnBook(selectedBorrow.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '归还成功', severity: 'success' });
        setReturnDialogOpen(false);
        fetchBorrows();
      } else {
        setSnackbar({ open: true, message: response.data.message || '归还失败', severity: 'error' });
      }
    } catch (error) {
      console.error('归还失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '归还失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuditClick = (borrow, status) => {
    setSelectedBorrow(borrow);
    setAuditStatus(status);
    setAuditDialogOpen(true);
  };

  const handleAudit = async () => {
    if (!selectedBorrow) return;
    try {
      setActionLoading(true);
      const response = await borrowApi.auditBorrow(selectedBorrow.id, { status: auditStatus });
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: auditStatus === 'approved' ? '审核通过' : '审核拒绝', severity: 'success' });
        setAuditDialogOpen(false);
        fetchBorrows();
      } else {
        setSnackbar({ open: true, message: response.data.message || '审核失败', severity: 'error' });
      }
    } catch (error) {
      console.error('审核失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '审核失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOverdue = async () => {
    try {
      setActionLoading(true);
      const response = await borrowApi.updateOverdue();
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '逾期状态更新成功', severity: 'success' });
        fetchBorrows();
      } else {
        setSnackbar({ open: true, message: response.data.message || '更新失败', severity: 'error' });
      }
    } catch (error) {
      console.error('更新逾期状态失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '更新失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const statusMap = {
    'borrowing': { label: '借阅中', color: 'primary', icon: <LocalLibrary /> },
    'returned': { label: '已归还', color: 'success', icon: <CheckCircle /> },
    'overdue': { label: '已逾期', color: 'error', icon: <Warning /> },
    'pending': { label: '待审核', color: 'warning', icon: <Refresh /> },
    'rejected': { label: '被拒绝', color: 'default', icon: <Block /> },
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          借阅管理
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleUpdateOverdue}
          disabled={actionLoading}
        >
          更新逾期状态
        </Button>
      </Box>

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
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
              onClick={fetchBorrows}
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
      ) : borrows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无借阅记录
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {borrows.map((borrow) => {
              const statusInfo = statusMap[borrow.status] || statusMap['borrowing'];
              return (
                <Grid item key={borrow.id} xs={12}>
                  <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <CardMedia
                      component="img"
                      sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 180, sm: 'auto' } }}
                      image={getBookCover(borrow.book)}
                      alt={borrow.book?.title}
                    />
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {borrow.book?.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            借阅人: {borrow.user?.nickname || borrow.user?.username}
                          </Typography>
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
                          <Typography variant="caption" color="text.secondary">借阅日期</Typography>
                          <Typography variant="body2">
                            {borrow.borrow_date ? new Date(borrow.borrow_date).toLocaleDateString() : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">应还日期</Typography>
                          <Typography variant="body2">
                            {borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : '-'}
                          </Typography>
                        </Grid>
                        {borrow.return_date && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">归还日期</Typography>
                            <Typography variant="body2">
                              {new Date(borrow.return_date).toLocaleDateString()}
                            </Typography>
                          </Grid>
                        )}
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">续借次数</Typography>
                          <Typography variant="body2">
                            {borrow.renew_count || 0}/{borrow.max_renew_count || 3}
                          </Typography>
                        </Grid>
                      </Grid>

                      {(borrow.overdue_days > 0 || (borrow.status === 'borrowing' && new Date(borrow.due_date) < new Date())) && (
                        <Box sx={{ mb: 1 }}>
                          <Chip
                            label={`已逾期 ${borrow.overdue_days || Math.ceil((new Date() - new Date(borrow.due_date)) / (1000 * 60 * 60 * 24))} 天，罚款: ¥${borrow.fine || '0.00'}`}
                            color="error"
                            size="small"
                            icon={<Warning />}
                          />
                        </Box>
                      )}

                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="查看详情">
                          <IconButton size="small" onClick={() => handleViewDetail(borrow)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {borrow.status === 'pending' && (
                          <>
                            <Tooltip title="审核通过">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAuditClick(borrow, 'approved')}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="审核拒绝">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleAuditClick(borrow, 'rejected')}
                              >
                                <Block />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {borrow.status === 'borrowing' && (
                          <Tooltip title="确认归还">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleReturnClick(borrow)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
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
        <DialogTitle>借阅详情</DialogTitle>
        <DialogContent>
          {selectedBorrow && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <CardMedia
                    component="img"
                    sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                    image={getBookCover(selectedBorrow.book)}
                    alt={selectedBorrow.book?.title}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {selectedBorrow.book?.title}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">作者</Typography>
                      <Typography variant="body1">{selectedBorrow.book?.author || '未知'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">ISBN</Typography>
                      <Typography variant="body1">{selectedBorrow.book?.isbn || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">借阅人</Typography>
                      <Typography variant="body1">{selectedBorrow.user?.nickname || selectedBorrow.user?.username}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">状态</Typography>
                      <Typography variant="body1">
                        <Chip
                          label={statusMap[selectedBorrow.status]?.label || selectedBorrow.status}
                          color={statusMap[selectedBorrow.status]?.color || 'default'}
                          size="small"
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">借阅日期</Typography>
                      <Typography variant="body1">
                        {selectedBorrow.borrow_date ? new Date(selectedBorrow.borrow_date).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">应还日期</Typography>
                      <Typography variant="body1">
                        {selectedBorrow.due_date ? new Date(selectedBorrow.due_date).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                    {selectedBorrow.return_date && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">归还日期</Typography>
                        <Typography variant="body1">
                          {new Date(selectedBorrow.return_date).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">续借次数</Typography>
                      <Typography variant="body1">
                        {selectedBorrow.renew_count || 0}/{selectedBorrow.max_renew_count || 3}
                      </Typography>
                    </Grid>
                  </Grid>

                  {selectedBorrow.overdue_days > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="body1" color="error.dark">
                        已逾期 {selectedBorrow.overdue_days} 天，罚款: ¥{selectedBorrow.fine || '0.00'}
                      </Typography>
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

      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)}>
        <DialogTitle>确认归还</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要将《{selectedBorrow?.book?.title}》标记为已归还吗？
          </Typography>
          {selectedBorrow?.overdue_days > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              该图书已逾期 {selectedBorrow.overdue_days} 天，罚款: ¥{selectedBorrow.fine || '0.00'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleReturn} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认归还'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={auditDialogOpen} onClose={() => setAuditDialogOpen(false)}>
        <DialogTitle>
          {auditStatus === 'approved' ? '审核通过' : '审核拒绝'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            您确认要{auditStatus === 'approved' ? '通过' : '拒绝'}《{selectedBorrow?.book?.title}》的借阅申请吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            color={auditStatus === 'approved' ? 'success' : 'error'}
            onClick={handleAudit}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : '确认'}
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

export default Borrows;
