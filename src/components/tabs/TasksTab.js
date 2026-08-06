import React from "react";
import { 
  Card, 
  Typography, 
  Box, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip 
} from "@mui/material";
import { motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { 
  Analytics, 
  Send, 
  Inbox, 
  CheckCircle, 
  Pending, 
  Schedule,
  TrendingUp 
} from "@mui/icons-material";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis
} from "recharts";

const COLOR_SCHEME = {
  primary: '#76ae97',
  accent: '#4ecdc4',
  success: '#22c55e',
  warning: '#f59e42',
  error: '#ef4444',
  text: '#2c3e50'
};

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const COLORS = [COLOR_SCHEME.success, COLOR_SCHEME.warning, COLOR_SCHEME.error, COLOR_SCHEME.primary];

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const TasksTab = ({ 
  tasks, 
  selectedYear, 
  selectedMonth, 
  setSelectedYear, 
  setSelectedMonth,
  filterTasksByTypeAndDate,
  calculateStats
}) => {
  
  const sentTasks = filterTasksByTypeAndDate("sent", selectedYear, selectedMonth);
  const receivedTasks = filterTasksByTypeAndDate("received", selectedYear, selectedMonth);
  const sentStats = calculateStats(sentTasks);
  const receivedStats = calculateStats(receivedTasks);

  // إعداد بيانات الرسم البياني الشهري
  const prepareMonthlyChartData = () => {
    const result = MONTHS.map(month => {
      const monthIndex = MONTHS.indexOf(month);
      const sentTasks = filterTasksByTypeAndDate("sent", selectedYear, month);
      const receivedTasks = filterTasksByTypeAndDate("received", selectedYear, month);
      
      return {
        month,
        sent: sentTasks.length,
        received: receivedTasks.length
      };
    });
    
    return result;
  };

  // البيانات للرسم البياني الدائري
  const preparePieChartData = (tasksList) => {
    const stats = calculateStats(tasksList);
    return [
      { name: "مكتملة", value: stats.completed },
      { name: "قيد التنفيذ", value: stats.inProgress },
      { name: "معلقة", value: stats.pending }
    ];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1.5, boxShadow: 3, borderRadius: 2, background: 'white' }}>
          <Typography variant="body2" fontWeight="bold">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const chartData = prepareMonthlyChartData();
const currentYear = new Date().getFullYear();

const yearsFromTasks = tasks
  .map(task => {
    const d = new Date(task.createdAt);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  })
  .filter(Boolean);

const availableYears = Array.from(
  new Set([
    ...yearsFromTasks,
    currentYear,        // السنة الحالية
    currentYear + 1     // السنة اللي بعدها (هتضمن 2026)
  ])
).sort((a, b) => a - b);


  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
          background: "white",
          border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`
        }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mr: 1 }}>
              <Analytics sx={{ mr: 1, color: COLOR_SCHEME.primary }} /> تصفية بيانات المهام:
            </Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>السنة</InputLabel>
              <Select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>الشهر</InputLabel>
              <Select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="كل السنة">كل السنة</MenuItem>
                {MONTHS.map(month => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Card>
      </motion.div>

      {/* Tasks Analysis */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div variants={fadeIn}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
                background: "white",
                border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`,
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "translateY(-3px)"
                },
                height: '100%'
              }}>
                <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", color: COLOR_SCHEME.primary }}>
                  <Send sx={{ mr: 1 }} /> تحليل المهام المرسلة
                </Typography>
                
                <Box sx={{ mt: 3, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieChartData(sentTasks)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={renderCustomizedLabel}
                        labelLine={false}
                      >
                        {preparePieChartData(sentTasks).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-around" }}>
                  <Chip icon={<CheckCircle />} label={`${sentStats.completed} مكتملة`} sx={{ background: COLOR_SCHEME.success, color: 'white' }} size="small" />
                  <Chip icon={<Pending />} label={`${sentStats.inProgress} قيد التنفيذ`} sx={{ background: COLOR_SCHEME.warning, color: 'white' }} size="small" />
                  <Chip icon={<Schedule />} label={`${sentStats.pending} معلقة`} sx={{ background: COLOR_SCHEME.error, color: 'white' }} size="small" />
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div variants={fadeIn}>
              <Card sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
                background: "white",
                border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`,
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "translateY(-3px)"
                },
                height: '100%'
              }}>
                <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", color: COLOR_SCHEME.accent }}>
                  <Inbox sx={{ mr: 1 }} /> تحليل المهام المستلمة
                </Typography>
                
                <Box sx={{ mt: 3, height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieChartData(receivedTasks)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={renderCustomizedLabel}
                        labelLine={false}
                      >
                        {preparePieChartData(receivedTasks).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box sx={{ mt: 2, display: "flex", justifyContent: "space-around" }}>
                  <Chip icon={<CheckCircle />} label={`${receivedStats.completed} مكتملة`} sx={{ background: COLOR_SCHEME.success, color: 'white' }} size="small" />
                  <Chip icon={<Pending />} label={`${receivedStats.inProgress} قيد التنفيذ`} sx={{ background: COLOR_SCHEME.warning, color: 'white' }} size="small" />
                  <Chip icon={<Schedule />} label={`${receivedStats.pending} معلقة`} sx={{ background: COLOR_SCHEME.error, color: 'white' }} size="small" />
                </Box>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Performance Chart */}
      <motion.div variants={fadeIn}>
        <Card sx={{ 
          p: 3, 
          mt: 3,
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
          background: "white",
          border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`
        }}>
          <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <TrendingUp sx={{ mr: 1, color: COLOR_SCHEME.primary }} /> تطور الأداء خلال السنة
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sent" 
                name="مهام مرسلة" 
                stroke={COLOR_SCHEME.primary} 
                strokeWidth={3}
                dot={{ fill: COLOR_SCHEME.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLOR_SCHEME.primary }}
              />
              <Line 
                type="monotone" 
                dataKey="received" 
                name="مهام مستلمة" 
                stroke={COLOR_SCHEME.accent} 
                strokeWidth={3}
                dot={{ fill: COLOR_SCHEME.accent, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLOR_SCHEME.accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TasksTab;