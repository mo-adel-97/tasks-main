import PageContainer from '../components/common/PageContainer';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useState } from "react";

import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { Routes, Route } from "react-router-dom";

import HomeTab from "./HomeTab";
import HrEmployeeHomePage from "./HrEmployeeHomePage";
import TasksTab from "./TasksTab";
import EmployeeOfTheMonthBanner from "../components/EmployeeOfTheMonthBanner";
import UpdateDialog from "../components/UpdateDialog";




const UPDATE_URL =
  "https://filesregsiteration.sstli.com/erp/check_update.php";

export default function Dashboard() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    {
      noSsr: true,
    }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [showUpdateDialog, setShowUpdateDialog] =
    useState(false);

  const [updateData, setUpdateData] =
    useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(UPDATE_URL, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Update check failed"
          );
        }

        return res.json();
      })
      .then((data) => {
        if (
          !data?.success ||
          !data?.has_new ||
          !data?.latest
        ) {
          return;
        }

        const key =
          `update_seen_${data.latest.zip_name}_${data.latest.uploaded_at}`;

        const alreadySeen =
          localStorage.getItem(key);

        if (!alreadySeen) {
          setUpdateData(data.latest);
          setShowUpdateDialog(true);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(
            "Update check failed:",
            err
          );
        }
      });

    return () =>
      controller.abort();
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const handleCloseUpdate = () => {
    if (updateData) {
      const key =
        `update_seen_${updateData.zip_name}_${updateData.uploaded_at}`;

      localStorage.setItem(
        key,
        "true"
      );
    }

    setShowUpdateDialog(false);
  };

  const handleDownloadUpdate = () => {
    if (updateData) {
      const key =
        `update_seen_${updateData.zip_name}_${updateData.uploaded_at}`;

      localStorage.setItem(
        key,
        "true"
      );

      if (updateData.download_url) {
        window.open(
          updateData.download_url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }

    setShowUpdateDialog(false);
  };

  return (
    <NavigationShell variant="standard" mobileOpen={
          mobileSidebarOpen
        } onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      dir="rtl"
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background:
          theme.palette.mode === 'dark'
            ? theme.palette.background.default
            : "linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%)",
        fontFamily:
          'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
        position: "relative",
      }}
    >
      <EmployeeOfTheMonthBanner />

      <UpdateDialog
        open={showUpdateDialog}
        update={updateData}
        onClose={handleCloseUpdate}
        onDownload={handleDownloadUpdate}
      />

      {!isDesktop && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            zIndex: 1401,
            background:
              "rgba(255,255,255,0.95)",
            backdropFilter:
              "blur(14px)",
            color: "#17372b",
            borderBottom:
              "1px solid rgba(5,117,70,0.12)",
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)",
              },
              px: {
                xs: 0.8,
                sm: 1.2,
                md: 1.6,
              },
              gap: 0.8,
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setMobileSidebarOpen(
                  (current) => !current
                );
              }}
              aria-label={
                mobileSidebarOpen
                  ? "إغلاق القائمة"
                  : "فتح القائمة"
              }
              aria-expanded={
                mobileSidebarOpen
              }
              sx={{
                width: {
                  xs: 36,
                  sm: 40,
                  md: 42,
                },
                height: {
                  xs: 36,
                  sm: 40,
                  md: 42,
                },
                flexShrink: 0,
                color: "#fff",
                background:
                  "linear-gradient(135deg, #057546, #034d31)",
                boxShadow:
                  "0 6px 16px rgba(5,117,70,0.22)",

                "&:hover": {
                  background:
                    "linear-gradient(135deg, #034d31, #057546)",
                },
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 22,
                    md: 23,
                  },
                }}
              />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          ml: 0,
          mr: 0,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <PageContainer
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",

            

            

            "& img, & video, & canvas":
              {
                maxWidth: "100%",
                height: "auto",
              },

            "& .MuiDataGrid-root, & .MuiTableContainer-root":
              {
                maxWidth: "100%",
              },

            "& .MuiTypography-root":
              {
                overflowWrap:
                  "anywhere",
              },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "100%",
              mx: "auto",
              minWidth: 0,
            }}
          >
            <Routes>
              <Route
                index
                element={<HrEmployeeHomePage />}
              />

              <Route
                path="home"
                element={<HrEmployeeHomePage />}
              />

              <Route
                path="classic-home"
                element={<HomeTab />}
              />

              <Route
                path="tasks"
                element={<TasksTab />}
              />
            </Routes>
          </Box>
        </PageContainer>
      </Box>
    </Box></NavigationShell>
  );
}