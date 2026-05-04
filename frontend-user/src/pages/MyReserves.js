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
  Snackbar,
  Alert,
} from '@mui/material';
import {
  BookmarkAdded,
  Cancel,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reserveApi } from '../services/api';

function MyReserves() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedReserve, setSelectedReserve] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const statusMap = {
    'pending': { label: '等待中', color: 'warning', icon: <BookmarkAdded /> },
    'cancelled': { label: '已取消', color: 'default', icon: <Cancel /> },
    'notified': { label: '已通知', color: 'info', icon: <BookmarkAdded /> },
  };

  const tabs = [
    { label: '全部', value: '' },
    { label: '等待中', value: 'pending' },
    { label: '已取消', value: 'cancelled' },
  ];

  useEffect(() => {
    fetchReserves();
  }, [tabValue]);

  const fetchReserves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tabs[tabValue].value) {
        params.status = tabs[tabValue].value;
      }
      const response = await reserveApi.getMyReserves(params);
      if (response.data.code === 200) {
        setReserves(response.data.data.list || []);
      }
    } catch (error) {
      console.error('获取预约记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReserve) return;
    try {
      setActionLoading(true);
      const response = await reserveApi.cancelReserve(selectedReserve.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '取消预约成功！', severity: 'success' });
        setCancelDialog(false);
        fetchReserves();
      } else {
        setSnackbar({ open: true, message: response.data.message || '取消失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '取消失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  const getStatusInfo = (reserve) => {
    return statusMap[reserve.status] || { label: reserve.status, color: 'default', icon: <BookmarkAdded /> };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        我的预约
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
      ) : reserves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BookmarkAdded sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无预约记录
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            快去搜索喜欢的图书吧
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/books')}
          >
            去预约
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {reserves.map((reserve) => {
            const statusInfo = getStatusInfo(reserve);

            return (
              <Grid item key={reserve.id} xs={12}>
                <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <CardMedia
                    component="img"
                    sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 200, sm: 'auto' } }}
                    image={getBookCover(reserve.book)}
                    alt={reserve.book?.title}
                  />
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {reserve.book?.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          作者: {reserve.book?.author || '未知'}
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
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          预约日期
                        </Typography>
                        <Typography variant="body2">
                          {new Date(reserve.reserve_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          有效期至
                        </Typography>
                        <Typography variant="body2">
                          {new Date(reserve.expire_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          通知状态
                        </Typography>
                        <Typography variant="body2">
                          {reserve.notify_status === 'sent' ? '已通知' : '未通知'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {reserve.status === 'pending' && (
                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => { setSelectedReserve(reserve); setCancelDialog(true); }}
                        >
                          取消预约
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

      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            确认取消预约
            <IconButton onClick={() => setCancelDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要取消预约《{selectedReserve?.book?.title}》吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>取消</Button>
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

export default MyReserves;
