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
  Collapse,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f8fbf9";

const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
};

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (u) =>
  u?.guid ||
  u?.Guid ||
  u?.userGuid ||
  u?.UserGuid ||
  "";

const normalize = (v) =>
  String(v ?? "").trim().toLowerCase();

const getColumnCaption = (column) => {
  const key = normalize(column);

  if (key === "accountname") return "اسم الحساب";
  if (key === "code") return "كود الحساب";

  return column;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const cleaned = String(v)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  if (!cleaned) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const money = (v) => {
  const n = toNumber(v);
  if (n === null) return String(v ?? "");
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function MobileRowCard({ row, columns, index, isSummary }) {
  const [open, setOpen] = useState(false);

  const codeKey =
    columns.find((c) => normalize(c).includes("code")) ||
    columns.find((c) => normalize(c).includes("كود")) ||
    columns[0];

  const nameKey =
    columns.find((c) => normalize(c).includes("accountname")) ||
    columns.find((c) => normalize(c).includes("اسم الحساب")) ||
    columns[1];

  const branchColumns = columns.filter(
    (c) => c !== codeKey && c !== nameKey
  );

  const total = branchColumns.reduce((sum, c) => {
    const n = toNumber(row?.[c]);
    return sum + (n ?? 0);
  }, 0);

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 1,
        overflow: "hidden",
        borderColor: isSummary ? "#a7d9bd" : border,
        bgcolor: isSummary ? "#eef9f1" : "#fff"
      }}
    >
      <Box
        sx={{
          p: 1.2,
          display: "grid",
          gridTemplateColumns: "42px 1fr auto",
          gap: 1,
          alignItems: "center"
        }}
      >
        <IconButton
          size="small"
          onClick={() => setOpen((x) => !x)}
        >
          {open ? (
            <KeyboardArrowUpIcon />
          ) : (
            <KeyboardArrowDownIcon />
          )}
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 14,
              whiteSpace: "normal",
              lineHeight: 1.5
            }}
          >
            {row?.[nameKey] ?? "-"}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary" }}
          >
            كود الحساب: {row?.[codeKey] ?? "-"}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={money(total)}
          sx={{
            fontWeight: 900,
            bgcolor: "#e7f4ee"
          }}
        />
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            px: 1.2,
            pb: 1.2,
            display: "grid",
            gap: 0.7
          }}
        >
          {branchColumns.map((c) => (
            <Box
              key={c}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 1,
                borderTop: `1px solid ${border}`,
                pt: 0.7
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 800 }}
              >
                {c}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  fontWeight: 900,
                  direction: "ltr"
                }}
              >
                {money(row?.[c])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function ConsolidatedIncomeStatement() {
  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    theme.breakpoints.between("sm", "lg")
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const user = useMemo(() => readUser(), []);
  const userGuid = useMemo(
    () => String(getUserGuid(user)).trim(),
    [user]
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [permissionLoading, setPermissionLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!userGuid) return;

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        const permissionData = result?.data || {};

        const direct =
          permissionData?.generalAccounts?.canView === true &&
          permissionData?.generalAccounts?.screens
            ?.consolidatedIncomeStatement === true;

        const hasMenu =
          Array.isArray(permissionData?.menus) &&
          permissionData.menus.some(
            (x) =>
              normalize(x?.code) === "account" ||
              normalize(x?.name) ===
                normalize("الحسابات العامة")
          );

        const hasForm =
          Array.isArray(permissionData?.forms) &&
          permissionData.forms.some(
            (x) =>
              normalize(x?.code) === "95" ||
              normalize(x?.name) ===
                normalize("قائمة الدخل") ||
              normalize(x?.guid) ===
                "a23d2646-58de-455a-a949-07e953b24ece"
          );

        if (alive) {
          setAuthorized(
            response.ok &&
            (direct || (hasMenu && hasForm))
          );
        }
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  const loadData = useCallback(async () => {
    if (!fromDate || !toDate) {
      await Swal.fire({
        icon: "warning",
        title: "راجع الفترة",
        text: "حدد الفترة أولاً"
      });
      return;
    }

    if (fromDate > toDate) {
      await Swal.fire({
        icon: "warning",
        title: "راجع الفترة",
        text: "تاريخ البداية يجب ألا يكون بعد تاريخ النهاية"
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        userGuid,
        fromDate,
        toDate
      });

      const response = await fetch(
        `${API_BASE_URL}/api/consolidated-income-statement?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل قائمة الدخل المجمعة"
        );
      }

      const data = result?.data || {};
      setColumns(
        Array.isArray(data?.columns)
          ? data.columns
          : []
      );
      setRows(
        Array.isArray(data?.rows)
          ? data.rows
          : []
      );
    } catch (e) {
      setColumns([]);
      setRows([]);
      setError(
        e?.message ||
        "تعذر تحميل قائمة الدخل المجمعة"
      );
    } finally {
      setLoading(false);
    }
  }, [userGuid, fromDate, toDate]);

  const exportExcel = () => {
    if (!rows.length || !columns.length) return;

    const head = columns
      .map((c) => `<th>${escapeHtml(c)}</th>`)
      .join("");

    const body = rows
      .map(
        (row) =>
          `<tr>${columns
            .map(
              (c) =>
                `<td>${escapeHtml(row?.[c] ?? "")}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            table{border-collapse:collapse;font-family:Arial}
            th,td{border:1px solid #bbb;padding:7px;text-align:center}
            th{background:#e9f3ee;font-weight:bold}
          </style>
        </head>
        <body>
          <h2>قائمة الدخل المجمعة</h2>
          <div>الفترة: ${escapeHtml(fromDate)} إلى ${escapeHtml(toDate)}</div>
          <br/>
          <table>
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>`;

    const blob = new Blob(
      ["\ufeff", html],
      { type: "application/vnd.ms-excel;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      `قائمة الدخل المجمعة_${fromDate}_${toDate}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (permissionLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية قائمة الدخل ضمن الحسابات العامة.
        </Alert>
      </Box>
    );
  }

  const content = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: { xs: 1, sm: 1.5 }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: 2,
          overflow: "hidden"
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 1.5, sm: 2 },
            py: 1.1,
            display: "flex",
            alignItems: "center",
            gap: 1
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{ color: "#fff" }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <AssessmentIcon />

          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 19, sm: 23 }
              }}
            >
              قائمة الدخل المجمعة
            </Typography>
          </Box>

          <Chip
            label={`${rows.length} حساب`}
            size="small"
            sx={{
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900
            }}
          />
        </Box>

        <Box sx={{ p: 1 }}>
          <Stack sx={uiLayout.filterBarSx}
            direction={{
              xs: "column",
              md: "row"
            }}
            spacing={1}
            alignItems="stretch"
          >
            <TextField
              size="small"
              type="date"
              label="الفترة من"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={uiLayout.withUiSx({ minWidth: { md: 170 } }, uiLayout.formFieldSx)}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField
              size="small"
              type="date"
              label="الفترة إلى"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
              InputLabelProps={{ shrink: true }}
              sx={uiLayout.withUiSx({ minWidth: { md: 170 } }, uiLayout.formFieldSx)}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={loadData}
              disabled={loading}
              sx={uiLayout.withUiSx({
                bgcolor: "#1976d2",
                fontWeight: 900,
                minWidth: 105
              }, uiLayout.buttonSx)}
            >
              عرض
            </Button>

            <Button
              variant="outlined"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={exportExcel}
              disabled={!rows.length}
              sx={uiLayout.withUiSx({ fontWeight: 900 }, uiLayout.buttonSx)}
            >
              EXCEL
            </Button>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 1 }}
            >
              {error}
            </Alert>
          )}
        </Box>

        {!loading && !rows.length && !error && (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              color: "text.secondary"
            }}
          >
            <AssessmentIcon sx={{ fontSize: 48 }} />
            <Typography sx={{ mt: 1 }}>
              حدد الفترة ثم اضغط عرض.
            </Typography>
          </Box>
        )}

        {!!rows.length && (
          <>
            {(isMobile || isTablet) ? (
              <Box
                sx={{
                  p: 1,
                  maxHeight: "calc(100vh - 210px)",
                  overflow: "auto"
                }}
              >
                {rows.map((row, index) => (
                  <MobileRowCard
                    key={index}
                    row={row}
                    columns={columns}
                    index={index}
                    isSummary={
                      index >= rows.length - 3
                    }
                  />
                ))}
              </Box>
            ) : (
              <TableContainer
                sx={uiLayout.withUiSx({
                  maxHeight: "calc(100vh - 175px)",
                  borderTop: `1px solid ${border}`
                }, uiLayout.tableContainerSx)}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    minWidth:
                      Math.max(
                        900,
                        columns.length * 125
                      )
                  }}
                >
                  <TableHead>
                    <TableRow>
                      {columns.map((c, i) => (
                        <TableCell
                          key={c}
                          align="center"
                          sx={{
                            fontWeight: 900,
                            bgcolor: "#eaf4ef",
                            minWidth:
                              i === 0
                                ? 80
                                : i === 1
                                ? 220
                                : 120,
                            maxWidth:
                              i === 1
                                ? 260
                                : 160,
                            whiteSpace: "normal",
                            lineHeight: 1.3
                          }}
                        >
                          {getColumnCaption(c)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row, rowIndex) => {
                      const summary =
                        rowIndex >= rows.length - 3;

                      return (
                        <TableRow
                          key={rowIndex}
                          hover
                          sx={{
                            bgcolor: summary
                              ? "#eef9f1"
                              : rowIndex % 2
                              ? "#fff"
                              : "#fbfdfc"
                          }}
                        >
                          {columns.map((c, colIndex) => (
                            <TableCell
                              key={c}
                              align="center"
                              sx={{
                                fontWeight:
                                  summary ? 900 : 600,
                                whiteSpace:
                                  colIndex === 1
                                    ? "normal"
                                    : "nowrap",
                                textAlign: "center",
                                direction:
                                  colIndex > 1
                                    ? "ltr"
                                    : "rtl"
                              }}
                            >
                              {colIndex > 1
                                ? money(row?.[c])
                                : row?.[c] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: soft
      }}
    >
      

      

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          ...navigationContentSx
        }}
      >
        {content}
      </Box>
    </Box></NavigationShell>
  );
}
