import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  CircularProgress,
  Alert,
  Button,
  Divider,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ReportViewer from '../components/ReportViewer';
import ReportList from '../components/ReportList';

import useFetchReports from '../hooks/useFetchReports';
import { useAuth } from '../contexts/AuthContext';

// الألوان الجديدة
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const surfaceColor = '#ffffff';
const textPrimary = '#2c3e50';
const textSecondary = '#5d6d7e';

const ReportViewerPage = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  
  const {
    reports,
    loading,
    error,
    fetchReports
  } = useFetchReports(currentUser?.branchForWork, selectedDate);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedReport(null);
    setViewMode('list');
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  return (
    <NavigationShell variant="standard" ><Box display="flex" sx={{ backgroundColor: backgroundColor, minHeight: '100vh' }}>
      
      
      <Box 
        component="main" 
        sx={styles.mainContent}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Paper elevation={3} sx={styles.paperContainer}>
              <Box sx={uiLayout.withUiSx(styles.headerContainer, uiLayout.pageHeaderSx)}>
                <Typography variant="h4" component="h1" sx={styles.title}>
                  تقارير المتابعة اليومية
                </Typography>
                
                <Box sx={uiLayout.withUiSx(styles.searchContainer, uiLayout.filterBarSx)}>
                  <DatePicker
                    label="اختر تاريخ التقرير"
                    value={selectedDate}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField InputLabelProps={{ shrink: true }} 
                        {...params} 
                        size="small"
                        sx={uiLayout.withUiSx(styles.datePicker, uiLayout.formFieldSx)}
                      />
                    )}
                    inputFormat="yyyy-MM-dd"
                  />
                  
                  <Button
                    variant="contained"
                    onClick={fetchReports}
                    disabled={loading}
                    sx={uiLayout.withUiSx(styles.searchButton, uiLayout.buttonSx)}
                  >
                    بحث
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={styles.divider} />
              
              {loading ? (
                <Box sx={styles.loadingContainer}>
                  <CircularProgress sx={{ color: primaryColor }} size={60} />
                  <Typography variant="h6" sx={{ color: primaryDark, mt: 2 }}>
                    جاري تحميل التقارير...
                  </Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={styles.alert}>
                  {error}
                </Alert>
              ) : viewMode === 'list' ? (
                <ReportList 
                  reports={reports} 
                  onSelectReport={handleReportSelect}
                  selectedDate={selectedDate}
                />
              ) : (
                <Box>
                  <Button 
                    variant="outlined" 
                    onClick={handleBackToList}
                    sx={uiLayout.withUiSx(styles.backButton, uiLayout.buttonSx)}
                  >
                    العودة إلى القائمة
                  </Button>
                  <ReportViewer report={selectedReport} />
                </Box>
              )}
            </Paper>
          </Container>
        </LocalizationProvider>
      </Box>
    </Box></NavigationShell>
  );
};

const styles = {
  mainContent: {
    flexGrow: 1,
    p: 3,
    transition: 'margin 0.3s ease',
    backgroundColor: backgroundColor,
    minHeight: '100vh',
    '@media (max-width: 900px)': {
      marginLeft: '0'
    },
    ...navigationContentSx
  },
  paperContainer: {
    p: 4, 
    mb: 4,
    borderRadius: '16px',
    backgroundColor: surfaceColor,
    background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
    border: `1px solid ${primaryLight}`,
    boxShadow: '0 8px 32px rgba(128, 180, 158, 0.1)'
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 3,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2
    }
  },
  title: {
    fontWeight: 'bold',
    color: primaryDark,
    fontFamily: 'Cairo, sans-serif',
    fontSize: '2rem',
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      width: '100%',
      gap: 1
    }
  },
  datePicker: {
    width: 220,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '& fieldset': {
        borderColor: primaryLight,
      },
      '&:hover fieldset': {
        borderColor: primaryColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: primaryColor,
        boxShadow: `0 0 0 2px ${primaryLight}80`
      }
    },
    '& .MuiInputLabel-root': {
      color: primaryDark,
      fontFamily: 'Cairo, sans-serif'
    },
    '@media (max-width: 480px)': {
      width: '100%'
    }
  },
  searchButton: {
    minWidth: 120,
    backgroundColor: primaryColor,
    color: 'white',
    borderRadius: '12px',
    fontFamily: 'Cairo, sans-serif',
    fontWeight: '600',
    padding: '8px 24px',
    boxShadow: '0 4px 12px rgba(128, 180, 158, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: primaryDark,
      boxShadow: '0 6px 16px rgba(128, 180, 158, 0.4)',
      transform: 'translateY(-2px)'
    },
    '&:disabled': {
      backgroundColor: primaryLight,
      boxShadow: 'none',
      transform: 'none'
    }
  },
  divider: {
    my: 3,
    backgroundColor: primaryLight,
    height: '2px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    py: 8,
    backgroundColor: '#f8fbfa',
    borderRadius: '12px',
    border: `1px solid ${primaryLight}`
  },
  alert: {
    mb: 3,
    borderRadius: '12px',
    border: `1px solid #e74c3c`,
    backgroundColor: '#ffeaea',
    fontFamily: 'Cairo, sans-serif',
    '& .MuiAlert-icon': {
      color: '#e74c3c'
    }
  },
  backButton: {
    mb: 3,
    borderRadius: '12px',
    borderColor: primaryColor,
    color: primaryColor,
    fontFamily: 'Cairo, sans-serif',
    fontWeight: '600',
    padding: '8px 24px',
    borderWidth: '2px',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: primaryDark,
      color: primaryDark,
      backgroundColor: `${primaryLight}20`,
      borderWidth: '2px'
    }
  }
};

export default ReportViewerPage;