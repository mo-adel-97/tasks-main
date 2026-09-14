import * as uiLayout from './common/uiLayout';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Toolbar,
  useMediaQuery,
  useTheme,
  GlobalStyles
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";





// API
const API_BASE = "https://filesregsiteration.sstli.com/erp/student_notes_api.php";

// مكان ملفات الرفع الحقيقي (ERP Base)
const FILE_BASE = "http://filesregsiteration.sstli.com/erp";

// ألوانك
const primary = "#80b49e";
const primaryDark = "#6a9a87";
const bg = "#f8fbfa";
const text = "#2c3e50";

function joinUrl(base, path) {
  if (!path) return "";
  // لو already absolute
  if (/^https?:\/\//i.test(path)) return path;

  // لو يبدأ بـ / يبقى join مباشر
  const full = `${base.replace(/\/+$/,"")}/${path.replace(/^\/+/,"")}`;

  // encode بس الجزء بعد الدومين عشان العربي والمسافات
  try {
    const u = new URL(full);
    u.pathname = u.pathname
      .split("/")
      .map(seg => encodeURIComponent(decodeURIComponent(seg)))
      .join("/");
    return u.toString();
  } catch {
    return full;
  }
}

export default function StudentNotes() {
  const muiTheme = useTheme();

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const userGuid = user?.guid || user?.Guid || user?.userGuid;
  const branchGuid = user?.branchForWork || user?.BranchForWork || user?.branchGuid;

  const [file, setFile] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({}); // id -> text

  const loadMy = async () => {
    if (!userGuid) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?action=my&userGuid=${encodeURIComponent(userGuid)}`);
      const json = await res.json();
      if (json.ok) {
        const data = json.data || [];
        setRows(data);
        // حضّر editable notes
        const map = {};
        data.forEach(r => { map[r.id] = r.note_text || ""; });
        setEditingNotes(map);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMy(); /* eslint-disable-next-line */ }, [userGuid]);

  const handleUpload = async () => {
    if (!file) return alert("اختار ملف Excel الأول");
    if (!userGuid || !branchGuid) return alert("بيانات المستخدم ناقصة (guid / branchForWork)");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("userGuid", userGuid);
    fd.append("branchGuid", branchGuid);
    fd.append("noteText", noteText);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?action=upload`, { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) return alert(json.message || "Upload failed");
      setFile(null);
      setNoteText("");
      await loadMy();
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id) => {
    const newText = (editingNotes[id] ?? "").trim();
    setSavingId(id);
    try {
      const res = await fetch(`${API_BASE}?action=updateNote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userGuid, noteText: newText })
      });
      const json = await res.json();
      if (!json.ok) return alert(json.message || "Update failed");
      await loadMy();
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm("متأكد تحذف الملف؟")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}?action=delete&id=${id}&userGuid=${encodeURIComponent(userGuid)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.ok) return alert(json.message || "Delete failed");
      await loadMy();
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        display: "flex",
        background: bg,
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        direction: "rtl"
      }}
    >
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": {
              zIndex: "2100 !important"
            },
            ".MuiDrawer-root .MuiBackdrop-root": {
              zIndex: "2099 !important"
            },
            ".MuiDrawer-root .MuiDrawer-paper": {
              zIndex: "2101 !important"
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 1400,
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: text,
            borderBottom:
              "1px solid rgba(128,180,158,0.25)",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.75, sm: 1 },
              gap: 0.8
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
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 5px 14px rgba(5,117,70,.20)"
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: { xs: 20, sm: 22 }
                }}
              />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontWeight: 900,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem"
                },
                color: text,
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              ملاحظات المتدربين
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          ml: 0,
          p: {
            xs: 0.5,
            sm: 0.8,
            md: 1
          },
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            p: 2.5,
            mt: 0
          },
          ...navigationContentSx
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.7 : isTablet ? 0.95 : 2.2,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border: "1px solid rgba(128,180,158,0.25)",
            background: "linear-gradient(135deg, rgba(128,180,158,0.12) 0%, rgba(248,251,250,1) 60%)"
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: text,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.84rem"
                      : undefined
                }}
              >
                ملاحظات المتدربين
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.75,
                  mt: 0.3,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  display: isPhone ? "none" : "block"
                }}
              >
                ارفع ملف Excel + اكتب ملاحظة عليه. الملفات تظهر فقط لصاحب الرفع.
              </Typography>
            </Box>

            <Chip
              label={`Branch: ${branchGuid ? branchGuid.slice(0, 8) + "..." : "-"}`}
              sx={{
                display: isPhone ? "none" : "inline-flex",
                fontWeight: 700,
                background: "rgba(128,180,158,0.15)",
                color: primaryDark,
                border: "1px solid rgba(128,180,158,0.25)",
                height: isTablet ? 26 : undefined,
                fontSize: isTablet ? "0.75rem" : undefined
              }}
            />
          </Stack>
        </Paper>

        {/* Upload Card */}
        <Paper
          elevation={0}
          sx={uiLayout.withUiSx({
            mt: isPhone ? 0.65 : isTablet ? 0.9 : 2,
            p: isPhone ? 0.7 : isTablet ? 0.95 : 2,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border: "1px solid rgba(128,180,158,0.25)"
          }, uiLayout.pageHeaderSx)}
        >
          <Typography sx={{ fontWeight: 800, color: text, mb: 1 }}>
            رفع ملف جديد
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: isCompact
                ? "repeat(2,minmax(0,1fr))"
                : "auto minmax(160px,1fr) minmax(280px,360px) auto",
              gap: isPhone ? 0.6 : isTablet ? 0.8 : 2,
              alignItems: "center"
            }, uiLayout.filterBarSx)}
          >
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={uiLayout.withUiSx({
                background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                fontWeight: 800,
                borderRadius: 2,
                px: 2.2,
                py: 1.1,
                boxShadow: "0 6px 16px rgba(128,180,158,0.28)",
                "&:hover": {
                  background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                }
              }, uiLayout.buttonSx)}
            >
              اختيار ملف Excel
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>

            <Box
              sx={{
                minWidth: 0,
                gridColumn: isPhone ? "1 / -1" : undefined
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: text }}>
                {file ? file.name : "لم يتم اختيار ملف"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                الامتدادات: xlsx / xls / csv — أقصى حجم: 10MB
              </Typography>
            </Box>

            <TextField InputLabelProps={{ shrink: true }}
              label="ملاحظة على الملف (اختياري)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              sx={uiLayout.withUiSx({
                minWidth: 0,
                gridColumn: isCompact ? "1 / -1" : undefined,
                "& .MuiInputBase-input": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                },
                "& .MuiOutlinedInput-root": {
                  minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                }
              }, uiLayout.formFieldSx)}
            />

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={loading}
              sx={uiLayout.withUiSx({
                background: primary,
                fontWeight: 900,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                "&:hover": { background: primaryDark }
              }, uiLayout.buttonSx)}
            >
              {loading ? "جاري الرفع..." : "رفع"}
            </Button>
          </Box>
        </Paper>

        {/* List */}
        <Paper
          elevation={0}
          sx={{
            mt: isPhone ? 0.65 : isTablet ? 0.9 : 2,
            p: isPhone ? 0.7 : isTablet ? 0.95 : 2,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border: "1px solid rgba(128,180,158,0.25)"
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography sx={{ fontWeight: 900, color: text }}>
              ملفاتي المرفوعة
            </Typography>

            {loading && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} />
                <Typography variant="body2">تحميل...</Typography>
              </Stack>
            )}
          </Stack>

          {!loading && rows.length === 0 && (
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>
              لا يوجد ملفات مرفوعة حتى الآن.
            </Typography>
          )}

          <Box
            sx={{
              display: "grid",
              gap: isPhone ? 0.65 : isTablet ? 0.85 : 1.5,
              mt: isPhone ? 0.65 : isTablet ? 0.85 : 2
            }}
          >
            {rows.map((r) => {
              const fileUrl = joinUrl(FILE_BASE, r.file_path); // ✅ هنا الحل
              const noteVal = editingNotes[r.id] ?? "";

              return (
                <Paper
                  key={r.id}
                  elevation={0}
                  sx={{
                    p: isPhone ? 0.65 : isTablet ? 0.85 : 2,
                    borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                    border: "1px solid rgba(128,180,158,0.2)",
                    background: "linear-gradient(180deg, rgba(128,180,158,0.05) 0%, #fff 45%)"
                  }}
                >
                  <Stack
                    direction={isCompact ? "column" : "row"}
                    justifyContent="space-between"
                    gap={isPhone ? 0.55 : isTablet ? 0.75 : 2}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: text,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {r.original_filename}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {r.created_at}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                        <Tooltip title="فتح الملف">
                          <IconButton
                            size="small"
                            onClick={() => window.open(fileUrl, "_blank", "noreferrer")}
                            sx={{
                              border: "1px solid rgba(128,180,158,0.35)",
                              color: primaryDark
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="تحميل">
                          <IconButton
                            size="small"
                            component="a"
                            href={fileUrl}
                            download
                            sx={{
                              border: "1px solid rgba(128,180,158,0.35)",
                              color: primaryDark
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Chip
                          label="Excel"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            background: "rgba(128,180,158,0.15)",
                            color: primaryDark,
                            border: "1px solid rgba(128,180,158,0.25)"
                          }}
                        />
                      </Stack>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.6}
                      alignItems="flex-start"
                      sx={{
                        "& .MuiButton-root": {
                          minHeight: isPhone ? 28 : isTablet ? 31 : undefined,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                        }
                      }}
                    >
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => deleteRow(r.id)}
                        sx={uiLayout.withUiSx({ borderRadius: 2, fontWeight: 900 }, uiLayout.buttonSx)}
                      >
                        حذف
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.7 }} />

                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    label="الملاحظة"
                    value={noteVal}
                    onChange={(e) => setEditingNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    multiline
                    minRows={isPhone ? 1 : isTablet ? 1 : 2}
                    maxRows={isPhone ? 2 : isTablet ? 2 : undefined}
                    fullWidth
                  />

                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mt: isPhone ? 0.55 : isTablet ? 0.75 : 1.2 }}
                  >
                    <Button
                      onClick={() => updateNote(r.id)}
                      disabled={savingId === r.id}
                      startIcon={<SaveIcon />}
                      sx={uiLayout.withUiSx({
                        fontWeight: 900,
                        borderRadius: 2,
                        color: "white",
                        background: savingId === r.id
                          ? "rgba(128,180,158,0.6)"
                          : `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`
                        }
                      }, uiLayout.buttonSx)}
                    >
                      {savingId === r.id ? "جاري الحفظ..." : "حفظ الملاحظة"}
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </Box></NavigationShell>
  );
}
