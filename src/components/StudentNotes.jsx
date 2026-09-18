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
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const isDark = muiTheme.palette.mode === "dark";

  const uiColors = useMemo(() => {
    const surfaces = muiTheme.palette.surfaces || {};
    return {
      page: isDark ? (muiTheme.palette.background.default || "#0d1b16") : bg,
      card: isDark ? (surfaces.card || "#12231b") : "#ffffff",
      section: isDark ? (surfaces.section || "#163026") : "#f8fbfa",
      nested: isDark ? (surfaces.nested || "#19382c") : "#ffffff",
      hover: isDark ? (surfaces.hover || "#1d4435") : "#edf8f3",
      selected: isDark ? (surfaces.selected || "#21513e") : "rgba(128,180,158,0.15)",
      text: isDark ? (muiTheme.palette.text.primary || "#f1f7f4") : text,
      muted: isDark ? (muiTheme.palette.text.secondary || "#b7cdc3") : "#60756c",
      border: isDark ? "#67C99D" : "rgba(128,180,158,0.25)",
      borderSoft: isDark ? "#67C99D" : "rgba(128,180,158,0.20)"
    };
  }, [muiTheme, isDark]);

  const permanentBorder = `1px solid ${uiColors.border}`;

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
        background: uiColors.page,
        color: uiColors.text,
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: "rtl",
        "& .MuiInputLabel-root": {
          color: uiColors.muted,
          px: 0.45,
          backgroundColor: uiColors.card
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: isDark ? "#8BDEB8" : primaryDark
        },
        "& .MuiOutlinedInput-root": {
          color: uiColors.text,
          backgroundColor: uiColors.nested,
          borderRadius: 2,
          "& fieldset": {
            borderColor: uiColors.border,
            borderWidth: "1px"
          },
          "&:hover fieldset": {
            borderColor: uiColors.border
          },
          "&.Mui-focused fieldset": {
            borderColor: uiColors.border,
            borderWidth: "1px"
          }
        },
        "& .MuiInputBase-input, & textarea": {
          color: uiColors.text,
          textAlign: "right"
        },
        "& .MuiFormHelperText-root": {
          color: uiColors.muted
        },
        "& .MuiDivider-root": {
          borderColor: uiColors.borderSoft
        }
      }}
    >
      <GlobalStyles
        styles={{
          ".MuiPopover-paper, .MuiMenu-paper, .MuiTooltip-tooltip": {
            ...(isDark ? {
              backgroundColor: `${uiColors.section} !important`,
              color: `${uiColors.text} !important`,
              border: `1px solid #67C99D !important`
            } : {})
          }
        }}
      />

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
            background: isDark ? uiColors.section : "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: uiColors.text,
            borderBottom: permanentBorder,
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
                color: uiColors.text,
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
            border: permanentBorder,
            background: isDark
              ? `linear-gradient(135deg, ${uiColors.section} 0%, ${uiColors.card} 70%)`
              : "linear-gradient(135deg, rgba(128,180,158,0.12) 0%, rgba(248,251,250,1) 60%)",
            backgroundImage: isDark ? "none" : undefined,
            color: uiColors.text
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: uiColors.text,
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
                background: isDark ? uiColors.nested : "rgba(128,180,158,0.15)",
                color: isDark ? "#A8E5C8" : primaryDark,
                border: permanentBorder,
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
            border: permanentBorder,
            backgroundColor: uiColors.card,
            backgroundImage: "none",
            color: uiColors.text
          }, uiLayout.pageHeaderSx)}
        >
          <Typography sx={{ fontWeight: 800, color: uiColors.text, mb: 1.2 }}>
            رفع ملف جديد
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: isCompact
                ? "repeat(2,minmax(0,1fr))"
                : "auto minmax(160px,1fr) minmax(280px,360px) auto",
              columnGap: isPhone ? 0.9 : isTablet ? 1.1 : 1.5,
              rowGap: isPhone ? 1.25 : isTablet ? 1.4 : 1.7,
              alignItems: "stretch"
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
                boxShadow: "none",
                border: permanentBorder,
                color: "#fff",
                minHeight: 40,
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
                gridColumn: isPhone ? "1 / -1" : undefined,
                px: 1.2,
                py: 0.9,
                borderRadius: 2,
                border: permanentBorder,
                backgroundColor: uiColors.nested,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.25
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: uiColors.text }}>
                {file ? file.name : "لم يتم اختيار ملف"}
              </Typography>
              <Typography variant="caption" sx={{ color: uiColors.muted }}>
                الامتدادات: xlsx / xls / csv — أقصى حجم: 10MB
              </Typography>
            </Box>

            <TextField InputLabelProps={{ shrink: true }}
              label="ملاحظة على الملف (اختياري)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              multiline
              minRows={4}
              sx={uiLayout.withUiSx({
                minWidth: 0,
                gridColumn: isCompact ? "1 / -1" : undefined,
                "& .MuiInputBase-input": {
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
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
                minHeight: 40,
                border: permanentBorder,
                color: "#fff",
                boxShadow: "none",
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
            border: permanentBorder,
            backgroundColor: uiColors.card,
            backgroundImage: "none",
            color: uiColors.text
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography sx={{ fontWeight: 900, color: uiColors.text }}>
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
            <Typography variant="body2" sx={{ color: uiColors.muted, mt: 2 }}>
              لا يوجد ملفات مرفوعة حتى الآن.
            </Typography>
          )}

          <Box
            sx={{
              display: "grid",
              gap: isPhone ? 1 : isTablet ? 1.2 : 1.6,
              mt: isPhone ? 1 : isTablet ? 1.2 : 1.8
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
                    border: permanentBorder,
                    background: isDark
                      ? uiColors.section
                      : "linear-gradient(180deg, rgba(128,180,158,0.05) 0%, #fff 45%)",
                    backgroundImage: isDark ? "none" : undefined,
                    color: uiColors.text
                  }}
                >
                  <Stack
                    direction={isCompact ? "column" : "row"}
                    justifyContent="space-between"
                    gap={isPhone ? 0.9 : isTablet ? 1.1 : 1.5}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: uiColors.text,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {r.original_filename}
                      </Typography>
                      <Typography variant="caption" sx={{ color: uiColors.muted }}>
                        {r.created_at}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                        <Tooltip title="فتح الملف">
                          <IconButton
                            size="small"
                            onClick={() => window.open(fileUrl, "_blank", "noreferrer")}
                            sx={{
                              border: permanentBorder,
                              color: isDark ? "#A8E5C8" : primaryDark,
                              backgroundColor: isDark ? uiColors.nested : "transparent",
                              "&:hover": { backgroundColor: uiColors.hover }
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
                              border: permanentBorder,
                              color: isDark ? "#A8E5C8" : primaryDark,
                              backgroundColor: isDark ? uiColors.nested : "transparent",
                              "&:hover": { backgroundColor: uiColors.hover }
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
                            background: isDark ? uiColors.nested : "rgba(128,180,158,0.15)",
                            color: isDark ? "#A8E5C8" : primaryDark,
                            border: permanentBorder
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
                        sx={uiLayout.withUiSx({
                          borderRadius: 2,
                          fontWeight: 900,
                          border: permanentBorder,
                          backgroundColor: isDark ? uiColors.nested : "transparent"
                        }, uiLayout.buttonSx)}
                      >
                        حذف
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: isPhone ? 1.1 : 1.5 }} />

                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    label="الملاحظة"
                    value={noteVal}
                    onChange={(e) => setEditingNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    multiline
                    minRows={4}
                    fullWidth
                  />

                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mt: isPhone ? 1 : isTablet ? 1.15 : 1.35 }}
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
                        border: permanentBorder,
                        minHeight: 38,
                        boxShadow: "none",
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
