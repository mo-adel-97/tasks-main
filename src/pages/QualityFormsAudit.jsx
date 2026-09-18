import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const pad2 = (value) => String(value).padStart(2, "0");

const dateInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const firstDayOfMonth = () => {
  const now = new Date();
  return dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

const todayLocal = () => dateInputValue(new Date());

const formatDateTime = (value) => {
  if (!value) return "";

  const text = String(value);
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return text;

  const [, y, m, d, hh, mm, ss = "00"] = match;
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const captions = {
  Id: "رقم الصادر",
  FormName: "اسم النموذج",
  StudentName: "اسم المتدرب",
  NationalId: "رقم الهوية",
  CreatedByFullName: "تم الإنشاء بواسطة",
  CreatedAt: "تاريخ ووقت الإنشاء",
  UpdatedByFullName: "آخر تعديل بواسطة",
  UpdatedAt: "تاريخ آخر تعديل"
};

const hiddenColumns = new Set([
  "SourceTable",
  "DocumentGuid",
  "CreatedByGuid",
  "UpdatedByGuid",
  "FormCode"
]);

export default function QualityFormsAudit() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(todayLocal());
  const [userGuid, setUserGuid] = useState("");
  const [formCode, setFormCode] = useState("");

  const [users, setUsers] = useState([]);
  const [forms, setForms] = useState([]);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const visibleColumns = useMemo(
    () =>
      (Array.isArray(columns) ? columns : []).filter(
        (column) => !hiddenColumns.has(column)
      ),
    [columns]
  );

  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);

    try {
      const [usersResponse, formsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quality-forms-audit/users`),
        fetch(`${API_BASE_URL}/api/quality-forms-audit/forms`)
      ]);

      const usersJson = await usersResponse.json();
      const formsJson = await formsResponse.json();

      if (!usersResponse.ok) {
        throw new Error(
          usersJson?.message || "تعذر تحميل المستخدمين"
        );
      }

      if (!formsResponse.ok) {
        throw new Error(
          formsJson?.message || "تعذر تحميل أنواع النماذج"
        );
      }

      setUsers(Array.isArray(usersJson?.data) ? usersJson.data : []);
      setForms(Array.isArray(formsJson?.data) ? formsJson.data : []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل القوائم",
        text: error?.message || "حدث خطأ أثناء التحميل"
      });
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  const search = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      await Swal.fire({
        icon: "warning",
        title: "الفترة غير صحيحة",
        text: "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quality-forms-audit/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fromDate: fromDate ? `${fromDate}T00:00:00` : null,
            toDate: toDate ? `${toDate}T00:00:00` : null,
            userGuid: userGuid || null,
            formCode: formCode || null
          })
        }
      );

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [result?.message, result?.error]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر تحميل سجل نماذج الجودة"
        );
      }

      setColumns(result?.data?.columns || []);
      setRows(result?.data?.rows || []);
    } catch (error) {
      setColumns([]);
      setRows([]);

      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل السجل",
        text:
          error?.message ||
          "تعذر تحميل سجل نماذج الجودة"
      });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, userGuid, formCode]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    search();
  }, []); // نفس الديسكتوب: تحميل تلقائي عند فتح الشاشة

  const showToday = async () => {
    const today = todayLocal();
    setFromDate(today);
    setToDate(today);

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quality-forms-audit/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fromDate: `${today}T00:00:00`,
            toDate: `${today}T00:00:00`,
            userGuid: userGuid || null,
            formCode: formCode || null
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل بيانات اليوم"
        );
      }

      setColumns(result?.data?.columns || []);
      setRows(result?.data?.rows || []);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text: error?.message || "تعذر تحميل بيانات اليوم"
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (row) => {
    const sourceTable = String(row?.SourceTable || "").trim();
    const documentGuid = String(row?.DocumentGuid || "").trim();

    if (!sourceTable || !documentGuid) {
      await Swal.fire({
        icon: "warning",
        title: "تعذر عرض النموذج",
        text: "بيانات النموذج المطلوبة غير مكتملة"
      });
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/quality-forms-audit/details` +
        `?sourceTable=${encodeURIComponent(sourceTable)}` +
        `&documentGuid=${encodeURIComponent(documentGuid)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر عرض بيانات النموذج"
        );
      }

      setDetails(result?.data || null);
    } catch (error) {
      setDetailsOpen(false);

      await Swal.fire({
        icon: "error",
        title: "تعذر عرض النموذج",
        text: error?.message || "حدث خطأ أثناء عرض النموذج"
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const exportExcel = () => {
    if (!rows.length) {
      Swal.fire({
        icon: "info",
        title: "لا توجد بيانات",
        text: "لا توجد بيانات لتصديرها"
      });
      return;
    }

    const exportColumns = visibleColumns;

    const head = exportColumns
      .map(
        (column) =>
          `<th>${escapeHtml(captions[column] || column)}</th>`
      )
      .join("");

    const body = rows
      .map(
        (row) =>
          `<tr>${exportColumns
            .map((column) => {
              const raw = row?.[column];
              const value =
                column === "CreatedAt" || column === "UpdatedAt"
                  ? formatDateTime(raw)
                  : raw ?? "";

              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head><meta charset="utf-8" /></head>
        <body>
          <table border="1">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(
      ["\ufeff", html],
      {
        type: "application/vnd.ms-excel;charset=utf-8"
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `سجل_نماذج_الجودة_${fromDate}_${toDate}.xls`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const content = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: { xs: 0.4, sm: 0.8, md: 1 },
        overflowX: "hidden"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.2, sm: 2.2 },
          overflow: "hidden"
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            minHeight: { xs: 48, sm: 62 },
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 0.65, sm: 1.3 },
            py: { xs: 0.55, sm: 0.9 },
            display: "flex",
            alignItems: "center",
            gap: 0.6
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{ color: "#fff", p: 0.25 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <FactCheckIcon
            sx={{ fontSize: { xs: 20, sm: 28 } }}
          />

          <Typography
            sx={{
              flex: 1,
              fontFamily: "Cairo",
              fontWeight: 900,
              fontSize: { xs: 14, sm: 21 }
            }}
          >
            سجل نماذج الجودة
          </Typography>

          <Chip
            size="small"
            label={`${rows.length} نموذج`}
            sx={{
              bgcolor: "#fff",
              color: primaryDark,
              fontFamily: "Cairo",
              fontWeight: 900,
              fontSize: { xs: 12, sm: 12 }
            }}
          />
        </Box>

        <Box
          sx={uiLayout.withUiSx({
            p: { xs: 0.6, sm: 1 },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4,minmax(0,1fr)) 110px 110px 120px"
            },
            gap: { xs: 0.45, sm: 0.75 },
            alignItems: "center"
          }, uiLayout.filterBarSx)}
        >
          <TextField sx={uiLayout.formFieldSx}
            type="date"
            size="small"
            label="الفترة من"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

          <TextField sx={uiLayout.formFieldSx}
            type="date"
            size="small"
            label="الفترة إلى"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select
            size="small"
            label="منشئ النموذج"
            value={userGuid}
            onChange={(e) => setUserGuid(e.target.value)}
            disabled={loadingLookups}
          >
            <MenuItem value="">كل المستخدمين</MenuItem>
            {users.map((item) => (
              <MenuItem
                key={item.guid}
                value={item.guid}
              >
                {item.fullName}
              </MenuItem>
            ))}
          </TextField>

          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            select
            size="small"
            label="نوع النموذج"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            disabled={loadingLookups}
          >
            <MenuItem value="">كل النماذج</MenuItem>
            {forms.map((item) => (
              <MenuItem
                key={`${item.formCode}-${item.formName}`}
                value={item.formCode}
              >
                {item.formName}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            disabled={loading}
            onClick={search}
            sx={uiLayout.withUiSx({
              bgcolor: "#1565c0",
              fontFamily: "Cairo",
              fontWeight: 900,
              minHeight: 40
            }, uiLayout.buttonSx)}
          >
            عرض
          </Button>

          <Button
            variant="contained"
            onClick={showToday}
            disabled={loading}
            sx={uiLayout.withUiSx({
              bgcolor: "#9a151b",
              fontFamily: "Cairo",
              fontWeight: 900,
              minHeight: 40,
              "&:hover": { bgcolor: "#7f1015" }
            }, uiLayout.buttonSx)}
          >
            اليوم
          </Button>

          <Button
            variant="outlined"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={exportExcel}
            disabled={!rows.length}
            sx={uiLayout.withUiSx({
              fontFamily: "Cairo",
              fontWeight: 900,
              minHeight: 40
            }, uiLayout.buttonSx)}
          >
            Excel
          </Button>
        </Box>

        {loading && (
          <Box
            sx={{
              p: 4,
              display: "flex",
              justifyContent: "center"
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!loading && rows.length === 0 && (
          <Alert
            severity="info"
            sx={{
              mx: 1,
              mb: 1,
              fontFamily: "Cairo"
            }}
          >
            لا توجد نماذج مطابقة للفلاتر الحالية.
          </Alert>
        )}

        {!loading && rows.length > 0 && (
          <Box
            sx={{
              mx: { xs: 0.45, sm: 0.8 },
              mb: { xs: 0.45, sm: 0.8 },
              border: `1px solid ${border}`,
              borderRadius: 1.5,
              overflow: "auto",
              maxHeight: "calc(100vh - 210px)",
              bgcolor: "#fff"
            }}
          >
            <Box
              component="table"
              sx={{
                width: "max-content",
                minWidth: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                direction: "rtl",
                "& th": {
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  bgcolor: "#e8f3ef",
                  color: "#17352c",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: { xs: 12, sm: 12 },
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                  px: 1,
                  py: 0.8,
                  borderBottom: `1px solid ${border}`
                },
                "& td": {
                  fontFamily: "Cairo",
                  fontWeight: 600,
                  fontSize: { xs: 12, sm: 12 },
                  textAlign: "center",
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                  px: 1,
                  py: 0.7,
                  borderBottom: "1px solid #edf2ef"
                },
                "& tbody tr:nth-of-type(even)": {
                  bgcolor: "#fbfdfc"
                },
                "& tbody tr:hover": {
                  bgcolor: "#f0f8f5"
                }
              }}
            >
              <thead>
                <tr>
                  <th>عرض النموذج</th>
                  {visibleColumns.map((column) => (
                    <th key={column}>
                      {captions[column] || column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={
                      row?.DocumentGuid ||
                      row?.Id ||
                      index
                    }
                  >
                    <td>
                      <Tooltip title="عرض بيانات النموذج">
                        <IconButton
                          size="small"
                          onClick={() => openDetails(row)}
                          sx={{ color: primary }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </td>

                    {visibleColumns.map((column) => (
                      <td key={column}>
                        {column === "CreatedAt" ||
                        column === "UpdatedAt"
                          ? formatDateTime(row?.[column])
                          : String(row?.[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={!isDesktop}
        dir="rtl"
      >
        <DialogTitle
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            fontFamily: "Cairo",
            fontWeight: 900
          }}
        >
          <Box sx={{ flex: 1 }}>
            {details?.title || "عرض بيانات النموذج"}
          </Box>

          <IconButton
            onClick={() => setDetailsOpen(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {detailsLoading ? (
            <Box
              sx={{
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={0.7} sx={{ mt: 1 }}>
              {(details?.fields || []).map((item, index) => (
                <Paper
                  key={`${item.field}-${index}`}
                  variant="outlined"
                  sx={{
                    p: 1,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "110px 1fr",
                      sm: "220px 1fr"
                    },
                    gap: 1,
                    alignItems: "start"
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: primaryDark,
                      textAlign: "right"
                    }}
                  >
                    {item.caption}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      textAlign: "right"
                    }}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box sx={{ minHeight: "100vh", bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : soft }}>
      {isDesktop ? (
        <>
          
          <Box sx={{
            ...navigationContentSx
          }}>
            {content}
          </Box>
        </>
      ) : (
        <>
          
          {content}
        </>
      )}
    </Box></NavigationShell>
  );
}
