import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  useTheme,
  styled,
  TablePagination,
  Button,
  Menu,
  MenuItem,
  Chip,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Badge as IdIcon,
  School as LevelIcon,
  MenuBook as DiplomaIcon,
  Download as DownloadIcon,
  CalendarMonth as MonthIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {  AppBar,Toolbar,Tabs,Tab} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Document, Paragraph, Packer, AlignmentType, HeadingLevel, Table as DocxTable, TableRow as DocxRow, TableCell as DocxCell, WidthType, BorderStyle } from 'docx';
import Sidebar from '../components/Sidebar';

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

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: colorPalette.primaryLighter,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: alpha(colorPalette.primary, 0.08),
    transform: 'translateY(-1px)',
    transition: 'all 0.2s ease',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 500,
  borderColor: colorPalette.primaryLighter,
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  direction: 'rtl',
  borderTop: `2px solid ${colorPalette.primaryLighter}`,
  backgroundColor: colorPalette.background,
  '& .MuiTablePagination-selectLabel': {
    marginTop: '1.5px',
    marginBottom: 0,
    fontSize: '0.875rem',
    color: colorPalette.textLight,
    fontWeight: 600
  },
  '& .MuiTablePagination-displayedRows': {
    marginTop: '1.5px',
    marginBottom: 0,
    fontSize: '0.875rem',
    color: colorPalette.textDark,
    fontWeight: 600
  },
  '& .MuiTablePagination-actions': {
    marginRight: '8px',
    '& button': {
      padding: '6px',
      margin: '0 4px',
      border: `1px solid ${colorPalette.primaryLight}`,
      borderRadius: '8px',
      color: colorPalette.primary,
      '&:hover': { 
        backgroundColor: colorPalette.primaryLighter,
        borderColor: colorPalette.primary,
      },
      '&.Mui-disabled': {
        borderColor: colorPalette.primaryLighter,
        color: colorPalette.primaryLight,
      }
    }
  },
  '& .MuiSelect-select': {
    padding: '8px 12px 8px 32px',
    borderRadius: '8px',
    border: `1px solid ${colorPalette.primaryLight}`,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colorPalette.textDark,
    '&:focus': {
      borderColor: colorPalette.primary,
      backgroundColor: colorPalette.primaryLighter,
    }
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 600,
  fontSize: '1rem',
  margin: '0 8px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&.Mui-selected': {
    backgroundColor: colorPalette.primaryLighter,
    color: colorPalette.primaryDark,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.2)}`,
  },
  '&:hover': {
    backgroundColor: alpha(colorPalette.primary, 0.1),
    transform: 'translateY(-1px)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 700,
  borderRadius: '10px',
  padding: '10px 24px',
  transition: 'all 0.3s ease',
  textTransform: 'none',
  fontSize: '0.95rem',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(colorPalette.primary, 0.3)}`,
  }
}));

const MonthlyAttendanceReport = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedTab, setSelectedTab] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [branchName, setBranchName] = useState('جارٍ التحميل...');
  const navigate = useNavigate();

  const monthStart = startOfMonth(new Date(selectedMonth));
  const monthEnd = endOfMonth(new Date(selectedMonth));
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleTabChange = (event, newValue) => {
    setTimeout(() => {
      switch(newValue) {
        case 0:
          navigate('/periodic-reports');
          break;
        case 1:
          navigate('/monthly');
          break;
        case 2:
          navigate('/daily');
          break;
        case 3:
          navigate('/attendance');
          break;
        default:
          break;
      }
    }, 100);
  };

  const fetchBranchName = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.guid) {
        throw new Error('User GUID not found');
      }
      
      const response = await fetch(`https://api3.sstli.com/api/Trainer/UserBranchForWork?userGuid=${user.guid}`);
      if (!response.ok) throw new Error('Failed to fetch branch name');
      
      const data = await response.json();
      setBranchName(data[0].brEName);
    } catch (err) {
      console.error('Error fetching branch name:', err);
      setBranchName('غير محدد');
    }
  };

  const fetchStudents = async () => {
    try {
      await fetchBranchName();
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.branchForWork) {
        throw new Error('Branch information not found');
      }
      
      const response = await fetch(`https://api1.sstli.com/api/StudentStudyInfo/by-branch/${user.branchForWork}`);
      if (!response.ok) throw new Error('Failed to fetch students');
  
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      await fetchBranchName();
      const response = await fetch('https://filesregsiteration.sstli.com/get_attendance.php');
      const result = await response.json();

      if (result.success) {
        const filteredData = result.data.filter(item => {
          const attendanceDate = parseISO(item.attendance_date);
          return isWithinInterval(attendanceDate, { start: monthStart, end: monthEnd });
        });
        
        setAttendanceData(filteredData);
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStudents();
      await fetchAttendanceData();
    };
    loadData();
  }, [selectedMonth]);

  const handleRefresh = () => {
    setLoading(true);
    fetchStudents();
    fetchAttendanceData();
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setSelectedCourse(null);
  };

  const handleSendToWhatsApp = async (student) => {
    if (!student) return;

    try {
      const response = await fetch(`https://api1.sstli.com/api/student/${student.nationalId}`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      
      const studentData = await response.json();
      
      const formatWhatsAppNumber = (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('966') && cleaned.length === 12) {
          return `+${cleaned}`;
        } else if (cleaned.startsWith('05') && cleaned.length === 10) {
          return `+966${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('5') && cleaned.length === 9) {
          return `+966${cleaned}`;
        }
        return null;
      };

      const whatsappNumber = formatWhatsAppNumber(studentData.studentTel);
      
      const attendanceDetails = getStudentAttendanceDetails(student.nationalId);
      const presentDays = attendanceDetails.filter(day => day.attended).length;
      const totalDays = monthDays.length;
      const percentage = calculateAttendancePercentage(student.nationalId);

      let message = `📊 تقرير الحضور الشهري\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `🗓️ الشهر: ${format(new Date(selectedMonth), 'MMMM yyyy', { locale: arSA })}\n`;
      message += `🏢 الفرع: ${branchName}\n\n`;
      
      message += `👤 معلومات الطالب\n`;
      message += `------------------\n`;
      message += `📛 الاسم: ${student.studentName}\n`;
      message += `🆔 الهوية: ${student.nationalId}\n`;
      message += `📚 المستوى: ${student.levelName}\n`;
      message += `🎓 الدبلوم: ${student.diplomName}\n\n`;
      
      message += `📈 ملخص الحضور\n`;
      message += `------------------\n`;
      message += `✅ أيام الحضور: ${presentDays}\n`;
      message += `❌ أيام الغياب: ${totalDays - presentDays}\n`;
      message += `📊 النسبة: ${percentage}%\n\n`;
      
      if (presentDays > 0) {
        message += `📅 الأيام الحاضرة:\n`;
        message += `------------------\n`;
        attendanceDetails
          .filter(day => day.attended)
          .forEach((day, index) => {
            const courseAttendance = attendanceData.find(a => 
              a.national_id === student.nationalId && 
              format(parseISO(a.attendance_date), 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
            );
            
            message += `${index + 1}. ${day.formattedDate}\n`;
            if (courseAttendance) {
              message += `   📖 المادة: ${courseAttendance.course}\n`;
              message += `   ⏰ الوقت: ${courseAttendance.attendance_time}\n\n`;
            }
          });
      }

      message += `_ملاحظة:_ هذا تقرير تلقائي من نظام الحضور\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━`;

      const encodedMessage = encodeURIComponent(message);
      const studentUrl = whatsappNumber 
        ? `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
        : null;

      const adminNumber = "966501234567"; 
      const trackingMessage = `📨 تم إرسال تقرير حضور لـ ${student.studentName}\n` +
        `📅 التاريخ: ${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: arSA })}`;
      const trackingUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(trackingMessage)}`;

      if (studentUrl) {
        window.open(studentUrl, '_blank');
      } else {
        alert('لا يوجد رقم واتساب مسجل للطالب');
      }
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = trackingUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);

    } catch (error) {
      console.error('WhatsApp Error:', error);
      alert('حدث خطأ أثناء إرسال التقرير');
      
      const message = `تقرير الحضور الشهري للطالب ${student.studentName}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleExportWord = () => {
    const P = (text, { align = AlignmentType.RIGHT, bold = false, color, size } = {}) =>
      new Paragraph({
        text,
        alignment: align,
        rightToLeft: true,
        ...(bold || color || size
          ? { run: { bold, color, size } }
          : {}),
      });

    const headerCell = (text) =>
      new DocxCell({
        children: [P(text, { bold: true, color: "FFFFFF" })],
        shading: { fill: colorPalette.primaryDark },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
      });

    const cell = (text, fill) =>
      new DocxCell({
        children: [P(text)],
        shading: { fill: fill ?? "FFFFFF" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
      });

    const makeTable = (rows, widthPct = 100) =>
      new DocxTable({
        width: { size: widthPct, type: WidthType.PERCENTAGE },
        rows,
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 4, color: colorPalette.primaryLight },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: colorPalette.primaryLight },
          left:   { style: BorderStyle.SINGLE, size: 4, color: colorPalette.primaryLight },
          right:  { style: BorderStyle.SINGLE, size: 4, color: colorPalette.primaryLight },
          insideH:{ style: BorderStyle.SINGLE, size: 2, color: colorPalette.primaryLighter },
          insideV:{ style: BorderStyle.SINGLE, size: 2, color: colorPalette.primaryLighter },
        },
      });

    const Title = (text) =>
      new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        rightToLeft: true,
      });

    const doc = new Document({
      description: "تقرير الحضور الشهري",
      styles: {
        paragraphStyles: [{
          id: "arabicStyle",
          name: "Arabic Style",
          run: {
            font: "Arial",
            size: 24,
            bold: true,
            color: "000000",
            rightToLeft: true
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            spacing: { line: 400 }
          }
        }]
      },
      sections: [{
        properties: {
          direction: "rtl"
        },
        children: [
          new Paragraph({
            text: "تقرير الحضور الشهري",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            bold: true,
            size: 28
          }),
          new Paragraph({
            text: `الشهر: ${format(new Date(selectedMonth), 'MMMM yyyy', { locale: arSA })}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
            size: 22
          }),
          new Paragraph({
            text: `الفرع: ${branchName}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
            size: 20
          }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 400, bottom: 400, left: 400, right: 400 },
            columnWidths: [3000, 2500, 2000, 2000, 2000, ...monthDays.map(() => 1000)],
            rows: [
              new DocxRow({
                children: [
                  ...monthDays.map(day => 
                    new DocxCell({
                      children: [new Paragraph({
                        text: format(day, 'd', { locale: arSA }),
                        bold: true,
                        size: 16
                      })],
                      shading: { fill: colorPalette.primaryDark }
                    })
                  ).reverse(),
                  new DocxCell({
                    children: [new Paragraph({
                      text: "الدبلوم",
                      bold: true,
                      size: 20
                    })],
                    shading: { fill: colorPalette.primaryDark }
                  }),
                  new DocxCell({
                    children: [new Paragraph({
                      text: "المستوى", 
                      bold: true,
                      size: 20
                    })],
                    shading: { fill: colorPalette.primaryDark }
                  }),
                  new DocxCell({
                    children: [new Paragraph({
                      text: "رقم الهوية",
                      bold: true,
                      size: 20
                    })],
                    shading: { fill: colorPalette.primaryDark }
                  }),
                  new DocxCell({
                    children: [new Paragraph({
                      text: "الاسم",
                      bold: true, 
                      size: 20
                    })],
                    shading: { fill: colorPalette.primaryDark }
                  })
                ]
              }),
              ...filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(student => 
                new DocxRow({
                  children: [
                    ...monthDays.map(day => {
                      const attended = attendanceData.some(a => 
                        a.national_id === student.nationalId && 
                        format(parseISO(a.attendance_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      );
                      return new DocxCell({ 
                        children: [new Paragraph({
                          text: attended ? "حاضر" : "غائب",
                          size: 14,
                          color: attended ? "2E7D32" : "D32F2F"
                        })]
                      });
                    }).reverse(),
                    new DocxCell({ 
                      children: [new Paragraph({
                        text: student.diplomName,
                        size: 18
                      })]
                    }),
                    new DocxCell({ 
                      children: [new Paragraph({
                        text: student.levelName,
                        size: 18
                      })]
                    }),
                    new DocxCell({ 
                      children: [new Paragraph({
                        text: student.nationalId,
                        size: 18
                      })]
                    }),
                    new DocxCell({ 
                      children: [new Paragraph({
                        text: student.studentName,
                        size: 18
                      })]
                    })
                  ]
                })
              )
            ]
          })
        ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_حضور_${format(new Date(selectedMonth), 'yyyy-MM')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const didStudentAttend = (studentId, day) => {
    return attendanceData.some(a => 
      a.national_id === studentId && 
      format(parseISO(a.attendance_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
  };

  const calculateAttendancePercentage = (studentId) => {
    const attendedDays = monthDays.filter(day => 
      didStudentAttend(studentId, day)
    ).length;
    
    const idealAttendanceDays = 14;
    const percentage = Math.round((attendedDays / idealAttendanceDays) * 100);
    
    return Math.min(percentage, 100);
  };

  const getStudentAttendanceDetails = (studentId) => {
    return monthDays.map(day => ({
      date: day,
      attended: didStudentAttend(studentId, day),
      formattedDate: format(day, 'EEEE, d MMMM yyyy', { locale: arSA })
    }));
  };

  const filteredStudents = students
    .filter(student =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nationalId.includes(searchTerm)
    )
    .map(student => ({
      ...student,
      attendancePercentage: calculateAttendancePercentage(student.nationalId)
    }))
    .sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  return (
    <Box sx={{ direction: 'rtl', backgroundColor: colorPalette.background, minHeight: '100vh' }}>
      <Sidebar />

      <Box component="main" sx={{ 
        flexGrow: 1,
        p: 4,
        marginLeft: '280px',
        minHeight: '100vh',
        direction:'ltr',
        backgroundColor: colorPalette.background
      }}>
        <AppBar 
          position="static" 
          sx={{ 
            backgroundColor: 'white',
            direction:'rtl',
            color: colorPalette.textDark,
            boxShadow: `0 2px 12px ${alpha(colorPalette.primary, 0.15)}`,
            width: '100%',
            left: 0,
            right: 'auto',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', paddingLeft: '16px' }}>
            <Tabs 
              value={selectedTab} 
              onChange={handleTabChange}
              textColor="inherit"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: colorPalette.primary,
                  height: 3,
                  borderRadius: '2px'
                }
              }}
            >
              <StyledTab label="التقارير الدورية" />
              <StyledTab label="التقرير الشهري" />
              <StyledTab label="التقرير اليومي" />
              <StyledTab label="الحضور" />
            </Tabs>
            
            <Typography variant="h6" component="div" sx={{ 
              fontFamily: '"Cairo", sans-serif',
              fontWeight: 700,
              color: colorPalette.textDark
            }}>
              نظام إدارة الحضور
            </Typography>
          </Toolbar>
        </AppBar>

        <Paper elevation={0} sx={{ 
          mb: 4,
          p: 4,
          mt: 2,
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
          color: 'white',
          borderRadius: '16px',
          boxShadow: `0 8px 32px ${alpha(colorPalette.primary, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${alpha('#fff', 0.1)} 0%, ${alpha(colorPalette.primary, 0)} 70%)`,
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box sx={{
              backgroundColor: alpha('#fff', 0.2),
              borderRadius: '50%',
              p: 2,
              mr: 3,
              backdropFilter: 'blur(10px)'
            }}>
              <MonthIcon sx={{ fontSize: 40 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 800, 
                fontFamily: '"Cairo", sans-serif',
                mb: 1
              }}>
                التقرير الشهري للحضور
              </Typography>
              <Typography variant="h6" sx={{ 
                fontFamily: '"Cairo", sans-serif',
                opacity: 0.9,
                mb: 1
              }}>
                {format(new Date(selectedMonth), 'MMMM yyyy', { locale: arSA })}
              </Typography>
              {/* <Typography variant="body1" sx={{ 
                fontFamily: '"Cairo", sans-serif', 
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: alpha('#fff', 0.8),
                  borderRadius: '50%',
                  display: 'inline-block'
                }} />
                الفرع: {branchName}
              </Typography> */}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={handleRefresh} sx={{
                backgroundColor: alpha('#fff', 0.2),
                color: 'white',
                '&:hover': { 
                  backgroundColor: alpha('#fff', 0.3),
                  transform: 'rotate(180deg)',
                  transition: 'all 0.5s ease'
                },
                transition: 'all 0.3s ease'
              }}>
                <RefreshIcon />
              </IconButton>

              <StyledButton
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportWord}
                sx={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.3),
                    border: `1px solid ${alpha('#fff', 0.5)}`,
                  }
                }}
              >
                تصدير كملف Word
              </StyledButton>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${colorPalette.primaryLighter}`,
          backgroundColor: 'white',
          boxShadow: `0 4px 20px ${alpha(colorPalette.primary, 0.08)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colorPalette.primary }}>
              <FilterIcon />
              <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                الفلاتر
              </Typography>
            </Box>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel sx={{ 
                fontFamily: '"Cairo", sans-serif',
                fontWeight: 600,
                color: colorPalette.textLight
              }}>
                اختر الشهر
              </InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="اختر الشهر"
                sx={{ 
                  fontFamily: '"Cairo", sans-serif',
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colorPalette.primaryLight,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colorPalette.primary,
                  },
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const monthValue = format(date, 'yyyy-MM');
                  const monthName = format(date, 'MMMM yyyy', { locale: arSA });
                  return (
                    <MenuItem key={monthValue} value={monthValue} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      {monthName}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              variant="outlined"
              label="ابحث بالاسم أو رقم الهوية"
              value={searchTerm}
              onChange={handleSearch}
              InputLabelProps={{ 
                sx: { fontFamily: '"Cairo", sans-serif', fontWeight: 600 } 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorPalette.primary }} />
                  </InputAdornment>
                ),
                sx: { fontFamily: '"Cairo", sans-serif' }
              }}
              sx={{ 
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: colorPalette.primaryLight,
                  },
                  '&:hover fieldset': {
                    borderColor: colorPalette.primary,
                  },
                }
              }}
            />
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '300px',
            flexDirection: 'column',
            gap: 3
          }}>
            <CircularProgress 
              size={60} 
              sx={{ color: colorPalette.primary }} 
            />
            <Typography variant="h6" sx={{ 
              fontFamily: '"Cairo", sans-serif',
              color: colorPalette.textLight,
              fontWeight: 600
            }}>
              جاري تحميل البيانات...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ 
            mb: 3,
            fontFamily: '"Cairo", sans-serif',
            '& .MuiAlert-message': { py: 1 },
            borderRadius: '12px',
            border: `1px solid ${colorPalette.error}20`,
            backgroundColor: `${colorPalette.error}08`
          }}>
            {error}
          </Alert>
        ) : filteredStudents.length === 0 ? (
          <Paper elevation={0} sx={{ 
            p: 6, 
            textAlign: 'center',
            border: `2px dashed ${colorPalette.primaryLight}`,
            borderRadius: '16px',
            backgroundColor: colorPalette.background
          }}>
            <TodayIcon sx={{ 
              fontSize: 80, 
              mb: 2, 
              color: colorPalette.primaryLight 
            }} />
            <Typography variant="h5" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              fontWeight: 600,
              mb: 1
            }}>
              لا توجد بيانات متاحة للعرض
            </Typography>
            <Typography variant="body1" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              opacity: 0.8
            }}>
              حاول تغيير الشهر أو مصطلحات البحث
            </Typography>
          </Paper>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer component={Paper} elevation={0} sx={{ 
                border: `1px solid ${colorPalette.primaryLighter}`,
                borderRadius: '16px',
                backgroundColor: 'white',
                boxShadow: `0 4px 20px ${alpha(colorPalette.primary, 0.08)}`
              }}>
                <Table stickyHeader aria-label="monthly attendance table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "right",
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        backgroundColor: colorPalette.primaryLighter,
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        الترتيب
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "left",
                        position: 'sticky',
                        left: 60,
                        zIndex: 2,
                        backgroundColor: colorPalette.primaryLighter,
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        الطالب
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "left",
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        رقم الهوية
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "left",
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        المستوى
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "left",
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        الدبلوم
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "center",
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        نسبة الحضور
                      </StyledTableCell>
                      <StyledTableCell sx={{ 
                        fontWeight: 800, 
                        textAlign: "center",
                        color: colorPalette.textDark,
                        fontSize: '1rem'
                      }}>
                        تفاصيل الحضور
                      </StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((student, index) => (
                      <StyledTableRow key={student.nationalId}>
                        <StyledTableCell sx={{ 
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          backgroundColor: 'white',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {page * rowsPerPage + index + 1}
                        </StyledTableCell>
                        <StyledTableCell sx={{ 
                          position: 'sticky',
                          left: 60,
                          zIndex: 1,
                          backgroundColor: 'white'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: colorPalette.primary,
                                width: 40,
                                height: 40,
                                mr: 2,
                                color: 'white',
                                boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.3)}`
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.studentName}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IdIcon sx={{ 
                              ml: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.nationalId}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LevelIcon sx={{ 
                              ml: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.levelName}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DiplomaIcon sx={{ 
                              ml: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.diplomName}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={`${student.attendancePercentage}%`}
                            color={
                              student.attendancePercentage >= 80 ? 'success' :
                              student.attendancePercentage >= 50 ? 'warning' : 'error'
                            }
                            sx={{ 
                              fontFamily: '"Cairo", sans-serif', 
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              minWidth: '80px'
                            }}
                          />
                        </StyledTableCell>
                        <StyledTableCell sx={{ textAlign: 'center' }}>
                          <IconButton 
                            onClick={() => handleViewDetails(student)}
                            sx={{
                              color: colorPalette.primary,
                              backgroundColor: colorPalette.primaryLighter,
                              '&:hover': {
                                backgroundColor: colorPalette.primary,
                                color: 'white',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <StyledTablePagination
              component="div"
              count={filteredStudents.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 15, 25, 50]}
              labelRowsPerPage="صفوف لكل صفحة:"
              labelDisplayedRows={({ from, to, count }) => {
                return `${from}-${to} من ${count !== -1 ? count : `more than ${to}`}`;
              }}
            />
          </>
        )}
      </Box>

      {/* Attendance Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        sx={{ 
          '& .MuiDialog-paper': { 
            borderRadius: '20px',
            overflow: 'hidden'
          } 
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
          color: 'white',
          fontFamily: '"Cairo", sans-serif',
          fontWeight: 800,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '100%',
            height: '3px',
            background: `linear-gradient(90deg, ${alpha('#fff', 0.3)}, transparent)`
          }
        }}>
          <Box>
            <Typography variant="h5" component="span" sx={{ fontFamily: '"Cairo", sans-serif' }}>
              تفاصيل الحضور الشهري
            </Typography>
            <Typography variant="subtitle1" component="div" sx={{ 
              mt: 1, 
              opacity: 0.9,
              fontFamily: '"Cairo", sans-serif'
            }}>
              {selectedStudent?.studentName} - {format(new Date(selectedMonth), 'MMMM yyyy', { locale: arSA })}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleCloseDialog} 
            sx={{ 
              color: 'white',
              backgroundColor: alpha('#fff', 0.2),
              '&:hover': {
                backgroundColor: alpha('#fff', 0.3),
                transform: 'rotate(90deg)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, backgroundColor: colorPalette.background }}>
          {selectedStudent && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    border: `1px solid ${colorPalette.primaryLighter}`, 
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.1)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }}>
                      رقم الهوية
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      fontWeight: 700,
                      color: colorPalette.textDark,
                      mt: 0.5
                    }}>
                      {selectedStudent.nationalId}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    border: `1px solid ${colorPalette.primaryLighter}`, 
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.1)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }}>
                      المستوى
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      fontWeight: 700,
                      color: colorPalette.textDark,
                      mt: 0.5
                    }}>
                      {selectedStudent.levelName}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    border: `1px solid ${colorPalette.primaryLighter}`, 
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.1)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }}>
                      الدبلوم
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      fontWeight: 700,
                      color: colorPalette.textDark,
                      mt: 0.5
                    }}>
                      {selectedStudent.diplomName}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    border: `1px solid ${colorPalette.primaryLighter}`, 
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(colorPalette.primary, 0.1)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      color: colorPalette.textLight,
                      fontWeight: 600
                    }}>
                      نسبة الحضور
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      fontFamily: '"Cairo", sans-serif', 
                      fontWeight: 700,
                      color: calculateAttendancePercentage(selectedStudent.nationalId) >= 80 ? colorPalette.success :
                            calculateAttendancePercentage(selectedStudent.nationalId) >= 50 ? colorPalette.warning : 
                            colorPalette.error,
                      mt: 0.5
                    }}>
                      {calculateAttendancePercentage(selectedStudent.nationalId)}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Course Filter */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ 
                  fontFamily: '"Cairo", sans-serif',
                  fontWeight: 600,
                  color: colorPalette.textLight
                }}>
                  اختر المادة
                </InputLabel>
                <Select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="اختر المادة"
                  sx={{ 
                    fontFamily: '"Cairo", sans-serif',
                    borderRadius: '10px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primaryLight,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorPalette.primary,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    جميع المواد
                  </MenuItem>
                  {Array.from(new Set(
                    attendanceData
                      .filter(a => a.national_id === selectedStudent.nationalId)
                      .map(a => a.course)
                  )).map((course, index) => (
                    <MenuItem key={index} value={course} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      {course}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ 
                fontFamily: '"Cairo", sans-serif',
                mb: 2,
                color: colorPalette.primaryDark,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 800
              }}>
                <TodayIcon sx={{ ml: 1 }} />
                {selectedCourse ? `أيام الحضور لمادة ${selectedCourse}` : 'أيام الحضور لجميع المواد'}
              </Typography>

              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 2,
                maxHeight: '400px',
                overflowY: 'auto',
                p: 1
              }}>
                {getStudentAttendanceDetails(selectedStudent.nationalId)
                  .filter(day => {
                    if (!selectedCourse) return true;
                    return attendanceData.some(a => 
                      a.national_id === selectedStudent.nationalId && 
                      a.course === selectedCourse &&
                      format(parseISO(a.attendance_date), 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
                    );
                  })
                  .map((day, index) => {
                    const courseAttendance = attendanceData.find(a => 
                      a.national_id === selectedStudent.nationalId && 
                      format(parseISO(a.attendance_date), 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
                    );
                    
                    return (
                      <Paper 
                        key={index} 
                        elevation={0} 
                        sx={{ 
                          p: 2,
                          border: `1px solid ${colorPalette.primaryLighter}`,
                          borderRadius: '12px',
                          backgroundColor: day.attended ? 
                            `linear-gradient(135deg, ${colorPalette.primaryLighter}, white)` : 
                            `linear-gradient(135deg, #ffebee, white)`,
                          background: day.attended ? 
                            `linear-gradient(135deg, ${colorPalette.primaryLighter}, white)` : 
                            `linear-gradient(135deg, #ffebee, white)`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${alpha(day.attended ? colorPalette.primary : colorPalette.error, 0.15)}`
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ 
                            fontFamily: '"Cairo", sans-serif', 
                            fontWeight: 700,
                            color: colorPalette.textDark
                          }}>
                            {day.formattedDate}
                          </Typography>
                          <Chip 
                            label={day.attended ? "حاضر" : "غائب"}
                            color={day.attended ? "success" : "error"}
                            size="small"
                            sx={{ 
                              fontFamily: '"Cairo", sans-serif', 
                              fontWeight: 700,
                              backgroundColor: day.attended ? colorPalette.success : colorPalette.error,
                              color: 'white'
                            }}
                          />
                        </Box>
                        {day.attended && courseAttendance && (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Cairo", sans-serif', 
                                color: colorPalette.textLight,
                                fontWeight: 600
                              }}>
                                المادة:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Cairo", sans-serif', 
                                fontWeight: 700,
                                color: colorPalette.textDark
                              }}>
                                {courseAttendance.course}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Cairo", sans-serif', 
                                color: colorPalette.textLight,
                                fontWeight: 600
                              }}>
                                وقت الحضور:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontFamily: '"Cairo", sans-serif', 
                                fontWeight: 700,
                                color: colorPalette.textDark
                              }}>
                                {courseAttendance.attendance_time}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Paper>
                    );
                  })}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${colorPalette.primaryLighter}`, 
          display: 'flex', 
          justifyContent: 'space-between',
          backgroundColor: 'white'
        }}>
          <StyledButton
            onClick={() => handleSendToWhatsApp(selectedStudent)}
            variant="contained"
            startIcon={<WhatsAppIcon />}
            sx={{
              backgroundColor: '#25D366',
              '&:hover': { 
                backgroundColor: '#1DA851',
                transform: 'translateY(-2px)'
              }
            }}
          >
            إرسال للواتساب
          </StyledButton>
          
          <StyledButton
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderColor: colorPalette.primary,
              color: colorPalette.primary,
              '&:hover': {
                backgroundColor: colorPalette.primaryLighter,
                borderColor: colorPalette.primaryDark,
              }
            }}
          >
            إغلاق
          </StyledButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonthlyAttendanceReport;