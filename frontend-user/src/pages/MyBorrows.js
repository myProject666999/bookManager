import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  LocalLibrary,
  Refresh,
  ArrowBack,
  CheckCircle,
  Warning,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { borrowApi } from '../services/api';

function MyBorrows() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [renewDialog, setRenewDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const statusMap = {
    'borrowing': { label: '借阅中', color: 'primary', icon: <LocalLibrary /> },
    'returned': { label: '已归还', color: 'success', icon: <CheckCircle /> },
    'overdue': { label: '已逾期', color: 'error', icon: <Warning /> },
    'rejected': { label: '被拒绝', color: 'default', icon: <Close /> },
  };

  const tabs = [
    { label: '全部', value: '' },
    { label: '借阅中', value: 'borrowing' },
    { label: '已归还', value: 'returned' },
  ];

  useEffect(() => {
    fetchBorrows();
  }, [tabValue]);

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tabs[tabValue].value) {
        params.status = tabs[tabValue].value;
      }
      const response = await borrowApi.getMyBorrows(params);
      if (response.data.code === 200) {
        setBorrows(response.data.data.list || []);
      }
    } catch (error) {
      console.error('获取借阅记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedBorrow) return;
    try {
      setActionLoading(true);
      const response = await borrowApi.renewBook(selectedBorrow.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '续借成功！', severity: 'success' });
        setRenewDialog(false);
        fetchBorrows();
      } else {
        setSnackbar({ open: true, message: response.data.message || '续借失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '续借失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedBorrow) return;
    try {
      setActionLoading(true);
      const response = await borrowApi.returnBook(selectedBorrow.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '归还成功！', severity: 'success' });
        setReturnDialog(false);
        fetchBorrows();
      } else {
        setSnackbar({ open: true, message: response.data.message || '归还失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '归还失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusInfo = (borrow) => {
    if (borrow.status === 'borrowing' && isOverdue(borrow.due_date)) {
      return statusMap['overdue'];
    }
    return statusMap[borrow.status] || { label: borrow.status, color: 'default', icon: <LocalLibrary /> };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        我的借阅
      </Typography>

      <Paper sx={{ mb: 3 }}>
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

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : borrows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无借阅记录
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            快去搜索喜欢的图书吧
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/books')}
          >
            去借书
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {borrows.map((borrow) => {
            const statusInfo = getStatusInfo(borrow);
            const overdue = borrow.status === 'borrowing' && isOverdue(borrow.due_date);

            return (
              <Grid item key={borrow.id} xs={12}>
                <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 200, sm: 'auto' } }}
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
                          作者: {borrow.book?.author || '未知'}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusInfo.label}
                        color={overdue ? 'error' : statusInfo.color}
                        size="small"
                        icon={statusInfo.icon}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ my: 1 }}>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          借阅日期
                        </Typography>
                        <Typography variant="body2">
                          {new Date(borrow.borrow_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          应还日期
                        </Typography>
                        <Typography variant="body2" color={overdue ? 'error.main' : 'inherit'}>
                          {new Date(borrow.due_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          续借次数
                        </Typography>
                        <Typography variant="body2">
                          {borrow.renew_count}/{borrow.max_renew_count}
                        </Typography>
                      </Grid>
                    </Grid>

                    {borrow.return_date && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          实际归还: {new Date(borrow.return_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}

                    {(overdue || borrow.overdue_days > 0) && (
                      <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                        <Typography variant="body2">
                          已逾期 {borrow.overdue_days || Math.ceil((new Date() - new Date(borrow.due_date)) / (1000 * 60 * 60 * 24))} 天，
                          罚款: ¥{borrow.fine || ((Math.ceil((new Date() - new Date(borrow.due_date)) / (1000 * 60 * 60 * 24)) * 0.5).toFixed(2))}
                        </Typography>
                      </Alert>
                    )}

                    {borrow.status === 'borrowing' && (
                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Refresh />}
                          onClick={() => { setSelectedBorrow(borrow); setRenewDialog(true); }}
                          disabled={borrow.renew_count >= borrow.max_renew_count || overdue}
                        >
                          续借
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => { setSelectedBorrow(borrow); setReturnDialog(true); }}
                        >
                          归还
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={renewDialog} onClose={() => setRenewDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            确认续借
            <IconButton onClick={() => setRenewDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要续借《{selectedBorrow?.book?.title}》吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            当前续借次数: {selectedBorrow?.renew_count}/{selectedBorrow?.max_renew_count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            续借后归还日期将延长 30 天
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenewDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleRenew} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认续借'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            确认归还
            <IconButton onClick={() => setReturnDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要归还《{selectedBorrow?.book?.title}》吗？
          </Typography>
          {selectedBorrow && isOverdue(selectedBorrow.due_date) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                图书已逾期，将产生罚款
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleReturn} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认归还'}
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

export default MyBorrows;
