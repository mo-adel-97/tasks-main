import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Avatar, Card, CardContent, 
  List, ListItem, Divider, Badge, TextField, InputAdornment,
  Button, Paper, IconButton, Popover, ClickAwayListener,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Menu, MenuItem, ListItemIcon, ListItemText,
  Tooltip
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import DescriptionIcon from '@mui/icons-material/Description';
import {
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    Audiotrack as AudioIcon,
  } from '@mui/icons-material';
  import {
  Group as GroupIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ExitToApp as LeaveIcon,
  PersonAdd as AddMemberIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  InfoOutlined as NotificationsIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import notificationSoundFile from "../../src/notification-sound-effect-372475.mp3";

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

const GroupChat = ({ 
  currentUser, 
  users, 
  onBackToPrivateChat,
  notificationSound 
}) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAnchorEl, setGroupAnchorEl] = useState(null);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [audioChunks, setAudioChunks] = useState([]);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const recordingIntervalRef = useRef(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null);
  const [addMemberSearchTerm, setAddMemberSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const isCurrentUserAdmin = () => {
    if (!selectedGroup || !currentUser) return false;
    const member = groupMembers.find(m => m.guid === currentUser.guid);
    return member?.is_admin || false;
  };

  const hasPlayedSoundRef = useRef(false);

  // Fetch user's groups
  useEffect(() => {
    if (!currentUser?.guid) return;

    const fetchUserGroups = async () => {
      try {
        const response = await fetch(`https://filesregsiteration.sstli.com/get_user_groups.php?user_guid=${currentUser.guid}`);
        const data = await response.json();
        
        if (data.success) {
          setGroups(data.groups);
          const initialUnread = {};
          data.groups.forEach(group => {
            initialUnread[group.group_id] = group.unread_count || 0;
          });
          setGroupUnreadCounts(initialUnread);
        }
      } catch (error) {
      }
    };

    fetchUserGroups();
  }, [currentUser]);

  // Fetch group members when a group is selected
  useEffect(() => {
    if (!selectedGroup) return;
    
    const fetchGroupMembers = async () => {
      try {
        const response = await fetch(`https://filesregsiteration.sstli.com/get_group_members.php?group_id=${selectedGroup.group_id}`);
        const data = await response.json();
        if (data.success) {
          setGroupMembers(data.members);
        }
      } catch (error) {
      }
    };
    
    fetchGroupMembers();
  }, [selectedGroup]);

  const playNotificationSound = useCallback(() => {
    if (hasPlayedSoundRef.current) return;
    
    try {
      const sound = new Audio(notificationSoundFile);
      sound.play().catch(e => console.error('Error playing sound:', e));
      hasPlayedSoundRef.current = true;
      
      setTimeout(() => {
        hasPlayedSoundRef.current = false;
      }, 2000);
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.guid) return;
  
    let isMounted = true;
    const fetchUpdates = async () => {
      try {
        const response = await fetch(
          `https://filesregsiteration.sstli.com/get_user_groups.php?user_guid=${currentUser.guid}`
        );
        const groupsData = await response.json();
  
        if (isMounted && groupsData.success) {
          const newUnreadCounts = {};
          let hasNewMessages = false;
  
          groupsData.groups.forEach(group => {
            newUnreadCounts[group.group_id] = group.unread_count || 0;
            
            if ((groupUnreadCounts[group.group_id] || 0) < group.unread_count) {
              hasNewMessages = true;
            }
          });
  
          if (JSON.stringify(newUnreadCounts) !== JSON.stringify(groupUnreadCounts)) {
            setGroupUnreadCounts(newUnreadCounts);
            
            if (hasNewMessages && (!selectedGroup || 
                groupsData.groups.find(g => g.group_id === selectedGroup.group_id)?.unread_count === 0)) {
              playNotificationSound();
            }
          }
        }
      } catch (error) {
      }
    };
  
    fetchUpdates();
    const intervalId = setInterval(fetchUpdates, 3000);
  
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentUser, groupUnreadCounts, playNotificationSound, selectedGroup]);
  
  const fetchGroupMessages = async (groupId) => {
    if (!groupId || !currentUser) return;
  
    try {
      const response = await fetch(`https://filesregsiteration.sstli.com/get_group_messages.php?group_id=${groupId}&user_guid=${currentUser.guid}`);
      const data = await response.json();
      
      if (data.success) {
        const processedMessages = data.messages.map(msg => ({
          ...msg,
          created_at: new Date(msg.created_at),
          file_url: msg.file_url || (msg.file_path ? `https://filesregsiteration.sstli.com/${msg.file_path}` : null),
          is_read: msg.is_read || 0,
          seen_by: msg.seen_by || [],
          not_seen_by: msg.not_seen_by || []
        }));
        
        setMessages(processedMessages);
      }
    } catch (error) {
    }
  };

  
  const markGroupMessagesAsRead = async (groupId) => {
    if (!groupId || !currentUser?.guid) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/mark_group_messages_as_read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          user_guid: currentUser.guid
        })
      });
  
      const data = await response.json();
      if (data.success) {
        setGroupUnreadCounts(prev => ({
          ...prev,
          [groupId]: 0
        }));
      } else {
      }
    } catch (error) {
    }
  };

  const handleViewMembers = () => {
    setGroupAnchorEl(null);
    setShowMembersDialog(true);
  };

  const getMemberDetails = (member) => {
    const user = users.find(u => u.guid === member.guid);
    return {
      ...member,
      fullName: user ? user.fullName : 'Unknown User',
      avatar: user ? user.fullName.charAt(0) : '?'
    };
  };

  const deleteReadMessages = async (groupId) => {
    if (!groupId || !currentUser?.guid) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/delete_read_messages.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_guid: currentUser.guid,
          group_id: groupId
        })
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      return false;
    }
  };

  const handleGroupClick = async (group) => {
    setGroupUnreadCounts(prev => ({
      ...prev,
      [group.group_id]: 0
    }));
    
    setSelectedGroup(group);
    
    await markGroupMessagesAsRead(group.group_id);
    
    await fetchGroupMessages(group.group_id);
    
    await deleteReadMessages(group.group_id);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      alert('Group name and at least one member are required');
      return;
    }
    
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/create_group.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_name: newGroupName,
          created_by: currentUser.guid,
          members: [...selectedMembers, currentUser.guid]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const groupsResponse = await fetch(`https://filesregsiteration.sstli.com/get_user_groups.php?user_guid=${currentUser.guid}`);
        const groupsData = await groupsResponse.json();
        
        if (groupsData.success) {
          setGroups(groupsData.groups);
          setShowCreateGroupDialog(false);
          setNewGroupName('');
          setSelectedMembers([]);
        }
      } else {
        alert('Failed to create group: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create group');
    }
  };

  const handleSendGroupMessage = async () => {
    if ((message.trim() === '' && attachments.length === 0 && audioChunks.length === 0) || !selectedGroup) {
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('sender_guid', currentUser.guid);
      formData.append('group_id', selectedGroup.group_id);
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
        group_id: selectedGroup.group_id,
        is_group_message: true,
        content: message,
        message_type: messageType,
        file_name: fileName,
        file_type: fileType,
        created_at: new Date(),
        file_url: attachments.length > 0 ? URL.createObjectURL(attachments[0].file) : 
                 audioChunks.length > 0 ? URL.createObjectURL(new Blob(audioChunks, { type: 'audio/wav' })) : null,
        sender_name: currentUser.fullName
      };
  
      setMessages(prev => [...prev, tempMessage]);
      setMessage('');
      setAttachments([]);
      setAudioChunks([]);
  
      const response = await fetch('https://filesregsiteration.sstli.com/send_group_message.php', {
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
                file_url: result.file_url || (result.file_path ? `https://filesregsiteration.sstli.com/${result.file_path}` : null),
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

  useEffect(() => {
    if (!selectedGroup) return;
  
    let isMounted = true;
    const fetchAndMarkAsRead = async () => {
      const prevMessagesLength = messages.length;
      await fetchGroupMessages(selectedGroup.group_id);
      
      if (isMounted && messages.length > prevMessagesLength) {
        if (!document.hasFocus()) {
          playNotificationSound();
        }
      }
      
      await deleteReadMessages(selectedGroup.group_id);
      await markGroupMessagesAsRead(selectedGroup.group_id);
    };
  
    fetchAndMarkAsRead();
    const intervalId = setInterval(fetchAndMarkAsRead, 2000);
  
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedGroup, messages.length, playNotificationSound]);

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !currentUser) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/leave_group.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: selectedGroup.group_id,
          user_guid: currentUser.guid
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        const groupsResponse = await fetch(`https://filesregsiteration.sstli.com/get_user_groups.php?user_guid=${currentUser.guid}`);
        const groupsData = await groupsResponse.json();
        
        if (groupsData.success) {
          setGroups(groupsData.groups);
          setSelectedGroup(null);
          setMessages([]);
          
          alert('لقد قمت بالخروج من المجموعة بنجاح');
        }
      } else {
        throw new Error(data.error || 'Failed to leave group');
      }
    } catch (error) {
      alert(`Failed to leave group: ${error.message}`);
    }
  };

  const handlePromoteToAdmin = async (memberGuid) => {
    if (!selectedGroup || !currentUser) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/promote_to_admin.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: selectedGroup.group_id,
          user_guid: memberGuid,
          promoted_by: currentUser.fullName
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        const membersResponse = await fetch(`https://filesregsiteration.sstli.com/get_group_members.php?group_id=${selectedGroup.group_id}`);
        const membersData = await membersResponse.json();
        
        if (membersData.success) {
          setGroupMembers(membersData.members);
          
          const notificationMessage = `تم تعيين ${getUserNameByGuid(memberGuid)} كأدمن في المجموعة بواسطة ${currentUser.fullName}`;
          
          const tempNotification = {
            id: Date.now(),
            sender_guid: currentUser.guid,
            group_id: selectedGroup.group_id,
            is_group_message: true,
            content: notificationMessage,
            message_type: 'notification',
            created_at: new Date(),
            sender_name: currentUser.fullName
          };
          
          setMessages(prev => [...prev, tempNotification]);
        }
      } else {
        throw new Error(data.error || 'Failed to promote member');
      }
    } catch (error) {
      alert(`Failed to promote member: ${error.message}`);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserToAdd || !selectedGroup) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/add_group_member.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: selectedGroup.group_id,
          user_guid: selectedUserToAdd.guid,
          added_by: currentUser.fullName
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        const membersResponse = await fetch(`https://filesregsiteration.sstli.com/get_group_members.php?group_id=${selectedGroup.group_id}`);
        const membersData = await membersResponse.json();
        
        if (membersData.success) {
          setGroupMembers(membersData.members);
          setShowAddMemberDialog(false);
          setSelectedUserToAdd(null);
          setAddMemberSearchTerm('');
          
          const notificationMessage = `تم إضافة ${selectedUserToAdd.fullName} إلى المجموعة بواسطة ${currentUser.fullName}`;
          
          const tempNotification = {
            id: Date.now(),
            sender_guid: currentUser.guid,
            group_id: selectedGroup.group_id,
            is_group_message: true,
            content: notificationMessage,
            message_type: 'notification',
            created_at: new Date(),
            sender_name: currentUser.fullName
          };
          
          setMessages(prev => [...prev, tempNotification]);
          
          await fetch('https://filesregsiteration.sstli.com/send_group_message.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender_guid: currentUser.guid,
              group_id: selectedGroup.group_id,
              message_type: 'notification',
              content: notificationMessage,
              is_group_message: true
            })
          });
        }
      } else {
        throw new Error(data.error || 'Failed to add member');
      }
    } catch (error) {
      alert(`Failed to add member: ${error.message}`);
    }
  };

  const toggleMemberSelection = (userGuid) => {
    setSelectedMembers(prev =>
      prev.includes(userGuid)
        ? prev.filter(id => id !== userGuid)
        : [...prev, userGuid]
    );
  };

  const handleRemoveMember = async (memberGuid) => {
    if (!selectedGroup || !currentUser) return;
  
    try {
      const response = await fetch('https://filesregsiteration.sstli.com/remove_group_member.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: selectedGroup.group_id,
          user_guid: memberGuid,
          removed_by: currentUser.fullName
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        const membersResponse = await fetch(`https://filesregsiteration.sstli.com/get_group_members.php?group_id=${selectedGroup.group_id}`);
        const membersData = await membersResponse.json();
        
        if (membersData.success) {
          setGroupMembers(membersData.members);
          
          const notificationMessage = `تم إزالة ${getUserNameByGuid(memberGuid)} من المجموعة بواسطة ${currentUser.fullName}`;
          
          const tempNotification = {
            id: Date.now(),
            sender_guid: currentUser.guid,
            group_id: selectedGroup.group_id,
            is_group_message: true,
            content: notificationMessage,
            message_type: 'notification',
            created_at: new Date(),
            sender_name: currentUser.fullName
          };
          
          setMessages(prev => [...prev, tempNotification]);
        }
      } else {
        throw new Error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      alert(`Failed to remove member: ${error.message}`);
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

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    URL.revokeObjectURL(newAttachments[index].preview);
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setAudioChunks([]);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data]);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
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
    setRecordingTime(0);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setEmojiAnchor(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendGroupMessage();
    }
  };

  const getUserNameByGuid = (guid) => {
    const user = users.find(user => user.guid === guid);
    return user ? user.fullName : 'Unknown';
  };

  const renderFilePreview = (message) => {
    if (!message.file_url) return null;
  
    const fileExtension = message.file_name?.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
    const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExtension);
    const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(fileExtension);
  
    return (
      <Box sx={uiLayout.pageHeaderSx} display="flex" flexDirection="column" alignItems="flex-start">
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
        ) : isVideo ? (
          <video controls style={{ maxWidth: '100%', maxHeight: '300px' }}>
            <source src={message.file_url} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
        ) : isPdf ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <PdfIcon style={{ fontSize: 48, color: 'red' }} />
            <Button
              variant="outlined"
              size="small"
              sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.buttonSx)}
              onClick={() => window.open(message.file_url, '_blank')}
            >
              View PDF
            </Button>
          </Box>
        ) : isDocument ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <DocIcon style={{ fontSize: 48 }} />
            <Button
              variant="outlined"
              size="small"
              sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.buttonSx)}
              onClick={() => window.open(message.file_url, '_blank')}
            >
              Download {fileExtension?.toUpperCase() || 'File'}
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center">
            <DescriptionIcon style={{ fontSize: 48 }} />
            <Button
              variant="outlined"
              size="small"
              sx={uiLayout.withUiSx({ mt: 1 }, uiLayout.buttonSx)}
              onClick={() => window.open(message.file_url, '_blank')}
            >
              Download File
            </Button>
          </Box>
        )}
  
        {message.content && (
          <Typography variant="body2" mt={1}>
            {message.content}
          </Typography>
        )}
      </Box>
    );
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const element = messagesContainerRef.current;
    const threshold = 100;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;
    
    setIsNearBottom(atBottom);
    setShowScrollButton(!atBottom);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setIsNearBottom(true);
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length > prevMessagesLength) {
      if (isNearBottom) {
        scrollToBottom();
      }
    } else if (messages.length !== prevMessagesLength) {
      scrollToBottom('auto');
    }

    setPrevMessagesLength(messages.length);
  }, [messages]);

  const getAvailableUsers = () => {
    const currentUserBranch = currentUser?.branchForWork || 
                            JSON.parse(localStorage.getItem('user'))?.branchForWork;
  
    return users
      .filter(user => {
        const sameBranch = user.branchForWork === currentUserBranch;
        const notInGroup = !groupMembers.some(member => member.guid === user.guid);
        const notCurrentUser = user.guid !== currentUser?.guid;
        const matchesSearch = user.fullName.toLowerCase().includes(addMemberSearchTerm.toLowerCase());
        
        return sameBranch && notInGroup && notCurrentUser && matchesSearch;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  return (
    <NavigationShell variant="standard" ><Box sx={navigationContentSx} display="flex" height="95%" dir="rtl">
      
      {/* Groups List */}
      <Box style={{marginRight:"30px"}} width="30%" bgcolor={colorPalette.background} p={2} overflow="auto" borderLeft="1px solid #e0e0e0">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: colorPalette.textDark }}>
            <GroupIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} /> المجموعات ({groups.length})
          </Typography>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={() => setShowCreateGroupDialog(true)}
            sx={uiLayout.withUiSx({
              backgroundColor: colorPalette.primary,
              '&:hover': {
                backgroundColor: colorPalette.primaryDark
              }
            }, uiLayout.buttonSx)}
          >
            مجموعة جديدة
          </Button>
        </Box>
        
        {/* Search Bar */}
        <TextField InputLabelProps={{ shrink: true }}
          fullWidth
          variant="outlined"
          placeholder="ابحث عن مجموعة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colorPalette.primary }} />
              </InputAdornment>
            ),
          }}
        />
        
        <List>
          {groups
            .filter(group => group.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((group) => (
              <React.Fragment key={group.group_id}>
                <ListItem 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: colorPalette.primaryLighter },
                    borderRadius: 1,
                    px: 1,
                    position: 'relative'
                  }}
                  onClick={() => handleGroupClick(group)}
                >
                  {(groupUnreadCounts[group.group_id] > 0) && (
                    <></>
                  )}
                  
                  <Card sx={{ 
                    width: '100%', 
                    boxShadow: 2,
                    borderInlineStart: (groupUnreadCounts[group.group_id] > 0) ? `3px solid ${colorPalette.error}` : 'none',
                    backgroundColor: selectedGroup?.group_id === group.group_id ? colorPalette.primaryLighter : 'white'
                  }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                      <Avatar sx={{ bgcolor: colorPalette.primary, ml: 2 }}>
                        {group.group_name.charAt(0)}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colorPalette.textDark }}>
                          {group.group_name}
                          {(groupUnreadCounts[group.group_id] > 0) && (
                            <NotificationsIcon color="error" sx={{ fontSize: 16, ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          الأعضاء: {group.member_count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </ListItem>
                <Divider sx={{ my: 1 }} />
              </React.Fragment>
            ))}
        </List>
      </Box>

      {/* Group Chat Area */}
      <Box flex={1} display="flex" flexDirection="column" dir="rtl">
        {selectedGroup ? (
          <>
            {/* Group header */}
            <Box display="flex" alignItems="center" p={2} bgcolor={colorPalette.primaryLighter} borderBottom="1px solid #e0e0e0">
              <IconButton onClick={() => {
                setSelectedGroup(null);
                setMessages([]);
                onBackToPrivateChat();
              }}>
                <CloseIcon />
              </IconButton>
              <Avatar sx={{ bgcolor: colorPalette.primary, ml: 2 }}>
                {selectedGroup.group_name.charAt(0)}
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="h6" sx={{ color: colorPalette.textDark }}>{selectedGroup.group_name}</Typography>
                <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                  {groupMembers.length} أعضاء
                </Typography>
              </Box>
              <IconButton onClick={(e) => setGroupAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              
              {/* Group menu */}
              <Menu
                anchorEl={groupAnchorEl}
                open={Boolean(groupAnchorEl)}
                onClose={() => setGroupAnchorEl(null)}
              >
                <MenuItem onClick={handleViewMembers}>
                  <ListItemIcon>
                    <GroupIcon fontSize="small" sx={{ color: colorPalette.primary }} />
                  </ListItemIcon>
                  <ListItemText>عرض الأعضاء</ListItemText>
                </MenuItem>
                
                {isCurrentUserAdmin() && (
                  <MenuItem onClick={() => {
                    setGroupAnchorEl(null);
                    setShowAddMemberDialog(true);
                  }}>
                    <ListItemIcon>
                      <AddMemberIcon fontSize="small" sx={{ color: colorPalette.primary }} />
                    </ListItemIcon>
                    <ListItemText>إضافة أعضاء</ListItemText>
                  </MenuItem>
                )}
                
                <MenuItem onClick={() => {
                  setGroupAnchorEl(null);
                  if (window.confirm('هل أنت متأكد أنك تريد مغادرة هذه المجموعة؟')) {
                    handleLeaveGroup();
                  }
                }}>
                  <ListItemIcon>
                    <LeaveIcon fontSize="small" sx={{ color: colorPalette.error }} />
                  </ListItemIcon>
                  <ListItemText sx={{ color: colorPalette.error }}>مغادرة المجموعة</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
            
            {/* Messages area */}
            <Box 
              ref={messagesContainerRef}
              flex={1} 
              p={2} 
              overflow="auto" 
              bgcolor={colorPalette.background}
              sx={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
              }}
              onScroll={handleScroll}
            >
{messages.map((msg) => {
if (msg.message_type === 'notification' || 
    (msg.message_type === 'text' && (
      msg.content.includes('لقد أضاف عضو جديد في المجموعة') ||
      msg.content.includes('أزال عضو من المجموعة') ||
      msg.content.includes('غادر العضو المجموعة') ||
      msg.content.includes('لقد غادر عضو المجموعة') ||
      msg.content.includes('تم تعيين عضو كأدمن') ||
      msg.content.includes('A member has left the group') ||
      msg.content.includes('promoted to admin')
    ))) {
    return (
      <Box
        key={msg.id}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 2
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: 2,
            bgcolor: colorPalette.primaryLighter,
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.75rem',
              color: colorPalette.textDark,
              fontStyle: 'italic'
            }}
          >
            {msg.content}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: "0.75rem",
              display: 'block',
              textAlign: 'center',
              mt: 0.5,
              color: colorPalette.textLight
            }}
          >
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      key={msg.id}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        alignItems: msg.sender_guid === currentUser.guid ? 'flex-end' : 'flex-start'
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: msg.sender_guid === currentUser.guid ? colorPalette.primaryLighter : '#ffffff',
          borderRadius: msg.sender_guid === currentUser.guid ? 
            '18px 18px 0 18px' : '18px 18px 18px 0',
          border: `1px solid ${colorPalette.primaryLight}`
        }}
      >
        {msg.message_type === 'text' ? (
          <Typography sx={{ color: colorPalette.textDark }}>{msg.content}</Typography>
        ) : (
          renderFilePreview(msg)
        )}
        
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.75rem',
            display: 'block',
            textAlign: 'right',
            mt: 1,
            color: colorPalette.textLight
          }}
        >
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
      
      {msg.sender_guid !== currentUser.guid && (
        <Typography 
          variant="caption" 
          sx={{ mt: 0.5, textAlign: 'right', color: colorPalette.textLight }}
        >
          {getUserNameByGuid(msg.sender_guid)}
        </Typography>
      )}
    </Box>
  );
})}
              <div ref={messagesEndRef} />
              {showScrollButton && (
                <Button 
                  variant="contained" 
                  sx={uiLayout.withUiSx({
                    backgroundColor: colorPalette.primary,
                    position: 'sticky',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: colorPalette.primaryDark
                    }
                  }, uiLayout.buttonSx)}
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
                <TextField InputLabelProps={{ shrink: true }}
                  fullWidth
                  variant="outlined"
                  placeholder="اكتب رسالة..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={4}
                  sx={uiLayout.withUiSx({
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
                  }, uiLayout.formFieldSx)}
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
                  onClick={handleSendGroupMessage}
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
          </Box>
        )}
      </Box>

      {/* Create Group Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx}
        open={showCreateGroupDialog}
        onClose={() => setShowCreateGroupDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '60vh',
            borderRadius: '12px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: colorPalette.primary,
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          py: 2,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          إنشاء مجموعة جديدة
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <TextField InputLabelProps={{ shrink: true }}
            autoFocus
            margin="dense"
            label="اسم المجموعة"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={uiLayout.withUiSx({ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  borderWidth: '2px',
                  borderColor: colorPalette.primaryLight
                }
              }
            }, uiLayout.formFieldSx)}
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: colorPalette.textDark,
            mb: 2
          }}>
            اختر الأعضاء:
          </Typography>

          <TextField InputLabelProps={{ shrink: true }}
            fullWidth
            variant="outlined"
            placeholder="ابحث بالأسم..."
            sx={uiLayout.withUiSx({ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  borderWidth: '2px',
                  borderColor: colorPalette.primaryLight
                }
              }
            }, uiLayout.formFieldSx)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colorPalette.primary }} />
                </InputAdornment>
              ),
            }}
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              setUserSearchTerm(searchTerm);
            }}
          />
          
          <Box sx={{ 
            maxHeight: '40vh', 
            overflow: 'auto',
            p: 1,
            border: '1px solid',
            borderColor: colorPalette.primaryLight,
            borderRadius: '8px'
          }}>
            {getAvailableUsers(true)
              .filter(user => 
                user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase())
              )
              .map((user) => (
                <Box key={user.guid} sx={{ mb: 1 }}>
                  <Chip
                    label={user.fullName}
                    onClick={() => toggleMemberSelection(user.guid)}
                    color={selectedMembers.includes(user.guid) ? 'primary' : 'default'}
                    avatar={<Avatar sx={{ bgcolor: colorPalette.primary }}>{user.fullName.charAt(0)}</Avatar>}
                    sx={{ 
                      width: '100%', 
                      justifyContent: 'flex-start',
                      py: 1.5,
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  />
                </Box>
              ))}
          </Box>
        </DialogContent>
        
        <DialogActions sx={uiLayout.withUiSx({ 
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: colorPalette.primaryLight
        }, uiLayout.dialogActionsSx)}>
          <Button 
            onClick={() => setShowCreateGroupDialog(false)}
            variant="outlined"
            sx={uiLayout.withUiSx({
              px: 3,
              py: 1,
              borderRadius: '8px',
              borderWidth: '2px',
              borderColor: colorPalette.primary,
              color: colorPalette.primary,
              '&:hover': {
                borderWidth: '2px',
                backgroundColor: colorPalette.primaryLighter
              }
            }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!newGroupName.trim() || selectedMembers.length === 0}
            sx={uiLayout.withUiSx({
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: 'none',
              backgroundColor: colorPalette.primary,
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: colorPalette.primaryDark
              }
            }, uiLayout.buttonSx)}
          >
            إنشاء
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} 
        open={showMembersDialog} 
        onClose={() => setShowMembersDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ backgroundColor: colorPalette.primaryLighter }}>
          <Box display="flex" alignItems="center">
            <GroupIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} />
            <Typography sx={{ color: colorPalette.textDark }}>أعضاء المجموعة: {selectedGroup?.group_name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
          {groupMembers.map((member) => {
            const memberDetails = getMemberDetails(member);
            const currentUserIsAdmin = isCurrentUserAdmin();
            const isMemberAdmin = member.is_admin;
            
            return (
              <ListItem key={member.guid}>
                <Box display="flex" alignItems="center" width="100%">
                  <Avatar sx={{ 
                    bgcolor: isMemberAdmin ? colorPalette.primary : '#757575', 
                    marginInlineEnd: 2 
                  }}>
                    {memberDetails.avatar}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="body1" sx={{ color: colorPalette.textDark }}>
                      {memberDetails.fullName}
                      {isMemberAdmin && (
                        <Chip 
                          label="أدمن" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            fontSize: "0.75rem",
                            backgroundColor: colorPalette.primary,
                            color: 'white'
                          }}
                        />
                      )}
                    </Typography>
                  </Box>
                  
                  {currentUserIsAdmin && member.guid !== currentUser?.guid && (
                    <Box display="flex">
                      {!isMemberAdmin && (
                        <Tooltip title="تعيين كأدمن">
                          <IconButton
                            edge="end"
                            aria-label="promote"
                            onClick={() => handlePromoteToAdmin(member.guid)}
                            sx={{ color: colorPalette.primary }}
                          >
                            <AdminPanelSettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="إزالة من المجموعة">
                        <IconButton
                          edge="end"
                          aria-label="remove"
                          onClick={() => handleRemoveMember(member.guid)}
                          sx={{ color: colorPalette.error }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </ListItem>
            );
          })}
          </List>
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button 
            onClick={() => setShowMembersDialog(false)}
            sx={uiLayout.withUiSx({ color: colorPalette.primary }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog sx={uiLayout.dialogLayoutSx} 
        open={showAddMemberDialog} 
        onClose={() => {
          setShowAddMemberDialog(false);
          setAddMemberSearchTerm('');
          setSelectedUserToAdd(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ backgroundColor: colorPalette.primaryLighter }}>
          <Box display="flex" alignItems="center">
            <AddMemberIcon sx={{ marginInlineEnd: 1, color: colorPalette.primary }} />
            <Typography sx={{ color: colorPalette.textDark }}>إضافة عضو جديد إلى: {selectedGroup?.group_name}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
              placeholder="ابحث عن عضو..."
              value={addMemberSearchTerm}
              onChange={(e) => setAddMemberSearchTerm(e.target.value)}
              sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorPalette.primary }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography variant="subtitle1" gutterBottom sx={{ color: colorPalette.textDark }}>
              اختر عضو لإضافته:
            </Typography>
            
            {getAvailableUsers().length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {getAvailableUsers().map((user) => (
                  <Card 
                    key={user.guid} 
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      backgroundColor: selectedUserToAdd?.guid === user.guid ? colorPalette.primaryLighter : 'inherit',
                      '&:hover': {
                        backgroundColor: colorPalette.primaryLighter
                      }
                    }}
                    onClick={() => setSelectedUserToAdd(user)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ marginInlineEnd: 2, bgcolor: colorPalette.primary }}>
                        {user.fullName.charAt(0)}
                      </Avatar>
                      <Typography variant="body1" sx={{ color: colorPalette.textDark }}>
                        {user.fullName}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 100 
              }}>
                <Typography variant="body1" sx={{ color: colorPalette.textLight }}>
                  لا يوجد أعضاء متاحين للإضافة
                </Typography>
                {addMemberSearchTerm && (
                  <Typography variant="body2" sx={{ color: colorPalette.textLight }}>
                    لا توجد نتائج لـ "{addMemberSearchTerm}"
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button 
            onClick={() => {
              setShowAddMemberDialog(false);
              setAddMemberSearchTerm('');
              setSelectedUserToAdd(null);
            }}
            sx={uiLayout.withUiSx({ color: colorPalette.primary }, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained"
            disabled={!selectedUserToAdd}
            sx={uiLayout.withUiSx({
              backgroundColor: colorPalette.primary,
              '&:hover': {
                backgroundColor: colorPalette.primaryDark
              }
            }, uiLayout.buttonSx)}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
};

export default GroupChat;