import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardMedia,
  Chip,
  Button,
  Divider,
  TextField,
  Rating,
  Avatar,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Star,
  LocalLibrary,
  BookmarkAdded,
  Chat,
  ThumbUp,
  ArrowBack,
  Close,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi, borrowApi, reserveApi, commentApi } from '../services/api';

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(5);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [borrowDialog, setBorrowDialog] = useState(false);
  const [reserveDialog, setReserveDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookDetail();
    fetchComments();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookDetail(id);
      if (response.data.code === 200) {
        setBook(response.data.data);
      }
    } catch (error) {
      console.error('获取图书详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await bookApi.getBookComments(id, { page: commentPage, page_size: 10 });
      if (response.data.code === 200) {
        setComments(prev => commentPage === 1 ? response.data.data.list : [...prev, ...response.data.data.list]);
        setCommentTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      setActionLoading(true);
      const response = await borrowApi.borrowBook(parseInt(id));
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '借阅成功！', severity: 'success' });
        setBorrowDialog(false);
        fetchBookDetail();
      } else {
        setSnackbar({ open: true, message: response.data.message || '借阅失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '借阅失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    try {
      setActionLoading(true);
      const response = await reserveApi.reserveBook(parseInt(id));
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '预约成功！', severity: 'success' });
        setReserveDialog(false);
        fetchBookDetail();
      } else {
        setSnackbar({ open: true, message: response.data.message || '预约失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '预约失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setSnackbar({ open: true, message: '请输入评论内容', severity: 'warning' });
      return;
    }

    try {
      const response = await commentApi.addComment({
        book_id: parseInt(id),
        content: commentText,
        rating: rating,
      });
      if (response.data.code === 200) {
        setSnackbar({ open: true, message: '评论成功！', severity: 'success' });
        setCommentText('');
        setRating(5);
        setCommentPage(1);
        fetchComments();
        fetchBookDetail();
      } else {
        setSnackbar({ open: true, message: response.data.message || '评论失败', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || '评论失败', severity: 'error' });
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await commentApi.likeComment(commentId);
      if (response.data.code === 200) {
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likes: c.likes + 1 } : c
        ));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const getBookCover = () => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!book) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          图书不存在
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/books')}>
          返回搜索
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        返回
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={getBookCover()}
              alt={book.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            {book.title}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              作者: {book.author || '未知'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              出版社: {book.publisher || '未知'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              出版日期: {book.publish_date || '未知'}
            </Typography>
            {book.isbn && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                ISBN: {book.isbn}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {book.category && (
              <Chip
                label={book.category.name}
                color="primary"
                size="medium"
              />
            )}
            {book.is_hot && (
              <Chip
                label="热门"
                color="error"
                size="medium"
                icon={<Star sx={{ fontSize: 16 }} />}
              />
            )}
            {book.is_recommend && (
              <Chip
                label="推荐"
                color="success"
                size="medium"
              />
            )}
            {book.tags && book.tags.split(',').map((tag, index) => (
              <Chip
                key={index}
                label={tag.trim()}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating
                value={book.average_rating || 0}
                readOnly
                precision={0.5}
              />
              <Typography variant="body1" sx={{ ml: 1 }}>
                {book.average_rating?.toFixed(1) || '暂无'} 分
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({book.comment_count} 条评论)
              </Typography>
            </Box>
          </Box>

          <Paper sx={{ p: 2, mb: 3, bgcolor: '#fafafa' }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  总库存
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {book.total_stock}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  可借
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: book.available_stock > 0 ? 'success.main' : 'error.main' }}>
                  {book.available_stock}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  借阅次数
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {book.borrow_count}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  预约次数
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {book.reserve_count}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LocalLibrary />}
              onClick={() => setBorrowDialog(true)}
              disabled={book.available_stock <= 0}
              sx={{ minWidth: 140 }}
            >
              借阅图书
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<BookmarkAdded />}
              onClick={() => setReserveDialog(true)}
              sx={{ minWidth: 140 }}
            >
              预约图书
            </Button>
          </Box>

          {book.description && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                图书简介
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {book.description}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          发表评论
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              评分:
            </Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="分享您的阅读感受..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<Chat />}
            onClick={handleSubmitComment}
          >
            提交评论
          </Button>
        </Paper>
      </Box>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          读者评论 ({commentTotal})
        </Typography>
        {comments.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              暂无评论，快来发表第一条评论吧！
            </Typography>
          </Paper>
        ) : (
          <List>
            {comments.map((comment) => (
              <Paper key={comment.id} sx={{ mb: 2, p: 2 }}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {comment.user?.nickname?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2">
                          {comment.user?.nickname || comment.user?.username || '用户'}
                        </Typography>
                        <Rating value={comment.rating} readOnly size="small" />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                          {comment.content}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.created_at).toLocaleString()}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleLikeComment(comment.id)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ThumbUp sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption">{comment.likes}</Typography>
                          </IconButton>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
        {comments.length < commentTotal && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => { setCommentPage(p => p + 1); fetchComments(); }}
              disabled={commentsLoading}
            >
              {commentsLoading ? <CircularProgress size={20} /> : '加载更多'}
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={borrowDialog} onClose={() => setBorrowDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            确认借阅
            <IconButton onClick={() => setBorrowDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要借阅《{book.title}》吗？
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 借阅期限: 30天
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 最多可续借: 2次
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 逾期每天罚款: 0.5元
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrowDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleBorrow} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认借阅'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reserveDialog} onClose={() => setReserveDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            确认预约
            <IconButton onClick={() => setReserveDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            您确认要预约《{book.title}》吗？
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 预约有效期: 7天
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 图书到馆后会收到通知
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialog(false)}>取消</Button>
          <Button variant="contained" onClick={handleReserve} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : '确认预约'}
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

export default BookDetail;
