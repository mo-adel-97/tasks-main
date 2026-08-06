import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  ImageList,
  ImageListItem,
  Modal,
  AppBar,
  Toolbar,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Favorite,
  FavoriteBorder,
  Comment,
  Send,
  Add,
  Image as ImageIcon,
  MoreVert,
  Delete,
  EmojiEmotions,
  Visibility
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const COLOR_SCHEME = {
  primary: '#80b49e',
  primaryLight: '#a8d5ba',
  primaryDark: '#5a8f7a',
  secondary: '#ff9e80',
  background: '#f8fbfa',
  surface: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#546e7a',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const API_BASE_URL = 'https://filesregsiteration.sstli.com/erp';

const PostsDialog = ({ open, onClose, onUnseenCountChange }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [postMenuAnchor, setPostMenuAnchor] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewImageModal, setViewImageModal] = useState({ open: false, image: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [userImage, setUserImage] = useState('');
  const [likesModal, setLikesModal] = useState({ open: false, likes: [] });
  const [allUsersCache, setAllUsersCache] = useState([]);
  const [viewsModal, setViewsModal] = useState({ open: false, views: [], postId: null, totalViews: 0 });
  const [unseenPostsCount, setUnseenPostsCount] = useState(0);
  const fileInputRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // user info
  // user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userFullName = user.fullName || user.userName || 'مستخدم';
  const userGuid = user.guid;

  // صلاحيات إضافة المنشورات
  const userJob = user.userJop; // موجودة في الـ localStorage زي ما قلت
  const ALLOWED_POST_ROLES = [0, 1, 2, 3, 9];
  const canCreatePost = ALLOWED_POST_ROLES.includes(Number(userJob));


  // ===== Helpers =====
  const getInitials = (name) => (name ? name.charAt(0) : 'م');

  const formatDate = (dateString) => {
    if (!dateString) return 'تاريخ غير معروف';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير معروف';

      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'الآن';
      if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'منذ يوم';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;

      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'تاريخ غير معروف';
    }
  };

  // ===== API: users/images =====
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/userinfo');
      if (response.ok) {
        const users = await response.json();
        setAllUsersCache(users);
        return users;
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
    return [];
  };

  const fetchUserImage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${userGuid}`);
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          const imageUrl = URL.createObjectURL(blob);
          setUserImage(imageUrl);
        }
      }
    } catch {
      // ignore
    }
  };

  // ===== API: unseen / views =====
  const checkUnseenPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=check_unseen&user_guid=${userGuid}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const cnt = result.unseen_count || 0;
          setUnseenPostsCount(cnt);
          if (onUnseenCountChange) onUnseenCountChange(cnt);
        }
      }
    } catch (err) {
      console.error('Error checking unseen posts:', err);
    }
  };

  const markAllPostsAsViewed = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=mark_all_viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_guid: userGuid })
      });

      const result = await response.json();
      if (result.success) {
        setUnseenPostsCount(0);
        if (onUnseenCountChange) onUnseenCountChange(0);
      }
    } catch (err) {
      console.error('Error marking all posts as viewed:', err);
    }
  };

  const markPostAsViewed = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (post && post.user_guid === userGuid) return; // لا نسجل مشاهدة لبوست المالك

      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=mark_viewed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_guid: userGuid })
      });

      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, user_has_viewed: true, views_count: (p.views_count || 0) + 1 }
            : p
        ));

        // قلّل العداد بشكل متّسق وبعت القيمة الجديدة للبارنت
        setUnseenPostsCount(prev => {
          const next = Math.max(0, prev - 1);
          if (onUnseenCountChange) onUnseenCountChange(next);
          return next;
        });
      }
    } catch (err) {
      console.error('Error marking post as viewed:', err);
    }
  };

  const fetchPostViews = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=get_views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, current_user: userGuid })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const views = result.views || [];

          // cache users
          let allUsers = allUsersCache.length ? allUsersCache : await fetchAllUsers();

          const viewsWithUserData = await Promise.all(
            views.map(async (view) => {
              const userData = allUsers.find(u => u.guid === view.user_guid);
              const userName = userData ? (userData.fullName || userData.userName || 'مستخدم') : 'مستخدم';

              let uimg = '';
              try {
                const imgRes = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${view.user_guid}`);
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  if (blob.size > 0) uimg = URL.createObjectURL(blob);
                }
              } catch {
                // ignore
              }

              return {
                ...view,
                user_full_name: userName,
                user_image: uimg,
                viewed_at: view.viewed_at
              };
            })
          );

          setViewsModal({
            open: true,
            views: viewsWithUserData,
            postId,
            totalViews: result.total_views || 0
          });
        } else {
          setError(result.message || 'خطأ في جلب المشاهدات');
        }
      } else {
        setError('فشل في الاتصال بالخادم');
      }
    } catch (err) {
      console.error('Error fetching post views:', err);
      setError('خطأ في جلب المشاهدات');
    }
  };

  const closeViewsModal = () => setViewsModal({ open: false, views: [], postId: null, totalViews: 0 });

  // ===== API: posts CRUD =====
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/posts_api.php?page=1&limit=20&current_user=${userGuid}`);
      if (!response.ok) throw new Error('فشل في جلب المنشورات');

      const result = await response.json();

      if (result.success) {
        // enrich posts with images
        const postsWithImages = await Promise.all(
          (result.posts || []).map(async (post) => {
            // صاحب البوست
            let postUserImage = '';
            try {
              const imageResponse = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${post.user_guid}`);
              if (imageResponse.ok) {
                const blob = await imageResponse.blob();
                if (blob.size > 0) postUserImage = URL.createObjectURL(blob);
              }
            } catch { /* ignore */ }

            // تعليقات
            const commentsWithImages = await Promise.all(
              (post.comments || []).map(async (comment) => {
                let commentUserImage = '';
                try {
                  const cimg = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${comment.user_guid}`);
                  if (cimg.ok) {
                    const blob = await cimg.blob();
                    if (blob.size > 0) commentUserImage = URL.createObjectURL(blob);
                  }
                } catch { /* ignore */ }
                return { ...comment, user_image: commentUserImage };
              })
            );

            // لايكات
            const likesWithImages = await Promise.all(
              (post.likes || []).map(async (like) => {
                let likeUserImage = '';
                try {
                  const limg = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${like.user_guid}`);
                  if (limg.ok) {
                    const blob = await limg.blob();
                    if (blob.size > 0) likeUserImage = URL.createObjectURL(blob);
                  }
                } catch { /* ignore */ }
                return { ...like, user_image: likeUserImage };
              })
            );

            return {
              ...post,
              user_image: postUserImage,
              comments: commentsWithImages,
              likes: likesWithImages,
              views_count: post.views_count || 0
            };
          })
        );

        setPosts(postsWithImages);

        // === الجديد: Fallback unseen لو API ما رجّعش unseen_count ===
        const fallbackUnseen = postsWithImages.filter(
          p => !p.user_has_viewed && p.user_guid !== userGuid
        ).length;

        const newUnseen = (typeof result.unseen_count === 'number')
          ? result.unseen_count
          : fallbackUnseen;

        setUnseenPostsCount(newUnseen);
        if (onUnseenCountChange) onUnseenCountChange(newUnseen);
      } else {
        setError(result.message || 'فشل في جلب المنشورات');
      }
    } catch (err) {
      setError(err.message || 'فشل في جلب المنشورات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) {
      setError('يرجى إضافة محتوى أو صورة للمنشور');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user_guid', userGuid);
      formData.append('user_full_name', userFullName);
      formData.append('user_image', userImage);
      formData.append('content', newPostContent);

      selectedImages.forEach((image) => {
        formData.append('images[]', image.file);
      });

      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=create`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        let newPostUserImage = '';
        try {
          const imageResponse = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${userGuid}`);
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            if (blob.size > 0) newPostUserImage = URL.createObjectURL(blob);
          }
        } catch { /* ignore */ }

        const newPostWithImage = {
          ...result.post,
          user_image: newPostUserImage,
          comments: [],
          likes: [],
          user_has_liked: false,
          user_has_viewed: true
        };

        setPosts(prev => [newPostWithImage, ...prev]);
        setNewPostContent('');
        setSelectedImages([]);
        setShowNewPostForm(false);
        setShowEmojiPicker(false);
        setError('');
      } else {
        setError(result.message || 'خطأ في إنشاء المنشور');
      }
    } catch {
      setError('خطأ في إنشاء المنشور');
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setSelectedImages(prev => [...prev, ...newImages].slice(0, 4));
  };

  const removeImage = (index) => {
    setSelectedImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_guid: userGuid,
          user_full_name: userFullName
        })
      });

      const result = await response.json();

      if (result.success) {
        let likeUserImage = '';
        try {
          const imgRes = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${userGuid}`);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            if (blob.size > 0) likeUserImage = URL.createObjectURL(blob);
          }
        } catch { /* ignore */ }

        const newLike = { user_guid: userGuid, user_full_name: userFullName, user_image: likeUserImage };

        setPosts(prev => prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likes_count: result.likes_count,
                user_has_liked: result.action === 'like',
                likes: result.action === 'like'
                  ? [...(p.likes || []), newLike]
                  : (p.likes || []).filter(l => l.user_guid !== userGuid)
              }
            : p
        ));
      }
    } catch (err) {
      console.error('Error liking post:', err);
      setError('خطأ في الإعجاب');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) {
      setError('يرجى كتابة تعليق');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_guid: userGuid,
          user_full_name: userFullName,
          user_image: userImage,
          comment_text: commentText
        })
      });

      const result = await response.json();

      if (result.success) {
        let commentUserImage = '';
        try {
          const imgRes = await fetch(`${API_BASE_URL}/image_api.php?action=get&userGuid=${userGuid}`);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            if (blob.size > 0) commentUserImage = URL.createObjectURL(blob);
          }
        } catch { /* ignore */ }

        const newCommentWithImage = { ...result.comment, user_image: commentUserImage };

        setPosts(prev => prev.map(p =>
          p.id === postId
            ? {
                ...p,
                comments_count: result.comments_count,
                comments: [...(p.comments || []), newCommentWithImage]
              }
            : p
        ));
        setCommentText('');
        setActiveCommentPost(null);
        setShowCommentEmojiPicker(false);
        setError('');
      } else {
        setError(result.message || 'خطأ في إضافة التعليق');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('خطأ في إضافة التعليق');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts_api.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_guid: userGuid })
      });

      const result = await response.json();

      if (result.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setPostMenuAnchor(null);
        setError('');
      } else {
        setError(result.message || 'خطأ في حذف المنشور');
      }
    } catch {
      setError('خطأ في حذف المنشور');
    }
  };

  // ===== Image/Likes Modals =====
  const openImageModal = (imageUrl) => setViewImageModal({ open: true, image: imageUrl });
  const closeImageModal = () => setViewImageModal({ open: false, image: '' });
  const openLikesModal = (likes) => setLikesModal({ open: true, likes: likes || [] });
  const closeLikesModal = () => setLikesModal({ open: false, likes: [] });

  // ===== Effects =====
  useEffect(() => {
    if (open) {
      fetchPosts();
      fetchUserImage();
      checkUnseenPosts();
      markAllPostsAsViewed();
      fetchAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== Render =====
  return (
    <>
      {/* View Image Modal */}
      <Modal
        open={viewImageModal.open}
        onClose={closeImageModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.95)'
        }}
      >
        <Box sx={{
          position: 'relative',
          maxWidth: '95vw',
          maxHeight: '95vh',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          overflow: 'hidden',
          border: `3px solid ${COLOR_SCHEME.primaryLight}50`
        }}>
          <IconButton
            onClick={closeImageModal}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 1,
              bgcolor: 'rgba(128, 180, 158, 0.9)',
              color: 'white',
              '&:hover': { bgcolor: COLOR_SCHEME.primary, transform: 'scale(1.1)' },
              transition: 'all 0.3s ease',
              width: 50,
              height: 50,
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <Close />
          </IconButton>
          <img
            src={viewImageModal.image}
            alt="منشور"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, display: 'block' }}
          />
        </Box>
      </Modal>

      {/* Likes Modal */}
      <Modal
        open={likesModal.open}
        onClose={closeLikesModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <Box sx={{
          position: 'relative',
          width: isMobile ? '90vw' : '400px',
          maxHeight: '70vh',
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <Box sx={{ bgcolor: COLOR_SCHEME.primary, color: 'white', p: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              الإعجابات ({likesModal.likes.length})
            </Typography>
          </Box>

          <Box sx={{ maxHeight: '50vh', overflow: 'auto', p: 2 }}>
            {likesModal.likes.length === 0 ? (
              <Typography textAlign="center" color="textSecondary" py={3}>
                لا توجد إعجابات بعد
              </Typography>
            ) : (
              likesModal.likes.map((like, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 2, bgcolor: `${COLOR_SCHEME.primaryLight}10` }}>
                  <Avatar
                    src={like.user_image}
                    sx={{ width: 45, height: 45, mr: 2, bgcolor: COLOR_SCHEME.primary }}
                  >
                    {getInitials(like.user_full_name)}
                  </Avatar>
                  <Typography fontWeight="bold" color={COLOR_SCHEME.text}>
                    {like.user_full_name}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: `1px solid ${COLOR_SCHEME.primaryLight}30` }}>
            <Button
              fullWidth
              variant="contained"
              onClick={closeLikesModal}
              sx={{ bgcolor: COLOR_SCHEME.primary, '&:hover': { bgcolor: COLOR_SCHEME.primaryDark }, borderRadius: 3 }}
            >
              إغلاق
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Views Modal */}
      <Modal
        open={viewsModal.open}
        onClose={closeViewsModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <Box sx={{
          position: 'relative',
          width: isMobile ? '90vw' : '400px',
          maxHeight: '70vh',
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <Box sx={{ bgcolor: COLOR_SCHEME.primary, color: 'white', p: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              المشاهدات ({viewsModal.totalViews || 0})
            </Typography>
          </Box>

          <Box sx={{ maxHeight: '50vh', overflow: 'auto', p: 2 }}>
            {viewsModal.views.length === 0 ? (
              <Typography textAlign="center" color="textSecondary" py={3}>
                لا توجد مشاهدات بعد
              </Typography>
            ) : (
              viewsModal.views.map((view, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 2, bgcolor: `${COLOR_SCHEME.primaryLight}10` }}>
                  <Avatar
                    src={view.user_image}
                    sx={{ width: 45, height: 45, mr: 2, bgcolor: COLOR_SCHEME.primary }}
                  >
                    {getInitials(view.user_full_name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight="bold" color={COLOR_SCHEME.text}>
                      {view.user_full_name}
                    </Typography>
                    <Typography variant="caption" color={COLOR_SCHEME.textSecondary}>
                      {formatDate(view.viewed_at)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: `1px solid ${COLOR_SCHEME.primaryLight}30` }}>
            <Button
              fullWidth
              variant="contained"
              onClick={closeViewsModal}
              sx={{ bgcolor: COLOR_SCHEME.primary, '&:hover': { bgcolor: COLOR_SCHEME.primaryDark }, borderRadius: 3 }}
            >
              إغلاق
            </Button>
          </Box>
        </Box>
      </Modal>

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : 4,
            background: `linear-gradient(135deg, ${COLOR_SCHEME.background} 0%, #ffffff 100%)`,
            minHeight: isMobile ? '100vh' : '85vh',
            maxHeight: isMobile ? '100vh' : '90vh',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(128, 180, 158, 0.3)',
            border: `1px solid ${COLOR_SCHEME.primaryLight}30`
          }
        }}
      >
        <AppBar
          position="static"
          sx={{
            background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${COLOR_SCHEME.primaryDark} 100%)`,
            borderRadius: isMobile ? '0' : '16px 16px 0 0',
            boxShadow: '0 4px 25px rgba(128, 180, 158, 0.4)',
            py: 1
          }}
        >
          <Toolbar sx={{ minHeight: '80px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: COLOR_SCHEME.success,
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  />
                }
              >
                <Avatar
                  src={userImage}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: COLOR_SCHEME.primaryLight,
                    fontWeight: 'bold',
                    fontSize: '1.4rem',
                    border: '3px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  {getInitials(userFullName)}
                </Avatar>
              </Badge>

              <Box sx={{ ml: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>
                  {userFullName}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.9)" sx={{ fontSize: '0.9rem' }}>
                  مرحباً بك في مجتمعنا ✨
                </Typography>
              </Box>
            </Box>

            {canCreatePost && (
  <Tooltip title="منشور جديد" arrow>
    <Button
      variant="contained"
      startIcon={<Add sx={{ fontSize: '1.3rem' }} />}
      onClick={() => setShowNewPostForm(true)}
      sx={{
        bgcolor: 'rgba(255,255,255,0.9)',
        color: COLOR_SCHEME.primaryDark,
        '&:hover': {
          bgcolor: 'white',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(255,255,255,0.3)'
        },
        transition: 'all 0.3s ease',
        mr: 3,
        px: 3,
        py: 1.2,
        borderRadius: 3,
        fontWeight: 'bold',
        fontSize: '1rem',
        boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
      }}
    >
      منشور جديد
    </Button>
  </Tooltip>
)}


            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'rotate(90deg)' },
                transition: 'all 0.3s ease',
                width: 50,
                height: 50
              }}
            >
              <Close sx={{ fontSize: '1.5rem' }} />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {error && (
            <Alert
              severity="error"
              sx={{ m: 2, borderRadius: 3, boxShadow: '0 4px 15px rgba(244, 67, 54, 0.2)', border: `1px solid ${COLOR_SCHEME.error}30` }}
              onClose={() => setError('')}
            >
              <Typography fontWeight="bold">{error}</Typography>
            </Alert>
          )}

          {/* New Post */}
          <AnimatePresence>
            {showNewPostForm && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card sx={{
                  m: 3,
                  border: `2px solid ${COLOR_SCHEME.primaryLight}50`,
                  boxShadow: '0 10px 40px rgba(128, 180, 158, 0.2)',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  overflow: 'visible'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <Avatar
                        src={userImage}
                        sx={{
                          width: 60,
                          height: 60,
                          mr: 3,
                          bgcolor: COLOR_SCHEME.primary,
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          border: `3px solid ${COLOR_SCHEME.primaryLight}`,
                          boxShadow: '0 4px 15px rgba(128, 180, 158, 0.3)'
                        }}
                      >
                        {getInitials(userFullName)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ mb: 0.5 }}>
                          {userFullName}
                        </Typography>
                        <Typography variant="body2" color={COLOR_SCHEME.primary} sx={{ fontSize: '1rem' }}>
                          شارك أفكارك مع المجتمع... 🌟
                        </Typography>
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      placeholder="ما الذي يدور في ذهنك؟ شاركنا أفكارك وإبداعاتك..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      sx={{ mb: 3 }}
                      variant="outlined"
                      InputProps={{
                        sx: {
                          borderRadius: 3,
                          fontSize: '1.1rem',
                          lineHeight: 1.7,
                          p: 2,
                          border: `2px solid ${COLOR_SCHEME.primaryLight}30`,
                          '&:hover': { borderColor: COLOR_SCHEME.primaryLight },
                          '&.Mui-focused': { borderColor: COLOR_SCHEME.primary, boxShadow: `0 0 0 3px ${COLOR_SCHEME.primaryLight}50` }
                        }
                      }}
                    />

                    {selectedImages.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: COLOR_SCHEME.text }}>
                          الصور المختارة ({selectedImages.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {selectedImages.map((image, index) => (
                            <Box
                              key={index}
                              sx={{
                                position: 'relative',
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s ease',
                                border: `3px solid ${COLOR_SCHEME.primaryLight}40`,
                                width: '48%',
                                minHeight: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f8fbfa',
                                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', borderColor: COLOR_SCHEME.primary }
                              }}
                            >
                              <img
                                src={image.preview}
                                alt={`معاينة ${index + 1}`}
                                style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'contain', display: 'block' }}
                              />
                              <IconButton
                                size="medium"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  bgcolor: 'rgba(244, 67, 54, 0.9)',
                                  color: 'white',
                                  '&:hover': { bgcolor: COLOR_SCHEME.error, transform: 'scale(1.1)' },
                                  transition: 'all 0.3s ease',
                                  width: 40,
                                  height: 40,
                                  border: '2px solid white'
                                }}
                                onClick={() => removeImage(index)}
                              >
                                <Close fontSize="medium" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Tooltip title="إضافة صورة" arrow>
                          <Button
                            variant="outlined"
                            startIcon={<ImageIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              borderColor: COLOR_SCHEME.primaryLight,
                              color: COLOR_SCHEME.primaryDark,
                              bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                              '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, borderColor: COLOR_SCHEME.primary, transform: 'translateY(-2px)' },
                              transition: 'all 0.3s ease',
                              borderRadius: 3,
                              px: 3,
                              py: 1
                            }}
                          >
                            صورة
                          </Button>
                        </Tooltip>

                        <Tooltip title="إضافة ايموجي" arrow>
                          <Button
                            variant="outlined"
                            startIcon={<EmojiEmotions />}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            sx={{
                              borderColor: COLOR_SCHEME.primaryLight,
                              color: COLOR_SCHEME.primaryDark,
                              bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                              '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, borderColor: COLOR_SCHEME.primary, transform: 'translateY(-2px)' },
                              transition: 'all 0.3s ease',
                              borderRadius: 3,
                              px: 3,
                              py: 1
                            }}
                          >
                            ايموجي
                          </Button>
                        </Tooltip>

                        {showEmojiPicker && (
                          <Box sx={{ position: 'absolute', zIndex: 9999, bottom: 70, left: 16 }}>
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                setNewPostContent(prev => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                              }}
                            />
                          </Box>
                        )}

                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          onClick={() => {
                            setShowNewPostForm(false);
                            setSelectedImages([]);
                            setNewPostContent('');
                            setShowEmojiPicker(false);
                          }}
                          variant="outlined"
                          color="inherit"
                          sx={{
                            borderRadius: 3,
                            px: 4,
                            py: 1.2,
                            fontSize: '1rem',
                            borderColor: COLOR_SCHEME.textSecondary,
                            color: COLOR_SCHEME.textSecondary,
                            '&:hover': { bgcolor: `${COLOR_SCHEME.textSecondary}10`, transform: 'translateY(-2px)' },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleCreatePost}
                          variant="contained"
                          disabled={!newPostContent.trim() && selectedImages.length === 0}
                          sx={{
                            bgcolor: COLOR_SCHEME.primary,
                            '&:hover': { bgcolor: COLOR_SCHEME.primaryDark, transform: 'translateY(-2px)', boxShadow: `0 8px 25px ${COLOR_SCHEME.primary}50` },
                            px: 5,
                            py: 1.2,
                            borderRadius: 3,
                            boxShadow: `0 4px 15px ${COLOR_SCHEME.primary}30`,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          نشر المنشور
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts List */}
          <Box sx={{
            p: 3,
            maxHeight: 'calc(90vh - 100px)',
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '10px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '8px' },
            '&::-webkit-scrollbar-thumb': { background: COLOR_SCHEME.primaryLight, borderRadius: '8px', '&:hover': { background: COLOR_SCHEME.primary } }
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ color: COLOR_SCHEME.primary, mb: 3 }} size={60} thickness={4} />
                  <Typography variant="h6" color={COLOR_SCHEME.text}>جاري تحميل المنشورات...</Typography>
                </Box>
              </Box>
            ) : posts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Box sx={{
                  width: 120, height: 120, bgcolor: `${COLOR_SCHEME.primaryLight}20`, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4
                }}>
                  <Typography variant="h2" color={COLOR_SCHEME.primary}>🏜️</Typography>
                </Box>
                <Typography variant="h4" color={COLOR_SCHEME.text} gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                  لا توجد منشورات حتى الآن
                </Typography>
                <Typography variant="h6" color={COLOR_SCHEME.textSecondary} sx={{ mb: 5, maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
                  كن أول من يشارك أفكاره ويبدأ المحادثة في مجتمعنا
                </Typography>
                    {canCreatePost && (
      <Button
        variant="contained"
        startIcon={<Add sx={{ fontSize: '1.3rem' }} />}
        onClick={() => setShowNewPostForm(true)}
        sx={{
          bgcolor: COLOR_SCHEME.primary,
          '&:hover': { bgcolor: COLOR_SCHEME.primaryDark, transform: 'translateY(-3px)', boxShadow: `0 10px 30px ${COLOR_SCHEME.primary}40` },
          px: 5, py: 2, borderRadius: 3, fontSize: '1.2rem', boxShadow: `0 6px 20px ${COLOR_SCHEME.primary}30`, transition: 'all 0.3s ease'
        }}
      >
        ابدأ بنشر أول منشور
      </Button>
    )}
              </Box>
            ) : (
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                    onViewportEnter={() => {
                      if (!post.user_has_viewed && post.user_guid !== userGuid) {
                        markPostAsViewed(post.id);
                      }
                    }}
                    viewport={{ once: true, margin: '0px 0px -100px 0px' }}
                  >
                    <Card sx={{
                      mb: 4,
                      border: `2px solid ${COLOR_SCHEME.primaryLight}20`,
                      boxShadow: '0 8px 30px rgba(128, 180, 158, 0.15)',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      overflow: 'hidden',
                      '&:hover': { boxShadow: '0 15px 40px rgba(128, 180, 158, 0.25)', transform: 'translateY(-5px)', borderColor: `${COLOR_SCHEME.primaryLight}40` },
                      transition: 'all 0.4s ease'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLOR_SCHEME.success, border: '2px solid white' }} />}
                            >
                              <Avatar
                                src={post.user_image}
                                sx={{
                                  width: 56, height: 56, mr: 3, bgcolor: COLOR_SCHEME.primary, fontWeight: 'bold', fontSize: '1.3rem',
                                  border: `3px solid ${COLOR_SCHEME.primaryLight}50`, boxShadow: '0 4px 15px rgba(128, 180, 158, 0.3)'
                                }}
                              >
                                {getInitials(post.user_full_name)}
                              </Avatar>
                            </Badge>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ mb: 0.5 }}>
                                {post.user_full_name || 'مستخدم'}
                              </Typography>
                              <Typography variant="body2" color={COLOR_SCHEME.textSecondary}>
                                {formatDate(post.created_at)}
                              </Typography>
                            </Box>
                          </Box>

                          {post.user_guid === userGuid && (
                            <>
                              <IconButton
                                size="medium"
                                onClick={(e) => { setPostMenuAnchor(e.currentTarget); setSelectedPost(post); }}
                                sx={{
                                  bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                                  '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, transform: 'scale(1.1)' },
                                  transition: 'all 0.3s ease',
                                  width: 45, height: 45
                                }}
                              >
                                <MoreVert />
                              </IconButton>

                              <Menu
                                anchorEl={postMenuAnchor}
                                open={Boolean(postMenuAnchor)}
                                onClose={() => setPostMenuAnchor(null)}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                sx={{
                                  '& .MuiPaper-root': {
                                    borderRadius: 3,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                    border: `1px solid ${COLOR_SCHEME.primaryLight}30`
                                  }
                                }}
                              >
                                <MenuItem
                                  onClick={() => handleDeletePost(selectedPost?.id)}
                                  sx={{ color: COLOR_SCHEME.error, py: 1.5, '&:hover': { bgcolor: `${COLOR_SCHEME.error}10` } }}
                                >
                                  <ListItemIcon>
                                    <Delete fontSize="medium" color="error" />
                                  </ListItemIcon>
                                  <ListItemText primary="حذف المنشور" primaryTypographyProps={{ fontWeight: 'bold' }} />
                                </MenuItem>
                              </Menu>
                            </>
                          )}
                        </Box>

                        {/* Content */}
                        {post.content && (
                          <Typography variant="body1" sx={{
                            mb: 4, lineHeight: 1.8, fontSize: '1.1rem', color: COLOR_SCHEME.text, p: 2,
                            bgcolor: `${COLOR_SCHEME.primaryLight}08`, borderRadius: 3, border: `1px solid ${COLOR_SCHEME.primaryLight}20`
                          }}>
                            {post.content}
                          </Typography>
                        )}

                        {post.image_url && (
                          <Box
                            sx={{
                              mb: 4,
                              borderRadius: 4,
                              overflow: 'hidden',
                              position: 'relative',
                              border: `3px solid ${COLOR_SCHEME.primaryLight}30`,
                              background: '#f8fbfa',
                              boxShadow: '0 8px 32px rgba(128, 180, 158, 0.2)',
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              aspectRatio: '16 / 9',
                              maxHeight: '500px'
                            }}
                          >
                            <img
                              src={post.image_url}
                              alt="منشور"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit', display: 'block', cursor: 'pointer', transition: 'transform 0.4s ease' }}
                              onClick={() => openImageModal(post.image_url)}
                              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.03)')}
                              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                bgcolor: 'rgba(128, 180, 158, 0.9)',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 3,
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(255,255,255,0.3)'
                              }}
                            >
                              انقر للتكبير 🔍
                            </Box>
                          </Box>
                        )}

                        {/* Stats */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                          <Tooltip title="عرض الإعجابات" arrow>
                            <Chip
                              icon={<Favorite sx={{ fontSize: 18 }} />}
                              label={`${post.likes_count} إعجاب`}
                              size="medium"
                              variant="outlined"
                              onClick={() => openLikesModal(post.likes)}
                              sx={{
                                borderRadius: 3,
                                borderColor: COLOR_SCHEME.primaryLight,
                                color: COLOR_SCHEME.primaryDark,
                                bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, transform: 'translateY(-2px)' },
                                transition: 'all 0.3s ease',
                                '& .MuiChip-icon': { color: post.user_has_liked ? COLOR_SCHEME.secondary : COLOR_SCHEME.primary }
                              }}
                            />
                          </Tooltip>

                          <Chip
                            icon={<Comment sx={{ fontSize: 18 }} />}
                            label={`${post.comments_count} تعليق`}
                            size="medium"
                            variant="outlined"
                            sx={{ borderRadius: 3, borderColor: COLOR_SCHEME.primaryLight, color: COLOR_SCHEME.primaryDark, bgcolor: `${COLOR_SCHEME.primaryLight}15`, fontWeight: 'bold' }}
                          />

                          {post.user_guid === userGuid && (
                            <Tooltip title="عرض المشاهدات" arrow>
                              <Chip
                                icon={<Visibility sx={{ fontSize: 18 }} />}
                                label={`${post.views_count || 0} مشاهدة`}
                                size="medium"
                                variant="outlined"
                                onClick={() => fetchPostViews(post.id)}
                                sx={{
                                  borderRadius: 3,
                                  borderColor: COLOR_SCHEME.primaryLight,
                                  color: COLOR_SCHEME.primaryDark,
                                  bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, transform: 'translateY(-2px)' },
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>

                        <Divider sx={{ my: 3, borderColor: COLOR_SCHEME.primaryLight }} />

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            fullWidth
                            startIcon={
                              post.user_has_liked
                                ? <Favorite sx={{ color: COLOR_SCHEME.secondary, fontSize: '1.3rem' }} />
                                : <FavoriteBorder sx={{ fontSize: '1.3rem' }} />
                            }
                            onClick={() => handleLike(post.id)}
                            sx={{
                              color: post.user_has_liked ? COLOR_SCHEME.secondary : COLOR_SCHEME.textSecondary,
                              borderRadius: 3,
                              py: 1.5,
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              bgcolor: post.user_has_liked ? `${COLOR_SCHEME.secondary}10` : 'transparent',
                              border: `2px solid ${post.user_has_liked ? COLOR_SCHEME.secondary : COLOR_SCHEME.primaryLight}`,
                              '&:hover': { bgcolor: post.user_has_liked ? `${COLOR_SCHEME.secondary}15` : `${COLOR_SCHEME.primaryLight}15`, transform: 'translateY(-2px)' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {post.user_has_liked ? 'معجب به' : 'أعجبني'}
                          </Button>

                          <Button
                            fullWidth
                            startIcon={<Comment sx={{ fontSize: '1.3rem' }} />}
                            onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                            sx={{
                              borderRadius: 3,
                              py: 1.5,
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: COLOR_SCHEME.textSecondary,
                              border: `2px solid ${COLOR_SCHEME.primaryLight}`,
                              bgcolor: 'transparent',
                              '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}15`, transform: 'translateY(-2px)' },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            تعليق
                          </Button>
                        </Box>

                        {/* Comments */}
                        <AnimatePresence>
                          {activeCommentPost === post.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                              <Box sx={{ mt: 4, position: 'relative' }}>
                                <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.text} sx={{ mb: 3 }}>
                                  التعليقات ({post.comments_count})
                                </Typography>

                                {(post.comments || []).map((comment) => (
                                  <motion.div key={comment.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        mb: 3,
                                        p: 3,
                                        bgcolor: `${COLOR_SCHEME.primaryLight}08`,
                                        borderRadius: 3,
                                        border: `1px solid ${COLOR_SCHEME.primaryLight}20`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}12`, transform: 'translateX(5px)' }
                                      }}
                                    >
                                      <Avatar
                                        src={comment.user_image}
                                        sx={{ width: 44, height: 44, mr: 2, bgcolor: COLOR_SCHEME.primary, fontWeight: 'bold', fontSize: '1.1rem', border: `2px solid ${COLOR_SCHEME.primaryLight}` }}
                                      >
                                        {getInitials(comment.user_full_name)}
                                      </Avatar>
                                      <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
                                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 2, color: COLOR_SCHEME.text }}>
                                            {comment.user_full_name}
                                          </Typography>
                                          <Typography variant="caption" color={COLOR_SCHEME.textSecondary} sx={{ fontSize: '0.8rem' }}>
                                            {formatDate(comment.created_at)}
                                          </Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ lineHeight: 1.6, color: COLOR_SCHEME.text }}>
                                          {comment.comment_text}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </motion.div>
                                ))}

                                {/* Add comment */}
                                <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'flex-start' }}>
                                  <Avatar
                                    src={userImage}
                                    sx={{ width: 44, height: 44, bgcolor: COLOR_SCHEME.primary, fontWeight: 'bold', border: `2px solid ${COLOR_SCHEME.primaryLight}` }}
                                  >
                                    {getInitials(userFullName)}
                                  </Avatar>
                                  <Box sx={{ flex: 1, position: 'relative' }}>
                                    <TextField
                                      fullWidth
                                      size="medium"
                                      placeholder="اكتب تعليقك... شاركنا رأيك 💭"
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      sx={{ mb: 2 }}
                                      multiline
                                      maxRows={4}
                                      InputProps={{
                                        sx: {
                                          borderRadius: 3,
                                          fontSize: '1rem',
                                          p: 2,
                                          border: `2px solid ${COLOR_SCHEME.primaryLight}30`,
                                          '&:hover': { borderColor: COLOR_SCHEME.primaryLight },
                                          '&.Mui-focused': { borderColor: COLOR_SCHEME.primary, boxShadow: `0 0 0 3px ${COLOR_SCHEME.primaryLight}50` }
                                        }
                                      }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                                        <Tooltip title="إضافة ايموجي" arrow>
                                          <IconButton
                                            size="medium"
                                            onClick={() => setShowCommentEmojiPicker(!showCommentEmojiPicker)}
                                            sx={{
                                              bgcolor: `${COLOR_SCHEME.primaryLight}15`,
                                              '&:hover': { bgcolor: `${COLOR_SCHEME.primaryLight}25`, transform: 'scale(1.1)' },
                                              transition: 'all 0.3s ease',
                                              width: 45, height: 45
                                            }}
                                          >
                                            <EmojiEmotions fontSize="medium" />
                                          </IconButton>
                                        </Tooltip>

                                        {showCommentEmojiPicker && (
                                          <Box sx={{ position: 'absolute', zIndex: 9999, bottom: 60, left: 0 }}>
                                            <EmojiPicker
                                              onEmojiClick={(emojiData) => {
                                                setCommentText(prev => prev + emojiData.emoji);
                                                setShowCommentEmojiPicker(false);
                                              }}
                                            />
                                          </Box>
                                        )}
                                      </Box>
                                      <Button
                                        variant="contained"
                                        size="large"
                                        endIcon={<Send sx={{ fontSize: '1.2rem' }} />}
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={!commentText.trim()}
                                        sx={{
                                          bgcolor: COLOR_SCHEME.primary,
                                          '&:hover': { bgcolor: COLOR_SCHEME.primaryDark, transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${COLOR_SCHEME.primary}40` },
                                          px: 4, py: 1.2, borderRadius: 3, fontSize: '1rem', fontWeight: 'bold', boxShadow: `0 4px 15px ${COLOR_SCHEME.primary}30`, transition: 'all 0.3s ease'
                                        }}
                                      >
                                        تعليق
                                      </Button>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostsDialog;
