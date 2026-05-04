import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Avatar,
  Paper,
  CircularProgress,
  IconButton,
  Divider,
  Drawer,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Add,
  Delete,
  Menu,
} from '@mui/icons-material';
import { aiApi } from '../services/api';

const drawerWidth = 240;

function AIChat() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await aiApi.getSessions();
      if (response.data.code === 200) {
        const sessionList = response.data.data || [];
        setSessions(sessionList);
        if (sessionList.length > 0 && !currentSession) {
          selectSession(sessionList[0]);
        }
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (session) => {
    setCurrentSession(session);
    setMobileOpen(false);
    try {
      const response = await aiApi.getSessionMessages(session.session_id);
      if (response.data.code === 200) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('获取会话消息失败:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await aiApi.createSession({ title: '' });
      if (response.data.code === 200) {
        const newSession = response.data.data;
        setSessions([newSession, ...sessions]);
        setCurrentSession(newSession);
        setMessages([]);
        setInputText('');
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      setSnackbar({ open: true, message: '创建会话失败', severity: 'error' });
    }
  };

  const deleteSession = async (sessionId, event) => {
    event.stopPropagation();
    try {
      const response = await aiApi.deleteSession(sessionId);
      if (response.data.code === 200) {
        const newSessions = sessions.filter(s => s.session_id !== sessionId);
        setSessions(newSessions);
        if (currentSession?.session_id === sessionId) {
          if (newSessions.length > 0) {
            selectSession(newSessions[0]);
          } else {
            setCurrentSession(null);
            setMessages([]);
          }
        }
        setSnackbar({ open: true, message: '会话已删除', severity: 'success' });
      }
    } catch (error) {
      console.error('删除会话失败:', error);
      setSnackbar({ open: true, message: '删除会话失败', severity: 'error' });
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await aiApi.chat({
        session_id: currentSession?.session_id || '',
        message: messageToSend,
      });

      if (response.data.code === 200) {
        const data = response.data.data;
        
        if (!currentSession) {
          const newSession = {
            session_id: data.session_id,
            title: messageToSend.length > 30 ? messageToSend.substring(0, 30) + '...' : messageToSend,
            created_at: new Date().toISOString(),
          };
          setCurrentSession(newSession);
          setSessions([newSession, ...sessions]);
        }

        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.message,
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (currentSession) {
          setSessions(prev => prev.map(s => 
            s.session_id === currentSession.session_id 
              ? { ...s, updated_at: new Date().toISOString() }
              : s
          ));
        }
      } else {
        setSnackbar({ open: true, message: response.data.message || '发送消息失败', severity: 'error' });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || '发送消息失败', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          对话列表
        </Typography>
        <Tooltip title="新建对话">
          <IconButton onClick={createNewSession} color="primary">
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List sx={{ overflow: 'auto', flex: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              暂无对话记录
            </Typography>
          </Box>
        ) : (
          sessions.map((session) => (
            <ListItem
              key={session.session_id}
              secondaryAction={
                <Tooltip title="删除对话">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => deleteSession(session.session_id, e)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
              disablePadding
            >
              <ListItemButton
                selected={currentSession?.session_id === session.session_id}
                onClick={() => selectSession(session)}
              >
                <ListItemIcon>
                  <SmartToy />
                </ListItemIcon>
                <ListItemText
                  primary={session.title || '新对话'}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontSize: 'small',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)', minHeight: 500 }}>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              position: 'relative',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { sm: 2 } }}>
        <Paper
          elevation={2}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            p: 2,
            mb: 2,
          }}
        >
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            AI助手
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {(!currentSession && messages.length === 0) ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
              }}
            >
              <SmartToy sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                欢迎使用图书馆AI助手
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                我可以帮您解答关于图书、阅读和图书馆服务的问题
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                试试问："推荐一些好书" 或 "如何借阅图书"
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={createNewSession}
              >
                开始新对话
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      发送一条消息开始对话吧
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {message.role === 'assistant' && (
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            <SmartToy sx={{ fontSize: 20 }} />
                          </Avatar>
                        )}
                        <Paper
                          elevation={1}
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                            color: message.role === 'user' ? 'white' : 'text.primary',
                            borderRadius: message.role === 'user'
                              ? '20px 20px 0 20px'
                              : '20px 20px 20px 0',
                          }}
                        >
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 1,
                              opacity: 0.7,
                              color: message.role === 'user' ? 'white' : 'text.secondary',
                            }}
                          >
                            {new Date(message.created_at).toLocaleTimeString()}
                          </Typography>
                        </Paper>
                        {message.role === 'user' && (
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                            <Person sx={{ fontSize: 20 }} />
                          </Avatar>
                        )}
                      </Box>
                    ))}
                    {sending && (
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                          <SmartToy sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            bgcolor: 'background.paper',
                            borderRadius: '20px 20px 20px 0',
                          }}
                        >
                          <CircularProgress size={20} />
                        </Paper>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              <Divider />

              <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="输入您的问题..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  multiline
                  maxRows={3}
                  size="small"
                />
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sending}
                  sx={{ height: 'fit-content', minHeight: 40 }}
                >
                  发送
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>

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

export default AIChat;
