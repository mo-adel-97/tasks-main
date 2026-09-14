import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper,
  Chip,
  Fade
} from '@mui/material';
import { 
  Person, 
  School, 
  Badge, 
  Phone, 
  Flag, 
  Assignment,
  CheckCircle,
  Schedule,
  LocationOn
} from '@mui/icons-material';
import SuccessButton from '../common/SuccessButton';
import ErrorButton from '../common/ErrorButton';

const StudentInfoCard = ({ 
  studentData, 
  handleOpenAttendanceDialog, 
  handleReset 
}) => {
  const getStatusColor = (status) => {
    return status === "0" ? "#80b49e" : "#9c27b0";
  };

  const getStatusText = (status, type) => {
    if (type === 'gender') {
      return status === "0" ? "ذكر" : "أنثى";
    }
    if (type === 'nationality') {
      return status === "0" ? "مواطن" : "مقيم";
    }
    return status;
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ direction: 'rtl' }}>
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #80b49e 0%, #9bc8b8 100%)',
              boxShadow: '0 6px 20px rgba(128, 180, 158, 0.3)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <CheckCircle sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography 
            variant="h4"
            sx={{ 
              fontWeight: 800,
              color: "#2c3e50",
              position: "relative",
              mb: 3,
              "&:after": {
                content: '""',
                display: "block",
                width: "120px",
                height: "5px",
                background: "linear-gradient(90deg, #80b49e, #9bc8b8)",
                margin: "20px auto 0",
                borderRadius: "10px",
                opacity: 0.8
              }
            }}
          >
            بيانات الطالب
          </Typography>
          <Chip 
            label="تم العثور على البيانات بنجاح"
            color="success"
            variant="filled"
            sx={{
              background: 'linear-gradient(135deg, #80b49e, #9bc8b8)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '8px 16px'
            }}
          />
        </Box>

        {/* Student Info Card */}
        <Paper
          sx={{
            padding: { xs: "24px", md: "32px" },
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)',
            borderRadius: "16px",
            marginBottom: "30px",
            borderRight: "4px solid #80b49e",
            boxShadow: '0 8px 32px rgba(128, 180, 158, 0.15)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, #80b49e, #9bc8b8)',
            }
          }}
        >
          {/* Info Grid */}
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: '20px'
            }}
          >
            {/* Left Column */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              borderLeft: { md: '2px dashed #e0f2e9' },
              paddingLeft: { md: '24px' }
            }}>
              {/* Name */}
              <InfoItem 
                icon={<Person sx={{ color: '#80b49e' }} />}
                label="الاسم الكامل"
                value={studentData.studentName}
                gradient
              />

              {/* National ID */}
              <InfoItem 
                icon={<Badge sx={{ color: '#80b49e' }} />}
                label="رقم الهوية الوطنية"
                value={studentData.nationalId}
                technical
              />

              {/* Phone */}
              <InfoItem 
                icon={<Phone sx={{ color: '#80b49e' }} />}
                label="رقم الجوال"
                value={studentData.studentTel}
                technical
              />
            </Box>

            {/* Right Column */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              paddingLeft: { md: '24px' }
            }}>
              {/* Student Type */}
              <InfoItem 
                icon={<School sx={{ color: getStatusColor(studentData.studentType) }} />}
                label="نوع الطالب"
                value={getStatusText(studentData.studentType, 'gender')}
                statusColor={getStatusColor(studentData.studentType)}
              />

              {/* Nationality */}
              <InfoItem 
                icon={<Flag sx={{ color: getStatusColor(studentData.studentNational) }} />}
                label="الجنسية"
                value={getStatusText(studentData.studentNational, 'nationality')}
                statusColor={getStatusColor(studentData.studentNational)}
              />

              {/* Additional Info */}
              <InfoItem 
                icon={<Assignment sx={{ color: '#80b49e' }} />}
                label="الحالة الدراسية"
                value="مستمر"
                statusColor="#80b49e"
              />
            </Box>
          </Box>

          {/* Quick Stats */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 4, 
              pt: 3, 
              borderTop: '2px dashed #e0f2e9',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <Chip 
              icon={<Person />}
              label="طالب نشط"
              variant="outlined"
              sx={{ 
                borderColor: '#80b49e', 
                color: '#80b49e',
                fontWeight: 600
              }}
            />
            <Chip 
              icon={<CheckCircle />}
              label="مستوفي الشروط"
              variant="outlined"
              sx={{ 
                borderColor: '#80b49e', 
                color: '#80b49e',
                fontWeight: 600
              }}
            />
            <Chip 
              icon={<LocationOn />}
              label="مسجل في النظام"
              variant="outlined"
              sx={{ 
                borderColor: '#80b49e', 
                color: '#80b49e',
                fontWeight: 600
              }}
            />
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          direction: 'rtl',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <SuccessButton
            fullWidth
            onClick={handleOpenAttendanceDialog}
            sx={{
              height: '56px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(128, 180, 158, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(128, 180, 158, 0.4)',
              }
            }}
          >
            📝 سجل الحضور
          </SuccessButton>
          <ErrorButton
            fullWidth
            onClick={handleReset}
            sx={{
              height: '56px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 700,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              }
            }}
          >
            ↩️ العودة للبحث
          </ErrorButton>
        </Box>
      </Box>
    </Fade>
  );
};

// Reusable Info Item Component
const InfoItem = ({ icon, label, value, gradient = false, statusColor, technical = false }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: gradient ? 'linear-gradient(135deg, #f8fbfa, #e8f5f0)' : '#f8fbfa',
    borderRadius: '12px',
    border: gradient ? '2px solid #e8f5f0' : '2px solid transparent',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateX(-4px)',
      boxShadow: '0 4px 12px rgba(128, 180, 158, 0.15)',
    }
  }}>
    <Box sx={{ 
      marginInlineEnd: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: '10px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(128, 180, 158, 0.2)'
    }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="subtitle2" sx={{ 
        fontWeight: 700, 
        color: statusColor || "#5d6d7e",
        fontSize: '0.8rem',
        mb: 1,
        textAlign: "start"
      }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ 
        fontWeight: 600,
        fontSize: '1rem',
        color: '#2c3e50',
        textAlign: "start"
      }}>
        <bdi dir={technical ? "ltr" : "auto"}>{value}</bdi>
      </Typography>
    </Box>
  </Box>
);

export default StudentInfoCard;