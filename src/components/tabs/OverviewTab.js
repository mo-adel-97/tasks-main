import * as uiLayout from '../common/uiLayout';
import React, { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  AnalyticsRounded,
  AutoAwesomeRounded,
  InboxRounded,
  LockRounded,
  SendRounded,
} from "@mui/icons-material";

const COLORS = {
  primary: "#087a4b",
  primaryDark: "#045a38",
  primaryDeep: "#03452d",
  soft: "#eef8f3",
  border: "#d9ece3",
  text: "#18352a",
  muted: "#6d8179",
  white: "#ffffff",
  gold: "#d7a33d",
};

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const selectSx = {
  width: "100%",
  "& .MuiInputLabel-root": {
    fontWeight: 800,
    color: COLORS.muted,
  },
  "& .MuiOutlinedInput-root": {
    height: { xs: 38, sm: 40, md: 42 },
    borderRadius: "13px",
    bgcolor: COLORS.white,
    fontWeight: 900,
    fontSize: { xs: 12, sm: 13, md: 14 },
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.primary,
      borderWidth: 1.5,
    },
  },
};

const CARD_MIN_HEIGHT = {
  xs: 128,
  sm: 142,
  md: 158,
  lg: 174,
};

function TaskMetricCard({ icon, title, stats, variant = "received" }) {
  const isReceived = variant === "received";

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      sx={{
        minHeight: CARD_MIN_HEIGHT,
        height: "100%",
        p: { xs: 1.25, sm: 1.5, md: 1.9 },
        borderRadius: { xs: "14px", sm: "17px", md: "20px" },
        position: "relative",
        overflow: "hidden",
        color: COLORS.white,
        border: "1px solid rgba(255,255,255,.18)",
        background: isReceived
          ? `linear-gradient(145deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`
          : `linear-gradient(145deg, ${COLORS.primary} 0%, ${COLORS.primaryDeep} 100%)`,
        boxShadow: "0 16px 36px rgba(4, 90, 56, 0.18)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 150,
          height: 150,
          borderRadius: "50%",
          top: -80,
          left: -55,
          background: "rgba(255,255,255,.09)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 85,
          height: 85,
          borderRadius: "50%",
          bottom: -48,
          right: -24,
          background: "rgba(255,255,255,.07)",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 12, sm: 13, md: 15 } }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 0.35, opacity: 0.8, fontSize: { xs: 12, sm: 12, md: 12 } }}>
              خلال فترة التقييم المختارة
            </Typography>
          </Box>

          <Box
            sx={{
              width: { xs: 34, sm: 39, md: 44 },
              height: { xs: 34, sm: 39, md: 44 },
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,.14)",
              border: "1px solid rgba(255,255,255,.16)",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>

        <Box sx={{ mt: 2.2, display: "flex", alignItems: "end", gap: 1 }}>
          <Typography sx={{ fontSize: { xs: 25, sm: 30, md: 36 }, lineHeight: 1, fontWeight: 1000 }}>
            {stats.total}
          </Typography>
          <Typography sx={{ pb: 0.35, fontSize: { xs: 12, sm: 12, md: 12.5 }, opacity: 0.86 }}>
            مهمة
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, mt: 2 }}>
        <Box
          sx={{
            height: 7,
            borderRadius: 99,
            bgcolor: "rgba(255,255,255,.16)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${Math.max(0, Math.min(100, stats.completionRate))}%`,
              height: "100%",
              borderRadius: "inherit",
              bgcolor: COLORS.white,
              transition: "width .35s ease",
            }}
          />
        </Box>
        <Box sx={{ mt: 0.9, display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontSize: { xs: 12, sm: 12, md: 12 }, fontWeight: 800 }}>
            نسبة الإنجاز {stats.completionRate}%
          </Typography>
          <Typography sx={{ fontSize: { xs: 12, sm: 12, md: 12 }, opacity: 0.78 }}>
            مكتملة: {stats.completed}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

function LockedServiceCard({ title, description }) {
  return (
    <Card
      className="overview-locked-card"
      sx={{
        minHeight: CARD_MIN_HEIGHT,
        height: "100%",
        borderRadius: { xs: "14px", sm: "17px", md: "20px" },
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        bgcolor: COLORS.white,
        boxShadow: "0 10px 28px rgba(17, 91, 61, 0.07)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          p: { xs: 1.2, sm: 1.6, md: 2 },
          filter: "blur(8px)",
          opacity: 0.28,
          transform: "scale(1.04)",
          background: `linear-gradient(145deg, ${COLORS.white}, ${COLORS.soft})`,
        }}
      >
        <Box sx={{ width: "42%", height: 14, borderRadius: 8, bgcolor: COLORS.primary, mb: 2 }} />
        <Box sx={{ width: "78%", height: 10, borderRadius: 8, bgcolor: COLORS.primary, mb: 1 }} />
        <Box sx={{ width: "62%", height: 10, borderRadius: 8, bgcolor: COLORS.primary }} />
      </Box>

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 2,
          background: "rgba(247, 252, 249, 0.72)",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
        }}
      >
        <Box
          sx={{
            width: { xs: 36, sm: 42, md: 46 },
            height: { xs: 36, sm: 42, md: 46 },
            borderRadius: "15px",
            display: "grid",
            placeItems: "center",
            mb: 1.25,
            color: COLORS.primary,
            bgcolor: alpha(COLORS.primary, 0.1),
            border: `1px solid ${alpha(COLORS.primary, 0.16)}`,
          }}
        >
          <LockRounded />
        </Box>
        <Typography sx={{ color: COLORS.primaryDark, fontWeight: 1000, fontSize: { xs: 12.5, sm: 13.5, md: 15 } }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.5, color: COLORS.muted, fontSize: { xs: 12, sm: 12, md: 12.5 }, lineHeight: 1.65 }}>
          {description}
        </Typography>
        <Typography
          sx={{
            mt: 1.2,
            px: 1.4,
            py: 0.45,
            borderRadius: 99,
            bgcolor: alpha(COLORS.primary, 0.09),
            color: COLORS.primary,
            fontSize: { xs: 12, sm: 12, md: 12 },
            fontWeight: 900,
          }}
        >
          قريبًا
        </Typography>
      </Box>
    </Card>
  );
}

export default function OverviewTab({
  tasks = [],
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
  filterTasksByTypeAndDate,
  calculateStats,
}) {
  const didAutoPickYear = useRef(false);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const taskYears = tasks
      .map((task) => new Date(task.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    return [...new Set([...taskYears, currentYear, currentYear + 1])].sort(
      (a, b) => b - a
    );
  }, [tasks]);

  const firstYearWithTasks = useMemo(() => {
    const years = tasks
      .map((task) => new Date(task.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear())
      .sort((a, b) => a - b);

    return years[0] ?? null;
  }, [tasks]);

  useEffect(() => {
    if (!tasks.length || didAutoPickYear.current) return;

    const selectedYearHasTasks = tasks.some((task) => {
      const date = new Date(task.createdAt);
      return !Number.isNaN(date.getTime()) && date.getFullYear() === selectedYear;
    });

    if (!selectedYearHasTasks && firstYearWithTasks) {
      setSelectedYear(firstYearWithTasks);
      setSelectedMonth("كل السنة");
    }

    didAutoPickYear.current = true;
  }, [tasks, selectedYear, firstYearWithTasks, setSelectedYear, setSelectedMonth]);

  const sentTasks = filterTasksByTypeAndDate("sent", selectedYear, selectedMonth);
  const receivedTasks = filterTasksByTypeAndDate("received", selectedYear, selectedMonth);
  const sentStats = calculateStats(sentTasks);
  const receivedStats = calculateStats(receivedTasks);

  const lockedServices = [
    { title: "الحضور والانصراف", description: "تفاصيل الحضور والتأخير ستتوفر في تحديث لاحق." },
    { title: "الإجازات", description: "رصيد الإجازات والطلبات السابقة تحت التجهيز." },
    { title: "الخصومات", description: "عرض الخصومات والتفاصيل المالية سيكون متاحًا قريبًا." },
    { title: "الإنجازات", description: "سجل الإنجازات والتقييمات قيد الإعداد حاليًا." },
    { title: "الراتب", description: "تفاصيل الراتب محمية وستُفعّل عند اكتمال الخدمة." },
    { title: "تقارير الأداء", description: "تقارير تحليلية أكثر تفصيلًا ستضاف لاحقًا." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Card
        sx={{
          p: { xs: 0.9, sm: 1.2, md: 1.4 },
          mb: { xs: 1.4, md: 1.8 },
          borderRadius: { xs: "13px", sm: "16px", md: "18px" },
          border: `1px solid ${COLORS.border}`,
          background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.soft})`,
          boxShadow: "0 9px 28px rgba(4, 90, 56, 0.07)",
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "auto 140px 140px" },
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 0.7, sm: 0.9 },
          }, uiLayout.formSectionSx)}
        >
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "center", sm: "flex-start" },
              gap: 0.8,
              fontSize: { xs: 12.5, sm: 14, md: 16 },
              fontWeight: 1000,
              color: COLORS.text,
              px: 0.5,
              whiteSpace: "nowrap",
              gridColumn: { xs: "1 / -1", sm: "auto" },
            }}
          >
            <AnalyticsRounded sx={{ color: COLORS.primary }} />
            فترة تقييم الأداء
          </Typography>

          <FormControl size="small" sx={uiLayout.withUiSx(selectSx, uiLayout.formFieldSx)}>
            <InputLabel>السنة</InputLabel>
            <Select
              value={selectedYear}
              label="السنة"
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year} sx={{ fontWeight: 800 }}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={uiLayout.withUiSx(selectSx, uiLayout.formFieldSx)}>
            <InputLabel>الشهر</InputLabel>
            <Select
              value={selectedMonth}
              label="الشهر"
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <MenuItem value="كل السنة" sx={{ fontWeight: 800 }}>
                كل السنة
              </MenuItem>
              {MONTHS.map((month) => (
                <MenuItem key={month} value={month} sx={{ fontWeight: 800 }}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Typography
        sx={{
          mb: { xs: 1.4, md: 1.8 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.8,
          color: COLORS.text,
          fontSize: { xs: 16, sm: 19, md: 23 },
          fontWeight: 1000,
          textAlign: "center",
        }}
      >
        <AutoAwesomeRounded sx={{ color: COLORS.gold }} />
        نظرة عامة على الأداء
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: { xs: 0.9, sm: 1.1, md: 1.4 },
          mb: { xs: 0.9, sm: 1.1, md: 1.4 },
        }}
      >
        <TaskMetricCard
          icon={<InboxRounded sx={{ fontSize: 25 }} />}
          title="المهام المستلمة"
          stats={receivedStats}
          variant="received"
        />
        <TaskMetricCard
          icon={<SendRounded sx={{ fontSize: 25 }} />}
          title="المهام المرسلة"
          stats={sentStats}
          variant="sent"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: { xs: 0.9, sm: 1.1, md: 1.4 },
          alignItems: "stretch",
        }}
      >
        {lockedServices.map((service) => (
          <LockedServiceCard
            key={service.title}
            title={service.title}
            description={service.description}
          />
        ))}
      </Box>
    </motion.div>
  );
}