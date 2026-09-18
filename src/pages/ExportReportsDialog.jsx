import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useState } from "react";
import {
  useTheme,
  GlobalStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Stack,
  Divider,
  Checkbox,
  FormControlLabel,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ar } from "date-fns/locale";
import { format, parseISO, isValid } from "date-fns";
import Autocomplete from "@mui/material/Autocomplete";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HtmlIcon from "@mui/icons-material/Html";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// ===== Helpers =====
const safeParseReportDate = (val) => {
  if (!val) return null;

  try {
    const isoTry = parseISO(val);
    if (isValid(isoTry)) return isoTry;
  } catch {}

  try {
    const fixed = val.replace(" ", "T");
    const d = parseISO(fixed);
    if (isValid(d)) return d;
  } catch {}

  return null;
};

const inRange = (d, from, to) => {
  if (!d || !from || !to) return false;
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
};

const statusLabel = (status) => {
  const map = {
    present: "حاضر",
    absent: "غائب",
    permission: "استئذان",
    leave: "إجازة",
  };
  return map[status] || "غير محدد";
};

const getStatusColor = (status) => {
  const colors = {
    present: "#4caf50",
    absent: "#f44336",
    permission: "#ff9800",
    leave: "#2196f3",
    "غير محدد": "#9e9e9e",
  };
  return colors[status] || "#9e9e9e";
};

const countAttendance = (employeeAttendance = []) => {
  const res = { حاضر: 0, غائب: 0, استئذان: 0, "إجازة": 0, "غير محدد": 0 };
  for (const e of employeeAttendance) {
    res[statusLabel(e.status)] = (res[statusLabel(e.status)] || 0) + 1;
  }
  return res;
};

const formatArabicDate = (date) => {
  return format(date, "yyyy/MM/dd");
};

// ===== HTML Report Generator =====
const generateHTMLReport = ({ from, to, branchesPayload, includeDetails, theme }) => {
  const primaryColor = theme?.palette?.primary?.main || "#80b49e";
  const secondaryColor = theme?.palette?.secondary?.main || "#607d8b";
  
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقارير الفروع ${formatArabicDate(from)} - ${formatArabicDate(to)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f9f9f9;
            padding: 20px;
            direction: rtl;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            border: 1px solid #eaeaea;
        }
        
        .header {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            opacity: 0.2;
        }
        
        .header h1 {
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 15px;
            position: relative;
            z-index: 2;
        }
        
        .header .subtitle {
            font-size: 1.4rem;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 2;
        }
        
        .date-range {
            background: rgba(255, 255, 255, 0.15);
            padding: 12px 25px;
            border-radius: 50px;
            display: inline-block;
            margin-top: 20px;
            font-size: 1.2rem;
            font-weight: 600;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 40px;
        }
        
        .branch-section {
            margin-bottom: 50px;
            background: #fefefe;
            border-radius: 15px;
            padding: 30px;
            border: 1px solid #eee;
            transition: all 0.3s ease;
        }
        
        .branch-section:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
            transform: translateY(-3px);
        }
        
        .branch-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .branch-title {
            font-size: 1.8rem;
            color: #2c3e50;
            font-weight: 700;
        }
        
        .branch-code {
            background: ${primaryColor};
            color: white;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .branch-meta {
            display: flex;
            gap: 25px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .meta-label {
            font-weight: 600;
            color: #555;
        }
        
        .meta-value {
            font-weight: 700;
            color: ${primaryColor};
            font-size: 1.1rem;
        }
        
        .reports-container {
            margin-top: 30px;
        }
        
        .report-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            border: 1px solid #eaeaea;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            transition: all 0.3s ease;
        }
        
        .report-card:hover {
            border-color: ${primaryColor};
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        }
        
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .report-date {
            font-size: 1.4rem;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .report-id {
            background: #eef5f2;
            color: ${primaryColor};
            padding: 6px 15px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .section-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #2c3e50;
            margin: 25px 0 15px;
            padding-right: 10px;
            border-right: 4px solid ${primaryColor};
            padding-right: 15px;
        }
        
        .attendance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .employee-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
        }
        
        .employee-card:hover {
            transform: translateX(-5px);
            border-color: #ddd;
        }
        
        .employee-name {
            font-weight: 600;
            color: #333;
            font-size: 1rem;
        }
        
        .status-badge {
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
            min-width: 80px;
            text-align: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .summary-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 2px solid #f0f0f0;
        }
        
        .summary-count {
            font-size: 2.2rem;
            font-weight: 800;
            color: ${primaryColor};
            line-height: 1;
            margin-bottom: 8px;
        }
        
        .summary-label {
            font-size: 0.95rem;
            color: #666;
            font-weight: 600;
        }
        
        .tasks-list, .diplomas-list, .complaints-list, .suggestions-list {
            list-style: none;
            margin-top: 10px;
        }
        
        .list-item {
            background: #f8f9fa;
            margin-bottom: 12px;
            padding: 18px;
            border-radius: 10px;
            border-right: 4px solid ${primaryColor};
            position: relative;
            transition: all 0.2s ease;
        }
        
        .list-item:hover {
            background: #f0f7f4;
            transform: translateX(-5px);
        }
        
        .list-item::before {
            content: "•";
            color: ${primaryColor};
            font-size: 1.8rem;
            position: absolute;
            right: -12px;
            top: 10px;
        }
        
        .diploma-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f0f7f4;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .diploma-name {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .diploma-details {
            display: flex;
            gap: 15px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
            background: #f9f9f9;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            margin-top: 40px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.95rem;
        }
        
        .print-btn {
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: ${primaryColor};
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(128, 180, 158, 0.4);
            transition: all 0.3s ease;
            font-family: 'Cairo', sans-serif;
            font-size: 1rem;
            z-index: 1000;
        }
        
        .print-btn:hover {
            background: ${secondaryColor};
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(128, 180, 158, 0.6);
        }
        
        @media print {
            .print-btn {
                display: none;
            }
            
            .report-container {
                box-shadow: none;
                border: none;
            }
            
            .branch-section {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            .header {
                padding: 25px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .attendance-grid {
                grid-template-columns: 1fr;
            }
            
            .branch-header {
                flex-direction: column;
                gap: 15px;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>📊 تقارير الفروع</h1>
            <div class="subtitle">تقرير شامل لفترة محددة</div>
            <div class="date-range">${formatArabicDate(from)} - ${formatArabicDate(to)}</div>
        </div>
        
        <div class="content">
            ${branchesPayload.map(branch => `
            <div class="branch-section">
                <div class="branch-header">
                    <div>
                        <div class="branch-title">${branch.branchName}</div>
                        <div class="branch-meta">
                            <div class="meta-item">
                                <span class="meta-label">عدد التقارير:</span>
                                <span class="meta-value">${branch.filteredReports.length}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">الكود:</span>
                                <span class="meta-value">${branch.branchCode}</span>
                            </div>
                        </div>
                    </div>
                    <div class="branch-code">${branch.branchCode}</div>
                </div>
                
                <div class="reports-container">
                    ${branch.filteredReports.length > 0 ? branch.filteredReports.map(report => {
                        const reportDate = safeParseReportDate(report?.report_info?.report_date) || safeParseReportDate(report?.report_info?.created_at);
                        const dateStr = reportDate ? format(reportDate, "yyyy/MM/dd") : "-";
                        const attendanceCounts = countAttendance(report.employee_attendance);
                        
                        return `
                        <div class="report-card">
                            <div class="report-header">
                                <div class="report-date">📅 ${dateStr}</div>
                                <div class="report-id">ID: ${report.report_info?.id || 'N/A'}</div>
                            </div>
                            
                            <!-- حضور الموظفين -->
                            <div>
                                <div class="section-title">👥 حضور الموظفين</div>
                                <div class="summary-grid">
                                    ${Object.entries(attendanceCounts).map(([status, count]) => `
                                    <div class="summary-item">
                                        <div class="summary-count">${count}</div>
                                        <div class="summary-label">${status}</div>
                                    </div>
                                    `).join('')}
                                </div>
                                
                                <div class="attendance-grid">
                                    ${report.employee_attendance.map(emp => `
                                    <div class="employee-card">
                                        <div class="employee-name">${emp.employee_name}</div>
                                        <div class="status-badge" style="background-color: ${getStatusColor(emp.status)};">
                                            ${statusLabel(emp.status)}
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            ${includeDetails ? `
                            <!-- مراجعة التدريب الأهلي -->
                            ${report.training_review_items?.length > 0 ? `
                            <div>
                                <div class="section-title">🎓 مراجعة التدريب الأهلي</div>
                                <ul class="tasks-list">
                                    ${report.training_review_items.map(item => `
                                    <li class="list-item">${item.description || item.name || 'عنصر مراجعة'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- الزيارات الإشرافية -->
                            ${report.supervisory_visits?.length > 0 ? `
                            <div>
                                <div class="section-title">👨‍💼 الزيارات الإشرافية</div>
                                <ul class="tasks-list">
                                    ${report.supervisory_visits.map(visit => `
                                    <li class="list-item">${visit.visitor_name || 'زيارة إشرافية'} - ${visit.purpose || ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- أعمال غير اعتيادية -->
                            ${report.unusual_work_items?.length > 0 ? `
                            <div>
                                <div class="section-title">⚡ أعمال غير اعتيادية</div>
                                <ul class="tasks-list">
                                    ${report.unusual_work_items.map(work => `
                                    <li class="list-item">${work.description || 'عمل غير اعتيادي'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- المهام اليومية -->
                            ${report.daily_tasks?.length > 0 ? `
                            <div>
                                <div class="section-title">✅ المهام اليومية</div>
                                <ul class="tasks-list">
                                    ${report.daily_tasks.map(task => `
                                    <li class="list-item">${task.task_text || task.description || 'مهمة يومية'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- تسجيلات الدبلومات -->
                            ${report.diploma_registrations?.length > 0 ? `
                            <div>
                                <div class="section-title">🎓 تسجيلات الدبلومات</div>
                                <div>
                                    ${report.diploma_registrations.map(diploma => `
                                    <div class="diploma-item">
                                        <div class="diploma-name">${diploma.diploma_name}</div>
                                        <div class="diploma-details">
                                            <span>العدد: ${diploma.count}</span>
                                            <span>الدفعة: ${diploma.batch}</span>
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- حضور الدبلومات -->
                            ${report.diploma_attendance?.length > 0 ? `
                            <div>
                                <div class="section-title">📊 حضور الدبلومات</div>
                                <div>
                                    ${report.diploma_attendance.map(att => `
                                    <div class="diploma-item">
                                        <div class="diploma-name">${att.diploma_name || 'دبلوم'}</div>
                                        <div class="diploma-details">
                                            <span>الحضور: ${att.attendance_count || 0}</span>
                                            <span>الغياب: ${att.absence_count || 0}</span>
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- موافقات الدبلومات -->
                            ${report.diploma_approvals?.length > 0 ? `
                            <div>
                                <div class="section-title">✓ موافقات الدبلومات</div>
                                <ul class="tasks-list">
                                    ${report.diploma_approvals.map(approval => `
                                    <li class="list-item">${approval.diploma_name || 'دبلوم'} - ${approval.status || 'مقبول'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- الشكاوي -->
                            ${report.complaints?.length > 0 ? `
                            <div>
                                <div class="section-title">⚠️ الشكاوي</div>
                                <ul class="complaints-list">
                                    ${report.complaints.map(complaint => `
                                    <li class="list-item">${complaint.complaint_text || complaint.description || 'شكوى'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            
                            <!-- المقترحات -->
                            ${report.suggestions?.length > 0 ? `
                            <div>
                                <div class="section-title">💡 المقترحات</div>
                                <ul class="suggestions-list">
                                    ${report.suggestions.map(suggestion => `
                                    <li class="list-item">${suggestion.suggestion_text || suggestion.description || 'اقتراح'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                            ` : ''}
                        </div>
                        `;
                    }).join('') : `
                    <div class="empty-state">
                        🏜️ لا توجد تقارير في هذه الفترة
                    </div>
                    `}
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>تم إنشاء التقرير بتاريخ ${formatArabicDate(new Date())}</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
    </div>
    
    
    <script>
        // إضافة تأثيرات عند التمرير
        window.addEventListener('scroll', function() {
            const cards = document.querySelectorAll('.report-card, .branch-section');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.8) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }
            });
        });
        
        // تحميل تأثيرات CSS بعد التحميل
        window.addEventListener('load', function() {
            document.querySelectorAll('.report-card, .branch-section').forEach(card => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            });
            
            setTimeout(() => {
                document.querySelectorAll('.report-card, .branch-section').forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }, 300);
        });
    </script>
</body>
</html>`;

  return html;
};

// ===== Component =====
export default function ExportReportsDialog({
  open,
  onClose,
  theme,
}) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const surfaces = muiTheme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(null);

  const [selectedBranches, setSelectedBranches] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [dateTo, setDateTo] = useState(new Date());

  const [includeDetails, setIncludeDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [exportFormat, setExportFormat] = useState("html"); // 'html' أو 'pdf'

  const palette = theme?.palette;

  // Fetch branches when open
  useEffect(() => {
    if (!open) return;

    const fetchBranches = async () => {
      setBranchesLoading(true);
      setBranchesError(null);
      try {
        const res = await fetch("https://api1.sstli.com/api/branches/all");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "فشل تحميل الفروع");
        setBranches(Array.isArray(data) ? data : []);
      } catch (e) {
        setBranchesError(e.message || "حصل خطأ أثناء تحميل الفروع");
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, [open]);

  const canExport = useMemo(() => {
    if (!selectedBranches.length) return false;
    if (!dateFrom || !dateTo) return false;
    if (isNaN(dateFrom) || isNaN(dateTo)) return false;
    if (dateFrom.getTime() > dateTo.getTime()) return false;
    return true;
  }, [selectedBranches, dateFrom, dateTo]);

  const handleSelectAll = () => {
    setSelectedBranches(branches);
  };

  const handleClear = () => {
    setSelectedBranches([]);
  };

  const handleExport = async () => {
    if (!canExport) return;

    setExporting(true);
    setExportError(null);
    setProgress({ done: 0, total: selectedBranches.length });

    try {
      const from = dateFrom;
      const to = dateTo;

      const branchesPayload = [];

      for (let i = 0; i < selectedBranches.length; i++) {
        const b = selectedBranches[i];

        const response = await fetch(`https://filesregsiteration.sstli.com/get_reports_all_branches.php?branch_guid=${b.guid}`);
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "فشل تحميل تقارير الفرع");
        }

        const allReports = Array.isArray(payload?.reports) ? payload.reports : [];

        const filtered = allReports.filter((r) => {
          const d = safeParseReportDate(r?.report_info?.report_date) || safeParseReportDate(r?.report_info?.created_at);
          return inRange(d, from, to);
        });

        branchesPayload.push({
          branchGuid: b.guid,
          branchName: b.name,
          branchCode: b.code,
          totalReports: payload?.branch_info?.total_reports || 0,
          filteredReports: filtered,
        });

        setProgress({ done: i + 1, total: selectedBranches.length });
      }

      if (exportFormat === "html") {
        // إنشاء صفحة HTML
        const htmlContent = generateHTMLReport({ 
          from, 
          to, 
          branchesPayload, 
          includeDetails,
          theme 
        });
        
        // إنشاء ملف HTML وتنزيله
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقارير_الفروع_${format(from, 'yyyy-MM-dd')}_الى_${format(to, 'yyyy-MM-dd')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // PDF (يمكنك إضافة كود PDF هنا إذا أردت)
        alert("تصدير PDF سيكون متاحاً قريباً");
      }

      onClose?.();
    } catch (e) {
      setExportError(e.message || "حصل خطأ أثناء التصدير");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>

      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".export-reports-dark": {
                  backgroundColor: `${muiTheme.palette.background.default} !important`,
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".export-reports-dark .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                  background: "transparent !important",
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".export-reports-dark .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                  background: "transparent !important",
                  color: "#C9F2DF !important",
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".export-reports-dark .MuiChip-root, .MuiDialog-paper .MuiChip-root": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".export-reports-dark .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                  background: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".export-reports-dark .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#67C99D !important",
                  borderWidth: "1px !important"
                },
                ".export-reports-dark .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root": {
                  color: `${muiTheme.palette.text.secondary} !important`
                },
                ".export-reports-dark .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                  color: "#9BE0C1 !important"
                },
                ".export-reports-dark .MuiInputAdornment-root, .export-reports-dark .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                  color: "#9BE0C1 !important"
                },
                ".export-reports-dark .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                  color: "#67C99D !important"
                },
                ".export-reports-dark .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                  background: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".export-reports-dark .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                  color: "#67C99D !important"
                },
                ".export-reports-dark .MuiDataGrid-root, .MuiDialog-paper .MuiDataGrid-root": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiDataGrid-columnHeaders, .export-reports-dark .MuiDataGrid-columnHeader": {
                  backgroundColor: `${darkNested} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".export-reports-dark .MuiDataGrid-cell": {
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".export-reports-dark .MuiDataGrid-row": {
                  backgroundColor: `${darkCard} !important`
                },
                ".export-reports-dark .MuiDataGrid-row:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".export-reports-dark .MuiDataGrid-footerContainer, .export-reports-dark .MuiDataGrid-toolbarContainer": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiTableContainer-root": {
                  backgroundColor: `${darkCard} !important`,
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiTableHead-root .MuiTableCell-root": {
                  backgroundColor: `${darkNested} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".export-reports-dark .MuiTableBody-root .MuiTableCell-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "rgba(103,201,157,.24) !important"
                },
                ".MuiDialog-paper": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiDialogTitle-root": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderBottom: "1px solid #67C99D !important"
                },
                ".MuiDialogContent-root": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".MuiDialogActions-root": {
                  backgroundColor: `${darkSection} !important`,
                  borderTop: "1px solid #67C99D !important"
                },
                ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: "#67C99D !important"
                },
                ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiDataGrid-panel": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".MuiMenuItem-root, .MuiAutocomplete-option": {
                  background: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  background: "transparent !important",
                  color: "#9BE0C1 !important",
                  border: "1px solid #67C99D !important",
                  boxShadow: "none !important"
                },
                ".swal2-input, .swal2-textarea, .swal2-select": {
                  background: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: "1px solid #67C99D !important"
                }
              }
            : {})
        }}
      />

      <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={exporting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        className: "export-reports-dark",
        sx: {
          borderRadius: 2,
          direction: "rtl",
          backgroundColor: isDark ? darkCard : undefined,
          backgroundImage: "none",
          border: isDark ? "1px solid #67C99D" : undefined
        },
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 800, 
        display: "flex", 
        alignItems: "center", 
        gap: 1,
        bgcolor: isDark ? darkSection : palette?.primary?.main || "#80b49e",
        color: isDark ? muiTheme.palette.text.primary : "white",
        borderBottom: isDark ? "1px solid #67C99D" : undefined,
      }}>
        <CloudDownloadIcon />
        Export Reports
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          backgroundColor: isDark ? darkCard : alpha("#80b49e", 0.03),
          pt: 3
        }}
      >
        {branchesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {branchesError}
          </Alert>
        )}

        {exportError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {exportError}
          </Alert>
        )}

        {/* Export Format Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            Export Format
          </Typography>
          <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format"
              disabled={exporting}
            >
              <MenuItem value="html">
                <Box display="flex" alignItems="center" gap={1}>
                  <HtmlIcon fontSize="small" />
                  HTML Report (Modern Design)
                </Box>
              </MenuItem>
              <MenuItem value="pdf" disabled>
                <Box display="flex" alignItems="center" gap={1}>
                  <PictureAsPdfIcon fontSize="small" />
                  PDF Document
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          {exportFormat === "html" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              HTML report with modern design, interactive elements, and print-friendly layout
            </Typography>
          )}
        </Box>

        <Box sx={uiLayout.withUiSx({ mb: 3 }, uiLayout.pageHeaderSx)}>
          <Typography sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon />
            Select Branches
            <Chip label={selectedBranches.length} size="small" sx={{ fontWeight: 800 }} />
          </Typography>

          {branchesLoading ? (
            <Box sx={{ py: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <CircularProgress size={28} />
              <Typography>Loading branches...</Typography>
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1} sx={uiLayout.withUiSx({ mb: 1, flexWrap: "wrap" }, uiLayout.actionBarSx)}>
                <Button sx={uiLayout.buttonSx} size="small" variant="outlined" onClick={handleSelectAll} disabled={!branches.length || exporting}>
                  Select All
                </Button>
                <Button sx={uiLayout.buttonSx}
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleClear}
                  disabled={!selectedBranches.length || exporting}
                >
                  Clear All
                </Button>
              </Stack>

              <Autocomplete
                multiple
                options={branches}
                value={selectedBranches}
                onChange={(e, v) => setSelectedBranches(v)}
                getOptionLabel={(o) => `${o.name} (${o.code})`}
                disableCloseOnSelect
                renderOption={(props, option, { selected }) => (
                  <li {...props} key={option.guid}>
                    <Checkbox sx={{ ml: 1 }} checked={selected} />
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {option.code} • Status: {option.status}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    {...params}
                    placeholder="Select branches..."
                    size="small"
                  />
                )}
              />
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>Date Range</Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
            <Stack sx={uiLayout.formGridSx} direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={(v) => {
                  if (v && !isNaN(v)) setDateFrom(v);
                }}
                renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} size="small" />}
              />
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={(v) => {
                  if (v && !isNaN(v)) setDateTo(v);
                }}
                renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} size="small" />}
              />
            </Stack>
          </LocalizationProvider>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  disabled={exporting}
                />
              }
              label="Include detailed sections (Tasks / Complaints / Suggestions)"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              When enabled, the report will include all detailed sections. Default: Daily summary only.
            </Typography>
          </Box>
        </Box>

        {exporting && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              Exporting... ({progress.done}/{progress.total})
            </Alert>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={22} />
              <Typography variant="body2">Loading reports and preparing {exportFormat.toUpperCase()} file</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ p: 2 }, uiLayout.dialogActionsSx)}>
        <Button sx={uiLayout.buttonSx} onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant={isDark ? "outlined" : "contained"}
          startIcon={exportFormat === "html" ? <HtmlIcon /> : <DescriptionIcon />}
          onClick={handleExport}
          disabled={!canExport || exporting || branchesLoading}
          sx={uiLayout.withUiSx({
            backgroundColor: isDark ? "transparent" : palette?.primary?.main || "#80b49e",
            color: isDark ? "#9BE0C1" : "#fff",
            borderColor: isDark ? "#67C99D" : palette?.primary?.main || "#80b49e",
            "&:hover": { backgroundColor: palette?.primary?.dark || "#5a8f7d" },
            fontWeight: 800,
            borderRadius: 2,
            px: 3,
          }, uiLayout.buttonSx)}
        >
          Export {exportFormat.toUpperCase()}
        </Button>
      </DialogActions>
      </Dialog>
    </>
  );
}