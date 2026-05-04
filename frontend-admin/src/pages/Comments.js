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
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search,
  Chat,
  Delete,
  Visibility,
  Close,
  ThumbUp,
} from '@mui/icons-material';
import { commentApi } from '../services/api';

function Comments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10 });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [searchParams]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentApi.getComments(searchParams);
      if (response.data.code === 200) {
        const data = response.data.data;
        setComments(data.list || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.page_size || 10,
        });
      }
    } catch (error) {
      console.error('获取评论列表失败:', error);
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

  const handleViewDetail = (comment) => {
    setSelectedComment(comment);
    setDetailDialogOpen(true);
  };

  const handleDeleteClick = (comment) => {
    setSelectedComment(comment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedComment) return;
    try {
      setActionLoading(true);
      const response = await commentApi.deleteComment(selectedComment.id);
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '删除成功', severity: 'success' });
        setDeleteDialogOpen(false);
        fetchComments();
      } else {
        setSnackbar({ open: true, message: response.data.message || '删除失败', severity: 'error' });
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '删除失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  const getStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="warning.main">
          {'★'.repeat(fullStars)}
          {hasHalfStar && '☆'}
          {'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
        </Typography>
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          {rating}/5
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        评论管理
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              name="keyword"
              label="关键词"
              placeholder="搜索评论内容、书名、用户名"
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
              onClick={fetchComments}
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
      ) : comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无评论数据
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {comments.map((comment) => (
              <Grid item key={comment.id} xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56 }}>
                        {comment.user?.nickname?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {comment.user?.nickname || comment.user?.username}
                            </Typography>
                            {comment.rating > 0 && getStarRating(comment.rating)}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="查看详情">
                              <IconButton size="small" onClick={() => handleViewDetail(comment)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除评论">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(comment)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {comment.book && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, display: 'flex', gap: 2 }}>
                        <Box
                          component="img"
                          sx={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 1 }}
                          src={getBookCover(comment.book)}
                          alt={comment.book?.title}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            《{comment.book?.title}》
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            作者: {comment.book?.author || '未知'}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {comment.content}
                    </Typography>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          icon={<ThumbUp sx={{ fontSize: 16 }} />}
                          label={comment.like_count || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        发布时间: {comment.created_at ? new Date(comment.created_at).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                  </CardContent>
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

      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>评论详情</DialogTitle>
        <DialogContent>
          {selectedComment && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64 }}>
                  {selectedComment.user?.nickname?.charAt(0) || selectedComment.user?.username?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedComment.user?.nickname || selectedComment.user?.username}
                  </Typography>
                  {selectedComment.rating > 0 && getStarRating(selectedComment.rating)}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    发布时间: {selectedComment.created_at ? new Date(selectedComment.created_at).toLocaleString() : '-'}
                  </Typography>
                </Box>
              </Box>

              {selectedComment.book && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    评论图书
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      component="img"
                      sx={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 1 }}
                      src={getBookCover(selectedComment.book)}
                      alt={selectedComment.book?.title}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {selectedComment.book?.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        作者: {selectedComment.book?.author || '未知'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ISBN: {selectedComment.book?.isbn || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  评论内容
                </Typography>
                <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedComment.content}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<ThumbUp sx={{ fontSize: 16 }} />}
                  label={`${selectedComment.like_count || 0} 个赞`}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setDetailDialogOpen(false);
              setDeleteDialogOpen(true);
            }}
            startIcon={<Delete />}
          >
            删除评论
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            您确定要删除这条评论吗？
          </Typography>
          {selectedComment && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                评论人: {selectedComment.user?.nickname || selectedComment.user?.username}
              </Typography>
              <Typography variant="body2" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                内容: {selectedComment.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认删除'}
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

export default Comments;
