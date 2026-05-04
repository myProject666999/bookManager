import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { Search, Star } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookApi } from '../services/api';

function BookSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'new');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pageSize] = useState(12);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, keyword, categoryId, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await bookApi.getAllCategories();
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.category_id = categoryId;
      if (sortBy) params.sort_by = sortBy;

      const response = await bookApi.searchBooks(params);
      if (response.data.code === 200) {
        setBooks(response.data.data.list || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('搜索图书失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    updateSearchParams();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (categoryId) params.category = categoryId;
    if (sortBy) params.sort = sortBy;
    if (page > 1) params.page = page;
    setSearchParams(params);
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const getBookCover = (book) => {
    return book.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + book.title)}&image_size=portrait_4_3`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        图书搜索
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="搜索关键词"
              variant="outlined"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入书名、作者或标签..."
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>分类</InputLabel>
              <Select
                value={categoryId}
                label="分类"
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              >
                <MenuItem value="">全部</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>排序</InputLabel>
              <Select
                value={sortBy}
                label="排序"
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <MenuItem value="new">最新上架</MenuItem>
                <MenuItem value="hot">借阅最多</MenuItem>
                <MenuItem value="rating">评分最高</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              sx={{ height: 56 }}
            >
              搜索
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            暂无图书数据
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            请尝试其他搜索条件
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {books.map((book) => (
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
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <Star sx={{ color: '#ffb400', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {book.average_rating?.toFixed(1) || '暂无'}
                          </Typography>
                        </Box>
                        {book.category && (
                          <Chip
                            label={book.category.name}
                            size="small"
                            sx={{ bgcolor: '#e3f2fd', color: 'primary.main' }}
                          />
                        )}
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          库存: {book.available_stock}/{book.total_stock} | 借阅: {book.borrow_count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default BookSearch;
