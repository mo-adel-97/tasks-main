import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
 // تأكد من المسار الصحيح
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Fab,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Announcement as AnnouncementIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as PriorityHighIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// استايلات مخصصة
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledCard = styled(Card)(({ theme, priority }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  borderInlineStart: `5px solid ${
    priority === 'high' ? '#ff4444' :
    priority === 'medium' ? '#ffaa00' :
    '#4CAF50'
  }`,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
  },
}));

const HeaderSection = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  color: 'white',
  padding: theme.spacing(4),
  borderRadius: '16px',
  marginBottom: theme.spacing(4),
  boxShadow: '0 10px 30px rgba(106, 17, 203, 0.3)',
}));

const ImagePreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  border: '2px dashed #ddd',
  borderRadius: '12px',
  minHeight: '100px',
  backgroundColor: '#fafafa',
}));

const ImagePreviewItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '120px',
  height: '120px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '2px solid #e0e0e0',
  '&:hover': {
    borderColor: '#6a11cb',
    '& .delete-overlay': {
      opacity: 1,
    },
  },
}));

const DeleteOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  cursor: 'pointer',
}));

const Announcements = () => {
  // States
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    images: [], // أصبحت مصفوفة بدل صورة واحدة
    priority: 'normal',
    category: 'general'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // فئات الإعلانات
  const categories = [
    { id: 'general', name: 'عام', color: '#4CAF50', icon: '📢' },
    { id: 'important', name: 'مهم', color: '#FF9800', icon: '⚠️' },
    { id: 'urgent', name: 'عاجل', color: '#F44336', icon: '🚨' },
    { id: 'update', name: 'تحديث', color: '#2196F3', icon: '🔄' },
    { id: 'event', name: 'فعالية', color: '#9C27B0', icon: '🎉' },
    { id: 'news', name: 'أخبار', color: '#00BCD4', icon: '📰' },
  ];

  // بيانات تجريبية
  const sampleAnnouncements = [
    {
      id: 1,
      title: 'تحديث النظام الجديد',
      content: 'تم تحديث النظام بإضافة ميزات جديدة لتحسين تجربة المستخدم. يرجى الاطلاع على التغييرات.',
      images: [
        'https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=System+Update+1',
        'https://via.placeholder.com/400x200/2196F3/FFFFFF?text=System+Update+2'
      ],
      date: '2024-01-15',
      author: 'مدير النظام',
      priority: 'high',
      category: 'update',
      views: 245,
      isNew: true
    },
    {
      id: 2,
      title: 'ورشة عمل تدريبية',
      content: 'ورشة عمل حول تطوير المهارات التقنية يوم الخميس القادم في القاعة الرئيسية.',
      images: [
        'https://via.placeholder.com/400x200/2196F3/FFFFFF?text=Training+Workshop',
        'https://via.placeholder.com/400x200/FF9800/FFFFFF?text=Training+Materials'
      ],
      date: '2024-01-10',
      author: 'قسم التدريب',
      priority: 'medium',
      category: 'event',
      views: 189,
      isNew: false
    },
    {
      id: 3,
      title: 'إجازة عيد الأضحى',
      content: 'تعلن الإدارة عن إجازة عيد الأضحى المبارك لمدة أسبوع بدءاً من يوم الاثنين.',
      images: [
        'https://via.placeholder.com/400x200/9C27B0/FFFFFF?text=Eid+Holiday'
      ],
      date: '2024-01-05',
      author: 'الإدارة العامة',
      priority: 'normal',
      category: 'general',
      views: 342,
      isNew: false
    },
  ];

  // محاكاة جلب البيانات
  useEffect(() => {
    setTimeout(() => {
      setAnnouncements(sampleAnnouncements);
      setLoading(false);
    }, 1000);
  }, []);

  // فتح/إغلاق دايالوج الإضافة
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewAnnouncement({
      title: '',
      content: '',
      images: [],
      priority: 'normal',
      category: 'general'
    });
  };

  // معالجة رفع الصور المتعددة
  const handleImagesUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newImages = [...newAnnouncement.images];
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`ملف ${file.name} حجمه كبير جداً. الحد الأقصى 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          id: Date.now() + Math.random(),
          url: reader.result,
          file: file,
          name: file.name
        });
        setNewAnnouncement({
          ...newAnnouncement,
          images: newImages
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // حذف صورة من المعاينة
  const handleRemoveImage = (imageId) => {
    const filteredImages = newAnnouncement.images.filter(img => img.id !== imageId);
    setNewAnnouncement({
      ...newAnnouncement,
      images: filteredImages
    });
  };

  // إضافة إعلان جديد
  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newAnn = {
      id: announcements.length + 1,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      images: newAnnouncement.images.map(img => img.url),
      date: new Date().toISOString().split('T')[0],
      author: 'أنت',
      priority: newAnnouncement.priority,
      category: newAnnouncement.category,
      views: 0,
      isNew: true
    };

    setAnnouncements([newAnn, ...announcements]);
    handleCloseDialog();
  };

  // حذف إعلان
  const handleDeleteAnnouncement = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      setAnnouncements(announcements.filter(ann => ann.id !== id));
    }
  };

  // عرض تفاصيل الإعلان
  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setPreviewOpen(true);
  };

  // فلترة الإعلانات
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || announcement.category === filter;
    return matchesSearch && matchesFilter;
  });

  // الحصول على أيقونة الفئة
  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : '📢';
  };

  // الحصول على لون الفئة
  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#4CAF50';
  };

  // الحصول على اسم الفئة
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'عام';
  };

  return (
    <NavigationShell variant="standard" ><Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* السايدبار */}
      
      
      {/* المحتوى الرئيسي */}
      <Box 
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#f8f9fa',
          paddingTop: 3,
          paddingBottom: 3,
          ...navigationContentSx
        }}
      >
        <Container maxWidth="xl">
          {/* الهيدر */}
          <HeaderSection>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <AnnouncementIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    لوحة الإعلانات
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    ابقَ على اطلاع بآخر الأخبار والتحديثات
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={uiLayout.withUiSx({
                  bgcolor: 'white',
                  color: '#6a11cb',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)'
                  }
                }, uiLayout.buttonSx)}
              >
                إعلان جديد
              </Button>
            </Box>
          </HeaderSection>

          {/* شريط البحث والفلترة */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 300 }}>
              <SearchIcon sx={{ color: 'text.secondary', marginInlineEnd: 1 }} />
              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
                placeholder="ابحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={uiLayout.withUiSx({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  }
                }, uiLayout.formFieldSx)}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<FilterListIcon />}
                label="الكل"
                onClick={() => setFilter('all')}
                color={filter === 'all' ? 'primary' : 'default'}
                sx={{ borderRadius: '8px' }}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  icon={<span>{category.icon}</span>}
                  label={category.name}
                  onClick={() => setFilter(category.id)}
                  sx={{
                    borderRadius: '8px',
                    bgcolor: filter === category.id ? category.color : 'transparent',
                    color: filter === category.id ? 'white' : 'inherit',
                    border: `1px solid ${category.color}`,
                    '&:hover': {
                      bgcolor: category.color,
                      color: 'white'
                    }
                  }}
                />
              ))}
            </Box>

            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Paper>

          {/* عرض حالة التحميل */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {/* إحصائيات */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      {announcements.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إعلان نشط
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {announcements.filter(a => a.isNew).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إعلانات جديدة
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="warning.main">
                      {announcements.filter(a => a.priority === 'high').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      إعلانات عاجلة
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="info.main">
                      {announcements.reduce((sum, a) => sum + a.views, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      مشاهدات
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* قائمة الإعلانات */}
              {filteredAnnouncements.length === 0 ? (
                <Alert 
                  severity="info" 
                  sx={{ 
                    borderRadius: '12px',
                    mb: 4 
                  }}
                >
                  لا توجد إعلانات مطابقة للبحث
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {filteredAnnouncements.map((announcement) => (
                    <Grid item xs={12} sm={6} md={4} key={announcement.id}>
                      <StyledCard priority={announcement.priority}>
                        {/* صورة الإعلان - أول صورة فقط في البطاقة */}
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={announcement.images[0]}
                            alt={announcement.title}
                            sx={{ objectFit: 'cover' }}
                          />
                          
                          {/* عدد الصور الإضافية */}
                          {announcement.images.length > 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                bgcolor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <CollectionsIcon fontSize="small" />
                              +{announcement.images.length - 1}
                            </Box>
                          )}
                          
                          {/* علامة جديدة */}
                          {announcement.isNew && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                bgcolor: '#FF4081',
                                color: 'white',
                                px: 2,
                                py: 0.5,
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 10px rgba(255,64,129,0.3)'
                              }}
                            >
                              جديد
                            </Box>
                          )}

                          {/* شريط الفئة */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: announcement.isNew ? 45 : 10,
                              right: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              backdropFilter: 'blur(10px)',
                              px: 2,
                              py: 0.5,
                              borderRadius: '20px'
                            }}
                          >
                            <span>{getCategoryIcon(announcement.category)}</span>
                            <Typography variant="caption" fontWeight="bold">
                              {getCategoryName(announcement.category)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* محتوى الإعلان */}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {announcement.title}
                            </Typography>
                            
                            {/* أولوية الإعلان */}
                            {announcement.priority === 'high' && (
                              <PriorityHighIcon color="error" />
                            )}
                            {announcement.priority === 'medium' && (
                              <ScheduleIcon color="warning" />
                            )}
                          </Box>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {announcement.content}
                          </Typography>

                          {/* معلومات الإعلان */}
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="caption">
                                {announcement.author}
                              </Typography>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                              {announcement.date}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <VisibilityIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {announcement.views} مشاهدة
                            </Typography>
                          </Box>
                        </CardContent>

                        {/* أزرار الإجراءات */}
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Box>
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewDetails(announcement)}
                              sx={uiLayout.withUiSx({ borderRadius: '8px' }, uiLayout.buttonSx)}
                            >
                              عرض التفاصيل
                            </Button>
                          </Box>
                          
                          <Box>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardActions>
                      </StyledCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* زر الإضافة العائم */}
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleOpenDialog}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              width: 60,
              height: 60,
              bgcolor: '#6a11cb',
              '&:hover': {
                bgcolor: '#5a0cb0'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Container>

        {/* دايالوج إضافة إعلان جديد */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={uiLayout.withUiSx({
            '& .MuiDialog-paper': {
              borderRadius: '16px',
            }
          }, uiLayout.dialogLayoutSx)}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                إضافة إعلان جديد
              </Typography>
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="عنوان الإعلان"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  required
                  sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="محتوى الإعلان"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  multiline
                  rows={6}
                  required
                  sx={uiLayout.withUiSx({ mb: 2 }, uiLayout.formFieldSx)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  أولوية الإعلان
                </Typography>
                <Box display="flex" gap={2}>
                  {[
                    { value: 'normal', label: 'عادي', color: '#4CAF50' },
                    { value: 'medium', label: 'متوسط', color: '#FF9800' },
                    { value: 'high', label: 'عاجل', color: '#F44336' }
                  ].map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => setNewAnnouncement({...newAnnouncement, priority: option.value})}
                      sx={{
                        bgcolor: newAnnouncement.priority === option.value ? option.color : '#f5f5f5',
                        color: newAnnouncement.priority === option.value ? 'white' : 'inherit',
                        border: `1px solid ${option.color}`,
                        '&:hover': {
                          bgcolor: option.color,
                          color: 'white'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  فئة الإعلان
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      icon={<span>{category.icon}</span>}
                      onClick={() => setNewAnnouncement({...newAnnouncement, category: category.id})}
                      sx={{
                        bgcolor: newAnnouncement.category === category.id ? category.color : '#f5f5f5',
                        color: newAnnouncement.category === category.id ? 'white' : 'inherit',
                        border: `1px solid ${category.color}`,
                        '&:hover': {
                          bgcolor: category.color,
                          color: 'white'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  صور الإعلان (يمكن رفع أكثر من صورة)
                </Typography>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={uiLayout.withUiSx({
                    py: 2,
                    borderStyle: 'dashed',
                    borderRadius: '12px'
                  }, uiLayout.buttonSx)}
                >
                  رفع صور متعددة
                  <VisuallyHiddenInput 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleImagesUpload}
                  />
                </Button>
                
                {newAnnouncement.images.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {newAnnouncement.images.length} صورة مرفوعة
                    </Typography>
                    
                    <ImagePreviewContainer>
                      {newAnnouncement.images.map((image) => (
                        <ImagePreviewItem key={image.id}>
                          <img 
                            src={image.url} 
                            alt={image.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <DeleteOverlay 
                            className="delete-overlay"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <CancelIcon sx={{ color: 'white', fontSize: 24 }} />
                          </DeleteOverlay>
                        </ImagePreviewItem>
                      ))}
                      
                      {/* زر إضافة المزيد من الصور */}
                      <Box
                        component="label"
                        sx={{
                          width: '120px',
                          height: '120px',
                          border: '2px dashed #6a11cb',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(106, 17, 203, 0.05)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(106, 17, 203, 0.1)',
                            borderColor: '#2575fc',
                          }
                        }}
                      >
                        <AddIcon sx={{ color: '#6a11cb', fontSize: 32, mb: 1 }} />
                        <Typography variant="caption" color="#6a11cb" fontWeight="bold">
                          إضافة صور
                        </Typography>
                        <VisuallyHiddenInput 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleImagesUpload}
                        />
                      </Box>
                    </ImagePreviewContainer>
                  </>
                )}
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={uiLayout.withUiSx({ px: 3, pb: 3 }, uiLayout.dialogActionsSx)}>
            <Button sx={uiLayout.buttonSx} onClick={handleCloseDialog} color="inherit">
              إلغاء
            </Button>
            <Button
              onClick={handleAddAnnouncement}
              variant="contained"
              startIcon={<CheckCircleIcon />}
              sx={uiLayout.withUiSx({
                bgcolor: '#6a11cb',
                '&:hover': {
                  bgcolor: '#5a0cb0'
                }
              }, uiLayout.buttonSx)}
            >
              نشر الإعلان
            </Button>
          </DialogActions>
        </Dialog>

        {/* دايالوج عرض التفاصيل */}
        <Dialog sx={uiLayout.dialogLayoutSx}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedAnnouncement && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h5" fontWeight="bold">
                    {selectedAnnouncement.title}
                  </Typography>
                  <IconButton onClick={() => setPreviewOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              
              <DialogContent dividers>
                {/* عرض الصور المتعددة */}
                {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      الصور ({selectedAnnouncement.images.length})
                    </Typography>
                    
                    {selectedAnnouncement.images.length > 1 ? (
                      <Grid container spacing={2}>
                        {selectedAnnouncement.images.map((image, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <img 
                              src={image} 
                              alt={`${selectedAnnouncement.title} - ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <img 
                        src={selectedAnnouncement.images[0]} 
                        alt={selectedAnnouncement.title}
                        style={{
                          width: '100%',
                          height: '300px',
                          objectFit: 'cover',
                          borderRadius: '12px'
                        }}
                      />
                    )}
                  </Box>
                )}
                
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  المحتوى
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedAnnouncement.content}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الكاتب
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedAnnouncement.author}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      التاريخ
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedAnnouncement.date}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الفئة
                    </Typography>
                    <Chip
                      label={getCategoryName(selectedAnnouncement.category)}
                      sx={{
                        bgcolor: getCategoryColor(selectedAnnouncement.category),
                        color: 'white'
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      المشاهدات
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedAnnouncement.views}
                    </Typography>
                  </Grid>
                </Grid>
              </DialogContent>
              
              <DialogActions sx={uiLayout.withUiSx({ px: 3, pb: 3 }, uiLayout.dialogActionsSx)}>
                <Button sx={uiLayout.buttonSx} onClick={() => setPreviewOpen(false)} variant="contained">
                  إغلاق
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box></NavigationShell>
  );
};

export default Announcements;