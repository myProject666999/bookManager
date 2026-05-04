import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Book,
  LocalLibrary,
  People,
  Warning,
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
  AreaChart,
  Area,
} from 'recharts';
import { statsApi } from '../services/api';

const COLORS = ['#1976d2', '#42a5f5', '#90caf9', '#e3f2fd', '#ff9800', '#f57c00', '#ef5350', '#66bb6a', '#ba68c8', '#ce93d8'];

function Stats() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [borrowStats, setBorrowStats] = useState([]);
  const [hotBooks, setHotBooks] = useState([]);
  const [userBorrowRanking, setUserBorrowRanking] = useState([]);
  const [stockStats, setStockStats] = useState({
    total_books: 0,
    total_stock: 0,
    available_stock: 0,
    borrowed_stock: 0,
  });
  const [overdueStats, setOverdueStats] = useState({
    total_overdue: 0,
    overdue_amount: 0,
  });
  const [categoryStats, setCategoryStats] = useState([]);

  const tabs = [
    { label: '借阅统计', value: 'borrow' },
    { label: '热门图书', value: 'hotbooks' },
    { label: '用户排行', value: 'userranking' },
    { label: '库存统计', value: 'stock' },
    { label: '逾期统计', value: 'overdue' },
    { label: '分类统计', value: 'category' },
  ];

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      
      const [borrowRes, hotBooksRes, userRankingRes, stockRes, overdueRes, categoryRes] = await Promise.all([
        statsApi.getBorrowStats(30),
        statsApi.getHotBooksRanking(10),
        statsApi.getUserBorrowRanking(10),
        statsApi.getStockStats(),
        statsApi.getOverdueStats(),
        statsApi.getCategoryStats(),
      ]);

      if (borrowRes.data.code === 200) {
        setBorrowStats(borrowRes.data.data || []);
      }
      if (hotBooksRes.data.code === 200) {
        setHotBooks(hotBooksRes.data.data || []);
      }
      if (userRankingRes.data.code === 200) {
        setUserBorrowRanking(userRankingRes.data.data || []);
      }
      if (stockRes.data.code === 200) {
        setStockStats(stockRes.data.data || {
          total_books: 0,
          total_stock: 0,
          available_stock: 0,
          borrowed_stock: 0,
        });
      }
      if (overdueRes.data.code === 200) {
        setOverdueStats(overdueRes.data.data || {
          total_overdue: 0,
          overdue_amount: 0,
        });
      }
      if (categoryRes.data.code === 200) {
        setCategoryStats(categoryRes.data.data || []);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const stockPieData = [
    { name: '可借图书', value: stockStats.available_stock || 0 },
    { name: '已借出', value: stockStats.borrowed_stock || 0 },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        统计分析
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

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                借阅趋势（近30天）
              </Typography>
              {borrowStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={borrowStats}>
                    <defs>
                      <linearGradient id="colorBorrow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#66bb6a" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#66bb6a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="borrow_count"
                      stroke="#1976d2"
                      fillOpacity={1}
                      fill="url(#colorBorrow)"
                      name="借阅数"
                    />
                    <Area
                      type="monotone"
                      dataKey="return_count"
                      stroke="#66bb6a"
                      fillOpacity={1}
                      fill="url(#colorReturn)"
                      name="归还数"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">暂无借阅统计数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                热门图书排行
              </Typography>
              {hotBooks.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hotBooks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="title" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="borrow_count" fill="#1976d2" name="借阅次数" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Book sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">暂无热门图书数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                排行榜
              </Typography>
              {hotBooks.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {hotBooks.slice(0, 5).map((book, index) => (
                    <Box key={book.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'text.secondary' : index === 2 ? 'error.main' : 'primary.light',
                          width: 32,
                          height: 32,
                          fontSize: 16,
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {book.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          借阅 {book.borrow_count} 次
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">暂无数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                用户借阅排行
              </Typography>
              {userBorrowRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={userBorrowRanking}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="username" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="borrow_count" fill="#42a5f5" name="借阅次数" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">暂无用户借阅排行数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                排行详情
              </Typography>
              {userBorrowRanking.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {userBorrowRanking.slice(0, 10).map((user, index) => (
                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'text.secondary' : index === 2 ? 'error.main' : 'success.light',
                          width: 32,
                          height: 32,
                          fontSize: 14,
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">
                          {user.nickname || user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          借阅 {user.borrow_count} 次
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">暂无数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Book />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stockStats.total_books}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      图书种类
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <LocalLibrary />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stockStats.total_stock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      总库存
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <Book />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stockStats.available_stock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      可借数量
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <LocalLibrary />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stockStats.borrowed_stock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      已借出
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                库存分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#66bb6a" />
                    <Cell fill="#ff9800" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main', mr: 2, width: 56, height: 56 }}>
                    <Warning sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {overdueStats.total_overdue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      逾期图书数量
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 56, height: 56 }}>
                    <LocalLibrary sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ¥{overdueStats.overdue_amount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      逾期罚款总额
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                逾期管理提示
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body1">
                  目前有 <strong>{overdueStats.total_overdue}</strong> 本图书已逾期，涉及罚款金额 <strong>¥{overdueStats.overdue_amount || 0}</strong>。
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  请及时通知相关用户归还图书或处理逾期事宜。
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                分类图书数量统计
              </Typography>
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="图书数量" radius={[4, 4, 0, 0]}>
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Category sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">暂无分类统计数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                分类占比
              </Typography>
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
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
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">暂无数据</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Stats;
