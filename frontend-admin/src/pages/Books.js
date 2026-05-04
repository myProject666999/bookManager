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
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Close,
  Book,
  Category,
} from '@mui/icons-material';
import { bookApi } from '../services/api';

function Books() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    category_id: '',
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: '',
    description: '',
    cover: '',
    total_stock: 0,
    available_stock: 0,
    publisher: '',
    publish_date: '',
    pages: 0,
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [searchParams]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBooks(searchParams);
      if (response.data.code === 200) {
        const data = response.data.data;
        setBooks(data.list || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.page_size || 10,
        });
      }
    } catch (error) {
      console.error('获取图书列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await bookApi.getCategories();
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (e, page) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleAdd = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category_id: '',
      description: '',
      cover: '',
      total_stock: 0,
      available_stock: 0,
      publisher: '',
      publish_date: '',
      pages: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category_id: book.category_id || '',
      description: book.description || '',
      cover: book.cover || '',
      total_stock: book.total_stock || 0,
      available_stock: book.available_stock || 0,
      publisher: book.publisher || '',
      publish_date: book.publish_date || '',
      pages: book.pages || 0,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (book) => {
    setDeletingBook(book);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    try {
      const response = await bookApi.deleteBook(deletingBook.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '删除成功', severity: 'success' });
        setDeleteDialogOpen(false);
        fetchBooks();
      } else {
        setSnackbar({ open: true, message: response.data.message || '删除失败', severity: 'error' });
      }
    } catch (error) {
      console.error('删除图书失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '删除失败', severity: 'error' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      setSnackbar({ open: true, message: '请输入书名', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      let response;

      if (editingBook) {
        response = await bookApi.updateBook(editingBook.id, formData);
      } else {
        response = await bookApi.createBook(formData);
      }

      if (response.data.code === 200) {
        setSnackbar({ open: true, message: editingBook ? '修改成功' : '添加成功', severity: 'success' });
        setDialogOpen(false);
        fetchBooks();
      } else {
        setSnackbar({ open: true, message: response.data.message || '操作失败', severity: 'error' });
      }
    } catch (error) {
      console.error('保存图书失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '操作失败', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '未分类';
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          图书管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          添加图书
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              name="keyword"
              label="关键词"
              placeholder="搜索书名、作者、ISBN"
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
            <FormControl fullWidth size="small">
              <InputLabel>分类</InputLabel>
              <Select
                name="category_id"
                value={searchParams.category_id}
                onChange={handleSearchChange}
                label="分类"
              >
                <MenuItem value="">全部分类</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              onClick={fetchBooks}
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
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Book sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无图书数据
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            添加第一本图书
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getBookCover(book)}
                    alt={book.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {book.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      作者: {book.author || '未知'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip
                        size="small"
                        label={getCategoryName(book.category_id)}
                      />
                      <Chip
                        size="small"
                        label={`库存: ${book.total_stock}`}
                        color={book.available_stock > 0 ? 'success' : 'default'}
                      />
                      <Chip
                        size="small"
                        label={`可借: ${book.available_stock}`}
                        color={book.available_stock > 0 ? 'primary' : 'error'}
                      />
                    </Box>
                    {book.description && (
                      <Typography variant="body2" color="text.secondary" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {book.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Tooltip title="编辑">
                      <IconButton size="small" onClick={() => handleEdit(book)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(book)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {editingBook ? '编辑图书' : '添加图书'}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="title"
                label="书名"
                value={formData.title}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="author"
                label="作者"
                value={formData.author}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="isbn"
                label="ISBN"
                value={formData.isbn}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>分类</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleFormChange}
                  label="分类"
                >
                  <MenuItem value="">请选择分类</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="total_stock"
                label="总库存"
                type="number"
                value={formData.total_stock}
                onChange={handleFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="available_stock"
                label="可借数量"
                type="number"
                value={formData.available_stock}
                onChange={handleFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="pages"
                label="页数"
                type="number"
                value={formData.pages}
                onChange={handleFormChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="publisher"
                label="出版社"
                value={formData.publisher}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="publish_date"
                label="出版日期"
                type="date"
                value={formData.publish_date}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="cover"
                label="封面图片URL"
                value={formData.cover}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="图书简介"
                value={formData.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            您确定要删除图书《{deletingBook?.title}》吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            此操作不可恢复
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            确认删除
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

export default Books;
