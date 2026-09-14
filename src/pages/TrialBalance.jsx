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
  DialogActions,
  DialogContent,
  DialogTitle,
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
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const soft = "#f7faf8";
const border = "#dce8e2";
const headerBg = "#e9f3ef";
const totalBg = "#f2f2f2";

const today = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
};

const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
};

const getUserGuid = (u) =>
  u?.guid ||
  u?.Guid ||
  u?.userGuid ||
  u?.UserGuid ||
  u?.USER_GUID ||
  u?.USER_GUID____ ||
  "";

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const money = (v) =>
  n(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const keyOf = (v) =>
  String(v || "").toLowerCase();

function buildVisibleRows(
  roots,
  expanded,
  childrenMap
) {
  const out = [];

  const walk = (row, depth) => {
    const key = keyOf(row.guid);

    out.push({
      ...row,
      depth
    });

    if (!key || !expanded.has(key)) {
      return;
    }

    const children =
      childrenMap[key] || [];

    children.forEach((child) =>
      walk(child, depth + 1)
    );
  };

  roots.forEach((root) =>
    walk(root, 0)
  );

  return out;
}

export default function TrialBalance() {
  const theme = useTheme();

  const isMobile =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const isTablet =
    useMediaQuery(
      theme.breakpoints.between("sm", "lg")
    );

  const isDesktop =
    useMediaQuery(
      `(min-width:${DESKTOP_BREAKPOINT}px)`,
      { noSsr: true }
    );

  const user = useMemo(
    () => getUser(),
    []
  );

  const userGuid = useMemo(
    () =>
      String(
        getUserGuid(user)
      ).trim(),
    [user]
  );

  const [authorized,
    setAuthorized] =
    useState(false);

  const [permissionLoading,
    setPermissionLoading] =
    useState(true);

  const [mobileSidebarOpen,
    setMobileSidebarOpen] =
    useState(false);

  const [fromDate,
    setFromDate] =
    useState(today());

  const [toDate,
    setToDate] =
    useState(today());

  const [branchGuid,
    setBranchGuid] =
    useState("");

  const [branchName,
    setBranchName] =
    useState("");

  const [branchOpen,
    setBranchOpen] =
    useState(false);

  const [branchSearch,
    setBranchSearch] =
    useState("");

  const [branches,
    setBranches] =
    useState([]);

  const [branchesLoading,
    setBranchesLoading] =
    useState(false);

  const [loading,
    setLoading] =
    useState(false);

  const [loadedOnce,
    setLoadedOnce] =
    useState(false);

  const [error,
    setError] =
    useState("");

  /*
   * أهم تعديل للأداء:
   * roots = الحسابات الرئيسية فقط.
   * الأطفال لا يدخلون React state إلا عندما يفتح المستخدم حسابًا بعينه.
   */
  const [roots,
    setRoots] =
    useState([]);

  const [snapshotId,
    setSnapshotId] =
    useState("");

  const [totalRowCount,
    setTotalRowCount] =
    useState(0);

  const [childrenMap,
    setChildrenMap] =
    useState({});

  const [expanded,
    setExpanded] =
    useState(new Set());

  const [loadingChildren,
    setLoadingChildren] =
    useState(new Set());

  const [totals,
    setTotals] =
    useState({
      openingMaden: 0,
      openingDaen: 0,
      transMaden: 0,
      transDaen: 0,
      finalMaden: 0,
      finalDaen: 0
    });

  useEffect(() => {
    let alive = true;

    const norm = (v) =>
      String(v ?? "")
        .trim()
        .toLowerCase();

    (async () => {
      try {
        if (!userGuid) return;

        const res = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result =
          await res
            .json()
            .catch(() => null);

        const data =
          result?.data || {};

        const direct =
          data?.generalAccounts?.canView === true &&
          data?.generalAccounts?.screens?.trialBalance === true;

        const menu =
          Array.isArray(data?.menus) &&
          data.menus.some(
            (x) =>
              norm(x?.code) === "account" ||
              norm(x?.name) ===
                norm("الحسابات العامة")
          );

        const form =
          Array.isArray(data?.forms) &&
          data.forms.some(
            (x) =>
              norm(x?.code) === "20" ||
              norm(x?.name) ===
                norm("ميزان المراجعة") ||
              norm(x?.guid) ===
                "5f295004-6841-4a45-93d0-28dd2310ea65"
          );

        if (alive) {
          setAuthorized(
            res.ok &&
              (direct ||
                (menu && form))
          );
        }
      } catch {
        if (alive) {
          setAuthorized(false);
        }
      } finally {
        if (alive) {
          setPermissionLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  const visibleRows =
    useMemo(
      () =>
        buildVisibleRows(
          roots,
          expanded,
          childrenMap
        ),
      [
        roots,
        expanded,
        childrenMap
      ]
    );

  const loadData =
    useCallback(async () => {
      if (!userGuid) return;

      if (!fromDate || !toDate) {
        await Swal.fire({
          icon: "warning",
          title: "راجع الفترة",
          text:
            "حدد تاريخ البداية وتاريخ النهاية"
        });
        return;
      }

      if (fromDate > toDate) {
        await Swal.fire({
          icon: "warning",
          title: "راجع الفترة",
          text:
            "تاريخ البداية يجب ألا يكون بعد تاريخ النهاية"
        });
        return;
      }

      setLoading(true);
      setError("");

      /*
       * كل عرض جديد يبدأ مطوي بالكامل.
       */
      setExpanded(new Set());
      setChildrenMap({});
      setLoadingChildren(new Set());

      try {
        const p =
          new URLSearchParams({
            userGuid,
            fromDate,
            toDate
          });

        if (branchGuid) {
          p.set(
            "branchGuid",
            branchGuid
          );
        }

        const res =
          await fetch(
            `${API_BASE_URL}/api/trial-balance?${p}`,
            {
              method: "GET",
              cache: "no-store"
            }
          );

        const raw =
          await res.text();

        let result = null;

        if (raw) {
          try {
            result =
              JSON.parse(raw);
          } catch {
            result = null;
          }
        }

        if (!res.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              raw ||
              `تعذر تحميل ميزان المراجعة (HTTP ${res.status})`
          );
        }

        const data =
          result?.data || {};

        setRoots(
          Array.isArray(data?.rows)
            ? data.rows
            : []
        );

        setSnapshotId(
          String(
            data?.snapshotId || ""
          )
        );

        setTotalRowCount(
          n(data?.rowCount)
        );

        setTotals({
          openingMaden:
            n(
              data?.totals
                ?.openingMaden
            ),

          openingDaen:
            n(
              data?.totals
                ?.openingDaen
            ),

          transMaden:
            n(
              data?.totals
                ?.transMaden
            ),

          transDaen:
            n(
              data?.totals
                ?.transDaen
            ),

          finalMaden:
            n(
              data?.totals
                ?.finalMaden
            ),

          finalDaen:
            n(
              data?.totals
                ?.finalDaen
            )
        });

        setLoadedOnce(true);
      } catch (e) {
        setRoots([]);
        setSnapshotId("");
        setTotalRowCount(0);

        setError(
          e?.message ||
            "تعذر تحميل ميزان المراجعة"
        );

        setLoadedOnce(true);
      } finally {
        setLoading(false);
      }
    }, [
      userGuid,
      fromDate,
      toDate,
      branchGuid
    ]);

  const toggleRow =
    useCallback(async (row) => {
      const key =
        keyOf(row?.guid);

      if (!key ||
          !row?.hasChildren) {
        return;
      }

      if (expanded.has(key)) {
        setExpanded(
          (current) => {
            const next =
              new Set(current);

            next.delete(key);
            return next;
          }
        );

        return;
      }

      /*
       * لو الأطفال اتحملوا قبل كده:
       * افتح فورًا بدون API.
       */
      if (childrenMap[key]) {
        setExpanded(
          (current) => {
            const next =
              new Set(current);

            next.add(key);
            return next;
          }
        );

        return;
      }

      if (!snapshotId) {
        return;
      }

      setLoadingChildren(
        (current) => {
          const next =
            new Set(current);

          next.add(key);
          return next;
        }
      );

      try {
        const p =
          new URLSearchParams({
            userGuid,
            snapshotId,
            parentGuid:
              String(row.guid)
          });

        const res =
          await fetch(
            `${API_BASE_URL}/api/trial-balance/children?${p}`,
            {
              cache: "no-store"
            }
          );

        const result =
          await res
            .json()
            .catch(() => null);

        if (!res.ok) {
          throw new Error(
            result?.message ||
              "تعذر تحميل الحسابات الفرعية"
          );
        }

        const children =
          Array.isArray(
            result?.data
          )
            ? result.data
            : [];

        setChildrenMap(
          (current) => ({
            ...current,
            [key]: children
          })
        );

        setExpanded(
          (current) => {
            const next =
              new Set(current);

            next.add(key);
            return next;
          }
        );
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title:
            "تعذر فتح الحساب",
          text:
            e?.message ||
            "حدث خطأ"
        });
      } finally {
        setLoadingChildren(
          (current) => {
            const next =
              new Set(current);

            next.delete(key);
            return next;
          }
        );
      }
    }, [
      expanded,
      childrenMap,
      snapshotId,
      userGuid
    ]);

  const collapseAll =
    useCallback(() => {
      setExpanded(new Set());
    }, []);

  const openBranches =
    useCallback(async () => {
      setBranchOpen(true);

      if (branches.length) {
        return;
      }

      setBranchesLoading(true);

      try {
        const p =
          new URLSearchParams({
            userGuid
          });

        const res =
          await fetch(
            `${API_BASE_URL}/api/trial-balance/cost-centers?${p}`,
            { cache: "no-store" }
          );

        const result =
          await res
            .json()
            .catch(() => null);

        if (!res.ok) {
          throw new Error(
            result?.message ||
              "تعذر تحميل الفروع / مراكز التكلفة"
          );
        }

        setBranches(
          Array.isArray(
            result?.data
          )
            ? result.data
            : []
        );
      } catch (e) {
        setBranches([]);

        await Swal.fire({
          icon: "error",
          title:
            "تعذر تحميل القائمة",
          text:
            e?.message ||
            "حدث خطأ"
        });
      } finally {
        setBranchesLoading(false);
      }
    }, [
      branches.length,
      userGuid
    ]);

  const filteredBranches =
    useMemo(() => {
      const q =
        branchSearch
          .trim()
          .toLowerCase();

      if (!q) {
        return branches;
      }

      return branches.filter(
        (b) =>
          `${b?.code || ""} ${b?.name || ""}`
            .toLowerCase()
            .includes(q)
      );
    }, [
      branches,
      branchSearch
    ]);

  const chooseBranch =
    useCallback((branch) => {
      setBranchGuid(
        branch?.guid || ""
      );

      setBranchName(
        branch?.name || ""
      );

      setBranchOpen(false);
      setBranchSearch("");
    }, []);

  const clearBranch =
    useCallback(() => {
      setBranchGuid("");
      setBranchName("");
    }, []);

  const getAllRows =
    useCallback(async () => {
      if (!snapshotId) {
        return [];
      }

      const p =
        new URLSearchParams({
          userGuid,
          snapshotId
        });

      const res =
        await fetch(
          `${API_BASE_URL}/api/trial-balance/all?${p}`,
          {
            cache: "no-store"
          }
        );

      const result =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          result?.message ||
            "تعذر تجهيز التقرير"
        );
      }

      return Array.isArray(
        result?.data
      )
        ? result.data
        : [];
    }, [
      snapshotId,
      userGuid
    ]);

  const exportExcel =
    useCallback(async () => {
      if (!snapshotId) return;

      try {
        const allRows =
          await getAllRows();

        const body =
          allRows
            .map(
              (r) => `
                <tr>
                  <td>${String(r.code || "")}</td>
                  <td>${String(r.accountName || "")}</td>
                  <td>${money(r.openingMaden)}</td>
                  <td>${money(r.openingDaen)}</td>
                  <td>${money(r.transMaden)}</td>
                  <td>${money(r.transDaen)}</td>
                  <td>${money(r.finalMaden)}</td>
                  <td>${money(r.finalDaen)}</td>
                </tr>`
            )
            .join("");

        const html = `
          <html dir="rtl">
            <head>
              <meta charset="UTF-8" />
            </head>
            <body>
              <h2>ميزان المراجعة</h2>
              <div>من ${fromDate} إلى ${toDate}</div>
              <table border="1">
                <thead>
                  <tr>
                    <th>كود الحساب</th>
                    <th>اسم الحساب</th>
                    <th>أول المدة - مدين</th>
                    <th>أول المدة - دائن</th>
                    <th>الفترة - مدين</th>
                    <th>الفترة - دائن</th>
                    <th>آخر الفترة - مدين</th>
                    <th>آخر الفترة - دائن</th>
                  </tr>
                </thead>
                <tbody>
                  ${body}
                </tbody>
              </table>
            </body>
          </html>`;

        const blob =
          new Blob(
            ["\ufeff", html],
            {
              type:
                "application/vnd.ms-excel;charset=utf-8;"
            }
          );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement("a");

        a.href = url;

        a.download =
          `ميزان_المراجعة_${fromDate}_${toDate}.xls`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title:
            "تعذر التصدير",
          text:
            e?.message ||
            "حدث خطأ"
        });
      }
    }, [
      snapshotId,
      getAllRows,
      fromDate,
      toDate
    ]);

  const printPdf =
    useCallback(async () => {
      if (!snapshotId) return;

      try {
        const allRows =
          await getAllRows();

        const w =
          window.open(
            "",
            "_blank"
          );

        if (!w) {
          throw new Error(
            "اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى"
          );
        }

        const body =
          allRows
            .map(
              (r) => `
              <tr>
                <td>${String(r.code || "")}</td>
                <td>${String(r.accountName || "")}</td>
                <td>${money(r.openingMaden)}</td>
                <td>${money(r.openingDaen)}</td>
                <td>${money(r.transMaden)}</td>
                <td>${money(r.transDaen)}</td>
                <td>${money(r.finalMaden)}</td>
                <td>${money(r.finalDaen)}</td>
              </tr>`
            )
            .join("");

        w.document.write(`
          <!doctype html>
          <html dir="rtl">
          <head>
            <meta charset="utf-8" />
            <title>ميزان المراجعة</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 10mm;
              }

              body {
                font-family:
                  Arial,
                  Tahoma,
                  sans-serif;
              }

              h1 {
                text-align: center;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }

              th,
              td {
                border: 1px solid #ccd7d1;
                padding: 5px;
                text-align: center;
              }

              th {
                background: #e8f2ee;
              }
            </style>
          </head>

          <body>
            <h1>ميزان المراجعة</h1>

            <div style="text-align:center;margin-bottom:10px">
              الفترة من
              ${fromDate}
              إلى
              ${toDate}
              ${
                branchName
                  ? ` - ${branchName}`
                  : ""
              }
            </div>

            <table>
              <thead>
                <tr>
                  <th>كود الحساب</th>
                  <th>اسم الحساب</th>
                  <th>أول المدة - مدين</th>
                  <th>أول المدة - دائن</th>
                  <th>الفترة - مدين</th>
                  <th>الفترة - دائن</th>
                  <th>آخر الفترة - مدين</th>
                  <th>آخر الفترة - دائن</th>
                </tr>
              </thead>

              <tbody>
                ${body}
              </tbody>
            </table>

            <script>
              window.onload =
                function () {
                  window.print();
                };
            </script>
          </body>
          </html>
        `);

        w.document.close();
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title:
            "تعذر تجهيز PDF",
          text:
            e?.message ||
            "حدث خطأ"
        });
      }
    }, [
      snapshotId,
      getAllRows,
      fromDate,
      toDate,
      branchName
    ]);

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
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
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2
        }}
      >
        <Alert severity="error">
          لا توجد لديك صلاحية
          ميزان المراجعة
          ضمن الحسابات العامة.
        </Alert>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={
            mobileSidebarOpen
          } onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: "#f6f8f7",
        fontFamily:
          "Tahoma, Arial, sans-serif"
      }}
    >
      

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          p: {
            xs: 0.6,
            sm: 1,
            lg: 1.2
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            border:
              `1px solid ${border}`,

            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={{
              bgcolor: primaryDark,
              color: "#fff",

              px: {
                xs: 1.1,
                sm: 1.5
              },

              py: 0.8,

              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",

              gap: 1
            }}
          >
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
            >
              {!isDesktop && (
                <IconButton
                  onClick={() =>
                    setMobileSidebarOpen(true)
                  }
                  sx={{
                    color: "#fff",
                    p: 0.5
                  }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              )}

              <AssessmentIcon
                fontSize="small"
              />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,

                    fontSize: {
                      xs: 16,
                      sm: 19
                    },

                    lineHeight: 1.25
                  }}
                >
                  ميزان المراجعة
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.8,
                    fontSize: 12
                  }}
                >
                  الحسابات العامة
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label={
                totalRowCount
                  ? `${totalRowCount} حساب`
                  : "جاهز"
              }
              sx={{
                bgcolor: "#fff",
                color: primaryDark,
                fontWeight: 900,
                height: 26
              }}
            />
          </Box>

          <Box
            sx={{
              p: {
                xs: 0.7,
                sm: 1
              }
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 0.65,
                borderRadius: 1.5,
                borderColor: border,
                bgcolor: soft
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",
                    sm:
                      "1fr 1fr",
                    lg:
                      "165px 165px minmax(220px, 1fr) 90px 90px 90px"
                  },

                  gap: 0.65,
                  alignItems: "center"
                }, uiLayout.filterBarSx)}
              >
                <TextField sx={uiLayout.formFieldSx}
                  size="small"
                  type="date"
                  label="الفترة من"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField sx={uiLayout.formFieldSx}
                  size="small"
                  type="date"
                  label="الفترة إلى"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  label=
                    "الفرع / مركز التكلفة"
                  value={branchName}
                  placeholder="الكل"
                  InputProps={{
                    readOnly: true,

                    endAdornment:
                      branchName ? (
                        <Tooltip
                          title=
                            "إلغاء الاختيار"
                        >
                          <IconButton
                            size="small"
                            onClick={
                              clearBranch
                            }
                          >
                            <CloseIcon
                              fontSize="small"
                            />
                          </IconButton>
                        </Tooltip>
                      ) : null
                  }}
                  onClick={
                    openBranches
                  }
                />

                <Button
                  variant="contained"
                  startIcon={
                    <RefreshIcon />
                  }
                  onClick={loadData}
                  disabled={loading}
                  sx={uiLayout.withUiSx({
                    minHeight: 36,
                    fontWeight: 900
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <FileDownloadIcon />
                  }
                  onClick={
                    exportExcel
                  }
                  disabled={
                    !snapshotId
                  }
                  sx={uiLayout.withUiSx({
                    minHeight: 36,
                    fontWeight: 900,
                    color: primary,
                    borderColor: primary
                  }, uiLayout.buttonSx)}
                >
                  Excel
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <PictureAsPdfIcon />
                  }
                  onClick={printPdf}
                  disabled={
                    !snapshotId
                  }
                  sx={uiLayout.withUiSx({
                    minHeight: 36,
                    fontWeight: 900,
                    color: "#c62828",
                    borderColor:
                      "#c62828"
                  }, uiLayout.buttonSx)}
                >
                  PDF
                </Button>
              </Box>
            </Paper>

            {roots.length > 0 && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  my: 0.6
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  onClick={
                    collapseAll
                  }
                  startIcon={
                    <ExpandLessIcon />
                  }
                  sx={uiLayout.withUiSx({
                    color:
                      primaryDark,

                    fontWeight: 900,

                    minHeight: 30
                  }, uiLayout.buttonSx)}
                >
                  طي الكل
                </Button>

                {branchName && (
                  <Chip
                    size="small"
                    label={branchName}
                    onDelete={
                      clearBranch
                    }
                  />
                )}
              </Stack>
            )}

            {loading ? (
              <Box
                sx={{
                  minHeight: 220,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Stack
                  alignItems="center"
                  spacing={1}
                >
                  <CircularProgress
                    size={30}
                  />

                  <Typography
                    variant="body2"
                  >
                    جاري تحميل
                    ميزان المراجعة...
                  </Typography>
                </Stack>
              </Box>
            ) : error ? (
              <Alert
                severity="error"
                sx={{ mt: 0.7 }}
              >
                {error}
              </Alert>
            ) : !loadedOnce ? (
              <Alert
                severity="info"
                sx={{ mt: 0.7 }}
              >
                اختر الفترة ثم
                اضغط عرض.
              </Alert>
            ) : roots.length === 0 ? (
              <Alert
                severity="warning"
                sx={{ mt: 0.7 }}
              >
                لا توجد حركة أو
                أرصدة في الفترة
                المحددة.
              </Alert>
            ) : isMobile ? (
              <Stack spacing={0.65}>
                {visibleRows.map(
                  (row) => {
                    const rowKey =
                      keyOf(
                        row.guid
                      );

                    const isExpanded =
                      expanded.has(
                        rowKey
                      );

                    const isLoading =
                      loadingChildren.has(
                        rowKey
                      );

                    return (
                      <Paper
                        key={
                          rowKey ||
                          row.code
                        }
                        variant=
                          "outlined"
                        sx={{
                          p: 0.7,
                          borderRadius: 1.5,
                          borderColor:
                            border,

                          mr:
                            `${Math.min(
                              row.depth,
                              4
                            ) * 7}px`
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent=
                            "space-between"
                          alignItems=
                            "center"
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: 13
                              }}
                            >
                              {
                                row.accountName
                              }
                            </Typography>

                            <Typography
                              variant="caption"
                            >
                              كود:
                              {" "}
                              {row.code}
                            </Typography>
                          </Box>

                          {row.hasChildren && (
                            <IconButton
                              size="small"
                              disabled={
                                isLoading
                              }
                              onClick={() =>
                                toggleRow(
                                  row
                                )
                              }
                            >
                              {isLoading ? (
                                <CircularProgress
                                  size={18}
                                />
                              ) : isExpanded ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          )}
                        </Stack>

                        <Box
                          sx={{
                            mt: 0.6,

                            display:
                              "grid",

                            gridTemplateColumns:
                              "1fr 1fr",

                            gap: 0.45
                          }}
                        >
                          {[
                            [
                              "أول مدين",
                              row.openingMaden
                            ],
                            [
                              "أول دائن",
                              row.openingDaen
                            ],
                            [
                              "الفترة مدين",
                              row.transMaden
                            ],
                            [
                              "الفترة دائن",
                              row.transDaen
                            ],
                            [
                              "آخر مدين",
                              row.finalMaden
                            ],
                            [
                              "آخر دائن",
                              row.finalDaen
                            ]
                          ].map(
                            ([
                              label,
                              value
                            ]) => (
                              <Box
                                key={
                                  label
                                }
                                sx={{
                                  p: 0.45,
                                  textAlign:
                                    "center",
                                  border:
                                    `1px solid ${border}`,
                                  borderRadius:
                                    1
                                }}
                              >
                                <Typography
                                  variant=
                                    "caption"
                                  sx={{
                                    fontSize:
                                      12
                                  }}
                                >
                                  {
                                    label
                                  }
                                </Typography>

                                <Typography
                                  sx={{
                                    fontWeight:
                                      900,
                                    fontSize:
                                      12
                                  }}
                                >
                                  {money(
                                    value
                                  )}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      </Paper>
                    );
                  }
                )}
              </Stack>
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={uiLayout.withUiSx({
                  borderColor:
                    border,

                  borderRadius:
                    1.5,

                  maxHeight:
                    isTablet
                      ? "calc(100vh - 205px)"
                      : "calc(100vh - 190px)"
                }, uiLayout.tableContainerSx)}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    minWidth: 1050,

                    "& th": {
                      bgcolor:
                        headerBg,

                      fontWeight:
                        900,

                      whiteSpace:
                        "nowrap",

                      py: 0.65,
                      px: 0.8,
                      fontSize: 12
                    },

                    "& td": {
                      whiteSpace:
                        "nowrap",

                      fontWeight:
                        700,

                      py: 0.55,
                      px: 0.8,
                      fontSize: 12
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{
                          width: 90
                        }}
                      >
                        كود الحساب
                      </TableCell>

                      <TableCell
                        sx={{
                          minWidth:
                            270
                        }}
                      >
                        اسم الحساب
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        أول المدة -
                        مدين
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        أول المدة -
                        دائن
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        الفترة -
                        مدين
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        الفترة -
                        دائن
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        آخر الفترة -
                        مدين
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        آخر الفترة -
                        دائن
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {visibleRows.map(
                      (
                        row,
                        index
                      ) => {
                        const rowKey =
                          keyOf(
                            row.guid
                          );

                        const isExpanded =
                          expanded.has(
                            rowKey
                          );

                        const isLoading =
                          loadingChildren.has(
                            rowKey
                          );

                        return (
                          <TableRow
                            hover
                            key={
                              rowKey ||
                              `${row.code}-${index}`
                            }
                            sx={{
                              bgcolor:
                                row.depth ===
                                0
                                  ? index %
                                      2 ===
                                    0
                                    ? "#f3f8f5"
                                    : "#ffffff"
                                  : "#ffffff"
                            }}
                          >
                            <TableCell
                              align=
                                "center"
                            >
                              {
                                row.code
                              }
                            </TableCell>

                            <TableCell>
                              <Box
                                sx={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  pr:
                                    `${Math.min(
                                      row.depth,
                                      6
                                    ) * 18}px`
                                }}
                              >
                                {row.hasChildren ? (
                                  <IconButton
                                    size=
                                      "small"
                                    disabled={
                                      isLoading
                                    }
                                    onClick={() =>
                                      toggleRow(
                                        row
                                      )
                                    }
                                    sx={{
                                      ml: 0.3,
                                      p: 0.35,
                                      color:
                                        primary
                                    }}
                                  >
                                    {isLoading ? (
                                      <CircularProgress
                                        size={16}
                                      />
                                    ) : isExpanded ? (
                                      <ExpandLessIcon
                                        fontSize=
                                          "small"
                                      />
                                    ) : (
                                      <ExpandMoreIcon
                                        fontSize=
                                          "small"
                                      />
                                    )}
                                  </IconButton>
                                ) : (
                                  <Box
                                    sx={{
                                      width:
                                        30
                                    }}
                                  />
                                )}

                                <Typography
                                  component=
                                    "span"
                                  sx={{
                                    fontWeight:
                                      row.depth ===
                                      0
                                        ? 900
                                        : 700,

                                    fontSize:
                                      12
                                  }}
                                >
                                  {
                                    row.accountName
                                  }
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                            >
                              {money(
                                row.openingMaden
                              )}
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                            >
                              {money(
                                row.openingDaen
                              )}
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                            >
                              {money(
                                row.transMaden
                              )}
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                            >
                              {money(
                                row.transDaen
                              )}
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                              sx={{
                                color:
                                  n(
                                    row.finalMaden
                                  ) > 0
                                    ? "#16803c"
                                    : "inherit"
                              }}
                            >
                              {money(
                                row.finalMaden
                              )}
                            </TableCell>

                            <TableCell
                              align=
                                "center"
                              sx={{
                                color:
                                  n(
                                    row.finalDaen
                                  ) > 0
                                    ? "#d32f2f"
                                    : "inherit"
                              }}
                            >
                              {money(
                                row.finalDaen
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}

                    <TableRow
                      sx={{
                        "& td": {
                          bgcolor:
                            totalBg,

                          fontWeight:
                            900,

                          py: 0.55,

                          borderTop:
                            "2px solid #bcc9c3"
                        }
                      }}
                    >
                      <TableCell />

                      <TableCell>
                        الإجماليات
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        {money(
                          totals.openingMaden
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        {money(
                          totals.openingDaen
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        {money(
                          totals.transMaden
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                      >
                        {money(
                          totals.transDaen
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          color:
                            "#16803c"
                        }}
                      >
                        {money(
                          totals.finalMaden
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          color:
                            "#d32f2f"
                        }}
                      >
                        {money(
                          totals.finalDaen
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={branchOpen}
        onClose={() =>
          setBranchOpen(false)
        }
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 900
          }}
        >
          الفروع /
          مراكز التكلفة
        </DialogTitle>

        <DialogContent dividers>
          <TextField InputLabelProps={{ shrink: true }}
            autoFocus
            fullWidth
            size="small"
            value={branchSearch}
            onChange={(e) =>
              setBranchSearch(
                e.target.value
              )
            }
            placeholder="بحث..."
            InputProps={{
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ ml: 1 }}
                />
              )
            }}
            sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.formFieldSx)}
          />

          {branchesLoading ? (
            <Box
              sx={{
                py: 4,
                textAlign: "center"
              }}
            >
              <CircularProgress
                size={28}
              />
            </Box>
          ) : (
            <Stack spacing={0.5}>
              <Button
                variant="outlined"
                onClick={() => {
                  clearBranch();
                  setBranchOpen(false);
                }}
                sx={uiLayout.withUiSx({
                  justifyContent:
                    "space-between",
                  color:
                    primaryDark,
                  borderColor:
                    border
                }, uiLayout.buttonSx)}
              >
                <span>
                  كل الفروع
                </span>

                <small>
                  بدون فلتر
                </small>
              </Button>

              {filteredBranches.map(
                (b) => (
                  <Button
                    key={
                      b.guid ||
                      `${b.code}-${b.name}`
                    }
                    variant=
                      "outlined"
                    onClick={() =>
                      chooseBranch(
                        b
                      )
                    }
                    sx={uiLayout.withUiSx({
                      justifyContent:
                        "space-between",

                      color:
                        primaryDark,

                      borderColor:
                        border
                    }, uiLayout.buttonSx)}
                  >
                    <span>
                      {b.name}
                    </span>

                    <small>
                      {b.code}
                    </small>
                  </Button>
                )
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setBranchOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
