import React from "react";
import { Card, Tabs, Tab, Box, Badge, useTheme, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Dashboard,
  Work,
  EmojiEvents,
  Announcement,
  MeetingRoom,
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
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isCompact = useMediaQuery(theme.breakpoints.down("lg"));

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userJob = userData?.userJop;
  const isSupervisorLocal = isSupervisor || userJob === 9;
  const isHRLocal = !!isHRUser;

  const tabs = [
    {
      id: 0,
      label: "نظرة عامة",
      icon: <Dashboard />,
      visible: true,
    },
    {
      id: 1,
      label: "المهام والأداء",
      icon: <Work />,
      visible: true,
    },
    {
      id: 3,
      label: "غرفة الاجتماعات",
      icon: <MeetingRoom />,
      visible: true,
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
              fontWeight: 900,
              fontSize: { xs: "0.55rem", sm: "0.62rem", md: "0.68rem" },
              minWidth: { xs: 16, sm: 18, md: 20 },
              height: { xs: 16, sm: 18, md: 20 },
              borderRadius: 999,
            },
          }}
        >
          <Announcement />
        </Badge>
      ),
      visible: true,
    },
    {
      id: 6,
      label: "موظف الشهر والتقييمات",
      icon: <EmojiEvents />,
      visible: isSupervisorLocal,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);

  return (
    <Card
      sx={{
        mt: { xs: 1, sm: 1.4, md: 2 },
        mb: { xs: 1.2, sm: 1.8, md: 2.5 },
        p: { xs: 0.35, sm: 0.55, md: 0.8 },
        borderRadius: { xs: 2.2, sm: 3, md: 4 },
        boxShadow: `0 10px 28px ${alpha(COLOR_SCHEME.primary, 0.1)}`,
        background: `linear-gradient(135deg, ${COLOR_SCHEME.white} 0%, #f4fbf7 100%)`,
        border: `1px solid ${COLOR_SCHEME.primaryLight}`,
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: `linear-gradient(90deg, ${alpha(
            COLOR_SCHEME.primary,
            0.1
          )}, transparent, ${alpha(COLOR_SCHEME.primary, 0.06)})`,
        },
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant={isCompact ? "scrollable" : "standard"}
        scrollButtons={isCompact ? "auto" : false}
        allowScrollButtonsMobile
        sx={{
          minHeight: { xs: 46, sm: 52, md: 58 },
          position: "relative",
          zIndex: 1,
          width: "100%",
          "& .MuiTabs-flexContainer": {
            justifyContent: isCompact ? "flex-start" : "center",
            gap: { xs: 0.2, sm: 0.35, md: 0.7 },
          },
          "& .MuiTab-root": {
            fontFamily: 'Cairo, Arial, sans-serif',
            fontWeight: 900,
            fontSize: { xs: "0.62rem", sm: "0.71rem", md: "0.82rem", lg: "0.9rem" },
            minHeight: { xs: 42, sm: 48, md: 54 },
            minWidth: { xs: 90, sm: 108, md: 126, lg: 138 },
            mx: { xs: 0.1, sm: 0.2, md: 0.35 },
            px: { xs: 0.65, sm: 0.9, md: 1.15 },
            py: { xs: 0.45, sm: 0.6, md: 0.75 },
            borderRadius: { xs: 1.8, sm: 2.2, md: 3 },
            color: COLOR_SCHEME.text,
            border: "1px solid transparent",
            transition: "all 0.22s ease",
            textTransform: "none",
            whiteSpace: "nowrap",
            "& svg": {
              fontSize: { xs: 17, sm: 19, md: 21 },
              color: COLOR_SCHEME.primary,
              transition: "all 0.22s ease",
            },
            "&:hover": {
              background: alpha(COLOR_SCHEME.primary, 0.08),
              borderColor: alpha(COLOR_SCHEME.primary, 0.16),
              transform: isPhone ? "none" : "translateY(-1px)",
            },
            "&.Mui-selected": {
              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary}, ${COLOR_SCHEME.primaryDark})`,
              color: COLOR_SCHEME.white,
              boxShadow: `0 7px 18px ${alpha(COLOR_SCHEME.primary, 0.2)}`,
              "& svg": { color: COLOR_SCHEME.white },
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: COLOR_SCHEME.accent,
            height: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: 999,
          },
          "& .MuiTabs-scrollButtons": {
            width: { xs: 28, sm: 32 },
            color: COLOR_SCHEME.primary,
            borderRadius: 2,
            "&:hover": { backgroundColor: alpha(COLOR_SCHEME.primary, 0.08) },
            "&.Mui-disabled": { opacity: 0.2 },
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: { xs: 0.35, sm: 0.5, md: 0.65 },
                  flexDirection: "row",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.icon}
                <Box component="span">{tab.label}</Box>
              </Box>
            }
            sx={{
              "& .MuiTab-iconWrapper": { margin: 0 },
            }}
          />
        ))}
      </Tabs>
    </Card>
  );
};

export default DashboardTabs;