import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";

import MoreVertIcon
  from "@mui/icons-material/MoreVert";
import SearchIcon
  from "@mui/icons-material/Search";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import FileDownloadIcon
  from "@mui/icons-material/FileDownload";
import AccountBalanceWalletIcon
  from "@mui/icons-material/AccountBalanceWallet";
import AttachFileIcon
  from "@mui/icons-material/AttachFile";
import PlayCircleOutlineIcon
  from "@mui/icons-material/PlayCircleOutline";
import GroupsIcon
  from "@mui/icons-material/Groups";
import PercentIcon
  from "@mui/icons-material/Percent";
import FilterAltIcon
  from "@mui/icons-material/FilterAlt";
import RestartAltIcon
  from "@mui/icons-material/RestartAlt";
import DoneAllIcon
  from "@mui/icons-material/DoneAll";
import MenuRoundedIcon
  from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon
  from "@mui/icons-material/VisibilityOutlined";
import CloseIcon
  from "@mui/icons-material/Close";

import Swal from "sweetalert2";

import StudentStatementDialog2
  from "../components/StudentStatementDialog2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const ATTACHMENT_URL =
  "https://sstli.com/arc/api/view.php";

const STATUS_OPTIONS = [
  {
    value: 0,
    label: "معلق"
  },
  {
    value: 1,
    label: "تم التنفيذ"
  },
  {
    value: 2,
    label: "مرفوض"
  },
  {
    value: 3,
    label:
      "تم تأكيده - تمت المراجعة والقبول من قبل المشرف العام"
  }
];

const pad2 = (value) =>
  String(value).padStart(2, "0");

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;

const today = () =>
  toIsoDate(new Date());

const unwrap = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  for (const key of [
    "value", "Value",
    "data", "Data",
    "string", "String",
    "number", "Number",
    "amount", "Amount"
  ]) {
    if (
      value[key] !== undefined &&
      value[key] !== null &&
      value[key] !== value
    ) {
      return unwrap(value[key]);
    }
  }

  return "";
};

const pick = (
  row,
  names,
  fallback = ""
) => {
  for (const name of names) {
    const value =
      unwrap(row?.[name]);

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const numberValue = (value) => {
  const parsed = Number(
    String(
      unwrap(value) ?? "0"
    ).replace(/,/g, "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const money = (value) =>
  numberValue(value)
    .toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );

const readJson =
  async (response) => {
    const text =
      await response.text();

    let result = null;

    try {
      result = text
        ? JSON.parse(text)
        : null;
    } catch {
      result = null;
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.details ||
        result?.title ||
        text
          ?.replace(/<[^>]*>/g, " ")
          ?.replace(/\s+/g, " ")
          ?.trim()
          ?.slice(0, 700) ||
        `تعذر تنفيذ الطلب - HTTP ${response.status}`
      );
    }

    return result || {};
  };

const showError =
  (message) =>
    Swal.fire({
      icon: "error",
      title: "حدث خطأ",
      text: message,
      confirmButtonText: "حسنًا",
      confirmButtonColor:
        "#ae1e21"
    });

const showSuccess =
  (message) =>
    Swal.fire({
      icon: "success",
      title: "تم التنفيذ بنجاح",
      text: message,
      confirmButtonText: "حسنًا",
      confirmButtonColor:
        "#057546"
    });

const TextCell = ({
  value,
  align = "center"
}) => (
  <Tooltip
    title={String(value || "")}
    arrow
  >
    <Typography
      sx={{
        width: "100%",
        px: 0.25,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: align,
        fontFamily: "Cairo",
        fontSize: "0.76rem",
        fontWeight: 700,
        "@media (max-width: 599px)": {
          fontSize: "0.28rem",
          lineHeight: 1.05
        },
        "@media (min-width: 600px) and (max-width: 1599px)": {
          fontSize: "0.42rem",
          lineHeight: 1.15
        }
      }}
    >
      {value || "-"}
    </Typography>
  </Tooltip>
);

const StatusChip = ({
  status,
  label
}) => {
  const normalized =
    Number(status);

  const color =
    normalized === 1
      ? "#057546"
      : normalized === 2
        ? "#ae1e21"
        : normalized === 3
          ? "#7b1fa2"
          : "#d18b00";

  return (
    <Chip
      size="small"
      label={
        label ||
        STATUS_OPTIONS.find(
          (item) =>
            item.value ===
            normalized
        )?.label ||
        "معلق"
      }
      sx={{
        maxWidth: "100%",
        fontFamily: "Cairo",
        fontWeight: 900,
        color: "#fff",
        backgroundColor: color,
        "& .MuiChip-label": {
          overflow: "hidden",
          textOverflow: "ellipsis"
        },
        "@media (max-width: 599px)": {
          height: 20,
          fontSize: "0.26rem",
          "& .MuiChip-label": {
            px: 0.35
          }
        },
        "@media (min-width: 600px) and (max-width: 1599px)": {
          height: 24,
          fontSize: "0.4rem"
        }
      }}
    />
  );
};


const MultiValueFilter = ({
  label,
  options,
  value,
  onChange
}) => {
  const selected = Array.isArray(value) ? value : [];
  const allSelected = options.length > 0 && selected.length === options.length;

  return (
    <Paper elevation={0} sx={{ p: 1.35, borderRadius: 3, border: "1px solid #dce8e2", backgroundColor: "#fff" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#173b2b" }}>{label}</Typography>
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={() => onChange(allSelected ? [] : options)} sx={{ minWidth: 0, fontFamily: "Cairo", fontWeight: 800 }}>
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </Button>
          {selected.length > 0 && (
            <Button size="small" color="error" onClick={() => onChange([])} sx={{ minWidth: 0, fontFamily: "Cairo", fontWeight: 800 }}>مسح</Button>
          )}
        </Stack>
      </Stack>

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options}
        value={selected}
        onChange={(_event, newValue) => onChange(newValue)}
        limitTags={2}
        noOptionsText="لا توجد نتائج"
        renderOption={(props, option, state) => (
          <li {...props}>
            <Checkbox checked={state.selected} sx={{ mr: 1, color: "#6f8b7d", "&.Mui-checked": { color: "#057546" } }} />
            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.82rem", fontWeight: 700 }}>{option}</Typography>
          </li>
        )}
        renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => (
          <Chip {...getTagProps({ index })} key={option} label={option} size="small" sx={{ fontFamily: "Cairo", fontWeight: 700 }} />
        ))}
        renderInput={(params) => (
          <TextField {...params} size="small" placeholder="ابحث وحدد أكثر من قيمة" helperText={selected.length > 0 ? `تم اختيار ${selected.length} من ${options.length}` : `الكل ظاهر (${options.length})`} sx={{ "& .MuiInputBase-root": { fontFamily: "Cairo" }, "& .MuiFormHelperText-root": { fontFamily: "Cairo", textAlign: "right" } }} />
        )}
      />
    </Paper>
  );
};

const PromoStudentsDialog = ({
  open,
  onClose,
  orderGuid,
  ownerRow,
  userGuid,
  onOpenStatement
}) => {
  const [loading, setLoading] =
    useState(false);

  const [data, setData] =
    useState(null);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async () => {
      if (
        !open ||
        !orderGuid ||
        !userGuid
      ) {
        return;
      }

      setLoading(true);
      setError("");
      setData(null);

      try {
        const params =
          new URLSearchParams({
            userGuid
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/discount-requests/${encodeURIComponent(orderGuid)}/promo?${params.toString()}`,
            {
              cache: "no-store"
            }
          );

        const result =
          await readJson(response);

        setData(result?.data || {});
      } catch (err) {
        setError(
          err?.message ||
          "تعذر تحميل طلاب الخصم الترويجي"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      open,
      orderGuid,
      userGuid
    ]
  );

  useEffect(() => {
    load();
  }, [load]);

  const students =
    Array.isArray(data?.students)
      ? data.students
      : [];

  const rows = students.map(
    (student, index) => ({
      id:
        student?.regDocGuid ||
        student?.accountGuid ||
        `${student?.nationalId || "student"}-${index}`,
      ...student
    })
  );

  const columns = [
    {
      field: "nationalId",
      headerName: "رقم الهوية",
      flex: 0.9,
      minWidth: 130,
      renderCell: (params) => (
        <TextCell
          value={params.value}
        />
      )
    },
    {
      field: "studentName",
      headerName: "اسم الطالب",
      flex: 1.6,
      minWidth: 220,
      renderCell: (params) => (
        <TextCell
          value={params.value}
          align="start"
        />
      )
    },
    {
      field: "regDocCode",
      headerName: "رقم الاستمارة",
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <TextCell
          value={params.value}
        />
      )
    },
    {
      field: "statement",
      headerName: "كشف الحساب",
      width: 125,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() =>
            onOpenStatement(
              params.row
            )
          }
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900,
            backgroundColor:
              "#057546"
          }}
        >
          عرض
        </Button>
      )
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          direction: "rtl",
          "@media (max-width: 599px)": {
            width: "94vw",
            maxHeight: "86dvh",
            borderRadius: 2.5
          },
          "@media (min-width: 600px) and (max-width: 1599px)": {
            width: "90vw",
            maxHeight: "84dvh"
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "Cairo",
          fontWeight: 900,
          color: "#057546",
          textAlign: "center"
        }}
      >
        الطلاب المشمولون في الخصم الترويجي
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box
            sx={{
              minHeight: 300,
              display: "grid",
              placeItems: "center"
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography
            color="error"
            sx={{
              py: 5,
              textAlign: "center",
              fontFamily: "Cairo",
              fontWeight: 800
            }}
          >
            {error}
          </Typography>
        )}

        {!loading &&
          !error &&
          data && (
          <>
            <Typography
              sx={{
                mb: 2,
                textAlign: "center",
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#ae1e21"
              }}
            >
              صاحب الخصم:{" "}
              {data?.ownerStudentName ||
                ownerRow?.studentName ||
                "-"}{" "}
              | الهوية:{" "}
              {data?.ownerNationalId ||
                ownerRow?.nationalId ||
                "-"}{" "}
              | عدد الطلاب:{" "}
              {data?.studentCount ??
                rows.length}{" "}
              | إجمالي الخصم:{" "}
              {money(
                data?.totalAmount
              )}{" "}
              ريال
            </Typography>

            <Paper
              elevation={0}
              sx={{
                height: 390,
                border:
                  "1px solid #dce8e2"
              }}
            >
              <DataGrid
                rows={rows}
                columns={columns}
                localeText={{
                  noRowsLabel:
                    "لا توجد بيانات طلاب محفوظة"
                }}
                disableRowSelectionOnClick
                hideFooter={
                  rows.length <= 25
                }
                pageSizeOptions={[
                  25, 50, 100
                ]}
                sx={{
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",
                  "& .MuiDataGrid-columnHeaders":
                    {
                      backgroundColor:
                        "#eef8f3",
                      color: "#173b2b",
                      fontWeight: 900
                    }
                }}
              />
            </Paper>

            {data?.notes && (
              <Paper
                elevation={0}
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  border:
                    "1px solid #dce8e2",
                  backgroundColor:
                    "#fafdfb"
                }}
              >
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontWeight: 800,
                    lineHeight: 1.9
                  }}
                >
                  {data.notes}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DiscountRequestsReport = () => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsRow, setDetailsRow] =
    useState(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsRow(null);
  };

  const currentUser = useMemo(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "user"
          ) || "{}"
        );
      } catch {
        return {};
      }
    },
    []
  );

  const userGuid = String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(today());

  const [toDate, setToDate] =
    useState(today());

  const [rows, setRows] =
    useState([]);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    discountStatusName: [],
    requestStatusName: [],
    discountName: [],
    requestedBy: [],
    hasPromoStudents: []
  });

  const [loading, setLoading] =
    useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [menuRow, setMenuRow] =
    useState(null);

  const [
    statementStudent,
    setStatementStudent
  ] = useState(null);

  const [
    statementOpen,
    setStatementOpen
  ] = useState(false);

  const [
    statusDialogOpen,
    setStatusDialogOpen
  ] = useState(false);

  const [
    selectedStatus,
    setSelectedStatus
  ] = useState(0);

  const [
    statusNotes,
    setStatusNotes
  ] = useState("");

  const [
    savingStatus,
    setSavingStatus
  ] = useState(false);

  const [
    promoDialogOpen,
    setPromoDialogOpen
  ] = useState(false);

  const loadData = useCallback(
    async () => {
      if (!userGuid) {
        await showError(
          "بيانات المستخدم غير موجودة"
        );
        return;
      }

      if (fromDate > toDate) {
        await showError(
          "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية"
        );
        return;
      }

      setLoading(true);

      try {
        const params =
          new URLSearchParams({
            userGuid,
            fromDate,
            toDate
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/discount-requests/report?${params.toString()}`,
            {
              cache: "no-store"
            }
          );

        const result =
          await readJson(response);

        setRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        setRows([]);

        await showError(
          error?.message ||
          "تعذر تحميل طلبات الخصم"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      userGuid,
      fromDate,
      toDate
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const gridRows = useMemo(
    () =>
      rows.map(
        (row, index) => {
          /*
           * الديسكتوب يعرض عمودين مختلفين:
           * STAUT__     = حالة الخصم
           * ORDERSTAUT_ = حالة الطلب (نشط/غير نشط)
           *
           * التنفيذ يخص حالة الخصم، لذلك لا نستخدم
           * ORDERSTAUT_ في اختيار حالة التنفيذ.
           */
          const discountStatusName = String(
            pick(row, [
              "DiscountStatusName",
              "discountStatusName",
              "STAUT__",
              "statusName"
            ])
          );

          const requestStatusName = String(
            pick(row, [
              "RequestStatusName",
              "requestStatusName",
              "ORDERSTAUT_",
              "orderStatusName"
            ])
          );

          const discountStatus =
            numberValue(
              pick(
                row,
                [
                  "DiscountStatusCode",
                  "discountStatusCode",
                  "OrderStaut",
                  "orderStaut"
                ],
                discountStatusName.includes(
                  "تم تأكيد"
                )
                  ? 3
                  : discountStatusName ===
                      "تم التنفيذ"
                    ? 1
                    : discountStatusName ===
                        "مرفوض"
                      ? 2
                      : 0
              )
            );

          return {
            id: String(
              pick(
                row,
                [
                  "Guid",
                  "guid",
                  "DiscountOrderGuid"
                ],
                `discount-${index}`
              )
            ),

            raw: row,

            orderDate: String(
              pick(row, [
                "OrderDate",
                "orderDate"
              ])
            ),

            requestedBy: String(
              pick(row, [
                "FullName",
                "fullName",
                "RequestedBy"
              ])
            ),

            studentName: String(
              pick(row, [
                "StudentName",
                "studentName"
              ])
            ),

            nationalId: String(
              pick(row, [
                "NationalId",
                "nationalId"
              ])
            ),

            accountGuid: String(
              pick(row, [
                "AccountGuid",
                "accountGuid"
              ])
            ),

            discountName: String(
              pick(row, [
                "DisName",
                "discountName"
              ])
            ),

            discountStatusName,
            requestStatusName,
            discountStatus,

            notes: String(
              pick(row, [
                "Notes",
                "notes"
              ])
            ),

            requesterNote: String(
              pick(row, [
                "RequesterNote",
                "requesterNote"
              ])
            ),

            promoStudents: String(
              pick(row, [
                "PromoStudents",
                "promoStudents"
              ])
            ),

            promoStudentCount:
              numberValue(
                pick(row, [
                  "PromoStudentCount",
                  "promoStudentCount",
                  "StudentCount"
                ])
              ),

            promoTotalAmount:
              numberValue(
                pick(row, [
                  "PromoTotalAmount",
                  "promoTotalAmount",
                  "TotalAmount"
                ])
              )
          };
        }
      ),
    [rows]
  );


  const filterOptions = useMemo(() => {
    const makeOptions = (field) => Array.from(new Set(gridRows.map((row) => String(row[field] || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar", { numeric: true }));
    return {
      discountStatusName: makeOptions("discountStatusName"),
      requestStatusName: makeOptions("requestStatusName"),
      discountName: makeOptions("discountName"),
      requestedBy: makeOptions("requestedBy"),
      hasPromoStudents: ["له طلاب خصم", "بدون طلاب خصم"]
    };
  }, [gridRows]);

  const filteredGridRows = useMemo(() => gridRows.filter((row) => {
    const promoLabel = row.promoStudentCount > 0 || Boolean(row.promoStudents) ? "له طلاب خصم" : "بدون طلاب خصم";
    const values = {
      discountStatusName: row.discountStatusName,
      requestStatusName: row.requestStatusName,
      discountName: row.discountName,
      requestedBy: row.requestedBy,
      hasPromoStudents: promoLabel
    };
    return Object.entries(advancedFilters).every(([field, selectedValues]) => selectedValues.length === 0 || selectedValues.includes(String(values[field] || "").trim()));
  }), [gridRows, advancedFilters]);

  const activeFilterCount = useMemo(() => Object.values(advancedFilters).filter((values) => values.length > 0).length, [advancedFilters]);
  const updateAdvancedFilter = (field, values) => setAdvancedFilters((current) => ({ ...current, [field]: values }));
  const resetAdvancedFilters = () => setAdvancedFilters({ discountStatusName: [], requestStatusName: [], discountName: [], requestedBy: [], hasPromoStudents: [] });

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "العمليات",
        width: 58,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(
                event.currentTarget
              );
              setMenuRow(params.row);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )
      },
      {
        field: "orderDate",
        headerName: "تاريخ الطلب",
        flex: 0.85,
        minWidth: 110,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "requestedBy",
        headerName: "مقدم الطلب",
        flex: 1.25,
        minWidth: 150,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="left"
          />
        )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.4,
        minWidth: 180,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="start"
          />
        )
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.9,
        minWidth: 125,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "discountName",
        headerName: "نوع الخصم",
        flex: 1,
        minWidth: 140,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="start"
          />
        )
      },
      {
        field: "discountStatus",
        headerName: "حالة الخصم",
        flex: 1.25,
        minWidth: 165,
        renderCell: (params) => (
          <StatusChip
            status={params.value}
            label={
              params.row
                .discountStatusName
            }
          />
        )
      },
      {
        field: "requestStatusName",
        headerName: "حالة الطلب",
        flex: 0.8,
        minWidth: 105,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "requesterNote",
        headerName: "ملاحظة مقدم الطلب",
        flex: 1.6,
        minWidth: 200,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="left"
          />
        )
      },
      {
        field: "notes",
        headerName: "ملاحظات حالة الطلب",
        flex: 1.8,
        minWidth: 220,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="start"
          />
        )
      },
      {
        field: "promoStudents",
        headerName: "طلاب الخصم",
        width: 110,
        sortable: false,
        renderCell: (params) =>
          params.row
            .promoStudentCount > 0 ||
          params.value
            ? (
              <Button
                size="small"
                onClick={() => {
                  setMenuRow(
                    params.row
                  );
                  setPromoDialogOpen(
                    true
                  );
                }}
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight: 900,
                  color: "#057546"
                }}
              >
                عرض
              </Button>
            )
            : "-"
      }
    ],
    []
  );

  const compactColumns = useMemo(() => {
    const byField = (field) =>
      columns.find(
        (column) => column.field === field
      );

    const phoneFields = [
      "studentName",
      "nationalId",
      "discountName",
      "discountStatus"
    ];

    const tabletFields = [
      "studentName",
      "nationalId",
      "discountName",
      "discountStatus",
      "requestStatusName",
      "requestedBy"
    ];

    const fields = isPhone
      ? phoneFields
      : tabletFields;

    const selected = fields
      .map(byField)
      .filter(Boolean)
      .map((column) => ({
        ...column,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        headerAlign: "center",
        align: "center",
        width: undefined,
        maxWidth: undefined,

        ...(isPhone
          ? {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "discountName"
                    ? 1.15
                    : 1,
              minWidth: 0
            }
          : {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "discountName"
                    ? 1.2
                    : 1,
              minWidth:
                column.field === "studentName"
                  ? 125
                  : column.field === "discountName"
                    ? 115
                    : 90
            }),

        renderCell:
          column.field === "studentName"
            ? (params) => (
                <Typography
                  sx={{
                    width: "100%",
                    px: 0.1,
                    textAlign: "center",
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    fontSize: isPhone
                      ? "0.29rem"
                      : "0.44rem",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {params.value || "-"}
                </Typography>
              )
            : column.renderCell
      }));

    return [
      ...selected,
      {
        field: "__details",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        width: isPhone ? 34 : 44,
        minWidth: isPhone ? 34 : 44,
        maxWidth: isPhone ? 34 : 44,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => (
          <IconButton
            size="small"
            title="عرض التفاصيل"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openDetails(params.row);
            }}
            sx={{
              width: isPhone ? 24 : 30,
              height: isPhone ? 24 : 30,
              p: 0,
              color: "#057546",
              border:
                "1px solid rgba(5,117,70,.28)",
              backgroundColor: "#eef8f3"
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: isPhone
                  ? 14
                  : 18
              }}
            />
          </IconButton>
        )
      }
    ];
  }, [
    columns,
    isPhone,
    isTablet
  ]);

  const closeMenu = () =>
    setMenuAnchor(null);

  const openStatement = (row) => {
    setStatementStudent({
      accountGuid:
        row?.accountGuid || "",
      studentName:
        row?.studentName || "",
      nationalId:
        row?.nationalId || ""
    });

    setStatementOpen(true);
  };

  const openAttachments = (row) => {
    if (!row?.nationalId) {
      showError(
        "رقم هوية الطالب غير موجود"
      );
      return;
    }

    const url =
      `${ATTACHMENT_URL}` +
      `?nationalId=${encodeURIComponent(row.nationalId)}` +
      `&kind=discount`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openStatusDialog = (row) => {
    setSelectedStatus(
      Number(
        row?.discountStatus ?? 0
      )
    );

    setStatusNotes(
      row?.notes || ""
    );

    setStatusDialogOpen(true);
  };

  const saveStatus = async () => {
    if (!menuRow?.id) {
      await showError(
        "رقم طلب الخصم غير موجود"
      );
      return;
    }

    try {
      setSavingStatus(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/discount-requests/status`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              discountOrderGuid:
                menuRow.id,
              orderStatus:
                Number(selectedStatus),
              notes:
                statusNotes.trim()
            })
          }
        );

      const result =
        await readJson(response);

      setStatusDialogOpen(false);

      await showSuccess(
        result?.message ||
        "تم تحديث حالة طلب الخصم"
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تحديث حالة الطلب"
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const exportCsv = () => {
    if (filteredGridRows.length === 0) {
      showError(
        "لا توجد بيانات للتصدير"
      );
      return;
    }

    const headers = [
      "تاريخ الطلب",
      "مقدم الطلب",
      "اسم الطالب",
      "رقم الهوية",
      "نوع الخصم",
      "حالة الخصم",
      "حالة الطلب",
      "ملاحظة مقدم الطلب",
      "ملاحظات حالة الطلب",
      "عدد طلاب الخصم",
      "إجمالي الخصم"
    ];

    const values =
      filteredGridRows.map((row) => [
        row.orderDate,
        row.requestedBy,
        row.studentName,
        row.nationalId,
        row.discountName,
        row.discountStatusName,
        row.requestStatusName,
        row.requesterNote,
        row.notes,
        row.promoStudentCount,
        row.promoTotalAmount
      ]);

    const escape = (value) =>
      `"${String(value ?? "")
        .replace(/"/g, '""')}"`;

    const csv =
      "\uFEFF" +
      [headers, ...values]
        .map((row) =>
          row.map(escape).join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      `طلبات-الخصم-${today()}.csv`;

    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      sx={{
        minHeight: "100vh",
        maxWidth: "100vw",
        overflowX: "hidden",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)",
        direction: "rtl"
      }}
    >
      {!isDesktop && (
        <>
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

          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1400,
              background:
                "rgba(255,255,255,.97)",
              backdropFilter: "blur(14px)",
              color: "#173b2b",
              borderBottom:
                "1px solid rgba(5,117,70,.12)",
              direction: "rtl"
            }}
          >
            <Toolbar
              sx={{
                minHeight: {
                  xs: "50px !important",
                  sm: "56px !important"
                },
                px: {
                  xs: 0.75,
                  sm: 1
                },
                gap: 0.8
              }}
            >
              <IconButton
                onClick={() =>
                  setMobileSidebarOpen(
                    (current) => !current
                  )
                }
                sx={{
                  width: {
                    xs: 36,
                    sm: 40
                  },
                  height: {
                    xs: 36,
                    sm: 40
                  },
                  color: "#fff",
                  background:
                    "linear-gradient(135deg,#057546,#034d31)",
                  boxShadow:
                    "0 5px 14px rgba(5,117,70,.20)"
                }}
              >
                <MenuRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 20,
                      sm: 22
                    }
                  }}
                />
              </IconButton>

              <Typography
                sx={{
                  flex: 1,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: {
                    xs: "0.66rem",
                    sm: "0.78rem"
                  },
                  color: "#173b2b",
                  textAlign: "start"
                }}
              >
                طلبات الخصم
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      )}

      

      <Box
        component="main"
        sx={{
          mt: isDesktop ? 0 : isPhone ? "50px" : "56px",
          p: isDesktop ? 2 : isPhone ? 0.45 : 0.75,
          boxSizing: "border-box",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isDesktop
              ? 2
              : isPhone
                ? 0.6
                : 0.85,
            mb: isDesktop
              ? 1.5
              : 0.6,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,0.14)",
            boxShadow:
              "0 12px 30px rgba(5,117,70,0.08)"
          }}
        >
          <Stack
            direction={isDesktop ? "row" : "row"}
            spacing={isDesktop ? 1.2 : 0.35}
            useFlexGap
            flexWrap={isDesktop ? "nowrap" : "wrap"}
            alignItems={isDesktop ? "center" : "stretch"}
            sx={{
              ...(!isDesktop
                ? {
                    display: "grid",
                    gridTemplateColumns: isPhone
                      ? "repeat(2,minmax(0,1fr))"
                      : "repeat(4,minmax(0,1fr))",
                    gap: isPhone ? 0.35 : 0.5
                  }
                : {}),

              "& > .MuiStack-root:first-of-type": {
                gridColumn: !isDesktop
                  ? "1 / -1"
                  : "auto",
                minWidth: 0
              },

              "& .MuiButton-root": {
                width: !isDesktop
                  ? "100%"
                  : "auto",
                minWidth: 0,
                minHeight: !isDesktop
                  ? isPhone
                    ? 27
                    : 31
                  : undefined,
                px: !isDesktop
                  ? isPhone
                    ? 0.35
                    : 0.6
                  : undefined,
                py: !isDesktop
                  ? isPhone
                    ? 0.2
                    : 0.35
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.32rem"
                    : "0.43rem"
                  : undefined,
                lineHeight: 1.1
              },

              "& .MuiChip-root": {
                width: !isDesktop
                  ? "100%"
                  : "auto",
                height: !isDesktop
                  ? isPhone
                    ? 24
                    : 28
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.31rem"
                    : "0.42rem"
                  : undefined
              },

              "& .MuiSvgIcon-root": {
                fontSize: !isDesktop
                  ? isPhone
                    ? 13
                    : 15
                  : undefined
              }
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flex: 1 }}
            >
              <PercentIcon
                sx={{
                  color: "#057546",
                  fontSize: isDesktop
                    ? 35
                    : isPhone
                      ? 18
                      : 22
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontSize: isDesktop
                      ? "1.15rem"
                      : isPhone
                        ? "0.55rem"
                        : "0.72rem",
                    fontWeight: 900,
                    color: "#173b2b"
                  }}
                >
                  طلبات الخصم
                </Typography>
              </Box>
            </Stack>

            <Chip label={`النتائج: ${filteredGridRows.length} من ${gridRows.length}`} sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#057546", backgroundColor: "#eef8f3" }} />

            <Button
              variant={activeFilterCount > 0 ? "contained" : "outlined"}
              startIcon={<FilterAltIcon />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{ fontFamily: "Cairo", fontWeight: 800, ...(activeFilterCount > 0 ? { background: "linear-gradient(135deg,#057546,#034d31)" } : {}) }}
            >
              فلاتر متقدمة{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <FileDownloadIcon />
              }
              onClick={exportCsv}
              sx={{
                gridColumn: isPhone
                  ? "1 / -1"
                  : "auto",
                fontFamily: "Cairo",
                fontWeight: 800
              }}
            >
              تصدير
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <RefreshIcon />
              }
              onClick={loadData}
              sx={{
                fontFamily: "Cairo",
                fontWeight: 800
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: isDesktop
              ? 1.5
              : isPhone
                ? 0.55
                : 0.75,
            mb: isDesktop
              ? 1.5
              : 0.6,
            borderRadius: 3.5,
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isDesktop
                ? "repeat(2,minmax(0,1fr)) auto"
                : isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(3,minmax(0,1fr))",
              gap: isDesktop
                ? 1.2
                : isPhone
                  ? 0.3
                  : 0.45,
              "& .MuiInputLabel-root": {
                fontFamily: "Cairo",
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.4rem"
                    : "0.5rem"
                  : undefined
              },
              "& .MuiInputBase-root": {
                minHeight: !isDesktop
                  ? isPhone
                    ? 28
                    : 32
                  : undefined,
                fontFamily: "Cairo",
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.38rem"
                    : "0.5rem"
                  : undefined
              },
              "& .MuiButton-root": {
                minHeight: !isDesktop
                  ? isPhone
                    ? 28
                    : 32
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.34rem"
                    : "0.44rem"
                  : undefined
              }
            }}
          >
            <TextField
              type="date"
              label="من تاريخ"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true
              }}
              size="small"
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField
              type="date"
              label="إلى تاريخ"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true
              }}
              size="small"
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <Button
              variant="contained"
              startIcon={
                loading
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <SearchIcon />
              }
              onClick={loadData}
              disabled={loading}
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }}
            >
              عرض
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            height: isDesktop
              ? "calc(100vh - 240px)"
              : isPhone
                ? "calc(100dvh - 270px)"
                : "calc(100dvh - 250px)",
            minHeight: isDesktop
              ? 520
              : isPhone
                ? 420
                : 540,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <DataGrid
            rows={filteredGridRows}
            columns={
              isDesktop
                ? columns
                : compactColumns
            }
            loading={loading}
            disableRowSelectionOnClick
            slots={
              isDesktop
                ? {
                    toolbar: GridToolbar
                  }
                : {}
            }
            slotProps={
              isDesktop
                ? {
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: {
                        debounceMs: 350
                      }
                    }
                  }
                : {}
            }
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 50,
                  page: 0
                }
              }
            }}
            pageSizeOptions={[
              25, 50, 100, 200
            ]}
            rowHeight={
              isDesktop
                ? 52
                : isPhone
                  ? 32
                  : 40
            }
            columnHeaderHeight={
              isDesktop
                ? 54
                : isPhone
                  ? 32
                  : 42
            }
            getRowClassName={(
              params
            ) =>
              Number(
                params.row
                  .discountStatus
              ) === 1
                ? "executed-row"
                : Number(
                    params.row
                      .discountStatus
                  ) === 2
                  ? "rejected-row"
                  : "pending-row"
            }
            sx={{
              border: 0,
              direction: "rtl",
              fontFamily: "Cairo",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor:
                  "#eef8f3",
                color: "#173b2b",
                fontWeight: 900
              },

              "& .MuiDataGrid-columnHeaderTitleContainer": {
                justifyContent: "center",
                minWidth: 0,
                overflow: "hidden"
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.26rem"
                    : "0.4rem"
                  : undefined,
                whiteSpace: !isDesktop
                  ? "nowrap"
                  : undefined,
                overflow: !isDesktop
                  ? "hidden"
                  : undefined,
                textOverflow: !isDesktop
                  ? "ellipsis"
                  : undefined
              },

              "& .MuiDataGrid-cell": {
                px: !isDesktop
                  ? isPhone
                    ? 0.04
                    : 0.18
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.28rem"
                    : "0.42rem"
                  : undefined,
                justifyContent: !isDesktop
                  ? "center"
                  : undefined,
                textAlign: !isDesktop
                  ? "center"
                  : undefined
              },

              ...(!isDesktop
                ? {
                    "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
                      display: "none"
                    },
                    "& .MuiDataGrid-columnSeparator": {
                      display: "none"
                    },
                    "& .MuiDataGrid-toolbarContainer": {
                      display: "none"
                    },
                    "& .MuiDataGrid-main": {
                      minWidth: 0,
                      overflowX: "hidden"
                    },
                    "& .MuiDataGrid-virtualScroller": {
                      direction: "rtl",
                      overflowX:
                        "hidden !important"
                    },
                    "& .MuiDataGrid-scrollbar--horizontal": {
                      display: "none"
                    }
                  }
                : {}),
              "& .executed-row":
                {
                  backgroundColor:
                    "#edf9f1"
                },
              "& .rejected-row":
                {
                  backgroundColor:
                    "#fff0f0"
                },
              "& .pending-row":
                {
                  backgroundColor:
                    "#fff9ec"
                }
            }}
          />
        </Paper>

        <Dialog
          open={detailsOpen}
          onClose={closeDetails}
          fullWidth
          maxWidth="lg"
          dir="rtl"
          PaperProps={{
            sx: {
              width: isPhone
                ? "94vw"
                : "90vw",
              maxWidth: isPhone
                ? "94vw"
                : "980px",
              maxHeight: isPhone
                ? "86dvh"
                : "84dvh",
              m: 1,
              borderRadius: 2.5,
              overflow: "hidden"
            }
          }}
        >
          <DialogTitle
            sx={{
              px: isPhone ? 1 : 1.5,
              py: isPhone ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 0.6,
              fontFamily: "Cairo",
              fontWeight: 950,
              color: "#057546",
              fontSize: isPhone
                ? "0.76rem"
                : "0.94rem"
            }}
          >
            <span>تفاصيل طلب الخصم</span>

            <IconButton
              onClick={closeDetails}
              sx={{
                width: isPhone ? 30 : 34,
                height: isPhone ? 30 : 34,
                color: "#ae1e21"
              }}
            >
              <CloseIcon
                sx={{
                  fontSize: isPhone
                    ? 18
                    : 20
                }}
              />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              p: isPhone ? 0.8 : 1.1,
              overflowY: "auto"
            }}
          >
            {detailsRow ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      isPhone
                        ? "repeat(2,minmax(0,1fr))"
                        : "repeat(3,minmax(0,1fr))",
                    gap: isPhone
                      ? 0.45
                      : 0.65
                  }}
                >
                  {[
                    ["تاريخ الطلب", detailsRow.orderDate],
                    ["مقدم الطلب", detailsRow.requestedBy],
                    ["اسم الطالب", detailsRow.studentName],
                    ["رقم الهوية", detailsRow.nationalId],
                    ["نوع الخصم", detailsRow.discountName],
                    ["حالة الخصم", detailsRow.discountStatusName],
                    ["حالة الطلب", detailsRow.requestStatusName],
                    ["ملاحظة مقدم الطلب", detailsRow.requesterNote],
                    ["ملاحظات حالة الطلب", detailsRow.notes],
                    ["عدد طلاب الخصم", detailsRow.promoStudentCount],
                    ["إجمالي الخصم", money(detailsRow.promoTotalAmount)]
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        minWidth: 0,
                        p: isPhone
                          ? 0.55
                          : 0.72,
                        border:
                          "1px solid rgba(5,117,70,.14)",
                        borderRadius: 1.3,
                        backgroundColor:
                          "#fbfdfc"
                      }}
                    >
                      <Typography
                        sx={{
                          mb: 0.2,
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: "#60756d",
                          fontSize: isPhone
                            ? "0.38rem"
                            : "0.49rem"
                        }}
                      >
                        {label}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          color: "#1f2d3d",
                          fontSize: isPhone
                            ? "0.49rem"
                            : "0.62rem",
                          wordBreak:
                            "break-word"
                        }}
                      >
                        {value ?? "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mt: 0.8 }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      <AccountBalanceWalletIcon />
                    }
                    onClick={() => {
                      openStatement(detailsRow);
                    }}
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.4rem"
                        : "0.5rem"
                    }}
                  >
                    كشف حساب
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() =>
                      openAttachments(detailsRow)
                    }
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.4rem"
                        : "0.5rem"
                    }}
                  >
                    المرفقات
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      <PlayCircleOutlineIcon />
                    }
                    onClick={() => {
                      setMenuRow(detailsRow);
                      openStatusDialog(detailsRow);
                    }}
                    sx={{
                      backgroundColor:
                        "#057546",
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.4rem"
                        : "0.5rem"
                    }}
                  >
                    تنفيذ
                  </Button>

                  {(detailsRow
                      ?.promoStudentCount > 0 ||
                    detailsRow
                      ?.promoStudents) && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<GroupsIcon />}
                      onClick={() => {
                        setMenuRow(detailsRow);
                        setPromoDialogOpen(true);
                      }}
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        fontSize: isPhone
                          ? "0.4rem"
                          : "0.5rem"
                      }}
                    >
                      طلاب الخصم
                    </Button>
                  )}
                </Stack>
              </>
            ) : null}
          </DialogContent>

          <DialogActions
            sx={{
              px: isPhone ? 1 : 1.5,
              py: isPhone ? 0.7 : 1
            }}
          >
            <Button
              variant="contained"
              onClick={closeDetails}
              sx={{
                backgroundColor: "#057546",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone
                  ? "0.47rem"
                  : "0.58rem"
              }}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: isPhone
                ? 2.5
                : 4,
              width: !isDesktop
                ? isPhone
                  ? "94vw"
                  : "88vw"
                : undefined,
              maxHeight: !isDesktop
                ? "86dvh"
                : undefined,
              direction: "rtl"
            }
          }}
        >
          <DialogTitle sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#173b2b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box>
              الفلاتر المتقدمة
              <Typography component="div" sx={{ mt: 0.35, fontFamily: "Cairo", fontSize: "0.72rem", color: "#708179", fontWeight: 700 }}>
                يمكنك تحديد أكثر من حالة أو نوع خصم في الوقت نفسه
              </Typography>
            </Box>
            {activeFilterCount > 0 && <Chip label={`${activeFilterCount} فلاتر نشطة`} sx={{ fontFamily: "Cairo", fontWeight: 800, color: "#fff", backgroundColor: "#057546" }} />}
          </DialogTitle>
          <DialogContent dividers sx={{ background: "linear-gradient(135deg,#f7fbf9,#ffffff)" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.25 }}>
              <MultiValueFilter label="حالة الخصم" options={filterOptions.discountStatusName} value={advancedFilters.discountStatusName} onChange={(values) => updateAdvancedFilter("discountStatusName", values)} />
              <MultiValueFilter label="حالة الطلب" options={filterOptions.requestStatusName} value={advancedFilters.requestStatusName} onChange={(values) => updateAdvancedFilter("requestStatusName", values)} />
              <MultiValueFilter label="نوع الخصم" options={filterOptions.discountName} value={advancedFilters.discountName} onChange={(values) => updateAdvancedFilter("discountName", values)} />
              <MultiValueFilter label="مقدم الطلب" options={filterOptions.requestedBy} value={advancedFilters.requestedBy} onChange={(values) => updateAdvancedFilter("requestedBy", values)} />
              <MultiValueFilter label="طلاب الخصم الترويجي" options={filterOptions.hasPromoStudents} value={advancedFilters.hasPromoStudents} onChange={(values) => updateAdvancedFilter("hasPromoStudents", values)} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.4 }}>
            <Button color="error" startIcon={<RestartAltIcon />} onClick={resetAdvancedFilters} disabled={activeFilterCount === 0} sx={{ fontFamily: "Cairo", fontWeight: 800 }}>مسح الفلاتر</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={() => setFilterDialogOpen(false)} sx={{ fontFamily: "Cairo", fontWeight: 900, background: "linear-gradient(135deg,#057546,#034d31)" }}>تطبيق وإغلاق</Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              openStatement(
                menuRow
              );
            }}
          >
            <AccountBalanceWalletIcon
              sx={{ ml: 1 }}
            />
            كشف حساب
          </MenuItem>

          <MenuItem
            onClick={() => {
              closeMenu();
              openAttachments(
                menuRow
              );
            }}
          >
            <AttachFileIcon
              sx={{ ml: 1 }}
            />
            عرض المرفقات
          </MenuItem>

          <MenuItem
            onClick={() => {
              closeMenu();
              openStatusDialog(
                menuRow
              );
            }}
          >
            <PlayCircleOutlineIcon
              sx={{ ml: 1 }}
            />
            تنفيذ
          </MenuItem>

          {(menuRow
              ?.promoStudentCount >
              0 ||
            menuRow
              ?.promoStudents) && (
            <MenuItem
              onClick={() => {
                closeMenu();
                setPromoDialogOpen(
                  true
                );
              }}
            >
              <GroupsIcon
                sx={{ ml: 1 }}
              />
              عرض طلاب الخصم
            </MenuItem>
          )}
        </Menu>

        <StudentStatementDialog2
          open={statementOpen}
          onClose={() => {
            setStatementOpen(false);
            setStatementStudent(null);
          }}
          student={
            statementStudent
          }
          apiBaseUrl={
            API_BASE_URL
          }
        />

        <Dialog
          open={statusDialogOpen}
          onClose={() => {
            if (!savingStatus) {
              setStatusDialogOpen(
                false
              );
            }
          }}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              direction: "rtl"
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900
            }}
          >
            تنفيذ طلب الخصم
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={1.5}>
              <TextField
                select
                label="حالة التنفيذ"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <MenuItem
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </MenuItem>
                  )
                )}
              </TextField>

              <TextField
                label="ملاحظات"
                value={statusNotes}
                onChange={(event) =>
                  setStatusNotes(
                    event.target
                      .value
                  )
                }
                multiline
                minRows={5}
                inputProps={{
                  maxLength: 2000
                }}
              />

              <Typography
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight: 900,
                  color: "#ae1e21"
                }}
              >
                قيمة الخصم:{" "}
                {money(
                  menuRow
                    ?.promoTotalAmount
                )}{" "}
                ريال
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() =>
                setStatusDialogOpen(
                  false
                )
              }
              disabled={
                savingStatus
              }
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={saveStatus}
              disabled={
                savingStatus
              }
              startIcon={
                savingStatus
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : (
                    <PlayCircleOutlineIcon />
                  )
              }
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                backgroundColor:
                  "#057546"
              }}
            >
              تأكيد
            </Button>
          </DialogActions>
        </Dialog>

        <PromoStudentsDialog
          open={promoDialogOpen}
          onClose={() =>
            setPromoDialogOpen(
              false
            )
          }
          orderGuid={menuRow?.id}
          ownerRow={menuRow}
          userGuid={userGuid}
          onOpenStatement={(
            student
          ) => {
            setStatementStudent({
              accountGuid:
                student?.accountGuid ||
                "",
              studentName:
                student?.studentName ||
                "",
              nationalId:
                student?.nationalId ||
                ""
            });

            setStatementOpen(
              true
            );
          }}
        />
      </Box>
    </Box></NavigationShell>
  );
};

export default DiscountRequestsReport;