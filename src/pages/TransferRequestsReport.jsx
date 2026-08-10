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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";

import SwapHorizIcon
  from "@mui/icons-material/SwapHoriz";
import MoreVertIcon
  from "@mui/icons-material/MoreVert";
import SearchIcon
  from "@mui/icons-material/Search";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import FileDownloadIcon
  from "@mui/icons-material/FileDownload";
import AttachFileIcon
  from "@mui/icons-material/AttachFile";
import CheckCircleIcon
  from "@mui/icons-material/CheckCircle";
import CancelIcon
  from "@mui/icons-material/Cancel";
import RestoreIcon
  from "@mui/icons-material/Restore";
import FilterAltIcon
  from "@mui/icons-material/FilterAlt";
import RestartAltIcon
  from "@mui/icons-material/RestartAlt";
import DoneAllIcon
  from "@mui/icons-material/DoneAll";

import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

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
    label: "تم التأكيد"
  },
  {
    value: 2,
    label: "تم الإلغاء"
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
    "number", "Number"
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

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor:
      "#ae1e21"
  });

const showSuccess = (message) =>
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
  status
}) => {
  const item =
    STATUS_OPTIONS.find(
      (option) =>
        option.value ===
        Number(status)
    ) || STATUS_OPTIONS[0];

  const color =
    Number(status) === 1
      ? "#057546"
      : Number(status) === 2
        ? "#ae1e21"
        : "#d18b00";

  return (
    <Chip
      size="small"
      label={item.label}
      sx={{
        fontFamily: "Cairo",
        fontWeight: 900,
        color: "#fff",
        backgroundColor: color
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
  const selected =
    Array.isArray(value)
      ? value
      : [];

  const allSelected =
    options.length > 0 &&
    selected.length ===
      options.length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.35,
        borderRadius: 3,
        border:
          "1px solid #dce8e2",
        backgroundColor: "#fff"
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900,
            color: "#173b2b"
          }}
        >
          {label}
        </Typography>

        <Button
          size="small"
          startIcon={
            <DoneAllIcon />
          }
          onClick={() =>
            onChange(
              allSelected
                ? []
                : options
            )
          }
          sx={{
            fontFamily: "Cairo",
            fontWeight: 800
          }}
        >
          {allSelected
            ? "إلغاء الكل"
            : "تحديد الكل"}
        </Button>
      </Stack>

      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options}
        value={selected}
        onChange={(
          _event,
          newValue
        ) =>
          onChange(newValue)
        }
        limitTags={2}
        noOptionsText="لا توجد نتائج"
        renderOption={(
          props,
          option,
          state
        ) => (
          <li {...props}>
            <Checkbox
              checked={state.selected}
              sx={{
                mr: 1,
                "&.Mui-checked": {
                  color: "#057546"
                }
              }}
            />

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontSize: "0.82rem",
                fontWeight: 700
              }}
            >
              {option}
            </Typography>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="ابحث وحدد أكثر من قيمة"
            helperText={
              selected.length > 0
                ? `تم اختيار ${selected.length} من ${options.length}`
                : `الكل ظاهر (${options.length})`
            }
          />
        )}
      />
    </Paper>
  );
};

const TransferRequestsReport = () => {
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
    ""
  ).trim();

  const [activeTab, setActiveTab] =
    useState(0);

  const [fromDate, setFromDate] =
    useState(today());

  const [toDate, setToDate] =
    useState(today());

  const [branchRows, setBranchRows] =
    useState([]);

  const [diplomRows, setDiplomRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [menuRow, setMenuRow] =
    useState(null);

  const [
    filterDialogOpen,
    setFilterDialogOpen
  ] = useState(false);

  const [
    advancedFilters,
    setAdvancedFilters
  ] = useState({
    statusName: [],
    studentName: [],
    actorUserName: [],
    oldValue: [],
    newValue: []
  });

  const currentType =
    activeTab === 0
      ? "branch"
      : "diplom";

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

        const [
          branchResponse,
          diplomResponse
        ] = await Promise.all([
          fetch(
            `${API_BASE_URL}/api/transfer-requests/branch?${params.toString()}`,
            {
              cache: "no-store"
            }
          ),
          fetch(
            `${API_BASE_URL}/api/transfer-requests/diplom?${params.toString()}`,
            {
              cache: "no-store"
            }
          )
        ]);

        const [
          branchResult,
          diplomResult
        ] = await Promise.all([
          readJson(branchResponse),
          readJson(diplomResponse)
        ]);

        setBranchRows(
          Array.isArray(
            branchResult?.data
          )
            ? branchResult.data
            : []
        );

        setDiplomRows(
          Array.isArray(
            diplomResult?.data
          )
            ? diplomResult.data
            : []
        );
      } catch (error) {
        setBranchRows([]);
        setDiplomRows([]);

        await showError(
          error?.message ||
          "تعذر تحميل طلبات النقل والتحويل"
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

  const mapRows = useCallback(
    (rows, type) =>
      rows.map((row, index) => {
        const confirmStatus =
          Number(
            pick(
              row,
              [
                "ConfirmStatus",
                "confirmStatus"
              ],
              0
            )
          );

        const oldValue =
          type === "branch"
            ? String(
                pick(row, [
                  "OldBranchName",
                  "oldBranchName"
                ])
              )
            : String(
                pick(row, [
                  "OldDiplomName",
                  "oldDiplomName"
                ])
              );

        const newValue =
          type === "branch"
            ? String(
                pick(row, [
                  "NewBranchName",
                  "newBranchName"
                ])
              )
            : String(
                pick(row, [
                  "NewDiplomName",
                  "newDiplomName"
                ])
              );

        return {
          id: String(
            pick(
              row,
              [
                "RequestGuid",
                "requestGuid"
              ],
              `${type}-${index}`
            )
          ),

          requestGuid: String(
            pick(row, [
              "RequestGuid",
              "requestGuid"
            ])
          ),

          studentLevelGuid:
            String(
              pick(row, [
                "StudentLevelGuid",
                "studentLevelGuid"
              ])
            ),

          accountGuid: String(
            pick(row, [
              "AccountGuid",
              "accountGuid"
            ])
          ),

          nationalId: String(
            pick(row, [
              "NationalId",
              "nationalId"
            ])
          ),

          studentName: String(
            pick(row, [
              "StudentName",
              "studentName"
            ])
          ),

          oldBranchName: String(
            pick(row, [
              "OldBranchName",
              "oldBranchName"
            ])
          ),

          oldDiplomName: String(
            pick(row, [
              "OldDiplomName",
              "oldDiplomName"
            ])
          ),

          newBranchName: String(
            pick(row, [
              "NewBranchName",
              "newBranchName"
            ])
          ),

          newDiplomName: String(
            pick(row, [
              "NewDiplomName",
              "newDiplomName"
            ])
          ),

          actorUserName: String(
            pick(row, [
              "ActorUserName",
              "actorUserName"
            ])
          ),

          response: String(
            pick(row, [
              "Response",
              "response"
            ])
          ),

          confirmStatus,

          statusName:
            STATUS_OPTIONS.find(
              (option) =>
                option.value ===
                confirmStatus
            )?.label ||
            "معلق",

          createdAt: String(
            pick(row, [
              "CreatedAt",
              "createdAt"
            ])
          ),

          confirmedAt: String(
            pick(row, [
              "ConfirmedAt",
              "confirmedAt"
            ])
          ),

          confirmedByName: String(
            pick(row, [
              "ConfirmedByName",
              "confirmedByName"
            ])
          ),

          oldValue,
          newValue,
          type
        };
      }),
    []
  );

  const gridRows = useMemo(
    () =>
      activeTab === 0
        ? mapRows(
            branchRows,
            "branch"
          )
        : mapRows(
            diplomRows,
            "diplom"
          ),
    [
      activeTab,
      branchRows,
      diplomRows,
      mapRows
    ]
  );

  const filterOptions = useMemo(() => {
    const makeOptions = (field) =>
      Array.from(
        new Set(
          gridRows
            .map((row) =>
              String(
                row[field] || ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "ar",
          { numeric: true }
        )
      );

    return {
      statusName:
        makeOptions("statusName"),
      studentName:
        makeOptions("studentName"),
      actorUserName:
        makeOptions("actorUserName"),
      oldValue:
        makeOptions("oldValue"),
      newValue:
        makeOptions("newValue")
    };
  }, [gridRows]);

  const filteredRows = useMemo(
    () =>
      gridRows.filter((row) =>
        Object.entries(
          advancedFilters
        ).every(
          ([
            field,
            selectedValues
          ]) =>
            selectedValues.length ===
              0 ||
            selectedValues.includes(
              String(
                row[field] || ""
              ).trim()
            )
        )
      ),
    [
      gridRows,
      advancedFilters
    ]
  );

  const activeFilterCount =
    useMemo(
      () =>
        Object.values(
          advancedFilters
        ).filter(
          (values) =>
            values.length > 0
        ).length,
      [advancedFilters]
    );

  const resetFilters = () =>
    setAdvancedFilters({
      statusName: [],
      studentName: [],
      actorUserName: [],
      oldValue: [],
      newValue: []
    });

  const updateFilter =
    (field, values) =>
      setAdvancedFilters(
        (current) => ({
          ...current,
          [field]: values
        })
      );

  useEffect(() => {
    resetFilters();
  }, [activeTab]);

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "العمليات",
        width: 54,
        minWidth: 54,
        maxWidth: 54,
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
        field: "createdAt",
        headerName: "تاريخ الطلب",
        flex: 0.85,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        flex: 1.25,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        flex: 0.85,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
          />
        )
      },
      {
        field: "oldBranchName",
        headerName:
          activeTab === 0
            ? "الفرع القديم"
            : "الفرع",
        flex: 1.15,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "oldValue",
        headerName:
          activeTab === 0
            ? "الفرع الحالي"
            : "التخصص القديم",
        flex: 1.15,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "newValue",
        headerName:
          activeTab === 0
            ? "الفرع المطلوب"
            : "التخصص الجديد",
        flex: 1.2,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "actorUserName",
        headerName: "مقدم الطلب",
        flex: 0.95,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "confirmStatus",
        headerName: "الحالة",
        flex: 0.75,
        minWidth: 0,
        renderCell: (params) => (
          <StatusChip
            status={params.value}
          />
        )
      },
      {
        field: "response",
        headerName: "الرد",
        flex: 1.25,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      },
      {
        field: "confirmedByName",
        headerName: "منفذ الإجراء",
        flex: 0.95,
        minWidth: 0,
        renderCell: (params) => (
          <TextCell
            value={params.value}
            align="right"
          />
        )
      }
    ],
    [activeTab]
  );

  const closeMenu = () =>
    setMenuAnchor(null);

  const openAttachment = () => {
    closeMenu();

    if (!menuRow?.nationalId) {
      showError(
        "رقم هوية الطالب غير موجود"
      );
      return;
    }

    const kind =
      menuRow.type === "branch"
        ? "transferbranch"
        : "transferdiplom";

    window.open(
      `${ATTACHMENT_URL}?nationalId=${encodeURIComponent(menuRow.nationalId)}&kind=${kind}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const changeStatus =
    async (
      status,
      requireReason = false
    ) => {
      closeMenu();

      if (!menuRow?.requestGuid) {
        await showError(
          "رقم الطلب غير موجود"
        );
        return;
      }

      let reason = "";

      if (requireReason) {
        const result =
          await Swal.fire({
            icon: "warning",
            title: "سبب الإلغاء",
            input: "textarea",
            inputLabel:
              "اكتب سبب إلغاء الطلب",
            inputPlaceholder:
              "سبب الإلغاء...",
            showCancelButton: true,
            confirmButtonText:
              "تأكيد الإلغاء",
            cancelButtonText: "رجوع",
            confirmButtonColor:
              "#ae1e21",
            inputValidator: (
              value
            ) =>
              !value?.trim()
                ? "لازم تكتب سبب الإلغاء"
                : undefined
          });

        if (!result.isConfirmed) {
          return;
        }

        reason =
          String(
            result.value || ""
          ).trim();
      } else {
        const label =
          status === 1
            ? "تأكيد الطلب"
            : "إرجاع الطلب إلى معلق";

        const result =
          await Swal.fire({
            icon:
              status === 1
                ? "question"
                : "info",
            title: label,
            text:
              `الطالب: ${menuRow.studentName}`,
            showCancelButton: true,
            confirmButtonText:
              "تنفيذ",
            cancelButtonText:
              "إلغاء",
            confirmButtonColor:
              "#057546"
          });

        if (!result.isConfirmed) {
          return;
        }
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/transfer-requests/status`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              requestGuid:
                menuRow.requestGuid,
              requestType:
                menuRow.type,
              status,
              reason
            })
          }
        );

        const result =
          await readJson(response);

        await showSuccess(
          result?.message ||
          "تم تحديث حالة الطلب"
        );

        await loadData();
      } catch (error) {
        await showError(
          error?.message ||
          "تعذر تحديث حالة الطلب"
        );
      }
    };

  const exportCsv = () => {
    if (!filteredRows.length) {
      showError(
        "لا توجد بيانات للتصدير"
      );
      return;
    }

    const headers = [
      "تاريخ الطلب",
      "اسم الطالب",
      "رقم الهوية",
      "الفرع",
      activeTab === 0
        ? "الفرع الحالي"
        : "التخصص القديم",
      activeTab === 0
        ? "الفرع المطلوب"
        : "التخصص الجديد",
      "مقدم الطلب",
      "الحالة",
      "الرد",
      "منفذ الإجراء"
    ];

    const values =
      filteredRows.map((row) => [
        row.createdAt,
        row.studentName,
        row.nationalId,
        row.oldBranchName,
        row.oldValue,
        row.newValue,
        row.actorUserName,
        row.statusName,
        row.response,
        row.confirmedByName
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
      new Blob([csv], {
        type:
          "text/csv;charset=utf-8;"
      });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      activeTab === 0
        ? `طلبات-النقل-${today()}.csv`
        : `طلبات-تغيير-التخصص-${today()}.csv`;

    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "ltr",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)"
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
              "1px solid rgba(5,117,70,0.14)"
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
            <SwapHorizIcon
              sx={{
                color: "#057546",
                fontSize: 38
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "1.15rem",
                  fontWeight: 900,
                  color: "#173b2b"
                }}
              >
                طلبات النقل / التحويل
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "0.75rem",
                  color: "#708179"
                }}
              >
                متابعة طلبات النقل بين الفروع وطلبات تغيير التخصص
              </Typography>
            </Box>

            <Chip
              label={`النتائج: ${filteredRows.length} من ${gridRows.length}`}
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#057546",
                backgroundColor:
                  "#eef8f3"
              }}
            />

            <Button
              variant={
                activeFilterCount > 0
                  ? "contained"
                  : "outlined"
              }
              startIcon={
                <FilterAltIcon />
              }
              onClick={() =>
                setFilterDialogOpen(
                  true
                )
              }
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900
              }}
            >
              فلاتر متقدمة
              {activeFilterCount > 0
                ? ` (${activeFilterCount})`
                : ""}
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
            mb: 1.5,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(
              _event,
              value
            ) =>
              setActiveTab(value)
            }
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontFamily: "Cairo",
                fontWeight: 900,
                minHeight: 58
              },
              "& .Mui-selected": {
                color:
                  "#057546 !important"
              },
              "& .MuiTabs-indicator": {
                backgroundColor:
                  "#057546",
                height: 4
              }
            }}
          >
            <Tab
              label={`طلبات النقل بين الفروع (${branchRows.length})`}
            />

            <Tab
              label={`طلبات تغيير التخصص (${diplomRows.length})`}
            />
          </Tabs>
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
              gridTemplateColumns: {
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
            width: "100%",
            minWidth: 0,
            height:
              "calc(100vh - 330px)",
            minHeight: 480,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }}
        >
          <DataGrid
            rows={filteredRows}
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
                },
                sx: {
                  direction: "ltr"
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
            rowHeight={54}
            columnHeaderHeight={56}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage %
                2 === 0
                ? "even-row"
                : "odd-row"
            }
            sx={{
              border: 0,
              direction: "ltr",
              fontFamily: "Cairo",

              "& .MuiDataGrid-main": {
                minWidth: 0,
                overflow: "hidden"
              },

              "& .MuiDataGrid-virtualScroller":
                {
                  overflowX:
                    "hidden !important"
                },

              "& .MuiDataGrid-columnHeaders":
                {
                  backgroundColor:
                    "#eef8f3",
                  color: "#173b2b",
                  fontWeight: 900
                },

              "& .MuiDataGrid-columnHeaderTitleContainer":
                {
                  justifyContent:
                    "center"
                },

              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                overflow: "hidden",
                borderBottom:
                  "1px solid #e7efeb"
              },

              "& .even-row": {
                backgroundColor: "#fff"
              },

              "& .odd-row": {
                backgroundColor:
                  "#f8fbf9"
              },

              "& .MuiDataGrid-row:hover":
                {
                  backgroundColor:
                    "#eef8f3 !important"
                }
            }}
          />
        </Paper>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
        >
          <MenuItem
            onClick={openAttachment}
          >
            <AttachFileIcon
              sx={{ ml: 1 }}
            />
            عرض المرفقات
          </MenuItem>

          <MenuItem
            onClick={() =>
              changeStatus(1)
            }
            sx={{
              color: "#057546"
            }}
          >
            <CheckCircleIcon
              sx={{ ml: 1 }}
            />
            تأكيد الطلب
          </MenuItem>

          <MenuItem
            onClick={() =>
              changeStatus(2, true)
            }
            sx={{
              color: "#ae1e21"
            }}
          >
            <CancelIcon
              sx={{ ml: 1 }}
            />
            إلغاء الطلب
          </MenuItem>

          <MenuItem
            onClick={() =>
              changeStatus(0)
            }
          >
            <RestoreIcon
              sx={{ ml: 1 }}
            />
            إرجاع إلى معلق
          </MenuItem>
        </Menu>

        <Dialog
          open={filterDialogOpen}
          onClose={() =>
            setFilterDialogOpen(
              false
            )
          }
          fullWidth
          maxWidth="md"
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
              color: "#173b2b",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between"
            }}
          >
            الفلاتر المتقدمة

            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} فلاتر نشطة`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#fff",
                  backgroundColor:
                    "#057546"
                }}
              />
            )}
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              background:
                "linear-gradient(135deg,#f7fbf9,#ffffff)"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md:
                    "repeat(2,minmax(0,1fr))"
                },
                gap: 1.25
              }}
            >
              <MultiValueFilter
                label="الحالة"
                options={
                  filterOptions.statusName
                }
                value={
                  advancedFilters.statusName
                }
                onChange={(values) =>
                  updateFilter(
                    "statusName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="اسم الطالب"
                options={
                  filterOptions.studentName
                }
                value={
                  advancedFilters.studentName
                }
                onChange={(values) =>
                  updateFilter(
                    "studentName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="مقدم الطلب"
                options={
                  filterOptions.actorUserName
                }
                value={
                  advancedFilters.actorUserName
                }
                onChange={(values) =>
                  updateFilter(
                    "actorUserName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label={
                  activeTab === 0
                    ? "الفرع الحالي"
                    : "التخصص القديم"
                }
                options={
                  filterOptions.oldValue
                }
                value={
                  advancedFilters.oldValue
                }
                onChange={(values) =>
                  updateFilter(
                    "oldValue",
                    values
                  )
                }
              />

              <MultiValueFilter
                label={
                  activeTab === 0
                    ? "الفرع المطلوب"
                    : "التخصص الجديد"
                }
                options={
                  filterOptions.newValue
                }
                value={
                  advancedFilters.newValue
                }
                onChange={(values) =>
                  updateFilter(
                    "newValue",
                    values
                  )
                }
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              color="error"
              startIcon={
                <RestartAltIcon />
              }
              onClick={resetFilters}
              disabled={
                activeFilterCount === 0
              }
              sx={{
                fontFamily: "Cairo",
                fontWeight: 800
              }}
            >
              مسح الفلاتر
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              onClick={() =>
                setFilterDialogOpen(
                  false
                )
              }
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }}
            >
              تطبيق وإغلاق
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TransferRequestsReport;