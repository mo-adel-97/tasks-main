import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import { navigationContentStyle } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, IconButton, Stack, Paper,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { arabicFont } from "../fonts/Amiri-Regular-base64"
import { 
  FilterAlt, FilterAltOff, 
  Refresh, CalendarToday,
  Description, Call, School, ReportProblem,
  Note, Forward, Visibility, PictureAsPdf
} from '@mui/icons-material';

import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const callTypeLabels = {
  0: 'استفسار عام',
  1: 'استفسار دراسي',
  2: 'شكوى'
};

const programLabels = [
  "دبلوم الإدارة المكتبية", "دبلوم الموارد البشرية", "دبلوم إدارة الأعمال", "دبلوم القانون",
  "دبلوم المستشفيات", "دبلوم الأمن السيبراني", "دبلوم مشارك مكتبي", "دبلوم إدارة السلامة",
  "دبلوم المحاسبة", "دورة الحاسب الآلي 3 شهور", "دورة الحاسب الآلي 6 شهور",
  "دورة الإدارة المكتبية 3 شهور", "دورة الإدارة المكتبية 6 شهور", "دورات تطويرية", "آخري"
];

const studyTopics = [
  "الرسوم الدراسية", "التسجيل", "الاختبارات", "شهادة التخرج",
  "جدول الدراسة", "التجسير", "آخري"
];

const complainSources = [
  "موظف إداري", "مدرب", "مشرف فرع", "مسوق", "آخري"
];

const ReportClients = () => {
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState('');
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedForwardInfo, setSelectedForwardInfo] = useState({});
  const [followUpsDialogOpen, setFollowUpsDialogOpen] = useState(false);
  const [selectedFollowUps, setSelectedFollowUps] = useState([]);
  const [selectedCallInfo, setSelectedCallInfo] = useState({});
  const [followUps, setFollowUps] = useState([]);
const [users, setUsers] = useState([]);
const [userFilter, setUserFilter] = useState('');

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [studentInfoMap, setStudentInfoMap] = useState({});
  
  // Filter states
  const [callTypeFilter, setCallTypeFilter] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [callsRes, usersRes, followRes] = await Promise.all([
          axios.get('https://api1.sstli.com/api/call/all'),
          axios.get('https://api1.sstli.com/api/userinfo'),
          axios.get('https://api1.sstli.com/api/followcall')
        ]);

        const userMap = {};
        usersRes.data.forEach(u => {
          userMap[u.guid] = u.fullName;
        });

        // Create a map of accountGuid to student info
        const studentInfo = {};
        const uniqueAccountGuids = [...new Set(callsRes.data.map(call => call.accountGuid).filter(Boolean))];
        
        // Fetch student info for each unique accountGuid
        await Promise.all(uniqueAccountGuids.map(async (accountGuid) => {
          try {
            const response = await axios.get(`https://api1.sstli.com/api/StudyInfo/by-account/${accountGuid}`);
            studentInfo[accountGuid] = response.data;
          } catch (error) {
            console.error(`Error fetching student info for account ${accountGuid}:`, error);
            studentInfo[accountGuid] = {
              studentName: 'غير متوفر',
              studentTel: 'غير متوفر',
              nationalId: 'غير متوفر'
            };
          }
        }));

        setStudentInfoMap(studentInfo);

        const transformed = callsRes.data.map((call, index) => {
          const dateOnly = call.callDate?.split('T')[0];
          const callGuid = call.guid;
          const studentData = call.accountGuid ? studentInfo[call.accountGuid] : null;

          return {
            id: index + 1,
            guid: callGuid,
            date: dateOnly,
            user: userMap[call.userGuid] || '',
            type: callTypeLabels[call.callType] || '',
            program: programLabels[call.programInquiry] || '',
            topic: studyTopics[call.studyInquiryTopic - 1] || '',
            complain: (call.callType === 2 && call.complainInquiry !== null)
              ? complainSources[call.complainInquiry]
              : '',
            details: call.complainDetails || '',
            notes: call.notes || '',
            status: call.callStatus === 1 ? 'متابعة لاحقة' : 'مكملة',
            forwarded: call.forwardCall ? 'نعم' : 'لا',
            to: (() => {
              const fwdGuid = call.supervisorGuid || call.forwardTo;
              return userMap[fwdGuid] || '';
            })(),
            studentName: studentData?.studentName || 'غير متوفر',
            studentTel: studentData?.studentTel || 'غير متوفر',
            nationalId: studentData?.nationalId || 'غير متوفر'
          };
        });

        setCalls(transformed);
        setFilteredCalls(transformed);
const uniqueUsers = [...new Set(transformed.map(call => call.user))].filter(Boolean);
setUsers(uniqueUsers);
        setFollowUps(followRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserChange = (e) => {
  setUserFilter(e.target.value);
};

  const handleDeleteCall = async (callGuid) => {
  if (window.confirm('هل أنت متأكد من حذف هذه المكالمة؟')) {
    try {
      await axios.delete(`https://api1.sstli.com/api/call/${callGuid}`);
      // Refresh the data after successful deletion
      refreshData();
    } catch (error) {
      console.error('Error deleting call:', error);
      alert('حدث خطأ أثناء حذف المكالمة');
    }
  }
};

  // Apply all filters
  useEffect(() => {
    let filtered = [...calls];

    if (userFilter) {
  filtered = filtered.filter(c => c.user === userFilter);
}

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(call => {
        const callDate = new Date(call.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        // Set end date to end of day (23:59:59)
        endDate.setHours(23, 59, 59, 999);
        
        return callDate >= startDate && callDate <= endDate;
      });
    }

    // Single date filter
    if (selectedDate) {
      filtered = filtered.filter(c => c.date === selectedDate);
    }

    // Call type filter
    if (callTypeFilter) {
      filtered = filtered.filter(c => c.type === callTypeFilter);
    }

    // Call status filter
    if (callStatusFilter) {
      filtered = filtered.filter(c => c.status === callStatusFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, selectedDate, callTypeFilter, callStatusFilter, dateRange]);

  const handleDateChange = (e) => {
    const value = e.target.value;
    setSelectedDate(value);
    setDateRange({ start: null, end: null });
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setSelectedDate('');
  };

  const handleCallTypeChange = (e) => {
    setCallTypeFilter(e.target.value);
  };

  const handleCallStatusChange = (e) => {
    setCallStatusFilter(e.target.value);
  };

const resetFilters = () => {
  setSelectedDate('');
  setCallTypeFilter('');
  setCallStatusFilter('');
  setUserFilter('');
  setDateRange({ start: null, end: null });
};

  const refreshData = () => {
    window.location.reload();
  };

  const handleNotesClick = (notes) => {
    setSelectedNotes(notes);
    setNotesDialogOpen(true);
  };

  const handleForwardClick = (forwardInfo) => {
    setSelectedForwardInfo(forwardInfo);
    setForwardDialogOpen(true);
  };

  const handleFollowUpsClick = (call) => {
    const callFollowUps = followUps.filter(f => f.callGuid === call.guid);
    setSelectedFollowUps(callFollowUps);
    setSelectedCallInfo(call);
    setFollowUpsDialogOpen(true);
  };

  // ضيف هذا السطر عشان jsPDF يقدر يقرأ الخط


  const generateHTMLReport = () => {
    // Group follow-ups by call GUID for easy lookup and sort them by date (oldest first)
    const followUpsByCall = {};
    followUps.forEach(followUp => {
      if (!followUpsByCall[followUp.callGuid]) {
        followUpsByCall[followUp.callGuid] = [];
      }
      followUpsByCall[followUp.callGuid].push(followUp);
    });
  
    // Sort follow-ups for each call by date (oldest first)
    Object.keys(followUpsByCall).forEach(callGuid => {
      followUpsByCall[callGuid].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });
    });
  
    // HTML content
    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير المكالمات</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-blue: #2c3e50;
      --secondary-blue: #3498db;
      --success-green: #27ae60;
      --warning-orange: #e67e22;
      --danger-red: #e74c3c;
      --purple: #9b59b6;
      --light-gray: #ecf0f1;
      --medium-gray: #bdc3c7;
      --dark-gray: #7f8c8d;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 30px;
      color: #333;
      line-height: 1.6;
      background-color: #f9f9f9;
      width:100%,
      marginLeft:100px
    }
    
    .report-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .report-header {
      background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
      color: white;
      padding: 30px;
      text-align: center;
      border-bottom: 5px solid var(--secondary-blue);
    }
    
    .report-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .report-subtitle {
      font-size: 16px;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 10px;
    }
    
    .report-date {
      font-size: 14px;
      font-weight: 300;
      opacity: 0.8;
    }
    
    .logo {
      height: 60px;
      margin-bottom: 15px;
    }
    
    .section {
      padding: 25px 30px;
      border-bottom: 1px solid var(--light-gray);
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--primary-blue);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--light-gray);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
      border-top: 4px solid;
      transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-card.total {
      border-color: var(--primary-blue);
    }
    
    .stat-card.completed {
      border-color: var(--success-green);
    }
    
    .stat-card.followup {
      border-color: var(--warning-orange);
    }
    
    .stat-card.general {
      border-color: var(--secondary-blue);
    }
    
    .stat-card.academic {
      border-color: #1abc9c;
    }
    
    .stat-card.complaint {
      border-color: var(--danger-red);
    }
    
    .stat-card.followups {
      border-color: var(--purple);
    }
    
    .stat-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--dark-gray);
      margin-bottom: 10px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
    }
    
    .filters-container {
      background: var(--light-gray);
      padding: 15px 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    
    .filters-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--primary-blue);
    }
    
    .filters-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .filters-list li {
      background: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    
    .call-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 15px;
    }
    
    .call-table th {
      background: var(--primary-blue);
      color: white;
      padding: 12px 15px;
      text-align: right;
      font-weight: 600;
    }
    
    .call-table td {
      padding: 12px 15px;
      border-bottom: 1px solid var(--light-gray);
      font-weight: 400;
    }
    
    .call-table tr:last-child td {
      border-bottom: none;
    }
    
    .call-table tr:hover {
      background-color: rgba(52, 152, 219, 0.05);
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .status-completed {
      background-color: rgba(39, 174, 96, 0.15);
      color: var(--success-green);
    }
    
    .status-followup {
      background-color: rgba(230, 126, 34, 0.15);
      color: var(--warning-orange);
    }
    
    .type-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .type-general {
      background-color: rgba(52, 152, 219, 0.15);
      color: var(--secondary-blue);
    }
    
    .type-academic {
      background-color: rgba(26, 188, 156, 0.15);
      color: #1abc9c;
    }
    
    .type-complaint {
      background-color: rgba(231, 76, 60, 0.15);
      color: var(--danger-red);
    }
    
    .follow-ups-container {
      background: rgba(236, 240, 241, 0.5);
      padding: 15px;
      border-left: 4px solid var(--secondary-blue);
      margin-top: 10px;
      border-radius: 0 0 6px 6px;
    }
    
    .follow-ups-title {
      font-weight: 600;
      color: var(--primary-blue);
      margin-bottom: 10px;
      font-size: 15px;
    }
    
    .follow-up-item {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--medium-gray);
    }
    
    .follow-up-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .follow-up-notes {
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .follow-up-meta {
      font-size: 13px;
      color: var(--dark-gray);
      display: flex;
      gap: 15px;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: var(--dark-gray);
      font-size: 14px;
      font-weight: 400;
      border-top: 1px solid var(--light-gray);
    }
    
    .status-section-header {
      background: var(--light-gray);
      padding: 12px 20px;
      margin: 30px 0 15px 0;
      border-radius: 6px;
      font-weight: 600;
      color: var(--primary-blue);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .status-section-header.completed {
      background: rgba(39, 174, 96, 0.1);
      color: var(--success-green);
    }
    
    .status-section-header.followup {
      background: rgba(230, 126, 34, 0.1);
      color: var(--warning-orange);
    }
    
    .status-icon {
      font-size: 18px;
    }
    
    @media print {
      body {
        padding: 0;
        background: none;
      }
      
      .report-container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .stat-card {
        box-shadow: none;
        border: 1px solid var(--light-gray);
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <!-- Replace with your actual logo -->
      <!-- <img src="logo.png" alt="Company Logo" class="logo"> -->
      <h1 class="report-title">تقرير المكالمات</h1>
      <p class="report-subtitle">نظرة عامة على أداء المكالمات</p>
      <p class="report-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div class="section">
      <h2 class="section-title">ملخص الإحصائيات</h2>
      
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-title">إجمالي المكالمات</div>
          <div class="stat-value">${totalCalls}</div>
        </div>
        
        <div class="stat-card completed">
          <div class="stat-title">مكتملة</div>
          <div class="stat-value">${totalByStatus['مكملة']}</div>
        </div>
        
        <div class="stat-card followup">
          <div class="stat-title">متابعة لاحقة</div>
          <div class="stat-value">${totalByStatus['متابعة لاحقة']}</div>
        </div>
        
        <div class="stat-card general">
          <div class="stat-title">استفسارات عامة</div>
          <div class="stat-value">${totalByType['استفسار عام']}</div>
        </div>
        
        <div class="stat-card academic">
          <div class="stat-title">استفسارات دراسية</div>
          <div class="stat-value">${totalByType['استفسار دراسي']}</div>
        </div>
        
        <div class="stat-card complaint">
          <div class="stat-title">شكاوى</div>
          <div class="stat-value">${totalByType['شكوى']}</div>
        </div>
        
        <div class="stat-card followups">
          <div class="stat-title">إجمالي المتابعات</div>
          <div class="stat-value">${totalFollowUps}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">الفلاتر المطبقة</h2>
      
      <div class="filters-container">
        <div class="filters-title">معايير التقرير:</div>
        <ul class="filters-list">
          ${selectedDate ? `<li>التاريخ: ${selectedDate}</li>` : ''}
          ${dateRange.start ? `<li>من: ${new Date(dateRange.start).toLocaleDateString('ar-EG')}</li>` : ''}
          ${dateRange.end ? `<li>إلى: ${new Date(dateRange.end).toLocaleDateString('ar-EG')}</li>` : ''}
          ${callTypeFilter ? `<li>نوع الاتصال: ${callTypeFilter}</li>` : ''}
          ${callStatusFilter ? `<li>حالة الاتصال: ${callStatusFilter}</li>` : ''}
          ${!selectedDate && !dateRange.start && !dateRange.end && !callTypeFilter && !callStatusFilter ? 
            '<li>لا توجد فلاتر مطبقة - عرض جميع البيانات</li>' : ''}
        </ul>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">تفاصيل المكالمات</h2>
      
      <!-- Completed Calls Section -->
      <div class="status-section-header completed">
        <span class="status-icon">✓</span>
        <span>المكالمات المكتملة</span>
      </div>
      
      <table class="call-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المستخدم</th>
            <th>اسم الطالب</th>
            <th>رقم الجوال</th>
            <th>النوع</th>
            <th>البرنامج</th>
            <th>الموضوع</th>
            <th>الملاحظات</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCalls
            .filter(call => call.status === 'مكملة')
            .map(call => {
              const callFollowUps = followUpsByCall[call.guid] || [];
              return `
                <tr>
                  <td>${call.date}</td>
                  <td>${call.user}</td>
                  <td>${call.studentName}</td>
                  <td>${call.studentTel}</td>
                  <td>
                    <span class="type-badge ${call.type === 'استفسار عام' ? 'type-general' : 
                      call.type === 'استفسار دراسي' ? 'type-academic' : 'type-complaint'}">
                      ${call.type}
                    </span>
                  </td>
                  <td>${call.program || '-'}</td>
                  <td>${call.topic || '-'}</td>
                  <td>${call.notes || '-'}</td>
                  <td>
                    <span class="status-badge status-completed">
                      ${call.status}
                    </span>
                  </td>
                </tr>
                ${callFollowUps.length > 0 ? `
                  <tr>
                    <td colspan="9" style="padding: 0;">
                      <div class="follow-ups-container">
                        <div class="follow-ups-title">المتابعات (${callFollowUps.length})</div>
                        ${callFollowUps.map((followUp, index) => `
                          <div class="follow-up-item">
                            <div class="follow-up-notes">${followUp.followUpNotes}</div>
                            <div class="follow-up-meta">
                              <span>بواسطة: ${followUp.userFullName}</span>
                              <span>تاريخ: ${followUp.createdAt?.split('T')[0]}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                ` : ''}
              `;
            }).join('')}
        </tbody>
      </table>
      
      <!-- Follow-up Calls Section -->
      <div class="status-section-header followup">
        <span class="status-icon">↻</span>
        <span>المكالمات التي تحتاج متابعة</span>
      </div>
      
      <table class="call-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المستخدم</th>
            <th>اسم الطالب</th>
            <th>رقم الجوال</th>
            <th>النوع</th>
            <th>البرنامج</th>
            <th>الموضوع</th>
            <th>الملاحظات</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCalls
            .filter(call => call.status === 'متابعة لاحقة')
            .map(call => {
              const callFollowUps = followUpsByCall[call.guid] || [];
              return `
                <tr>
                  <td>${call.date}</td>
                  <td>${call.user}</td>
                  <td>${call.studentName}</td>
                  <td>${call.studentTel}</td>
                  <td>
                    <span class="type-badge ${call.type === 'استفسار عام' ? 'type-general' : 
                      call.type === 'استفسار دراسي' ? 'type-academic' : 'type-complaint'}">
                      ${call.type}
                    </span>
                  </td>
                  <td>${call.program || '-'}</td>
                  <td>${call.topic || '-'}</td>
                  <td>${call.notes || '-'}</td>
                  <td>
                    <span class="status-badge status-followup">
                      ${call.status}
                    </span>
                  </td>
                </tr>
                ${callFollowUps.length > 0 ? `
                  <tr>
                    <td colspan="9" style="padding: 0;">
                      <div class="follow-ups-container">
                        <div class="follow-ups-title">المتابعات (${callFollowUps.length})</div>
                        ${callFollowUps.map((followUp, index) => `
                          <div class="follow-up-item">
                            <div class="follow-up-notes">${followUp.followUpNotes}</div>
                            <div class="follow-up-meta">
                              <span>بواسطة: ${followUp.userFullName}</span>
                              <span>تاريخ: ${followUp.createdAt?.split('T')[0]}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                ` : ''}
              `;
            }).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      تم إنشاء التقرير في ${new Date().toLocaleString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })} | نظام إدارة المكالمات
    </div>
  </div>
</body>
</html>`;
  
    // Create a new window for the report
    const reportWindow = window.open('', '_blank');
    reportWindow.document.open();
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    
    // Create download functionality
    const downloadReport = () => {
      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create a download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      
      // Set the filename with current date
      const now = new Date();
      const dateString = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      a.download = `تقرير_المكالمات_${dateString}.html`;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    };
    
    // Call the download function
    downloadReport();
  };

  // Statistics
  const totalCalls = filteredCalls.length;
  const totalFollowUps = followUps.filter(f =>
    filteredCalls.some(c => c.guid === f.callGuid)
  ).length;
  const totalByType = {
    'استفسار عام': filteredCalls.filter(c => c.type === 'استفسار عام').length,
    'استفسار دراسي': filteredCalls.filter(c => c.type === 'استفسار دراسي').length,
    'شكوى': filteredCalls.filter(c => c.type === 'شكوى').length
  };
  const totalByStatus = {
    'مكملة': filteredCalls.filter(c => c.status === 'مكملة').length,
    'متابعة لاحقة': filteredCalls.filter(c => c.status === 'متابعة لاحقة').length
  };

  const columns = [
    {
      field: 'expand',
      headerName: 'المتابعات',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        followUps.some(f => f.callGuid === params.row.guid) ? (
          <Tooltip title="عرض المتابعات">
            <IconButton
              onClick={() => handleFollowUpsClick(params.row)}
              size="small"
            >
              <Visibility color="primary" />
              <Typography variant="caption" sx={{ mr: 1 }}>
                (<bdi dir="ltr">{followUps.filter(f => f.callGuid === params.row.guid).length}</bdi>)
              </Typography>
            </IconButton>
          </Tooltip>
        ) : null
      )
    },
    { 
      field: 'date', 
      headerName: 'التاريخ', 
      width: 110,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarToday fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
          {params.value}
        </Box>
      )
    },
    { 
      field: 'user', 
      headerName: 'المستخدم', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ backgroundColor: '#e3f2fd' }} 
        />
      )
    },
    { 
      field: 'studentName', 
      headerName: 'اسم الطالب', 
      width: 200,
      renderCell: (params) => (
        <Typography>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'studentTel', 
      headerName: 'رقم الجوال', 
      width: 120,
      renderCell: (params) => (
        <Typography>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'nationalId', 
      headerName: 'الهوية', 
      width: 120,
      renderCell: (params) => (
        <Typography>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'type', 
      headerName: 'النوع', 
      width: 150,
      renderCell: (params) => {
        let icon = <Call color="info" />;
        if (params.value === 'استفسار دراسي') icon = <School color="primary" />;
        if (params.value === 'شكوى') icon = <ReportProblem color="error" />;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography sx={{ ml: 1 }}>{params.value}</Typography>
          </Box>
        );
      }
    },
    { 
      field: 'program', 
      headerName: 'البرنامج', 
      width: 70,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography noWrap sx={{ maxWidth: '100%' }}>
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'topic', 
      headerName: 'الموضوع', 
      width: 120 
    },
    { 
      field: 'complain', 
      headerName: 'الشكوى', 
      width: 100 
    },
    { 
      field: 'details', 
      headerName: 'التفاصيل', 
      width: 70,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography noWrap sx={{ maxWidth: '100%' }}>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'notes', 
      headerName: 'ملاحظات', 
      width: 70,
      renderCell: (params) => (
        params.value ? (
          <Tooltip title="عرض الملاحظات">
            <IconButton 
              size="small" 
              onClick={() => handleNotesClick(params.value)}
              sx={{ color: 'primary.main' }}
            >
              <Note />
            </IconButton>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )
      )
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 'bold',
            backgroundColor: params.value === 'متابعة لاحقة' ? '#fff3e0' : '#e8f5e9',
            color: params.value === 'متابعة لاحقة' ? '#e65100' : '#2e7d32'
          }}
        />
      )
    },
    { 
      field: 'forwarded', 
      headerName: 'محولة', 
      width: 80,
      renderCell: (params) => (
        params.value === 'نعم' ? (
          <Tooltip title="عرض تفاصيل التحويل">
            <IconButton 
              size="small" 
              onClick={() => handleForwardClick({
                forwarded: params.value,
                to: params.row.to,
                notes: params.row.notes
              })}
              sx={{ color: 'secondary.main' }}
            >
              <Forward />
            </IconButton>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">لا</Typography>
        )
      )
    },{
  field: 'delete',
  headerName: 'حذف',
  width: 80,
  sortable: false,
  renderCell: (params) => (
    <Tooltip title="حذف المكالمة">
      <IconButton
        onClick={() => handleDeleteCall(params.row.guid)}
        size="small"
        color="error"
      >
        <Delete />
      </IconButton>
    </Tooltip>
  )
}
  ];

  return (
    <NavigationShell variant="standard" ><>
      
      <Box style={adaptiveInlineStyle({
        padding: "20px",
        direction: 'rtl',
        ...navigationContentStyle
      })}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            <Description sx={{ verticalAlign: 'middle', marginInlineEnd: 1 }} />
            تقرير المكالمات
          </Typography>
          <Box>
            <Tooltip title="تصدير إلى PDF">
              <IconButton onClick={generateHTMLReport} color="error" sx={{ mr: 1 }}>
                <PictureAsPdf />
              </IconButton>
            </Tooltip>
            <Tooltip title="تحديث البيانات">
              <IconButton onClick={refreshData} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle2" color="text.secondary">إجمالي المكالمات</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{totalCalls}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="subtitle2" color="text.secondary">مكتملة</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{totalByStatus['مكملة']}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
            <Typography variant="subtitle2" color="text.secondary">متابعة لاحقة</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e65100' }}>{totalByStatus['متابعة لاحقة']}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="subtitle2" color="text.secondary">استفسارات عامة</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{totalByType['استفسار عام']}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e1f5fe' }}>
            <Typography variant="subtitle2" color="text.secondary">استفسارات دراسية</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0277bd' }}>{totalByType['استفسار دراسي']}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="subtitle2" color="text.secondary">شكاوى</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c62828' }}>{totalByType['شكوى']}</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
            <Typography variant="subtitle2" color="text.secondary">إجمالي المتابعات</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#6a1b9a' }}>{totalFollowUps}</Typography>
          </Paper>
        </Box>

        {/* Filters Section */}
        <Paper sx={{ mb: 3, p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              <FilterAlt sx={{ verticalAlign: 'middle', marginInlineEnd: 1 }} />
              تصفية النتائج
            </Typography>
            <Tooltip title="إعادة تعيين الفلاتر">
              <IconButton 
                onClick={resetFilters}
                size="small"
                sx={{ 
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  backgroundColor: '#fff'
                }}
              >
                <FilterAltOff fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={uiLayout.withUiSx({ display: 'flex', flexWrap: 'wrap', gap: 2 }, uiLayout.formGridSx)}>
            {/* Single Date Filter */}
            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              label="فلتر بالتاريخ"
              InputLabelProps={{ shrink: true }}
              sx={uiLayout.withUiSx({ minWidth: 200 }, uiLayout.formFieldSx)}
              size="small"
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            {/* Date Range Filter */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="من تاريخ"
                value={dateRange.start}
                onChange={(newValue) => handleDateRangeChange('start', newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } }}}
              />
              <DatePicker
                label="إلى تاريخ"
                value={dateRange.end}
                onChange={(newValue) => handleDateRangeChange('end', newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } }}}
                minDate={dateRange.start}
              />
            </LocalizationProvider>

            {/* Call Type Filter */}
            <FormControl sx={uiLayout.withUiSx({ minWidth: 200 }, uiLayout.formFieldSx)} size="small">
              <InputLabel>نوع الاتصال</InputLabel>
              <Select
                value={callTypeFilter}
                onChange={handleCallTypeChange}
                label="نوع الاتصال"
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="استفسار عام">استفسار عام</MenuItem>
                <MenuItem value="استفسار دراسي">استفسار دراسي</MenuItem>
                <MenuItem value="شكوى">شكوى</MenuItem>
              </Select>
            </FormControl>

            {/* Call Status Filter */}
            <FormControl sx={uiLayout.withUiSx({ minWidth: 200 }, uiLayout.formFieldSx)} size="small">
              <InputLabel>حالة الاتصال</InputLabel>
              <Select
                value={callStatusFilter}
                onChange={handleCallStatusChange}
                label="حالة الاتصال"
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="مكملة">مكملة</MenuItem>
                <MenuItem value="متابعة لاحقة">متابعة لاحقة</MenuItem>
              </Select>
            </FormControl>

            {/* بعد فلتر حالة الاتصال */}
<FormControl sx={uiLayout.withUiSx({ minWidth: 200 }, uiLayout.formFieldSx)} size="small">
  <InputLabel>المستخدم</InputLabel>
  <Select
    value={userFilter}
    onChange={handleUserChange}
    label="المستخدم"
  >
    <MenuItem value="">الكل</MenuItem>
    {users.map((user, index) => (
      <MenuItem key={index} value={user}>{user}</MenuItem>
    ))}
  </Select>
</FormControl>
          </Box>
        </Paper>

        {/* DataGrid Section */}
        <Paper sx={{ p: 1, borderRadius: 2, mb: "30px" }}>
  <h3>تفاصيل المكالمات</h3>
  <div style={{ minHeight: 300, width: '100%' }}>
    <DataGrid
      rows={[...filteredCalls].sort((a, b) => {
        // Convert dates to comparable format (YYYY-MM-DD)
        const dateA = a.date.split('-').reverse().join('-');
        const dateB = b.date.split('-').reverse().join('-');
        
        // Compare as strings (will sort chronologically)
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
      })}
      columns={columns}
      paginationModel={paginationModel}
      onPaginationModelChange={(newModel) => {
        setPaginationModel(newModel);
      }}
      rowsPerPageOptions={[10, 25, 50, 100]}
      pagination
      loading={loading}
      components={{
        Toolbar: GridToolbar,
      }}
      componentsProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },
      }}
      sx={uiLayout.withUiSx({
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#fafafa',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid #e0e0e0',
        },
      }, uiLayout.dataGridSx)}
    />
  </div>
</Paper>

        {/* Follow-ups Dialog */}
          {/* Follow-ups Dialog */}
<Dialog sx={uiLayout.dialogLayoutSx}
  open={followUpsDialogOpen}
  onClose={() => setFollowUpsDialogOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    متابعات المكالمة - {selectedCallInfo.studentName} - {selectedCallInfo.date}
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mt: 2 }}>
      {selectedFollowUps.length > 0 ? (
        // Sort follow-ups by date (oldest first) before mapping
        [...selectedFollowUps]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateA - dateB; // Sort from oldest to newest
          })
          .map((followUp, index) => (
            <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">
                  <span style={{ fontWeight: 'bold' }}>📌 المتابعة {index + 1}:</span> {followUp.followUpNotes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {followUp.userFullName} - {followUp.createdAt?.split('T')[0]}
                </Typography>
              </Stack>
            </Paper>
          ))
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          لا توجد متابعات لهذه المكالمة
        </Typography>
      )}
    </Box>
  </DialogContent>
  <DialogActions sx={uiLayout.dialogActionsSx}>
    <Button sx={uiLayout.buttonSx} onClick={() => setFollowUpsDialogOpen(false)} color="primary">
      إغلاق
    </Button>
  </DialogActions>
</Dialog>

        {/* Notes Dialog */}
        <Dialog sx={uiLayout.dialogLayoutSx}
          open={notesDialogOpen}
          onClose={() => setNotesDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>ملاحظات المكالمة</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
              {selectedNotes}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button sx={uiLayout.buttonSx} onClick={() => setNotesDialogOpen(false)} color="primary">
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* Forward Dialog */}
        <Dialog sx={uiLayout.dialogLayoutSx}
          open={forwardDialogOpen}
          onClose={() => setForwardDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>تفاصيل التحويل</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">حالة التحويل:</Typography>
                <Typography>{selectedForwardInfo.forwarded}</Typography>
              </Box>
              {selectedForwardInfo.forwarded === 'نعم' && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">تم التحويل إلى:</Typography>
                    <Typography>{selectedForwardInfo.to || 'غير محدد'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">ملاحظات التحويل:</Typography>
                    <Typography sx={{ whiteSpace: 'pre-line' }}>
                      {selectedForwardInfo.notes || 'لا توجد ملاحظات'}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button sx={uiLayout.buttonSx} onClick={() => setForwardDialogOpen(false)} color="primary">
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </></NavigationShell>
  );
};

export default ReportClients;