import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import PersonAddAlt1Icon
  from "@mui/icons-material/PersonAddAlt1";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import FileDownloadIcon
  from "@mui/icons-material/FileDownload";
import MoreVertIcon
  from "@mui/icons-material/MoreVert";
import AttachFileIcon
  from "@mui/icons-material/AttachFile";
import CheckCircleIcon
  from "@mui/icons-material/CheckCircle";
import AccountBalanceWalletIcon
  from "@mui/icons-material/AccountBalanceWallet";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import StudentStatementDialog2
  from "../components/StudentStatementDialog2";
import RegisterDocumentDialog
  from "../components/RegisterDocumentDialog";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const ATTACHMENTS_BASE_URL =
  "https://sstli.com/arc-api/images_view.php";

const ZERO_GUID =
  "00000000-0000-0000-0000-000000000000";

const TYPE_TABS = [
  { value: 0, label: "طلاب الدبلومات" },
  { value: 1, label: "الدورات التأهيلية" },
  { value: 2, label: "الدورات التطويرية" }
];

const unwrap = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  for (const key of [
    "value", "Value", "data", "Data",
    "string", "String", "number", "Number",
    "boolean", "Boolean"
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

const pick = (row, names, fallback = "") => {
  for (const name of names) {
    const key =
      Object.keys(row || {}).find(
        (item) =>
          item.toLowerCase() ===
          String(name).toLowerCase()
      );

    if (key) {
      const value = unwrap(row[key]);

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }
  }

  return fallback;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;

  return [
    "1", "true", "yes", "نعم"
  ].includes(
    String(unwrap(value) ?? "")
      .trim()
      .toLowerCase()
  );
};

const toGuid = (value) => {
  const text =
    String(unwrap(value) ?? "").trim();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(text)
      ? text
      : ZERO_GUID;
};

const readJson = async (response) => {
  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.details
        ? `${result?.message || "حدث خطأ"}: ${result.details}`
        : (
            result?.message ||
            text ||
            `HTTP ${response.status}`
          )
    );
  }

  return result;
};

const showError = async (message) => {
  await Swal.fire({
    icon: "error",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });
};


const normalizeStudentRow = (item, index) => {
  const regType = Number(
    pick(item, ["RegType", "REGTYPE", "regType"], 0)
  );

  return {
    ...item,

    id: `${regType}-${String(
      pick(
        item,
        [
          "RegDocGuid",
          "REGDOCGUID",
          "Guid",
          "AccountGuid"
        ],
        index + 1
      )
    )}-${index}`,

    regType,

    regTypeName:
      pick(
        item,
        [
          "REGTYPENAME",
          "RegTypeName",
          "TYPESTUDENT",
          "TypeName"
        ],
        regType === 0
          ? "دبلوم"
          : regType === 1
            ? "دورة تأهيلية"
            : "دورة تطويرية"
      ),

    code:
      pick(
        item,
        ["Code", "RegDocCode", "CODE"]
      ),

    regDate:
      pick(
        item,
        [
          "RegDate",
          "RegisterDate",
          "DocDate",
          "Date_",
          "REGDATE"
        ]
      ),

    studentName:
      pick(
        item,
        [
          "StudentName",
          "Name",
          "FullName",
          "STUDENTNAME"
        ]
      ),

    studentNameEn:
      pick(
        item,
        [
          "StudentNameEn",
          "StudentNameEN",
          "NameEn",
          "EnglishName"
        ]
      ),

    studentTel:
      pick(
        item,
        [
          "StudentTel",
          "PhoneNumber",
          "Mobile",
          "Phone",
          "STUDENTTEL"
        ]
      ),

    nationalId:
      pick(
        item,
        [
          "NationalId",
          "NationalIdNumber",
          "IdentityNo",
          "NATIONALID"
        ]
      ),

    diplomName:
      pick(
        item,
        [
          "DiplomName",
          "DiplomaName",
          "CourseName",
          "DIPLOMNAME"
        ]
      ),

    batchOrDate:
      pick(
        item,
        [
          "BatchOrDate",
          "BatchName",
          "BatchDate",
          "BATCHORDATE"
        ]
      ),

    manFullName:
      pick(
        item,
        [
          "ManFullName",
          "SellerName",
          "RegisterBy",
          "CreatedByName",
          "MANFULLNAME"
        ]
      ),

    email:
      pick(
        item,
        ["Email", "StudentEmail", "EMAIL"]
      )
  };
};

const NewStudentsPage = () => {
  const theme = useTheme();

  const isLargeScreen = useMediaQuery(
    theme.breakpoints.up("xl")
  );

  const isMediumScreen = useMediaQuery(
    theme.breakpoints.up("lg")
  );

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const savedBranch = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user_branch") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const userGuid =
    String(user?.guid || user?.Guid || "").trim();

  const defaultBranchGuid =
    String(
      user?.branchForWork ||
      user?.BranchForWork ||
      savedBranch?.guid ||
      savedBranch?.Guid ||
      ""
    ).trim();

  const [branches, setBranches] = useState([]);
  const [branchGuid, setBranchGuid] =
    useState(defaultBranchGuid);
  const [rows, setRows] = useState([]);
  const [typeTab, setTypeTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState("");
  const [
    acceptingStudentName,
    setAcceptingStudentName
  ] = useState("");

  const loadRequestIdRef = useRef(0);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementStudent, setStatementStudent] = useState(null);

  const [
    registerDocumentOpen,
    setRegisterDocumentOpen
  ] = useState(false);

  const [
    registerDocumentRow,
    setRegisterDocumentRow
  ] = useState(null);

  const loadBranches = useCallback(async () => {
    try {
      const params =
        new URLSearchParams({ userGuid });

      const response = await fetch(
        `${API_BASE_URL}/api/new-students/branches?${params}`,
        { cache: "no-store" }
      );

      const result = await readJson(response);
      const items =
        Array.isArray(result?.data)
          ? result.data
          : [];

      setBranches(items);

      const currentBranchIsAllowed =
        items.some(
          (item) =>
            String(item?.guid || "") ===
            String(branchGuid || "")
        );

      if (
        items.length > 0 &&
        !currentBranchIsAllowed
      ) {
        setBranchGuid(
          String(items[0]?.guid || "")
        );
      }

      if (items.length === 0) {
        setBranchGuid("");
        setRows([]);
      }
    } catch (error) {
      await showError(
        error?.message || "تعذر تحميل الفروع"
      );
    }
  }, [userGuid, branchGuid]);

  const loadStudents = useCallback(async () => {
    const requestId =
      ++loadRequestIdRef.current;

    if (!branchGuid) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);

      const params =
        new URLSearchParams({
          userGuid,
          branchGuid,
          _: String(Date.now())
        });

      const response = await fetch(
        `${API_BASE_URL}/api/new-students?${params}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      );

      const result = await readJson(response);

      /*
       * لو طلب قديم رجع بعد طلب أحدث، نتجاهله.
       * ده يمنع بيانات فرع/تاب قديم إنها تظهر فوق البيانات الحالية.
       */
      if (
        requestId !==
        loadRequestIdRef.current
      ) {
        return;
      }

      const items =
        Array.isArray(result?.data)
          ? result.data
          : [];

      setRows(
        items.map((item, index) =>
          normalizeStudentRow(item, index)
        )
      );
    } catch (error) {
      if (
        requestId !==
        loadRequestIdRef.current
      ) {
        return;
      }

      setRows([]);

      await showError(
        error?.message ||
        "تعذر تحميل قائمة الطلاب الجدد"
      );
    } finally {
      if (
        requestId ===
        loadRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, [userGuid, branchGuid]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    setRows([]);
    setTypeTab(0);
  }, [branchGuid]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          Number(row.regType) ===
          Number(typeTab)
      ),
    [rows, typeTab]
  );

  /*
   * تغيير key يجبر DataGrid يعمل mount جديد لكل تاب،
   * وبالتالي يمنع احتفاظه بصفوف التاب السابق في الـvirtual cache.
   */
  const gridKey = useMemo(
    () =>
      `${branchGuid || "no-branch"}-${typeTab}`,
    [branchGuid, typeTab]
  );

  const counts = useMemo(() => {
    const result = { 0: 0, 1: 0, 2: 0 };

    rows.forEach((row) => {
      const value = Number(row.regType);

      if (
        Object.prototype.hasOwnProperty.call(
          result,
          value
        )
      ) {
        result[value] += 1;
      }
    });

    return result;
  }, [rows]);

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const openAttachments = (row) => {
    const nationalId =
      String(pick(row, ["NationalId"], "")).trim();

    if (!nationalId) {
      showError("رقم الهوية غير موجود");
      return;
    }

    window.open(
      `${ATTACHMENTS_BASE_URL}?identity=${encodeURIComponent(nationalId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openStatement = (row) => {
    setStatementStudent({
      accountGuid: pick(row, ["AccountGuid"], ""),
      nationalId: pick(row, ["NationalId"], ""),
      studentName: pick(row, ["StudentName"], "")
    });

    setStatementOpen(true);
  };

  const acceptStudent = async (row) => {
    const studentName =
      String(pick(row, ["StudentName"], ""));

    const regType =
      Number(pick(row, ["RegType"], 0));

    const isPackage =
      toBoolean(pick(row, ["IsPackage"], false));

    let courseGuid =
      toGuid(pick(row, ["CourseGuid"], ZERO_GUID));

    if (
      regType === 2 &&
      !isPackage &&
      courseGuid === ZERO_GUID
    ) {
      const prompt = await Swal.fire({
        icon: "info",
        title: "تحديد الدورة التطويرية",
        text:
          "أدخل CourseGuid الخاص بالدورة المراد إلحاق الطالب بها",
        input: "text",
        showCancelButton: true,
        confirmButtonText: "متابعة القبول",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        inputValidator: (value) =>
          toGuid(value) === ZERO_GUID
            ? "أدخل CourseGuid صحيحًا"
            : undefined
      });

      if (!prompt.isConfirmed) return;

      courseGuid = toGuid(prompt.value);
    }

    const accountGuid =
      toGuid(
        pick(
          row,
          ["AccountGuid"],
          ZERO_GUID
        )
      );

    const regDocGuid =
      toGuid(
        pick(
          row,
          ["RegDocGuid"],
          ZERO_GUID
        )
      );

    const levelGuid =
      toGuid(
        pick(
          row,
          ["LevelGuid"],
          ZERO_GUID
        )
      );

    const batchGuid =
      toGuid(
        pick(
          row,
          ["BatchGuid"],
          ZERO_GUID
        )
      );

    const diplomGuid =
      toGuid(
        pick(
          row,
          ["DiplomGuid"],
          ZERO_GUID
        )
      );

    const studentBranchGuid =
      toGuid(
        pick(
          row,
          ["BranchGuid"],
          branchGuid
        )
      );

    if (accountGuid === ZERO_GUID) {
      await showError(
        "لا يمكن قبول الطالب لأن AccountGuid غير موجود في نتيجة LoadStudentForAccept_All"
      );
      return;
    }

    if (regDocGuid === ZERO_GUID) {
      await showError(
        "لا يمكن قبول الطالب لأن RegDocGuid غير موجود في نتيجة LoadStudentForAccept_All"
      );
      return;
    }

    if (studentBranchGuid === ZERO_GUID) {
      await showError(
        "لا يمكن قبول الطالب لأن BranchGuid غير موجود"
      );
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "تأكيد قبول التسجيل",
      text:
        `هل تريد قبول تسجيل الطالب ${studentName}؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، قبول",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });

    if (!confirmation.isConfirmed) return;

    const rowId = String(row.id || "");

    try {
      setAcceptingId(rowId);
      setAcceptingStudentName(studentName);

      const body = {
        userGuid,
        accountGuid,
        regDocGuid,
        levelGuid,
        batchGuid,
        diplomGuid,
        branchGuid:
          studentBranchGuid,
        courseGuid,
        regType,
        isPackage,
        regDocCode:
          String(pick(row, ["Code"], "")),
        actionReason: ""
      };

      const response = await fetch(
        `${API_BASE_URL}/api/new-students/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const result = await readJson(response);

      /*
       * الـAPI رجع بالفعل؛ نقفل مؤشر الانتظار
       * قبل إظهار رسالة النجاح.
       */
      setAcceptingId("");
      setAcceptingStudentName("");

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text:
          result?.message ||
          "تم قبول تسجيل الطالب",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadStudents();
    } catch (error) {
      setAcceptingId("");
      setAcceptingStudentName("");

      await showError(
        error?.message ||
        "تعذر قبول تسجيل الطالب"
      );
    } finally {
      setAcceptingId("");
      setAcceptingStudentName("");
    }
  };

  const openStatementDocument = async (row) => {
    const formName =
      String(
        row?.formName ||
        row?.FormName ||
        ""
      )
        .trim()
        .toLowerCase();

    if (!formName) {
      await showError(
        "لا يمكن تحديد نوع المستند"
      );
      return;
    }

    if (formName !== "addregdoc") {
      await showError(
        "عرض المستند متاح حاليًا لاستمارات التسجيل فقط"
      );
      return;
    }

    const docGuid =
      row?.actionGuid ||
      row?.ActionGuid ||
      row?.docGuid ||
      row?.DocGuid ||
      "";

    if (
      !docGuid ||
      docGuid === ZERO_GUID
    ) {
      await showError(
        "لا يمكن قراءة معرف استمارة التسجيل"
      );
      return;
    }

    try {
      const params =
        new URLSearchParams({
          docGuid
        });

      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/student-statement/register-order/check?${params}`,
        {
          cache: "no-store"
        }
      );

      const result =
        await readJson(response);

      setRegisterDocumentRow({
        ...row,
        actionGuid: docGuid,
        hasOrder:
          Boolean(result?.hasOrder)
      });

      setRegisterDocumentOpen(true);
    } catch (error) {
      await showError(
        error?.message ||
        "حدث خطأ أثناء فتح استمارة التسجيل"
      );
    }
  };

  const exportCsv = () => {
    if (filteredRows.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }

    const headers = [
      "نوع التسجيل",
      "كود",
      "التاريخ",
      "اسم الطالب",
      "الاسم بالإنجليزية",
      "رقم الجوال",
      "رقم الهوية",
      "الدبلوم/الدورة",
      "الدفعة",
      "مسئول التسجيل",
      "البريد الإلكتروني"
    ];

    const data = filteredRows.map((row) => [
      row.regTypeName,
      row.code,
      row.regDate,
      row.studentName,
      row.studentNameEn,
      row.studentTel,
      row.nationalId,
      row.diplomName,
      row.batchOrDate,
      row.manFullName,
      row.email
    ]);

    const csv =
      "\uFEFF" +
      [headers, ...data]
        .map((line) =>
          line
            .map((value) =>
              `"${String(value ?? "")
                .replaceAll('"', '""')}"`
            )
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      `قائمة_الطلاب_الجدد_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "actions",
        headerName: "الإجراءات",
        width: 58,
        minWidth: 58,
        maxWidth: 58,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Tooltip title="الإجراءات">
            <IconButton
              size="small"
              onClick={(event) => {
                setAnchorEl(event.currentTarget);
                setMenuRow(params.row);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      },
      {
        field: "regTypeName",
        headerName: "نوع التسجيل",
        minWidth: 92,
        flex: 0.7
      },
      {
        field: "code",
        headerName: "كود",
        minWidth: 68,
        flex: 0.45
      },
      {
        field: "regDate",
        headerName: "التاريخ",
        minWidth: 88,
        flex: 0.58
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        minWidth: 150,
        flex: 1.3
      },
      {
        field: "studentNameEn",
        headerName: "الاسم بالإنجليزية",
        minWidth: 145,
        flex: 1.15
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        minWidth: 102,
        flex: 0.72
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        minWidth: 102,
        flex: 0.72
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        minWidth: 150,
        flex: 1.18
      },
      {
        field: "batchOrDate",
        headerName: "الدفعة",
        minWidth: 105,
        flex: 0.75
      },
      {
        field: "manFullName",
        headerName: "مسئول التسجيل",
        minWidth: 125,
        flex: 0.92
      }
    ];

    if (isLargeScreen) {
      return [
        ...baseColumns,
        {
          field: "email",
          headerName: "البريد الإلكتروني",
          minWidth: 155,
          flex: 1.05
        }
      ];
    }

    if (isMediumScreen) {
      return baseColumns;
    }

    return baseColumns.filter(
      (column) =>
        column.field !== "batchOrDate"
    );
  }, [isLargeScreen, isMediumScreen]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "ltr",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${SIDEBAR_WIDTH}px`
          },
          p: {
            xs: 1,
            md: 2
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.4,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)",
            direction: "ltr"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              lg: "row"
            }}
            spacing={1.2}
            alignItems={{
              xs: "stretch",
              lg: "center"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flex: 1 }}
            >
              <PersonAddAlt1Icon
                sx={{
                  fontSize: 38,
                  color: "#057546"
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    color: "#173b2b"
                  }}
                >
                  قائمة الطلاب الجدد
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    color: "#708179",
                    fontSize: ".78rem"
                  }}
                >
                  عرض وقبول التسجيلات الجديدة حسب الفرع ونوع البرنامج
                </Typography>
              </Box>
            </Stack>

            <TextField
              select
              label="الفرع"
              value={branchGuid}
              disabled={branches.length <= 1}
              onChange={(event) =>
                setBranchGuid(event.target.value)
              }
              sx={{
                minWidth: {
                  xs: "100%",
                  lg: 360
                }
              }}
            >
              {branches.map((branch) => (
                <MenuItem
                  key={branch.guid}
                  value={branch.guid}
                >
                  {branch.branchName}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
              disabled={loading}
            >
              تحديث
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
            >
              تصدير
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            minHeight: {
              xs: 560,
              md: "calc(100vh - 145px)"
            },
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)",
            overflow: "hidden",
            direction: "ltr"
          }}
        >
          <Tabs
            value={typeTab}
            onChange={(_, value) => {
              /*
               * إغلاق أي قائمة إجراءات قديمة قبل تغيير التاب.
               */
              closeMenu();
              setTypeTab(Number(value));
            }}
            variant="fullWidth"
            sx={{
              borderBottom:
                "1px solid #dce9e2",
              "& .MuiTab-root": {
                fontFamily: "Cairo",
                fontWeight: 900,
                minHeight: 58
              }
            }}
          >
            {TYPE_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                disabled={Boolean(acceptingId)}
                label={`${tab.label} (${counts[tab.value] || 0})`}
              />
            ))}
          </Tabs>

          <Box
            sx={{
              width: "100%",
              minHeight: {
                xs: 430,
                md: 520,
                xl: 590
              },
              overflow: "hidden"
            }}
          >
            <DataGrid
              key={gridKey}
              autoHeight
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={54}
              columnHeaderHeight={54}
              density="compact"
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 25,
                    page: 0
                  }
                }
              }}
              slots={{
                toolbar: GridToolbar
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: {
                    debounceMs: 350
                  }
                }
              }}
              sx={{
                border: 0,
                direction: "ltr",
                width: "100%",

                "& .MuiDataGrid-main": {
                  overflow: "hidden"
                },

                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "hidden !important",
                  overflowY: "hidden !important"
                },

                "& .MuiDataGrid-virtualScrollerContent": {
                  minWidth: "100% !important"
                },

                "& .MuiDataGrid-virtualScrollerRenderZone": {
                  minWidth: "100% !important"
                },

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#edf7f2"
                },

                "& .MuiDataGrid-columnHeader": {
                  px: 0.7
                },

                "& .MuiDataGrid-columnHeaderTitle": {
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: {
                    xs: "0.72rem",
                    md: "0.78rem",
                    xl: "0.82rem"
                  },
                  whiteSpace: "normal",
                  lineHeight: 1.25,
                  textAlign: "center"
                },

                "& .MuiDataGrid-cell": {
                  fontFamily: "Cairo",
                  fontWeight: 700,
                  fontSize: {
                    xs: "0.72rem",
                    md: "0.78rem",
                    xl: "0.82rem"
                  },
                  px: 0.7,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },

                "& .MuiDataGrid-row:nth-of-type(odd)": {
                  backgroundColor:
                    "rgba(255,170,95,.12)"
                },

                "& .MuiDataGrid-footerContainer": {
                  minHeight: 54
                },

                "& .MuiDataGrid-scrollbar--horizontal, & .MuiDataGrid-scrollbar--vertical": {
                  display: "none !important"
                },

                "& .MuiDataGrid-filler": {
                  display: "none"
                }
              }}
            />
          </Box>
        </Paper>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              direction: "ltr",
              minWidth: 210
            }
          }}
        >
          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (row) openAttachments(row);
            }}
          >
            <AttachFileIcon sx={{ ml: 1 }} />
            عرض المرفقات
          </MenuItem>

          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (row) acceptStudent(row);
            }}
            disabled={
              String(menuRow?.id || "") === acceptingId
            }
          >
            {String(menuRow?.id || "") === acceptingId ? (
              <CircularProgress
                size={19}
                sx={{ ml: 1 }}
              />
            ) : (
              <CheckCircleIcon
                sx={{
                  ml: 1,
                  color: "#057546"
                }}
              />
            )}
            قبول التسجيل
          </MenuItem>

          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (row) openStatement(row);
            }}
          >
            <AccountBalanceWalletIcon sx={{ ml: 1 }} />
            كشف حساب
          </MenuItem>
        </Menu>

        <StudentStatementDialog2
          open={statementOpen}
          onClose={() => {
            setStatementOpen(false);
            setStatementStudent(null);
          }}
          student={statementStudent}
          apiBaseUrl={API_BASE_URL}
          onOpenStatementDocument={
            openStatementDocument
          }
        />

        <RegisterDocumentDialog
          open={registerDocumentOpen}
          onClose={() => {
            setRegisterDocumentOpen(false);
            setRegisterDocumentRow(null);
          }}
          docGuid={
            registerDocumentRow?.actionGuid ||
            registerDocumentRow?.ActionGuid ||
            ""
          }
          documentNo={
            registerDocumentRow?.documentNo ||
            registerDocumentRow?.DocumentNo ||
            ""
          }
          apiBaseUrl={API_BASE_URL}
        />

        <Backdrop
          open={Boolean(acceptingId)}
          sx={{
            zIndex: (currentTheme) =>
              currentTheme.zIndex.modal + 20,
            backgroundColor:
              "rgba(9, 36, 25, 0.72)",
            backdropFilter: "blur(3px)"
          }}
        >
          <Paper
            elevation={12}
            sx={{
              minWidth: {
                xs: 280,
                sm: 390
              },
              px: 4,
              py: 3.5,
              borderRadius: 4,
              textAlign: "center",
              direction: "rtl"
            }}
          >
            <CircularProgress
              size={56}
              thickness={4.5}
              sx={{
                color: "#057546",
                mb: 2
              }}
            />

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: "1.08rem",
                color: "#173b2b"
              }}
            >
              جاري قبول تسجيل الطالب
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontFamily: "Cairo",
                fontWeight: 700,
                color: "#66756e"
              }}
            >
              {acceptingStudentName || "يرجى الانتظار..."}
            </Typography>

            <Typography
              sx={{
                mt: 1.2,
                fontFamily: "Cairo",
                fontSize: ".78rem",
                color: "#8a9690"
              }}
            >
              لا تغلق الصفحة حتى انتهاء العملية
            </Typography>
          </Paper>
        </Backdrop>
      </Box>
    </Box>
  );
};

export default NewStudentsPage;