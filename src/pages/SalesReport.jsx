import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
    DialogActions,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import AssessmentIcon from "@mui/icons-material/Assessment";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";


import SalesInvoiceDialog from "../components/SalesInvoiceDialog";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const getCurrentUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
};

const getUserGuid = () => {
  const user = getCurrentUser();

  return String(
    user?.guid ||
    user?.Guid ||
    user?.userGuid ||
    user?.UserGuid ||
    ""
  ).trim();
};

const todayForInput = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "en-GB-u-ca-gregory",
    {
      calendar: "gregory",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(date);
};

const money = (value) =>
  Number(value || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

const safeText = (value) =>
  String(value ?? "").trim();

const uniqueOptions = (
  rows,
  valueField,
  labelField = valueField
) => {
  const map = new Map();

  rows.forEach((row) => {
    const value =
      safeText(row?.[valueField]);

    const label =
      safeText(row?.[labelField]);

    if (!value || !label) return;

    if (!map.has(value)) {
      map.set(value, {
        value,
        label
      });
    }
  });

  return Array.from(
    map.values()
  ).sort((a, b) =>
    a.label.localeCompare(
      b.label,
      "ar"
    )
  );
};

const escapeCsv = (value) =>
  `"${String(value ?? "")
    .replace(/"/g, '""')}"`;

const getInvoiceField = (
  invoice,
  ...keys
) => {
  for (const key of keys) {
    const match =
      Object.keys(invoice || {})
        .find(
          (existing) =>
            existing.toLowerCase() ===
            key.toLowerCase()
        );

    if (match) {
      return invoice[match];
    }
  }

  return "";
};

function CreditNoteDialog({
  open,
  onClose,
  row,
  details,
  userGuid
}) {
  const theme = useTheme();
  const isPhone =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const [reason, setReason] =
    useState("");

  const [items, setItems] =
    useState([]);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setItems([]);
      return;
    }

    const source =
      Array.isArray(details?.items)
        ? details.items
        : [];

    setItems(
      source.map((item) => ({
        ...item,
        quantity:
          Number(item?.quantity || 1),
        cost:
          Number(item?.cost || 0),
        taxRate:
          Number(item?.taxRate || 0),
        tax:
          Number(item?.tax || 0),
        subTotal:
          Number(item?.subTotal || 0)
      }))
    );
  }, [open, details]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc.total +=
            Number(item?.quantity || 0) *
            Number(item?.cost || 0);

          acc.tax +=
            Number(item?.tax || 0);

          acc.subTotal +=
            Number(item?.subTotal || 0);

          return acc;
        },
        {
          total: 0,
          tax: 0,
          subTotal: 0
        }
      ),
    [items]
  );

  const updateItem = (
    index,
    field,
    rawValue
  ) => {
    setItems((previous) =>
      previous.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          let next = {
            ...item,
            [field]:
              Math.abs(
                Number(rawValue || 0)
              )
          };

          let qty =
            Math.abs(
              Number(
                next.quantity || 0
              )
            );

          if (!qty) qty = 1;

          let cost =
            Math.abs(
              Number(
                next.cost || 0
              )
            );

          let taxRate =
            Math.abs(
              Number(
                next.taxRate || 0
              )
            );

          let tax =
            Math.abs(
              Number(
                next.tax || 0
              )
            );

          let subTotal =
            Math.abs(
              Number(
                next.subTotal || 0
              )
            );

          // نفس منطق الديسكتوب:
          // تعديل الكمية/التكلفة/نسبة الضريبة يعيد حساب الضريبة والصافي.
          if (
            field === "quantity" ||
            field === "cost" ||
            field === "taxRate"
          ) {
            const beforeTax =
              qty * cost;

            tax =
              beforeTax *
              (taxRate / 100);

            subTotal =
              beforeTax + tax;
          }

          // تعديل الصافي مباشرة يعيد استخراج التكلفة والضريبة.
          if (field === "subTotal") {
            const divisor =
              1 + taxRate / 100;

            const beforeTax =
              divisor > 0
                ? subTotal / divisor
                : subTotal;

            tax =
              subTotal -
              beforeTax;

            cost =
              qty > 0
                ? beforeTax / qty
                : beforeTax;
          }

          next = {
            ...next,
            quantity:
              Number(qty.toFixed(2)),
            cost:
              Number(cost.toFixed(2)),
            taxRate:
              Number(taxRate.toFixed(2)),
            tax:
              Number(tax.toFixed(2)),
            subTotal:
              Number(
                subTotal.toFixed(2)
              )
          };

          return next;
        }
      )
    );
  };

  const save = async () => {
    if (saving) return;

    if (!reason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "سبب الإشعار مطلوب",
        text:
          "برجاء إدخال سبب الإشعار.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    if (
      !items.length ||
      totals.subTotal <= 0
    ) {
      await Swal.fire({
        icon: "warning",
        title:
          "مبلغ الإشعار غير صحيح",
        text:
          "لا توجد تفاصيل صحيحة لحفظ إشعار الدائن.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const confirm =
      await Swal.fire({
        icon: "question",
        title: "حفظ إشعار الدائن",
        html: `
          <div style="direction:rtl;line-height:1.8">
            الفاتورة الأصلية:
            <b>${row?.code || ""}</b>
            <br/>
            قيمة الإشعار:
            <b style="color:#ae1e21">
              ${money(totals.subTotal)}
            </b>
            ر.س
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          "حفظ الإشعار",
        cancelButtonText: "رجوع",
        reverseButtons: true
      });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/sales-report/${encodeURIComponent(
            row.guid
          )}/credit-note?code=${encodeURIComponent(
            row.code
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              regDate:
                new Date()
                  .toISOString(),
              reason:
                reason.trim(),
              items:
                items.map(
                  (item) => ({
                    diplomGuid:
                      item?.diplomGuid ||
                      "",
                    diplomType:
                      Number(
                        item?.diplomType ||
                        0
                      ),
                    quantity:
                      Number(
                        item?.quantity ||
                        1
                      ),
                    unit:
                      item?.unit ||
                      "PCS",
                    cost:
                      Number(
                        item?.cost ||
                        0
                      ),
                    taxRate:
                      Number(
                        item?.taxRate ||
                        0
                      ),
                    tax:
                      Number(
                        item?.tax ||
                        0
                      ),
                    subTotal:
                      Number(
                        item?.subTotal ||
                        0
                      )
                  })
                )
            })
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const serverDetails = [
          result?.error,
          result?.innerError,
          result?.sqlError?.procedure
            ? `الإجراء: ${result.sqlError.procedure}`
            : "",
          result?.sqlError?.number
            ? `SQL: ${result.sqlError.number}`
            : ""
        ]
          .filter(Boolean)
          .join(" | ");

        throw new Error(
          serverDetails
            ? `${result?.message || "تعذر حفظ إشعار الدائن"}: ${serverDetails}`
            : (
                result?.message ||
                "تعذر حفظ إشعار الدائن"
              )
        );
      }

      const code =
        result?.data
          ?.creditNoteCode;

      await Swal.fire({
        icon:
          result?.warning
            ? "warning"
            : "success",
        title:
          "تم حفظ إشعار الدائن",
        html: `
          <div style="direction:rtl;line-height:1.9">
            تم إنشاء إشعار الدائن بنجاح
            ${
              code
                ? `<br/>رقم الإشعار: <b style="color:#057546">${code}</b>`
                : ""
            }
            ${
              result?.warning
                ? `<br/><span style="color:#b26a00;font-size:13px">${result.warning}</span>`
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا"
      });

      onClose();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title:
          "تعذر حفظ إشعار الدائن",
        text:
          e?.message ||
          "حدث خطأ أثناء الحفظ",
        confirmButtonText: "حسنًا"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={
        saving
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="lg"
      fullScreen={isPhone}
      PaperProps={{
        sx: {
          borderRadius: {
            xs: 0,
            sm: 2
          },
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: primaryColor,
          color: "#fff",
          py: 0.85,
          px: 1.3
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box
            sx={{
              direction: "rtl"
            }}
          >
            <Typography
              sx={{
                fontWeight: 1000
              }}
            >
              إشعار دائن
            </Typography>

            <Typography
              sx={{
                opacity: 0.85,
                fontSize: ".62rem"
              }}
            >
              الفاتورة الأصلية
              #{row?.code}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            disabled={saving}
            sx={{
              color: "#fff"
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: {
            xs: 0.75,
            sm: 1.15
          },
          direction: "rtl"
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs:
                "repeat(2,minmax(0,1fr))",
              sm:
                "repeat(4,minmax(0,1fr))"
            },
            gap: 0.55,
            mb: 0.75
          }}
        >
          {[
            [
              "اسم الطالب",
              row?.studentName
            ],
            [
              "رقم الهوية",
              row?.nationalId
            ],
            [
              "رقم الجوال",
              row?.studentTel
            ],
            [
              "رقم الفاتورة",
              row?.code
            ]
          ].map(
            ([label, value]) => (
              <Paper
                key={label}
                variant="outlined"
                sx={{
                  p: 0.65,
                  direction: "rtl",
                  textAlign: "right",
                  bgcolor: "#f8fbf9"
                }}
              >
                <Typography
                  sx={{
                    color: "#657a70",
                    fontWeight: 800,
                    fontSize: ".57rem"
                  }}
                >
                  {label}
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: ".74rem"
                  }}
                >
                  {value || "-"}
                </Typography>
              </Paper>
            )
          )}
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="سبب الإشعار"
          placeholder=
            "اكتب سبب إشعار الدائن..."
          value={reason}
          onChange={(e) =>
            setReason(
              e.target.value
            )
          }
          InputLabelProps={{
            shrink: true
          }}
          inputProps={{
            dir: "rtl"
          }}
          sx={{
            mb: 0.8
          }}
        />

        <Paper
          variant="outlined"
          sx={{
            overflowX: "auto"
          }}
        >
          <Box
            component="table"
            dir="rtl"
            sx={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth: 760,
              "& th": {
                bgcolor: "#dceaf5",
                p: 0.6,
                fontWeight: 950,
                fontSize: ".66rem"
              },
              "& td": {
                bgcolor: "#fff2c8",
                p: 0.5,
                textAlign: "center",
                borderBottom:
                  "1px solid #eadca8"
              }
            }}
          >
            <thead>
              <tr>
                <th>البيان</th>
                <th>الوحدة</th>
                <th>الكمية</th>
                <th>التكلفة</th>
                <th>%الضريبة</th>
                <th>الضريبة</th>
                <th>الصافي</th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (item, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        minWidth:
                          "190px",
                        fontWeight:
                          800
                      }}
                    >
                      {item?.itemName ||
                        "-"}
                    </td>

                    <td>
                      {item?.unit ||
                        "PCS"}
                    </td>

                    {[
                      "quantity",
                      "cost",
                      "taxRate",
                      "tax",
                      "subTotal"
                    ].map(
                      (field) => (
                        <td key={field}>
                          <TextField
                            size="small"
                            type="number"
                            value={
                              item?.[
                                field
                              ] ?? 0
                            }
                            onChange={(
                              e
                            ) =>
                              updateItem(
                                index,
                                field,
                                e.target
                                  .value
                              )
                            }
                            inputProps={{
                              min: 0,
                              step:
                                "0.01",
                              style: {
                                padding:
                                  "5px",
                                textAlign:
                                  "center"
                              , direction: "ltr", unicodeBidi: "isolate" }
                            , dir: "ltr" }}
                            sx={{
                              width:
                                field ===
                                "quantity"
                                  ? 72
                                  : 88
                            }}
                          />
                        </td>
                      )
                    )}
                  </tr>
                )
              )}
            </tbody>
          </Box>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: 0.5,
            mt: 0.7
          }}
        >
          {[
            [
              "الإجمالي",
              totals.total
            ],
            [
              "الضريبة",
              totals.tax
            ],
            [
              "الصافي",
              totals.subTotal
            ]
          ].map(
            ([label, value]) => (
              <Paper
                key={label}
                variant="outlined"
                sx={{
                  p: 0.65,
                  textAlign: "center"
                }}
              >
                <Typography
                  sx={{
                    fontSize: ".56rem",
                    color: "#69786f"
                  }}
                >
                  {label}
                </Typography>

                <Typography
                  sx={{
                    color: accentColor,
                    fontWeight: 1000
                  }}
                >
                  {money(value)}
                </Typography>
              </Paper>
            )
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          direction: "rtl",
          gap: 0.6,
          px: 1.2,
          py: 0.85
        }}
      >
        <Button
          variant="contained"
          startIcon={
            saving
              ? (
                <CircularProgress
                  size={15}
                  color="inherit"
                />
              )
              : <SaveIcon />
          }
          disabled={saving}
          onClick={save}
        >
          حفظ
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          disabled={saving}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SalesReport() {
  const theme = useTheme();

  const isPhone =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const isTablet =
    useMediaQuery(
      `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 1}px)`
    );

  const userGuid =
    useMemo(
      () => getUserGuid(),
      []
    );

  const isDesktop =
    useMediaQuery(
      `(min-width:${DESKTOP_BREAKPOINT}px)`
    );

  const [mobileSidebarOpen,
    setMobileSidebarOpen] =
    useState(false);

  const [fromDate, setFromDate] =
    useState(todayForInput());

  const [toDate, setToDate] =
    useState(todayForInput());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [permissionLoading,
    setPermissionLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [advancedOpen,
    setAdvancedOpen] =
    useState(false);

  const [selectedBranches,
    setSelectedBranches] =
    useState([]);

  const [selectedTypes,
    setSelectedTypes] =
    useState([]);

  const [selectedUsers,
    setSelectedUsers] =
    useState([]);

  const [menuAnchor,
    setMenuAnchor] =
    useState(null);

  const [menuRow,
    setMenuRow] =
    useState(null);

  const [detailsOpen,
    setDetailsOpen] =
    useState(false);

  const [detailsRow,
    setDetailsRow] =
    useState(null);

  const [creditOpen,
    setCreditOpen] =
    useState(false);

  const [creditRow,
    setCreditRow] =
    useState(null);

  const [creditDetails,
    setCreditDetails] =
    useState(null);

  // =========================================================
  // Front-end fail closed permission.
  // Backend also validates code=43 + Reports menu.
  // =========================================================
  useEffect(() => {
    let alive = true;

    const checkPermission =
      async () => {
        if (!userGuid) {
          if (alive) {
            setAuthorized(false);
            setPermissionLoading(false);
          }
          return;
        }

        try {
          const response =
            await fetch(
              `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(
                userGuid
              )}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json"
                }
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          const ok =
            response.ok &&
            result?.data?.reports
              ?.canView === true &&
            result?.data?.reports
              ?.screens
              ?.salesReport === true;

          if (alive) {
            setAuthorized(ok);
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
      };

    checkPermission();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  const loadData =
    useCallback(async () => {
      if (!authorized ||
          !userGuid) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            fromDate,
            toDate,
            userGuid
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/sales-report?${params.toString()}`,
            {
              cache: "no-store",
              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        const result =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            "تعذر تحميل تقرير المبيعات"
          );
        }

        setRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (e) {
        setRows([]);
        setError(
          e?.message ||
          "تعذر تحميل تقرير المبيعات"
        );
      } finally {
        setLoading(false);
      }
    }, [
      authorized,
      fromDate,
      toDate,
      userGuid
    ]);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [
    authorized,
    loadData
  ]);

  const branchOptions =
    useMemo(
      () =>
        uniqueOptions(
          rows,
          "branchName"
        ),
      [rows]
    );

  const typeOptions =
    useMemo(
      () =>
        uniqueOptions(
          rows,
          "typeName"
        ),
      [rows]
    );

  const userOptions =
    useMemo(
      () =>
        uniqueOptions(
          rows,
          "userName"
        ),
      [rows]
    );

  const filteredRows =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const branchSet =
        new Set(
          selectedBranches.map(
            (item) => item.value
          )
        );

      const typeSet =
        new Set(
          selectedTypes.map(
            (item) => item.value
          )
        );

      const userSet =
        new Set(
          selectedUsers.map(
            (item) => item.value
          )
        );

      return rows.filter((row) => {
        if (
          branchSet.size &&
          !branchSet.has(
            safeText(
              row.branchName
            )
          )
        ) {
          return false;
        }

        if (
          typeSet.size &&
          !typeSet.has(
            safeText(
              row.typeName
            )
          )
        ) {
          return false;
        }

        if (
          userSet.size &&
          !userSet.has(
            safeText(
              row.userName
            )
          )
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const haystack =
          [
            row.code,
            row.studentName,
            row.studentTel,
            row.nationalId,
            row.notes,
            row.branchName,
            row.userName,
            row.typeName
          ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(
          query
        );
      });
    }, [
      rows,
      search,
      selectedBranches,
      selectedTypes,
      selectedUsers
    ]);

  const totals =
    useMemo(
      () =>
        filteredRows.reduce(
          (acc, row) => {
            acc.net +=
              Number(
                row?.billTotal || 0
              );

            acc.tax +=
              Number(
                row?.billTax || 0
              );

            acc.gross +=
              Number(
                row?.billSubTotal || 0
              );

            return acc;
          },
          {
            net: 0,
            tax: 0,
            gross: 0
          }
        ),
      [filteredRows]
    );

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openCreditNote =
    async (
      row,
      suppliedDetails = null
    ) => {
      setMenuAnchor(null);
      setMenuRow(null);

      try {
        let details =
          suppliedDetails;

        if (!details) {
          Swal.fire({
            title:
              "جاري تحميل بيانات الفاتورة...",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () =>
              Swal.showLoading()
          });

          const response =
            await fetch(
              `${API_BASE_URL}/api/sales-report/${encodeURIComponent(
                row.guid
              )}/details?code=${encodeURIComponent(
                row.code
              )}&userGuid=${encodeURIComponent(
                userGuid
              )}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json"
                }
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          Swal.close();

          if (!response.ok) {
            throw new Error(
              result?.message ||
              result?.error ||
              "تعذر تحميل تفاصيل الفاتورة"
            );
          }

          details =
            result?.data || null;
        }

        setCreditRow(row);
        setCreditDetails(details);
        setCreditOpen(true);
      } catch (e) {
        Swal.close();

        await Swal.fire({
          icon: "error",
          title:
            "تعذر فتح إشعار الدائن",
          text:
            e?.message ||
            "تعذر تحميل بيانات الفاتورة",
          confirmButtonText: "حسنًا"
        });
      }
    };

  const exportCsv = () => {
    if (!filteredRows.length) {
      Swal.fire({
        icon: "info",
        title: "لا توجد بيانات",
        text:
          "لا توجد بيانات لتصديرها",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const headers = [
      "تاريخ الفاتورة",
      "رقم الفاتورة",
      "اسم الطالب",
      "رقم الجوال",
      "رقم الهوية",
      "ملاحظات",
      "الصافي",
      "الضريبة",
      "الإجمالي",
      "الفرع",
      "اسم المستخدم",
      "نوع الفاتورة"
    ];

    const csvRows =
      filteredRows.map((row) => [
        formatDate(row.billDate),
        row.code,
        row.studentName,
        row.studentTel,
        row.nationalId,
        row.notes,
        row.billTotal,
        row.billTax,
        row.billSubTotal,
        row.branchName,
        row.userName,
        row.typeName
      ]);

    const csv =
      "\uFEFF" +
      [headers, ...csvRows]
        .map((line) =>
          line
            .map(escapeCsv)
            .join(",")
        )
        .join("\r\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `تقرير_المبيعات_${fromDate}_${toDate}.csv`;

    document.body
      .appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const resendZatca =
    async (row) => {
      setMenuAnchor(null);
      setMenuRow(null);

      // نغلق MUI Menu أولاً حتى لا يسحب الـ focus من SweetAlert.
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 220)
      );

      const passwordResult =
        await Swal.fire({
          icon: "question",
          title:
            "إعادة إرسال الفاتورة للهيئة",
          html: `
            <div style="direction:rtl">
              الفاتورة رقم
              <b>${row?.code || ""}</b>
            </div>
          `,
          input: "password",
          inputLabel:
            "كلمة المرور",
          inputPlaceholder:
            "أدخل كلمة المرور",
          showCancelButton: true,
          confirmButtonText:
            "إعادة الإرسال",
          cancelButtonText:
            "رجوع",
          returnFocus: false,
          focusConfirm: false,
          inputValidator: (value) =>
            String(value || "").trim()
              ? undefined
              : "برجاء إدخال كلمة المرور",
          didOpen: () => {
            const container =
              document.querySelector(
                ".swal2-container"
              );

            if (container) {
              container.style.zIndex =
                "2147483647";
            }

            Swal.getInput()?.focus();
          }
        });

      if (!passwordResult.isConfirmed) {
        return;
      }

      try {
        Swal.fire({
          title:
            "جاري تجهيز الفاتورة للإرسال...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () =>
            Swal.showLoading()
        });

        const response =
          await fetch(
            `${API_BASE_URL}/api/sales-report/${encodeURIComponent(
              row.guid
            )}/resend-zatca`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                userGuid,
                password:
                  passwordResult.value,
                code: row.code
              })
            }
          );

        const result =
          await response
            .json()
            .catch(() => null);

        Swal.close();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            result?.error ||
            "تعذر إعادة الإرسال"
          );
        }

        await Swal.fire({
          icon: "success",
          title: "تم بنجاح",
          text:
            result?.message ||
            "تمت إعادة إضافة الفاتورة للإرسال",
          confirmButtonText: "حسنًا"
        });
      } catch (e) {
        Swal.close();

        await Swal.fire({
          icon: "error",
          title:
            "تعذر إعادة الإرسال",
          text:
            e?.message ||
            "حدث خطأ أثناء إعادة الإرسال",
          confirmButtonText: "حسنًا"
        });
      }
    };

  const columns =
    useMemo(
      () => [
        {
          field: "actions",
          headerName: "إجراءات",
          width: 78,
          sortable: false,
          filterable: false,
          align: "center",
          headerAlign: "center",
          renderCell: ({ row }) => (
            <Stack
              direction="row"
              spacing={0}
            >
              <Tooltip title="عرض الفاتورة">
                <IconButton
                  size="small"
                  onClick={() =>
                    openDetails(row)
                  }
                  sx={{
                    color: primaryColor
                  }}
                >
                  <VisibilityIcon
                    sx={{
                      fontSize: 18
                    }}
                  />
                </IconButton>
              </Tooltip>

              <IconButton
                size="small"
                onClick={(event) => {
                  setMenuAnchor(
                    event.currentTarget
                  );

                  setMenuRow(row);
                }}
              >
                <MoreVertIcon
                  sx={{
                    fontSize: 18
                  }}
                />
              </IconButton>
            </Stack>
          )
        },
        {
          field: "code",
          headerName: "رقم الفاتورة",
          minWidth: 88,
          flex: 0.7,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "billDate",
          headerName: "تاريخ الفاتورة",
          minWidth: 100,
          maxWidth: 112,
          flex: 0.8,
          align: "center",
          headerAlign: "center",
          valueFormatter: (value) =>
            formatDate(
              value?.value ?? value
            )
        },
        {
          field: "studentName",
          headerName: "اسم الطالب",
          minWidth: 180,
          flex: 1.65,
          align: "center",
          headerAlign: "center",
          renderCell: ({ value }) => (
            <Tooltip
              title={safeText(value)}
            >
              <Typography
                sx={{
                  width: "100%",
                  textAlign: "center",
                  fontWeight: 850,
                  fontSize: ".72rem",
                  whiteSpace: "normal",
                  lineHeight: 1.25
                }}
              >
                {value || "-"}
              </Typography>
            </Tooltip>
          )
        },
        {
          field: "studentTel",
          headerName: "رقم الجوال",
          minWidth: 105,
          flex: 0.8,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "nationalId",
          headerName: "رقم الهوية",
          minWidth: 105,
          flex: 0.82,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "notes",
          headerName: "ملاحظات",
          minWidth: 150,
          flex: 1.2,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "billTotal",
          headerName: "الصافي",
          minWidth: 70,
          maxWidth: 90,
          flex: 0.58,
          align: "center",
          headerAlign: "center",
          cellClassName: "amount-cell",
          valueFormatter: (value) =>
            money(
              value?.value ?? value
            )
        },
        {
          field: "billTax",
          headerName: "الضريبة",
          minWidth: 65,
          maxWidth: 82,
          flex: 0.52,
          align: "center",
          headerAlign: "center",
          cellClassName: "amount-cell",
          valueFormatter: (value) =>
            money(
              value?.value ?? value
            )
        },
        {
          field: "billSubTotal",
          headerName: "الإجمالي",
          minWidth: 75,
          maxWidth: 96,
          flex: 0.62,
          align: "center",
          headerAlign: "center",
          cellClassName: "amount-cell",
          valueFormatter: (value) =>
            money(
              value?.value ?? value
            )
        },
        {
          field: "branchName",
          headerName: "الفرع",
          minWidth: 190,
          flex: 1.6,
          align: "center",
          headerAlign: "center",
          renderCell: ({ value }) => (
            <Tooltip
              title={safeText(value)}
            >
              <Typography
                sx={{
                  width: "100%",
                  textAlign: "center",
                  fontWeight: 760,
                  fontSize: ".7rem",
                  whiteSpace: "normal",
                  lineHeight: 1.2
                }}
              >
                {value || "-"}
              </Typography>
            </Tooltip>
          )
        },
        {
          field: "userName",
          headerName: "اسم المستخدم",
          minWidth: 125,
          flex: 0.95,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "typeName",
          headerName: "نوع الفاتورة",
          minWidth: 135,
          flex: 1.05,
          align: "center",
          headerAlign: "center"
        }
      ],
      []
    );

  const tabletColumns =
    useMemo(
      () => [
        {
          field: "details",
          headerName: "التفاصيل",
          width: 92,
          sortable: false,
          filterable: false,
          align: "center",
          headerAlign: "center",
          renderCell: ({ row }) => (
            <Button
              size="small"
              variant="outlined"
              startIcon={
                <VisibilityIcon
                  sx={{ fontSize: 16 }}
                />
              }
              onClick={() =>
                openDetails(row)
              }
              sx={{
                minWidth: 82,
                px: 0.7,
                py: 0.25,
                fontSize: ".62rem",
                fontWeight: 900,
                whiteSpace: "nowrap"
              }}
            >
              عرض
            </Button>
          )
        },
        {
          field: "code",
          headerName: "الفاتورة",
          width: 78,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "billDate",
          headerName: "التاريخ",
          width: 94,
          align: "center",
          headerAlign: "center",
          valueFormatter: (value) =>
            formatDate(
              value?.value ?? value
            )
        },
        {
          field: "studentName",
          headerName: "اسم الطالب",
          minWidth: 145,
          flex: 1.2,
          align: "center",
          headerAlign: "center",
          renderCell: ({ value }) => (
            <Tooltip title={safeText(value)}>
              <Typography
                sx={{
                  width: "100%",
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: ".67rem",
                  lineHeight: 1.15,
                  whiteSpace: "normal",
                  overflow: "hidden"
                }}
              >
                {value || "-"}
              </Typography>
            </Tooltip>
          )
        },
        {
          field: "branchName",
          headerName: "الفرع",
          minWidth: 150,
          flex: 1.25,
          align: "center",
          headerAlign: "center",
          renderCell: ({ value }) => (
            <Tooltip title={safeText(value)}>
              <Typography
                sx={{
                  width: "100%",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: ".63rem",
                  lineHeight: 1.15,
                  whiteSpace: "normal",
                  overflow: "hidden"
                }}
              >
                {value || "-"}
              </Typography>
            </Tooltip>
          )
        },
        {
          field: "billSubTotal",
          headerName: "الإجمالي",
          width: 82,
          align: "center",
          headerAlign: "center",
          cellClassName: "amount-cell",
          valueFormatter: (value) =>
            money(
              value?.value ?? value
            )
        },
        {
          field: "menu",
          headerName: "",
          width: 42,
          sortable: false,
          filterable: false,
          align: "center",
          headerAlign: "center",
          renderCell: ({ row }) => (
            <IconButton
              size="small"
              onClick={(event) => {
                setMenuAnchor(
                  event.currentTarget
                );
                setMenuRow(row);
              }}
            >
              <MoreVertIcon
                sx={{ fontSize: 18 }}
              />
            </IconButton>
          )
        }
      ],
      []
    );

  const tabletVisibility =
    useMemo(
      () => ({
        studentTel: false,
        nationalId: false,
        notes: false,
        userName: false
      }),
      []
    );

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "55vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <Stack
          spacing={1}
          alignItems="center"
        >
          <CircularProgress />
          <Typography>
            جاري التحقق من الصلاحيات...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box
        sx={{
          p: 2,
          direction: "rtl"
        }}
      >
        <Alert severity="error">
          ليس لديك صلاحية تقرير
          المبيعات. يلزم وجود صلاحية
          قائمة التقارير وصلاحية شاشة
          تقرير المبيعات.
        </Alert>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={
          mobileSidebarOpen
        } onMobileClose={() =>
          setMobileSidebarOpen(
            false
          )
        }><>
      {!isDesktop && (
        <AppBar
          position="sticky"
          elevation={1}
          sx={{
            bgcolor: primaryColor,
            zIndex: 1250
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              direction: "rtl",
              minHeight: {
                xs: 44,
                sm: 48
              }
            }}
          >
            <IconButton
              color="inherit"
              onClick={() =>
                setMobileSidebarOpen(
                  true
                )
              }
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontWeight: 950,
                fontSize: {
                  xs: ".88rem",
                  sm: "1rem"
                }
              }}
            >
              تقرير المبيعات
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <Box
        sx={{
          p: {
            xs: 0.55,
            sm: 0.85,
            md: 1.2
          },
          direction: "rtl",
          minWidth: 0,
          boxSizing: "border-box",
          ...navigationContentSx
        }}
      >
      <Paper
        elevation={0}
        sx={{
          border:
            "1px solid #d7e4de",
          borderRadius: 2,
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            bgcolor: primaryColor,
            color: "#fff",
            px: {
              xs: 1,
              sm: 1.5
            },
            py: {
              xs: 0.75,
              sm: 1
            }
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 1000,
                  fontSize: {
                    xs: "1rem",
                    sm: "1.2rem"
                  }
                }}
              >
                تقرير المبيعات
              </Typography>

              {!isPhone && (
                <Typography
                  sx={{
                    opacity: 0.88,
                    fontSize: ".68rem"
                  }}
                >
                  تقرير فواتير المبيعات
                  والإجماليات والتفاصيل
                </Typography>
              )}
            </Box>

            <Chip
              label={`عدد الفواتير: ${filteredRows.length}`}
              sx={{
                bgcolor: "#fff",
                color: primaryDark,
                fontWeight: 900,
                height: 29
              }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: {
              xs: 0.7,
              sm: 1.1
            }
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs:
                  "repeat(2,minmax(0,1fr))",
                sm:
                  "170px 170px 95px 130px minmax(220px,1fr)"
              },
              gap: {
                xs: 0.55,
                sm: 0.7
              },
              alignItems: "end"
            }}
          >
            <TextField
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

            <TextField
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

            <Button
              variant="contained"
              startIcon={
                loading
                  ? (
                    <CircularProgress
                      size={15}
                      color="inherit"
                    />
                  )
                  : <RefreshIcon />
              }
              disabled={loading}
              onClick={loadData}
              sx={{
                minHeight: 40
              }}
            >
              عرض
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <DownloadIcon />
              }
              onClick={exportCsv}
              sx={{
                minHeight: 40
              }}
            >
              تصدير
            </Button>

            <TextField
              size="small"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="بحث في الفواتير..."
              InputProps={{
                startAdornment:
                  <SearchIcon
                    sx={{
                      fontSize: 18,
                      color: "#81978e",
                      ml: 0.5
                    }}
                  />
              }}
              sx={{
                gridColumn: {
                  xs: "span 2",
                  sm: "span 2",
                  lg: "auto"
                }
              }}
            />
          </Box>

          <Button
            fullWidth={isPhone}
            size="small"
            variant={
              advancedOpen
                ? "contained"
                : "outlined"
            }
            startIcon={<FilterAltIcon />}
            onClick={() =>
              setAdvancedOpen(
                (value) => !value
              )
            }
            sx={{
              mt: 0.65,
              mb: advancedOpen
                ? 0.55
                : 0
            }}
          >
            فلاتر متقدمة
          </Button>

          {advancedOpen && (
            <Paper
              variant="outlined"
              sx={{
                mt: 0.35,
                p: {
                  xs: 0.55,
                  sm: 0.8
                },
                bgcolor: "#fbfdfc"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs:
                      "repeat(2,minmax(0,1fr))",
                    md:
                      "repeat(3,minmax(0,1fr))"
                  },
                  gap: 0.55
                }}
              >
                {[
                  [
                    "الفرع",
                    branchOptions,
                    selectedBranches,
                    setSelectedBranches
                  ],
                  [
                    "نوع الفاتورة",
                    typeOptions,
                    selectedTypes,
                    setSelectedTypes
                  ],
                  [
                    "المستخدم",
                    userOptions,
                    selectedUsers,
                    setSelectedUsers
                  ]
                ].map(
                  ([
                    label,
                    options,
                    value,
                    setter
                  ]) => (
                    <Autocomplete
                      key={label}
                      multiple
                      size="small"
                      options={options}
                      value={value}
                      onChange={(
                        _,
                        newValue
                      ) =>
                        setter(
                          newValue
                        )
                      }
                      getOptionLabel={(
                        option
                      ) =>
                        option?.label ||
                        ""
                      }
                      isOptionEqualToValue={(
                        option,
                        selected
                      ) =>
                        option.value ===
                        selected.value
                      }
                      limitTags={1}
                      noOptionsText="لا توجد خيارات"
                      renderInput={(
                        params
                      ) => (
                        <TextField
                          {...params}
                          label={label}
                          placeholder={
                            value.length
                              ? ""
                              : `اختر ${label}`
                          }
                        />
                      )}
                    />
                  )
                )}
              </Box>
            </Paper>
          )}

          <Stack
            direction="row"
            spacing={0.5}
            flexWrap="wrap"
            useFlexGap
            justifyContent="flex-end"
            sx={{
              my: 0.8
            }}
          >
            <Chip
              size="small"
              label={`الإجمالي: ${money(
                totals.gross
              )}`}
              sx={{
                fontWeight: 900
              }}
            />

            <Chip
              size="small"
              label={`الضريبة: ${money(
                totals.tax
              )}`}
              sx={{
                fontWeight: 900
              }}
            />

            <Chip
              size="small"
              label={`الصافي: ${money(
                totals.net
              )}`}
              sx={{
                color: accentColor,
                fontWeight: 950
              }}
            />
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 0.7
              }}
            >
              {error}
            </Alert>
          )}

          {/* Mobile: cards, no horizontal scroll */}
          {isPhone ? (
            <Stack spacing={0.65}>
              {loading && (
                <Box
                  sx={{
                    py: 5,
                    textAlign: "center"
                  }}
                >
                  <CircularProgress
                    size={28}
                  />
                </Box>
              )}

              {!loading &&
                filteredRows.map(
                  (row, index) => (
                    <Paper
                      key={
                        row.guid ||
                        `${row.code}-${index}`
                      }
                      variant="outlined"
                      sx={{
                        p: 0.75,
                        bgcolor:
                          index % 2 === 0
                            ? "#fff"
                            : "#fff0df",
                        borderColor:
                          "#e2ddd5"
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={0.7}
                      >
                        <Box
                          sx={{
                            minWidth: 0,
                            flex: 1
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              label={`#${row.code}`}
                              sx={{
                                height: 22,
                                fontSize: ".58rem",
                                fontWeight: 900,
                                bgcolor:
                                  "#e7f4ee",
                                color:
                                  primaryDark
                              }}
                            />

                            <Typography
                              sx={{
                                fontSize:
                                  ".62rem",
                                fontWeight:
                                  800,
                                color:
                                  "#66756e"
                              }}
                            >
                              {formatDate(
                                row.billDate
                              )}
                            </Typography>
                          </Stack>

                          <Typography
                            sx={{
                              mt: 0.45,
                              fontSize:
                                ".78rem",
                              fontWeight:
                                950,
                              lineHeight:
                                1.25
                            }}
                          >
                            {row.studentName ||
                              "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,
                              fontSize:
                                ".62rem",
                              color:
                                "#596b63",
                              fontWeight:
                                750
                            }}
                          >
                            {row.branchName ||
                              "-"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.4}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{
                              mt: 0.5
                            }}
                          >
                            <Chip
                              size="small"
                              label={
                                row.typeName ||
                                "فاتورة"
                              }
                              sx={{
                                height: 21,
                                fontSize:
                                  ".55rem"
                              }}
                            />

                            <Chip
                              size="small"
                              label={`${money(
                                row.billSubTotal
                              )} ر.س`}
                              sx={{
                                height: 21,
                                fontSize:
                                  ".57rem",
                                fontWeight:
                                  950,
                                color:
                                  accentColor
                              }}
                            />
                          </Stack>
                        </Box>

                        <Stack
                          direction="row"
                          spacing={0}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              openDetails(
                                row
                              )
                            }
                            sx={{
                              color:
                                primaryColor
                            }}
                          >
                            <VisibilityIcon
                              sx={{
                                fontSize:
                                  19
                              }}
                            />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={(
                              event
                            ) => {
                              setMenuAnchor(
                                event
                                  .currentTarget
                              );

                              setMenuRow(
                                row
                              );
                            }}
                          >
                            <MoreVertIcon
                              sx={{
                                fontSize:
                                  18
                              }}
                            />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  )
                )}

              {!loading &&
                !filteredRows.length && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      textAlign: "center"
                    }}
                  >
                    لا توجد فواتير
                  </Paper>
                )}
            </Stack>
          ) : isTablet ? (
            <Box
              sx={{
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden"
              }}
            >
              <DataGrid
                autoHeight
                rows={filteredRows}
                columns={tabletColumns}
                getRowId={(row) =>
                  row.guid ||
                  `${row.code}-${row.billDate}`
                }
                loading={loading}
                disableRowSelectionOnClick
                pageSizeOptions={[
                  25,
                  50,
                  100
                ]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 50,
                      page: 0
                    }
                  }
                }}
                rowHeight={54}
                columnHeaderHeight={44}
                getRowClassName={(
                  params
                ) =>
                  params
                    .indexRelativeToCurrentPage %
                    2 ===
                  0
                    ? "sales-row-even"
                    : "sales-row-odd"
                }
                onRowDoubleClick={(
                  params
                ) =>
                  openDetails(
                    params.row
                  )
                }
                sx={{
                  width: "100%",
                  maxWidth: "100%",
                  direction: "rtl",
                  border:
                    "1px solid #dfddd8",

                  "& .MuiDataGrid-main": {
                    overflow: "hidden"
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX:
                      "hidden !important"
                  },

                  "& .MuiDataGrid-columnHeaders":
                    {
                      bgcolor:
                        "#f4f1ec",
                      color:
                        "#143d31"
                    },

                  "& .MuiDataGrid-columnHeaderTitle":
                    {
                      fontWeight:
                        "900 !important",
                      fontSize:
                        ".67rem"
                    },

                  "& .MuiDataGrid-cell":
                    {
                      fontSize:
                        ".66rem",
                      fontWeight:
                        750,
                      borderBottom:
                        "1px solid #dfddd8",
                      px: 0.45
                    },

                  "& .amount-cell":
                    {
                      fontWeight:
                        950,
                      fontVariantNumeric:
                        "tabular-nums"
                    },

                  "& .sales-row-even":
                    {
                      bgcolor: "#fff"
                    },

                  "& .sales-row-odd":
                    {
                      bgcolor:
                        "#fff0df"
                    },

                  "& .sales-row-even:hover, & .sales-row-odd:hover":
                    {
                      bgcolor:
                        "#f9e2c8 !important"
                    },

                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                    {
                      outline: "none"
                    }
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                overflowX: "auto"
              }}
            >
              <DataGrid
                autoHeight
                rows={filteredRows}
                columns={columns}
                getRowId={(row) =>
                  row.guid ||
                  `${row.code}-${row.billDate}`
                }
                loading={loading}
                disableRowSelectionOnClick
                pageSizeOptions={[
                  25,
                  50,
                  100
                ]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 50,
                      page: 0
                    }
                  }
                }}
                rowHeight={58}
                columnHeaderHeight={48}
                columnVisibilityModel={{}}
                getRowClassName={(
                  params
                ) =>
                  params
                    .indexRelativeToCurrentPage %
                    2 ===
                  0
                    ? "sales-row-even"
                    : "sales-row-odd"
                }
                onRowDoubleClick={(
                  params
                ) =>
                  openDetails(
                    params.row
                  )
                }
                sx={{
                  minWidth: 1280,
                  direction: "rtl",
                  border:
                    "1px solid #dfddd8",
                  "& .MuiDataGrid-columnHeaders":
                    {
                      bgcolor:
                        "#f4f1ec",
                      color:
                        "#143d31"
                    },
                  "& .MuiDataGrid-columnHeaderTitle":
                    {
                      fontWeight:
                        "900 !important"
                    },
                  "& .MuiDataGrid-cell":
                    {
                      fontSize:
                        ".72rem",
                      fontWeight:
                        700,
                      borderBottom:
                        "1px solid #dfddd8"
                    },
                  "& .amount-cell":
                    {
                      fontWeight:
                        900,
                      fontVariantNumeric:
                        "tabular-nums"
                    },
                  "& .sales-row-even":
                    {
                      bgcolor: "#fff"
                    },
                  "& .sales-row-odd":
                    {
                      bgcolor:
                        "#fff0df"
                    },
                  "& .sales-row-even:hover, & .sales-row-odd:hover":
                    {
                      bgcolor:
                        "#f9e2c8 !important"
                    },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                    {
                      outline: "none"
                    }
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuRow(null);
        }}
      >
        <MenuItem
          onClick={() =>
            menuRow &&
            openDetails(menuRow)
          }
        >
          <VisibilityIcon
            fontSize="small"
            sx={{
              ml: 1,
              color: primaryColor
            }}
          />
          عرض الفاتورة
        </MenuItem>

        <MenuItem
          onClick={() =>
            menuRow &&
            resendZatca(menuRow)
          }
        >
          <SendIcon
            fontSize="small"
            sx={{
              ml: 1,
              color: accentColor
            }}
          />
          إعادة إرسال للهيئة
        </MenuItem>

        <MenuItem
          onClick={() =>
            menuRow &&
            openCreditNote(
              menuRow
            )
          }
        >
          <ReceiptLongIcon
            fontSize="small"
            sx={{
              ml: 1,
              color: "#b26a00"
            }}
          />
          إشعار دائن
        </MenuItem>
      </Menu>

      <SalesInvoiceDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsRow(null);
        }}
        invoice={
          detailsRow
            ? {
                ...detailsRow,
                billGuid:
                  detailsRow.guid,
                BillGuid:
                  detailsRow.guid,
                billCode:
                  detailsRow.code,
                invoiceNo:
                  detailsRow.code
              }
            : null
        }
        apiBaseUrl={API_BASE_URL}
      />

      <CreditNoteDialog
        open={creditOpen}
        onClose={() => {
          setCreditOpen(false);
          setCreditRow(null);
          setCreditDetails(null);
        }}
        row={creditRow}
        details={creditDetails}
        userGuid={userGuid}
      />
    </Box>
    </></NavigationShell>
  );
}