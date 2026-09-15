import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import { designTokens } from '../config/designTokens';
import React, { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Card, Button, CircularProgress
} from "@mui/material";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import LocationOnIcon from '@mui/icons-material/LocationOn'; // الأيقونة الجديدة
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DataGrid } from "@mui/x-data-grid";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = [
  "#1976d2", "#fbc02d", "#00bfae", "#ef5350", "#8e24aa", "#43a047",
  "#ff9800", "#c62828", "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#5C6BC0", "#00897B", "#D84315", "#7E57C2", "#3949AB", "#00838F", "#F4511E"
];

const BranchesDashboardReport = () => {
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs());
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setBranches([]);
    const from = fromDate.format("YYYY-MM-DD");
    const to = toDate.format("YYYY-MM-DD");
    fetch(
      `https://api3.sstli.com/api/Trainer/BranchBocketMoney?fromDate=${from}&toDate=${to}`
    )
      .then(res => res.json())
      .then(result => {
        if (Array.isArray(result)) {
          setBranches(result.map((row, idx) => ({
            ...row,
            id: idx + 1,
            comm_Case1: Number(row.daen_Case1 || 0) * 0.005,
            comm_Case2: Number(row.daen_Case2 || 0) * 0.005,
          })));
        } else {
          setBranches([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setBranches([]);
        setLoading(false);
      });
  }, [fromDate, toDate]);

  // رسم الألوان حسب الفرع
  const colorMap = {};
  branches.forEach((b, i) => {
    colorMap[b.brEName] = COLORS[i % COLORS.length];
  });

  // إجمالي التحصيل من كل الفروع (مجموع المدين للحالتين)
  const totalAllDaen = branches.reduce(
    (acc, row) => acc + (Number(row.daen_Case1) || 0) + (Number(row.daen_Case2) || 0),
    0
  );

  const columns = [
    {
      field: "brEName",
      headerName: "اسم الفرع",
      flex: 2.2,
      minWidth: 160,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOnIcon sx={{ color: colorMap[params.value] || "#1976d2", fontSize: 28 }} />
          <Typography fontWeight={700}>{params.value}</Typography>
        </Box>
      )
      // لا تضيف align هنا (سيبه left أو default)
    },
    {
      field: "students_Case1",
      headerName: "عدد المستمرين",
      flex: 1,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "daen_Case1",
      headerName: "تحصيل المستمرين",
      flex: 1.3,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (params.value ? Number(params.value).toLocaleString("ar-EG") + " ريال" : "—"),
    },
    // {
    //   field: "comm_Case1",
    //   headerName: "عمولة المستمرين",
    //   flex: 1.1,
    //   minWidth: 120,
    //   align: "center",
    //   headerAlign: "center",
    //   renderCell: (params) => (params.value ? Number(params.value).toLocaleString("ar-EG") + " ريال" : "—"),
    // },
    {
      field: "students_Case2",
      headerName: "عدد الخريجين",
      flex: 1,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "daen_Case2",
      headerName: "تحصيل الخريجين",
      flex: 1.3,
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (params.value ? Number(params.value).toLocaleString("ar-EG") + " ريال" : "—"),
    },
    // {
    //   field: "comm_Case2",
    //   headerName: "عمولة الخريجين",
    //   flex: 1.1,
    //   minWidth: 120,
    //   align: "center",
    //   headerAlign: "center",
    //   renderCell: (params) => (params.value ? Number(params.value).toLocaleString("ar-EG") + " ريال" : "—"),
    // },
    {
      field: "percentage",
      headerName: "نسبة تحصيل الفرع من الإجمالي",
      flex: 1.2,
      minWidth: 155,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row || params;
        const branchTotal = Number(row.daen_Case1 || 0) + Number(row.daen_Case2 || 0);
        if (!totalAllDaen || totalAllDaen === 0) return "0%";
        const percent = (branchTotal / totalAllDaen) * 100;
        return percent.toFixed(2) + "%";
      }
    }
  ];
  

  // جرافيك الأعمدة: إجمالي تحصيل كل فرع (مستمرين + خريجين)
  const chartData = branches.map(b => ({
    name: b.brEName,
    total: (Number(b.daen_Case1) || 0) + (Number(b.daen_Case2) || 0)
  }));

  // PDF
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        scrollY: -window.scrollY,
        useCORS: true,
        allowTaint: true,
        logging: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setProperties({
        title: 'تقرير تحصيلات الفروع',
        subject: 'إحصائيات الفروع',
        author: 'نظام الإدارة',
        keywords: 'تقرير, فروع, تحصيلات',
        creator: 'شركتك'
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;

      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;

        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save('تقرير-الفروع.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{
        minHeight: "100vh",
        background: "#f7f9fa",
        padding: designTokens.pageGutter,
        boxSizing: 'border-box',
        width: "100%",
        position: "relative"
      }}>
        {/* Report Content */}
        <Box ref={reportRef} sx={{
          background: "#fff",
          borderRadius: 3,
          p: 1,
          boxShadow: 4,
          mb: 1,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          height: "auto",
          "@media print": {
            boxShadow: "none",
            borderRadius: 0
          }
        }}>
          {/* Header */}
          <Card elevation={0} sx={{
            mb: 1, mx: "auto", px: 1, py: 1,
            borderRadius: 3, boxShadow: 0, display: "flex",
            alignItems: "center", gap: 1, justifyContent: "space-between",
            flexWrap: "wrap", background: "#fff",
            minWidth: 0
          }}>
            <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
              <Typography fontWeight="bold" color="primary.main" fontSize={30} mb={0.2}>
                <AttachMoneyIcon sx={{ fontSize: 35, mb: -0.7, color: "#1976d2" }} /> تقرير تحصيلات جميع الفروع
              </Typography>
              <Typography fontSize={19} color="text.secondary" mt={1.5}>
                اجمالي تحصيل الفروع:&nbsp;
                <span style={adaptiveInlineStyle({ color: "#1976d2", fontWeight: 700 })}>
                  {totalAllDaen?.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ريال
                </span>
              </Typography>
            </Box>
            <Box sx={uiLayout.formGridSx} flex={1.4} display="flex" alignItems="center" gap={2} justifyContent="center" flexWrap="wrap">
              <DatePicker
                label="من تاريخ"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{
                  textField: { variant: "outlined", size: "small", sx: { minWidth: 120, bgcolor: "#fff" } },
                }}
              />
              <DatePicker
                label="إلى تاريخ"
                value={toDate}
                onChange={setToDate}
                slotProps={{
                  textField: { variant: "outlined", size: "small", sx: { minWidth: 120, bgcolor: "#fff" } },
                }}
              />
            </Box>
          </Card>

          {/* Legend */}
          <Box
            display="flex"
            flexWrap="wrap"
            gap={2}
            justifyContent="center"
            alignItems="center"
            mb={2}
          >
            {branches.map((b, i) => (
              <Box key={b.brEName} display="flex" alignItems="center" gap={1}>
                <LocationOnIcon sx={{ color: colorMap[b.brEName] }} />
                <Typography fontSize={16}>{b.brEName}</Typography>
              </Box>
            ))}
          </Box>

          {/* Chart */}
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              mx: "auto",
              mt: 2,
              mb: 5,
              background: "#fff",
              borderRadius: 4,
              boxShadow: 1,
              p: 2.5,
            }}
          >
            <Typography align="center" fontWeight="bold" mb={2} fontSize={22} color="primary">
              ترتيب ومساهمة الفروع حسب التحصيل (ريال)
            </Typography>
            <ResponsiveContainer width="100%" height={430}>
              <BarChart
                data={[...chartData].sort((a, b) => b.total - a.total)}
                margin={{ top: 30, right: 30, left: 30, bottom: 80 }}
                barSize={37}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  type="category"
                  interval={0}
                  tick={({ x, y, payload }) => {
                    const words = payload.value.split(" ");
                    return (
                      <g transform={`translate(${x},${y + 10})`}>
                        {words.map((word, idx) => (
                          <text
                            key={idx}
                            x={0}
                            y={idx * 15}
                            textAnchor="middle"
                            fontSize={14}
                            fontWeight={700}
                            fill="#222"
                            style={{ pointerEvents: "none" }}
                          >
                            {word}
                          </text>
                        ))}
                      </g>
                    );
                  }}
                  height={85}
                />
                <YAxis
                  type="number"
                  tickFormatter={v => v.toLocaleString("ar-EG")}
                  style={{ fontSize: 16 }}
                />
                <Tooltip
                  formatter={v => `${Number(v).toLocaleString("ar-EG")} ريال`}
                  labelFormatter={label => `فرع: ${label}`}
                />
                <Bar
                  dataKey="total"
                  isAnimationActive={false}
                  radius={[8, 8, 0, 0]}
                  fill="#1976d2"
                  label={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Table */}
          <Box
            sx={uiLayout.withUiSx({
              mt: 1, width: "100%", minWidth: 0, maxWidth: "100%", mx: "auto",
              bgcolor: "#fff", borderRadius: 4, boxShadow: 1, p: 1,
            }, uiLayout.tableContainerSx)}
          >
            <Typography
              variant="h6"
              align="center"
              mb={2}
              fontWeight="bold"
              color="primary"
            >
              جدول تحصيلات جميع الفروع
            </Typography>
            <DataGrid
              rows={branches}
              columns={columns}
              autoHeight
              disableRowSelectionOnClick
              loading={loading}
              sx={uiLayout.withUiSx({
                fontFamily: "inherit",
                background: "#fff",
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
                "& .MuiDataGrid-cell": { fontSize: 17 },
                direction: "rtl",
                minWidth: 0
              }, uiLayout.dataGridSx)}
              localeText={{
                noRowsLabel: "لا توجد بيانات",
              }}
            />
          </Box>
        </Box>

        {/* Actions Footer - لن يظهر في التقرير المطبوع */}
        <Box sx={uiLayout.withUiSx({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          maxWidth: 1700,
          mx: "auto",
          "@media print": {
            display: "none !important"
          }
        }, uiLayout.actionBarSx)}>
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard")}
            startIcon={<ArrowBackIcon />}
            sx={uiLayout.withUiSx({
              fontWeight: "bold",
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" }
            }, uiLayout.buttonSx)}
          >
            رجوع
          </Button>

          <Button
            onClick={handleDownloadPdf}
            color="primary"
            variant="contained"
            disabled={isGenerating}
            sx={uiLayout.withUiSx({
              fontWeight: "bold",
              gap: 1,
              px: 3,
              backgroundColor: "#4caf50",
              "&:hover": { backgroundColor: "#388e3c" },
              "&:disabled": { backgroundColor: "#81c784" }
            }, uiLayout.buttonSx)}
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
          >
            {isGenerating ? 'جاري التصدير...' : 'طباعة التقرير PDF'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default BranchesDashboardReport;
