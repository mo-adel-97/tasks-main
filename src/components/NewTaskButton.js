import React, { useState } from 'react';
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Checklist as ChecklistIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PublicTaskDialog from './PublicTaskDialog';

// Color palette based on #80b49e
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

const NewTaskButton = ({ 
  userJop,
  onPublicTaskSelect,
  onPrivateTaskSelect,
  buttonProps = {},
  dialogProps = {}
}) => {
  const [selectTaskTypeOpen, setSelectTaskTypeOpen] = useState(false);
  const [publicTaskDialogOpen, setPublicTaskDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState(null);
  
  // States for PublicTaskDialog
  const [mainTaskName, setMainTaskName] = useState("");
  const [mainTaskTime, setMainTaskTime] = useState(0);
  const [taskUsers, setTaskUsers] = useState({ default: [] });

  const handleTaskUsersChange = (key, value) => {
    setTaskUsers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddTask = () => {
    setTaskType(null);
    setSelectTaskTypeOpen(true);
  };

  const handleClose = () => {
    setSelectTaskTypeOpen(false);
  };

  const handlePublicSelect = () => {
    setTaskType("public");
    handleClose();
    setPublicTaskDialogOpen(true);
    if (onPublicTaskSelect) onPublicTaskSelect();
  };

  const handlePrivateSelect = () => {
    setTaskType("private");
    handleClose();
    if (onPrivateTaskSelect) onPrivateTaskSelect();
  };

  const handlePublicTaskDialogClose = () => {
    setPublicTaskDialogOpen(false);
    // Reset form when closing
    setMainTaskName("");
    setMainTaskTime(0);
    setTaskUsers({ default: [] });
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="contained" 
          onClick={handleAddTask}
          startIcon={<AddIcon />}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: '10px',
            boxShadow: `0 4px 12px ${colorPalette.primary}40`,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            backgroundColor: colorPalette.primary,
            '&:hover': {
              backgroundColor: colorPalette.primaryDark,
              boxShadow: `0 6px 20px ${colorPalette.primary}60`
            },
            ...buttonProps.sx
          }}
          {...buttonProps}
        >
          إضافة مهمة جديدة
        </Button>
      </motion.div>

      {/* Task Type Selection Dialog */}
      <Dialog 
        open={selectTaskTypeOpen} 
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: `linear-gradient(to bottom, ${colorPalette.background}, #ffffff)`,
            minHeight: '500px',
            minWidth: "1200px",
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colorPalette.primaryLighter}`,
            ...dialogProps.sx
          }
        }}
        {...dialogProps}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
          color: 'white',
          py: 2,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <Typography variant="h5" fontWeight={600} sx={{ fontFamily: '"Cairo", sans-serif' }}>
            اختر نوع المهمة
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorPalette.background
        }}>
          <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: '1000px' }}>
            {/* Public Task Option */}
              <Grid item xs={12} md={5}>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Paper
                    onClick={handlePublicSelect}
                    elevation={0}
                    sx={{ 
                      p: 4, 
                      cursor: "pointer", 
                      textAlign: "center", 
                      backgroundColor: colorPalette.primaryLighter,
                      borderRadius: '16px',
                      border: `2px solid ${colorPalette.primaryLight}`,
                      height: '100%',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        boxShadow: `0 12px 28px ${colorPalette.primary}30`,
                        backgroundColor: colorPalette.primaryLight,
                        borderColor: colorPalette.primary,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <Box sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: colorPalette.primaryLighter,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      border: `2px solid ${colorPalette.primary}`
                    }}>
                      <PublicIcon sx={{ 
                        fontSize: '2.5rem', 
                        color: colorPalette.primary
                      }} />
                    </Box>
                    <Typography variant="h5" fontWeight={600} sx={{ color: colorPalette.textDark, fontFamily: '"Cairo", sans-serif' }} gutterBottom>
                      مهمة عامة
                    </Typography>
                    <Typography variant="body1" sx={{ color: colorPalette.textLight, mb: 2, fontFamily: '"Cairo", sans-serif', lineHeight: 1.6 }}>
                      إنشاء مهمة يدوية مخصصة لمستخدم أو مجموعة مستخدمين
                    </Typography>
                    <Chip 
                      label="اختيار"
                      sx={{ 
                        mt: 2, 
                        fontWeight: 600,
                        backgroundColor: colorPalette.primary,
                        color: 'white',
                        fontFamily: '"Cairo", sans-serif',
                        '&:hover': {
                          backgroundColor: colorPalette.primaryDark
                        }
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            
            {/* Private Task Option */}
            {/* <Grid item xs={12} md={5}>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  onClick={handlePrivateSelect}
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    cursor: "pointer", 
                    textAlign: "center", 
                    backgroundColor: "#f3e5f5",
                    borderRadius: '16px',
                    border: '2px solid rgba(156, 39, 176, 0.1)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      boxShadow: '0 12px 28px rgba(156, 39, 176, 0.2)',
                      backgroundColor: '#e1bee7',
                      borderColor: 'secondary.light'
                    }
                  }}
                >
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    <PrivateIcon sx={{ 
                      fontSize: '2.5rem', 
                      color: 'secondary.main'
                    }} />
                  </Box>
                  <Typography variant="h5" fontWeight={600} color="secondary.main" gutterBottom>
                    مهمة خاصة
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    توزيع المهام الجاهزة على المستخدمين حسب الأقسام
                  </Typography>
                  <Chip 
                    label="اختيار"
                    color="secondary"
                    size="small"
                    sx={{ mt: 2, fontWeight: 600 }}
                  />
                </Paper>
              </motion.div>
            </Grid> */}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Public Task Dialog */}
      <PublicTaskDialog
        open={publicTaskDialogOpen}
        onClose={handlePublicTaskDialogClose}
        mainTaskName={mainTaskName}
        setMainTaskName={setMainTaskName}
        mainTaskTime={mainTaskTime}
        setMainTaskTime={setMainTaskTime}
        taskUsers={taskUsers}
        handleTaskUsersChange={handleTaskUsersChange}
      />
    </>
  );
};

export default NewTaskButton;