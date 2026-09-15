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
  Tab,
  Tabs,
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
import MenuRoundedIcon
  from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon
  from "@mui/icons-material/VisibilityOutlined";
import CloseIcon
  from "@mui/icons-material/Close";

import Swal from "sweetalert2";





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
        backgroundColor: color,
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

const TransferRequestsReport = () => {
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

  const compactColumns = useMemo(() => {
    const byField = (field) =>
      columns.find(
        (column) => column.field === field
      );

    const phoneFields = [
      "studentName",
      "nationalId",
      "newValue",
      "confirmStatus"
    ];

    const tabletFields = [
      "studentName",
      "nationalId",
      "oldValue",
      "newValue",
      "confirmStatus",
      "actorUserName"
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
                  : column.field === "newValue"
                    ? 1.25
                    : 1,
              minWidth: 0
            }
          : {
              flex:
                column.field === "studentName"
                  ? 1.35
                  : column.field === "oldValue" ||
                    column.field === "newValue"
                    ? 1.2
                    : 1,
              minWidth:
                column.field === "studentName"
                  ? 125
                  : column.field === "oldValue" ||
                    column.field === "newValue"
                    ? 120
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
                طلبات النقل / التحويل
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

              "& > .MuiBox-root:first-of-type": {
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
            <SwapHorizIcon
              sx={{
                color: "#057546",
                fontSize: isDesktop
                  ? 38
                  : isPhone
                    ? 18
                    : 22
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
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
                طلبات النقل / التحويل
              </Typography>

              {!isPhone && (
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: isTablet
                      ? "0.75rem"
                      : "0.75rem",
                    color: "#708179"
                  }}
                >
                  متابعة طلبات النقل بين الفروع وطلبات تغيير التخصص
                </Typography>
              )}
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
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
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
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
            >
              تصدير
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <RefreshIcon />
              }
              onClick={loadData}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 800
              }, uiLayout.buttonSx)}
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
                minHeight: isDesktop
                  ? 58
                  : isPhone
                    ? 34
                    : 42,
                fontSize: !isDesktop
                  ? isPhone
                    ? "0.75rem"
                    : "0.75rem"
                  : undefined,
                px: !isDesktop
                  ? isPhone
                    ? 0.35
                    : 0.75
                  : undefined
              },
              "& .Mui-selected": {
                color:
                  "#057546 !important"
              },
              "& .MuiTabs-indicator": {
                backgroundColor:
                  "#057546",
                height: isDesktop
                  ? 4
                  : 2
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
                gridColumn: isPhone
                  ? "1 / -1"
                  : "auto",
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
              ? "calc(100vh - 330px)"
              : isPhone
                ? "calc(100dvh - 300px)"
                : "calc(100dvh - 280px)",
            minHeight: isDesktop
              ? 480
              : isPhone
                ? 400
                : 520,
            borderRadius: 3.5,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.13)"
          }, uiLayout.tableContainerSx)}
        >
          <DataGrid
            rows={filteredRows}
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
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage %
                2 === 0
                ? "even-row"
                : "odd-row"
            }
            sx={uiLayout.withUiSx({
              border: 0,
              direction: "rtl",
              fontFamily: "Cairo",

              "& .MuiDataGrid-main": {
                minWidth: 0,
                overflow: "hidden"
              },

              "& .MuiDataGrid-virtualScroller":
                {
                  overflowX:
                    "auto"
                },

              "& .MuiDataGrid-columnHeaders":
                {
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
                    ? "0.75rem"
                    : "0.75rem"
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderBottom:
                  "1px solid #e7efeb",
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

              "& .even-row": {
                backgroundColor: "#fff"
              },

              "& .odd-row": {
                backgroundColor:
                  "#f8fbf9"
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
            <span>
              {detailsRow?.type === "branch"
                ? "تفاصيل طلب النقل"
                : "تفاصيل طلب تغيير التخصص"}
            </span>

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
                    ["تاريخ الطلب", detailsRow.createdAt],
                    ["اسم الطالب", detailsRow.studentName],
                    ["رقم الهوية", detailsRow.nationalId],
                    [
                      detailsRow.type === "branch"
                        ? "الفرع الحالي"
                        : "التخصص القديم",
                      detailsRow.oldValue
                    ],
                    [
                      detailsRow.type === "branch"
                        ? "الفرع المطلوب"
                        : "التخصص الجديد",
                      detailsRow.newValue
                    ],
                    ["مقدم الطلب", detailsRow.actorUserName],
                    ["الحالة", detailsRow.statusName],
                    ["الرد", detailsRow.response],
                    ["منفذ الإجراء", detailsRow.confirmedByName],
                    ["تاريخ التنفيذ", detailsRow.confirmedAt]
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
                    startIcon={<AttachFileIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);

                      if (
                        detailsRow?.nationalId
                      ) {
                        const kind =
                          detailsRow.type === "branch"
                            ? "transferbranch"
                            : "transferdiplom";

                        window.open(
                          `${ATTACHMENT_URL}?nationalId=${encodeURIComponent(detailsRow.nationalId)}&kind=${kind}`,
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

                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);
                      setTimeout(
                        () => changeStatus(1),
                        0
                      );
                    }}
                    sx={uiLayout.withUiSx({
                      backgroundColor:
                        "#057546",
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    تأكيد
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setMenuRow(detailsRow);
                      setTimeout(
                        () => changeStatus(2, true),
                        0
                      );
                    }}
                    sx={uiLayout.withUiSx({
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem"
                    }, uiLayout.buttonSx)}
                  >
                    إلغاء
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
            setFilterDialogOpen(
              false
            )
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

          <DialogActions sx={uiLayout.dialogActionsSx}>
            <Button
              color="error"
              startIcon={
                <RestartAltIcon />
              }
              onClick={resetFilters}
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
                setFilterDialogOpen(
                  false
                )
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
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default TransferRequestsReport;