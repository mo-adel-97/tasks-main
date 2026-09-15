import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  AppBar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
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
import PersonAddAlt1Icon
  from "@mui/icons-material/PersonAddAlt1";
import MenuRoundedIcon
  from "@mui/icons-material/MenuRounded";
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

import StudentStatementDialog2
  from "../components/StudentStatementDialog2";
import RegisterDocumentDialog
  from "../components/RegisterDocumentDialog";




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

const shortStudentName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
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

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`,
    { noSsr: true }
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = !isDesktop;

  const isLargeScreen = useMediaQuery(
    theme.breakpoints.up("xl")
  );

  const isMediumScreen = useMediaQuery(
    theme.breakpoints.up("lg")
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

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
    const actionColumn = {
      field: "actions",
      headerName: isCompact ? "" : "الإجراءات",
      width: isPhone ? 42 : isTablet ? 48 : 58,
      minWidth: isPhone ? 42 : isTablet ? 48 : 58,
      maxWidth: isPhone ? 42 : isTablet ? 48 : 58,
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
            sx={{
              width: isPhone ? 22 : isTablet ? 28 : 34,
              height: isPhone ? 22 : isTablet ? 28 : 34,
              p: 0,
              color: "#057546",
              backgroundColor: isCompact
                ? "#eef8f3"
                : undefined
            }}
          >
            <MoreVertIcon
              sx={{
                fontSize: isPhone ? 14 : isTablet ? 17 : 20
              }}
            />
          </IconButton>
        </Tooltip>
      )
    };

    if (isPhone) {
      return [
        {
          ...actionColumn,
          width: 30,
          minWidth: 30,
          maxWidth: 30
        },
        {
          field: "studentName",
          headerName: "الطالب",
          width: 76,
          minWidth: 76,
          maxWidth: 76,
          renderCell: (params) =>
            shortStudentName(params.row.studentName)
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          width: 66,
          minWidth: 66,
          maxWidth: 66
        },
        {
          field: "diplomName",
          headerName: "الدبلوم/الدورة",
          width: 88,
          minWidth: 88,
          maxWidth: 88
        },
        {
          field: "manFullName",
          headerName: "المندوب",
          width: 68,
          minWidth: 68,
          maxWidth: 68
        }
      ];
    }

    if (isTablet) {
      return [
        {
          ...actionColumn,
          width: 42,
          minWidth: 42,
          maxWidth: 42
        },
        {
          field: "regDate",
          headerName: "التاريخ",
          flex: 0.7,
          minWidth: 78
        },
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1,
          minWidth: 100,
          renderCell: (params) =>
            shortStudentName(params.row.studentName)
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.8,
          minWidth: 82
        },
        {
          field: "diplomName",
          headerName: "الدبلوم/الدورة",
          flex: 1.05,
          minWidth: 108
        },
        {
          field: "batchOrDate",
          headerName: "الدفعة",
          flex: 0.78,
          minWidth: 82
        },
        {
          field: "manFullName",
          headerName: "المندوب",
          flex: 0.86,
          minWidth: 88
        }
      ];
    }

    const baseColumns = [
      actionColumn,
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
        minWidth: 140,
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
  }, [
    isPhone,
    isTablet,
    isCompact,
    isLargeScreen,
    isMediumScreen
  ]);

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: "rtl",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)"
      }}
    >
      {!isDesktop && (
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
            },

            ".swal2-popup": {
              width: isPhone
                ? "88vw !important"
                : isTablet
                  ? "540px !important"
                  : undefined,
              padding: isPhone
                ? "0.75rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },

            ".swal2-title": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.82rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },

            ".swal2-html-container, .swal2-input-label": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.56rem !important"
                : isTablet
                  ? "0.68rem !important"
                  : undefined
            },

            ".swal2-input": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.58rem !important"
                : isTablet
                  ? "0.68rem !important"
                  : undefined
            },

            ".swal2-confirm, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.5rem !important"
                : isTablet
                  ? "0.6rem !important"
                  : undefined,
              padding: isPhone
                ? "0.4rem 0.7rem !important"
                : undefined
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 1400,
            background:
              "rgba(255,255,255,.97)",
            backdropFilter:
              "blur(14px)",
            color: "#17372b",
            borderBottom:
              "1px solid rgba(5,117,70,.12)",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
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
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setMobileSidebarOpen(
                  (current) => !current
                );
              }}
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
                  sm: "0.79rem"
                },
                color: "#17372b",
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              قائمة الطلاب الجدد
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          ml: 0,
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          
          
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 2
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.8 : isTablet ? 0.95 : 1.1,
            mb: isPhone ? 0.7 : isTablet ? 0.8 : 0.8,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 2,
            border:
              "1px solid rgba(5,117,70,.14)",
            direction: "rtl"
          }}
        >
          <Stack
            direction="row"
            spacing={isPhone ? 0.65 : isTablet ? 0.8 : 1.2}
            alignItems="center"
            sx={uiLayout.withUiSx({
              flexWrap: isCompact ? "wrap" : "nowrap",
              rowGap: isPhone ? 0.75 : isTablet ? 0.9 : 0,
              columnGap: isPhone ? 0.55 : isTablet ? 0.7 : 0
            }, uiLayout.filterBarSx)}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                flex: "1 1 240px",
                minWidth: isCompact ? 0 : 220,
                ...(isCompact && {
                  flexBasis: "100%",
                  width: "100%"
                })
              }}
            >
              <PersonAddAlt1Icon
                sx={{
                  fontSize: isPhone ? 20 : isTablet ? 24 : 38,
                  color: "#057546"
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.86rem"
                        : "1.25rem",
                    color: "#173b2b"
                  }}
                >
                  قائمة الطلاب الجدد
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    color: "#708179",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : ".78rem",
                    display: isPhone ? "none" : "block"
                  }}
                >
                  عرض وقبول التسجيلات الجديدة حسب الفرع ونوع البرنامج
                </Typography>
              </Box>
            </Stack>

            <TextField InputLabelProps={{ shrink: true }}
              select
              label="الفرع"
              value={branchGuid}
              disabled={branches.length <= 1}
              onChange={(event) =>
                setBranchGuid(event.target.value)
              }
              size={isCompact ? "small" : "medium"}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: isPhone
                        ? 280
                        : isTablet
                          ? 360
                          : 520,
                      mt: 0.4,

                      "& .MuiMenuItem-root": {
                        minHeight: isPhone
                          ? 30
                          : isTablet
                            ? 34
                            : 44,
                        py: isPhone
                          ? 0.35
                          : isTablet
                            ? 0.45
                            : 0.8,
                        px: isPhone
                          ? 1
                          : isTablet
                            ? 1.2
                            : 1.8,
                        fontFamily: "Cairo",
                        fontWeight: 700,
                        fontSize: isPhone
                          ? "0.55rem"
                          : isTablet
                            ? "0.65rem"
                            : "0.9rem",
                        lineHeight: 1.35,
                        whiteSpace: "normal"
                      }
                    }
                  }
                }
              }}
              sx={uiLayout.withUiSx({
                minWidth: 0,
                flex: isCompact ? "1 1 100%" : "0 0 360px",

                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },

                "& .MuiInputBase-input": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },

                "& .MuiOutlinedInput-root": {
                  minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                }
              }, uiLayout.formFieldSx)}
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
              size={isCompact ? "small" : "medium"}
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
              disabled={loading}
              sx={uiLayout.withUiSx({
                flex: isCompact ? "1 1 calc(50% - 6px)" : undefined,
                minWidth: 0,
                minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                fontFamily: "Cairo",
                fontWeight: 800,
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined
              }, uiLayout.buttonSx)}
            >
              تحديث
            </Button>

            <Button
              variant="outlined"
              size={isCompact ? "small" : "medium"}
              startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
              sx={uiLayout.withUiSx({
                flex: isCompact ? "1 1 calc(50% - 6px)" : undefined,
                minWidth: 0,
                minHeight: isPhone ? 31 : isTablet ? 34 : undefined,
                fontFamily: "Cairo",
                fontWeight: 800,
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined
              }, uiLayout.buttonSx)}
            >
              تصدير
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            minHeight: isPhone
              ? "calc(100dvh - 165px)"
              : isTablet
                ? "calc(100dvh - 180px)"
                : "calc(100vh - 145px)",
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 4,
            border:
              "1px solid rgba(5,117,70,.14)",
            overflow: "hidden",
            direction: "rtl"
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
                minHeight: isPhone ? 38 : isTablet ? 44 : 58,
                minWidth: 0,
                px: isPhone ? 0.25 : isTablet ? 0.5 : 1,
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined,
                lineHeight: 1.25
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
            sx={uiLayout.withUiSx({
              width: "100%",
              minHeight: isPhone
                ? 360
                : isTablet
                  ? 430
                  : 520,
              overflow: "hidden"
            }, uiLayout.tableContainerSx)}
          >
            <DataGrid
              key={gridKey}
              autoHeight
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={
                isPhone
                  ? 31
                  : isTablet
                    ? 38
                    : 42
              }
              columnHeaderHeight={
                isPhone
                  ? 30
                  : isTablet
                    ? 36
                    : 40
              }
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
                toolbar: isPhone
                  ? undefined
                  : GridToolbar
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: {
                    debounceMs: 350
                  }
                }
              }}
              sx={uiLayout.withUiSx({
                border: 0,
                direction: "rtl",
                width: "100%",

                "& .MuiDataGrid-main": {
                  overflow: "hidden"
                },

                "& .MuiDataGrid-toolbarContainer": {
                  display: isPhone ? "none" : "flex",
                  p: isTablet ? 0.4 : 1,
                  gap: isTablet ? 0.4 : 1
                },

                "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  fontSize: isTablet
                    ? "0.75rem"
                    : undefined,
                  minWidth: isTablet ? 0 : undefined,
                  px: isTablet ? 0.45 : undefined
                },

                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "auto",
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
                  px: isPhone ? 0.08 : isTablet ? 0.3 : 0.7
                },

                "& .MuiDataGrid-columnSeparator": {
                  display: isCompact ? "none" : undefined
                },

                "& .MuiDataGrid-columnHeaderDraggableContainer": {
                  width: "100%"
                },

                "& .MuiDataGrid-columnHeaderTitle": {
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : "0.78rem",
                  whiteSpace: "normal",
                  lineHeight: 1.25,
                  textAlign: "center"
                },

                "& .MuiDataGrid-cell": {
                  fontFamily: "Cairo",
                  fontWeight: 700,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : "0.78rem",
                  px: isPhone ? 0.08 : isTablet ? 0.3 : 0.7,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },

                "& .MuiDataGrid-row:nth-of-type(odd)": {
                  backgroundColor:
                    "rgba(255,170,95,.12)"
                },

                "& .MuiDataGrid-footerContainer": {
                  minHeight: isPhone ? 31 : isTablet ? 36 : 54,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },

                "& .MuiDataGrid-scrollbar--horizontal, & .MuiDataGrid-scrollbar--vertical": {
                  display: "block"
                },

                "& .MuiDataGrid-filler": {
                  display: "none"
                }
              }, uiLayout.dataGridSx)}
            />
          </Box>
        </Paper>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              direction: "rtl",
              minWidth: isPhone ? 138 : isTablet ? 165 : 210,

              "& .MuiMenuItem-root": {
                minHeight: isPhone ? 28 : isTablet ? 32 : 42,
                fontFamily: "Cairo",
                fontSize: isPhone
                  ? "0.42rem"
                  : isTablet
                    ? "0.5rem"
                    : undefined
              },

              "& .MuiSvgIcon-root": {
                fontSize: isPhone ? 15 : isTablet ? 17 : undefined
              }
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
              minWidth: isPhone ? 250 : isTablet ? 340 : 390,
              maxWidth: isPhone ? "86vw" : undefined,
              px: isPhone ? 1.2 : isTablet ? 2 : 4,
              py: isPhone ? 1.2 : isTablet ? 2 : 3.5,
              borderRadius: isPhone ? 2 : isTablet ? 3 : 4,
              textAlign: "center",
              direction: "rtl"
            }}
          >
            <CircularProgress
              size={isPhone ? 34 : isTablet ? 44 : 56}
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
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.84rem"
                    : "1.08rem",
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
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : ".78rem",
                color: "#8a9690"
              }}
            >
              لا تغلق الصفحة حتى انتهاء العملية
            </Typography>
          </Paper>
        </Backdrop>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default NewStudentsPage;