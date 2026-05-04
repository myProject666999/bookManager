import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  Category,
  Book as BookIcon,
  LocalLibrary,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookApi } from '../services/api';

function Home() {
  const [hotBooks, setHotBooks] = useState([]);
  const [recommendBooks, setRecommendBooks] = useState([]);
  const [hotCategories, setHotCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hotRes, recommendRes, categoriesRes] = await Promise.all([
        bookApi.getHotBooks(8),
        bookApi.getRecommendBooks(8),
        bookApi.getHotCategories(6),
      ]);

      if (hotRes.data.code === 200) {
        setHotBooks(hotRes.data.data || []);
      }
      if (recommendRes.data.code === 200) {
        setRecommendBooks(recommendRes.data.data || []);
      }
      if (categoriesRes.data.code === 200) {
        setHotCategories(categoriesRes.data.data || []);
      }
    } catch (err) {
      setError('加载数据失败，请刷新页面重试');
      console.error('获取首页数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/books?category=${categoryId}`);
  };

  const getBookCover = (book) => {
    return book.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + book.title)}&image_size=portrait_4_3`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchData}>
            重试
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              欢迎来到图书馆
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              探索知识的海洋，发现阅读的乐趣
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                onClick={() => navigate('/books')}
                startIcon={<BookIcon />}
              >
                搜索图书
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: '#e3f2fd', bgcolor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => navigate('/borrows')}
                startIcon={<LocalLibrary />}
              >
                我的借阅
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <Box sx={{ width: 200, height: 200, position: 'relative' }}>
              <Box
                component="img"
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stack%20of%20books%20with%20open%20book%20flying%20pages&image_size=square"
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid rgba(255,255,255,0.3)',
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            热门图书
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {hotBooks.map((book) => (
            <Grid item key={book.id} xs={6} sm={4} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea onClick={() => handleBookClick(book.id)}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getBookCover(book)}
                    alt={book.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {book.author}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ color: '#ffb400', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {book.average_rating?.toFixed(1) || '暂无'}
                      </Typography>
                      <Chip
                        label={`借阅 ${book.borrow_count}`}
                        size="small"
                        sx={{ ml: 1, bgcolor: '#e3f2fd', color: 'primary.main' }}
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Star sx={{ color: '#ffb400', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            推荐图书
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {recommendBooks.map((book) => (
            <Grid item key={book.id} xs={6} sm={4} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea onClick={() => handleBookClick(book.id)}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getBookCover(book)}
                    alt={book.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {book.author}
                    </Typography>
                    {book.category && (
                      <Chip
                        label={book.category.name}
                        size="small"
                        sx={{ mt: 1, bgcolor: '#fff3e0', color: '#e65100' }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Category sx={{ color: 'secondary.main', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            热门分类
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {hotCategories.map((category) => (
            <Grid item key={category.id} xs={6} sm={4} md={2}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleCategoryClick(category.id)}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {category.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {category.book_count} 本图书
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default Home;
