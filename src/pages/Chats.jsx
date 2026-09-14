import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { 
  Box, Typography, Avatar, Card, CardContent, 
  List, ListItem, Divider, Badge, TextField, InputAdornment,
  Button, Paper, IconButton, Popover, ClickAwayListener
} from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import notificationSoundFile from "../../src/notification-sound-effect-372475.mp3";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  Audiotrack as AudioIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// تعريف الألوان الجديدة
const colorPalette = {
  primary: '#80b49e',
  primaryLight: '#a8c9bb',
  primaryDark: '#5a8f7a',
  primaryLighter: '#e1efe9',
  textDark: '#2d4a3e',
  textLight: '#5a7a6a',
  background: '#f8fbf9',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const Chats = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [audioChunks, setAudioChunks] = useState([]);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  // Scroll management state
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);
  const [newMessageNotifications, setNewMessageNotifications] = useState({});
  const notificationSound = useRef(null);

  // Scroll handler
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const element = messagesContainerRef.current;
    const threshold = 100;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;
    
    setIsNearBottom(atBottom);
    setShowScrollButton(!atBottom);
  };

  // Initialize scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Improved scroll-to-bottom function
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setIsNearBottom(true);
      setShowScrollButton(false);
    }
  };

  // Handle messages changes
  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length > prevMessagesLength) {
      if (isNearBottom) {
        scrollToBottom();
      }
    } 
    else if (messages.length !== prevMessagesLength) {
      scrollToBottom('auto');
    }

    setPrevMessagesLength(messages.length);
  }, [messages]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    
    const fetchInitialData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('https://api1.sstli.com/api/userinfo');
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Initialize unread messages count
        const initialUnread = {};
        usersData.forEach(user => {
          initialUnread[user.guid] = 0;
        });
        setUnreadMessages(initialUnread);
        
        // Fetch conversations with unread counts
        if (userData?.guid) {
          const convResponse = await fetch(`https://filesregsiteration.sstli.com/get_unread_messages.php?user_guid=${userData.guid}`);
          const convData = await convResponse.json();
          if (convData.success) {
            setConversations(convData.conversations);
            // Update unread counts
            const updatedUnread = {...initialUnread};
            convData.conversations.forEach(conv => {
              updatedUnread[conv.other_user_guid] = conv.unread_count;
            });
            setUnreadMessages(updatedUnread);
          }
        }

        // Fetch all messages sent/received by current user
        const allMsgsResponse = await fetch(`https://filesregsiteration.sstli.com/get_all_user_messages.php?user_guid=${userData.guid}`);
        const allMsgsData = await allMsgsResponse.json();
        if (allMsgsData.success) {
          const processed = allMsgsData.messages.map(m => ({
            ...m,
            created_at: new Date(m.created_at)
          }));
          setAllMessages(processed);
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
  
    const interval = setInterval(() => {
      handleUserClick(selectedUser);
    }, 2000);
  
    return () => clearInterval(interval);
  }, [selectedUser]);

  const fetchMessages = async (userGuid, isBackgroundUpdate = false) => {
    if (!userGuid || !currentUser) return;

    try {
      const response = await fetch(`https://filesregsiteration.sstli.com/get_messages.php?sender=${currentUser.guid}&receiver=${userGuid}`);
      const data = await response.json();

      if (data.success) {
        const processedMessages = data.messages.map(msg => {
          let fileUrl = null;
          if ((msg.file_url && msg.message_type === 'file') || msg.message_type === 'audio') {
            const encodedPath = encodeURI(msg.file_url || msg.file_path);
            fileUrl = `https://filesregsiteration.sstli.com/${encodedPath}`;
          }

          return {
            ...msg,
            created_at: new Date(msg.created_at),
            file_url: fileUrl
          };
        });

        if (!isBackgroundUpdate || selectedUser?.guid === userGuid) {
          if (processedMessages.length > 0) {
            const newestMessageTime = new Date(Math.max(...processedMessages.map(m => new Date(m.created_at))));
            setLastMessageTime(newestMessageTime);
          }
          
          setMessages(processedMessages);
        }

        if (isBackgroundUpdate && processedMessages.length > 0) {
          const lastMessage = processedMessages[processedMessages.length - 1];
          if (lastMessage.sender_guid !== currentUser.guid) {
            setNewMessageNotifications(prev => ({
              ...prev,
              [userGuid]: (prev[userGuid] || 0) + 1
            }));
            
            if (notificationSound.current) {
              try {
                notificationSound.current.currentTime = 0;
                notificationSound.current.volume = 0.3;
                
                const playPromise = notificationSound.current.play();
                
                if (playPromise !== undefined) {
                  playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                    }
                  });
                }
              } catch (error) {
              }
            }
          }
        }

        await markMessagesAsRead(userGuid);
        
        setConversations(prev => prev.map(conv => 
          conv.other_user_guid === userGuid 
            ? { ...conv, unread_count: 0 } 
            : conv
        ));
        
        setUnreadMessages(prev => ({
          ...prev,
          [userGuid]: 0
        }));
      }
    } catch (error) {
    }
  };
  
  useEffect(() => {
    if (!currentUser?.guid) return;
  
    const checkForNewMessages = async () => {
      try {
        const convResponse = await fetch(`https://filesregsiteration.sstli.com/get_unread_messages.php?user_guid=${currentUser.guid}`);
        const convData = await convResponse.json();
        
        if (convData.success) {
          setConversations(convData.conversations);
          
          convData.conversations.forEach(conv => {
            if (conv.unread_count > 0) {
              fetchMessages(conv.other_user_guid, true);
            }
          });
        }
      } catch (error) {
      }
    };
  
    const interval = setInterval(checkForNewMessages, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser?.guid]);

  useEffect(() => {
    notificationSound.current = new Audio(notificationSoundFile);
    notificationSound.current.load();
    
    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);

  const markMessagesAsRead = async (senderGuid) => {
    try {
      await fetch(`https://filesregsiteration.sstli.com/mark_messages_as_read.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_guid: currentUser.guid,
          sender_guid: senderGuid
        })
      });
    } catch (error) {
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    await markMessagesAsRead(user.guid);
    await fetchMessages(user.guid);
    
    setNewMessageNotifications(prev => ({...prev, [user.guid]: 0}));
  
    setConversations(prev => prev.map(conv => 
      conv.other_user_guid === user.guid 
        ? { ...conv, unread_count: 0 } 
        : conv
    ));
    setUnreadMessages(prev => ({
      ...prev,
      [user.guid]: 0
    }));
  };

  const getFilteredUsers = () => {
    return users
      .filter(user => 
        user.branchForWork === currentUser?.branchForWork && 
        user.guid !== currentUser?.guid &&
        (user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (user.userJop === 15 ? 'مدرب' : 'بائع').includes(searchTerm))
      )
      .map(user => {
        const userMessages = allMessages.filter(msg =>
          (msg.sender_guid === currentUser?.guid && msg.receiver_guid === user.guid) ||
          (msg.receiver_guid === currentUser?.guid && msg.sender_guid === user.guid)
        );
      
        const lastMsg = userMessages.length > 0 
          ? new Date(Math.max(...userMessages.map(m => m.created_at)))
          : null;
      
        return {
          ...user,
          lastMessage: lastMsg,
          unreadCount: unreadMessages[user.guid] || 0
        };
      })
      .sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return b.lastMessage - a.lastMessage;
        }
        if (a.lastMessage) return -1;
        if (b.lastMessage) return 1;
        return 0;
      });
  };

  const handleSendMessage = async () => {
    if ((message.trim() === '' && attachments.length === 0 && audioChunks.length === 0) || !selectedUser) {
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('sender_guid', currentUser.guid);
      formData.append('receiver_guid', selectedUser.guid);
      formData.append('content', message);
      
      let messageType = 'text';
      let fileName = null;
      let fileType = null;
  
      if (attachments.length > 0) {
        messageType = 'file';
        formData.append('message_type', 'file');
        formData.append('file', attachments[0].file);
        fileName = attachments[0].name;
        fileType = attachments[0].type;
      } else if (audioChunks.length > 0) {
        messageType = 'audio';
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        formData.append('message_type', 'audio');
        formData.append('file', audioBlob, 'recording.wav');
        fileName = 'recording.wav';
        fileType = 'audio/wav';
      } else {
        formData.append('message_type', 'text');
      }
  
      const tempMessage = {
        id: Date.now(),
        sender_guid: currentUser.guid,
        receiver_guid: selectedUser.guid,
        content: message,
        message_type: messageType,
        file_name: fileName,
        file_type: fileType,
        created_at: new Date(),
        file_url: attachments.length > 0 ? URL.createObjectURL(attachments[0].file) : null
      };
  
      setMessages(prev => [...prev, tempMessage]);
      setMessage('');
      setAttachments([]);
      setAudioChunks([]);
  
      const response = await fetch('https://filesregsiteration.sstli.com/send_message.php', {
        method: 'POST',
        body: formData
      });
  
      const result = await response.json();
  
      if (result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                ...msg,
                id: result.message_id,
                file_url: result.file_path ? `https://filesregsiteration.sstli.com/${result.file_path}` : null,
                file_path: result.file_path || null
              }
            : msg
        ));
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error(result.error || 'Unknown server error');
      }
    } catch (error) {
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      type: file.type.split('/')[0],
      name: file.name,
      size: file.size,
      preview: file.type.startsWith('image') ? URL.createObjectURL(file) : null
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    URL.revokeObjectURL(newAttachments[index].preview);
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const startRecording = async () => {
    try {
      setAudioChunks([]);
      setAudioBlob(null);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data]);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      setIsRecording(false);
      setRecordingTime(0);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioChunks([]);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setEmojiAnchor(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFilePreview = (message) => {
    if (!message.file_url) return null;
  
    const fileExtension = message.file_name?.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
  
    return (
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        {isImage ? (
          <img
            src={message.file_url}
            alt={message.file_name}
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
            }}
          />
        ) : isAudio ? (
          <audio controls src={message.file_url} />
        ) : isPdf ? (
          <>
            <PdfIcon style={{ fontSize: 48, color: 'red' }} />
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => window.open(message.file_url, '_blank')}
            >
              View PDF
            </Button>
          </>
        ) : (
          <>
            <DocIcon style={{ fontSize: 48 }} />
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => window.open(message.file_url, '_blank')}
            >
              Download {fileExtension?.toUpperCase() || 'File'}
            </Button>
          </>
        )}
  
        {message.content && (
          <Typography variant="body2" mt={1}>
            {message.content}
          </Typography>
        )}
      </Box>
    );
  };

if (loading) {
  return (
    <NavigationShell variant="standard" ><>
      
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: colorPalette.background,
        ...navigationContentSx
      }}>
        <Typography sx={{ color: colorPalette.textDark }}>جاري التحميل...</Typography>
      </Box>
    </></NavigationShell>
  );
}

  return (
    <NavigationShell variant="standard" ><Box display="flex" height="90vh" dir="rtl">
      {/* Sidebar with fixed width */}
      
      
      {/* Main content */}
      <Box sx={navigationContentSx} display="flex" flex={1} height="99%" dir="rtl">
        {/* Users List */}
        <Box width="30%" bgcolor={colorPalette.background} p={2} overflow="auto" borderLeft="1px solid #e0e0e0">
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: colorPalette.textDark }}>
            <GroupIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} /> أعضاء الفريق ({getFilteredUsers().length})
          </Typography>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="ابحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colorPalette.primary }} />
                </InputAdornment>
              ),
            }}
          />
          
          <List>
  {getFilteredUsers().map((user) => (
    <React.Fragment key={user.guid}>
      <ListItem 
        sx={{ 
          cursor: 'pointer',
          '&:hover': { backgroundColor: colorPalette.primaryLighter },
          borderRadius: 1,
          px: 1,
          position: 'relative'
        }}
        onClick={() => {
          handleUserClick(user);
          setNewMessageNotifications(prev => ({...prev, [user.guid]: 0}));
        }}
      >
        {(user.unreadCount > 0 || newMessageNotifications[user.guid] > 0) && (
          <Badge 
            badgeContent={user.unreadCount + (newMessageNotifications[user.guid] || 0)} 
            color="error"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1
            }}
          />
        )}
        
        <Card sx={{ 
          width: '100%', 
          boxShadow: 2,
          borderInlineStart: (user.unreadCount > 0 || newMessageNotifications[user.guid] > 0) ? `3px solid ${colorPalette.error}` : 'none',
          backgroundColor: selectedUser?.guid === user.guid ? colorPalette.primaryLighter : 'white'
        }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <Avatar sx={{ bgcolor: colorPalette.primary, ml: 2 }}>
              {user.fullName.charAt(0)}
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorPalette.textDark }}>
                {user.fullName}
                {(user.unreadCount > 0 || newMessageNotifications[user.guid] > 0) && (
                  <NotificationsIcon color="error" sx={{ fontSize: 16, ml: 1 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ fontSize: 14, ml: 0.5, color: colorPalette.primary }} /> 
                {user.userJop === 14 ? 'مدرب' : 'اداري'}
              </Typography>
              {user.lastMessage && (
                <Typography variant="caption" color="text.secondary">
                  آخر رسالة: {user.lastMessage.toLocaleString()}
                </Typography>
              )}
            </Box>
            <IconButton sx={{ color: colorPalette.primary }} onClick={(e) => {
              e.stopPropagation();
              handleUserClick(user);
            }}>
              <Badge color="primary">
                <ChatIcon />
              </Badge>
            </IconButton>
          </CardContent>
        </Card>
      </ListItem>
      <Divider sx={{ my: 1 }} />
    </React.Fragment>
  ))}
</List>
        </Box>

        {/* Chat Area */}
        <Box flex={1} display="flex" flexDirection="column" dir="rtl">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <Box display="flex" alignItems="center" p={2} bgcolor={colorPalette.primaryLighter} borderBottom="1px solid #e0e0e0">
                <Avatar sx={{ bgcolor: colorPalette.primary, ml: 2 }}>
                  {selectedUser.fullName.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ color: colorPalette.textDark }}>{selectedUser.fullName}</Typography>
              </Box>
              
              {/* Messages area */}
              <Box 
                ref={messagesContainerRef}
                className="messages-container"
                flex={1} 
                p={2} 
                overflow="auto" 
                bgcolor={colorPalette.background}
                sx={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                }}
                onScroll={handleScroll}
              >
               {messages.map((msg) => (
  <Box
    key={msg.id}
    sx={{
      display: 'flex',
      justifyContent: msg.sender_guid === currentUser?.guid ? 'flex-start' : 'flex-end',
      mb: 2,
      position: 'relative'
    }}
  >
    <Paper
      elevation={2}
      sx={{
        p: 2,
        maxWidth: '70%',
        bgcolor: msg.sender_guid === currentUser?.guid ? colorPalette.primaryLighter : '#ffffff',
        borderRadius: msg.sender_guid === currentUser?.guid ? 
          '18px 18px 18px 0' : '18px 18px 0 18px',
        position: 'relative',
        border: `1px solid ${colorPalette.primaryLight}`
      }}
    >
      {msg.message_type === 'text' ? (
        <Typography sx={{ color: colorPalette.textDark }}>{msg.content}</Typography>
      ) : (
        renderFilePreview(msg)
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 1,
          gap: 1
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          {msg.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        
        {msg.sender_guid === currentUser?.guid && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {msg.is_read ? (
              <>
                <CheckCircleOutlineIcon 
                  fontSize="small" 
                  sx={{ color: colorPalette.primary, fontSize: '1rem', ml: 0.5 }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ color: colorPalette.primary, fontSize: '0.75rem' }}
                >
                  تمت مشاهدتها
                </Typography>
              </>
            ) : (
              <>
                <CheckCircleOutlineIcon 
                  fontSize="small" 
                  sx={{ 
                    fontSize: '1rem', 
                    ml: 0.5,
                    color: 'text.disabled' 
                  }} 
                />
                <Typography 
                  variant="caption" 
                  color="text.disabled"
                  sx={{ fontSize: '0.75rem' }}
                >
                  تم الإرسال
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  </Box>
))}
                <div ref={messagesEndRef} />
                {showScrollButton && (
                  <Button 
                    variant="contained" 
                    sx={{
                      backgroundColor: colorPalette.primary,
                      position: 'sticky',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1,
                      '&:hover': {
                        backgroundColor: colorPalette.primaryDark
                      }
                    }}
                    onClick={() => scrollToBottom()}
                  >
                  اذهب للأسفل ▼
                  </Button>
                )}
              </Box>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <Box 
                  p={1} 
                  bgcolor={colorPalette.primaryLighter} 
                  borderTop="1px solid #e0e0e0"
                  display="flex"
                  flexWrap="wrap"
                >
                  {attachments.map((attachment, index) => (
                    <Box 
                      key={index}
                      sx={{
                        position: 'relative',
                        m: 1,
                        p: 1,
                        bgcolor: 'white',
                        borderRadius: 1,
                        boxShadow: 1,
                        border: `1px solid ${colorPalette.primaryLight}`
                      }}
                    >
                      {attachment.type === 'image' && (
                        <img 
                          src={attachment.preview} 
                          alt={attachment.name} 
                          style={{ width: 80, height: 80, objectFit: 'cover' }}
                        />
                      )}
                      {attachment.type !== 'image' && (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <DocIcon style={{ fontSize: 48, color: colorPalette.primary }} />
                          <Typography variant="caption" display="block">
                            {attachment.name}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          bgcolor: colorPalette.error,
                          color: 'white',
                          '&:hover': { bgcolor: colorPalette.error }
                        }}
                        onClick={() => removeAttachment(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" display="block">
                        {Math.round(attachment.size / 1024)} KB
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Audio recording preview */}
              {audioChunks.length > 0 && (
                <Box 
                  p={1} 
                  bgcolor={colorPalette.primaryLighter} 
                  borderTop="1px solid #e0e0e0"
                  display="flex"
                  alignItems="center"
                >
                  <AudioIcon sx={{ ml: 1, color: colorPalette.primary }} />
                  <Typography variant="body2" sx={{ color: colorPalette.textDark }}>Audio recording ready</Typography>
                  <audio 
                    controls 
                    src={URL.createObjectURL(new Blob(audioChunks, { type: 'audio/wav' }))} 
                    style={{ marginLeft: '10px' }}
                  />
                  <IconButton
                    size="small"
                    sx={{ ml: 1, color: colorPalette.error }}
                    onClick={() => setAudioChunks([])}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Message input area */}
              <Box p={2} borderTop="1px solid #e0e0e0" bgcolor="#ffffff">
                <Box display="flex" alignItems="center">
                  <IconButton sx={{ color: colorPalette.primary }} onClick={() => fileInputRef.current.click()}>
                    <AttachFileIcon />
                  </IconButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    multiple
                  />
                  <IconButton sx={{ color: colorPalette.primary }} onClick={(e) => setEmojiAnchor(e.currentTarget)}>
                    <EmojiIcon />
                  </IconButton>
                  <Popover
                    open={Boolean(emojiAnchor)}
                    anchorEl={emojiAnchor}
                    onClose={() => setEmojiAnchor(null)}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                  >
                    <ClickAwayListener onClickAway={() => setEmojiAnchor(null)}>
                      <Box>
                        <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                      </Box>
                    </ClickAwayListener>
                  </Popover>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="اكتب رسالة..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={4}
                    sx={{
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '24px',
                        bgcolor: colorPalette.background,
                        textAlign: 'right',
                        borderColor: colorPalette.primaryLight,
                        '&:hover fieldset': {
                          borderColor: colorPalette.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colorPalette.primary,
                        }
                      }
                    }}
                  />
                 {isRecording ? (
  <Box display="flex" alignItems="center">
    <IconButton 
      onClick={stopRecording} 
      sx={{
        color: colorPalette.error,
        animation: 'pulse 1.5s infinite',
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        }
      }}
    >
      <MicIcon />
    </IconButton>
    <Typography variant="caption" sx={{ ml: 1, color: colorPalette.error }}>
      {formatTime(recordingTime)}
    </Typography>
  </Box>
) : (
  <IconButton 
    onClick={startRecording}
    sx={{
      color: colorPalette.primary,
      '&:hover': { backgroundColor: colorPalette.primaryLighter }
    }}
  >
    <MicIcon />
  </IconButton>
)}
                  <IconButton 
                    sx={{ 
                      color: colorPalette.primary,
                      '&:hover': { backgroundColor: colorPalette.primaryLighter }
                    }}
                    onClick={handleSendMessage}
                    disabled={message.trim() === '' && attachments.length === 0 && audioChunks.length === 0}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              bgcolor={colorPalette.background}
            >
              <Typography variant="h6" sx={{ color: colorPalette.textLight }}>
                اختر مستخدمًا لبدء المحادثة
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box></NavigationShell>
  );
};

export default Chats;