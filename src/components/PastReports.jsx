import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Button,
  Divider,
  TextField,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ar } from 'date-fns/locale';
import ReportViewer from '../components/ReportViewer';
import ReportList from '../components/ReportList';

import useFetchReports from '../hooks/useFetchReports';
import { useAuth } from '../contexts/AuthContext';

const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const DARK_BORDER = '#67C99D';

const dateKey = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const ReportViewerPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const surfaces = theme.palette.surfaces || {};

  const colors = {
    page: isDark
      ? (theme.palette.background?.default || '#0d1b15')
      : backgroundColor,
    card: isDark
      ? (surfaces.card || '#13251d')
      : '#ffffff',
    section: isDark
      ? (surfaces.section || '#172b22')
      : '#f8fbfa',
    nested: isDark
      ? (surfaces.nested || '#1b3328')
      : '#f0f7f4',
    hover: isDark
      ? (surfaces.hover || '#214333')
      : '#eef7f2',
    selected: isDark
      ? (surfaces.selected || '#28513f')
      : '#e5f4ec',
    text: isDark
      ? (theme.palette.text?.primary || '#edf8f3')
      : '#2c3e50',
    muted: isDark
      ? (theme.palette.text?.secondary || '#bdd2c8')
      : '#5d6d7e',
    border: isDark ? DARK_BORDER : primaryLight
  };

  const { currentUser } = useAuth();

  // draftDate = تاريخ الاختيار فقط، selectedDate = التاريخ المعتمد فعليًا للـ API.
  // الفصل بينهما يمنع الطلب أثناء كل تغيير في DatePicker ويقلل الـ duplicate requests.
  const [draftDate, setDraftDate] = useState(null);
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
    setDraftDate(date);
    setSelectedReport(null);
    setViewMode('list');
  };

  const handleSearch = () => {
    if (!draftDate || loading) return;

    const nextDateKey = dateKey(draftDate);
    const currentDateKey = dateKey(selectedDate);

    setSelectedReport(null);
    setViewMode('list');

    // تاريخ جديد: نغيّر dependency فقط، والـ hook ينفذ request واحد.
    if (nextDateKey !== currentDateKey) {
      setSelectedDate(draftDate);
      return;
    }

    // نفس التاريخ: Refresh صريح واحد فقط.
    fetchReports?.();
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  const styles = {
    root: {
      display: 'flex',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      minHeight: '100vh',
      backgroundColor: colors.page,
      overflowX: 'hidden',
      direction: 'rtl'
    },

    mainContent: {
      flexGrow: 1,
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      p: { xs: 0.5, sm: 1, md: 2 },
      transition: 'margin 0.3s ease',
      backgroundColor: colors.page,
      minHeight: '100vh',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      ...navigationContentSx
    },

    container: {
      width: '100%',
      maxWidth: '100% !important',
      minWidth: 0,
      boxSizing: 'border-box',
      py: { xs: 0.5, sm: 1.5, md: 2.5 },
      px: { xs: 0, sm: 1, md: 2 },
      overflowX: 'hidden'
    },

    paperContainer: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      p: { xs: 0.8, sm: 1.5, md: 2.5 },
      mb: 2,
      borderRadius: { xs: 1.5, sm: 2, md: 3 },
      backgroundColor: colors.card,
      backgroundImage: isDark
        ? 'none'
        : 'linear-gradient(135deg, #ffffff 0%, #f0f7f4 100%)',
      border: `1px solid ${colors.border}`,
      boxShadow: isDark
        ? '0 12px 30px rgba(3,20,13,.24)'
        : '0 8px 32px rgba(128,180,158,.10)',
      boxSizing: 'border-box',
      overflowX: 'hidden',

      '& .MuiPaper-root': {
        backgroundImage: 'none',
        ...(isDark && {
          backgroundColor: colors.section,
          borderColor: `${DARK_BORDER} !important`
        })
      },

      '& .MuiCard-root': {
        backgroundImage: 'none',
        ...(isDark && {
          backgroundColor: colors.section,
          border: `1px solid ${DARK_BORDER}`
        })
      },

      '& .MuiTableContainer-root': {
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        ...(isDark && {
          backgroundColor: colors.section,
          border: `1px solid ${DARK_BORDER}`
        })
      },

      '& .MuiTable-root': {
        width: '100%',
        maxWidth: '100%',
        tableLayout: 'fixed'
      },

      '& .MuiTableCell-root': {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        overflowWrap: 'anywhere',
        color: colors.text,
        ...(isDark && {
          borderColor: 'rgba(103,201,157,.28)'
        })
      },

      '& .MuiTableHead-root .MuiTableCell-root': {
        ...(isDark && {
          backgroundColor: colors.nested,
          color: '#edf8f3'
        })
      },

      '& .MuiChip-root': {
        ...(isDark && {
          backgroundColor: 'transparent !important',
          backgroundImage: 'none !important',
          border: `1px solid ${DARK_BORDER} !important`,
          color: `${colors.text} !important`,
          boxShadow: 'none !important'
        })
      },

      '& .MuiButton-root': {
        ...(isDark && {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          borderColor: DARK_BORDER,
          color: DARK_BORDER,
          boxShadow: 'none'
        })
      },

      '& .MuiOutlinedInput-root': {
        color: colors.text,
        backgroundColor: isDark ? 'transparent' : '#fff',
        borderRadius: '10px',
        minWidth: 0,

        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.border,
          borderWidth: '1px'
        },

        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? DARK_BORDER : primaryColor
        },

        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? DARK_BORDER : primaryColor,
          borderWidth: '1px'
        }
      },

      '& .MuiInputLabel-root': {
        color: colors.muted,
        fontFamily: 'Cairo, sans-serif'
      },

      '& .MuiInputLabel-root.Mui-focused': {
        color: isDark ? DARK_BORDER : primaryDark
      },

      '& .MuiTypography-root': {
        fontFamily: 'Cairo, sans-serif'
      }
    },

    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: { xs: 1.2, sm: 2 },
      mb: { xs: 1.2, sm: 2 },
      minWidth: 0,

      '@media (max-width: 768px)': {
        flexDirection: 'column',
        alignItems: 'stretch'
      }
    },

    title: {
      fontWeight: 900,
      color: isDark ? '#edf8f3' : primaryDark,
      fontFamily: 'Cairo, sans-serif',
      fontSize: { xs: '1rem', sm: '1.35rem', md: '1.65rem' },
      lineHeight: 1.5,
      minWidth: 0,
      overflowWrap: 'anywhere',

      ...(isDark
        ? {}
        : {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          })
    },

    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: { xs: 0.8, sm: 1.2 },
      minWidth: 0,
      maxWidth: '100%',

      '@media (max-width: 480px)': {
        flexDirection: 'column',
        width: '100%'
      }
    },

    datePicker: {
      width: { xs: '100%', sm: 220 },
      minWidth: 0,

      '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: isDark ? 'transparent' : '#fff',

        '& fieldset': {
          borderColor: colors.border,
          borderWidth: '1px'
        },

        '&:hover fieldset': {
          borderColor: isDark ? DARK_BORDER : primaryColor
        },

        '&.Mui-focused fieldset': {
          borderColor: isDark ? DARK_BORDER : primaryColor,
          borderWidth: '1px',
          boxShadow: isDark
            ? '0 0 0 2px rgba(103,201,157,.10)'
            : `0 0 0 2px ${primaryLight}80`
        }
      },

      '& .MuiInputBase-input': {
        color: colors.text,
        fontFamily: 'Cairo, sans-serif'
      },

      '& .MuiSvgIcon-root': {
        color: isDark ? DARK_BORDER : primaryDark
      }
    },

    searchButton: {
      minWidth: { xs: '100%', sm: 110 },
      minHeight: 38,
      backgroundColor: isDark ? 'transparent' : primaryColor,
      color: isDark ? '#edf8f3' : '#fff',
      border: `1px solid ${isDark ? DARK_BORDER : primaryColor}`,
      borderRadius: '10px',
      fontFamily: 'Cairo, sans-serif',
      fontWeight: 800,
      px: 2.5,
      boxShadow: isDark
        ? '0 4px 12px rgba(3,20,13,.18)'
        : '0 4px 12px rgba(128,180,158,.30)',
      transition: 'all .18s ease',

      '&:hover': {
        backgroundColor: isDark ? 'transparent' : primaryDark,
        borderColor: isDark ? DARK_BORDER : primaryDark,
        boxShadow: isDark
          ? '0 0 0 2px rgba(103,201,157,.10)'
          : '0 6px 16px rgba(128,180,158,.40)',
        transform: 'translateY(-1px)'
      },

      '&.Mui-disabled': {
        backgroundColor: isDark ? 'transparent' : primaryLight,
        color: isDark ? 'rgba(237,248,243,.45)' : 'rgba(255,255,255,.75)',
        borderColor: isDark ? 'rgba(103,201,157,.45)' : primaryLight,
        boxShadow: 'none',
        transform: 'none'
      }
    },

    divider: {
      my: { xs: 1.5, sm: 2 },
      borderColor: isDark ? DARK_BORDER : primaryLight,
      opacity: isDark ? 0.55 : 1
    },

    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      py: { xs: 5, sm: 7 },
      px: 1,
      backgroundColor: colors.section,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      color: colors.text,
      minWidth: 0
    },

    loadingText: {
      color: isDark ? '#edf8f3' : primaryDark,
      mt: 2,
      fontWeight: 800,
      fontFamily: 'Cairo, sans-serif',
      fontSize: { xs: '0.8rem', sm: '0.95rem' }
    },

    alert: {
      mb: 2,
      borderRadius: '10px',
      border: '1px solid #e74c3c',
      backgroundColor: isDark ? 'rgba(174,30,33,.12)' : '#ffeaea',
      color: isDark ? '#ffd8d8' : undefined,
      fontFamily: 'Cairo, sans-serif',

      '& .MuiAlert-icon': {
        color: '#e74c3c'
      }
    },

    backButton: {
      mb: 2,
      borderRadius: '10px',
      borderColor: isDark ? DARK_BORDER : primaryColor,
      color: isDark ? DARK_BORDER : primaryColor,
      backgroundColor: 'transparent',
      fontFamily: 'Cairo, sans-serif',
      fontWeight: 800,
      px: 2.5,
      borderWidth: '1px',

      '&:hover': {
        borderColor: isDark ? DARK_BORDER : primaryDark,
        color: isDark ? '#edf8f3' : primaryDark,
        backgroundColor: isDark ? 'transparent' : `${primaryLight}20`,
        borderWidth: '1px'
      }
    },

    contentArea: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }
  };

  return (
    <NavigationShell variant="standard">
      <Box sx={styles.root}>
        <Box component="main" sx={styles.mainContent}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
            <Container maxWidth="xl" sx={styles.container}>
              <Paper elevation={0} sx={styles.paperContainer}>
                <Box
                  sx={uiLayout.withUiSx(
                    styles.headerContainer,
                    uiLayout.pageHeaderSx
                  )}
                >
                  <Typography variant="h4" component="h1" sx={styles.title}>
                    تقارير المتابعة اليومية
                  </Typography>

                  <Box
                    sx={uiLayout.withUiSx(
                      styles.searchContainer,
                      uiLayout.filterBarSx
                    )}
                  >
                    <DatePicker
                      label="اختر تاريخ التقرير"
                      value={draftDate}
                      onChange={handleDateChange}
                      PopperProps={{
                        sx: isDark ? {
                          '& .MuiPaper-root': {
                            backgroundColor: colors.card,
                            backgroundImage: 'none',
                            border: `1px solid ${DARK_BORDER}`,
                            color: colors.text
                          },
                          '& .MuiPickersDay-root': {
                            backgroundColor: 'transparent !important',
                            border: '1px solid transparent',
                            color: colors.text
                          },
                          '& .MuiPickersDay-root.Mui-selected': {
                            backgroundColor: 'transparent !important',
                            borderColor: DARK_BORDER,
                            color: `${DARK_BORDER} !important`
                          },
                          '& .MuiPickersDay-root:hover': {
                            backgroundColor: 'transparent !important',
                            borderColor: DARK_BORDER
                          },
                          '& .MuiIconButton-root': {
                            backgroundColor: 'transparent !important',
                            color: DARK_BORDER
                          }
                        } : undefined
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          InputLabelProps={{
                            ...(params.InputLabelProps || {}),
                            shrink: true
                          }}
                          size="small"
                          sx={uiLayout.withUiSx(
                            styles.datePicker,
                            uiLayout.formFieldSx
                          )}
                        />
                      )}
                      inputFormat="yyyy-MM-dd"
                    />

                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      disabled={loading || !draftDate}
                      sx={uiLayout.withUiSx(
                        styles.searchButton,
                        uiLayout.buttonSx
                      )}
                    >
                      {loading ? 'جاري البحث...' : 'بحث'}
                    </Button>
                  </Box>
                </Box>

                <Divider sx={styles.divider} />

                <Box sx={styles.contentArea}>
                  {loading ? (
                    <Box sx={styles.loadingContainer}>
                      <CircularProgress
                        sx={{ color: isDark ? DARK_BORDER : primaryColor }}
                        size={44}
                      />

                      <Typography variant="h6" sx={styles.loadingText}>
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
                    <Box sx={styles.contentArea}>
                      <Button
                        variant="outlined"
                        onClick={handleBackToList}
                        sx={uiLayout.withUiSx(
                          styles.backButton,
                          uiLayout.buttonSx
                        )}
                      >
                        العودة إلى القائمة
                      </Button>

                      <ReportViewer report={selectedReport} />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Container>
          </LocalizationProvider>
        </Box>
      </Box>
    </NavigationShell>
  );
};

export default ReportViewerPage;
