import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead,
  MarkEmailUnread,
  Delete,
} from '@mui/icons-material';
import { notificationApi } from '../services/api';

function Notifications() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const tabs = [
    { label: '全部', value: '' },
    { label: '未读', value: 'false' },
    { label: '已读', value: 'true' },
  ];

  useEffect(() => {
    fetchNotifications();
  }, [tabValue]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { page_size: 50 };
      if (tabs[tabValue].value !== '') {
        params.is_read = tabs[tabValue].value;
      }
      const response = await notificationApi.getNotifications(params);
      if (response.data.code === 200) {
        setNotifications(response.data.data.list || []);
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      const response = await notificationApi.markAsRead(notif.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '已标记为已读', severity: 'success' });
        fetchNotifications();
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: `已标记 ${response.data.data.updated_count} 条通知为已读`, severity: 'success' });
        fetchNotifications();
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      'reserve_notify': NotificationsIcon,
      'borrow_notify': NotificationsIcon,
      'overdue_notify': NotificationsIcon,
    };
    return iconMap[type] || NotificationsIcon;
  };

  const getTypeLabel = (type) => {
    const labelMap = {
      'reserve_notify': '预约通知',
      'borrow_notify': '借阅通知',
      'overdue_notify': '逾期提醒',
    };
    return labelMap[type] || '系统通知';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          通知中心
        </Typography>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<MarkEmailRead />}
            onClick={handleMarkAllAsRead}
          >
            全部标记已读 ({unreadCount})
          </Button>
        )}
      </Box>

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
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无通知
          </Typography>
          <Typography variant="body2" color="text.secondary">
            您的通知会显示在这里
          </Typography>
        </Box>
      ) : (
        <List>
          {notifications.map((notif) => {
            const IconComponent = getTypeIcon(notif.type);
            return (
              <Paper key={notif.id} sx={{ mb: 1 }}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notif.is_read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                  onClick={() => handleMarkAsRead(notif)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notif.is_read ? 'grey.300' : 'primary.main' }}>
                      <IconComponent />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                          {notif.title}
                        </Typography>
                        {!notif.is_read && (
                          <Chip label="未读" size="small" color="primary" sx={{ height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          {notif.content}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={getTypeLabel(notif.type)} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notif.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                  {!notif.is_read && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif); }}
                      sx={{ ml: 1 }}
                    >
                      <MarkEmailRead sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </ListItem>
              </Paper>
            );
          })}
        </List>
      )}

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

export default Notifications;
