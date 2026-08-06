import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Paper,
} from "@mui/material";

import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CampaignIcon from "@mui/icons-material/Campaign";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import Sidebar from "../components/Sidebar";

const SIDEBAR_WIDTH = 280;
const API_BASE_URL = "https://sstli.com/api";
const GET_CIRCULARS_API = `${API_BASE_URL}/get_circulars.php`;

const PRIMARY = "#057445";
const DANGER = "#8f171a";
const WHITE = "#ffffff";
const PAGE_BG = "#f7faf8";
const BORDER = "#dfeae4";

const swalMain = {
  confirmButtonColor: PRIMARY,
  cancelButtonColor: DANGER,
  customClass: {
    popup: "swal-rtl-popup",
    title: "swal-rtl-title",
    htmlContainer: "swal-rtl-text",
  },
};

const CircularsList = () => {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = (icon, titleText) => {
    Swal.fire({
      toast: true,
      position: "top",
      icon,
      title: titleText,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      ...swalMain,
    });
  };

  const showLoading = (titleText) => {
    Swal.fire({
      title: titleText,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...swalMain,
    });
  };

  const normalizeFileUrl = (filePath = "") => {
    const rawPath = String(filePath || "").trim();

    if (!rawPath) return "";

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return encodeURI(rawPath);
    }

    const cleanPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
    const cleanBase = API_BASE_URL.replace(/\/+$/, "");

    return encodeURI(`${cleanBase}/${cleanPath}`);
  };

  const getFileIcon = (fileType = "", fileName = "") => {
    const type = String(fileType || "").toLowerCase();
    const name = String(fileName || "").toLowerCase();

    if (type.includes("pdf") || name.endsWith(".pdf")) {
      return <PictureAsPdfIcon sx={{ color: DANGER }} />;
    }

    if (
      type.includes("image") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp") ||
      name.endsWith(".gif")
    ) {
      return <ImageIcon sx={{ color: PRIMARY }} />;
    }

    if (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      type.includes("word") ||
      type.includes("document")
    ) {
      return <DescriptionIcon sx={{ color: PRIMARY }} />;
    }

    return <InsertDriveFileIcon sx={{ color: PRIMARY }} />;
  };

  const getCircularFiles = (item) => {
    if (!item) return [];

    if (Array.isArray(item.Files)) return item.Files;
    if (Array.isArray(item.files)) return item.files;

    if (typeof item.Files === "string" && item.Files.trim()) {
      try {
        const parsed = JSON.parse(item.Files);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }

    const singlePath = item.FilePath || item.filePath || "";
    const singleName = item.FileName || item.fileName || "";
    const singleType = item.FileType || item.fileType || "";

    if (singlePath) {
      return [
        {
          Id: item.FileId || item.fileId || null,
          CircularId: item.Id || item.id,
          FileName: singleName || "ملف مرفق",
          FilePath: singlePath,
          FileType: singleType,
        },
      ];
    }

    return [];
  };

  const getFileName = (fileItem) => {
    return fileItem?.FileName || fileItem?.fileName || "ملف مرفق";
  };

  const getFilePath = (fileItem) => {
    return fileItem?.FilePath || fileItem?.filePath || "";
  };

  const fetchCirculars = async (withAlert = false) => {
    try {
      setLoading(true);

      if (withAlert) {
        showLoading("جاري تحديث التعميمات...");
      }

      const res = await fetch(GET_CIRCULARS_API);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "حدث خطأ أثناء تحميل التعميمات");
      }

      setCirculars(Array.isArray(data.data) ? data.data : []);

      if (withAlert) {
        Swal.close();
        showToast("success", "تم تحديث التعميمات");
      }
    } catch (error) {
      if (withAlert) Swal.close();

      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error.message || "حدث خطأ غير متوقع",
        ...swalMain,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars(false);
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    try {
      return new Date(dateValue).toLocaleString("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateValue;
    }
  };

  const openFile = (fileItem) => {
    const fileUrl = normalizeFileUrl(getFilePath(fileItem));

    if (!fileUrl) {
      Swal.fire({
        icon: "warning",
        title: "لا يوجد ملف",
        text: "لا يوجد رابط لهذا الملف.",
        ...swalMain,
      });
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const FilesList = ({ item }) => {
    const files = getCircularFiles(item);

    if (files.length === 0) {
      return (
        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            borderRadius: 3,
            background: "#fff7f7",
            border: "1px solid #f1c9c9",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900,
              color: DANGER,
            }}
          >
            لا توجد ملفات مرفقة لهذا التعميم.
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mt: 2.5,
          p: 1.5,
          borderRadius: 3,
          background: "#fbfdfc",
          border: `1px solid ${BORDER}`,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontWeight: 950,
            color: DANGER,
            mb: 1.2,
          }}
        >
          الملفات المرفقة: {files.length}
        </Typography>

        <Stack spacing={1}>
          {files.map((fileItem, index) => {
            const fileName = getFileName(fileItem);
            const filePath = getFilePath(fileItem);
            const hasFile = Boolean(normalizeFileUrl(filePath));

            return (
              <Box
                key={fileItem.Id || fileItem.id || `${fileName}-${index}`}
                sx={{
                  p: 1.1,
                  borderRadius: 2.5,
                  background: WHITE,
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 3,
                      background: "#fbfdfc",
                      border: `1px solid ${BORDER}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(fileItem.FileType || fileItem.fileType, fileName)}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#17251f",
                      wordBreak: "break-word",
                    }}
                  >
                    {fileName}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  disabled={!hasFile}
                  onClick={() => openFile(fileItem)}
                  sx={{
                    flexShrink: 0,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 3,
                    px: 2,
                    background: PRIMARY,
                    boxShadow: "0 8px 18px rgba(5,116,69,0.22)",
                    "&:hover": { background: DANGER },
                    "& .MuiButton-startIcon": {
                      ml: 1,
                      mr: 0,
                    },
                  }}
                >
                  فتح
                </Button>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background: PAGE_BG,
        fontFamily: "Cairo, Arial, sans-serif",
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          p: "20px",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              mb: 2.5,
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              background: `linear-gradient(135deg, ${PRIMARY} 0%, ${DANGER} 120%)`,
              color: WHITE,
              boxShadow: "0 16px 38px rgba(5,116,69,0.18)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 10% 10%, rgba(255,255,255,0.22), transparent 30%)",
              }}
            />

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <LibraryBooksIcon sx={{ fontSize: 34 }} />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 950,
                      fontFamily: "Cairo",
                      lineHeight: 1.6,
                    }}
                  >
                    التعميمات
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.92,
                      mt: 0.3,
                      fontFamily: "Cairo",
                      lineHeight: 1.9,
                    }}
                  >
                    هنا تظهر كل التعميمات والملفات المرفقة بها.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`${circulars.length} تعميم`}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: WHITE,
                    color: PRIMARY,
                    px: 1,
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchCirculars(true)}
                  disabled={loading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.16)",
                    color: WHITE,
                    border: "1px solid rgba(255,255,255,0.25)",
                    boxShadow: "none",
                    "&:hover": {
                      background: "rgba(255,255,255,0.24)",
                      boxShadow: "none",
                    },
                    "& .MuiButton-startIcon": {
                      ml: 1,
                      mr: 0,
                    },
                  }}
                >
                  تحديث
                </Button>
              </Stack>
            </Box>
          </Box>

          {loading && (
            <Paper
              elevation={0}
              sx={{
                minHeight: 320,
                borderRadius: 4,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 10px 28px rgba(5,116,69,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: WHITE,
              }}
            >
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress sx={{ color: PRIMARY }} />

                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: PRIMARY,
                  }}
                >
                  جاري تحميل التعميمات...
                </Typography>
              </Stack>
            </Paper>
          )}

          {!loading && circulars.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                minHeight: 300,
                borderRadius: 4,
                border: `1px solid ${BORDER}`,
                boxShadow: "0 10px 28px rgba(5,116,69,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: WHITE,
                p: 4,
                textAlign: "center",
              }}
            >
              <Stack alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    background: "#eef7f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderOpenIcon sx={{ fontSize: 46, color: PRIMARY }} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    color: DANGER,
                  }}
                >
                  لا توجد تعميمات حالياً
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Cairo",
                    color: "#60736b",
                    lineHeight: 1.9,
                  }}
                >
                  عند رفع تعميم جديد من الإدارة سيظهر هنا مباشرة.
                </Typography>
              </Stack>
            </Paper>
          )}

          {!loading && circulars.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.2,
              }}
            >
              {circulars.map((item) => (
                <Card
                  key={item.Id || item.Guid}
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    border: `1px solid ${BORDER}`,
                    boxShadow: "0 10px 28px rgba(5,116,69,0.08)",
                    transition: "0.2s",
                    background: WHITE,
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 18px 42px rgba(5,116,69,0.14)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 2,
                        mb: 1.5,
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            background: "#eef7f3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CampaignIcon sx={{ color: PRIMARY }} />
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: "#17251f",
                            lineHeight: 1.7,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.Title}
                        </Typography>
                      </Stack>

                      <Chip
                        label="تعميم"
                        size="small"
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          background: PRIMARY,
                          color: WHITE,
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Cairo",
                        color: item.Description ? "#52645d" : "#9aa9a3",
                        lineHeight: 2,
                        whiteSpace: "pre-wrap",
                        mb: 2,
                        textAlign: "left",
                        direction: "ltr",
                      }}
                    >
                      {item.Description || "لا يوجد وصف لهذا التعميم."}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={0.8}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "Cairo",
                          color: PRIMARY,
                          fontWeight: 800,
                        }}
                      >
                        بواسطة: {item.CreatedByName || "غير محدد"}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "Cairo",
                          color: "#60736b",
                          fontWeight: 800,
                        }}
                      >
                        تاريخ الرفع: {formatDate(item.CreatedAt)}
                      </Typography>
                    </Stack>

                    <FilesList item={item} />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <style>
        {`
          .swal-rtl-popup {
            font-family: Cairo, Arial, sans-serif !important;
            direction: rtl !important;
          }

          .swal-rtl-title,
          .swal-rtl-text {
            font-family: Cairo, Arial, sans-serif !important;
            direction: rtl !important;
            text-align: center !important;
          }
        `}
      </style>
    </Box>
  );
};

export default CircularsList;
