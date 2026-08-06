import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  alpha
} from '@mui/material';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Badge as IdIcon,
  School as LevelIcon,
  MenuBook as DiplomaIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
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

/* =================== Styled Components =================== */
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: colorPalette.primaryLighter,
  },
  '&:last-child td, &:last-child th': { border: 0 },
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

const DailyAttendanceReport = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  /* ============== Tabs ============== */
  const [selectedTab, setSelectedTab] = useState(2);
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

  /* ============== State ============== */
  const [data, setData] = useState([]);
  const [students, setStudents] = useState([]);
  const [branchName, setBranchName] = useState('جارٍ التحميل...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [diplomaFilter, setDiplomaFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');

  /* ============== Fetchers ============== */
  const fetchBranchName = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.guid) throw new Error('User GUID not found');

      const response = await fetch(`https://api3.sstli.com/api/Trainer/UserBranchForWork?userGuid=${user.guid}`);
      if (!response.ok) throw new Error('Failed to fetch branch name');
      const data = await response.json();
      setBranchName(data?.[0]?.brEName ?? 'غير محدد');
    } catch (err) {
      console.error('Error fetching branch name:', err);
      setBranchName('غير محدد');
    }
  };

  const fetchStudents = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.branchForWork) throw new Error('Branch information not found');

      const response = await fetch(`https://api1.sstli.com/api/StudentStudyInfo/by-branch/${user.branchForWork}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  const fetchUsersMap = async () => {
    try {
      const res = await fetch('https://api1.sstli.com/api/userinfo');
      if (!res.ok) throw new Error('Failed to fetch users');
      const users = await res.json();
      const map = {};
      users.forEach(u => { if (u?.guid) map[u.guid] = u.fullName || u.userName || u.guid; });
      setUsersMap(map);
      return map;
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersMap({});
      return {};
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchBranchName();
      const [studentsData, usersMapData] = await Promise.all([
        fetchStudents(),
        fetchUsersMap()
      ]);

      const response = await fetch('https://filesregsiteration.sstli.com/get_attendance.php');
      const result = await response.json();

      if (result.success && studentsData.length > 0) {
        const branchStudentIds = studentsData.map(student => student.nationalId);
        const todayData = result.data
          .filter(item =>
            item.attendance_date === dateFilter &&
            branchStudentIds.includes(item.national_id)
          )
          .map(item => ({
            ...item,
            createdByFullName: usersMapData[item.created_by] || 'غير معروف'
          }));

        setData(todayData);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  /* ============== Handlers ============== */
  const handleRefresh = () => { fetchData(); setPage(0); };
  const handleSearch = (e) => { setSearchTerm(e.target.value); setPage(0); };
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleViewDetails = (student) => { setSelectedStudent(student); setOpenDialog(true); };
  const handleCloseDialog = () => { setOpenDialog(false); setSelectedStudent(null); };
  const clearFilters = () => { setDiplomaFilter(''); setCourseFilter(''); setCreatedByFilter(''); setPage(0); };

  /* ============== Derived lists (for filters) ============== */
  const allDiplomas = useMemo(() => {
    const set = new Set(data.map(d => d.diploma_id).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const allCourses = useMemo(() => {
    const set = new Set(data.map(d => d.course).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const allCreators = useMemo(() => {
    const set = new Set(data.map(d => d.createdByFullName || usersMap[d.created_by] || 'غير معروف'));
    return Array.from(set).sort();
  }, [data, usersMap]);

  /* ============== Filtering ============== */
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const nameMatch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.national_id?.includes(searchTerm);

      const diplomaMatch = !diplomaFilter || item.diploma_id === diplomaFilter;
      const courseMatch = !courseFilter || item.course === courseFilter;

      const creatorName = item.createdByFullName || usersMap[item.created_by] || 'غير معروف';
      const createdByMatch = !createdByFilter || creatorName === createdByFilter;

      return nameMatch && diplomaMatch && courseMatch && createdByMatch;
    });
  }, [data, searchTerm, diplomaFilter, courseFilter, createdByFilter, usersMap]);

  /* ============== Grouping per student (row) ============== */
  const groupedData = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      if (!acc[item.national_id]) {
        acc[item.national_id] = {
          student: {
            name: item.name,
            national_id: item.national_id,
            level_id: item.level_id,
            diploma_id: item.diploma_id
          },
          courses: {}
        };
      }
      acc[item.national_id].courses[item.course] = {
        attendance_time: item.attendance_time,
        attendance_date: item.attendance_date,
        createdByFullName: item.createdByFullName || usersMap[item.created_by] || 'غير معروف'
      };
      return acc;
    }, {});
  }, [filteredData, usersMap]);

  const groupedDataArray = useMemo(() => Object.values(groupedData), [groupedData]);

  const getUniqueCreatorsForStudent = (coursesObj) => {
    const set = new Set(Object.values(coursesObj).map(c => c.createdByFullName || 'غير معروف'));
    return Array.from(set);
  };

  const getStudentCourses = (nationalId) => {
    return data
      .filter(item => item.national_id === nationalId && item.attendance_date === dateFilter)
      .map(item => ({
        course: item.course,
        time: item.attendance_time,
        date: item.attendance_date,
        createdByFullName: item.createdByFullName || usersMap[item.created_by] || 'غير معروف'
      }));
  };

  /* ============== Export Word ============== */
  const handleExportWord = () => {
    if (!groupedDataArray?.length) return;

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

    const uniqueStudentsCount = groupedDataArray.length;
    const totalAttendances = filteredData.length;

    const byCourseMap = {};
    filteredData.forEach((r) => {
      byCourseMap[r.course] = (byCourseMap[r.course] || 0) + 1;
    });
    const byCourseArr = Object.entries(byCourseMap).sort((a, b) => a[0].localeCompare(b[0], "ar"));

    const byCreatorMap = {};
    filteredData.forEach((r) => {
      const name = r.createdByFullName || "غير معروف";
      byCreatorMap[name] = (byCreatorMap[name] || 0) + 1;
    });
    const byCreatorArr = Object.entries(byCreatorMap).sort((a, b) => a[0].localeCompare(b[0], "ar"));

    const diplomaUniqueStudents = {};
    const diplomaTotalRecords = {};
    filteredData.forEach((r) => {
      const dip = r.diploma_id || "غير محدد";
      diplomaTotalRecords[dip] = (diplomaTotalRecords[dip] || 0) + 1;
      const key = `${dip}::${r.national_id}`;
      if (!diplomaUniqueStudents[dip]) diplomaUniqueStudents[dip] = new Set();
      diplomaUniqueStudents[dip].add(r.national_id);
    });
    const byDiplomaArr = Object.keys(diplomaTotalRecords)
      .map((dip) => [dip, diplomaUniqueStudents[dip]?.size || 0, diplomaTotalRecords[dip]])
      .sort((a, b) => a[0].localeCompare(b[0], "ar"));

    const allCoursesGlobal = Array.from(
      new Set(groupedDataArray.flatMap((r) => Object.keys(r.courses || {})))
    ).sort();

    const headerRow = new DocxRow({
      children: [
        headerCell("الاسم"),
        headerCell("رقم الهوية"),
        headerCell("المستوى"),
        headerCell("الدبلوم"),
        ...allCoursesGlobal.map((c) => headerCell(c)),
      ],
    });

    const dataRows = groupedDataArray.map(({ student, courses }, idx) => {
      const fill = idx % 2 === 0 ? "FFFFFF" : colorPalette.primaryLighter;
      const baseCells = [
        cell(student.name ?? "", fill),
        cell(student.national_id ?? "", fill),
        cell(student.level_id ?? "", fill),
        cell(student.diploma_id ?? "", fill),
      ];
      const courseCells = allCoursesGlobal.map((courseName) => {
        const c = courses[courseName];
        if (!c) return cell("—", fill);
        const by = c.createdByFullName || "غير معروف";
        const time = c.attendance_time || "";
        return cell(`حاضر • ${time} • بواسطة ${by}`, fill);
      });
      return new DocxRow({ children: [...baseCells, ...courseCells] });
    });

    const summaryRows = [
      new DocxRow({ children: [headerCell("ملخص سريع"), headerCell("القيمة")] }),
      new DocxRow({ children: [cell("إجمالي الطلاب الحاضرين (مميزين)"), cell(String(uniqueStudentsCount))] }),
      new DocxRow({ children: [cell("إجمالي سجلات الحضور"), cell(String(totalAttendances))] }),
    ];

    const byCourseRows = [
      new DocxRow({ children: [headerCell("المادة"), headerCell("عدد السجلات")] }),
      ...byCourseArr.map(([course, count]) => new DocxRow({ children: [cell(course), cell(String(count))] })),
    ];

    const byCreatorRows = [
      new DocxRow({ children: [headerCell("سجّل بواسطة"), headerCell("عدد السجلات")] }),
      ...byCreatorArr.map(([creator, count]) => new DocxRow({ children: [cell(creator), cell(String(count))] })),
    ];

    const byDiplomaRows = [
      new DocxRow({ children: [headerCell("الدبلوم"), headerCell("عدد الطلاب"), headerCell("عدد السجلات")] }),
      ...byDiplomaArr.map(([dip, uniq, total]) =>
        new DocxRow({ children: [cell(dip), cell(String(uniq)), cell(String(total))] })
      ),
    ];

    const summaryTable       = makeTable(summaryRows, 60);
    const courseStatsTable   = makeTable(byCourseRows, 60);
    const creatorStatsTable  = makeTable(byCreatorRows, 60);
    const diplomaStatsTable  = makeTable(byDiplomaRows, 80);
    const detailsTable = makeTable([headerRow, ...dataRows]);

    const doc = new Document({
      description: "تقرير الحضور اليومي",
      styles: {
        paragraphStyles: [
          {
            id: "arabic",
            name: "Arabic",
            run: { font: "Arial", rightToLeft: true },
            paragraph: { rightToLeft: true },
          },
        ],
      },
      sections: [
        {
          properties: {
            rightToLeft: true,
            page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
          },
          children: [
            new Paragraph({
              text: "تقرير الحضور اليومي",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              rightToLeft: true,
            }),
            P(`تاريخ التقرير: ${format(new Date(dateFilter), "EEEE، d MMMM yyyy", { locale: arSA })}`),
            P(`الفرع: ${branchName}`),
            P(""),

            Title("إحصائيات اليوم"),
            summaryTable,
            P(""),

            Title("توزيع الحضور حسب الدبلوم"),
            diplomaStatsTable,
            P(""),

            Title("توزيع الحضور حسب المادة"),
            courseStatsTable,
            P(""),

            Title("توزيع الحضور حسب الموظف الذي سجّل"),
            creatorStatsTable,
            P(""),

            Title("تفاصيل الحضور"),
            detailsTable,
            P(""),
            P(
              "ملاحظة: علامة (—) تعني لا يوجد تسجيل حضور لهذه المادة أو أن اسم الموظف غير متوفر.",
              { align: AlignmentType.RIGHT }
            ),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `تقرير_حضور_${format(new Date(dateFilter), "yyyy-MM-dd")}_${branchName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  /* ============== Pagination slice ============== */
  const paginatedData = useMemo(() => {
    return groupedDataArray.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [groupedDataArray, page, rowsPerPage]);

  /* ============== WhatsApp ============== */
  const handleSendToWhatsApp = async (student) => {
    if (!student) return;
    try {
      const response = await fetch(`https://api1.sstli.com/api/student/${student.national_id}`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      const studentData = await response.json();

      let whatsappNumber = null;
      if (studentData.studentTel) {
        const cleaned = studentData.studentTel.replace(/\D/g, '');
        if (cleaned.startsWith('966')) whatsappNumber = `+${cleaned}`;
        else if (cleaned.startsWith('05')) whatsappNumber = `+966${cleaned.substring(1)}`;
        else if (cleaned.startsWith('5')) whatsappNumber = `+966${cleaned}`;
      }

      const studentCourses = getStudentCourses(student.national_id);

      let message = `تقرير الحضور اليومي للطالب\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `التاريخ: ${format(new Date(dateFilter), 'EEEE، d MMMM yyyy', { locale: arSA })}\n`;
      message += `الفرع التدريبي: ${branchName}\n\n`;
      message += `معلومات الطالب\n`;
      message += `———————————————\n`;
      message += `الاسم الكامل: ${studentData.studentName || student.name}\n`;
      message += `رقم الهوية الوطنية: ${student.national_id}\n`;
      message += `المستوى التدريبي: ${student.level_id}\n`;
      message += `البرنامج / الدبلوم: ${student.diploma_id}\n\n`;
      message += `سجل الحضور التفصيلي\n`;
      message += `———————————————\n`;

      if (studentCourses.length === 0) {
        message += `لا توجد سجلات حضور لهذا اليوم.\n\n`;
      } else {
        studentCourses.forEach((c, i) => {
          message += `${i + 1}. ${c.course}\n`;
          message += `   وقت الحضور: ${c.time}\n`;
          message += `   تاريخ المادة: ${format(new Date(c.date), 'dd/MM/yyyy', { locale: arSA })}\n`;
          message += `   مسجّل بواسطة: ${c.createdByFullName}\n\n`;
        });
      }

      message += `ملخص الحضور العام\n`;
      message += `———————————————\n`;
      message += `عدد المواد الحاضرة: ${studentCourses.length}\n`;
      message += `حالة الحضور: ${studentCourses.length > 0 ? 'حاضر' : 'غير مسجل'}\n\n`;
      message += `ملاحظة: تم إعداد هذا التقرير تلقائيًا من خلال نظام إدارة الحضور.\n`;
      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
    }
  };

  /* ============== Render ============== */
  return (
    <Box sx={{ direction: 'rtl', backgroundColor: colorPalette.background, minHeight: '100vh' }}>
      <Sidebar />

      <Box component="main" sx={{
        flexGrow: 1, p: 4, marginLeft: '280px', minHeight: '100vh',
        backgroundColor: colorPalette.background, direction: 'ltr'
      }}>
        <AppBar position="static" sx={{ 
          backgroundColor: 'white', 
          direction: 'rtl', 
          color: colorPalette.textDark, 
          boxShadow: `0 2px 12px ${alpha(colorPalette.primary, 0.15)}`,
          width: '100%', 
          left: 0, 
          right: 'auto',
          borderRadius: '12px 12px 0 0'
        }}>
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

        {/* Header */}
        <Paper elevation={0} sx={{
          mb: 4, mt: 2, p: 4,
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
              <TodayIcon sx={{ fontSize: 40 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 800, 
                fontFamily: '"Cairo", sans-serif',
                mb: 1
              }}>
                التقرير اليومي للحضور
              </Typography>
              <Typography variant="h6" sx={{ 
                fontFamily: '"Cairo", sans-serif',
                opacity: 0.9,
                mb: 1
              }}>
                {format(new Date(dateFilter), 'EEEE, d MMMM yyyy', { locale: arSA })}
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
                disabled={groupedDataArray.length === 0}
                sx={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.3),
                    border: `1px solid ${alpha('#fff', 0.5)}`,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha('#fff', 0.1),
                    color: alpha('#fff', 0.5),
                  }
                }}
              >
                تصدير كملف Word
              </StyledButton>
            </Box>
          </Box>
        </Paper>

        {/* Filters */}
        <Paper elevation={0} sx={{
          mb: 4, p: 3, 
          borderRadius: '16px',
          border: `1px solid ${colorPalette.primaryLighter}`,
          backgroundColor: 'white',
          boxShadow: `0 4px 20px ${alpha(colorPalette.primary, 0.08)}`
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colorPalette.primary }}>
              <FilterIcon />
              <Typography variant="h6" sx={{ fontFamily: '"Cairo", sans-serif', fontWeight: 700 }}>
                الفلاتر
              </Typography>
            </Box>

            <TextField
              label="تاريخ الحضور"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ 
                shrink: true, 
                sx: { fontFamily: '"Cairo", sans-serif', fontWeight: 600 } 
              }}
              sx={{ 
                width: 220,
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TodayIcon sx={{ color: colorPalette.primary }} />
                  </InputAdornment>
                ),
                sx: { fontFamily: '"Cairo", sans-serif' }
              }}
            />

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

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel sx={{ 
                fontFamily: '"Cairo", sans-serif', 
                fontWeight: 600,
                color: colorPalette.textLight
              }}>
                الدبلوم
              </InputLabel>
              <Select
                value={diplomaFilter}
                label="الدبلوم"
                onChange={(e) => { setDiplomaFilter(e.target.value); setPage(0); }}
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
                <MenuItem value=""><em>الكل</em></MenuItem>
                {allDiplomas.map(d => (
                  <MenuItem key={d} value={d} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel sx={{ 
                fontFamily: '"Cairo", sans-serif', 
                fontWeight: 600,
                color: colorPalette.textLight
              }}>
                المادة
              </InputLabel>
              <Select
                value={courseFilter}
                label="المادة"
                onChange={(e) => { setCourseFilter(e.target.value); setPage(0); }}
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
                <MenuItem value=""><em>الكل</em></MenuItem>
                {allCourses.map(c => (
                  <MenuItem key={c} value={c} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 240 }}>
              <InputLabel sx={{ 
                fontFamily: '"Cairo", sans-serif', 
                fontWeight: 600,
                color: colorPalette.textLight
              }}>
                سجّل بواسطة
              </InputLabel>
              <Select
                value={createdByFilter}
                label="سجّل بواسطة"
                onChange={(e) => { setCreatedByFilter(e.target.value); setPage(0); }}
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
                <MenuItem value=""><em>الكل</em></MenuItem>
                {allCreators.map(u => (
                  <MenuItem key={u} value={u} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                    {u}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <StyledButton 
              onClick={clearFilters} 
              variant="outlined"
              sx={{
                borderColor: colorPalette.primaryLight,
                color: colorPalette.primary,
                '&:hover': {
                  borderColor: colorPalette.primary,
                  backgroundColor: colorPalette.primaryLighter,
                }
              }}
            >
              مسح الفلاتر
            </StyledButton>
          </Stack>
        </Paper>

        {/* Table */}
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
        ) : groupedDataArray.length === 0 ? (
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
              لا توجد سجلات حضور لهذا اليوم في هذا الفرع
            </Typography>
            <Typography variant="body1" sx={{ 
              fontFamily: '"Cairo", sans-serif', 
              color: colorPalette.textLight,
              opacity: 0.8
            }}>
              حاول تغيير تاريخ البحث أو الفلاتر المطبقة
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper} elevation={0} sx={{
              border: `1px solid ${colorPalette.primaryLighter}`,
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'white',
              boxShadow: `0 4px 20px ${alpha(colorPalette.primary, 0.08)}`
            }}>
              <Table sx={{ minWidth: 900 }} aria-label="attendance table">
                <TableHead sx={{ 
                  bgcolor: colorPalette.primaryLighter,
                  '& th': {
                    borderBottom: `2px solid ${colorPalette.primaryLight}`
                  }
                }}>
                  <TableRow>
                    <StyledTableCell sx={{ 
                      fontWeight: 800, 
                      textAlign: "left",
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
                      textAlign: "left",
                      color: colorPalette.textDark,
                      fontSize: '1rem'
                    }}>
                      سجّل بواسطة
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
                  {paginatedData.map(({ student, courses }) => {
                    const creators = getUniqueCreatorsForStudent(courses);
                    return (
                      <StyledTableRow key={student.national_id}>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                bgcolor: colorPalette.primary,
                                width: 40,
                                height: 40,
                                ml: 2,
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
                              {student.name}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IdIcon sx={{ 
                              mr: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.national_id}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LevelIcon sx={{ 
                              mr: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.level_id}
                            </Typography>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DiplomaIcon sx={{ 
                              mr: 1, 
                              color: colorPalette.primary 
                            }} />
                            <Typography sx={{ 
                              fontFamily: '"Cairo", sans-serif',
                              fontWeight: 600,
                              color: colorPalette.textDark
                            }}>
                              {student.diploma_id}
                            </Typography>
                          </Box>
                        </StyledTableCell>

                        <StyledTableCell>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            {creators.map((c) => (
                              <Tooltip key={c} title="الموظف الذي سجّل الحضور">
                                <Chip 
                                  label={c} 
                                  size="small" 
                                  sx={{ 
                                    fontFamily: '"Cairo", sans-serif',
                                    fontWeight: 600,
                                    backgroundColor: colorPalette.primaryLighter,
                                    color: colorPalette.primaryDark,
                                    '&:hover': {
                                      backgroundColor: colorPalette.primaryLight,
                                    }
                                  }} 
                                />
                              </Tooltip>
                            ))}
                          </Stack>
                        </StyledTableCell>

                        <StyledTableCell sx={{ textAlign: "center" }}>
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <StyledTablePagination
              component="div"
              count={groupedDataArray.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 15, 25, 50]}
              labelRowsPerPage="صفوف لكل صفحة:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count !== -1 ? count : `more than ${to}`}`}
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
              تفاصيل الحضور اليومي
            </Typography>
            <Typography variant="subtitle1" component="div" sx={{ 
              mt: 1, 
              opacity: 0.9,
              fontFamily: '"Cairo", sans-serif'
            }}>
              {selectedStudent?.name} - {format(new Date(dateFilter), 'EEEE, d MMMM yyyy', { locale: arSA })}
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
                <Grid item xs={12} md={4}>
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
                      {selectedStudent.national_id}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
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
                      {selectedStudent.level_id}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
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
                      {selectedStudent.diploma_id}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ 
                my: 3, 
                borderColor: colorPalette.primaryLighter,
                borderWidth: '2px'
              }} />

              <Typography variant="h6" sx={{
                fontFamily: '"Cairo", sans-serif',
                mb: 2,
                color: colorPalette.primaryDark,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 800
              }}>
                <TodayIcon sx={{ ml: 1 }} />
                المواد الحاضرة ({getStudentCourses(selectedStudent.national_id).length})
              </Typography>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 2,
                maxHeight: '400px',
                overflowY: 'auto',
                p: 1
              }}>
                {getStudentCourses(selectedStudent.national_id).map((course, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: `1px solid ${colorPalette.primaryLighter}`,
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      background: `linear-gradient(135deg, ${colorPalette.primaryLighter}, white)`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(colorPalette.primary, 0.15)}`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        fontWeight: 700,
                        color: colorPalette.textDark
                      }}>
                        {course.course}
                      </Typography>
                      <Chip
                        label="حاضر"
                        color="success"
                        size="small"
                        sx={{ 
                          fontFamily: '"Cairo", sans-serif', 
                          fontWeight: 700,
                          backgroundColor: colorPalette.success,
                          color: 'white'
                        }}
                      />
                    </Box>
                    <Divider sx={{ 
                      my: 1.5, 
                      borderColor: colorPalette.primaryLighter 
                    }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
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
                        {course.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        color: colorPalette.textLight,
                        fontWeight: 600
                      }}>
                        التاريخ:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        fontWeight: 700,
                        color: colorPalette.textDark
                      }}>
                        {format(new Date(course.date), 'EEEE, d MMMM yyyy', { locale: arSA })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        color: colorPalette.textLight,
                        fontWeight: 600
                      }}>
                        مسجّل بواسطة:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: '"Cairo", sans-serif', 
                        fontWeight: 700,
                        color: colorPalette.textDark
                      }}>
                        {course.createdByFullName}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
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

export default DailyAttendanceReport;