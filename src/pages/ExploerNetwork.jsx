import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useState } from "react";
import PropTypes from "prop-types";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Paper,
  Tooltip,
  Divider,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
} from "@mui/material";
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Computer as ComputerIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Storage as NetworkIcon,
} from "@mui/icons-material";
import axios from "axios";
import { styled } from "@mui/material/styles";

// الألوان الجديدة بناءً على اللون المطلوب
const primaryColor = '#80b49e';
const primaryDark = '#6a9a87';
const primaryLight = '#9ac9b5';
const backgroundColor = '#f8fbfa';
const surfaceColor = '#ffffff';
const textPrimary = '#2c3e50';
const textSecondary = '#5d6d7e';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    height: "80vh",
    borderRadius: 16,
    fontFamily: "'Cairo', sans-serif !important",
    background: `linear-gradient(135deg, ${surfaceColor} 0%, #f0f7f4 100%)`,
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  "&:hover": {
    backgroundColor: primaryLight + '20',
    borderRadius: 12,
    transform: "translateX(5px)",
    transition: "all 0.3s ease",
    border: `1px solid ${primaryLight}`,
  },
  "& .MuiListItemIcon-root": {
    minWidth: 36,
  },
  cursor: "pointer",
  marginBottom: 4,
  borderRadius: 12,
  border: `1px solid transparent`,
}));

const FileSizeChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: "0.75rem",
  height: 20,
  fontFamily: "'Cairo', sans-serif",
  backgroundColor: primaryColor,
  color: 'white',
  '& .MuiChip-label': {
    padding: '0 8px',
  }
}));

const CenteredContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "calc(100vh - 64px)",
  flexDirection: "column",
  backgroundColor: backgroundColor,
});

const NetworkCard = styled(Card)(({ theme }) => ({
  width: 320,
  height: 220,
  borderRadius: 20,
  boxShadow: `0 8px 32px ${primaryColor}40`,
  transition: "transform 0.3s, box-shadow 0.3s",
  background: `linear-gradient(135deg, ${surfaceColor} 0%, ${primaryLight}15 100%)`,
  border: `1px solid ${primaryLight}`,
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: `0 12px 48px ${primaryColor}60`,
  },
}));

const ExplorerNetwork = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [error, setError] = useState(null);

  const fetchItems = async (path = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("https://api3.sstli.com/api/files/browse", {
        params: { path },
        timeout: 2000000,
      });
      setItems(response.data);
      setCurrentPath(path);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err.response?.data?.message || "فشل تحميل محتويات المجلد");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setOpen(true);
    fetchItems("");
  };

  const handleDialogClose = () => {
    setOpen(false);
    setItems([]);
    setCurrentPath("");
    setError(null);
  };

  const handleItemClick = (item) => {
    if (item.type === "Folder") {
      fetchItems(item.fullPath);
    } else {
      window.open(
        `https://api3.sstli.com/api/files/download?path=${encodeURIComponent(
          item.fullPath
        )}`,
        "_blank"
      );
    }
  };

  const goBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    fetchItems(parts.join("/"));
  };

  const goHome = () => {
    fetchItems("");
  };

  const refresh = () => {
    fetchItems(currentPath);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 بايت";
    const k = 1024;
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i]);
  };

  const renderBreadcrumbs = () => {
    const parts = currentPath ? currentPath.split("/") : [];
    
    return (
      <Paper elevation={0} sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: primaryLight + '15',
        borderRadius: 12,
        border: `1px solid ${primaryLight}`,
      }}>
        <Breadcrumbs separator="›" aria-label="مسار المجلد">
          <Tooltip title="الصفحة الرئيسية">
            <IconButton 
              onClick={goHome} 
              size="small" 
              sx={{ 
                cursor: "pointer",
                backgroundColor: primaryColor,
                color: 'white',
                '&:hover': {
                  backgroundColor: primaryDark,
                }
              }}
            >
              <HomeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {parts.map((part, i) => {
            const path = parts.slice(0, i + 1).join("/");
            return (
              <Link
                key={i}
                underline="hover"
                onClick={() => fetchItems(path)}
                sx={{ 
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: textPrimary,
                  "&:hover": { 
                    color: primaryDark,
                    fontWeight: 600 
                  },
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 500,
                }}
              >
                {part || "الرئيسية"}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Paper>
    );
  };

  return (
    <NavigationShell variant="standard" ><>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Cairo', sans-serif !important;
            background-color: ${backgroundColor};
          }
        `}
      </style>
      
      
      <CenteredContainer sx={{
        ...navigationContentSx
      }}>
        <NetworkCard onClick={handleDialogOpen}>
          <CardActionArea sx={{ height: '100%' }}>
            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: 3,
            }}>
              <NetworkIcon sx={{ 
                fontSize: 64, 
                mb: 2,
                color: primaryColor 
              }} />
              <Typography variant="h5" component="div" sx={{ 
                fontWeight: 700,
                color: primaryDark,
                mb: 1
              }}>
                استكشف الشبكة
              </Typography>
              <Typography variant="body2" sx={{ 
                color: textSecondary,
                lineHeight: 1.6
              }}>
                نماذج الاختبار (محاكاة للشبكة الداخلية)
              </Typography>
            </CardContent>
          </CardActionArea>
        </NetworkCard>
      </CenteredContainer>

      <StyledDialog 
        open={open} 
        onClose={handleDialogClose} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle sx={{ 
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
          color: "white",
          py: 2,
          px: 3,
          fontFamily: "'Cairo', sans-serif",
        }}>
          <Box display="flex" alignItems="center">
            <FolderIcon sx={{ marginInlineEnd: 1.5 }} />
            <Typography variant="h6" sx={{ 
              fontFamily: "'Cairo', sans-serif", 
              fontWeight: 700,
              fontSize: '1.25rem'
            }}>
              مستكشف ملفات الشبكة
            </Typography>
          </Box>
          <IconButton 
            onClick={handleDialogClose} 
            sx={{ 
              cursor: "pointer",
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ 
          p: 3,
          fontFamily: "'Cairo', sans-serif",
          backgroundColor: backgroundColor,
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            {renderBreadcrumbs()}
            <Box display="flex" gap={1}>
              <Tooltip title="تحديث">
                <IconButton 
                  onClick={refresh} 
                  size="small" 
                  sx={{ 
                    cursor: "pointer",
                    backgroundColor: primaryLight + '20',
                    color: primaryColor,
                    '&:hover': {
                      backgroundColor: primaryColor,
                      color: 'white'
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                onClick={goBack}
                startIcon={<ArrowBackIcon />}
                disabled={!currentPath}
                size="small"
                variant="contained"
                sx={{ 
                  fontFamily: "'Cairo', sans-serif",
                  cursor: "pointer",
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryDark,
                  },
                  '&:disabled': {
                    backgroundColor: primaryLight,
                  },
                  borderRadius: 2,
                  px: 2,
                }}
              >
                رجوع
              </Button>
            </Box>
          </Box>

          <Divider sx={{ 
            mb: 2, 
            borderColor: primaryLight,
            borderWidth: 1 
          }} />

          {error ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
              flexDirection="column"
              sx={{
                backgroundColor: surfaceColor,
                borderRadius: 3,
                border: `1px solid ${primaryLight}`,
                p: 4
              }}
            >
              <Typography 
                color="error" 
                gutterBottom 
                sx={{ 
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {error}
              </Typography>
              <Button 
                onClick={() => fetchItems(currentPath)} 
                variant="contained"
                startIcon={<RefreshIcon />}
                sx={{ 
                  fontFamily: "'Cairo', sans-serif", 
                  cursor: "pointer",
                  backgroundColor: primaryColor,
                  '&:hover': {
                    backgroundColor: primaryDark,
                  },
                  borderRadius: 2,
                }}
              >
                إعادة المحاولة
              </Button>
            </Box>
          ) : loading ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
              sx={{
                backgroundColor: surfaceColor,
                borderRadius: 3,
                border: `1px solid ${primaryLight}`,
              }}
            >
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : items.length === 0 ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
              sx={{
                backgroundColor: surfaceColor,
                borderRadius: 3,
                border: `1px solid ${primaryLight}`,
              }}
            >
              <Typography variant="body2" sx={{ 
                color: textSecondary, 
                fontFamily: "'Cairo', sans-serif",
                fontSize: '1rem'
              }}>
                هذا المجلد فارغ
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ 
              overflow: "auto", 
              maxHeight: "60vh",
              backgroundColor: surfaceColor,
              borderRadius: 3,
              border: `1px solid ${primaryLight}`,
              p: 1,
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: primaryLight + '20',
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: primaryColor,
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: primaryDark,
              },
            }}>
              {items.map((item, index) => (
                <StyledListItem
                  key={`${item.name}-${index}`}
                  button
                  onClick={() => handleItemClick(item)}
                >
                  <ListItemIcon>
                    {item.type === "Folder" ? (
                      <Tooltip title="مجلد">
                        <FolderIcon sx={{ color: primaryColor }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="ملف">
                        <FileIcon sx={{ color: primaryDark }} />
                      </Tooltip>
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography sx={{ 
                          fontFamily: "'Cairo', sans-serif", 
                          fontWeight: item.type === "Folder" ? 700 : 500,
                          color: textPrimary,
                          fontSize: '0.95rem'
                        }}>
                          {item.name}
                        </Typography>
                        {item.size && (
                          <FileSizeChip 
                            label={formatFileSize(item.size)} 
                            size="small" 
                          />
                        )}
                      </Box>
                    }
                    secondary={`آخر تعديل: ${new Date(item.lastModified).toLocaleString('ar-EG')}`}
                    secondaryTypographyProps={{ 
                      variant: "caption",
                      fontFamily: "'Cairo', sans-serif",
                      color: textSecondary,
                      fontSize: '0.75rem'
                    }}
                  />
                </StyledListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </StyledDialog>
    </></NavigationShell>
  );
};

ExplorerNetwork.propTypes = {
  // Add any props here if needed
};

export default ExplorerNetwork;