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
  Rating,
  CircularProgress,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import {
  Chat,
  ThumbUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { commentApi } from '../services/api';

function MyComments() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentApi.getMyComments({ page, page_size: 10 });
      if (response.data.code === 200) {
        const newComments = response.data.data.list || [];
        setComments(prev => page === 1 ? newComments : [...prev, ...newComments]);
        setHasMore(newComments.length >= 10);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
    fetchComments();
  };

  const getBookCover = (book) => {
    return book?.cover || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('book cover ' + (book?.title || ''))}&image_size=portrait_4_3`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        我的评论
      </Typography>

      {loading && comments.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无评论记录
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            快去借阅图书并发表评论吧
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/books')}
          >
            去借书
          </Button>
        </Box>
      ) : (
        <Box>
          <List>
            {comments.map((comment) => (
              <Paper key={comment.id} sx={{ mb: 2, p: 2 }}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Avatar
                      src={getBookCover(comment.book)}
                      sx={{ width: 60, height: 80, borderRadius: 1, cursor: 'pointer' }}
                      onClick={() => navigate(`/books/${comment.book_id}`)}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          onClick={() => navigate(`/books/${comment.book_id}`)}
                        >
                          {comment.book?.title}
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
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <ThumbUp sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">{comment.likes}</Typography>
                            </IconButton>
                          </Box>
                          {comment.status === 0 && (
                            <Chip label="已删除" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>

          {hasMore && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : '加载更多'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default MyComments;
