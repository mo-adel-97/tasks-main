import React from "react";
import { Card, Tabs, Tab, Box, Badge, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Dashboard,
  Work,
  EmojiEvents,
  Announcement,
  MeetingRoom,
} from "@mui/icons-material";

const COLORS = {
  primary: "#057546",
  primaryDark: "#034d31",
  primaryLight: "#e6f3ee",
  accent: "#ae1e21",
  white: "#fff",
  text: "#1f2d3d",
};

export default function DashboardTabs({
  activeTab,
  setActiveTab,
  isHRUser,
  isSupervisor,
  unseenPostsCount = 0,
}) {
  const compact = useMediaQuery("(max-width:899px)");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isSupervisorLocal = isSupervisor || Number(userData?.userJop) === 9;

  const tabs = [
    { id: 0, label: "نظرة عامة", icon: <Dashboard />, visible: true },
    { id: 1, label: "المهام والأداء", icon: <Work />, visible: true },
    { id: 3, label: "غرفة الاجتماعات", icon: <MeetingRoom />, visible: true },
    {
      id: 4,
      label: "الإعلانات والمنشورات",
      icon: (
        <>
          <Announcement />
        </>
      ),
      visible: true,
    },
    {
      id: 6,
      label: "موظف الشهر والتقييمات",
      icon: <EmojiEvents />,
      visible: isSupervisorLocal,
    },
  ].filter((tab) => tab.visible);

  return (
    <Card
      sx={{
        mt: 0.45,
        mb: 0.7,
        p: 0.25,
        borderRadius: 2.5,
        boxShadow: `0 5px 16px ${alpha(COLORS.primary, 0.08)}`,
        background: "#fff",
        border: `1px solid ${alpha(COLORS.primary, 0.12)}`,
        overflow: "hidden",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant={compact ? "scrollable" : "standard"}
        scrollButtons={compact ? "auto" : false}
        allowScrollButtonsMobile
        sx={{
          minHeight: 33,
          "& .MuiTabs-flexContainer": {
            justifyContent: compact ? "flex-start" : "center",
            gap: 0.35,
          },
          "& .MuiTab-root": {
            minHeight: 31,
            minWidth: compact ? 82 : 96,
            px: { xs: 0.55, md: 0.7 },
            py: 0.25,
            borderRadius: 2,
            fontWeight: 850,
            fontSize: { xs: "0.75rem", md: "0.75rem" },
            color: COLORS.text,
            transition: "background-color .18s ease, color .18s ease",
            "& svg": {
              fontSize: 16,
              color: COLORS.primary,
            },
            "&:hover": {
              backgroundColor: alpha(COLORS.primary, 0.07),
            },
            "&.Mui-selected": {
              color: COLORS.white,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              boxShadow: `0 4px 10px ${alpha(COLORS.primary, 0.18)}`,
              "& svg": { color: COLORS.white },
            },
          },
          "& .MuiTabs-indicator": {
            display: "none",
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.38,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Box>
            }
          />
        ))}
      </Tabs>
    </Card>
  );
}
