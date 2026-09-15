import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
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

import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";

import StudentStatementDialog2
  from "../components/StudentStatementDialog2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const ATTACHMENT_URL =
  "https://sstli.com/arc/api/view.php";

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
  const result = Number(
    String(
      unwrap(value) ?? "0"
    ).replace(/,/g, "")
  );

  return Number.isFinite(result)
    ? result
    : 0;
};

const money = (value) =>
  numberValue(value)
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

const readJson = async (response) => {
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
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم التنفيذ بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
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
        fontWeight: 700,
        "@media (max-width: 599px)": {
          fontSize: "0.75rem",
          lineHeight: 1.05
        },
        [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          fontSize: "0.75rem",
          lineHeight: 1.15
        }
      }}
    >
      {value || "-"}
    </Typography>
  </Tooltip>
);


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
    selected.length === options.length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.35,
        borderRadius: 3,
        border: "1px solid #dce8e2",
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
          startIcon={<DoneAllIcon />}
          onClick={() =>
            onChange(
              allSelected
                ? []
                : options
            )
          }
          sx={uiLayout.withUiSx({
            fontFamily: "Cairo",
            fontWeight: 800
          }, uiLayout.buttonSx)}
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
        onChange={(_event, newValue) =>
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
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
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

const DeregistrationRequestsReport =
  () => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
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
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(today());

  const [toDate, setToDate] =
    useState(today());

  const [rows, setRows] =
    useState([]);

  const [
    filterDialogOpen,
    setFilterDialogOpen
  ] = useState(false);

  const [
    advancedFilters,
    setAdvancedFilters
  ] = useState({
    branchName: [],
    requestStatus: [],
    reason: [],
    requestedBy: [],
    finishUserName: []
  });

  const [loading, setLoading] =
    useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState(null);

  const [menuRow, setMenuRow] =
    useState(null);

  const [
    statementOpen,
    setStatementOpen
  ] = useState(false);

  const [
    statementStudent,
    setStatementStudent
  ] = useState(null);

  const [
    noteDialogOpen,
    setNoteDialogOpen
  ] = useState(false);

  const [
    noteText,
    setNoteText
  ] = useState("");

  const [
    noteSaving,
    setNoteSaving
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
            `${API_BASE_URL}/api/deregistration-requests/report?${params.toString()}`,
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
          "تعذر تحميل طلبات طي القيد"
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
        (row, index) => ({
          id: String(
            pick(
              row,
              ["Guid", "guid"],
              `dereg-${index}`
            )
          ),

          requestNo: String(
            pick(row, [
              "ID",
              "Id",
              "id"
            ])
          ),

          branchName: String(
            pick(row, [
              "BrEName",
              "branchName"
            ])
          ),

          studentName: String(
            pick(row, [
              "StudentName",
              "studentName"
            ])
          ),

          studentTel: String(
            pick(row, [
              "StudentTel",
              "studentTel"
            ])
          ),

          nationalId: String(
            pick(row, [
              "NationalId",
              "nationalId"
            ])
          ),

          amount:
            numberValue(
              pick(row, [
                "Amount",
                "amount"
              ])
            ),

          reason: String(
            pick(row, [
              "Reason",
              "reason"
            ])
          ),

          requestedBy: String(
            pick(row, [
              "FullName",
              "fullName"
            ])
          ),

          actionDate: String(
            pick(row, [
              "ActionDate",
              "actionDate"
            ])
          ),

          notes: String(
            pick(row, [
              "Notes_",
              "notes"
            ])
          ),

          requestStatus: String(
            pick(row, [
              "ORDERSTAUT",
              "requestStatus"
            ])
          ),

          finishUserName: String(
            pick(row, [
              "FinishUserName",
              "finishUserName"
            ])
          ),

          levelGuid: String(
            pick(row, [
              "LevelGuid",
              "levelGuid"
            ])
          ),

          accountGuid: String(
            pick(row, [
              "AccountGuid",
              "accountGuid"
            ])
          ),

          statusCode:
            numberValue(
              pick(row, [
                "Stauts",
                "statusCode"
              ])
            ),

          regType: String(
            pick(row, [
              "RegType",
              "regType"
            ])
          )
        })
      ),
    [rows]
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
      branchName:
        makeOptions("branchName"),
      requestStatus:
        makeOptions("requestStatus"),
      reason:
        makeOptions("reason"),
      requestedBy:
        makeOptions("requestedBy"),
      finishUserName:
        makeOptions("finishUserName")
    };
  }, [gridRows]);

  const filteredGridRows =
    useMemo(
      () =>
        gridRows.filter((row) =>
          Object.entries(
            advancedFilters
          ).every(
            ([
              field,
              selectedValues
            ]) =>
              selectedValues.length === 0 ||
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

  const updateAdvancedFilter =
    (field, values) =>
      setAdvancedFilters(
        (current) => ({
          ...current,
          [field]: values
        })
      );

  const resetAdvancedFilters = () =>
    setAdvancedFilters({
      branchName: [],
      requestStatus: [],
      reason: [],
      requestedBy: [],
      finishUserName: []
    });

  const columns = [
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
      field: "requestNo",
      headerName: "رقم الطلب",
      flex: 0.55,
      minWidth: 0
    },
    {
      field: "branchName",
      headerName: "فرع الدراسة",
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
      field: "studentTel",
      headerName: "رقم الجوال",
      minWidth: 0,
      flex: 0.78
    },
    {
      field: "nationalId",
      headerName: "رقم الهوية",
      minWidth: 0,
      flex: 0.78
    },
    {
      field: "amount",
      headerName: "الرصيد الحالي",
      minWidth: 0,
      flex: 0.72,
      renderCell: (params) => (
        <Typography
          sx={{
            width: "100%",
            textAlign: "center",
            fontFamily: "Cairo",
            fontWeight: 900
          }}
        >
          {money(params.value)}
        </Typography>
      )
    },
    {
      field: "reason",
      headerName: "السبب",
      flex: 0.9,
      minWidth: 0,
      renderCell: (params) => (
        <TextCell
          value={params.value}
          align="right"
        />
      )
    },
    {
      field: "requestedBy",
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
      field: "actionDate",
      headerName: "تاريخ الطلب",
      minWidth: 0,
      flex: 0.75
    },
    {
      field: "notes",
      headerName: "ملاحظات",
      flex: 1.05,
      minWidth: 0,
      renderCell: (params) => (
        <TextCell
          value={params.value}
          align="right"
        />
      )
    },
    {
      field: "requestStatus",
      headerName: "حالة الطلب",
      minWidth: 0,
      flex: 0.72,
      renderCell: (params) => (
  <Chip
    size="small"
    label={params.value || "غير مؤكد"}
    color={
      params.row.statusCode === 1
        ? "success"
        : "default"
    }
    sx={{
      fontFamily: "Cairo",
      fontWeight: 900,

      "@media (max-width: 599px)": {
        height: 18,
        minWidth: 0,
        maxWidth: "100%",
        fontSize: "0.75rem",
        borderRadius: "9px",

        "& .MuiChip-label": {
          px: 0.35,
          py: 0,
          lineHeight: 1
        }
      },

      [`@media (min-width: 600px) and (max-width: ${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        height: 23,
        fontSize: "0.75rem",

        "& .MuiChip-label": {
          px: 0.55
        }
      }
    }}
  />
)
    },
    {
      field: "finishUserName",
      headerName: "منفذ الطلب",
      flex: 0.9,
      minWidth: 0,
      renderCell: (params) => (
        <TextCell
          value={params.value}
          align="right"
        />
      )
    }
  ];

  const compactColumns = useMemo(() => {
    const byField = (field) =>
      columns.find(
        (column) => column.field === field
      );

    const phoneFields = [
      "studentName",
      "nationalId",
      "branchName",
      "requestStatus"
    ];

    const tabletFields = [
      "studentName",
      "nationalId",
      "branchName",
      "requestStatus",
      "amount",
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
                  : column.field === "branchName"
                    ? 1.15
                    : 1,
              minWidth: 0
            }
          : {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "branchName"
                    ? 1.2
                    : 1,
              minWidth:
                column.field === "studentName"
                  ? 125
                  : column.field === "branchName"
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
                      ? "0.75rem"
                      : "0.75rem",
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
                fontSize: isPhone ? 14 : 18
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

  const openStatement = () => {
    setStatementStudent({
      accountGuid:
        menuRow?.accountGuid || "",
      studentName:
        menuRow?.studentName || "",
      nationalId:
        menuRow?.nationalId || "",
      regType:
        menuRow?.regType || ""
    });

    setStatementOpen(true);
  };

  const openAttachments = () => {
    if (!menuRow?.nationalId) {
      showError(
        "رقم هوية الطالب غير موجود"
      );
      return;
    }

    window.open(
      `${ATTACHMENT_URL}?nationalId=${encodeURIComponent(menuRow.nationalId)}&kind=dereg`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openNote = () => {
    if (
      menuRow?.statusCode === 1
    ) {
      showError(
        "تم تأكيد الطلب بالفعل ولا يمكن التعديل عليه"
      );
      return;
    }

    setNoteText(
      menuRow?.notes || ""
    );

    setNoteDialogOpen(true);
  };

  const saveNote = async () => {
    if (!noteText.trim()) {
      await showError(
        "برجاء إدخال الملاحظات أولًا"
      );
      return;
    }

    try {
      setNoteSaving(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/deregistration-requests/note`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              orderGuid:
                menuRow?.id,
              notes:
                noteText.trim()
            })
          }
        );

      const result =
        await readJson(response);

      setNoteDialogOpen(false);

      await showSuccess(
        result?.message ||
        "تمت إضافة الملاحظة"
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر حفظ الملاحظة"
      );
    } finally {
      setNoteSaving(false);
    }
  };

  const confirmOrder = async () => {
    closeMenu();

    if (
      menuRow?.statusCode === 1
    ) {
      await showError(
        "تم تأكيد الطلب مسبقًا"
      );
      return;
    }

    if (!menuRow?.notes?.trim()) {
      await showError(
        "برجاء مراجعة المشرف العام وإضافة ملاحظة قبل التأكيد"
      );
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title:
          "تأكيد طلب طي القيد",
        text:
          `هل تريد تأكيد طلب الطالب ${menuRow.studentName}؟`,
        showCancelButton: true,
        confirmButtonText:
          "تأكيد",
        cancelButtonText:
          "إلغاء",
        confirmButtonColor:
          "#057546",
        cancelButtonColor:
          "#ae1e21",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/deregistration-requests/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              orderGuid:
                menuRow.id,
              levelGuid:
                menuRow.levelGuid,
              accountGuid:
                menuRow.accountGuid,
              nationalId:
                menuRow.nationalId,
              studentName:
                menuRow.studentName
            })
          }
        );

      const result =
        await readJson(response);

      await showSuccess(
        result?.message ||
        "تم تأكيد طلب طي القيد"
      );

      await loadData();
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تأكيد الطلب"
      );
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
      "رقم الطلب",
      "فرع الدراسة",
      "اسم الطالب",
      "رقم الجوال",
      "رقم الهوية",
      "الرصيد الحالي",
      "السبب",
      "مقدم الطلب",
      "تاريخ الطلب",
      "ملاحظات",
      "حالة الطلب",
      "منفذ الطلب"
    ];

    const values =
      filteredGridRows.map((row) => [
        row.requestNo,
        row.branchName,
        row.studentName,
        row.studentTel,
        row.nationalId,
        row.amount,
        row.reason,
        row.requestedBy,
        row.actionDate,
        row.notes,
        row.requestStatus,
        row.finishUserName
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
      `طلبات-طي-القيد-${today()}.csv`;

    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      sx={{
        minHeight: "100vh",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: "rtl",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)"
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
                  xs: "var(--app-header-height, 56px)",
                  sm: "var(--app-header-height, 56px)"
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
                    xs: "0.75rem",
                    sm: "0.78rem"
                  },
                  color: "#173b2b",
                  textAlign: "start"
                }}
              >
                طلبات طي القيد
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      )}

      

      <PageContainer
        component="main"
        sx={{
          mt: isDesktop ? 0 : isPhone ? "var(--app-header-height, 56px)" : "var(--app-header-height, 56px)",
          
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
              "1px solid rgba(5,117,70,0.14)"
          }}
        >
          <Stack
            direction={isDesktop ? "row" : "row"}
            spacing={isDesktop ? 1.2 : 0.35}
            useFlexGap
            flexWrap={isDesktop ? "nowrap" : "wrap"}
            alignItems={isDesktop ? "center" : "stretch"}
            sx={uiLayout.withUiSx({
              ...(!isDesktop
                ? {
                    display: "grid",
                    gridTemplateColumns: isPhone
                      ? "repeat(2,minmax(0,1fr))"
                      : "repeat(4,minmax(0,1fr))",
                    gap: isPhone ? 0.35 : 0.5
                  }
                : {}),

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
                    ? "0.75rem"
                    : "0.75rem"
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
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              },

              "& .MuiSvgIcon-root": {
                fontSize: !isDesktop
                  ? isPhone
                    ? 13
                    : 15
                  : undefined
              }
            }, uiLayout.actionBarSx)}
          >
            <PlaylistRemoveIcon
              sx={{
                color: "#057546",
                fontSize: isDesktop
                  ? 35
                  : isPhone
                    ? 18
                    : 22
              }}
            />

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontSize: isDesktop
                  ? "1.15rem"
                  : isPhone
                    ? "0.75rem"
                    : "0.75rem",
                fontWeight: 900,
                color: "#173b2b"
              }}
            >
              طلبات طي القيد
            </Typography>

            <Chip
              label={`النتائج: ${filteredGridRows.length} من ${gridRows.length}`}
              sx={{
                gridColumn: isPhone
                  ? "1 / -1"
                  : "auto",
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#057546",
                backgroundColor: "#eef8f3"
              }}
            />

            <Button
              variant={
                activeFilterCount > 0
                  ? "contained"
                  : "outlined"
              }
              startIcon={<FilterAltIcon />}
              onClick={() =>
                setFilterDialogOpen(true)
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                ...(activeFilterCount > 0
                  ? {
                      background:
                        "linear-gradient(135deg,#057546,#034d31)"
                    }
                  : {})
              }, uiLayout.buttonSx)}
            >
              فلاتر متقدمة
              {activeFilterCount > 0
                ? ` (${activeFilterCount})`
                : ""}
            </Button>

            <Button sx={uiLayout.buttonSx}
              variant="outlined"
              startIcon={
                <FileDownloadIcon />
              }
              onClick={exportCsv}
            >
              تصدير
            </Button>

            <Button sx={uiLayout.buttonSx}
              variant="outlined"
              startIcon={
                <RefreshIcon />
              }
              onClick={loadData}
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
            sx={uiLayout.withUiSx({
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
                    ? "0.75rem"
                    : "0.75rem"
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
                    ? "0.75rem"
                    : "0.75rem"
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
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              }
            }, uiLayout.filterBarSx)}
          >
            <TextField sx={uiLayout.formFieldSx}
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

            <TextField sx={uiLayout.formFieldSx}
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
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              عرض
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={uiLayout.withUiSx({
            width: "100%",
            minWidth: 0,
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
          }, uiLayout.tableContainerSx)}
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
                      },
                      sx: {
                        direction: "rtl"
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
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage %
                2 ===
              0
                ? "even-row"
                : "odd-row"
            }
            rowHeight={
              isDesktop
                ? 54
                : isPhone
                  ? 32
                  : 40
            }
            columnHeaderHeight={
              isDesktop
                ? 56
                : isPhone
                  ? 32
                  : 42
            }
            sx={uiLayout.withUiSx({
              border: 0,
              direction: "rtl",
              fontFamily: "Cairo",

              /*
               * نخلي DataGrid هو اللي يحسب عرض الأعمدة.
               * منع minWidth بالقوة على الخلايا كان بيخلي
               * البيانات تتحرك عن عناوين الأعمدة.
               */
              "& .MuiDataGrid-main": {
                minWidth: 0,
                overflow: "hidden"
              },

              "& .MuiDataGrid-virtualScroller": {
                overflowX:
                  "auto"
              },

              "& .MuiDataGrid-columnHeaders":
                {
                  backgroundColor:
                    "#eef8f3",
                  color: "#173b2b",
                  fontWeight: 900,
                  borderBottom:
                    "1px solid #d6e8df"
                },

              "& .MuiDataGrid-columnHeaderTitleContainer":
                {
                  justifyContent:
                    "center"
                },

              "& .MuiDataGrid-columnHeaderTitle": {
                width: "100%",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined
              },

              "& .MuiDataGrid-cell": {
                borderBottom:
                  "1px solid #e7efeb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                px: !isDesktop
                  ? isPhone
                    ? 0.04
                    : 0.18
                  : undefined,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined,
                textAlign: !isDesktop
                  ? "center"
                  : undefined
              },

              "& .MuiDataGrid-cellContent":
                {
                  width: "100%",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap"
                },

              "& .even-row": {
                backgroundColor: "#ffffff"
              },

              "& .odd-row": {
                backgroundColor: "#f8fbf9"
              },

              "& .MuiDataGrid-row:hover": {
                backgroundColor:
                  "#eef8f3 !important"
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
                        "auto"
                    },
                    "& .MuiDataGrid-scrollbar--horizontal": {
                      display: "block"
                    }
                  }
                : {})
            }, uiLayout.dataGridSx)}
          />
        </Paper>

        <Dialog sx={uiLayout.dialogLayoutSx}
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
            <span>تفاصيل طلب طي القيد</span>

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
                    ["رقم الطلب", detailsRow.requestNo],
                    ["فرع الدراسة", detailsRow.branchName],
                    ["اسم الطالب", detailsRow.studentName],
                    ["رقم الجوال", detailsRow.studentTel],
                    ["رقم الهوية", detailsRow.nationalId],
                    ["الرصيد الحالي", money(detailsRow.amount)],
                    ["سبب طي القيد", detailsRow.reason],
                    ["مقدم الطلب", detailsRow.requestedBy],
                    ["تاريخ الطلب", detailsRow.actionDate],
                    ["الملاحظات", detailsRow.notes],
                    ["حالة الطلب", detailsRow.requestStatus],
                    ["منفذ الطلب", detailsRow.finishUserName]
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
                            ? "0.75rem"
                            : "0.75rem"
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
                            ? "0.75rem"
                            : "0.75rem",
                          wordBreak:
                            "break-word"
                        }}
                      >
                        {value || "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  flexWrap="wrap"
                  sx={uiLayout.withUiSx({ mt: 0.8 }, uiLayout.actionBarSx)}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<NoteAddIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);
                      setNoteText(
                        detailsRow?.notes || ""
                      );
                      setNoteDialogOpen(true);
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    إضافة ملاحظة
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      <AccountBalanceWalletIcon />
                    }
                    onClick={() => {
                      setMenuRow(detailsRow);
                      setStatementStudent({
                        accountGuid:
                          detailsRow?.accountGuid || "",
                        studentName:
                          detailsRow?.studentName || "",
                        nationalId:
                          detailsRow?.nationalId || "",
                        regType:
                          detailsRow?.regType || ""
                      });
                      setStatementOpen(true);
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    كشف حساب
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);
                      if (detailsRow?.nationalId) {
                        window.open(
                          `${ATTACHMENT_URL}?nationalId=${encodeURIComponent(detailsRow.nationalId)}&kind=dereg`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    المرفقات
                  </Button>
                </Stack>
              </>
            ) : null}
          </DialogContent>

          <DialogActions
            sx={uiLayout.withUiSx({
              px: isPhone ? 1 : 1.5,
              py: isPhone ? 0.7 : 1
            }, uiLayout.dialogActionsSx)}
          >
            <Button
              variant="contained"
              onClick={closeDetails}
              sx={uiLayout.withUiSx({
                backgroundColor: "#057546",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone
                  ? "0.75rem"
                  : "0.75rem"
              }, uiLayout.buttonSx)}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={filterDialogOpen}
          onClose={() =>
            setFilterDialogOpen(false)
          }
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
                  backgroundColor: "#057546"
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
                label="فرع الدراسة"
                options={
                  filterOptions.branchName
                }
                value={
                  advancedFilters.branchName
                }
                onChange={(values) =>
                  updateAdvancedFilter(
                    "branchName",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="حالة الطلب"
                options={
                  filterOptions.requestStatus
                }
                value={
                  advancedFilters.requestStatus
                }
                onChange={(values) =>
                  updateAdvancedFilter(
                    "requestStatus",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="سبب طي القيد"
                options={
                  filterOptions.reason
                }
                value={
                  advancedFilters.reason
                }
                onChange={(values) =>
                  updateAdvancedFilter(
                    "reason",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="مقدم الطلب"
                options={
                  filterOptions.requestedBy
                }
                value={
                  advancedFilters.requestedBy
                }
                onChange={(values) =>
                  updateAdvancedFilter(
                    "requestedBy",
                    values
                  )
                }
              />

              <MultiValueFilter
                label="منفذ الطلب"
                options={
                  filterOptions.finishUserName
                }
                value={
                  advancedFilters.finishUserName
                }
                onChange={(values) =>
                  updateAdvancedFilter(
                    "finishUserName",
                    values
                  )
                }
              />
            </Box>
          </DialogContent>

          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button
              color="error"
              startIcon={<RestartAltIcon />}
              onClick={resetAdvancedFilters}
              disabled={
                activeFilterCount === 0
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              مسح الفلاتر
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              onClick={() =>
                setFilterDialogOpen(false)
              }
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              تطبيق وإغلاق
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              openNote();
            }}
          >
            <NoteAddIcon sx={{ ml: 1 }} />
            إضافة ملاحظة
          </MenuItem>

          <MenuItem
            onClick={() => {
              closeMenu();
              openStatement();
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
              openAttachments();
            }}
          >
            <AttachFileIcon
              sx={{ ml: 1 }}
            />
            عرض المرفقات
          </MenuItem>

          <MenuItem
            onClick={confirmOrder}
            sx={{
              color: "#057546"
            }}
          >
            <CheckCircleIcon
              sx={{ ml: 1 }}
            />
            تأكيد
          </MenuItem>
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

        <Dialog sx={uiLayout.dialogLayoutSx}
          open={noteDialogOpen}
          onClose={
            noteSaving
              ? undefined
              : () =>
                setNoteDialogOpen(
                  false
                )
          }
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              direction: "rtl",
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
                : undefined
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900
            }}
          >
            إضافة ملاحظة لطلب طي القيد
          </DialogTitle>

          <DialogContent dividers>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              autoFocus
              fullWidth
              multiline
              minRows={7}
              label="الملاحظات"
              value={noteText}
              onChange={(event) =>
                setNoteText(
                  event.target.value
                )
              }
            />
          </DialogContent>

          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button sx={uiLayout.buttonSx}
              onClick={() =>
                setNoteDialogOpen(
                  false
                )
              }
              disabled={noteSaving}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={saveNote}
              disabled={noteSaving}
              startIcon={
                noteSaving
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <NoteAddIcon />
              }
              sx={uiLayout.withUiSx({
                backgroundColor:
                  "#057546"
              }, uiLayout.buttonSx)}
            >
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

      </PageContainer>
    </Box></NavigationShell>
  );
};

export default DeregistrationRequestsReport;