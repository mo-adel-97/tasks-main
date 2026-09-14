import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PreviewIcon from "@mui/icons-material/Preview";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f8fbf9";
const incomeHeader = "#eef7f3";
const expenseHeader = "#fff4ec";

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
  u?.USER_GUID ||
  u?.USER_GUID____ ||
  "";

const number = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const money = (v) =>
  number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const normalize = (v) =>
  String(v ?? "").trim().toLowerCase();

function buildJournalPreview(data, cost, closingAccount, toDate) {
  const lines = [];
  const incomeAccounts = new Set();

  const closingNotes =
    `قيد اقفال السنة المالية المنتهية فى ${toDate}`;

  (data?.income || []).forEach((row) => {
    const amount = Math.abs(number(row.amount));
    const accountGuid = String(row.accountGuid || "");

    if (!amount || !accountGuid || incomeAccounts.has(accountGuid)) {
      return;
    }

    incomeAccounts.add(accountGuid);

    lines.push({
      accountCode: row.code,
      accountName: row.name,
      notes: closingNotes,
      debit: amount,
      credit: 0,
      costName: cost?.name || ""
    });
  });

  (data?.expenses || []).forEach((row) => {
    const amount = number(row.amount);

    if (!amount || !row.accountGuid) {
      return;
    }

    lines.push({
      accountCode: row.code,
      accountName: row.name,
      notes: closingNotes,
      debit: amount < 0 ? Math.abs(amount) : 0,
      credit: amount > 0 ? amount : 0,
      costName: cost?.name || ""
    });
  });

  const profitLoss = number(data?.totals?.profitLoss);

  if (profitLoss !== 0 && closingAccount?.guid) {
    lines.push({
      accountCode: closingAccount.code || "",
      accountName: closingAccount.name || "",
      notes: `قيد أرباح مرحلة بتاريخ ${toDate}`,
      debit: profitLoss < 0 ? Math.abs(profitLoss) : 0,
      credit: profitLoss > 0 ? profitLoss : 0,
      costName: ""
    });
  }

  return lines;
}

function LookupDialog({
  open,
  title,
  value,
  setValue,
  mode,
  setMode,
  rows,
  loading,
  onClose,
  onChoose
}) {
  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        {title}
      </DialogTitle>

      <DialogContent dividers>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next) => next && setMode(next)}
          sx={{ mb: 1 }}
        >
          <ToggleButton value="name">الاسم</ToggleButton>
          <ToggleButton value="code">الكود</ToggleButton>
        </ToggleButtonGroup>

        <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
          autoFocus
          fullWidth
          size="small"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="اكتب للبحث..."
          InputProps={{
            startAdornment: (
              <SearchIcon fontSize="small" sx={{ ml: 1 }} />
            )
          }}
        />

        {loading ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={uiLayout.withUiSx({ mt: 1, maxHeight: 420 }, uiLayout.tableContainerSx)}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>الكود</TableCell>
                  <TableCell>الاسم</TableCell>
                  <TableCell width={70}></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    hover
                    key={row.guid || `${row.code}-${row.name}`}
                    sx={{ cursor: "pointer" }}
                    onDoubleClick={() => onChoose(row)}
                  >
                    <TableCell>{row.code}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <Button sx={uiLayout.buttonSx}
                        size="small"
                        onClick={() => onChoose(row)}
                      >
                        اختيار
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {value.trim()
                        ? "لا توجد نتائج"
                        : "اكتب اسم الحساب أو كوده للبحث"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.dialogActionsSx}>
        <Button sx={uiLayout.buttonSx} onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ClosingEntry() {
  const theme = useTheme();

  const isMobile =
    useMediaQuery(theme.breakpoints.down("sm"));

  const isDesktop =
    useMediaQuery(
      `(min-width:${DESKTOP_BREAKPOINT}px)`,
      { noSsr: true }
    );

  const user = useMemo(() => readUser(), []);
  const userGuid = useMemo(
    () => String(getUserGuid(user)).trim(),
    [user]
  );

  const [authorized, setAuthorized] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());

  const [cost, setCost] = useState(null);
  const [closingAccount, setClosingAccount] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [costOpen, setCostOpen] = useState(false);
  const [costSearch, setCostSearch] = useState("");
  const [costMode, setCostMode] = useState("name");
  const [costRows, setCostRows] = useState([]);
  const [costLoading, setCostLoading] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountMode, setAccountMode] = useState("name");
  const [accountRows, setAccountRows] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);

  const [journalOpen, setJournalOpen] = useState(false);

  const costAbort = useRef(null);
  const accountAbort = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!userGuid) return;

        const response = await fetch(
          `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result = await response.json().catch(() => null);
        const permissionData = result?.data || {};

        const direct =
          permissionData?.generalAccounts?.canView === true &&
          permissionData?.generalAccounts?.screens?.closingEntry === true;

        const hasMenu =
          Array.isArray(permissionData?.menus) &&
          permissionData.menus.some(
            (x) =>
              normalize(x?.code) === "account" ||
              normalize(x?.name) === normalize("الحسابات العامة")
          );

        const hasForm =
          Array.isArray(permissionData?.forms) &&
          permissionData.forms.some(
            (x) =>
              normalize(x?.code) === "70" ||
              normalize(x?.name) === normalize("قيد الإقفال") ||
              normalize(x?.guid) ===
                "dd7deeb6-47c7-434a-876e-58a1bc688b13"
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

  useEffect(() => {
    if (!costOpen || !authorized) {
      costAbort.current?.abort();
      return;
    }

    const timer = setTimeout(async () => {
      costAbort.current?.abort();

      const controller = new AbortController();
      costAbort.current = controller;

      setCostLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          q: costSearch.trim(),
          by: costMode
        });

        const response = await fetch(
          `${API_BASE_URL}/api/closing-entry/cost-centers?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "تعذر تحميل مراكز التكلفة"
          );
        }

        if (!controller.signal.aborted) {
          setCostRows(
            Array.isArray(result?.data) ? result.data : []
          );
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setCostRows([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCostLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      costAbort.current?.abort();
    };
  }, [
    costOpen,
    costSearch,
    costMode,
    authorized,
    userGuid
  ]);

  useEffect(() => {
    if (!accountOpen || !authorized) {
      accountAbort.current?.abort();
      return;
    }

    // مطابق للديسكتوب AccountList:
    // الشاشة تفتح فاضية، والبحث يبدأ فقط بعد كتابة اسم/كود.
    if (!accountSearch.trim()) {
      accountAbort.current?.abort();
      setAccountRows([]);
      setAccountLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      accountAbort.current?.abort();

      const controller = new AbortController();
      accountAbort.current = controller;

      setAccountLoading(true);

      try {
        const params = new URLSearchParams({
          userGuid,
          q: accountSearch.trim(),
          by: accountMode
        });

        const response = await fetch(
          `${API_BASE_URL}/api/closing-entry/accounts?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "تعذر تحميل الحسابات"
          );
        }

        if (!controller.signal.aborted) {
          setAccountRows(
            Array.isArray(result?.data) ? result.data : []
          );
        }
      } catch (e) {
        if (e?.name !== "AbortError") {
          setAccountRows([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAccountLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      accountAbort.current?.abort();
    };
  }, [
    accountOpen,
    accountSearch,
    accountMode,
    authorized,
    userGuid
  ]);

  const loadPreview = useCallback(async () => {
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

    // مركز التكلفة اختياري في العرض مثل الديسكتوب.
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        userGuid,
        fromDate,
        toDate
      });

      if (cost?.guid) {
        params.set("costGuid", cost.guid);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/closing-entry/preview?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر تحميل بيانات قيد الإقفال"
        );
      }

      setData(result?.data || null);
    } catch (e) {
      setData(null);
      setError(
        e?.message ||
        "تعذر تحميل بيانات قيد الإقفال"
      );
    } finally {
      setLoading(false);
    }
  }, [
    userGuid,
    fromDate,
    toDate,
    cost
  ]);

  const journalLines = useMemo(
    () =>
      buildJournalPreview(
        data,
        cost,
        closingAccount,
        toDate
      ),
    [
      data,
      cost,
      closingAccount,
      toDate
    ]
  );

  const journalTotals = useMemo(() => {
    const debit = journalLines.reduce(
      (sum, row) => sum + number(row.debit),
      0
    );

    const credit = journalLines.reduce(
      (sum, row) => sum + number(row.credit),
      0
    );

    return {
      debit,
      credit,
      difference:
        Math.round((debit - credit) * 100) / 100
    };
  }, [journalLines]);

  const openJournalPreview = async () => {
    if (!data) {
      await Swal.fire({
        icon: "warning",
        title: "اعرض البيانات أولاً",
        text: "اضغط عرض قبل تجهيز قيد الإقفال"
      });
      return;
    }

    if (!cost?.guid) {
      await Swal.fire({
        icon: "warning",
        title: "اختر مركز التكلفة"
      });
      return;
    }

    if (!closingAccount?.guid) {
      await Swal.fire({
        icon: "warning",
        title: "اختر حساب الإقفال أولاً",
        text: "حساب الإقفال مطلوب لترحيل الربح أو الخسارة"
      });
      return;
    }

    if (!journalLines.length) {
      await Swal.fire({
        icon: "warning",
        title: "لا توجد مبالغ للترحيل"
      });
      return;
    }

    setJournalOpen(true);
  };

  const postClosing = async () => {
    if (!cost?.guid || !closingAccount?.guid) return;

    const confirmation = await Swal.fire({
      icon: "question",
      title: "حفظ قيد الإقفال؟",
      html:
        `سيتم إنشاء قيد يومية متزن بقيمة مدين <b>${money(journalTotals.debit)}</b> ` +
        `ودائن <b>${money(journalTotals.credit)}</b>.`,
      showCancelButton: true,
      confirmButtonText: "نعم، حفظ القيد",
      cancelButtonText: "رجوع",
      confirmButtonColor: primary
    });

    if (!confirmation.isConfirmed) return;

    setPosting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/closing-entry/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            fromDate,
            toDate,
            costGuid: cost.guid,
            costName: cost.name || "",
            closingAccountGuid: closingAccount.guid,
            closingAccountCode: closingAccount.code || "",
            closingAccountName: closingAccount.name || ""
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "تعذر حفظ قيد الإقفال"
        );
      }

      setJournalOpen(false);

      await Swal.fire({
        icon: "success",
        title: "تم حفظ قيد الإقفال",
        html:
          `رقم قيد اليومية: <b>${result?.data?.code ?? "-"}</b><br/>` +
          `إجمالي المدين: <b>${money(result?.data?.debitTotal)}</b><br/>` +
          `إجمالي الدائن: <b>${money(result?.data?.creditTotal)}</b>`,
        confirmButtonText: "حسنًا"
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ قيد الإقفال",
        text:
          e?.message ||
          "تم التراجع عن العملية بالكامل"
      });
    } finally {
      setPosting(false);
    }
  };

  const exportExcel = () => {
    if (!data) return;

    const incomeRows = (data.income || [])
      .map(
        (r) =>
          `<tr><td>${r.code || ""}</td><td>${r.name || ""}</td><td>${money(r.amount)}</td></tr>`
      )
      .join("");

    const expenseRows = (data.expenses || [])
      .map(
        (r) =>
          `<tr><td>${r.code || ""}</td><td>${r.name || ""}</td><td>${money(r.amount)}</td></tr>`
      )
      .join("");

    const html = `
      <html dir="rtl">
      <head><meta charset="UTF-8"/></head>
      <body>
        <h2>قيد الإقفال - الفترة ${fromDate} إلى ${toDate}</h2>
        <div>مركز التكلفة: ${cost?.name || ""}</div>
        <table border="1" style="display:inline-table;margin:10px">
          <tr><th colspan="3">الإيرادات</th></tr>
          <tr><th>كود</th><th>اسم الحساب</th><th>الرصيد</th></tr>
          ${incomeRows}
        </table>
        <table border="1" style="display:inline-table;margin:10px">
          <tr><th colspan="3">المصروفات</th></tr>
          <tr><th>كود</th><th>اسم الحساب</th><th>الرصيد</th></tr>
          ${expenseRows}
        </table>
        <h3>إجمالي الإيرادات: ${money(data?.totals?.income)}</h3>
        <h3>إجمالي المصروفات: ${money(data?.totals?.expenses)}</h3>
        <h3>الربح / الخسارة: ${money(data?.totals?.profitLoss)}</h3>
      </body>
      </html>`;

    const blob = new Blob(
      ["\ufeff", html],
      {
        type:
          "application/vnd.ms-excel;charset=utf-8;"
      }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
      `قيد_الاقفال_${fromDate}_${toDate}.xls`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

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
          لا توجد لديك صلاحية قيد الإقفال ضمن الحسابات العامة.
        </Alert>
      </Box>
    );
  }

  const income = data?.income || [];
  const expenses = data?.expenses || [];

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: "#f6f8f7",
        fontFamily: "Tahoma, Arial, sans-serif"
      }}
    >
      

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          p: {
            xs: 0.8,
            sm: 1,
            lg: 1.3
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${border}`,
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              bgcolor: primaryDark,
              color: "#fff",
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1
            }, uiLayout.mobileHeaderSx)}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
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

              <AccountBalanceWalletIcon />

              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: {
                      xs: 17,
                      sm: 21
                    }
                  }}
                >
                  قيد الإقفال
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label="الحسابات العامة"
              sx={{
                bgcolor: "#fff",
                color: primaryDark,
                fontWeight: 900
              }}
            />
          </Box>

          <Box sx={{ p: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 0.8,
                borderColor: border,
                borderRadius: 2,
                bgcolor: soft
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    lg:
                      "165px 165px minmax(220px,1fr) minmax(220px,1fr) 90px 90px"
                  },
                  gap: 0.7
                }, uiLayout.filterBarSx)}
              >
                <TextField sx={uiLayout.formFieldSx}
                  size="small"
                  type="date"
                  label="الفترة من"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField sx={uiLayout.formFieldSx}
                  size="small"
                  type="date"
                  label="الفترة إلى"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  label="مركز التكلفة / الفرع"
                  value={cost?.name || ""}
                  placeholder="اختر مركز التكلفة"
                  onClick={() => setCostOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: cost ? (
                      <Tooltip title="مسح">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCost(null);
                            setData(null);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }}
                />

                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  size="small"
                  label="حساب الإقفال"
                  value={
                    closingAccount
                      ? `${closingAccount.code} - ${closingAccount.name}`
                      : ""
                  }
                  placeholder="اختر حساب الإقفال"
                  onClick={() => setAccountOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: closingAccount ? (
                      <Tooltip title="مسح">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClosingAccount(null);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={loadPreview}
                  disabled={loading}
                  sx={uiLayout.withUiSx({
                    minHeight: 40,
                    fontWeight: 900
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportExcel}
                  disabled={!data}
                  sx={uiLayout.withUiSx({
                    minHeight: 40,
                    fontWeight: 900,
                    color: primary,
                    borderColor: primary
                  }, uiLayout.buttonSx)}
                >
                  Excel
                </Button>
              </Box>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box
                sx={{
                  minHeight: 300,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Stack
                  alignItems="center"
                  spacing={1}
                >
                  <CircularProgress />
                  <Typography>
                    جاري تحميل الإيرادات والمصروفات...
                  </Typography>
                </Stack>
              </Box>
            ) : data ? (
              <>
                <Box
                  sx={{
                    mt: 1,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr"
                    },
                    gap: 1
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      borderColor: border,
                      overflow: "hidden"
                    }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.75,
                        bgcolor: incomeHeader,
                        color: primaryDark,
                        fontWeight: 900,
                        fontSize: 18
                      }}
                    >
                      الإيرادات
                    </Box>

                    <TableContainer
                      sx={uiLayout.withUiSx({
                        maxHeight: {
                          xs: 360,
                          md: "calc(100vh - 340px)"
                        }
                      }, uiLayout.tableContainerSx)}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width={80}>كود</TableCell>
                            <TableCell>اسم الحساب</TableCell>
                            <TableCell align="center" width={130}>
                              الرصيد
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {income.map((row, i) => (
                            <TableRow
                              hover
                              key={`${row.accountGuid}-${i}`}
                            >
                              <TableCell sx={{ fontWeight: 800 }}>
                                {row.code}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>
                                {row.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 900,
                                  color:
                                    number(row.amount) !== 0
                                      ? primary
                                      : "inherit"
                                }}
                              >
                                {money(row.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      borderColor: border,
                      overflow: "hidden"
                    }}
                  >
                    <Box
                      sx={{
                        px: 1,
                        py: 0.75,
                        bgcolor: expenseHeader,
                        color: "#b12424",
                        fontWeight: 900,
                        fontSize: 18
                      }}
                    >
                      المصروفات
                    </Box>

                    <TableContainer
                      sx={uiLayout.withUiSx({
                        maxHeight: {
                          xs: 360,
                          md: "calc(100vh - 340px)"
                        }
                      }, uiLayout.tableContainerSx)}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width={80}>كود</TableCell>
                            <TableCell>اسم الحساب</TableCell>
                            <TableCell align="center" width={130}>
                              الرصيد
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {expenses.map((row, i) => (
                            <TableRow
                              hover
                              key={`${row.accountGuid}-${i}`}
                            >
                              <TableCell sx={{ fontWeight: 800 }}>
                                {row.code}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>
                                {row.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ fontWeight: 900 }}
                              >
                                {money(row.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(3,1fr)"
                    },
                    gap: 0.8
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      textAlign: "center",
                      borderColor: border
                    }}
                  >
                    <Typography variant="caption">
                      إجمالي الإيرادات
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: primary,
                        fontSize: 18
                      }}
                    >
                      {money(data?.totals?.income)}
                    </Typography>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      textAlign: "center",
                      borderColor: border
                    }}
                  >
                    <Typography variant="caption">
                      إجمالي المصروفات
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: "#b12424",
                        fontSize: 18
                      }}
                    >
                      {money(data?.totals?.expenses)}
                    </Typography>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      textAlign: "center",
                      borderColor: border
                    }}
                  >
                    <Typography variant="caption">
                      الربح / الخسارة
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        fontSize: 18,
                        color:
                          number(data?.totals?.profitLoss) >= 0
                            ? primary
                            : "#b12424"
                      }}
                    >
                      {money(data?.totals?.profitLoss)}
                    </Typography>
                  </Paper>
                </Box>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row"
                  }}
                  spacing={1}
                  justifyContent="flex-end"
                  sx={{ mt: 1 }}
                >
                  <Button
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    onClick={openJournalPreview}
                    sx={uiLayout.withUiSx({
                      bgcolor: primaryDark,
                      fontWeight: 900,
                      minHeight: 42
                    }, uiLayout.buttonSx)}
                  >
                    تجهيز قيد الإقفال
                  </Button>
                </Stack>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                اختر الفترة ومركز التكلفة ثم اضغط عرض.
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>

      <LookupDialog
        open={costOpen}
        title="مراكز التكلفة"
        value={costSearch}
        setValue={setCostSearch}
        mode={costMode}
        setMode={setCostMode}
        rows={costRows}
        loading={costLoading}
        onClose={() => setCostOpen(false)}
        onChoose={(row) => {
          setCost(row);
          setCostOpen(false);
          setCostSearch("");
          setData(null);
        }}
      />

      <LookupDialog
        open={accountOpen}
        title="حساب الإقفال"
        value={accountSearch}
        setValue={setAccountSearch}
        mode={accountMode}
        setMode={setAccountMode}
        rows={accountRows}
        loading={accountLoading}
        onClose={() => setAccountOpen(false)}
        onChoose={(row) => {
          setClosingAccount(row);
          setAccountOpen(false);
          setAccountSearch("");
        }}
      />

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={journalOpen}
        onClose={() => !posting && setJournalOpen(false)}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          معاينة قيد الإقفال
        </DialogTitle>

        <DialogContent dividers>
          <Stack
            direction={{
              xs: "column",
              sm: "row"
            }}
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Chip
              label={`مركز التكلفة: ${cost?.name || "-"}`}
            />
            <Chip
              label={`حساب الإقفال: ${closingAccount?.name || "-"}`}
            />
          </Stack>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={uiLayout.withUiSx({ maxHeight: 520 }, uiLayout.tableContainerSx)}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>كود</TableCell>
                  <TableCell>الحساب</TableCell>
                  <TableCell>البيان</TableCell>
                  <TableCell>مركز التكلفة</TableCell>
                  <TableCell align="center">مدين</TableCell>
                  <TableCell align="center">دائن</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {journalLines.map((row, i) => (
                  <TableRow key={`${row.accountCode}-${i}`}>
                    <TableCell>{row.accountCode}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {row.accountName}
                    </TableCell>
                    <TableCell>{row.notes}</TableCell>
                    <TableCell>{row.costName || "-"}</TableCell>
                    <TableCell align="center">
                      {money(row.debit)}
                    </TableCell>
                    <TableCell align="center">
                      {money(row.credit)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow
                  sx={{
                    "& td": {
                      fontWeight: 900,
                      bgcolor: "#f2f4f3"
                    }
                  }}
                >
                  <TableCell colSpan={4}>الإجمالي</TableCell>
                  <TableCell align="center">
                    {money(journalTotals.debit)}
                  </TableCell>
                  <TableCell align="center">
                    {money(journalTotals.credit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {Math.abs(journalTotals.difference) > 0.01 && (
            <Alert severity="error" sx={{ mt: 1 }}>
              القيد غير متزن: الفرق {money(journalTotals.difference)}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() => setJournalOpen(false)}
            disabled={posting}
          >
            رجوع
          </Button>

          <Button
            variant="contained"
            startIcon={
              posting
                ? <CircularProgress size={18} color="inherit" />
                : <SaveIcon />
            }
            onClick={postClosing}
            disabled={
              posting ||
              Math.abs(journalTotals.difference) > 0.01
            }
            sx={uiLayout.withUiSx({
              bgcolor: primary,
              fontWeight: 900
            }, uiLayout.buttonSx)}
          >
            حفظ قيد الإقفال
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}
