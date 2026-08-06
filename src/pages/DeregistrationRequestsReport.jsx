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

import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import StudentStatementDialog2
  from "../components/StudentStatementDialog2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

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
        fontWeight: 700
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

const DeregistrationRequestsReport =
  () => {
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
          label={
            params.value ||
            "غير مؤكد"
          }
          color={
            params.row
              .statusCode === 1
              ? "success"
              : "default"
          }
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900
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
            <PlaylistRemoveIcon
              sx={{
                color: "#057546",
                fontSize: 35
              }}
            />

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "#173b2b"
              }}
            >
              طلبات طي القيد
            </Typography>

            <Chip
              label={`النتائج: ${filteredGridRows.length} من ${gridRows.length}`}
              sx={{
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
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                ...(activeFilterCount > 0
                  ? {
                      background:
                        "linear-gradient(135deg,#057546,#034d31)"
                    }
                  : {})
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
            >
              تصدير
            </Button>

            <Button
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
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage %
                2 ===
              0
                ? "even-row"
                : "odd-row"
            }
            rowHeight={54}
            columnHeaderHeight={56}
            sx={{
              border: 0,
              direction: "ltr",
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
                  "hidden !important"
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

              "& .MuiDataGrid-columnHeaderTitle":
                {
                  width: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap"
                },

              "& .MuiDataGrid-cell": {
                borderBottom:
                  "1px solid #e7efeb",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                overflow: "hidden"
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
              }
            }}
          />
        </Paper>

        <Dialog
          open={filterDialogOpen}
          onClose={() =>
            setFilterDialogOpen(false)
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

          <DialogActions>
            <Button
              color="error"
              startIcon={<RestartAltIcon />}
              onClick={resetAdvancedFilters}
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
                setFilterDialogOpen(false)
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

        <Dialog
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
              direction: "ltr",
              borderRadius: 4
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
            <TextField
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

          <DialogActions>
            <Button
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
              sx={{
                backgroundColor:
                  "#057546"
              }}
            >
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default DeregistrationRequestsReport;