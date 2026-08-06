import React, { useState } from 'react';
import{ useEffect } from 'react';

import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { styled } from '@mui/system';
import { useTheme } from '@mui/material/styles';




const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  backgroundColor: theme.palette.background.paper,
}));

const TaskTable = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  marginTop: theme.spacing(3),
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  }
}));

const ComplaintsSuggestionsTasks = ({ complaintsData, setComplaintsData }) => {

  const theme = useTheme();
console.log(theme.palette.primary.main);


  const [localData, setLocalData] = useState(complaintsData || {
    complaints: [''],
    suggestions: ['']
  });

  // Update parent whenever local data changes
  useEffect(() => {
    if (setComplaintsData) {
      setComplaintsData(localData);
    }
  }, [localData, setComplaintsData]);

  const handleComplaintChange = (index, value) => {
    const newComplaints = [...localData.complaints];
    newComplaints[index] = value;
    setLocalData(prev => ({
      ...prev,
      complaints: newComplaints
    }));
  };

  const handleSuggestionChange = (index, value) => {
    const newSuggestions = [...localData.suggestions];
    newSuggestions[index] = value;
    setLocalData(prev => ({
      ...prev,
      suggestions: newSuggestions
    }));
  };

  const addComplaint = () => {
    setLocalData(prev => ({
      ...prev,
      complaints: [...prev.complaints, '']
    }));
  };

  const removeComplaint = (index) => {
    if (localData.complaints.length > 1) {
      const newComplaints = localData.complaints.filter((_, i) => i !== index);
      setLocalData(prev => ({
        ...prev,
        complaints: newComplaints
      }));
    }
  };

  const addSuggestion = () => {
    setLocalData(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, '']
    }));
  };

  const removeSuggestion = (index) => {
    if (localData.suggestions.length > 1) {
      const newSuggestions = localData.suggestions.filter((_, i) => i !== index);
      setLocalData(prev => ({
        ...prev,
        suggestions: newSuggestions
      }));
    }
  };

  return (
    <Box>
      {/* Complaints Section */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
          الشكاوى
        </Typography>
        
        <List sx={{ padding: 0 }}>
          {localData.complaints.map((complaint, index) => (
            <ListItem 
              key={`complaint-${index}`} 
              sx={{ 
                padding: 0,
                marginBottom: 2,
                alignItems: 'flex-start'
              }}
            >
              <Box display="flex" width="100%" alignItems="center">
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  minWidth={36}
                  height={36}
                  borderRadius="50%"
                  bgcolor={alpha(theme.palette.error.main, 0.1)}
                  color={theme.palette.error.dark}
                  marginRight={2}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {index + 1}
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={complaint}
                  onChange={(e) => handleComplaintChange(index, e.target.value)}
                  placeholder="أدخل الشكوى"
                  size="small"
                />
                <Box style={{display:"flex"}} marginLeft={2}>
                  {index === localData.complaints.length - 1 && (
                    <IconButton 
                      onClick={addComplaint} 
                      color="primary"
                      size="small"
                      sx={{ 
                        marginRight: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.2) 
                        }
                      }}
                    >
                      <AddCircleOutline fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton 
                    onClick={() => removeComplaint(index)} 
                    color="error"
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.error.main, 0.2) 
                      }
                    }}
                  >
                    <RemoveCircleOutline fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Suggestions Section */}
      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
          المقترحات
        </Typography>
        
        <List sx={{ padding: 0 }}>
          {localData.suggestions.map((suggestion, index) => (
            <ListItem 
              key={`suggestion-${index}`} 
              sx={{ 
                padding: 0,
                marginBottom: 2,
                alignItems: 'flex-start'
              }}
            >
              <Box display="flex" width="100%" alignItems="center">
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  minWidth={36}
                  height={36}
                  borderRadius="50%"
                  bgcolor={alpha(theme.palette.success.main, 0.1)}
                  color={theme.palette.success.dark}
                  marginRight={2}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {index + 1}
                </Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={suggestion}
                  onChange={(e) => handleSuggestionChange(index, e.target.value)}
                  placeholder="أدخل المقترح"
                  size="small"
                />
                <Box style={{display:"flex"}} marginLeft={2}>
                  {index === localData.suggestions.length - 1 && (
                    <IconButton 
                      onClick={addSuggestion} 
                      color="primary"
                      size="small"
                      sx={{ 
                        marginRight: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.2) 
                        }
                      }}
                    >
                      <AddCircleOutline fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton 
                    onClick={() => removeSuggestion(index)} 
                    color="error"
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.error.main, 0.2) 
                      }
                    }}
                  >
                    <RemoveCircleOutline fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ComplaintsSuggestionsTasks;