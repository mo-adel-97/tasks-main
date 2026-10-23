// إدارة التعاقدات (P2P) — شاشتين منفصلتين في السايدبار:
//   mode="staff"   → P2P - إدخال الزيارات      (صلاحية "P2P"):  تقريري اليومي، تقاريري، شركاتي، فرصي، مؤشراتي — بياناتي بس.
//   mode="manager" → P2P - التقارير والمتابعة   (صلاحية "إدارة P2P"): لوحة الإدارة، مراجعة التقارير، فرص وشركات الكل.
import React, { useEffect, useState } from "react";
import "../rtl-forms-fix.css";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Tab, Tabs, Typography, alpha } from "@mui/material";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import P2PReportEditor from "./P2PReportEditor";
import P2PDashboard from "./P2PDashboard";
import { P2PCompaniesList, P2POpportunitiesList, P2PReportsList } from "./P2PLists";
import { GREEN, GREEN_DARK, dayName, p2pApi, setP2PScope, useUi } from "./p2pShared";

const MODES = {
  staff: {
    title: "P2P - إدخال الزيارات",
    subtitle: "تقرير الزيارات اليومية للشركات، وشركاتك، والفرص التعاقدية ومتابعتها",
    gradient: `linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 75%)`,
    icon: <HandshakeRoundedIcon sx={{ fontSize: 30 }} />,
    tabs: [
      { label: "التقرير اليومي", icon: <AssignmentRoundedIcon /> },
      { label: "تقاريري", icon: <ListAltRoundedIcon /> },
      { label: "شركاتي", icon: <BusinessRoundedIcon /> },
      { label: "فرصي", icon: <TrendingUpRoundedIcon /> },
      { label: "مؤشراتي", icon: <InsightsRoundedIcon /> }
    ]
  },
  manager: {
    title: "P2P - التقارير والمتابعة",
    subtitle: "أداء فريق إدارة التعاقدات، مراجعة التقارير اليومية، والفرص التعاقدية والشركات",
    gradient: "linear-gradient(135deg,#0d47a1 0%,#062a5f 75%)",
    icon: <InsightsRoundedIcon sx={{ fontSize: 30 }} />,
    tabs: [
      { label: "لوحة الإدارة", icon: <InsightsRoundedIcon /> },
      { label: "التقارير اليومية", icon: <ListAltRoundedIcon /> },
      { label: "الفرص التعاقدية", icon: <TrendingUpRoundedIcon /> },
      { label: "الشركات", icon: <BusinessRoundedIcon /> }
    ]
  }
};

export default function P2PCenter({ mode = "staff" }) {
  const ui = useUi();
  const config = MODES[mode] || MODES.staff;
  // نطاق البيانات للشاشة دي (قبل أي طلب)
  setP2PScope(mode === "manager" ? "all" : "mine");

  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [reportDate, setReportDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMe(null);
    setError("");
    setTab(0);
    p2pApi("/me")
      .then((m) => {
        setMe(m);
        setReportDate(m.today);
      })
      .catch((e) => setError(e.message));
  }, [mode]);

  const allowed = me ? (mode === "manager" ? me.isManager : me.isStaff) : false;
  // الأجزاء الداخلية بتعتمد على role: في الشاشة دي هو نوع الشاشة نفسها
  const view = me ? { ...me, role: mode } : null;

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper
        elevation={0}
        sx={{ p: { xs: 2, md: 2.6 }, mb: 2, borderRadius: 3.5, color: "#fff", background: config.gradient, position: "relative", overflow: "hidden" }}
      >
        <Box sx={{ position: "absolute", insetInlineEnd: -50, top: -60, width: 220, height: 220, borderRadius: "50%", bgcolor: alpha("#fff", 0.07) }} />
        <Box sx={{ position: "absolute", insetInlineEnd: 120, bottom: -70, width: 140, height: 140, borderRadius: "50%", bgcolor: alpha("#fff", 0.05) }} />
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1.5} sx={{ position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: alpha("#fff", 0.16), flexShrink: 0 }}>
              {config.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 19, md: 23 } }}>{config.title}</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.9 }}>{config.subtitle}</Typography>
            </Box>
          </Stack>
          {me ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={me.name} sx={{ fontWeight: 900, bgcolor: alpha("#fff", 0.18), color: "#fff" }} />
              <Chip label={`${dayName(me.today)} ${me.today}`} sx={{ fontWeight: 800, bgcolor: alpha("#fff", 0.12), color: "#fff" }} />
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 700 }}>{error}</Alert>
      ) : !me ? (
        <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress /></Box>
      ) : !allowed ? (
        <Paper elevation={0} sx={{ ...ui.card, py: 7, textAlign: "center" }}>
          <LockRoundedIcon sx={{ fontSize: 46, opacity: 0.4, mb: 1 }} />
          <Typography sx={{ fontWeight: 900 }}>ليس لديك صلاحية على هذه الشاشة</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {mode === "manager" ? "تحتاج صلاحية \"إدارة P2P\"" : "تحتاج صلاحية \"P2P\""} من صلاحيات المستخدمين.
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper elevation={0} sx={{ ...ui.card, mb: 2, px: 1 }}>
            <Tabs
              value={Math.min(tab, config.tabs.length - 1)}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              allowScrollButtonsMobile
              textColor="inherit"
              TabIndicatorProps={{ sx: { height: 3, borderRadius: 2, bgcolor: mode === "manager" ? "#42a5f5" : ui.dark ? "#67C99D" : GREEN } }}
              sx={{
                "& .MuiTab-root": { fontWeight: 900, minHeight: 56, color: "text.secondary" },
                "& .Mui-selected": { color: mode === "manager" ? (ui.dark ? "#90caf9" : "#0d47a1") : ui.greenText }
              }}
            >
              {config.tabs.map((t) => (
                <Tab key={t.label} icon={t.icon} iconPosition="start" label={t.label} />
              ))}
            </Tabs>
          </Paper>

          {mode === "manager" ? (
            <>
              {tab === 0 ? <P2PDashboard me={view} /> : null}
              {tab === 1 ? <P2PReportsList me={view} /> : null}
              {tab === 2 ? <P2POpportunitiesList me={view} /> : null}
              {tab === 3 ? <P2PCompaniesList me={view} /> : null}
            </>
          ) : (
            <>
              {tab === 0 ? <P2PReportEditor key={refreshKey} me={view} date={reportDate} onDateChange={setReportDate} onSaved={() => {}} /> : null}
              {tab === 1 ? (
                <P2PReportsList
                  me={view}
                  onOpenOwnReport={(d) => {
                    setReportDate(d);
                    setRefreshKey((k) => k + 1);
                    setTab(0);
                  }}
                />
              ) : null}
              {tab === 2 ? <P2PCompaniesList me={view} /> : null}
              {tab === 3 ? <P2POpportunitiesList me={view} /> : null}
              {tab === 4 ? <P2PDashboard me={view} /> : null}
            </>
          )}
        </>
      )}
    </Box>
  );
}
