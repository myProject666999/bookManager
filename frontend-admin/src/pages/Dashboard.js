import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import {
  Book,
  LocalLibrary,
  People,
  Warning,
  TrendingUp,
  Category,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { statsApi } from '../services/api';

const COLORS = ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd', '#ff9800', '#f57c00', '#ef5350', '#66bb6a'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    total_books: 0,
    total_users: 0,
    current_borrows: 0,
    overdue_count: 0,
  });
  const [borrowStats, setBorrowStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [hotBooks, setHotBooks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardRes, borrowRes, categoryRes, hotBooksRes] = await Promise.all([
        statsApi.getDashboard(),
        statsApi.getBorrowStats(7),
        statsApi.getCategoryStats(),
        statsApi.getHotBooksRanking(5),
      ]);

      if (dashboardRes.data.code === 200) {
        setDashboard(dashboardRes.data.data || {
          total_books: 0,
          total_users: 0,
          current_borrows: 0,
          overdue_count: 0,
        });
      }

      if (borrowRes.data.code === 200) {
        setBorrowStats(borrowRes.data.data || []);
      }

      if (categoryRes.data.code === 200) {
        setCategoryStats(categoryRes.data.data || []);
      }

      if (hotBooksRes.data.code === 200) {
        setHotBooks(hotBooksRes.data.data || []);
      }
    } catch (error) {
      console.error('获取数据看板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '图书总数', value: dashboard.total_books, icon: <Book />, color: 'primary' },
    { label: '用户总数', value: dashboard.total_users, icon: <People />, color: 'success' },
    { label: '当前借阅', value: dashboard.current_borrows, icon: <LocalLibrary />, color: 'warning' },
    { label: '逾期数量', value: dashboard.overdue_count, icon: <Warning />, color: 'error' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        数据看板
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${item.color}.main`,
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {item.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              借阅趋势（近7天）
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={borrowStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="borrow_count"
                  stroke="#1976d2"
                  strokeWidth={2}
                  name="借阅数"
                  dot={{ fill: '#1976d2' }}
                />
                <Line
                  type="monotone"
                  dataKey="return_count"
                  stroke="#66bb6a"
                  strokeWidth={2}
                  name="归还数"
                  dot={{ fill: '#66bb6a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              分类统计
            </Typography>
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Category sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">暂无分类数据</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              热门图书排行
            </Typography>
            {hotBooks.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hotBooks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="borrow_count" fill="#1976d2" name="借阅次数" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">暂无热门图书数据</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              快速统计
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">总图书数</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{dashboard.total_books}</Typography>
                </Box>
                <Chip label="图书" color="primary" />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">总用户数</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{dashboard.total_users}</Typography>
                </Box>
                <Chip label="用户" color="success" />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">当前借阅</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{dashboard.current_borrows}</Typography>
                </Box>
                <Chip label="借阅中" color="warning" />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">逾期数量</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{dashboard.overdue_count}</Typography>
                </Box>
                <Chip label="逾期" color="error" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
