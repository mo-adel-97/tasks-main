import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
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
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
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

import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import StudentStatementDialog2
  from "../components/StudentStatementDialog2";

const SIDEBAR_WIDTH = 280;

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
        fontWeight: 700
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
          align="left"
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
          direction: "ltr"
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
                  direction: "ltr",
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
            align="left"
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
            align="left"
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
            align="left"
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
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)",
        direction: "ltr"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md:
              `${SIDEBAR_WIDTH}px`
          },
          p: {
            xs: 1.2,
            md: 2
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,0.14)",
            boxShadow:
              "0 12px 30px rgba(5,117,70,0.08)"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row"
            }}
            spacing={1.2}
            alignItems={{
              xs: "stretch",
              md: "center"
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
                  fontSize: 35
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontSize:
                      "1.15rem",
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
            p: 1.5,
            mb: 1.5,
            borderRadius: 3.5,
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                {
                  xs: "1fr",
                  md:
                    "repeat(2,minmax(0,1fr)) auto"
                },
              gap: 1.2
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
            />

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
            />

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
            height:
              "calc(100vh - 240px)",
            minHeight: 520,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <DataGrid
            rows={filteredGridRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            slots={{
              toolbar:
                GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: {
                  debounceMs: 350
                }
              }
            }}
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
              direction: "ltr",
              fontFamily: "Cairo",
              "& .MuiDataGrid-columnHeaders":
                {
                  backgroundColor:
                    "#eef8f3",
                  color: "#173b2b",
                  fontWeight: 900
                },
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
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{ sx: { borderRadius: 4, direction: "ltr" } }}
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
              direction: "ltr"
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
    </Box>
  );
};

export default DiscountRequestsReport;