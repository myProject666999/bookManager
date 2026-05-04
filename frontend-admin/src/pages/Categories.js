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
  Card,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Close,
  Category,
  Book,
} from '@mui/icons-material';
import { bookApi } from '../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getCategories();
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      const response = await bookApi.deleteCategory(deletingCategory.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '删除成功', severity: 'success' });
        setDeleteDialogOpen(false);
        fetchCategories();
      } else {
        setSnackbar({ open: true, message: response.data.message || '删除失败', severity: 'error' });
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '删除失败', severity: 'error' });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      setSnackbar({ open: true, message: '请输入分类名称', severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      let response;

      if (editingCategory) {
        response = await bookApi.updateCategory(editingCategory.id, formData);
      } else {
        response = await bookApi.createCategory(formData);
      }

      if (response.data.code === 200) {
        setSnackbar({ open: true, message: editingCategory ? '修改成功' : '添加成功', severity: 'success' });
        setDialogOpen(false);
        fetchCategories();
      } else {
        setSnackbar({ open: true, message: response.data.message || '操作失败', severity: 'error' });
      }
    } catch (error) {
      console.error('保存分类失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '操作失败', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const categoryColors = [
    'primary', 'secondary', 'success', 'warning', 'error', 'info',
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          分类管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          添加分类
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Category sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无分类数据
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            添加第一个分类
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category, index) => (
            <Grid item key={category.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ fontSize: 40, color: `${categoryColors[index % categoryColors.length]}.main`, mr: 2 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={`${category.book_count || 0} 本图书`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<Book sx={{ fontSize: 16 }} />}
                      />
                    </Box>
                  </Box>
                  {category.description && (
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    创建时间: {category.created_at ? new Date(category.created_at).toLocaleDateString() : '未知'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Tooltip title="编辑">
                    <IconButton size="small" onClick={() => handleEdit(category)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(category)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {editingCategory ? '编辑分类' : '添加分类'}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="name"
              label="分类名称"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
              placeholder="请输入分类名称"
            />
            <TextField
              name="description"
              label="分类描述"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              placeholder="请输入分类描述（可选）"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name}
          >
            {saving ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            您确定要删除分类「{deletingCategory?.name}」吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {deletingCategory?.book_count > 0 
              ? `该分类下有 ${deletingCategory.book_count} 本图书，删除后图书将变为未分类`
              : '此操作不可恢复'}
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

export default Categories;
