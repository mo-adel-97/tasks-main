import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  AdminPanelSettings,
  AssessmentOutlined,
  BusinessOutlined,
  GroupsOutlined,
  LockOutlined,
  PersonOutline,
  SecurityOutlined,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import logo from '../images/logo.jpg';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  primary: '#057546',
  primaryDark: '#034d31',
  primarySoft: '#eaf6f1',
  secondary: '#ae1e21',
  text: '#172b24',
  muted: '#6b7d76',
  white: '#ffffff'
};

const DARK = {
  page: '#0d1b15',
  card: '#13251d',
  section: '#172b22',
  nested: '#1b3328',
  hover: '#214333',
  selected: '#28513f',
  border: '#67C99D',
  accent: '#9BE0C1',
  text: '#eef8f3',
  muted: '#b7cfc3'
};

const ADMIN_USERS = ['sa', 'sa1', 'admin'];

const PARTICLES = [
  { top: '12%', left: '8%', size: 8, delay: '0s' },
  { top: '24%', left: '20%', size: 5, delay: '1.5s' },
  { top: '68%', left: '12%', size: 6, delay: '3s' },
  { top: '82%', left: '31%', size: 9, delay: '2s' },
  { top: '17%', left: '77%', size: 6, delay: '4s' },
  { top: '43%', left: '91%', size: 8, delay: '1s' },
  { top: '74%', left: '85%', size: 5, delay: '2.5s' },
  { top: '88%', left: '65%', size: 7, delay: '3.5s' }
];

const FEATURES = [
  {
    icon: <GroupsOutlined />,
    title: 'إدارة الموظفين',
    description: 'متابعة منظمة وسهلة'
  },
  {
    icon: <AdminPanelSettings />,
    title: 'صلاحيات مرنة',
    description: 'تحكم آمن حسب الدور'
  },
  {
    icon: <AssessmentOutlined />,
    title: 'تقارير متكاملة',
    description: 'بيانات واضحة ودقيقة'
  }
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isShortScreen = useMediaQuery('(max-height: 760px)');
  const isVerySmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleLogin = async (isAdminLogin = false) => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMsg('برجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const loginResponse = await fetch(
        'https://api1.sstli.com/api/userinfo/login-secure',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify({
            userName: cleanUsername,
            password: cleanPassword
          })
        }
      );

      if (!loginResponse.ok) {
        const responseMessage = await loginResponse.text().catch(() => '');
        setErrorMsg(
          responseMessage || 'اسم المستخدم أو كلمة المرور غير صحيحة'
        );
        return;
      }

      const foundUser = await loginResponse.json();
      const { token, ...verifiedUser } = foundUser || {};

      if (!verifiedUser?.guid) {
        setErrorMsg('تعذر قراءة بيانات المستخدم. برجاء المحاولة مرة أخرى');
        return;
      }

      if (typeof token !== 'string' || !token.trim()) {
        setErrorMsg('الخادم لم يُرجع رمز جلسة صالحًا. يرجى مراجعة خدمة تسجيل الدخول.');
        return;
      }

      const branchesResponse = await fetch(
        'https://api1.sstli.com/api/branches/all',
        {
          mode: 'cors',
          credentials: 'omit',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!branchesResponse.ok) {
        throw new Error('فشل في جلب بيانات الفروع');
      }

      const branches = await branchesResponse.json();
      const userBranch = branches.find(
        (branch) => branch.guid === verifiedUser.branchForWork
      );

      login(verifiedUser, token);
      localStorage.setItem('user_branch', JSON.stringify(userBranch || null));

      const normalizedUsername = (verifiedUser.userName || '')
        .trim()
        .toLowerCase();

      if (isAdminLogin && ADMIN_USERS.includes(normalizedUsername)) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleLogin(false);
  };

  const handleAdminSubmit = () => {
    handleLogin(true);
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: { xs: 'auto', md: 'hidden' },
        fontFamily: 'Cairo, Arial, sans-serif',
        background: isDark
          ? `
            radial-gradient(circle at 18% 18%, rgba(103,201,157,.07), transparent 27%),
            radial-gradient(circle at 82% 72%, rgba(103,201,157,.04), transparent 24%),
            ${DARK.page}
          `
          : `
            radial-gradient(circle at 15% 15%, rgba(255,255,255,0.18), transparent 28%),
            radial-gradient(circle at 88% 78%, rgba(174,30,33,0.15), transparent 25%),
            linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 52%, #0a8c5a 100%)
          `,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: isDark
            ? 'linear-gradient(rgba(103,201,157,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(103,201,157,.025) 1px, transparent 1px)'
            : 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(to bottom, black, transparent 92%)',
          pointerEvents: 'none'
        }
      }}
    >
      <style>
        {`
          @keyframes loginFloat {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -14px, 0); }
          }

          @keyframes loginRise {
            from { opacity: 0; transform: translateY(22px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes loginDarkGlow {
            0%, 100% {
              box-shadow:
                0 18px 50px rgba(0,0,0,.32),
                0 0 0 1px rgba(103,201,157,.10),
                0 0 22px rgba(103,201,157,.05);
            }
            50% {
              box-shadow:
                0 22px 58px rgba(0,0,0,.36),
                0 0 0 1px rgba(103,201,157,.22),
                0 0 34px rgba(103,201,157,.10);
            }
          }

          @media (max-width: 599px) {
            @keyframes loginDarkGlow {
              0%, 100% {
                box-shadow:
                  0 12px 30px rgba(0,0,0,.28),
                  0 0 0 1px rgba(103,201,157,.09),
                  0 0 16px rgba(103,201,157,.04);
              }
              50% {
                box-shadow:
                  0 14px 34px rgba(0,0,0,.31),
                  0 0 0 1px rgba(103,201,157,.17),
                  0 0 22px rgba(103,201,157,.075);
              }
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
            }
          }
        `}
      </style>

      {!reduceMotion &&
        PARTICLES.map((particle, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: isDark
                ? 'rgba(103,201,157,.22)'
                : (
                    index % 3 === 0
                      ? 'rgba(174,30,33,0.65)'
                      : 'rgba(255,255,255,0.38)'
                  ),
              boxShadow: isDark
                ? '0 0 14px rgba(103,201,157,.12)'
                : '0 0 18px rgba(255,255,255,0.22)',
              animation: `loginFloat ${7 + index}s ease-in-out infinite`,
              animationDelay: particle.delay,
              pointerEvents: 'none'
            }}
          />
        ))}

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 0.75, sm: 1.5, md: isShortScreen ? 1.5 : 4 },
          px: { xs: 0.75, sm: 1.5, md: 3 }
        }}
      >
        <Fade in={animate} timeout={700}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: { xs: 520, sm: 680, md: 1080 },
              minHeight: { md: isShortScreen ? 520 : 610 },
              maxHeight: 'none',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '0.96fr 1.04fr' },
              overflow: 'hidden',
              borderRadius: { xs: 2.25, sm: 3.5, md: 5 },
              border: isDark
                ? `1px solid ${DARK.border}`
                : '1px solid rgba(255,255,255,0.28)',
              backgroundColor: isDark
                ? DARK.card
                : 'rgba(255,255,255,0.97)',
              boxShadow: isDark
                ? '0 18px 50px rgba(0,0,0,.32)'
                : {
                    xs: '0 10px 28px rgba(3, 48, 31, 0.24)',
                    md: '0 35px 90px rgba(3, 48, 31, 0.34)'
                  },
              backdropFilter: 'blur(18px)',
              animation: reduceMotion
                ? 'none'
                : isDark
                  ? 'loginRise 700ms ease-out, loginDarkGlow 4.6s ease-in-out 700ms infinite'
                  : 'loginRise 700ms ease-out'
            }}
          >
            <Box
              sx={{
                order: { xs: 1, md: 1 },
                p: { xs: 1.15, sm: 2.25, md: isShortScreen ? 3.25 : 5.5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: isDark ? DARK.card : COLORS.white,
                borderInlineEnd: {
                  xs: 'none',
                  md: isDark
                    ? `1px solid ${DARK.border}`
                    : 'none'
                },
                boxShadow: {
                  xs: 'none',
                  md: isDark
                    ? '-10px 0 24px -22px rgba(103,201,157,.60)'
                    : 'none'
                },
                position: 'relative',
                '&::after': {
                  content: '""',
                  display: {
                    xs: 'none',
                    md: isDark ? 'block' : 'none'
                  },
                  position: 'absolute',
                  insetBlock: '12%',
                  insetInlineEnd: '-1px',
                  width: '1px',
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(155,224,193,.30) 18%, #67C99D 50%, rgba(155,224,193,.30) 82%, transparent 100%)',
                  opacity: 0.9,
                  pointerEvents: 'none'
                }
              }}
            >
              <Box sx={{ maxWidth: 450, width: '100%', mx: 'auto' }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ mb: { xs: 1.25, sm: 2.5 } }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="شعار النظام"
                    sx={{
                      width: { xs: 46, sm: 62, md: 78 },
                      height: { xs: 46, sm: 62, md: 78 },
                      objectFit: 'contain',
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 0.45, sm: 0.7 },
                      backgroundColor: COLORS.white,
                      border: isDark
                        ? `1px solid ${DARK.border}`
                        : `1px solid ${COLORS.primarySoft}`,
                      boxShadow: isDark
                        ? '0 6px 18px rgba(0,0,0,.28)'
                        : '0 12px 30px rgba(5,117,70,0.16)'
                    }}
                  />
                </Stack>

                <Typography
                  component="h1"
                  sx={{
                    textAlign: 'center',
                    color: isDark ? DARK.text : COLORS.text,
                    fontSize: { xs: '1.02rem', sm: '1.4rem', md: '1.9rem' },
                    fontWeight: 800,
                    lineHeight: 1.35
                  }}
                >
                  تسجيل الدخول
                </Typography>

                <Typography
                  sx={{
                    mt: { xs: 0.45, sm: 0.8 },
                    mb: { xs: 1.4, sm: 2.8, md: 3.5 },
                    textAlign: 'center',
                    color: isDark ? DARK.muted : COLORS.muted,
                    fontSize: { xs: "0.75rem", sm: '0.8rem', md: '0.98rem' },
                    lineHeight: { xs: 1.65, sm: 1.8 }
                  }}
                >
                  أدخل بيانات حسابك للوصول إلى نظام إدارة الموظفين
                </Typography>

                {errorMsg && (
                  <Alert
                    severity="error"
                    onClose={() => setErrorMsg('')}
                    sx={{
                      mb: { xs: 1.2, sm: 2 },
                      py: { xs: 0.15, sm: 0.4 },
                      borderRadius: { xs: 1.8, sm: 2.5 },
                      alignItems: 'center',
                      '& .MuiAlert-message': {
                        fontFamily: 'Cairo, Arial, sans-serif',
                        fontSize: { xs: "0.75rem", sm: '0.86rem' }
                      }
                    }}
                  >
                    {errorMsg}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={{ xs: 1.25, sm: 1.8, md: 2.1 }}>
                    <Box sx={fieldGroupStyles}>
                      <Typography component="label" htmlFor="login-username" sx={fieldLabelStyles}>
                        اسم المستخدم
                      </Typography>
                      <TextField InputLabelProps={{ shrink: true }}
                        id="login-username"
                        placeholder="أدخل اسم المستخدم"
                        autoComplete="username"
                        autoFocus={!isVerySmallScreen}
                        fullWidth
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        disabled={isLoading}
                        inputProps={{
                          dir: 'rtl',
                          'aria-label': 'اسم المستخدم'
                        }}
                        sx={uiLayout.withUiSx(getFieldStyles(theme), uiLayout.formFieldSx)}
                      />
                    </Box>

                    <Box sx={fieldGroupStyles}>
                      <Typography component="label" htmlFor="login-password" sx={fieldLabelStyles}>
                        كلمة المرور
                      </Typography>
                      <TextField InputLabelProps={{ shrink: true }}
                        id="login-password"
                        placeholder="أدخل كلمة المرور"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        fullWidth
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isLoading}
                        inputProps={{
                          dir: 'rtl',
                          'aria-label': 'كلمة المرور'
                        }}
                        sx={uiLayout.withUiSx(getFieldStyles(theme), uiLayout.formFieldSx)}
                      />
                    </Box>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 0.9, sm: 1.5 }}
                      sx={uiLayout.withUiSx({ pt: { xs: 0.25, sm: 0.8 } }, uiLayout.actionBarSx)}
                    >
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isLoading}
                        sx={uiLayout.withUiSx({
                          minHeight: { xs: 40, sm: 46, md: 52 },
                          borderRadius: { xs: 1.8, sm: 2.5 },
                          fontFamily: 'Cairo, Arial, sans-serif',
                          fontWeight: 800,
                          fontSize: { xs: '0.76rem', sm: '0.86rem', md: '0.98rem' },
                          border: isDark
                            ? `1px solid ${DARK.border}`
                            : '1px solid transparent',
                          color: isDark ? DARK.accent : '#fff',
                          boxShadow: isDark
                            ? 'none'
                            : '0 10px 24px rgba(5,117,70,0.25)',
                          background: isDark
                            ? 'transparent'
                            : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                          backgroundColor: isDark
                            ? 'transparent'
                            : undefined,
                          backgroundImage: isDark
                            ? 'none'
                            : undefined,
                          '&:hover': {
                            background: isDark
                              ? 'transparent'
                              : `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
                            backgroundColor: isDark
                              ? 'transparent'
                              : undefined,
                            borderColor: isDark
                              ? '#8EDBB8'
                              : 'transparent',
                            color: isDark
                              ? '#C9F2DF'
                              : '#fff',
                            boxShadow: isDark
                              ? '0 0 0 1px rgba(103,201,157,.14)'
                              : '0 13px 30px rgba(5,117,70,0.31)',
                            transform: 'none'
                          }
                        }, uiLayout.buttonSx)}
                      >
                        {isLoading ? (
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <CircularProgress size={20} color="inherit" />
                            <span>جاري تسجيل الدخول...</span>
                          </Stack>
                        ) : (
                          'دخول'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        disabled={isLoading}
                        onClick={handleAdminSubmit}
                        startIcon={<SecurityOutlined />}
                        sx={uiLayout.withUiSx({
                          minHeight: { xs: 40, sm: 46, md: 52 },
                          borderRadius: { xs: 1.8, sm: 2.5 },
                          fontFamily: 'Cairo, Arial, sans-serif',
                          fontWeight: 800,
                          fontSize: { xs: "0.75rem", sm: '0.84rem', md: '0.95rem' },
                          borderWidth: 1.5,
                          borderColor: isDark ? DARK.border : COLORS.primary,
                          color: isDark ? DARK.accent : COLORS.primary,
                          backgroundColor: isDark ? 'transparent' : COLORS.primarySoft,
                          backgroundImage: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            borderWidth: 1.5,
                            borderColor: isDark ? '#8EDBB8' : COLORS.primaryDark,
                            backgroundColor: isDark ? 'transparent' : '#dff1e9',
                            color: isDark ? '#C9F2DF' : COLORS.primaryDark,
                            transform: 'none',
                            boxShadow: isDark
                              ? '0 0 0 1px rgba(103,201,157,.14)'
                              : 'none'
                          }
                        }, uiLayout.buttonSx)}
                      >
                        دخول المسؤول
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <Typography
                  sx={{
                    mt: { xs: 1.35, sm: 2.3, md: 3 },
                    textAlign: 'center',
                    color: isDark ? DARK.muted : '#83938d',
                    fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.78rem' },
                    lineHeight: { xs: 1.6, sm: 1.8 }
                  }}
                >
                  باستخدامك للنظام، فإنك تقر بالمحافظة على سرية بيانات الدخول.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                order: { xs: 2, md: 2 },
                position: 'relative',
                overflow: 'hidden',
                minHeight: { xs: 132, sm: 190, md: 'auto' },
                p: { xs: 1.05, sm: 2, md: isShortScreen ? 3.25 : 6 },
                color: isDark ? DARK.text : COLORS.white,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isDark
                  ? `linear-gradient(145deg, ${DARK.section} 0%, ${DARK.card} 72%, ${DARK.nested} 100%)`
                  : `linear-gradient(145deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 68%, #0c9963 100%)`,
                borderInlineEnd: 'none',
                borderBlockStart: {
                  xs: isDark
                    ? `1px solid ${DARK.border}`
                    : 'none',
                  md: 'none'
                },
                boxShadow: {
                  xs: isDark
                    ? '0 -10px 24px -22px rgba(103,201,157,.60)'
                    : 'none',
                  md: 'none'
                },
                '&::before': {
                  content: '""',
                  display: {
                    xs: isDark ? 'block' : 'none',
                    md: 'none'
                  },
                  position: 'absolute',
                  insetInline: '12%',
                  top: '-1px',
                  height: '1px',
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(155,224,193,.30) 18%, #67C99D 50%, rgba(155,224,193,.30) 82%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 2
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: 340,
                  height: 340,
                  borderRadius: '50%',
                  top: -190,
                  left: -120,
                  border: isDark ? '55px solid rgba(103,201,157,.035)' : '55px solid rgba(255,255,255,0.055)'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  bottom: -145,
                  right: -90,
                  backgroundColor: isDark ? 'rgba(103,201,157,.035)' : 'rgba(174,30,33,0.20)'
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: { xs: 38, sm: 48, md: 54 },
                      height: { xs: 38, sm: 48, md: 54 },
                      borderRadius: { xs: 1.6, sm: 2.2, md: 2.5 },
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: isDark
                        ? DARK.nested
                        : 'rgba(255,255,255,0.14)',
                      border: isDark
                        ? `1px solid ${DARK.border}`
                        : '1px solid rgba(255,255,255,0.22)'
                    }}
                  >
                    <BusinessOutlined sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.96rem', sm: '1.4rem', md: '2.25rem' },
                        fontWeight: 900,
                        letterSpacing: '0.01em',
                        lineHeight: 1.2
                      }}
                    >
                      ERP System
                    </Typography>
                    <Typography sx={{ mt: 0.2, opacity: 0.83, fontSize: { xs: "0.75rem", sm: '0.76rem', md: '1rem' } }}>
                      نظام إدارة الموظفين والشؤون الإدارية
                    </Typography>
                  </Box>
                </Stack>

                {!isSmallScreen && (
                  <Typography
                    sx={{
                      mt: 4,
                      maxWidth: 470,
                      fontSize: '1.05rem',
                      lineHeight: 2,
                      color: isDark ? DARK.muted : 'rgba(255,255,255,0.88)'
                    }}
                  >
                    منصة موحدة تساعد فرق العمل على إدارة العمليات اليومية،
                    الصلاحيات، المتابعة والتقارير من مكان واحد.
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  mt: { xs: 1.2, sm: 2.2, md: 5 },
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(3, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                    md: '1fr'
                  },
                  gap: { xs: 0.55, sm: 0.9, md: 1.5 }
                }}
              >
                {FEATURES.map((feature) => (
                  <Stack
                    key={feature.title}
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={{ xs: 0.7, md: 1.5 }}
                    alignItems="flex-start"
                    sx={{
                      p: { xs: 0.55, sm: 1.05, md: 1.6 },
                      textAlign: { xs: 'center', md: 'start' },
                      borderRadius: { xs: 1.6, sm: 2.2, md: 2.5 },
                      backgroundColor: isDark
                        ? DARK.nested
                        : 'rgba(255,255,255,0.10)',
                      border: isDark
                        ? `1px solid ${DARK.border}`
                        : '1px solid rgba(255,255,255,0.14)'
                    }}
                  >
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: { xs: 28, sm: 34, md: 44 },
                        height: { xs: 28, sm: 34, md: 44 },
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2,
                        backgroundColor: isDark ? DARK.section : 'rgba(255,255,255,0.14)',
                        '& svg': { fontSize: { xs: 17, sm: 20, md: 25 } }
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.95rem' },
                          lineHeight: 1.35
                        }}
                      >
                        {feature.title}
                      </Typography>
                      {!isVerySmallScreen && (
                        <Typography
                          sx={{
                            mt: 0.15,
                            opacity: isDark ? 1 : 0.74,
                            color: isDark ? DARK.muted : 'inherit',
                            fontSize: { sm: "0.75rem", md: '0.8rem' }
                          }}
                        >
                          {feature.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>

      <Box
        component="footer"
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 2,
          py: { xs: 0.55, sm: 0.9, md: 1.4 },
          textAlign: 'center',
          color: isDark ? DARK.muted : 'rgba(255,255,255,0.88)',
          fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.82rem' },
          borderTop: isDark
            ? `1px solid ${DARK.border}`
            : '1px solid rgba(255,255,255,0.12)',
          backgroundColor: isDark
            ? DARK.section
            : 'rgba(2,48,30,0.28)',
          backdropFilter: 'blur(10px)'
        }}
      >
        تم تطويره بواسطة{' '}
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            color: isDark ? DARK.text : COLORS.white
          }}
        >
          فريق الدعم الفني وتطوير البرمجيات
        </Box>{' '}
        © {currentYear}
      </Box>
    </Box>
  );
}

const fieldGroupStyles = {
  width: '100%'
};

const fieldLabelStyles = (theme) => ({
  display: 'block',
  marginBottom: '7px',
  paddingRight: '2px',
  textAlign: 'right',
  direction: 'rtl',
  color: theme.palette.mode === 'dark' ? DARK.text : COLORS.text,
  fontFamily: 'Cairo, Arial, sans-serif',
  fontWeight: 800,
  fontSize: '0.88rem',
  lineHeight: 1.6
});

const getFieldStyles = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    width: '100%',
    direction: 'rtl',

    '& .MuiOutlinedInput-root': {
      minHeight: '52px',
      direction: 'rtl',
      borderRadius: '12px',
      backgroundColor: isDark ? DARK.nested : '#fbfdfc',
      backgroundImage: 'none',
      color: isDark ? DARK.text : COLORS.text
    },

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? DARK.border : '#dce8e3',
      borderWidth: isDark ? '1px' : undefined
    },

    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#8EDBB8' : COLORS.primary
    },

    '& .MuiOutlinedInput-root.Mui-focused': {
      backgroundColor: isDark ? DARK.nested : COLORS.white,
      boxShadow: isDark
        ? '0 0 0 1px rgba(103,201,157,.12)'
        : '0 0 0 4px rgba(5,117,70,0.09)'
    },

    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#8EDBB8' : COLORS.primary,
      borderWidth: isDark ? '1px' : '1.5px'
    },

    '& .MuiOutlinedInput-input': {
      direction: 'rtl',
      textAlign: 'right',
      fontFamily: 'Cairo, Arial, sans-serif',
      fontSize: '0.95rem',
      paddingTop: '13px',
      paddingBottom: '13px'
    },

    '& .MuiInputAdornment-root': {
      direction: 'ltr'
    },

    '& .MuiInputAdornment-root svg': {
      fontSize: '1.2rem',
      color: isDark ? DARK.accent : COLORS.primary
    },

    '& .MuiInputBase-input': {
      color: isDark ? DARK.text : COLORS.text
    },

    '& .MuiIconButton-root': {
      background: 'transparent',
      backgroundColor: 'transparent',
      border: 'none',
      borderColor: 'transparent',
      boxShadow: 'none',
      color: isDark ? DARK.accent : COLORS.primary
    },

    '& .MuiIconButton-root:hover, & .MuiIconButton-root:focus, & .MuiIconButton-root:focus-visible': {
      background: 'transparent',
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      outline: 'none'
    }
  };
};
