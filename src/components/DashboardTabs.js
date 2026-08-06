import React from "react";
import { Card, Tabs, Tab, Box, Badge, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Dashboard, Work, EventAvailable, BeachAccess, Paid, Person, Security,
  EmojiEvents, Announcement, MeetingRoom
} from "@mui/icons-material";

const COLOR_SCHEME = {
  primary: "#057546",
  primaryDark: "#034d31",
  primaryLight: "#e6f3ee",
  accent: "#ae1e21",
  white: "#fefefe",
  text: "#1f2d3d",
};

const DashboardTabs = ({
  activeTab,
  setActiveTab,
  isHRUser,
  isSupervisor,
  pendingRequestsCount = 0,
  unseenPostsCount = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userJob = userData?.userJop;
  const isSupervisorLocal = isSupervisor || userJob === 9;
  const isHRLocal = !!isHRUser;

  // إنشاء قائمة التبويبات بشكل ديناميكي
  const tabs = [
    {
      id: 0,
      label: "نظرة عامة",
      icon: <Dashboard />,
      visible: true
    },
    {
      id: 1,
      label: "المهام والأداء",
      icon: <Work />,
      visible: true
    },
    // {
    //   id: 2,
    //   label: "الحضور",
    //   icon: <EventAvailable />,
    //   visible: true
    // },
    {
      id: 3,
      label: "غرفة الاجتماعات",
      icon: <MeetingRoom />,
      visible: true
    },
    {
      id: 4,
      label: "الإعلانات والمنشورات",
      icon: (
        <Badge
          badgeContent={unseenPostsCount > 0 ? unseenPostsCount : 0}
          color="error"
          overlap="circular"
          sx={{
            "& .MuiBadge-badge": {
              backgroundColor: COLOR_SCHEME.accent,
              color: "white",
              fontWeight: "bold",
              fontSize: "0.7rem",
              minWidth: "20px",
              height: "20px",
              borderRadius: "10px",
            },
          }}
        >
          <Announcement sx={{ color: COLOR_SCHEME.primary }} />
        </Badge>
      ),
      visible: true
    },
    // {
    //   id: 5,
    //   label: isHRLocal ? "إدارة الطلبات" : "الإجازات و الأذونات",
    //   icon: (
    //     <Badge
    //       badgeContent={isHRLocal ? pendingRequestsCount : 0}
    //       color="error"
    //       overlap="circular"
    //       sx={{
    //         "& .MuiBadge-badge": {
    //           backgroundColor: COLOR_SCHEME.accent,
    //           color: "white",
    //           fontWeight: "bold",
    //           fontSize: "0.7rem",
    //           minWidth: "20px",
    //           height: "20px",
    //           borderRadius: "10px",
    //         },
    //       }}
    //     >
    //       <BeachAccess />
    //     </Badge>
    //   ),
    //   visible: true
    // },
    {
      id: 6,
      label: "موظف الشهر و التقيمات",
      icon: <EmojiEvents />,
      visible: isSupervisorLocal
    },
    // {
    //   id: 7,
    //   label: "صلاحيات الموظفين",
    //   icon: <Security />,
    //   visible: isHRLocal
    // },
    // {
    //   id: 8,
    //   label: "الرواتب",
    //   icon: <Paid />,
    //   visible: true
    // },
    // {
    //   id: 9,
    //   label: "البيانات",
    //   icon: <Person />,
    //   visible: true
    // }
  ];

  // تصفية التبويبات المرئية فقط
  const visibleTabs = tabs.filter(tab => tab.visible);

  return (
    <Card
      sx={{
        mt: 3,
        mb: 4,
        p: { xs: 0.75, md: 1 },
        borderRadius: 4,
        boxShadow: `0 14px 38px ${alpha(COLOR_SCHEME.primary, 0.12)}`,
        background: `linear-gradient(135deg, ${COLOR_SCHEME.white} 0%, #f4fbf7 100%)`,
        border: `1px solid ${COLOR_SCHEME.primaryLight}`,
        display: "flex",
        justifyContent: "center",
        overflow: "visible",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          pointerEvents: "none",
          background: `linear-gradient(90deg, ${alpha(COLOR_SCHEME.primary, 0.12)}, transparent, ${alpha(COLOR_SCHEME.primary, 0.08)})`,
        },
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : false}
        allowScrollButtonsMobile
        sx={{
          minHeight: 70,
          position: "relative",
          zIndex: 1,
          width: "100%",
          "& .MuiTabs-flexContainer": {
            justifyContent: isMobile ? "flex-start" : "center",
            gap: { xs: 0.5, md: 1 },
          },
          "& .MuiTab-root": {
            fontWeight: 950,
            fontSize: isMobile ? "0.78rem" : "0.95rem",
            minHeight: 58,
            minWidth: isMobile ? 112 : 140,
            mx: { xs: 0.25, md: 0.5 },
            px: { xs: 1, md: 1.5 },
            borderRadius: 3,
            color: COLOR_SCHEME.text,
            border: `1px solid transparent`,
            transition: "all 0.25s ease",
            flexDirection: isMobile ? "column" : "row",
            "& svg": {
              color: COLOR_SCHEME.primary,
              transition: "all 0.25s ease",
            },
            "&:hover": {
              background: alpha(COLOR_SCHEME.primary, 0.08),
              borderColor: alpha(COLOR_SCHEME.primary, 0.18),
              transform: "translateY(-2px)",
            },
            "&.Mui-selected": {
              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary}, ${COLOR_SCHEME.primaryDark})`,
              color: COLOR_SCHEME.white,
              boxShadow: `0 10px 22px ${alpha(COLOR_SCHEME.primary, 0.24)}`,
              "& svg": {
                color: COLOR_SCHEME.white,
              },
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: COLOR_SCHEME.accent,
            height: 4,
            borderRadius: 999,
          },
          "& .MuiTabs-scrollButtons": {
            color: COLOR_SCHEME.primary,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: alpha(COLOR_SCHEME.primary, 0.08),
            },
            "&.Mui-disabled": {
              opacity: 0.3,
            },
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: isMobile ? 0.4 : 0.8,
                flexDirection: isMobile ? "column" : "row",
                whiteSpace: "nowrap",
              }}>
                {tab.icon}
                <span>{tab.label}</span>
              </Box>
            }
            sx={{
              // إزالة التصميم الافتراضي للأيقونة
              "& .MuiTab-iconWrapper": {
                margin: 0
              }
            }}
          />
        ))}
      </Tabs>
    </Card>
  );
};

export default DashboardTabs;