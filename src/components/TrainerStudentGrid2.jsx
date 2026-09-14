import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Card, CardContent, Chip, IconButton, List, ListItem, ListItemText, Divider,
  Tabs, Tab, Grid, Stack, Alert, AlertTitle, AppBar, Toolbar, useMediaQuery
} from '@mui/material';
import { CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FolderIcon from '@mui/icons-material/Folder';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SummarizeIcon from '@mui/icons-material/Summarize';
import WarningIcon from '@mui/icons-material/Warning';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SpecialComponent from './SpecialComponent';
import axios from 'axios';


const API_BASE = 'https://api3.sstli.com';
const PHP_BASE = 'https://filesregsiteration.sstli.com';

// تعريف اللون الأساسي
const PRIMARY_COLOR = '#80b49e';
const PRIMARY_COLOR_DARK = '#6a9a87';
const PRIMARY_COLOR_LIGHT = '#9ac8b5';

// الحد الأدنى للقسط الشهري لاعتباره مدفوع
const MINIMUM_MONTHPAY_THRESHOLD = 250;

const TrainerStudentGrid2 = () => {
  
  
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery('(max-width:599px)', { noSsr: true });
  const isTablet = useMediaQuery('(min-width:600px) and (max-width:1599px)', { noSsr: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // عدد الصفوف في كل صفحة - على جميع الشاشات
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const [rowStatuses, setRowStatuses] = useState({});
  const [rowNotes, setRowNotes] = useState({});
  const [studentHistory, setStudentHistory] = useState({});
  const [trainers, setTrainers] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const HIDDEN_NATIONAL_IDS = new Set(["112115278656567"]);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentActionRow, setCurrentActionRow] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [gridLoading, setGridLoading] = useState(false);
  const fetchSeqRef = useRef(0);
  const abortRef = useRef(null);

  const [showSpecial, setShowSpecial] = useState(false);

  // ✅ حالات/داتا كشف الحساب
  const [statements, setStatements] = useState([]);
  const [statementsLoading, setStatementsLoading] = useState(false);

  // ✅ حالات/داتا ملف التدريب
  const [trainingFile, setTrainingFile] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // معلومات الدراسة
  const [studyInfo, setStudyInfo] = useState([]);
  const [studyLoading, setStudyLoading] = useState(false);

  // ✅ كاش للاكونت جيو آي دي لكل nationalId
  const [accountGuidCache, setAccountGuidCache] = useState({});

  // ✅ حالة جديدة لتخزين آخر طلب سداد
  const [lastOrderData, setLastOrderData] = useState({});

  // ✅ حالة جديدة لتتبع تحميل التقرير
  const [exportLoading, setExportLoading] = useState(false);

  // ✅ حالة لتخزين رسالة الخطأ عند محاولة تغيير الحالة
  const [statusError, setStatusError] = useState('');

const user = JSON.parse(localStorage.getItem('user'));
const branchGuid = user?.branchForWork;
const trainerGuid = user?.trainerGuid;

const YOUSSEF_FLEIH_USER_GUID = '2be4e7a2-057c-48c0-98b5-af4881de9d1d';

const isYoussefFleih =
  String(user?.guid || '').toLowerCase() === YOUSSEF_FLEIH_USER_GUID;

  // ==================== دوال التحقق من صحة السداد ====================

  /**
   * التحقق مما إذا كان الطالب لديه طلب سداد صالح ضمن الفترة المحددة
   * @param {string} studentId - معرف الطالب
   * @returns {boolean} - true إذا كان هناك طلب سداد صالح
   */
const hasValidPaymentInPeriod = (studentId) => {
  const lastOrder = lastOrderData[studentId];

  if (!lastOrder?.data?.orderDate) return false;

  const orderDayjs = dayjs(lastOrder.data.orderDate);
  const start = fromDate.startOf('day');
  const end = toDate.endOf('day');

  return (
    (orderDayjs.isAfter(start) || orderDayjs.isSame(start)) &&
    (orderDayjs.isBefore(end) || orderDayjs.isSame(end))
  );
};

  /**
   * التحقق من أن القسط الشهري للطالب أكبر من أو يساوي الحد الأدنى
   * @param {number} monthpay - القسط الشهري
   * @returns {boolean} - true إذا كان القسط صالحاً
   */
  const isValidMonthpay = (monthpay) => {
    return Number(monthpay || 0) >= MINIMUM_MONTHPAY_THRESHOLD;
  };

  /**
   * التحقق الشامل من صحة السداد للطالب
   * @param {string} studentId - معرف الطالب
   * @param {number} monthpay - القسط الشهري
   * @returns {object} - نتيجة التحقق مع رسالة الخطأ
   */
  const validateStudentPayment = (studentId, monthpay) => {
    // التحقق من القسط الشهري
    if (!isValidMonthpay(monthpay)) {
      return {
        valid: false,
        message: `❌ القسط الشهري (${monthpay} ريال) أقل من الحد الأدنى (${MINIMUM_MONTHPAY_THRESHOLD} ريال)`
      };
    }

    // التحقق من وجود طلب سداد في الفترة
    if (!hasValidPaymentInPeriod(studentId)) {
      return {
        valid: false,
        message: `❌ لا يوجد طلب سداد للطالب في الفترة من ${fromDate.format('YYYY/MM/DD')} إلى ${toDate.format('YYYY/MM/DD')}`
      };
    }

    return { valid: true, message: '' };
  };

  // ==================== دوال حساب النسبة والعمولة المعدلة ====================

  /**
   * التحقق مما إذا كان الطالب يعتبر مسدداً وفقاً للشروط الجديدة
   * @param {object} row - بيانات الطالب
   * @returns {boolean} - true إذا كان الطالب مسدداً
   */
const isStudentPaid = (row) => {
  // الطالب يعتبر مسدد في الحسابات والعمولة بناءً على القسط الشهري فقط
  return isValidMonthpay(row.monthpay);
};

  // ✅ حساب النسبة والعمولة حسب القرار الإداري رقم 7 لسنة 2025 (معدل)
  const calculateCommission = (totalPaidAmount, totalStudents, totalPaidStudents) => {
    if (totalStudents === 0) return { percentage: 0, commission: 0, bonus: 0, totalCommission: 0, totalPaidAmount: 0 };

    const rawPercentage = (totalPaidStudents / totalStudents) * 100;
    const percentage = Math.round(rawPercentage);

    let commissionRate = 0;
    let bonus = 0;

    if (percentage < 45) {
      commissionRate = 0;
    } else if (percentage >= 45 && percentage <= 50) {
      commissionRate = 0.5;
    } else if (percentage >= 51 && percentage <= 55) {
      commissionRate = 1.5;
    } else if (percentage >= 56 && percentage <= 75) {
      commissionRate = 2;
    } else if (percentage >= 76 && percentage <= 85) {
      commissionRate = 2;
      bonus = 250;
    } else if (percentage >= 86 && percentage <= 100) {
      commissionRate = 2;
      bonus = 500;
    }

    const commission = (totalPaidAmount * commissionRate) / 100;
    const totalCommission = commission + bonus;

    return {
      percentage,
      commissionRate,
      commission,
      bonus,
      totalCommission,
      totalPaidAmount
    };
  };

  // ✅ حساب إجمالي المبالغ المدفوعة والطلاب (معدل)
  const getCommissionData = () => {
    const filteredStudents = rows.filter((row) => {
      const status = isStudentPaid(row) ? 'paid' : (rowStatuses[row.id] || '');
      if (!filterStatus) return true;
      if (filterStatus === 'none') return status === '';
      return status === filterStatus;
    });
    
    const totalStudents = filteredStudents.length;
    
    // ✅ إجمالي المبالغ المدفوعة من الطلاب المستوفين للشروط
    const totalPaidAmount = filteredStudents
      .filter(row => isStudentPaid(row))
      .reduce((sum, row) => sum + (row.monthpay || 0), 0);
    
    const totalPaidStudents = filteredStudents.filter(row => isStudentPaid(row)).length;
    
    return calculateCommission(totalPaidAmount, totalStudents, totalPaidStudents);
  };

  const commissionData = getCommissionData();

  // الحالة الفعلية المستخدمة في العرض والفلاتر:
  // أي طالب قسطه الشهري 250 ريال أو أكثر يعتبر مسدد.
  const getEffectiveRowStatus = (row) => {
    if (isStudentPaid(row)) return 'paid';
    return rowStatuses[row.id] || '';
  };

  // Helper: استنتاج accountGuid من الصف (لو متوفر مباشرة)
  const resolveAccountGuidLocal = (row) => {
    return (
      row?.accountGuid ||
      row?.studentAccountGuid ||
      row?.accountId ||
      row?.AccountGuid ||
      row?.AccountID ||
      null
    );
  };

  const getLastHistoryEntry = (studentId) => {
    const h = studentHistory?.[studentId];
    if (!Array.isArray(h) || h.length === 0) return null;

    const sorted = [...h].sort((a, b) => new Date(b.dateRecorded) - new Date(a.dateRecorded));
    return sorted[0];
  };

  const buildFollowupRows = () => {
    return filteredRows
      .map(r => {
        const isPaid = isStudentPaid(r);
        const status = isPaid ? 'paid' : (rowStatuses[r.id] || '');
        return { row: r, status };
      })
      .filter(x => x.status === 'late' || x.status === 'note')
      .map((x, idx) => {
        const row = x.row;
        const note = rowNotes[row.id] || '';
        const last = getLastHistoryEntry(row.id);

        return {
          '#': idx + 1,
          'الحالة': getStatusDisplayText(x.status),
          'اسم الطالب': row.studentName || '',
          'رقم الهوية': row.nationalId || '',
          'الجوال': row.studentTel || '',
          'البرنامج': row.diplomName || '',
          'القسط الشهري': Number(row.monthpay || 0),
          'الرصيد الحالي': Number(row.balance || 0),
          'ملاحظة المدرب': note,
          'آخر متابعة': last?.dateRecorded ? dayjs(last.dateRecorded).format('YYYY/MM/DD HH:mm') : '',
        };
      });
  };

  // ✅ تجهيز بيانات الطلاب للتصدير (معدل)
  const buildExcelRows = () => {
    const targetRows = filteredRows;

    return targetRows.map((row, index) => {
      const isPaid = isStudentPaid(row);
      const status = isPaid ? 'paid' : (rowStatuses[row.id] || '');
      const note = rowNotes[row.id] || '';
      const last = getLastHistoryEntry(row.id);

      const paidAmount = isPaid ? Number(row.monthpay || 0) : 0;

      return {
        '#': index + 1,
        'اسم الطالب': row.studentName || '',
        'رقم الهوية': row.nationalId || '',
        'الجوال': row.studentTel || '',
        'البرنامج': row.diplomName || '',
        'الفرع': row.branchName || row.branch || '',
        'القسط الشهري': Number(row.monthpay || 0),
        'الرصيد الحالي': Number(row.balance || 0),
        'الرصيد السابق': Number(row.prebalance || 0),
        'الحالة': getStatusDisplayText(status),
        'ملاحظة المدرب': note,
        'آخر تحديث حالة': last?.dateRecorded ? dayjs(last.dateRecorded).format('YYYY/MM/DD HH:mm') : '',
        'آخر مدرب حدّث': last?.trainerGuid ? getTrainerName(last.trainerGuid) : '',
        'المبلغ المدفوع': paidAmount,
'ملاحظة السداد': !isValidMonthpay(row.monthpay) ? '⚠️ القسط أقل من 250 ريال' : '',      };
    });
  };

  // ✅ شيت ملخص (معدل)
  const buildSummarySheetRows = () => {
    const totalStudents = filteredRows.length;
    const paidStudents = filteredRows.filter(r => isStudentPaid(r)).length;
    const notedStudents = filteredRows.filter(r => rowStatuses[r.id] === 'note' && !isStudentPaid(r)).length;
    const lateStudents = filteredRows.filter(r => rowStatuses[r.id] === 'late' && !isStudentPaid(r)).length;
    const noStatusStudents = totalStudents - paidStudents - notedStudents - lateStudents;

    // الطلاب المستبعدين بسبب القسط المنخفض
    const excludedDueToLowMonthpay = filteredRows.filter(r => 
      rowStatuses[r.id] === 'paid' && !isValidMonthpay(r.monthpay)
    ).length;

    const commission = getCommissionData();

    return [
      { 'البند': 'الفترة من', 'القيمة': fromDate.format('YYYY/MM/DD') },
      { 'البند': 'الفترة إلى', 'القيمة': toDate.format('YYYY/MM/DD') },
      { 'البند': 'تاريخ التقرير', 'القيمة': dayjs().format('YYYY/MM/DD HH:mm') },
      { 'البند': 'المدرب', 'القيمة': user?.fullName || '' },
      { 'البند': 'الحد الأدنى للقسط', 'القيمة': `${MINIMUM_MONTHPAY_THRESHOLD} ريال` },

      { 'البند': 'إجمالي الطلاب', 'القيمة': totalStudents },
      { 'البند': 'مسددين (مستوفين للشروط)', 'القيمة': paidStudents },
      { 'البند': 'مستبعدين (قسط أقل من 250)', 'القيمة': excludedDueToLowMonthpay },
      { 'البند': 'متابعة', 'القيمة': notedStudents },
      { 'البند': 'متأخرين', 'القيمة': lateStudents },
      { 'البند': 'بدون حالة', 'القيمة': noStatusStudents },

      { 'البند': 'نسبة السداد الفعلية', 'القيمة': `${commission.percentage}%` },
      { 'البند': 'إجمالي المدفوع (المستوفى)', 'القيمة': commission.totalPaidAmount || 0 },
      { 'البند': 'نسبة العمولة', 'القيمة': `${commission.commissionRate || 0}%` },
      { 'البند': 'العمولة الأساسية', 'القيمة': commission.commission || 0 },
      { 'البند': 'المكافأة', 'القيمة': commission.bonus || 0 },
      { 'البند': 'العمولة الإجمالية', 'القيمة': commission.totalCommission || 0 },
    ];
  };

  // ✅ تصدير Excel
  const handleExportExcelReport = () => {
    setExportLoading(true);

    try {
      const wb = XLSX.utils.book_new();

      // ✅ RTL (Safe)
      try {
        wb.Workbook = { Views: [{ RTL: true }] };
      } catch (e) {
        // تجاهل
      }

      // 1) Summary sheet
      const summaryRows = buildSummarySheetRows();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: false });
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 45 }];
      wsSummary['!views'] = [{ rightToLeft: true }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // 2) Students sheet
      const studentsRows = buildExcelRows();
      const wsStudents = XLSX.utils.json_to_sheet(studentsRows, { skipHeader: false });
      wsStudents['!cols'] = [
        { wch: 6 },   // #
        { wch: 28 },  // اسم
        { wch: 16 },  // هوية
        { wch: 14 },  // جوال
        { wch: 24 },  // برنامج
        { wch: 16 },  // فرع
        { wch: 14 },  // قسط
        { wch: 14 },  // رصيد
        { wch: 14 },  // رصيد سابق
        { wch: 12 },  // حالة
        { wch: 40 },  // ملاحظة
        { wch: 20 },  // آخر تحديث
        { wch: 22 },  // آخر مدرب
        { wch: 14 },  // مدفوع
        { wch: 30 },  // ملاحظة السداد
      ];
      wsStudents['!views'] = [{ rightToLeft: true }];
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');

      // 3) Follow-up sheet (Late + Note)
      const followRows = buildFollowupRows();
      const wsFollow = XLSX.utils.json_to_sheet(followRows, { skipHeader: false });
      wsFollow['!cols'] = [
        { wch: 6 },  // #
        { wch: 12 }, // الحالة
        { wch: 28 }, // اسم
        { wch: 16 }, // هوية
        { wch: 14 }, // جوال
        { wch: 24 }, // برنامج
        { wch: 14 }, // قسط
        { wch: 14 }, // رصيد
        { wch: 40 }, // ملاحظة
        { wch: 20 }, // آخر متابعة
      ];
      wsFollow['!views'] = [{ rightToLeft: true }];
      XLSX.utils.book_append_sheet(wb, wsFollow, 'Follow-up');

      // ✅ اسم ملف
      const fileName = `تقرير_السداد_${fromDate.format('YYYY-MM-DD')}_إلى_${toDate.format('YYYY-MM-DD')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('❌ Excel export error:', e);
    } finally {
      setExportLoading(false);
    }
  };

  // ✅ API Calls (ثابتة)
const api = {
  trainers: `https://api1.sstli.com/api/userinfo`,
  studentByNational: (nationalId) => `https://api1.sstli.com/api/student/${nationalId}`,
  statementsByAccount: (guid) => `https://api1.sstli.com/api/studentstatement/${guid}`,
  trainingFileByAccount: (guid) => `https://api1.sstli.com/api/trainingfile/${guid}`,
  studyInfoByAccount: (guid) => `https://api1.sstli.com/api/studyinfo/${guid}`,

  studentList: (branch, trainer, fromD, toD) =>
    `${API_BASE}/api/Trainer/StudentList?branchGuid=${branch}&trainerGuid=${trainer}&fromDate=${fromD}&toDate=${toD}`,

  mainMonthlyCommission: (allowYear, allowMonth) =>
    `${API_BASE}/api/Trainer/MainMonthlyCommission?allowYear=${allowYear}&allowMonth=${allowMonth}`,

  statuses: (branch, trainer) =>
    `${PHP_BASE}/getStatusesAndNotes.php?branchGuid=${branch}&trainerGuid=${trainer}`,

  updateStatusNote: `${PHP_BASE}/updateStatusAndNote.php`,

  studentHistory: (nationalId) =>
    `${PHP_BASE}/getStudentHistory.php?nationalId=${nationalId}`,

  lastOrderPay: (accountGuid) => 
    `https://api3.sstli.com/api/Trainer/LastOrderPay?accountGuid=${accountGuid}`,
};

  // ✅ دالة جديدة لجلب آخر طلب سداد
  const fetchLastOrderPay = async (accountGuid, studentId) => {
    if (!accountGuid) return;
    
    try {
      const response = await fetch(api.lastOrderPay(accountGuid));
      if (!response.ok) {
        console.warn(`❌ Failed to fetch last order for ${studentId}`);
        setLastOrderData(prev => ({
          ...prev,
          [studentId]: {
            success: false,
            message: 'فشل في جلب البيانات'
          }
        }));
        return;
      }
      
      const result = await response.json();
      
      setLastOrderData(prev => ({
        ...prev,
        [studentId]: result
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching last order for ${studentId}:`, error);
      setLastOrderData(prev => ({
        ...prev,
        [studentId]: {
          success: false,
          message: 'حدث خطأ في جلب البيانات'
        }
      }));
    }
  };

  // Fetch trainers data
  const fetchTrainers = async () => {
    try {
      const response = await fetch(api.trainers);
      const trainersData = await response.json();
      const trainersMap = {};
      trainersData.forEach((trainer) => {
        if (trainer.trainerGuid) {
          trainersMap[trainer.trainerGuid] = trainer.fullName;
        }
      });
      setTrainers(trainersMap);
    } catch (error) {
      console.error('❌ Failed to fetch trainers:', error);
    }
  };

  // Fetch student history (PHP)
  const fetchStudentHistory = async (nationalId) => {
    try {
      const response = await fetch(api.studentHistory(nationalId));
      const history = await response.json();
      return history || [];
    } catch (error) {
      console.error('Error fetching student history:', error);
      return [];
    }
  };

  // ✅ فلترة الطلاب: كل nationalId مرة واحدة فقط
  const uniqueByNationalId = (arr) => {
    const map = new Map();
    for (const item of arr || []) {
      const key = String(item?.nationalId ?? item?.id ?? '');
      if (!key) continue;

      const prev = map.get(key);
      if (!prev) {
        map.set(key, item);
      } else {
        const prevScore = Number(prev.monthpay || 0) + Number(prev.balance || 0);
        const curScore  = Number(item.monthpay || 0) + Number(item.balance || 0);
        if (curScore > prevScore) map.set(key, item);
      }
    }
    return Array.from(map.values());
  };
const getCommissionYearMonth = () => {
  // شهر العمولة = شهر بداية الفترة
  // من 15/05 إلى 14/06 => عمولة شهر 5
  // من 15/06 إلى 14/07 => عمولة شهر 6
  return {
    allowYear: Number(fromDate.year()),
    allowMonth: Number(fromDate.month() + 1),
  };
};
  // Fetch student data + statuses/notes
const fetchData = async () => {
  setGridLoading(true);

  if (abortRef.current) abortRef.current.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  const seq = ++fetchSeqRef.current;

  const { allowYear, allowMonth } = getCommissionYearMonth();

  const url = isYoussefFleih
    ? api.mainMonthlyCommission(allowYear, allowMonth)
    : api.studentList(
        branchGuid,
        trainerGuid,
        fromDate.format('YYYY-MM-DD'),
        toDate.format('YYYY-MM-DD')
      );

  const statusUrl = api.statuses(branchGuid, trainerGuid);

  try {
    const [res, statusRes] = await Promise.all([
      fetch(url, { signal: controller.signal }),
      fetch(statusUrl, { signal: controller.signal }),
    ]);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`❌ Failed student list: ${res.status} ${res.statusText}\n${errorText}`);
    }

    if (!statusRes.ok) {
      const errorText = await statusRes.text();
      throw new Error(`❌ Failed statuses: ${statusRes.status} ${statusRes.statusText}\n${errorText}`);
    }

    const data = await res.json();
    const statusesData = await statusRes.json();

    if (seq !== fetchSeqRef.current) return;

    let rawStudents = [];

    // ==============================
    // ✅ حالة يوسف فليح
    // Endpoint: MainMonthlyCommission
    // ==============================
    if (isYoussefFleih) {
      rawStudents = (data?.data || []).map((item) => {
        const nationalId = String(
          item?.رقم_الهوية ||
          item?.nationalId ||
          item?.NationalId ||
          ''
        );

        const totalPaid = Number(
          item?.إجمالي_المدفوع ??
          item?.totalPaid ??
          item?.monthpay ??
          0
        );

        const studentName =
          item?.اسم_الطالب ||
          item?.studentName ||
          item?.StudentName ||
          '';

        const studentTel =
          item?.الجوال ||
          item?.studentTel ||
          item?.StudentTel ||
          '';

        const studentGuid =
          item?.StudentGuid ||
          item?.studentGuid ||
          item?.['Student Guid'] ||
          item?.studentGuid ||
          null;

        const accountGuid =
          item?.StudentGuid ||
          item?.studentGuid ||
          item?.['Student Guid'] ||
          item?.accountGuid ||
          null;

        return {
          ...item,

          id: nationalId || studentGuid || crypto.randomUUID(),

          studentName,
          nationalId,
          studentTel,

          accountGuid,
          studentGuid,

          // مهم جدًا:
          // هنخلي monthpay = إجمالي المدفوع المختار من البروسيجر
          // عشان نفس حسابات العمولة الحالية عندك تشتغل بدون ما نغير كل الصفحة
          monthpay: totalPaid,

          balance: Number(item?.balance || 0),
          prebalance: Number(item?.prebalance || 0),

          commission: Number(
            item?.عمولة_2_بالمية ??
            item?.commission ??
            0
          ),

          paymentStatusText:
            item?.حالة_السداد ||
            item?.paymentStatus ||
            '',

          reportType:
            item?.نوع_التقرير ||
            item?.reportType ||
            '',

          branchGuid:
            item?.BranchGuid ||
            item?.branchGuid ||
            item?.['BranchGuid'] ||
            branchGuid,

          trainerGuid:
            item?.TrainerGuid ||
            item?.trainerGuid ||
            item?.['Trainer Guid'] ||
            trainerGuid,
        };
      });
    } else {
      // ==============================
      // ✅ الحالة العادية لكل المستخدمين
      // Endpoint: StudentList
      // ==============================
      rawStudents = data?.data || [];
    }

    const uniqueMap = new Map();

    rawStudents.forEach((item) => {
      const key = String(item?.nationalId ?? item?.id ?? '');
      if (!key) return;
      if (HIDDEN_NATIONAL_IDS.has(key)) return;

      const prev = uniqueMap.get(key);

      if (!prev) {
        uniqueMap.set(key, item);
      } else {
        const prevMonthpay = Number(prev.monthpay || 0);
        const curMonthpay = Number(item.monthpay || 0);
        const prevBalance = Number(prev.balance || 0);
        const curBalance = Number(item.balance || 0);

        if (curMonthpay > prevMonthpay || (curMonthpay === prevMonthpay && curBalance > prevBalance)) {
          uniqueMap.set(key, item);
        }
      }
    });

    const rowsWithId = Array.from(uniqueMap.values()).map((item) => ({
      ...item,
      id: item.id || item.nationalId,
      balance: Number(item.balance || 0),
      prebalance: Number(item.prebalance || 0),
      monthpay: Number(item.monthpay || 0),
      commission: Number(item.commission || 0),
    }));

    const updatedStatuses = {};
    const updatedNotes = {};
    const updatedHistory = {};

    rowsWithId.forEach((row) => {
      const history = statusesData[row.id];
      updatedHistory[row.id] = history || [];

      // ✅ يوسف فليح:
      // الحالة جاية من البروسيجر نفسها: دافع / غير دافع
      if (isYoussefFleih) {
        if (row.paymentStatusText === 'دافع' || Number(row.monthpay || 0) > 0) {
          updatedStatuses[row.id] = 'paid';
        } else {
          updatedStatuses[row.id] = '';
        }

        updatedNotes[row.id] = row.reportType || '';
        return;
      }

      // ✅ باقي المستخدمين نفس المنطق القديم
      if (Array.isArray(history) && history.length > 0) {
        const filtered = history.filter((entry) => {
          const entryDate = dayjs(entry.dateRecorded).startOf('day');
          return (
            entryDate.isSame(fromDate, 'day') ||
            entryDate.isSame(toDate, 'day') ||
            (entryDate.isAfter(fromDate) && entryDate.isBefore(toDate))
          );
        });

        if (filtered.length > 0) {
          const latest = filtered[filtered.length - 1];
          updatedStatuses[row.id] = latest.status || '';
          updatedNotes[row.id] = latest.note || '';
        } else {
          updatedStatuses[row.id] = '';
          updatedNotes[row.id] = '';
        }
      } else {
        updatedStatuses[row.id] = '';
        updatedNotes[row.id] = '';
      }
    });

    setRows(rowsWithId);
    setRowStatuses(updatedStatuses);
    setRowNotes(updatedNotes);
    setStudentHistory(updatedHistory);

  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.error('💥 fetchData error:', err);
  } finally {
    if (seq === fetchSeqRef.current) setGridLoading(false);
  }
};
  const updateStatusAndNoteOnServer = async (id, status, note = '') => {
    const body = {
      studentId: id,
      status,
      note,
      branchGuid,
      trainerGuid,
    };

    try {
      await fetch(api.updateStatusNote, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Refresh data after update
      fetchData();
    } catch (error) {
      console.error('Failed to update status/note:', error);
    }
  };

  // ✅ دالة معالجة تغيير الحالة (معدلة)
const handleStatusChange = async (id, status) => {
  setStatusError('');

  const row = rows.find((r) => r.id === id);

  // ✅ لو اختار "تم السداد"
  if (status === 'paid') {
    const validation = validateStudentPayment(id, row?.monthpay);

    if (!validation.valid) {
      setStatusError(validation.message);
      return;
    }
  }

  // ✅ لو اختار "لديه طلب سداد"
  if (status === 'has_order') {
    if (!hasValidPaymentInPeriod(id)) {
      setStatusError(
        `❌ لا يوجد طلب سداد للطالب في الفترة من ${fromDate.format('YYYY/MM/DD')} إلى ${toDate.format('YYYY/MM/DD')}`
      );
      return;
    }
  }

  const updated = { ...rowStatuses, [id]: status };
  setRowStatuses(updated);
  await updateStatusAndNoteOnServer(id, status, rowNotes[id] || '');
};

  const handleNoteSave = async () => {
    if (!noteInput.trim()) return;

    const updatedNotes = { ...rowNotes, [currentActionRow.id]: noteInput };
    setRowNotes(updatedNotes);
    await updateStatusAndNoteOnServer(
      currentActionRow.id,
      rowStatuses[currentActionRow.id] || 'note',
      noteInput
    );
    setNoteInput('');
  };

  // =============== ✅ الجزء المهم: جلب accountGuid ثم كشف الحساب والملف التدريبي ===============

  // يحسم الـ accountGuid: من الصف لو موجود، وإلا يجيبه من /api/student/{nationalId} ويكاشّه
  const getOrFetchAccountGuid = async (row) => {
    const local = resolveAccountGuidLocal(row);
    if (local) return local;

    const nationalId =
      row?.nationalId ||
      row?.id ||
      row?.NationalId ||
      row?.NID ||
      null;

    if (!nationalId) {
      console.warn('⚠️ لا يوجد nationalId في الصف لاستخراج accountGuid');
      return null;
    }

    if (accountGuidCache[nationalId]) {
      return accountGuidCache[nationalId];
    }

    try {
      const resp = await axios.get(api.studentByNational(nationalId));
      const guid = resp?.data?.accountGuid || null;
      if (guid) {
        setAccountGuidCache((prev) => ({ ...prev, [nationalId]: guid }));
      }
      return guid;
    } catch (e) {
      console.error('❌ فشل في جلب student للحصول على accountGuid:', e);
      return null;
    }
  };

  // ✅ كشف الحساب
  const fetchStatements = async (accountGuid) => {
    if (!accountGuid) {
      setStatements([]);
      return;
    }
    setStatementsLoading(true);
    try {
      const response = await axios.get(api.statementsByAccount(accountGuid));
      setStatements(response.data || []);
    } catch (error) {
      console.error('Error fetching statement', error);
      setStatements([]);
    } finally {
      setStatementsLoading(false);
    }
  };

  // ✅ الملف التدريبي
  const fetchTrainingFile = async (accountGuid) => {
    if (!accountGuid) {
      setTrainingFile([]);
      return;
    }
    setTrainingLoading(true);
    try {
      const resp = await axios.get(`https://api1.sstli.com/api/studyinfo/${accountGuid}`);
      setTrainingFile(resp?.data || []);
    } catch (error) {
      console.error('Error fetching training file', error);
      setTrainingFile([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  // معلومات الدراسة
  const fetchStudyInfo = async (accountGuid) => {
    if (!accountGuid) {
      setStudyInfo([]);
      return;
    }
    setStudyLoading(true);
    try {
      const resp = await axios.get(api.studyInfoByAccount(accountGuid));
      setStudyInfo(resp?.data || []);
    } catch (error) {
      console.error('Error fetching study info', error);
      setStudyInfo([]);
    } finally {
      setStudyLoading(false);
    }
  };

  // فتح الديلوج + جلب البيانات
  const handleOpenActionDialog = async (row) => {
    setCurrentActionRow(row);
    setNoteInput(rowNotes[row.id] || '');
    setCurrentTab(0);
    setStatusError(''); // إعادة تعيين رسالة الخطأ

    const completeHistory = await fetchStudentHistory(row.id);
    setStudentHistory((prev) => ({
      ...prev,
      [row.id]: completeHistory,
    }));

    const accountGuid = await getOrFetchAccountGuid(row);

    await fetchLastOrderPay(accountGuid, row.id);

    await Promise.allSettled([
      fetchStatements(accountGuid),
      fetchTrainingFile(accountGuid),
      fetchStudyInfo(accountGuid),
    ]);

    setActionDialogOpen(true);
  };

  const handleWhatsAppClick = (phoneNumber) => {
    if (!phoneNumber) return;
    
    const cleanNumber = phoneNumber.toString().replace(/[\s\-\(\)\+]/g, '');
    const rawNumber = cleanNumber.replace(/^0/, '');
    const whatsappNumber = rawNumber.startsWith('966') ? rawNumber : `966${rawNumber}`;
    
    const message = `🔔 تذكير بسداد القسط الشهري

عزيزي الطالب/ ${currentActionRow?.studentName || ''}، 
نذكركم بسداد القسط الشهري المستحق في أقرب وقت ممكن لتجنب أي تأخير في متابعة البرنامج التدريبي.

نتمنى لكم التوفيق والنجاح في مسيرتكم التدريبية، ونتطلع دوماً لدعمكم وتحقيق أهدافكم.

*المعهد السعودي للتدريب*

شكراً لتفهمكم وتعاونكم`;
    
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

const getStatusDisplayText = (status) => {
  switch (status) {
    case 'paid':
      return 'تم السداد';
    case 'has_order':
      return 'لديه طلب سداد';
    case 'note':
      return 'متابعة';
    case 'late':
      return 'متأخر';
    default:
      return 'لم يتم السداد';
  }
};

  const getTrainerName = (trainerGuid) => {
    return trainers[trainerGuid] || 'غير معروف';
  };

  // ✅ الحصول على لون النسبة حسب القرار الإداري
  const getPercentageColor = (percentage) => {
    if (percentage < 45) return '#f44336';
    if (percentage >= 45 && percentage <= 50) return '#ff9800';
    if (percentage >= 51 && percentage <= 55) return '#4caf50';
    if (percentage >= 56 && percentage <= 75) return '#2196f3';
    if (percentage >= 76 && percentage <= 85) return '#9c27b0';
    if (percentage >= 86 && percentage <= 100) return '#ff5722';
    return '#757575';
  };

  // ✅ الحصول على نص تفصيلي للعمولة
  const getCommissionDescription = () => {
    const { percentage, commissionRate, bonus } = commissionData;
    
    if (percentage < 45) {
      return 'لا توجد عمولة - النسبة أقل من 45%';
    } else if (percentage >= 45 && percentage <= 50) {
      return `عمولة ${commissionRate}% - النسبة بين 45% إلى 50%`;
    } else if (percentage >= 51 && percentage <= 55) {
      return `عمولة ${commissionRate}% - النسبة بين 51% إلى 55%`;
    } else if (percentage >= 56 && percentage <= 75) {
      return `عمولة ${commissionRate}% - النسبة بين 56% إلى 75%`;
    } else if (percentage >= 76 && percentage <= 85) {
      return `عمولة ${commissionRate}% + مكافأة ${bonus} ريال - النسبة بين 76% إلى 85%`;
    } else if (percentage >= 86 && percentage <= 100) {
      return `عمولة ${commissionRate}% + مكافأة ${bonus} ريال - النسبة بين 86% إلى 100%`;
    }
    return '';
  };

  // ✅ الحصول على تفاصيل القرار الإداري
  const getCommissionPolicyDetails = () => {
    return [
      { range: 'أقل من 45%', commission: 'لا عمولة', color: '#f44336', icon: '❌', min: 0, max: 44 },
      { range: '45% - 50%', commission: '0.5% عمولة', color: '#ff9800', icon: '📊', min: 45, max: 50 },
      { range: '51% - 55%', commission: '1.5% عمولة', color: '#4caf50', icon: '📈', min: 51, max: 55 },
      { range: '56% - 75%', commission: '2% عمولة', color: '#2196f3', icon: '💰', min: 56, max: 75 },
      { range: '76% - 85%', commission: '2% + 500﷼', color: '#9c27b0', icon: '🎯', min: 76, max: 85 },
      { range: '86% - 100%', commission: '2% + 1000﷼', color: '#ff5722', icon: '🏆', min: 86, max: 100 }
    ];
  };

  // =============== ✅ دالة تصدير التقرير الجديدة ===============
  const generateReportHTML = () => {
    // حساب الإحصائيات
    const totalStudents = rows.length;
    const paidStudents = rows.filter(row => isStudentPaid(row)).length;
    const notedStudents = rows.filter(row => rowStatuses[row.id] === 'note' && !isStudentPaid(row)).length;
    const lateStudents = rows.filter(row => rowStatuses[row.id] === 'late' && !isStudentPaid(row)).length;
    const noStatusStudents = totalStudents - paidStudents - notedStudents - lateStudents;

    // الطلاب المستبعدين بسبب القسط المنخفض
    const excludedDueToLowMonthpay = rows.filter(r => 
      rowStatuses[r.id] === 'paid' && !isValidMonthpay(r.monthpay)
    ).length;

    // إجمالي المبالغ
    const totalPaidAmount = rows
      .filter(row => isStudentPaid(row))
      .reduce((sum, row) => sum + (row.monthpay || 0), 0);
    
    const totalPotentialAmount = rows
      .reduce((sum, row) => sum + (row.monthpay || 0), 0);

    // بيانات العمولة
    const commissionData = getCommissionData();

    // إنشاء HTML
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير السداد - ${fromDate.format('YYYY/MM/DD')} إلى ${toDate.format('YYYY/MM/DD')}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif;
          }
          
          body {
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            padding: 20px;
          }
          
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .report-header {
            background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_COLOR_DARK} 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .report-header::before {
            content: "";
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.3;
          }
          
          .report-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          
          .report-subtitle {
            font-size: 18px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .report-info {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          .info-item {
            text-align: center;
          }
          
          .info-label {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 5px;
          }
          
          .info-value {
            font-size: 18px;
            font-weight: 600;
          }
          
          .section {
            padding: 30px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 22px;
            color: ${PRIMARY_COLOR};
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-title i {
            font-size: 24px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            text-align: center;
            transition: transform 0.3s ease;
            border: 2px solid transparent;
          }
          
          .stat-card:hover {
            transform: translateY(-5px);
          }
          
          .stat-card.paid {
            border-color: #4caf50;
            background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%);
          }
          
          .stat-card.note {
            border-color: #ff9800;
            background: linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%);
          }
          
          .stat-card.late {
            border-color: #f44336;
            background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
          }
          
          .stat-card.none {
            border-color: #9e9e9e;
            background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
          }
          
          .stat-card.total {
            border-color: ${PRIMARY_COLOR};
            background: linear-gradient(135deg, #f0f9f6 0%, #e8f5f0 100%);
          }
          
          .stat-card.excluded {
            border-color: #ff6b6b;
            background: linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%);
          }
          
          .stat-icon {
            font-size: 32px;
            margin-bottom: 15px;
          }
          
          .stat-number {
            font-size: 32px;
            font-weight: 700;
            margin: 10px 0;
          }
          
          .stat-label {
            font-size: 16px;
            color: #64748b;
          }
          
          .amount-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          .amount-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          
          .amount-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .amount-icon {
            font-size: 24px;
            color: ${PRIMARY_COLOR};
          }
          
          .amount-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .amount-value {
            font-size: 28px;
            font-weight: 700;
            text-align: center;
            margin: 10px 0;
          }
          
          .students-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          }
          
          .students-table th {
            background: ${PRIMARY_COLOR_LIGHT};
            color: #1e293b;
            padding: 15px;
            text-align: center;
            font-weight: 600;
            border-bottom: 2px solid ${PRIMARY_COLOR};
          }
          
          .students-table td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .students-table tr:hover {
            background-color: #f8fafc;
          }
          
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .status-paid {
            background-color: #dcfce7;
            color: #166534;
          }
          
          .status-note {
            background-color: #fef9c3;
            color: #854d0e;
          }
          
          .status-late {
            background-color: #fee2e2;
            color: #991b1b;
          }
          
          .status-none {
            background-color: #f1f5f9;
            color: #475569;
          }
          
          .excluded-badge {
            background-color: #fff3cd;
            color: #856404;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 12px;
            display: inline-block;
            margin-top: 5px;
          }
          
          .commission-section {
            background: linear-gradient(135deg, #f0f9f6 0%, #e8f5f0 100%);
            border-radius: 15px;
            padding: 25px;
            margin-top: 20px;
          }
          
          .commission-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          
          .commission-item {
            background: white;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
          }
          
          .commission-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
          }
          
          .commission-value {
            font-size: 20px;
            font-weight: 700;
            color: ${PRIMARY_COLOR};
          }
          
          .policy-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          
          .policy-item {
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            color: white;
            font-weight: 500;
          }
          
          .policy-range {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .policy-commission {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .report-footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
            margin-top: 30px;
          }
          
          .print-button {
            display: inline-block;
            background: ${PRIMARY_COLOR};
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .print-button:hover {
            background: ${PRIMARY_COLOR_DARK};
            transform: translateY(-2px);
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .print-button {
              display: none;
            }
            
            .report-container {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Header -->
          <div class="report-header">
            <h1 class="report-title">تقرير متابعة السداد</h1>
            <p class="report-subtitle">المعهد السعودي للتدريب - تطبيق القرار الإداري رقم 7 لسنة 2025</p>
            
            <div class="report-info">
              <div class="info-item">
                <div class="info-label">الفترة من</div>
                <div class="info-value">${fromDate.format('YYYY/MM/DD')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الفترة إلى</div>
                <div class="info-value">${toDate.format('YYYY/MM/DD')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاريخ التقرير</div>
                <div class="info-value">${dayjs().format('YYYY/MM/DD HH:mm')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">المدرب</div>
                <div class="info-value">${user?.fullName || 'غير محدد'}</div>
              </div>
            </div>
          </div>
          
          <!-- الملخص التنفيذي -->
          <div class="section">
            <h2 class="section-title">📊 الملخص التنفيذي</h2>
            
            <div class="stats-grid">
              <div class="stat-card total">
                <div class="stat-icon">👥</div>
                <div class="stat-number">${totalStudents}</div>
                <div class="stat-label">إجمالي الطلاب</div>
              </div>
              
              <div class="stat-card paid">
                <div class="stat-icon">✅</div>
                <div class="stat-number">${paidStudents}</div>
                <div class="stat-label">مسددين (مستوفين للشروط)</div>
                <div class="stat-percentage">${totalStudents > 0 ? Math.round((paidStudents/totalStudents)*100) : 0}%</div>
              </div>
              
              <div class="stat-card excluded">
                <div class="stat-icon">⚠️</div>
                <div class="stat-number">${excludedDueToLowMonthpay}</div>
                <div class="stat-label">مستبعدين (قسط أقل من ${MINIMUM_MONTHPAY_THRESHOLD} ريال)</div>
              </div>
              
              <div class="stat-card note">
                <div class="stat-icon">📝</div>
                <div class="stat-number">${notedStudents}</div>
                <div class="stat-label">متابعة</div>
                <div class="stat-percentage">${totalStudents > 0 ? Math.round((notedStudents/totalStudents)*100) : 0}%</div>
              </div>
              
              <div class="stat-card late">
                <div class="stat-icon">⏰</div>
                <div class="stat-number">${lateStudents}</div>
                <div class="stat-label">متأخرين</div>
                <div class="stat-percentage">${totalStudents > 0 ? Math.round((lateStudents/totalStudents)*100) : 0}%</div>
              </div>
              
              <div class="stat-card none">
                <div class="stat-icon">📭</div>
                <div class="stat-number">${noStatusStudents}</div>
                <div class="stat-label">بدون حالة</div>
                <div class="stat-percentage">${totalStudents > 0 ? Math.round((noStatusStudents/totalStudents)*100) : 0}%</div>
              </div>
            </div>
            
            <div class="amount-grid">
              <div class="amount-card">
                <div class="amount-header">
                  <span class="amount-icon">💰</span>
                  <h3 class="amount-title">إجمالي المبالغ المدفوعة (المستوفية للشروط)</h3>
                </div>
                <div class="amount-value" style="color: #4caf50;">${totalPaidAmount.toLocaleString('ar-EG')} ر.س</div>
                <p style="text-align: center; color: #64748b; margin-top: 10px;">من إجمالي ${totalPotentialAmount.toLocaleString('ar-EG')} ر.س</p>
              </div>
            </div>
            
           <div style="background: #fff3cd; border: 1px solid #ffeeba; border-radius: 10px; padding: 15px; margin-top: 20px;">
  <p style="color: #856404; margin: 0; font-weight: 500;">
    ⚠️ ملاحظة: يتم احتساب المسددين في النسبة والعمولة بناءً على القسط الشهري فقط، ولا يتم احتساب من يقل قسطه الشهري عن ${MINIMUM_MONTHPAY_THRESHOLD} ريال
  </p>
  <p style="color: #856404; margin: 8px 0 0 0; font-weight: 500;">
    🔎 آخر طلب السداد يُستخدم فقط عند محاولة تغيير الحالة يدويًا إلى "تم السداد" للتحقق من وجود طلب سداد داخل الفترة
  </p>
</div>
          </div>
          
          <!-- حساب العمولة -->
          <div class="section">
            <h2 class="section-title">💰 حساب العمولة</h2>
            
            <div class="commission-section">
              <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="color: ${PRIMARY_COLOR}; font-size: 24px; margin-bottom: 10px;">نسبة السداد الفعلية: ${commissionData.percentage}%</h3>
                <p style="color: #64748b; font-size: 16px;">${getCommissionDescription()}</p>
              </div>
              
              <div class="commission-grid">
                <div class="commission-item">
                  <div class="commission-label">نسبة العمولة</div>
                  <div class="commission-value">${commissionData.commissionRate}%</div>
                </div>
                
                <div class="commission-item">
                  <div class="commission-label">إجمالي المدفوع (المستوفى)</div>
                  <div class="commission-value">${commissionData.totalPaidAmount?.toLocaleString('ar-EG')} ر.س</div>
                </div>
                
                <div class="commission-item">
                  <div class="commission-label">العمولة الأساسية</div>
                  <div class="commission-value">${commissionData.commission?.toLocaleString('ar-EG') || '0'} ر.س</div>
                </div>
                
                <div class="commission-item">
                  <div class="commission-label">المكافأة</div>
                  <div class="commission-value">${commissionData.bonus?.toLocaleString('ar-EG') || '0'} ر.س</div>
                </div>
                
                <div class="commission-item" style="background: ${PRIMARY_COLOR_LIGHT};">
                  <div class="commission-label" style="color: ${PRIMARY_COLOR};">العمولة الإجمالية</div>
                  <div class="commission-value" style="color: ${PRIMARY_COLOR_DARK}; font-size: 24px;">${commissionData.totalCommission.toLocaleString('ar-EG')} ر.س</div>
                </div>
              </div>
            </div>
            
            <h3 style="color: ${PRIMARY_COLOR}; margin: 30px 0 15px 0;">سياسة العمولة حسب القرار الإداري</h3>
            
            <div class="policy-grid">
              ${getCommissionPolicyDetails().map(item => `
                <div class="policy-item" style="background: ${item.color}; border: ${commissionData.percentage >= item.min && commissionData.percentage <= item.max ? '3px solid gold' : 'none'};">
                  <div class="policy-range">${item.range}</div>
                  <div class="policy-commission">${item.commission}</div>
                  ${commissionData.percentage >= item.min && commissionData.percentage <= item.max ? '<div style="margin-top: 5px; font-size: 12px; color: gold;">✅ النسبة الحالية</div>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- قائمة الطلاب -->
          <div class="section">
            <h2 class="section-title">👥 تفاصيل الطلاب</h2>
            
            <table class="students-table">
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>رقم الهوية</th>
                  <th>الجوال</th>
                  <th>القسط الشهري</th>
                  <th>الرصيد</th>
                  <th>الحالة</th>
                  <th>المبلغ المدفوع</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => {
                  const isPaid = isStudentPaid(row);
                  const status = isPaid ? 'paid' : (rowStatuses[row.id] || '');
                  const paidAmount = isPaid ? row.monthpay || 0 : 0;
                  const statusText = getStatusDisplayText(status);
                  const statusClass = `status-${status || 'none'}`;
                  const isValid = isValidMonthpay(row.monthpay);
                  const hasOrder = hasValidPaymentInPeriod(row.id);
                  
                  let paymentNote = '';
                  if (status === 'paid' && !isValid) {
                    paymentNote = '⚠️ قسط أقل من 250 ريال';
                  } else if (status === 'paid' && !hasOrder) {
                    paymentNote = '⚠️ لا يوجد طلب سداد في الفترة';
                  }
                  
                  return `
                    <tr>
                      <td>${row.studentName || '-'}</td>
                      <td>${row.nationalId || '-'}</td>
                      <td>${row.studentTel || '-'}</td>
                      <td>${(row.monthpay || 0).toLocaleString('ar-EG')} ر.س</td>
                      <td>${(row.balance || 0).toLocaleString('ar-EG')} ر.س</td>
                      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                      <td style="font-weight: ${paidAmount > 0 ? '600' : '400'}; color: ${paidAmount > 0 ? '#4caf50' : '#64748b'}">
                        ${paidAmount > 0 ? paidAmount.toLocaleString('ar-EG') + ' ر.س' : '-'}
                      </td>
                      <td>${paymentNote ? `<span class="excluded-badge">${paymentNote}</span>` : '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- الملاحظات والتوصيات -->
          <div class="section">
            <h2 class="section-title">📋 الملاحظات والتوصيات</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-top: 15px;">
              <h3 style="color: ${PRIMARY_COLOR}; margin-bottom: 15px;">التوصيات:</h3>
              <ul style="padding-right: 20px; color: #475569;">
                ${lateStudents > 0 ? `<li>يوجد ${lateStudents} طالب متأخر يحتاجون إلى متابعة عاجلة</li>` : ''}
                ${notedStudents > 0 ? `<li>يوجد ${notedStudents} طالب تحت المتابعة تحتاج إلى متابعة مستمرة</li>` : ''}
                ${noStatusStudents > 0 ? `<li>يوجد ${noStatusStudents} طالب بدون حالة تحتاج إلى تحديث</li>` : ''}
                ${excludedDueToLowMonthpay > 0 ? `<li>يوجد ${excludedDueToLowMonthpay} طالب مستبعد من العمولة بسبب انخفاض القسط الشهري</li>` : ''}
                ${commissionData.percentage < 45 ? `<li>نسبة السداد أقل من 45% - تحتاج إلى تحسين الأداء</li>` : ''}
                ${commissionData.percentage >= 76 ? `<li>ممتاز! نسبة السداد ${commissionData.percentage}% - حافظ على هذا الأداء</li>` : ''}
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام المعهد السعودي للتدريب</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
            <button class="print-button" onclick="window.print()">🖨️ طباعة التقرير</button>
          </div>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach((card, index) => {
              card.style.animationDelay = (index * 0.1) + 's';
            });
            
            const printButton = document.querySelector('.print-button');
            if (printButton) {
              printButton.addEventListener('click', function() {
                window.print();
              });
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  // ✅ دالة تصدير التقرير
  const handleExportReport = () => {
    setExportLoading(true);
    
    try {
      const htmlContent = generateReportHTML();
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير_السداد_${fromDate.format('YYYY-MM-DD')}_إلى_${toDate.format('YYYY-MM-DD')}.html`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('❌ خطأ في تصدير التقرير:', error);
      setExportLoading(false);
    }
  };

  // ✅ دالة عرض التقرير في نافذة جديدة
  const handlePreviewReport = () => {
    try {
      const htmlContent = generateReportHTML();
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
    } catch (error) {
      console.error('❌ خطأ في عرض التقرير:', error);
    }
  };


  // ✅ HTML بسيط مخصص لتصدير PDF بدون عمود الملاحظات
  const generateSimplePdfHTML = () => {
    const targetRows = filteredRows;
    const totalStudents = targetRows.length;
    const paidStudents = targetRows.filter((row) => isStudentPaid(row)).length;
    const notedStudents = targetRows.filter((row) => rowStatuses[row.id] === 'note' && !isStudentPaid(row)).length;
    const lateStudents = targetRows.filter((row) => rowStatuses[row.id] === 'late' && !isStudentPaid(row)).length;
    const commission = getCommissionData();

    const printedUserName = user?.userName || 'غير محدد';
    const printedPersonName =
      user?.fullName ||
      user?.name ||
      getTrainerName(trainerGuid) ||
      'غير محدد';

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>تقرير PDF بسيط</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
            font-family: 'Cairo', Arial, sans-serif;
          }

          body {
            margin: 0;
            color: #1f2937;
            background: #fff;
            direction: rtl;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .pdf-page {
            width: 100%;
          }

          .pdf-header {
            border: 1px solid #d9e8e1;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #f3fbf7 0%, #ffffff 100%);
          }

          .pdf-title {
            margin: 0 0 8px;
            text-align: center;
            color: ${PRIMARY_COLOR_DARK};
            font-size: 22px;
            font-weight: 700;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 10px;
          }

          .meta-item,
          .summary-item {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 8px 10px;
            background: #fff;
            min-height: 54px;
          }

          .label {
            display: block;
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 3px;
          }

          .value {
            display: block;
            color: #111827;
            font-size: 13px;
            font-weight: 700;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }

          .summary-item {
            text-align: center;
          }

          .summary-item .value {
            font-size: 16px;
            color: ${PRIMARY_COLOR_DARK};
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10.5px;
          }

          thead {
            display: table-header-group;
          }

          th {
            background: ${PRIMARY_COLOR_LIGHT};
            color: #111827;
            border: 1px solid #9bbfad;
            padding: 7px 5px;
            font-weight: 700;
            text-align: center;
          }

          td {
            border: 1px solid #e5e7eb;
            padding: 6px 5px;
            text-align: center;
            vertical-align: middle;
            word-break: break-word;
          }

          tbody tr:nth-child(even) {
            background: #f9fafb;
          }

          .status-badge {
            display: inline-block;
            min-width: 64px;
            padding: 3px 8px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 10px;
          }

          .status-paid { background: #dcfce7; color: #166534; }
          .status-has_order { background: #dbeafe; color: #1d4ed8; }
          .status-note { background: #fef3c7; color: #92400e; }
          .status-late { background: #fee2e2; color: #991b1b; }
          .status-none { background: #f3f4f6; color: #4b5563; }

          .footer {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            color: #6b7280;
            font-size: 10px;
          }

          .no-print {
            text-align: center;
            margin: 14px 0;
          }

          .print-btn {
            border: none;
            background: ${PRIMARY_COLOR};
            color: #fff;
            padding: 10px 22px;
            border-radius: 999px;
            cursor: pointer;
            font-weight: 700;
          }

          @media print {
            .no-print { display: none; }
            .pdf-header { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-page">
          <div class="pdf-header">
            <h1 class="pdf-title">تقرير متابعة السداد</h1>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="label">اسم المستخدم</span>
                <span class="value">${printedUserName}</span>
              </div>
              <div class="meta-item">
                <span class="label">اسم المدرب / الموظف</span>
                <span class="value">${printedPersonName}</span>
              </div>
              <div class="meta-item">
                <span class="label">الفترة</span>
                <span class="value">من ${fromDate.format('YYYY/MM/DD')} إلى ${toDate.format('YYYY/MM/DD')}</span>
              </div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-item"><span class="label">إجمالي الطلاب</span><span class="value">${totalStudents}</span></div>
            <div class="summary-item"><span class="label">مسددين</span><span class="value">${paidStudents}</span></div>
            <div class="summary-item"><span class="label">متابعة</span><span class="value">${notedStudents}</span></div>
            <div class="summary-item"><span class="label">متأخرين</span><span class="value">${lateStudents}</span></div>
            <div class="summary-item"><span class="label">نسبة السداد</span><span class="value">${commission.percentage || 0}%</span></div>
            <div class="summary-item"><span class="label">إجمالي العمولة</span><span class="value">${Number(commission.totalCommission || 0).toLocaleString('ar-EG')} ر.س</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 18%;">اسم الطالب</th>
                <th style="width: 11%;">رقم الهوية</th>
                <th style="width: 11%;">الجوال</th>
                <th style="width: 18%;">البرنامج</th>
                <th style="width: 12%;">الفرع</th>
                <th style="width: 8%;">القسط</th>
                <th style="width: 8%;">الرصيد</th>
                <th style="width: 10%;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${targetRows.map((row, index) => {
                const isPaid = isStudentPaid(row);
                const status = isPaid ? 'paid' : (rowStatuses[row.id] || '');
                const statusText = getStatusDisplayText(status);
                const statusClass = `status-${status || 'none'}`;

                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${row.studentName || '-'}</td>
                    <td>${row.nationalId || '-'}</td>
                    <td>${row.studentTel || '-'}</td>
                    <td>${row.diplomName || '-'}</td>
                    <td>${row.branchName || row.branch || '-'}</td>
                    <td>${Number(row.monthpay || 0).toLocaleString('ar-EG')}</td>
                    <td>${Number(row.balance || 0).toLocaleString('ar-EG')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <span>تم إنشاء التقرير تلقائيًا بواسطة نظام المعهد السعودي للتدريب</span>
          </div>

          <div class="no-print">
            <button class="print-btn" onclick="window.print()">حفظ / طباعة PDF</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // ✅ تصدير PDF بسيط بدون عمود الملاحظات
  const handleExportSimplePdf = () => {
    setExportLoading(true);

    try {
      const htmlContent = generateSimplePdfHTML();
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');

      if (!printWindow) {
        setExportLoading(false);
        alert('برجاء السماح بفتح النوافذ المنبثقة حتى يتم تصدير ملف PDF');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        setExportLoading(false);
      }, 600);
    } catch (error) {
      console.error('❌ خطأ في تصدير PDF:', error);
      setExportLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('userJop:', user?.userJop, typeof user?.userJop);
    if ([0, 1, 2, 3, 9].includes(Number(user?.userJop))) setShowSpecial(true);
  }, []);

  useEffect(() => {
    fetchTrainers();
    fetchData();
    // eslint-disable-next-line
  }, [fromDate, toDate]);

  // فلترة الحالة باستخدام نفس الحالة الفعلية الظاهرة للمستخدم
  const filteredRows = rows.filter((row) => {
    const status = getEffectiveRowStatus(row);

    if (!filterStatus) return true;
    if (filterStatus === 'none') return status === '';
    return status === filterStatus;
  });

  // Statistics
  const totalStudents = filteredRows.length;
  const paidStudents = filteredRows.filter((row) => isStudentPaid(row)).length;
  const notedStudents = filteredRows.filter((row) => rowStatuses[row.id] === 'note' && !isStudentPaid(row)).length;
  const lateStudents = filteredRows.filter((row) => rowStatuses[row.id] === 'late' && !isStudentPaid(row)).length;

  const getCompactStudentName = (fullName) => {
    const parts = String(fullName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length <= 2) return parts.join(' ');
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const columns = [
    {
      field: 'studentName',
      headerName: 'اسم الطالب',
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ color: PRIMARY_COLOR, display: isPhone ? 'none' : 'inline-flex', fontSize: 18 }} />
          <Typography
            variant="body2"
            fontWeight="600"
            title={params.value || ''}
            sx={{
              fontSize: isDesktop
                ? undefined
                : isPhone
                  ? "0.75rem"
                  : { sm: "0.75rem", md: "0.75rem" },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {isPhone
              ? (getCompactStudentName(params.value) || '-')
              : (params.value || '-')}
          </Typography>
          {/* أيقونة تحذير إذا كان القسط أقل من 250 */}
          {!isValidMonthpay(params.row.monthpay) && rowStatuses[params.id] === 'paid' && (
            <Tooltip title="القسط الشهري أقل من 250 ريال - لا يعتبر مسدداً في العمولة" arrow>
              <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: 'nationalId',
      headerName: 'رقم الهوية',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'studentTel',
      headerName: 'الجوال',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'balance',
      headerName: 'الرصيد الحالي',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon fontSize="small" color={params.value > 0 ? 'error' : 'success'} />
          <Typography variant="body2" fontWeight="600" color={params.value > 0 ? 'error' : 'success'}>
            {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
          </Typography>
        </Box>
      ),
    },
    {
      field: 'monthpay',
      headerName: 'القسط الشهري ',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AttachMoneyIcon sx={{ color: isValidMonthpay(params.value) ? '#2196f3' : '#ff9800', display: isPhone ? 'none' : 'inline-flex', fontSize: 18 }} />
          <Typography variant="body2" fontWeight="600" color={isValidMonthpay(params.value) ? 'info.main' : 'warning.main'}>
            {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
          </Typography>
          {!isValidMonthpay(params.value) && (
            <Tooltip title="القسط الشهري أقل من 250 ريال - لا يعتبر مسدداً في العمولة" arrow>
              <InfoIcon sx={{ color: '#ff9800', fontSize: 14 }} />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 150,
      renderCell: (params) => {
        const isPaid = isStudentPaid(params.row);
        const status = isPaid ? 'paid' : (rowStatuses[params.id] || '');
        const note = rowNotes[params.id] || '';

        const getStatusChip = () => {
          if (status === 'paid') {
            return (
              <Box>
                <Chip label="مسدد" sx={{ backgroundColor: '#4caf50', color: 'white' }} size="small" />
                {!isValidMonthpay(params.row.monthpay) && (
                  <Tooltip title="القسط أقل من 250 - لا يدخل في العمولة" arrow>
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 14, ml: 0.5 }} />
                  </Tooltip>
                )}
              </Box>
            );
         } else if (status === 'has_order') {
  return (
    <Chip
      label="لديه طلب سداد"
      sx={{ backgroundColor: '#2196f3', color: 'white' }}
      size="small"
    />
  );
} else if (status === 'note') {
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Chip label="متابعة" sx={{ backgroundColor: '#ff9800', color: 'white' }} size="small" />
      {note && (
        <Tooltip title={note} arrow>
          <InfoIcon sx={{ color: '#ff9800', cursor: 'pointer' }} fontSize="small" />
        </Tooltip>
      )}
    </Box>
  );
} else if (status === 'late') {
  return <Chip label="متأخر" sx={{ backgroundColor: '#f44336', color: 'white' }} size="small" />;
}
          return <Chip label="لم يتم السداد" variant="outlined" size="small" />;
        };

        return getStatusChip();
      },
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleOpenActionDialog(params.row)}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: PRIMARY_COLOR_LIGHT,
              borderColor: PRIMARY_COLOR,
            }
          }}
        >
          <MoreVertIcon sx={{ fontSize: isDesktop ? 20 : { xs: 15, sm: 17, md: 18 } }} />
        </IconButton>
      ),
    },
  ];

  // ============================================================
  // أعمدة مختصرة للموبايل والتابلت فقط.
  // الديسكتوب يستمر باستخدام جميع الأعمدة الأصلية بدون أي تغيير.
  // ============================================================
  const compactColumnFields = isPhone
    ? ['studentName', 'studentTel', 'monthpay', 'status', 'actions']
    : ['studentName', 'studentTel', 'balance', 'monthpay', 'status', 'actions'];

  const responsiveColumns = isDesktop
    ? columns
    : columns
        .filter((column) => compactColumnFields.includes(column.field))
        .map((column) => {
          if (isPhone) {
            const phoneWidths = {
              studentName: 104,
              studentTel: 88,
              monthpay: 64,
              status: 62,
              actions: 38,
            };

            return {
              ...column,
              flex: undefined,
              minWidth: undefined,
              width: phoneWidths[column.field] || 70,
              headerClassName: 'mobile-grid-header',
            };
          }

          const tabletWidths = {
            studentName: 150,
            studentTel: 125,
            balance: 105,
            monthpay: 105,
            status: 100,
            actions: 58,
          };

          return {
            ...column,
            flex: column.field === 'studentName' ? 1 : undefined,
            minWidth: column.field === 'studentName' ? 140 : undefined,
            width: column.field === 'studentName' ? undefined : (tabletWidths[column.field] || 100),
          };
        });

  // تابع لتغيير التبويبات
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // تعريف التبويبات
  const tabs = [
    { label: 'المعلومات الرئيسية', icon: <PersonIcon /> },
    { label: ' الفواتير', icon: <ReceiptIcon /> },
    { label: 'الملف التدريبي', icon: <FolderIcon /> },
    { label: 'آخر طلب سداد', icon: <PendingActionsIcon /> },
    { label: 'سجل المتابعات', icon: <HistoryIcon /> },
  ];

  return showSpecial ? (
    <SpecialComponent onBack={() => setShowSpecial(false)} />
  ) : (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Sidebar */}
        {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1401,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(14px)',
            color: '#17372b',
            borderBottom: '1px solid rgba(5,117,70,0.12)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)",
              },
              px: { xs: 0.8, sm: 1.2, md: 1.6 },
              gap: 0.8,
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={mobileSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                flexShrink: 0,
                color: '#fff',
                background: 'linear-gradient(135deg, #057546, #034d31)',
                boxShadow: '0 6px 16px rgba(5,117,70,0.22)',
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22, md: 23 } }} />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isDesktop ? 3 : {
              xs: 0.35,
              sm: 0.65,
              md: 0.9
            },
            pt: isDesktop ? 3 : {
              xs: "var(--app-header-height, 56px)",
              sm: "var(--app-header-height, 56px)",
              md: "var(--app-header-height, 56px)"
            },
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'all 0.3s ease',
            '& .MuiTypography-h4': {
              fontSize: isDesktop ? undefined : {
                xs: '0.9rem',
                sm: '1.05rem',
                md: '1.2rem'
              },
              lineHeight: 1.25
            },
            '& .MuiTypography-h5': {
              fontSize: isDesktop ? undefined : {
                xs: '0.78rem',
                sm: '0.92rem',
                md: '1.05rem'
              },
              lineHeight: 1.3
            },
            '& .MuiTypography-h6': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: '0.84rem'
              },
              lineHeight: 1.35
            },
            '& .MuiTypography-body1, & .MuiTypography-body2': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              lineHeight: 1.45
            },
            '& .MuiButton-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              minHeight: isDesktop ? undefined : {
                xs: 25,
                sm: 28,
                md: 31
              }
            },
            '& .MuiChip-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              },
              height: isDesktop ? undefined : {
                xs: 19,
                sm: 22,
                md: 24
              }
            },
            '& .MuiInputBase-root, & .MuiInputLabel-root': {
              fontSize: isDesktop ? undefined : {
                xs: "0.75rem",
                sm: "0.75rem",
                md: "0.75rem"
              }
            },
            ...navigationContentSx
          }}
        >
          {/* Header Section */}
          <Card sx={{ mb: isDesktop ? 3 : { xs: 0.6, sm: 0.9, md: 1.2 }, boxShadow: 3, borderRadius: isDesktop ? 2 : 1.5 }}>
            <CardContent sx={{ p: isDesktop ? 2 : { xs: 0.7, sm: 1, md: 1.4 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={isDesktop ? "center" : "flex-start"}
                flexDirection={isDesktop ? "row" : { xs: "column", sm: "row" }}
                gap={isDesktop ? 0 : { xs: 0.65, sm: 1 }}
                mb={isDesktop ? 2 : { xs: 0.7, sm: 1 }}
              >
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{
                      color: PRIMARY_COLOR,
                      mb: isDesktop ? undefined : 0.15,
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: '0.86rem', md: '0.98rem' },
                    }}
                  >
                    قائمة الطلاب
                  </Typography>
                  {!isPhone && (
                    <Typography variant="body2" color="text.secondary">
                      إدارة ومتابعة طلاب المدرب - تطبيق القرار الإداري رقم 7 لسنة 2025
                    </Typography>
                  )}
                </Box>
                
                {/* ✅ زر تصدير التقرير */}
                <Box
                  sx={{
                    display: isDesktop ? 'flex' : 'grid',
                    gridTemplateColumns: isDesktop ? undefined : 'repeat(3, minmax(0, 1fr))',
                    gap: isDesktop ? 2 : { xs: 0.35, sm: 0.55, md: 0.7 },
                    width: isDesktop ? 'auto' : { xs: '100%', sm: '100%', md: 'auto' },

                    '& .MuiButton-root': {
                      minWidth: 0,
                      px: isDesktop ? undefined : { xs: 0.35, sm: 0.7, md: 1 },
                      py: isDesktop ? undefined : { xs: 0.45, sm: 0.55, md: 0.7 },
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiButton-startIcon': {
                      mr: isDesktop ? undefined : { xs: 0.25, sm: 0.4 },
                      ml: isDesktop ? undefined : 0,
                    },
                    '& .MuiButton-startIcon .MuiSvgIcon-root': {
                      fontSize: isDesktop ? undefined : { xs: 14, sm: 16, md: 18 },
                    },
                  }}
                >
                  <Tooltip title="عرض التقرير في نافذة جديدة">
                    <Button
                      variant="outlined"
                      startIcon={<SummarizeIcon />}
                      onClick={handlePreviewReport}
                      sx={uiLayout.withUiSx({
                        borderColor: PRIMARY_COLOR,
                        color: PRIMARY_COLOR,
                        '&:hover': {
                          borderColor: PRIMARY_COLOR_DARK,
                          backgroundColor: PRIMARY_COLOR_LIGHT + '20',
                        }
                      }, uiLayout.buttonSx)}
                    >
                      عرض التقرير
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="تحميل التقرير  PDF ">
                    <Button
                      variant="contained"
                      startIcon={exportLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PictureAsPdfIcon />}
                      onClick={handleExportSimplePdf}
                      disabled={exportLoading}
                      sx={uiLayout.withUiSx({
                        backgroundColor: '#d32f2f',
                        px: 3,
                        '&:hover': { backgroundColor: '#b71c1c' }
                      }, uiLayout.buttonSx)}
                    >
                      {exportLoading ? 'جاري التصدير...' : 'تصدير PDF'}
                    </Button>
                  </Tooltip>

                  <Tooltip title="تحميل التقرير بصيغة Excel">
                    <Button
                      variant="contained"
                      startIcon={exportLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <DownloadIcon />}
                      onClick={handleExportExcelReport}
                      disabled={exportLoading}
                      sx={uiLayout.withUiSx({
                        backgroundColor: PRIMARY_COLOR,
                        px: 3,
                        '&:hover': { backgroundColor: PRIMARY_COLOR_DARK }
                      }, uiLayout.buttonSx)}
                    >
                      {exportLoading ? 'جاري التصدير...' : 'تصدير Excel'}
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              {/* Statistics Cards */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop
                    ? 'repeat(6, minmax(150px, 1fr))'
                    : 'repeat(2, minmax(0, 1fr))',
                  gap: isDesktop ? 2 : { xs: 0.3, sm: 0.5, md: 0.7 },
                  mb: isDesktop ? 3 : { xs: 0.5, sm: 0.75, md: 1 },
                  '& > .MuiCard-root': {
                    minHeight: isDesktop ? undefined : { xs: 82, sm: 92, md: 100 },
                    borderRadius: isDesktop ? undefined : { xs: 1.4, sm: 1.7 },
                    boxShadow: isDesktop ? undefined : '0 4px 12px rgba(15,23,42,0.12)',
                  },
                  '& .MuiCardContent-root': {
                    display: isDesktop ? undefined : 'flex',
                    flexDirection: isDesktop ? undefined : 'column',
                    alignItems: isDesktop ? undefined : 'center',
                    justifyContent: isDesktop ? undefined : 'center',
                  },
                  '& .MuiTypography-h4': {
                    fontSize: isDesktop ? undefined : { xs: '0.92rem', sm: '1.05rem', md: '1.16rem' },
                    lineHeight: 1.05,
                  },
                  '& .MuiTypography-body2': {
                    fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                    lineHeight: 1.25,
                  },
                }}
              >
                <Card sx={{ flex: 1, minWidth: isDesktop ? 150 : 0, bgcolor: PRIMARY_COLOR, color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.48, sm: 0.68, md: 0.9 } }}>
                    <Typography variant="h4" fontWeight="bold">{totalStudents}</Typography>
                    <Typography variant="body2">إجمالي الطلاب</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: isDesktop ? 150 : 0, bgcolor: '#4caf50', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.48, sm: 0.68, md: 0.9 } }}>
                    <Typography variant="h4" fontWeight="bold">{paidStudents}</Typography>
                    <Typography variant="body2">مسددين (مستوفين للشروط)</Typography>
                  </CardContent>
                </Card>
                {isDesktop && (
                  <Card sx={{ flex: 1, minWidth: 150, bgcolor: '#ff9800', color: 'white' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight="bold">{notedStudents}</Typography>
                      <Typography variant="body2">متابعة</Typography>
                    </CardContent>
                  </Card>
                )}
                {isDesktop && (
                  <Card sx={{ flex: 1, minWidth: 150, bgcolor: '#f44336', color: 'white' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight="bold">{lateStudents}</Typography>
                      <Typography variant="body2">متأخرين</Typography>
                    </CardContent>
                  </Card>
                )}
                
                {/* ✅ كارد النسبة والعمولة */}
                <Card sx={{ 
                  flex: 1,
                  minWidth: isDesktop ? 200 : 0, 
                  bgcolor: getPercentageColor(commissionData.percentage),
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${getPercentageColor(commissionData.percentage)} 0%, ${getPercentageColor(commissionData.percentage)}99 100%)`
                }}>
                  <CardContent sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.48, sm: 0.68, md: 0.9 }, position: 'relative', zIndex: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <TrendingUpIcon />
                      <Typography variant="h4" fontWeight="bold">
                        {commissionData.percentage}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      نسبة السداد الفعلية
                    </Typography>
                    {isDesktop && (
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', opacity: 0.8 }}>
                        {getCommissionDescription()}
                      </Typography>
                    )}
                  </CardContent>
                  {isDesktop && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        opacity: 0.1,
                        transform: 'rotate(45deg)'
                      }}
                    >
                      <EmojiEventsIcon sx={{ fontSize: 80 }} />
                    </Box>
                  )}
                </Card>

                {/* ✅ كارد العمولة الإجمالية */}
                <Card sx={{ 
                  flex: 1,
                  minWidth: isDesktop ? 200 : 0, 
                  bgcolor: '#9c27b0', 
                  color: 'white',
                  background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: isDesktop ? 2 : { xs: 0.48, sm: 0.68, md: 0.9 } }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <AttachMoneyIcon />
                      <Typography variant="h4" fontWeight="bold">
                        {commissionData.totalCommission.toLocaleString('ar-EG')} ر.س
                      </Typography>
                    </Box>
                    <Typography variant="body2">العمولة الإجمالية</Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', opacity: 0.9 }}>
                      إجمالي المدفوع: {commissionData.totalPaidAmount?.toLocaleString('ar-EG')} ر.س
                    </Typography>
                    
                    {commissionData.bonus > 0 && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', opacity: 0.9 }}>
                        (مكافأة: {commissionData.bonus} ر.س)
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', opacity: 0.9 }}>
                      (نسبة العمولة: {commissionData.commissionRate}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* ✅ شرح مختصر على الموبايل/التابلت، والكارد الكامل للديسكتوب */}
              {isDesktop ? (
              <Card sx={{ 
                mb: 2, 
                bgcolor: '#e3f2fd', 
                border: '2px solid #90caf9',
                borderRadius: 2
              }}>
                <CardContent sx={{ py: 2, px: 3 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <InfoIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                    <Box>
                     <Typography variant="h6" sx={{ color: '#0d47a1', fontWeight: 'bold', mb: 0.5 }}>
  آلية احتساب الطالب كمسدد في النسبة والعمولة
</Typography>
<Typography variant="body2" sx={{ color: '#0d47a1' }}>
  1. يتم احتساب الطالب كمسدد في الإحصائيات والعمولة بناءً على القسط الشهري فقط
</Typography>
<Typography variant="body2" sx={{ color: '#0d47a1' }}>
  2. إذا كان القسط الشهري للطالب {MINIMUM_MONTHPAY_THRESHOLD} ريال أو أكثر، يتم احتسابه ضمن المسددين أما إذا كان أقل من ذلك لا يتم احتسابه لا من النسبة ولا من اجمالي العمولة
</Typography>
<Typography variant="body2" sx={{ color: '#0d47a1', mt: 0.5 }}>
🔵 تم إضافة حالة جديدة باسم "لديه طلب سداد" — عند وجود طلب سداد للطالب داخل الفترة المحددة يمكن اختيارها، مما يعني أن الطالب لديه طلب سداد بالفعل ولا يلزم التواصل معه حالياً.</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              ) : (
                <Alert
                  severity="info"
                  sx={{
                    mb: { xs: 0.6, sm: 0.8 },
                    py: 0.15,
                    px: { xs: 0.45, sm: 0.7 },
                    borderRadius: 1.5,
                    '& .MuiAlert-icon': { fontSize: { xs: 16, sm: 18 }, py: 0.3 },
                    '& .MuiAlert-message': { py: 0.35, minWidth: 0 },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      lineHeight: 1.3,
                    }}
                  >
                    المسدد: قسط {MINIMUM_MONTHPAY_THRESHOLD} ريال أو أكثر
                  </Typography>
                </Alert>
              )}

              {/* Filters Section */}
              <Box
                sx={uiLayout.withUiSx({
                  display: 'grid',
                  gridTemplateColumns: isDesktop
                    ? 'repeat(4, max-content)'
                    : isPhone
                      ? 'repeat(2, minmax(0, 1fr))'
                      : 'repeat(4, minmax(0, 1fr))',
                  gap: isDesktop ? 2 : { xs: 0.35, sm: 0.55, md: 0.75 },
                  alignItems: 'center',
                  width: '100%',

                  '& .MuiTextField-root, & .MuiFormControl-root': {
                    width: '100%',
                  },
                  '& .MuiInputBase-root': {
                    minHeight: isDesktop ? undefined : { xs: 34, sm: 38, md: 40 },
                  },
                  '& .MuiButton-root': {
                    width: isDesktop ? 'auto' : '100%',
                    minHeight: isDesktop ? undefined : { xs: 32, sm: 36, md: 38 },
                  },
                }, uiLayout.filterBarSx)}
              >
                <DatePicker
                  label="من تاريخ"
                  value={fromDate}
                  onChange={setFromDate}
                  sx={{ minWidth: isDesktop ? 150 : 0, width: '100%' }}
                />
                <DatePicker
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={setToDate}
                  sx={{ minWidth: isDesktop ? 150 : 0, width: '100%' }}
                />
                <FormControl
                  sx={uiLayout.withUiSx({
                    minWidth: isDesktop ? 180 : 0,
                    width: '100%',
                    gridColumn: isPhone ? '1 / -1' : 'auto',
                  }, uiLayout.formFieldSx)}
                >
                  <InputLabel id="filter-status-label">فلترة حسب الحالة</InputLabel>
                    <Select
  labelId="filter-status-label"
  value={filterStatus}
  label="فلترة حسب الحالة"
  onChange={(e) => {
    setFilterStatus(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }}
>
  <MenuItem value="">الكل</MenuItem>
  <MenuItem value="paid">تم السداد</MenuItem>
  <MenuItem value="has_order">لديه طلب سداد</MenuItem>
  <MenuItem value="note">متابعة</MenuItem>
  <MenuItem value="late">متأخر</MenuItem>
  <MenuItem value="none">بدون</MenuItem>
</Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={fetchData} 
                  sx={uiLayout.withUiSx({
                    px: isDesktop ? 3 : { xs: 0.8, sm: 1.2 },
                    gridColumn: isPhone ? '1 / -1' : 'auto',
                    backgroundColor: PRIMARY_COLOR,
                    '&:hover': {
                      backgroundColor: PRIMARY_COLOR_DARK,
                    }
                  }, uiLayout.buttonSx)}
                >
                  تحديث البيانات
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* ✅ الملاحظة: كاملة للديسكتوب، مختصرة للموبايل/التابلت */}
          {isDesktop ? (
          <Card sx={{ 
            mb: 2, 
            bgcolor: '#fff3e0', 
            border: '2px solid #ff9800',
            borderRadius: 2
          }}>
            <CardContent sx={{ py: 2, px: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <InfoIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold', mb: 0.5 }}>
                    ملاحظة هامة
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bf360c' }}>
                    🔔 يرجى مراجعة تبويب "الإجراءات - آخر طلب سداد" قبل التواصل مع الطالب - إذا كان هناك طلب سداد معلق في الفترة الزمنية المخصصة للتواصل فلا داعي للاتصال به
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          ) : (
            <Alert
              severity="warning"
              sx={{
                mb: { xs: 0.55, sm: 0.8 },
                py: 0.1,
                px: { xs: 0.4, sm: 0.65 },
                borderRadius: 1.5,
                '& .MuiAlert-icon': { fontSize: { xs: 16, sm: 18 }, py: 0.3 },
                '& .MuiAlert-message': { py: 0.35 },
              }}
            >
              <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" }, fontWeight: 700 }}>
                راجع «آخر طلب سداد» قبل التواصل مع الطالب.
              </Typography>
            </Alert>
          )}

          {/* Data Grid Section */}
          <Card
            sx={{
              boxShadow: isDesktop ? 3 : 1,
              borderRadius: isDesktop ? 2 : 1.2,
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={uiLayout.withUiSx({ height: isDesktop ? 720 : { xs: '68dvh', sm: '72dvh', md: '74dvh' }, width: '100%', minWidth: 0 }, uiLayout.tableContainerSx)}>
                <DataGrid
                  rows={gridLoading ? [] : filteredRows}
                  columns={responsiveColumns}
                  loading={gridLoading}
                  disableRowSelectionOnClick
                  disableColumnMenu={!isDesktop}
                  disableColumnFilter={!isDesktop}
                  rowHeight={isDesktop ? 52 : isPhone ? 38 : 44}
                  columnHeaderHeight={isDesktop ? 56 : isPhone ? 36 : 42}
                  density={isDesktop ? 'standard' : 'compact'}
                  hideFooterSelectedRowCount
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[30, 60, 100]}
                  localeText={{
                    MuiTablePagination: {
                      labelRowsPerPage: 'عدد الصفوف:',
                    },
                  }}
                 getRowClassName={(params) => {
  const row = params.row;
  const id = params.id;

  const isPaid = isStudentPaid(row);
  if (isPaid) return 'row-paid';

  const s = rowStatuses[id] || '';
  if (s === 'has_order') return 'row-has-order';
  if (s === 'note') return 'row-note';
  if (s === 'late') return 'row-late';
  return '';
}}
                  slots={{
                    loadingOverlay: () => (
                      <Box
                        sx={{
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    '& .MuiDataGrid-main': {
                      minWidth: 0,
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      overflowX: "auto",
                    },

                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 2,
                          p: 3
                        }}
                      >
                        <CircularProgress size={46} thickness={4} sx={{ color: PRIMARY_COLOR }} />
                        <Typography sx={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}>
                          جاري تحميل بيانات الفترة المختارة...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          (طلاب + حالات + ملاحظات)
                        </Typography>
                      </Box>
                    ),
                    noRowsOverlay: () => (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {gridLoading ? 'جاري التحميل...' : 'لا توجد بيانات'}
                        </Typography>
                      </Box>
                    ),
                  }}
                  sx={uiLayout.withUiSx({
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 500,
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      px: isDesktop ? undefined : { xs: 0.18, sm: 0.45 },
                      lineHeight: 1.25,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                      fontWeight: 800,
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      textAlign: 'center',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      px: isDesktop ? undefined : { xs: 0.2, sm: 0.45 },
                    },
                    '& .MuiDataGrid-footerContainer': {
                      minHeight: isDesktop ? undefined : { xs: 42, sm: 44 },
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem" },
                      px: isDesktop ? undefined : { xs: 0.3, sm: 0.6 },
                    },
                    '& .MuiTablePagination-root': {
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem" },
                      overflow: 'visible',
                    },
                    '& .MuiTablePagination-toolbar': {
                      minHeight: isDesktop ? undefined : { xs: 40, sm: 42 },
                      px: isDesktop ? undefined : { xs: 0.2, sm: 0.5 },
                      gap: isDesktop ? undefined : { xs: 0.2, sm: 0.4 },
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem" },
                      m: 0,
                    },
                    '& .MuiTablePagination-select': {
                      fontSize: isDesktop ? undefined : { xs: "0.75rem", sm: "0.75rem" },
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: PRIMARY_COLOR_LIGHT,
                      borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    },
                  '& .row-paid': {
  backgroundColor: 'rgba(76, 175, 80, 0.12)',
},
'& .row-has-order': {
  backgroundColor: 'rgba(33, 150, 243, 0.12)',
},
'& .row-note': {
  backgroundColor: 'rgba(255, 152, 0, 0.12)',
},
'& .row-late': {
  backgroundColor: 'rgba(244, 67, 54, 0.12)',
},
                    '& .MuiDataGrid-row:hover': {
                      filter: 'brightness(0.98)',
                    },
                  }, uiLayout.dataGridSx)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Action Dialog */}
          <Dialog
            open={actionDialogOpen}
            onClose={() => setActionDialogOpen(false)}
            maxWidth="lg"
            fullWidth
            fullScreen={isPhone}
            sx={uiLayout.withUiSx({

              '& .MuiDialog-container': {
                alignItems: isPhone ? 'stretch' : 'center',
                justifyContent: 'center',
                p: isPhone ? 0 : { sm: 1, md: 1.5 },
              },

              '& .MuiDialog-paper': {
                width: isDesktop
                  ? undefined
                  : isPhone
                    ? '100vw'
                    : { sm: '94vw', md: '92vw' },

                maxWidth: isDesktop
                  ? undefined
                  : isPhone
                    ? '100vw'
                    : { sm: '760px', md: '1050px' },

                height: isPhone ? '100dvh' : 'auto',
                maxHeight: isDesktop ? '90vh' : isPhone ? '100dvh' : '92dvh',

                m: isPhone ? 0 : { sm: 1, md: 1.5 },

                borderRadius: isDesktop
                  ? 3
                  : isPhone
                    ? 0
                    : { sm: 2, md: 2.5 },

                overflow: 'hidden',
                direction: "rtl",
                boxSizing: 'border-box',
              },
            }, uiLayout.dialogLayoutSx)}
          >
            <DialogTitle
              sx={{
                bgcolor: PRIMARY_COLOR,
                color: 'white',
                py: isDesktop ? 3 : { xs: 0.55, sm: 0.75, md: 0.95 },
                px: isDesktop ? 3 : { xs: 0.75, sm: 1.05, md: 1.5 },
                textAlign: 'center',
                fontSize: isDesktop ? '1.5rem' : { xs: "0.75rem", sm: '0.78rem', md: '0.9rem' },
                lineHeight: 1.35,
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={isDesktop ? 2 : { xs: 0.35, sm: 0.5, md: 0.7 }}
                sx={{ minWidth: 0 }}
              >
                <PersonIcon
                  sx={{
                    fontSize: isDesktop ? 34 : { xs: 15, sm: 18, md: 20 },
                    flexShrink: 0,
                  }}
                />

                <Box
                  component="span"
                  sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: isPhone ? 'normal' : 'nowrap',
                  }}
                >
                  إجراءات الطالب - {currentActionRow?.studentName}
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent
              sx={{
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* التبويبات */}
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  flexShrink: 0,
                  overflowX: 'hidden',
                }}
              >
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  variant={isDesktop ? 'fullWidth' : 'scrollable'}
                  scrollButtons={false}
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: isDesktop ? undefined : { xs: 34, sm: 38, md: 42 },

                    '& .MuiTabs-flexContainer': {
                      justifyContent: isDesktop ? 'initial' : 'flex-start',
                    },

                    '& .MuiTab-root': {
                      fontSize: isDesktop
                        ? '1rem'
                        : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },

                      fontWeight: 'bold',

                      py: isDesktop
                        ? 2
                        : { xs: 0.22, sm: 0.3, md: 0.4 },

                      px: isDesktop
                        ? undefined
                        : { xs: 0.35, sm: 0.5, md: 0.65 },

                      minWidth: isDesktop
                        ? undefined
                        : { xs: 62, sm: 74, md: 84 },

                      minHeight: isDesktop
                        ? undefined
                        : { xs: 34, sm: 38, md: 42 },

                      color: PRIMARY_COLOR,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.15,
                      letterSpacing: 0,

                      '& .MuiTab-iconWrapper': {
                        mr: isDesktop ? 1 : 0.2,
                        mb: 0,
                      },

                      '& .MuiSvgIcon-root': {
                        fontSize: isDesktop
                          ? undefined
                          : { xs: 12, sm: 14, md: 16 },
                      },
                    },

                    '& .Mui-selected': {
                      color: PRIMARY_COLOR,
                      bgcolor: isDesktop ? 'transparent' : 'rgba(128,180,158,0.10)',
                    },

                    '& .MuiTabs-indicator': {
                      backgroundColor: PRIMARY_COLOR,
                      height: isDesktop ? 2 : 2.5,
                    },
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab 
                      key={index}
                      icon={tab.icon} 
                      iconPosition="start"
                      label={tab.label} 
                    />
                  ))}
                </Tabs>
              </Box>

              {/* محتوى التبويبات */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',

                  // مهم جدًا: محتوى الديالوج لا يحجز مساحة للسايدبار.
                  // ده كان سبب انزياح الديالوج ناحية واحدة.
                  ml: 0,
                  mr: 0,

                  p: isDesktop
                    ? 3
                    : { xs: 0.35, sm: 0.55, md: 0.8 },

                  pt: isDesktop
                    ? 3
                    : { xs: 0.35, sm: 0.5, md: 0.75 },

                  overflowX: 'hidden',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,

                  '& .MuiCard-root': {
                    borderRadius: isDesktop ? undefined : { xs: 1.5, sm: 1.8, md: 2 },
                    boxShadow: isDesktop ? undefined : '0 2px 8px rgba(15,23,42,0.08)',
                  },

                  '& .MuiCardContent-root': {
                    p: isDesktop
                      ? undefined
                      : {
                          xs: '5px !important',
                          sm: '7px !important',
                          md: '9px !important',
                        },
                  },

                  '& .MuiTypography-h4': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: '0.78rem', md: '0.9rem' },
                  },

                  '& .MuiTypography-h5': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: '0.82rem' },
                  },

                  '& .MuiTypography-h6': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                    lineHeight: 1.35,
                  },

                  '& .MuiTypography-subtitle1, & .MuiTypography-subtitle2': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                  },

                  '& .MuiTypography-body1, & .MuiTypography-body2': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                    lineHeight: 1.45,
                  },

                  '& .MuiTypography-caption': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                  },

                  '& .MuiButton-root': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },

                    minHeight: isDesktop
                      ? undefined
                      : { xs: 25, sm: 28, md: 31 },

                    py: isDesktop
                      ? undefined
                      : { xs: 0.35, sm: 0.45, md: 0.6 },
                  },

                  '& .MuiChip-root': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },

                    height: isDesktop
                      ? undefined
                      : { xs: 19, sm: 22, md: 24 },
                  },

                  '& .MuiInputBase-root, & .MuiInputLabel-root': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                  },

                  '& .MuiInputBase-input': {
                    py: isDesktop
                      ? undefined
                      : { xs: 0.75, sm: 0.9, md: 1 },
                  },

                  '& .MuiSvgIcon-root': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: 16, sm: 18, md: 20 },
                  },

                  // الجداول داخل التابات تبقى مضغوطة على الموبايل/التابلت.
                  '& table': {
                    width: '100%',
                    tableLayout: isDesktop ? 'auto' : 'fixed',
                  },

                  '& th, & td': {
                    fontSize: isDesktop
                      ? undefined
                      : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },

                    p: isDesktop ? undefined : 0.5,
                    wordBreak: 'break-word',
                  },
                }}
              >
                {/* التبويب 1: المعلومات الرئيسية */}
                {currentTab === 0 && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isDesktop
                        ? '1fr 1fr'
                        : { xs: '1fr', md: '1fr 1fr' },
                      gap: isDesktop ? 4 : { xs: 0.4, sm: 0.6, md: 0.85 },
                    }}
                  >
                    {/* Left Column - Student Info and Actions */}
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={isDesktop ? 3 : { xs: 0.4, sm: 0.6, md: 0.85 }}
                    >
                      {/* Student Info Card */}
                      <Card
                        sx={{
                          boxShadow: 3,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3,
                              fontWeight: 'bold',
                            }}
                          >
                            <PersonIcon /> معلومات الطالب
                          </Typography>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: isDesktop ? 3 : { xs: 0.28, sm: 0.45, md: 0.65 },
                            }}
                          >
                            <Box
                              sx={{
                                textAlign: 'center',
                                p: isDesktop ? 2 : { xs: 0.38, sm: 0.52, md: 0.7 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: PRIMARY_COLOR, fontSize: isDesktop ? 32 : { xs: 15, sm: 18, md: 20 }, mb: isDesktop ? 1 : 0.22 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                الرصيد الحالي
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                {Number(currentActionRow?.balance || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: isDesktop ? 2 : { xs: 0.38, sm: 0.52, md: 0.7 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: isValidMonthpay(currentActionRow?.monthpay) ? '#2196f3' : '#ff9800', fontSize: isDesktop ? 32 : { xs: 15, sm: 18, md: 20 }, mb: isDesktop ? 1 : 0.22 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                القسط الشهري
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color={isValidMonthpay(currentActionRow?.monthpay) ? 'info.main' : 'warning.main'}>
                                {Number(currentActionRow?.monthpay || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                              {!isValidMonthpay(currentActionRow?.monthpay) && (
                                <Typography variant="caption" sx={{ color: '#ff9800', display: 'block', mt: 0.5 }}>
                                  أقل من 250 ريال
                                </Typography>
                              )}
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: isDesktop ? 2 : { xs: 0.38, sm: 0.52, md: 0.7 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: '#ff9800', fontSize: isDesktop ? 32 : { xs: 15, sm: 18, md: 20 }, mb: isDesktop ? 1 : 0.22 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                الرصيد السابق
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="warning.main">
                                {Number(currentActionRow?.prebalance || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: isDesktop ? 2 : { xs: 0.38, sm: 0.52, md: 0.7 },
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <SchoolIcon sx={{ color: PRIMARY_COLOR, fontSize: isDesktop ? 32 : { xs: 15, sm: 18, md: 20 }, mb: isDesktop ? 1 : 0.22 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                البرنامج
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                {currentActionRow?.diplomName || '-'}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Current Status Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 2,
                              fontWeight: 'bold',
                            }}
                          >
                            <InfoIcon /> الحالة الحالية
                          </Typography>

                          <Box
                            sx={{
                              p: isDesktop ? 3 : { xs: 0.45, sm: 0.65, md: 0.9 },
                             bgcolor:
  rowStatuses[currentActionRow?.id] === 'paid'
    ? '#dcfce7'
    : rowStatuses[currentActionRow?.id] === 'has_order'
    ? '#e3f2fd'
    : rowStatuses[currentActionRow?.id] === 'note'
    ? '#fef9c3'
    : rowStatuses[currentActionRow?.id] === 'late'
    ? '#fee2e2'
    : '#f8fafc',
borderColor:
  rowStatuses[currentActionRow?.id] === 'paid'
    ? '#4caf50'
    : rowStatuses[currentActionRow?.id] === 'has_order'
    ? '#2196f3'
    : rowStatuses[currentActionRow?.id] === 'note'
    ? '#ff9800'
    : rowStatuses[currentActionRow?.id] === 'late'
    ? '#f44336'
    : 'grey.300',
                              textAlign: 'center',
                            }}
                          >
                            <Chip
                              label={getStatusDisplayText(rowStatuses[currentActionRow?.id] || '')}
                              size="medium"
                              sx={{
                                backgroundColor:
 rowStatuses[currentActionRow?.id] === 'paid'
    ? '#4caf50'
    : rowStatuses[currentActionRow?.id] === 'has_order'
    ? '#2196f3'
    : rowStatuses[currentActionRow?.id] === 'note'
    ? '#ff9800'
    : rowStatuses[currentActionRow?.id] === 'late'
    ? '#f44336'
    : 'default',
                                color: 'white',
                                fontSize: isDesktop ? '1.1rem' : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                                py: isDesktop ? 1.25 : 0,
                                px: isDesktop ? 1.5 : { xs: 0.6, sm: 0.8, md: 1 },
                                mb: isDesktop ? 2 : { xs: 0.5, sm: 0.7, md: 0.9 }
                              }}
                            />
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                              {rowNotes[currentActionRow?.id] || 'لا توجد متابعة حالية'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Actions Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: PRIMARY_COLOR, mb: 3, fontWeight: 'bold' }}>
                            الإجراءات السريعة
                          </Typography>

                          <Box display="flex" flexDirection="column" gap={2}>
                            {/* Status Update */}
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                                تحديث الحالة
                              </Typography>
                              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
  <InputLabel>اختر الحالة</InputLabel>
  <Select
    value={rowStatuses[currentActionRow?.id] || ''}
    onChange={(e) => handleStatusChange(currentActionRow?.id, e.target.value)}
    label="اختر الحالة"
  >
    <MenuItem value="">بدون حالة</MenuItem>
    <MenuItem value="paid">تم السداد</MenuItem>
    <MenuItem value="has_order">لديه طلب سداد</MenuItem>
    <MenuItem value="note">متابعة</MenuItem>
    <MenuItem value="late">متأخر</MenuItem>
  </Select>
</FormControl>
                              
                              {/* عرض رسالة الخطأ إذا وجدت */}
                              {statusError && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                  <AlertTitle>لا يمكن تغيير الحالة</AlertTitle>
                                  {statusError}
                                </Alert>
                              )}
                            </Box>

                            {/* WhatsApp Button */}
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<WhatsAppIcon />}
                              onClick={() => handleWhatsAppClick(currentActionRow?.studentTel)}
                              sx={uiLayout.withUiSx({
                                backgroundColor: '#25D366',
                                py: isDesktop ? 1.5 : { xs: 0.45, sm: 0.55, md: 0.7 },
                                fontSize: isDesktop ? '1rem' : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                                fontWeight: 'bold',
                                borderRadius: 2,
                                '&:hover': {
                                  backgroundColor: '#1DA851',
                                  transform: 'translateY(-2px)',
                                  boxShadow: 3,
                                },
                                transition: 'all 0.3s ease',
                              }, uiLayout.buttonSx)}
                            >
                              التواصل عبر واتساب
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Right Column - Notes */}
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={isDesktop ? 3 : { xs: 0.4, sm: 0.6, md: 0.85 }}
                    >
                      {/* Add Note Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3,
                              fontWeight: 'bold',
                            }}
                          >
                            <HistoryIcon /> إضافة متابعة جديدة
                          </Typography>

                          <TextField InputLabelProps={{ shrink: true }}
                            fullWidth
                            multiline
                            minRows={isDesktop ? 4 : isPhone ? 1 : 2}
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="اكتب المتابعة الجديدة هنا..."
                            variant="outlined"
                            sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.formFieldSx)}
                          />
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={handleNoteSave}
                            disabled={!noteInput.trim()}
                            sx={uiLayout.withUiSx({
                              py: isDesktop ? 1.5 : { xs: 0.45, sm: 0.55, md: 0.7 },
                              fontSize: isDesktop ? '1rem' : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                              fontWeight: 'bold',
                              borderRadius: 2,
                              backgroundColor: PRIMARY_COLOR,
                              '&:hover': {
                                backgroundColor: PRIMARY_COLOR_DARK,
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                              },
                              transition: 'all 0.3s ease',
                            }, uiLayout.buttonSx)}
                          >
                            حفظ المتابعة الجديدة
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                )}

                {/* التبويب 2: كشف الحساب */}
                {currentTab === 1 && (
                  <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          color: PRIMARY_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          fontWeight: 'bold',
                        }}
                      >
                        📑 الفواتير المدفوعة
                      </Typography>

                      {statementsLoading ? (
                        <Box display="flex" justifyContent="center" my={2}>
                          <CircularProgress />
                        </Box>
                      ) : statements.length === 0 ? (
                        <Typography align="center" mt={1}>
                          لا توجد بيانات كشف حساب.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                            <thead>
                              <tr style={{ backgroundColor: PRIMARY_COLOR_LIGHT }}>
                                <th style={thCell}>📅 التاريخ</th>
                                <th style={thCell}>➖ دفعة الشهر</th>
                                <th style={thCell}>💰 الرصيد المتبقي عليه</th>
                                <th style={thCell}>📝 ملاحظات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statements.map((item, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                                  <td style={tdCell}>{item.dayDate ? item.dayDate.split('T')[0] : '-'}</td>
                                  <td style={tdCell}>{item.daen}</td>
                                  <td style={tdCell}>{item.balance}</td>
                                  <td style={{ ...tdCell, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                    {item.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* التبويب 3: الملف التدريبي */}
                {currentTab === 2 && (
                  <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          color: PRIMARY_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          fontWeight: 'bold',
                        }}
                      >
                        📚 الملف التدريبي
                      </Typography>

                      {trainingLoading ? (
                        <Box display="flex" justifyContent="center" my={2}>
                          <CircularProgress />
                        </Box>
                      ) : trainingFile.length === 0 ? (
                        <Typography align="center" mt={1}>
                          لا توجد بيانات متاحة.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                            <tbody>
                              {trainingFile.map((item, index) => (
                                <React.Fragment key={index}>
                                  <tr style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الفرع</td>
                                    <td style={tdCell}>{item.branch}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>البرنامج</td>
                                    <td style={tdCell}>{item.diplom}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الدفعة</td>
                                    <td style={tdCell}>{item.batch}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>المستوى</td>
                                    <td style={tdCell}>{item.level}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>تاريخ البداية</td>
                                    <td style={tdCell}>{item.dateStart || '---'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>تاريخ النهاية</td>
                                    <td style={tdCell}>{item.dateEnd || '---'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الحالة</td>
                                    <td style={tdCell}>{item.status}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>ملاحظات</td>
                                    <td style={tdCell}>{item.notes}</td>
                                  </tr>
                                  {index < trainingFile.length - 1 && (
                                    <tr>
                                      <td colSpan="2" style={{ padding: '15px', backgroundColor: '#f8f9fa' }}></td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ✅ التبويب 4: آخر طلب سداد */}
                {currentTab === 3 && (
                  <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          color: PRIMARY_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 3,
                          fontWeight: 'bold',
                        }}
                      >
                        <PendingActionsIcon /> آخر طلب سداد
                      </Typography>

                      {!lastOrderData[currentActionRow?.id] ? (
                        <Box display="flex" justifyContent="center" my={2}>
                          <CircularProgress />
                        </Box>
                      ) : lastOrderData[currentActionRow?.id]?.success === false ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CancelIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            لا توجد أوامر دفع سابقة لهذا الحساب
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ maxWidth: isDesktop ? 600 : '100%', mx: 'auto' }}>
                          <Card sx={{ 
                            bgcolor: lastOrderData[currentActionRow?.id]?.data?.orderSubTotal > 0 ? '#fff3e0' : '#e8f5e8',
                            border: `2px solid ${lastOrderData[currentActionRow?.id]?.data?.orderSubTotal > 0 ? '#ff9800' : '#4caf50'}`,
                            borderRadius: 3
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                  تفاصيل آخر طلب سداد
                                </Typography>
                                {lastOrderData[currentActionRow?.id]?.data?.orderSubTotal > 0 ? (
                                  <Chip 
                                    icon={<PendingActionsIcon />} 
                                    label="طلب معلق" 
                                    color="warning" 
                                    variant="filled" 
                                  />
                                ) : (
                                  <Chip 
                                    icon={<CheckCircleIcon />} 
                                    label="طلب مكتمل" 
                                    color="success" 
                                    variant="filled" 
                                  />
                                )}
                              </Box>

                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                  gap: isDesktop ? 2 : { xs: 0.45, sm: 0.65, md: 0.9 },
                                }}
                              >
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    رقم الطلب
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                    {lastOrderData[currentActionRow?.id]?.data?.code || '-'}
                                  </Typography>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    تاريخ الطلب
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                    {lastOrderData[currentActionRow?.id]?.data?.orderDate ? 
                                      dayjs(lastOrderData[currentActionRow?.id]?.data?.orderDate).format('YYYY/MM/DD HH:mm') : '-'}
                                  </Typography>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    وصف السداد
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                    {lastOrderData[currentActionRow?.id]?.data?.docName || '-'}
                                  </Typography>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1, gridColumn: '1 / -1' }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    حالة الطلب
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" 
                                    sx={{ 
                                      color: lastOrderData[currentActionRow?.id]?.data?.orderStatus === 'مؤكد' ? '#4caf50' : '#ff9800'
                                    }}
                                  >
                                    {lastOrderData[currentActionRow?.id]?.data?.orderStatus || '-'}
                                  </Typography>
                                </Box>

                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1, gridColumn: '1 / -1' }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    اسم المسدد
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                    {lastOrderData[currentActionRow?.id]?.data?.fullName || currentActionRow?.studentName || '-'}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* ✅ ملاحظة إذا كان هناك طلب معلق */}
                              {lastOrderData[currentActionRow?.id]?.data?.orderSubTotal > 0 && (
                                <Box sx={{ 
                                  mt: 2, 
                                  p: 2, 
                                  bgcolor: '#fff8e1', 
                                  borderRadius: 2,
                                  border: '1px solid #ffd54f'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                                    ⚠️ ملاحظة: يوجد طلب سداد معلق بقيمة {
                                      Number(lastOrderData[currentActionRow?.id]?.data?.orderSubTotal).toLocaleString('ar-EG')
                                    } ريال
                                  </Typography>
                                </Box>
                              )}

                              {/* ✅ عرض تاريخ الطلب ومقارنته بالفترة */}
                              <Box sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: '#e3f2fd', 
                                borderRadius: 2,
                                border: '1px solid #90caf9'
                              }}>
                                <Typography variant="body2" sx={{ color: '#0d47a1', fontWeight: 'bold' }}>
                                  📅 تاريخ الطلب: {lastOrderData[currentActionRow?.id]?.data?.orderDate ? 
                                    dayjs(lastOrderData[currentActionRow?.id]?.data?.orderDate).format('YYYY/MM/DD HH:mm') : '-'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#0d47a1', mt: 0.5 }}>
                                  الفترة المحددة: {fromDate.format('YYYY/MM/DD')} إلى {toDate.format('YYYY/MM/DD')}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: hasValidPaymentInPeriod(currentActionRow?.id) ? '#4caf50' : '#f44336',
                                  fontWeight: 'bold',
                                  mt: 0.5
                                }}>
                                  {hasValidPaymentInPeriod(currentActionRow?.id) 
                                    ? '✅ هذا الطلب يقع ضمن الفترة المحددة' 
                                    : '❌ هذا الطلب لا يقع ضمن الفترة المحددة'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* التبويب 5: سجل المتابعات */}
                {currentTab === 4 && (
                  <Card sx={{ boxShadow: 3, borderRadius: 3, flex: 1 }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          color: PRIMARY_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 3,
                          fontWeight: 'bold',
                        }}
                      >
                        <HistoryIcon /> سجل المتابعات الكامل
                      </Typography>

                      <List
                        sx={{
                          height: isDesktop ? 400 : { xs: 280, sm: 340, md: 380 },
                          overflow: 'auto',
                          '&::-webkit-scrollbar': { width: 8 },
                          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: 4 },
                          '&::-webkit-scrollbar-thumb': { background: PRIMARY_COLOR, borderRadius: 4 },
                          '&::-webkit-scrollbar-thumb:hover': { background: PRIMARY_COLOR_DARK },
                        }}
                      >
                        {studentHistory[currentActionRow?.id] && studentHistory[currentActionRow?.id].length > 0 ? (
                          studentHistory[currentActionRow?.id]
                            .sort((a, b) => new Date(b.dateRecorded) - new Date(a.dateRecorded))
                            .map((record, index) => (
                              <React.Fragment key={index}>
                                <ListItem
                                  alignItems="flex-start"
                                  sx={{
                                    p: isDesktop ? 2 : { xs: 0.55, sm: 0.75, md: 1 },
                                    mb: isDesktop ? 2 : { xs: 0.45, sm: 0.6, md: 0.8 },
                                    bgcolor: index === 0 ? '#f0f9ff' : 'transparent',
                                    borderRadius: 2,
                                    border: index === 0 ? '2px solid' : '1px solid',
                                    borderColor: index === 0 ? PRIMARY_COLOR : 'grey.200',
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexDirection="column" gap={1}>
                                        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                              {dayjs(record.dateRecorded).format('YYYY/MM/DD')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              {dayjs(record.dateRecorded).format('HH:mm')}
                                            </Typography>
                                          </Box>
                                          <Chip
                                            label={getStatusDisplayText(record.status)}
                                            size="small"
                                            sx={{
                                              backgroundColor:
  record.status === 'paid'
    ? '#4caf50'
    : record.status === 'has_order'
    ? '#2196f3'
    : record.status === 'note'
    ? '#ff9800'
    : record.status === 'late'
    ? '#f44336'
    : 'default',
                                              color: 'white',
                                              fontWeight: 'bold'
                                            }}
                                          />
                                        </Box>

                                        <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1, width: '100%' }}>
                                          <PersonIcon fontSize="small" sx={{ color: PRIMARY_COLOR }} />
                                          <Typography variant="body2" sx={{ color: PRIMARY_COLOR }} fontWeight="500">
                                            المدرب: {getTrainerName(record.trainerGuid)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                    secondary={
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          mt: 2,
                                          p: 2,
                                          bgcolor: '#f8fafc',
                                          borderRadius: 2,
                                          borderInlineStart: '4px solid',
                                         borderInlineStartColor:
  record.status === 'paid'
    ? '#4caf50'
    : record.status === 'has_order'
    ? '#2196f3'
    : record.status === 'note'
    ? '#ff9800'
    : record.status === 'late'
    ? '#f44336'
    : PRIMARY_COLOR,
                                        }}
                                      >
                                        {record.note || 'لا توجد متابعة'}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                                {index < studentHistory[currentActionRow?.id].length - 1 && <Divider sx={{ my: 1 }} />}
                              </React.Fragment>
                            ))
                        ) : (
                          <Typography align="center" mt={2}>
                            لا توجد متابعات مسجلة.
                          </Typography>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </DialogContent>

            <DialogActions
              sx={uiLayout.withUiSx({
                p: isDesktop ? 3 : { xs: 0.35, sm: 0.5, md: 0.7 },
                bgcolor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0,
              }, uiLayout.dialogActionsSx)}
            >
              <Button
                onClick={() => setActionDialogOpen(false)}
                variant="contained"
                fullWidth={isPhone}
                sx={uiLayout.withUiSx({
                  px: isDesktop ? 4 : { xs: 0.8, sm: 1.1, md: 1.4 },
                  py: isDesktop ? 1 : { xs: 0.3, sm: 0.4, md: 0.5 },
                  fontSize: isDesktop ? '1rem' : { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
                  fontWeight: 'bold',
                  borderRadius: isDesktop ? 2 : 1.5,
                  backgroundColor: PRIMARY_COLOR,
                  '&:hover': {
                    backgroundColor: PRIMARY_COLOR_DARK,
                  },
                }, uiLayout.buttonSx)}
              >
                إغلاق النافذة
              </Button>
            </DialogActions>
          </Dialog>

         <style>{`
  .status-paid {
    background-color: #dcfce7 !important;
  }
  .status-has_order {
    background-color: #e3f2fd !important;
  }
  .status-note {
    background-color: #fef9c3 !important;
  }
  .status-late {
    background-color: #fee2e2 !important;
  }
`}</style>
        </Box>
      </Box>
    </LocalizationProvider></NavigationShell>
  );
};

/** @type {import('react').CSSProperties} */
const thCell = {
  fontWeight: 'bold',
  padding: '10px',
  textAlign: 'center',
  fontFamily: 'cairo',
  color: '#1e293b',
};

/** @type {import('react').CSSProperties} */
const tdCell = {
  padding: '10px',
  textAlign: 'center',
};

export default TrainerStudentGrid2;