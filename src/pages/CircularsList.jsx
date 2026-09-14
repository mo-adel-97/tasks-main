import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";





const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258"
).replace(/\/+$/, "");

const PRIMARY = "#057445";
const PRIMARY_DARK = "#034f31";
const DANGER = "#8f171a";
const PAGE_BG = "#f4f7f5";
const BORDER = "#dbe7e1";
const TEXT = "#183128";
const MUTED = "#6d8178";
const WHITE = "#ffffff";

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getFileIcon = (file, size = 34) => {
  const extension = String(file?.extension || "").toLowerCase();
  const contentType = String(file?.contentType || "").toLowerCase();

  if (extension === ".pdf" || contentType.includes("pdf")) {
    return <PictureAsPdfRoundedIcon sx={{ color: DANGER, fontSize: size }} />;
  }

  if (
    [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ||
    contentType.startsWith("image/")
  ) {
    return <ImageRoundedIcon sx={{ color: "#3276b1", fontSize: size }} />;
  }

  if ([".doc", ".docx", ".txt"].includes(extension)) {
    return <DescriptionRoundedIcon sx={{ color: PRIMARY, fontSize: size }} />;
  }

  return <InsertDriveFileRoundedIcon sx={{ color: "#667b72", fontSize: size }} />;
};

const swalOptions = {
  confirmButtonColor: PRIMARY,
  cancelButtonColor: DANGER,
  customClass: {
    popup: "swal-cairo-popup",
    title: "swal-cairo-title",
    htmlContainer: "swal-cairo-text",
    confirmButton: "swal-cairo-button",
  },
};

const showErrorAlert = (message) =>
  Swal.fire({
    icon: "error",
    title: "تعذر تحميل المحتوى",
    text: message || "حدث خطأ أثناء تحميل مكتبة المحتوى.",
    confirmButtonText: "حسنًا",
    ...swalOptions,
  });

const CircularsList = () => {
  const userGuid = getUserGuid();

  const [tree, setTree] = useState([]);
  const [activeTabGuid, setActiveTabGuid] = useState("");
  const [activeFolderGuid, setActiveFolderGuid] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTree = async () => {
    if (!userGuid) {
      setTree([]);
      setError("تعذر تحديد المستخدم الحالي.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/circulars/view-tree/${encodeURIComponent(userGuid)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            (response.status === 403
              ? "ليس لديك صلاحية عرض مكتبة المحتوى."
              : "تعذر تحميل مكتبة المحتوى.")
        );
      }

      const data = Array.isArray(result?.data) ? result.data : [];
      setTree(data);

      setActiveTabGuid((current) => {
        if (current && data.some((tab) => String(tab.guid) === String(current))) {
          return current;
        }
        return data[0]?.guid || "";
      });
    } catch (err) {
      console.error("Content library load error:", err);
      setTree([]);
      const message = err?.message || "تعذر تحميل مكتبة المحتوى.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTab = useMemo(
    () => tree.find((tab) => String(tab.guid) === String(activeTabGuid)) || null,
    [tree, activeTabGuid]
  );

  const folders = useMemo(
    () => (Array.isArray(activeTab?.folders) ? activeTab.folders : []),
    [activeTab]
  );

  const activeFolder = useMemo(
    () =>
      folders.find(
        (folder) => String(folder.guid) === String(activeFolderGuid)
      ) || null,
    [folders, activeFolderGuid]
  );

  useEffect(() => {
    if (
      activeFolderGuid &&
      !folders.some((folder) => String(folder.guid) === String(activeFolderGuid))
    ) {
      setActiveFolderGuid("");
    }
  }, [folders, activeFolderGuid]);

  const visibleFolders = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) return folders;

    return folders.filter((folder) =>
      [folder?.name, folder?.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [folders, searchText]);

  const visibleFiles = useMemo(() => {
    const files = Array.isArray(activeFolder?.files) ? activeFolder.files : [];
    const search = searchText.trim().toLowerCase();

    if (!search) return files;

    return files.filter((file) =>
      [file?.displayName, file?.originalFileName, file?.extension]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [activeFolder, searchText]);

  const changeTab = (_, value) => {
    setActiveTabGuid(value);
    setActiveFolderGuid("");
    setSearchText("");
  };

  const enterFolder = (folder) => {
    setActiveFolderGuid(folder.guid);
    setSearchText("");
  };

  const leaveFolder = () => {
    setActiveFolderGuid("");
    setSearchText("");
  };

  const openFile = (fileGuid) => {
    if (!fileGuid || !userGuid) return;
    window.open(
      `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
        fileGuid
      )}/open?userGuid=${encodeURIComponent(userGuid)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const downloadFile = (fileGuid) => {
    if (!fileGuid || !userGuid) return;
    window.open(
      `${API_BASE_URL}/api/circulars/files/${encodeURIComponent(
        fileGuid
      )}/download?userGuid=${encodeURIComponent(userGuid)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <NavigationShell variant="standard" ><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: PAGE_BG,
        fontFamily: "Cairo, Arial, sans-serif",
      }}
    >
      

      <PageContainer
        component="main"
        sx={{
          minHeight: "100vh",
          width: "100%",
          boxSizing: "border-box",
          
          ...navigationContentSx
        }}
      >
        <Stack spacing={1.25} sx={{ width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.4,
              borderRadius: 3,
              border: `1px solid ${BORDER}`,
              bgcolor: WHITE,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.25}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: "#e9f5ef",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MenuBookRoundedIcon sx={{ color: PRIMARY, fontSize: 27 }} />
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Cairo", fontWeight: 950, color: TEXT }}
                  >
                    مكتبة المحتوى
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "Cairo", color: MUTED }}
                  >
                    الأقسام والمجلدات والملفات في مكان واحد
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadTree}
                disabled={loading}
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  borderRadius: 2.5,
                  borderColor: BORDER,
                  color: PRIMARY,
                  "& .MuiButton-startIcon": { ml: 0.7, mr: 0 },
                }, uiLayout.buttonSx)}
              >
                تحديث
              </Button>
            </Stack>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 3, fontFamily: "Cairo" }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 3,
                border: `1px solid ${BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: WHITE,
              }}
            >
              <Stack alignItems="center" spacing={1.3}>
                <CircularProgress sx={{ color: PRIMARY }} />
                <Typography sx={{ fontFamily: "Cairo", color: MUTED }}>
                  جاري تحميل مكتبة المحتوى...
                </Typography>
              </Stack>
            </Paper>
          ) : tree.length === 0 && !error ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 360,
                borderRadius: 3,
                border: `1px dashed ${BORDER}`,
                display: "grid",
                placeItems: "center",
                bgcolor: WHITE,
                textAlign: "center",
                p: 3,
              }}
            >
              <Box>
                <FolderRoundedIcon sx={{ fontSize: 62, color: "#a9bbb3" }} />
                <Typography
                  variant="h6"
                  sx={{ mt: 1, fontFamily: "Cairo", fontWeight: 900, color: TEXT }}
                >
                  لا توجد أقسام حاليًا
                </Typography>
              </Box>
            </Paper>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                  bgcolor: WHITE,
                  overflow: "hidden",
                }}
              >
                <Tabs
                  value={activeTabGuid || false}
                  onChange={changeTab}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 52,
                    px: 0.75,
                    "& .MuiTab-root": {
                      minHeight: 52,
                      minWidth: 120,
                      px: 2,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#61756c",
                    },
                    "& .Mui-selected": {
                      color: `${PRIMARY} !important`,
                      bgcolor: "#eef7f2",
                    },
                    "& .MuiTabs-indicator": {
                      height: 3,
                      bgcolor: PRIMARY,
                      borderRadius: 3,
                    },
                  }}
                >
                  {tree.map((tab) => (
                    <Tab key={tab.guid} value={tab.guid} label={tab.name} />
                  ))}
                </Tabs>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                  bgcolor: WHITE,
                  overflow: "hidden",
                  minHeight: 500,
                }}
              >
                <Box
                  sx={{
                    px: { xs: 1.5, md: 2 },
                    py: 1.3,
                    borderBottom: `1px solid ${BORDER}`,
                    bgcolor: "#fbfdfc",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    justifyContent="space-between"
                    spacing={1.2}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.7}
                      sx={{ minWidth: 0 }}
                    >
                      {activeFolder ? (
                        <Button
                          onClick={leaveFolder}
                          startIcon={<ArrowBackRoundedIcon />}
                          sx={uiLayout.withUiSx({
                            minWidth: "auto",
                            px: 1,
                            color: PRIMARY,
                            fontFamily: "Cairo",
                            fontWeight: 900,
                            "& .MuiButton-startIcon": { ml: 0.4, mr: 0 },
                          }, uiLayout.buttonSx)}
                        >
                          رجوع
                        </Button>
                      ) : (
                        <HomeRoundedIcon sx={{ color: PRIMARY, fontSize: 22 }} />
                      )}

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          color: MUTED,
                          whiteSpace: "nowrap",
                        }}
                      >
                        مكتبة المحتوى
                      </Typography>

                      <Typography sx={{ color: "#a3b2ac" }}>/</Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: activeFolder ? MUTED : TEXT,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {activeTab?.name || ""}
                      </Typography>

                      {activeFolder && (
                        <>
                          <Typography sx={{ color: "#a3b2ac" }}>/</Typography>
                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 950,
                              color: TEXT,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {activeFolder.name}
                          </Typography>
                        </>
                      )}
                    </Stack>

                    <TextField InputLabelProps={{ shrink: true }}
                      size="small"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder={
                        activeFolder
                          ? "ابحث في الملفات..."
                          : "ابحث في المجلدات..."
                      }
                      sx={uiLayout.withUiSx({
                        width: { xs: "100%", md: 330 },
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2.5,
                          bgcolor: WHITE,
                        },
                        "& input": { fontFamily: "Cairo" },
                      }, uiLayout.formFieldSx)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon sx={{ color: "#82968d" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </Box>

                {!activeFolder ? (
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    {activeTab?.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          fontFamily: "Cairo",
                          color: MUTED,
                        }}
                      >
                        {activeTab.description}
                      </Typography>
                    )}

                    {visibleFolders.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <FolderRoundedIcon
                          sx={{ fontSize: 58, color: "#b4c4bd" }}
                        />
                        <Typography
                          sx={{
                            mt: 1,
                            fontFamily: "Cairo",
                            fontWeight: 850,
                            color: MUTED,
                          }}
                        >
                          {searchText
                            ? "لا توجد مجلدات مطابقة للبحث."
                            : "لا توجد مجلدات داخل هذا القسم."}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                            lg: "repeat(5, minmax(0, 1fr))",
                            xl: "repeat(6, minmax(0, 1fr))",
                          },
                          gap: 1.25,
                        }}
                      >
                        {visibleFolders.map((folder) => {
                          const count = Array.isArray(folder.files)
                            ? folder.files.length
                            : 0;

                          return (
                            <Paper
                              key={folder.guid}
                              elevation={0}
                              role="button"
                              tabIndex={0}
                              onClick={() => enterFolder(folder)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") enterFolder(folder);
                              }}
                              sx={{
                                p: 1.5,
                                minHeight: 135,
                                borderRadius: 3,
                                border: `1px solid ${BORDER}`,
                                bgcolor: "#fcfefd",
                                cursor: "pointer",
                                transition: "all .18s ease",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  borderColor: "#a9cdbb",
                                  boxShadow:
                                    "0 8px 24px rgba(5,116,69,0.09)",
                                  bgcolor: "#ffffff",
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                              >
                                <FolderRoundedIcon
                                  sx={{
                                    fontSize: 48,
                                    color: "#d7a429",
                                    filter:
                                      "drop-shadow(0 3px 4px rgba(0,0,0,.08))",
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={`${count}`}
                                  sx={{
                                    height: 23,
                                    fontFamily: "Cairo",
                                    fontWeight: 900,
                                    bgcolor: "#edf5f1",
                                    color: PRIMARY,
                                  }}
                                />
                              </Stack>

                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 950,
                                    color: TEXT,
                                    lineHeight: 1.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {folder.name}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "Cairo",
                                    color: MUTED,
                                  }}
                                >
                                  {count} ملف
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1.7 }}
                    >
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: "#fff7dc",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <FolderOpenRoundedIcon
                            sx={{ color: "#c89512", fontSize: 31 }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 950,
                              color: TEXT,
                            }}
                          >
                            {activeFolder.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "Cairo", color: MUTED }}
                          >
                            {visibleFiles.length} ملف
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>

                    {activeFolder.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          fontFamily: "Cairo",
                          color: MUTED,
                        }}
                      >
                        {activeFolder.description}
                      </Typography>
                    )}

                    {visibleFiles.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <InsertDriveFileRoundedIcon
                          sx={{ fontSize: 56, color: "#b7c5bf" }}
                        />
                        <Typography
                          sx={{
                            mt: 1,
                            fontFamily: "Cairo",
                            fontWeight: 850,
                            color: MUTED,
                          }}
                        >
                          {searchText
                            ? "لا توجد ملفات مطابقة للبحث."
                            : "هذا المجلد فارغ."}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            lg: "repeat(3, minmax(0, 1fr))",
                            xl: "repeat(4, minmax(0, 1fr))",
                          },
                          gap: 1.1,
                        }}
                      >
                        {visibleFiles.map((file) => (
                          <Paper
                            key={file.guid}
                            elevation={0}
                            sx={{
                              p: 1.3,
                              borderRadius: 2.8,
                              border: `1px solid ${BORDER}`,
                              bgcolor: "#fcfefd",
                              transition: "all .18s ease",
                              "&:hover": {
                                borderColor: "#b4d0c2",
                                boxShadow: "0 7px 20px rgba(5,116,69,.07)",
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.1}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2.5,
                                  bgcolor: WHITE,
                                  border: `1px solid ${BORDER}`,
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {getFileIcon(file)}
                              </Box>

                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Tooltip
                                  title={
                                    file.displayName ||
                                    file.originalFileName ||
                                    ""
                                  }
                                >
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 900,
                                      color: TEXT,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {file.displayName || file.originalFileName}
                                  </Typography>
                                </Tooltip>

                                <Stack
                                  direction="row"
                                  spacing={0.8}
                                  useFlexGap
                                  flexWrap="wrap"
                                  sx={{ mt: 0.25 }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{ fontFamily: "Cairo", color: MUTED }}
                                  >
                                    {formatBytes(file.fileSize)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontFamily: "Cairo", color: MUTED }}
                                  >
                                    {formatDate(file.createdAt)}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.7} sx={{ mt: 1.2 }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<OpenInNewRoundedIcon />}
                                onClick={() => openFile(file.guid)}
                                sx={uiLayout.withUiSx({
                                  flex: 1,
                                  minHeight: 34,
                                  borderRadius: 2.2,
                                  bgcolor: PRIMARY,
                                  fontFamily: "Cairo",
                                  fontWeight: 900,
                                  boxShadow: "none",
                                  "&:hover": {
                                    bgcolor: PRIMARY_DARK,
                                    boxShadow: "none",
                                  },
                                  "& .MuiButton-startIcon": {
                                    ml: 0.5,
                                    mr: 0,
                                  },
                                }, uiLayout.buttonSx)}
                              >
                                فتح
                              </Button>

                              <Tooltip title="تنزيل الملف">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => downloadFile(file.guid)}
                                  sx={uiLayout.withUiSx({
                                    minWidth: 42,
                                    borderRadius: 2.2,
                                    borderColor: BORDER,
                                    color: PRIMARY,
                                  }, uiLayout.buttonSx)}
                                >
                                  <DownloadRoundedIcon fontSize="small" />
                                </Button>
                              </Tooltip>
                            </Stack>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </>
          )}
        </Stack>
      </PageContainer>

      <style>
        {`
          .swal-cairo-popup,
          .swal-cairo-title,
          .swal-cairo-text,
          .swal-cairo-button {
            font-family: Cairo, Arial, sans-serif !important;
          }

          .swal-cairo-popup {
            direction: rtl !important;
          }

          .swal-cairo-title,
          .swal-cairo-text {
            text-align: center !important;
          }
        `}
      </style>
    </Box></NavigationShell>
  );
};

export default CircularsList;
