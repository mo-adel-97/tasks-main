import React from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Divider
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { styled } from '@mui/system';
import { useState,useEffect } from 'react';
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
  marginTop: theme.spacing(3),
  overflow: 'hidden',
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    '&:first-of-type': {
      paddingLeft: theme.spacing(3)
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(3)
    }
  }
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  '& .MuiTableCell-root': {
    fontWeight: 700,
    color: theme.palette.primary.dark,
    fontSize: '0.875rem',
    letterSpacing: '0.5px'
  }
}));

const DiplomaStatistics = ({ diplomaData, setDiplomaData }) => {
  const [localData, setLocalData] = useState(diplomaData || {
    registrations: [{ diplomaName: '', count: '', batch: '' }],
    attendance: [{ diplomaName: '', count: '' }],
    approvals: [{ diplomaName: '', count: '', batch: '' }]
  });

  // Update parent whenever local data changes
  useEffect(() => {
    if (setDiplomaData) {
      setDiplomaData(localData);
    }
  }, [localData, setDiplomaData]);

  const handleRegistrationChange = (index, field, value) => {
    const newRegistrations = [...localData.registrations];
    newRegistrations[index][field] = value;
    setLocalData(prev => ({
      ...prev,
      registrations: newRegistrations
    }));
  };

  const handleAttendanceChange = (index, field, value) => {
    const newAttendance = [...localData.attendance];
    newAttendance[index][field] = value;
    setLocalData(prev => ({
      ...prev,
      attendance: newAttendance
    }));
  };

  const handleApprovalChange = (index, field, value) => {
    const newApprovals = [...localData.approvals];
    newApprovals[index][field] = value;
    setLocalData(prev => ({
      ...prev,
      approvals: newApprovals
    }));
  };

  const addRegistration = () => {
    setLocalData(prev => ({
      ...prev,
      registrations: [...prev.registrations, { diplomaName: '', count: '', batch: '' }]
    }));
  };

  const removeRegistration = (index) => {
    if (localData.registrations.length > 1) {
      const newRegistrations = localData.registrations.filter((_, i) => i !== index);
      setLocalData(prev => ({
        ...prev,
        registrations: newRegistrations
      }));
    }
  };

  const addAttendance = () => {
    setLocalData(prev => ({
      ...prev,
      attendance: [...prev.attendance, { diplomaName: '', count: '' }]
    }));
  };

  const removeAttendance = (index) => {
    if (localData.attendance.length > 1) {
      const newAttendance = localData.attendance.filter((_, i) => i !== index);
      setLocalData(prev => ({
        ...prev,
        attendance: newAttendance
      }));
    }
  };

  const addApproval = () => {
    setLocalData(prev => ({
      ...prev,
      approvals: [...prev.approvals, { diplomaName: '', count: '', batch: '' }]
    }));
  };

  const removeApproval = (index) => {
    if (localData.approvals.length > 1) {
      const newApprovals = localData.approvals.filter((_, i) => i !== index);
      setLocalData(prev => ({
        ...prev,
        approvals: newApprovals
      }));
    }
  };

  return (
    <Box>
      {/* Registrations Section */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
          تسجيل الدبلومات
        </Typography>
        
        {localData.registrations.map((reg, index) => (
          <Box key={`reg-${index}`} display="flex" alignItems="center" gap={2} mb={2}>
            <Box flex={1}>
              <TextField
                fullWidth
                label="اسم الدبلوم"
                value={reg.diplomaName}
                onChange={(e) => handleRegistrationChange(index, 'diplomaName', e.target.value)}
                size="small"
              />
            </Box>
            <Box width={120}>
              <TextField
                fullWidth
                label="عدد التسجيلات"
                type="number"
                value={reg.count}
                onChange={(e) => handleRegistrationChange(index, 'count', e.target.value)}
                size="small"
              />
            </Box>
            <Box width={120}>
              <TextField
                fullWidth
                label="الدفعة"
                value={reg.batch}
                onChange={(e) => handleRegistrationChange(index, 'batch', e.target.value)}
                size="small"
              />
            </Box>
            <Box>
              {index === localData.registrations.length - 1 ? (
                <IconButton onClick={addRegistration} color="primary">
                  <AddCircleOutline />
                </IconButton>
              ) : null}
              <IconButton 
                onClick={() => removeRegistration(index)} 
                color="error"
                disabled={localData.registrations.length <= 1}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Attendance Section */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
          حضور الدبلومات
        </Typography>
        
        {localData.attendance.map((att, index) => (
          <Box key={`att-${index}`} display="flex" alignItems="center" gap={2} mb={2}>
            <Box flex={1}>
              <TextField
                fullWidth
                label="اسم الدبلوم"
                value={att.diplomaName}
                onChange={(e) => handleAttendanceChange(index, 'diplomaName', e.target.value)}
                size="small"
              />
            </Box>
            <Box width={120}>
              <TextField
                fullWidth
                label="عدد الحضور"
                type="number"
                value={att.count}
                onChange={(e) => handleAttendanceChange(index, 'count', e.target.value)}
                size="small"
              />
            </Box>
            <Box>
              {index === localData.attendance.length - 1 ? (
                <IconButton onClick={addAttendance} color="primary">
                  <AddCircleOutline />
                </IconButton>
              ) : null}
              <IconButton 
                onClick={() => removeAttendance(index)} 
                color="error"
                disabled={localData.attendance.length <= 1}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Approvals Section */}
      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
          الموافقات
        </Typography>
        
        {localData.approvals.map((app, index) => (
          <Box key={`app-${index}`} display="flex" alignItems="center" gap={2} mb={2}>
            <Box flex={1}>
              <TextField
                fullWidth
                label="اسم الدبلوم"
                value={app.diplomaName}
                onChange={(e) => handleApprovalChange(index, 'diplomaName', e.target.value)}
                size="small"
              />
            </Box>
            <Box width={120}>
              <TextField
                fullWidth
                label="العدد"
                type="number"
                value={app.count}
                onChange={(e) => handleApprovalChange(index, 'count', e.target.value)}
                size="small"
              />
            </Box>
            <Box width={120}>
              <TextField
                fullWidth
                label="الدفعة"
                value={app.batch}
                onChange={(e) => handleApprovalChange(index, 'batch', e.target.value)}
                size="small"
              />
            </Box>
            <Box>
              {index === localData.approvals.length - 1 ? (
                <IconButton onClick={addApproval} color="primary">
                  <AddCircleOutline />
                </IconButton>
              ) : null}
              <IconButton 
                onClick={() => removeApproval(index)} 
                color="error"
                disabled={localData.approvals.length <= 1}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DiplomaStatistics;