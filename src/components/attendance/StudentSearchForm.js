import React from 'react';
import { 
  TextField, 
  Box, 
  CircularProgress, 
  Typography, 
  Avatar,
  Card,
  Fade
} from '@mui/material';
import { Assignment, PersonSearch } from '@mui/icons-material';
import GradientButton from '../common/GradientButton';

const StudentSearchForm = ({ 
  studentId, 
  setStudentId, 
  loading, 
  handleAttendance 
}) => {
  return (
    <Fade in={true} timeout={800}>
      <Card
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbfa 100%)',
          border: '1px solid rgba(128, 180, 158, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #80b49e 0%, #9bc8b8 100%)',
          }
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 90,
              height: 90,
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #80b49e 0%, #9bc8b8 100%)',
              boxShadow: '0 6px 20px rgba(128, 180, 158, 0.3)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <PersonSearch sx={{ fontSize: 44 }} />
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
                width: "100px",
                height: "5px",
                background: "linear-gradient(90deg, #80b49e, #9bc8b8)",
                margin: "20px auto 0",
                borderRadius: "10px",
                opacity: 0.8
              }
            }}
          >
            تسجيل الحضور
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#5d6d7e",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              mb: 1
            }}
          >
            أدخل رقم الهوية الوطنية للطالب للبحث عن بياناته
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "#80b49e",
              fontSize: "0.9rem",
              fontWeight: 600
            }}
          >
            يجب أن يكون الرقم مكون من 10 أرقام
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', mb: 4 }}>
          <TextField
            label="رقم الهوية الوطنية"
            variant="outlined"
            fullWidth
            value={studentId}
            placeholder="أدخل 10 أرقام فقط"
            onChange={(e) => {
              const value = e.target.value;
              const isValid = /^[1-9][0-9]{0,9}$/.test(value) && value.length <= 10;
              if (isValid || value === "") {
                setStudentId(value);
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#e0e0e0",
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderColor: "#80b49e",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#80b49e",
                  borderWidth: 2,
                },
                "& input": {
                  textAlign: "center",
                  fontWeight: 600,
                  letterSpacing: "1px"
                }
              },
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: "#80b49e",
                }
              }
            }}
            InputProps={{
              style: {
                fontSize: "1.2rem",
                fontFamily: '"Cairo", sans-serif',
                height: '60px'
              },
              startAdornment: (
                <Box 
                  sx={{ 
                    color: '#80b49e',
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Assignment />
                </Box>
              )
            }}
            InputLabelProps={{
              style: {
                fontSize: "1rem",
                fontFamily: '"Cairo", sans-serif',
                right: 40,
                transformOrigin: 'right'
              },
              shrink: true
            }}
          />
          
          {studentId && (
            <Typography 
              variant="caption" 
              sx={{
                position: 'absolute',
                left: 0,
                bottom: -25,
                color: studentId.length === 10 ? '#80b49e' : '#e74c3c',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              {studentId.length}/10 أرقام
            </Typography>
          )}
        </Box>

        <GradientButton
          fullWidth
          onClick={handleAttendance}
          disabled={loading || studentId.length !== 10}
          sx={{
            height: '56px',
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 700,
            boxShadow: '0 4px 15px rgba(128, 180, 158, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(128, 180, 158, 0.4)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="inherit" />
              <span>جاري البحث...</span>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <PersonSearch />
              <span>عرض بيانات الطالب</span>
            </Box>
          )}
        </GradientButton>

        {studentId.length > 0 && studentId.length < 10 && (
          <Typography 
            variant="caption" 
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              color: '#e74c3c',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            ⚠️ رقم الهوية يجب أن يكون 10 أرقام
          </Typography>
        )}
      </Card>
    </Fade>
  );
};

export default StudentSearchForm;