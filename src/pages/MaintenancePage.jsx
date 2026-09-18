import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  AccessTime, 
  Update, 
  Download, 
  InfoOutlined as NotificationsActive,
  EmojiObjects
} from '@mui/icons-material';

const MaintenancePage = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 3,
    minutes: 0,
    seconds: 0
  });

  const theme = useTheme();
  const primaryColor = '#80b49e';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const { hours, minutes, seconds } = prev;
        
        if (hours === 0 && minutes === 0 && seconds === 0) {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }

        if (seconds > 0) {
          return { ...prev, seconds: seconds - 1 };
        } else if (minutes > 0) {
          return { hours, minutes: minutes - 1, seconds: 59 };
        } else {
          return { hours: hours - 1, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? theme.palette.background.default
          : `linear(135deg, ${alpha(primaryColor, 0.1)} 0%, ${alpha(primaryColor, 0.05)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            textAlign: 'center',
            p: 4,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(primaryColor, 0.2)}`,
            border: `1px solid ${alpha(primaryColor, 0.2)}`
          }}
        >
          <CardContent>
            {/* الشعار والأيقونة */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: alpha(primaryColor, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: `2px solid ${alpha(primaryColor, 0.3)}`
                }}
              >
                <Update 
                  sx={{ 
                    fontSize: 40, 
                    color: primaryColor 
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  color: primaryColor,
                  mb: 1
                }}
              >
                جاري التحديث
              </Typography>
              
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                نعمل على تحسين تجربتك لنقدم لك الأفضل
              </Typography>
            </Box>

            {/* الكاونتر */}
            <Box sx={{ mb: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 3,
                  mb: 3
                }}
              >
                {/* الساعات */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      backgroundColor: alpha(primaryColor, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      border: `2px solid ${alpha(primaryColor, 0.2)}`
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" color={primaryColor}>
                      {String(timeLeft.hours).padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ساعات
                  </Typography>
                </Box>

                {/* الدقائق */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      backgroundColor: alpha(primaryColor, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      border: `2px solid ${alpha(primaryColor, 0.2)}`
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" color={primaryColor}>
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    دقائق
                  </Typography>
                </Box>

                {/* الثواني */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      backgroundColor: alpha(primaryColor, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                      border: `2px solid ${alpha(primaryColor, 0.2)}`
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" color={primaryColor}>
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ثواني
                  </Typography>
                </Box>
              </Box>

              {/* شريط التقدم */}
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress 
                  size={60}
                  thickness={4}
                  sx={{ color: primaryColor }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessTime sx={{ fontSize: 20, color: primaryColor }} />
                </Box>
              </Box>
            </Box>

            {/* المميزات الجديدة */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: primaryColor, mb: 3 }}>
                <EmojiObjects sx={{ marginInlineEnd: 1, verticalAlign: 'middle' }} />
                المميزات القادمة
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                {[
                  'واجهة مستخدم محسنة',
                  'أداء أسرع',
                  'ميزات جديدة',
                  'تصميم متجاوب'
                ].map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: alpha(primaryColor, 0.1),
                      border: `1px solid ${alpha(primaryColor, 0.2)}`
                    }}
                  >
                    <Typography variant="body2" color={primaryColor}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* رسالة تذكير */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha('#ff9800', 0.1),
                border: `1px solid ${alpha('#ff9800', 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <NotificationsActive sx={{ color: '#ff9800' }} />
              <Typography variant="body2" color="#ff9800">
                ستعود الخدمة خلال {timeLeft.hours}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default MaintenancePage;