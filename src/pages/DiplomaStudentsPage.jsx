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
  Checkbox,
  CircularProgress,
  GlobalStyles,
  FormControlLabel,
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
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

import SchoolIcon from "@mui/icons-material/School";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CloseIcon from "@mui/icons-material/Close";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Sidebar from "../components/Sidebar";
import StudentStatementDialog2
  from "../components/StudentStatementDialog2";
import EditStudentDialog
  from "../components/EditStudentDialog";
import RegisterDocumentDialog
  from "../components/RegisterDocumentDialog";

const SIDEBAR_WIDTH = 280;
const DESKTOP_BREAKPOINT = 1600;
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const ATTACHMENTS_BASE_URL =
  "https://sstli.com/arc-api/images_view.php";

const ZERO_GUID =
  "00000000-0000-0000-0000-000000000000";

const SECTION_TEMPLATE_URL =
  `${process.env.PUBLIC_URL || ""}/templates/section-distribution-template.xlsx`;

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
    const key = Object.keys(row || {}).find(
      (item) =>
        item.toLowerCase() ===
        String(name).toLowerCase()
    );

    if (!key) continue;

    const value = unwrap(row[key]);

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

const toGuid = (value) => {
  const text = String(unwrap(value) ?? "").trim();

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
    const error = new Error(
      result?.details
        ? `${result?.message || "حدث خطأ"}: ${result.details}`
        : result?.message || text || `HTTP ${response.status}`
    );

    error.validationErrors =
      Array.isArray(result?.errors)
        ? result.errors
        : [];

    throw error;
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

const normalizeRow = (item, index) => ({
  ...item,
  id: `${String(
    pick(item, ["Guid", "StudentLevelGuid"], index + 1)
  )}-${index}`,
  acadmyId: pick(item, ["AcadmyId", "StudentCode"]),
  studentName: pick(item, ["StudentName"]),
  studentNameEn: pick(item, ["StudentNameEn"]),
  nationalId: pick(item, ["NationalId"]),
  studentTel: pick(item, ["StudentTel"]),
  typeName: pick(item, ["TYPENAME", "TypeName"]),
  batchName: pick(item, ["BatchName"]),
  diplomName: pick(item, ["DiplomName"]),
  statusName: pick(item, ["StautName", "StatusName"]),
  levelName: pick(item, ["LevelName"]),
  levelGuid: toGuid(pick(item, ["LevelGuid"])),
  sectionGuid: toGuid(pick(item, ["SectionGuid"])),
  sectionCode: Number(pick(item, ["SectionCode"], 0)),
  sectionName: pick(item, ["SectionName"], "غير موزع"),
  email: pick(item, ["Email"]),
  levelNotes: pick(item, ["LevelNotes"]),
  typeStudent: pick(item, ["TYPESTUDENT"]),
  studentLevelGuid: toGuid(
    pick(item, ["Guid", "StudentLevelGuid"])
  ),
  accountGuid: toGuid(
    pick(item, ["AccountGuid"])
  ),
  studentGuid: toGuid(
    pick(item, ["studentguid", "StudentGuid", "AccountGuid"])
  ),
  code: pick(item, ["Code", "StudentCode"]),
  regType: Number(pick(item, ["RegType"], 0)),
  birthDate: pick(item, ["BirthDate"]),
  studentNational: pick(item, ["StudentNational"]),
  studentType: pick(item, ["StudentType"]),

  registrationBranchGuid: toGuid(
    pick(item, [
      "RegistrationBranchGuid",
      "RegBranchGuid"
    ])
  ),

  studyBranchGuid: toGuid(
    pick(item, [
      "BranchGuid",
      "StudyBranchGuid"
    ])
  ),

  diplomaGuid: toGuid(
    pick(item, [
      "DiplomGuid",
      "DiplomaGuid"
    ])
  ),

  batchGuid: toGuid(
    pick(item, ["BatchGuid"])
  ),

  registrationBranchName: pick(
    item,
    [
      "RegistrationBranchName",
      "RegBranchName"
    ]
  ),

  studyBranchName: pick(
    item,
    [
      "BranchName",
      "StudyBranchName"
    ]
  ),

  sortDate: pick(
    item,
    ["CreatedAt", "RegDate", "DocDate", "DateStart", "BatchDate"]
  )
});

const splitFullName = (value) => {
  const parts = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  return [
    parts[0] || "",
    parts[1] || "",
    parts[2] || "",
    parts.slice(3).join(" ")
  ];
};

const exactEnglishNames = {
  "محمد": "mohamed",
  "احمد": "ahmed",
  "أحمد": "ahmed",
  "محمود": "mahmoud",
  "مصطفى": "mustafa",
  "علي": "ali",
  "حسن": "hassan",
  "حسين": "hussein",
  "خالد": "khaled",
  "عبدالله": "abdullah",
  "عبدالرحمن": "abdulrahman",
  "عبدالعزيز": "abdulaziz",
  "ابراهيم": "ibrahim",
  "إبراهيم": "ibrahim",
  "يوسف": "yousef",
  "عمر": "omar",
  "سليمان": "sulaiman",
  "صالح": "saleh",
  "سالم": "salem",
  "سلمان": "salman",
  "ناصر": "nasser",
  "فهد": "fahad",
  "فيصل": "faisal",
  "تركي": "turki",
  "سعود": "saud",
  "بندر": "bandar",
  "ماجد": "majed",
  "راشد": "rashed",
  "سعيد": "saeed",
  "سعد": "saad",
  "زياد": "ziyad",
  "هاني": "hani",
  "رامي": "rami",
  "سامي": "sami",
  "طارق": "tariq",
  "طلال": "talal",
  "بدر": "badr",
  "مشعل": "meshal",
  "منصور": "mansour",
  "مبارك": "mubarak",
  "عادل": "adel",
  "حمد": "hamad",
  "راكان": "rakan",
  "ريان": "rayan",
  "فواز": "fawaz",
  "نواف": "nawaf",
  "جابر": "jaber",
  "مالك": "malik",
  "انس": "anas",
  "أنس": "anas",
  "ايمن": "ayman",
  "أيمن": "ayman",
  "امل": "amal",
  "أمل": "amal",
  "ايمان": "eman",
  "إيمان": "eman",
  "منى": "mona",
  "سارة": "sarah",
  "فاطمة": "fatima",
  "عائشة": "aisha",
  "خديجة": "khadija",
  "نورة": "noura",
  "هند": "hind",
  "ريم": "reem",
  "غادة": "ghada",
  "هدى": "huda",
  "مريم": "mariam",
  "ليلى": "layla",
  "عبير": "abeer"
};

const arabicPartToEnglish = (rawValue) => {
  const value = String(rawValue || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[ـٱآأإ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");

  if (!value) return "";
  if (exactEnglishNames[value]) return exactEnglishNames[value];

  if (value.startsWith("عبدال") && value.length > 4) {
    return `abdul${arabicPartToEnglish(value.slice(4))}`;
  }

  const map = {
    ا: "a", ب: "b", ت: "t", ث: "th", ج: "j",
    ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r",
    ز: "z", س: "s", ش: "sh", ص: "s", ض: "d",
    ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
    ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
    ه: "h", ة: "h", و: "w", ي: "y", ى: "y"
  };

  return [...value]
    .map((character) => map[character] || "")
    .join("")
    .toLowerCase()
    .replace(/[aeiouy]{3,}/g, (match) => match.slice(0, 2));
};

const formatBirthDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime()))
    return "";

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const genderText = (row) => {
  const visible = String(row.typeStudent || "").trim();
  if (visible) return visible;

  const value = String(row.studentType ?? "").trim();
  if (value === "0") return "ذكر";
  if (value === "1") return "انثى";
  return value;
};

const nationalityText = (value) => {
  const text = String(value ?? "").trim();
  if (text === "0") return "مواطن";
  if (text === "1") return "أجنبي";
  return text;
};

const isContinuingStudent = (row) =>
  String(row?.statusName || "")
    .trim()
    .replace(/\s+/g, " ") === "مستمر";

const shortStudentName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const DiplomaStudentsPage = () => {
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

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userGuid = String(
    user?.guid || user?.Guid || ""
  ).trim();

  const [branches, setBranches] = useState([]);
  const [levels, setLevels] = useState([]);
  const [branchGuid, setBranchGuid] = useState("");
  const [newLevelGuid, setNewLevelGuid] = useState("");
  const [filterLevelGuid, setFilterLevelGuid] = useState("");
  const [filterDiplomaGuid, setFilterDiplomaGuid] = useState("");
  const [filterBatchGuid, setFilterBatchGuid] = useState("");
  const [filterSectionGuid, setFilterSectionGuid] = useState("all");
  const [distributionStatus, setDistributionStatus] = useState("all");

  // الفلاتر العالمية — Multi Select
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterLevelGuids, setFilterLevelGuids] = useState([]);
  const [filterDiplomaGuids, setFilterDiplomaGuids] = useState([]);
  const [filterBatchGuids, setFilterBatchGuids] = useState([]);
  const [filterSectionGuids, setFilterSectionGuids] = useState([]);
  const [filterStudyStatuses, setFilterStudyStatuses] = useState([]);
  const [filterGenders, setFilterGenders] = useState([]);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [targetSectionGuid, setTargetSectionGuid] = useState("");
  const [rows, setRows] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workingText, setWorkingText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementStudent, setStatementStudent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesRow, setNotesRow] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [transferPasswordOpen, setTransferPasswordOpen] =
    useState(false);
  const [transferPasswordInput, setTransferPasswordInput] =
    useState("");
  const [pendingTransferRow, setPendingTransferRow] =
    useState(null);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRow, setTransferRow] = useState(null);

  const [transferLookups, setTransferLookups] =
    useState({
      branches: [],
      diplomas: [],
      batches: []
    });

  const [transferForm, setTransferForm] =
    useState({
      updateStudyBranch: false,
      newStudyBranchGuid: "",
      updateDiploma: false,
      newDiplomaGuid: "",
      updateBatch: false,
      newBatchGuid: "",
      password: "",
      reason: ""
    });

  const [
    registerDocumentOpen,
    setRegisterDocumentOpen
  ] = useState(false);

  const [
    registerDocumentRow,
    setRegisterDocumentRow
  ] = useState(null);

  const requestIdRef = useRef(0);
  const sectionExcelInputRef = useRef(null);

  const loadLookups = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userGuid });

      const [branchResponse, levelResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/diploma-students/branches?${params}`,
            { cache: "no-store" }
          ),
          fetch(
            `${API_BASE_URL}/api/diploma-students/levels?${params}`,
            { cache: "no-store" }
          )
        ]);

      const [branchResult, levelResult] =
        await Promise.all([
          readJson(branchResponse),
          readJson(levelResponse)
        ]);

      const allowedBranches =
        Array.isArray(branchResult?.data)
          ? branchResult.data
          : [];

      setBranches(allowedBranches);
      setLevels(
        Array.isArray(levelResult?.data)
          ? levelResult.data
          : []
      );

      setBranchGuid((current) =>
        allowedBranches.some(
          (item) =>
            String(item.guid) === String(current)
        )
          ? current
          : String(allowedBranches[0]?.guid || "")
      );
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تحميل الفروع والمستويات"
      );
    }
  }, [userGuid]);

  const loadStudents = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!branchGuid) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);
      setSelectionModel([]);

      const params = new URLSearchParams({
        userGuid,
        branchGuid,
        _: String(Date.now())
      });

      const response = await fetch(
        `${API_BASE_URL}/api/diploma-students?${params}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
            Pragma: "no-cache"
          }
        }
      );

      const result = await readJson(response);

      if (requestId !== requestIdRef.current)
        return;

      const items = Array.isArray(result?.data)
        ? result.data
        : [];

      setRows(
        items.map((item, index) =>
          normalizeRow(item, index)
        )
      );
    } catch (error) {
      if (requestId !== requestIdRef.current)
        return;

      setRows([]);
      await showError(
        error?.message ||
        "تعذر تحميل قائمة طلاب الدبلومات"
      );
    } finally {
      if (requestId === requestIdRef.current)
        setLoading(false);
    }
  }, [userGuid, branchGuid]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedRows = useMemo(() => {
    const ids = new Set(
      selectionModel.map(String)
    );

    return rows.filter((row) =>
      ids.has(String(row.id))
    );
  }, [rows, selectionModel]);

  const allDiplomaOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (
        row.diplomaGuid !== ZERO_GUID &&
        row.diplomName
      ) {
        map.set(
          row.diplomaGuid,
          row.diplomName
        );
      }
    });

    return [...map.entries()]
      .map(([guid, name]) => ({
        guid,
        name
      }))
      .sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name),
          "ar"
        )
      );
  }, [rows]);

  const allBatchOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (
        row.batchGuid !== ZERO_GUID &&
        row.batchName
      ) {
        map.set(
          row.batchGuid,
          row.batchName
        );
      }
    });

    return [...map.entries()]
      .map(([guid, name]) => ({
        guid,
        name
      }))
      .sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name),
          "ar"
        )
      );
  }, [rows]);

  const allSectionOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (
        row.sectionGuid !== ZERO_GUID &&
        row.sectionName
      ) {
        map.set(
          row.sectionGuid,
          row.sectionName
        );
      }
    });

    return [...map.entries()]
      .map(([guid, name]) => ({
        guid,
        name
      }))
      .sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name),
          "ar"
        )
      );
  }, [rows]);

  const studyStatusOptions = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) =>
            String(row.statusName || "").trim()
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, "ar")
    );
  }, [rows]);

  const genderOptions = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) =>
            String(
              genderText(row) || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, "ar")
    );
  }, [rows]);

  // ما زلنا نحتاج Options مرتبطة بالمستوى/الدبلوم
  // في أدوات إدارة الشعب، وليس في الفلترة العالمية.
  const diplomaOptions = useMemo(() => {
    const map = new Map();

    rows
      .filter(
        (row) =>
          !filterLevelGuid ||
          row.levelGuid === filterLevelGuid
      )
      .forEach((row) => {
        if (
          row.diplomaGuid !== ZERO_GUID &&
          row.diplomName
        ) {
          map.set(
            row.diplomaGuid,
            row.diplomName
          );
        }
      });

    return [...map.entries()].map(
      ([guid, name]) => ({
        guid,
        name
      })
    );
  }, [rows, filterLevelGuid]);

  const batchOptions = useMemo(() => {
    const map = new Map();

    rows
      .filter(
        (row) =>
          (!filterLevelGuid ||
            row.levelGuid ===
              filterLevelGuid) &&
          (!filterDiplomaGuid ||
            row.diplomaGuid ===
              filterDiplomaGuid)
      )
      .forEach((row) => {
        if (
          row.batchGuid !== ZERO_GUID &&
          row.batchName
        ) {
          map.set(
            row.batchGuid,
            row.batchName
          );
        }
      });

    return [...map.entries()].map(
      ([guid, name]) => ({
        guid,
        name
      })
    );
  }, [
    rows,
    filterLevelGuid,
    filterDiplomaGuid
  ]);

  // لو المستخدم اختار قيمة واحدة فقط من المستوى والدبلوم
  // نخلي أدوات تقسيم الشعب تشتغل عليها تلقائيًا.
  useEffect(() => {
    const singleLevel =
      filterLevelGuids.length === 1
        ? filterLevelGuids[0]
        : "";

    const singleDiploma =
      filterDiplomaGuids.length === 1
        ? filterDiplomaGuids[0]
        : "";

    setFilterLevelGuid(singleLevel);
    setFilterDiplomaGuid(
      singleLevel ? singleDiploma : ""
    );
    setFilterBatchGuid("");
    setFilterSectionGuid("all");
    setTargetSectionGuid("");
  }, [
    filterLevelGuids,
    filterDiplomaGuids
  ]);

  const filteredRows = useMemo(() => {
    const query = String(globalSearch || "")
      .trim()
      .toLowerCase();

    return rows.filter((row) => {
      if (
        filterLevelGuids.length > 0 &&
        !filterLevelGuids.includes(
          row.levelGuid
        )
      ) {
        return false;
      }

      if (
        filterDiplomaGuids.length > 0 &&
        !filterDiplomaGuids.includes(
          row.diplomaGuid
        )
      ) {
        return false;
      }

      if (
        filterBatchGuids.length > 0 &&
        !filterBatchGuids.includes(
          row.batchGuid
        )
      ) {
        return false;
      }

      if (
        filterSectionGuids.length > 0
      ) {
        const wantsUnassigned =
          filterSectionGuids.includes(
            "unassigned"
          );

        const selectedRealSections =
          filterSectionGuids.filter(
            (value) =>
              value !== "unassigned"
          );

        const matchesSection =
          selectedRealSections.includes(
            row.sectionGuid
          );

        const matchesUnassigned =
          wantsUnassigned &&
          row.sectionGuid === ZERO_GUID;

        if (
          !matchesSection &&
          !matchesUnassigned
        ) {
          return false;
        }
      }

      if (
        distributionStatus ===
          "assigned" &&
        row.sectionGuid === ZERO_GUID
      ) {
        return false;
      }

      if (
        distributionStatus ===
          "unassigned" &&
        row.sectionGuid !== ZERO_GUID
      ) {
        return false;
      }

      if (
        filterStudyStatuses.length > 0 &&
        !filterStudyStatuses.includes(
          String(
            row.statusName || ""
          ).trim()
        )
      ) {
        return false;
      }

      if (
        filterGenders.length > 0 &&
        !filterGenders.includes(
          String(
            genderText(row) || ""
          ).trim()
        )
      ) {
        return false;
      }

      if (query) {
        const haystack = [
          row.acadmyId,
          row.code,
          row.studentName,
          row.studentNameEn,
          row.nationalId,
          row.studentTel,
          row.email,
          row.diplomName,
          row.batchName,
          row.statusName,
          row.levelName,
          row.sectionName,
          row.levelNotes,
          row.typeName,
          row.registrationBranchName,
          row.studyBranchName,
          genderText(row)
        ]
          .map((value) =>
            String(value ?? "")
              .toLowerCase()
          )
          .join(" ");

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    rows,
    globalSearch,
    filterLevelGuids,
    filterDiplomaGuids,
    filterBatchGuids,
    filterSectionGuids,
    filterStudyStatuses,
    filterGenders,
    distributionStatus
  ]);

  const clearAdvancedFilters = () => {
    setGlobalSearch("");
    setFilterLevelGuids([]);
    setFilterDiplomaGuids([]);
    setFilterBatchGuids([]);
    setFilterSectionGuids([]);
    setFilterStudyStatuses([]);
    setFilterGenders([]);
    setDistributionStatus("all");
    setTargetSectionGuid("");
    setSelectionModel([]);
  };

  const loadSections = useCallback(async () => {
    if (!branchGuid || !filterLevelGuid) {
      setSections([]);
      setTargetSectionGuid("");
      return;
    }

    try {
      const params = new URLSearchParams({
        userGuid,
        branchGuid,
        levelGuid: filterLevelGuid
      });

      if (filterDiplomaGuid) params.set("diplomGuid", filterDiplomaGuid);

      const response = await fetch(
        `${API_BASE_URL}/api/diploma-students/sections?${params}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      const data = Array.isArray(result?.data) ? result.data : [];
      const normalized = data.map((item) => ({
        guid: toGuid(pick(item, ["Guid", "guid"])),
        sectionCode: Number(pick(item, ["SectionCode", "sectionCode"], 0)),
        sectionName: pick(item, ["SectionName", "sectionName"]),
        studentCount: Number(pick(item, ["StudentCount", "studentCount"], 0))
      }));
      setSections(normalized);
      setTargetSectionGuid((current) =>
        normalized.some((item) => item.guid === current) ? current : ""
      );
    } catch (error) {
      setSections([]);
      setTargetSectionGuid("");
      await showError(error?.message || "تعذر تحميل الشعب");
    }
  }, [userGuid, branchGuid, filterLevelGuid, filterDiplomaGuid]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  useEffect(() => {
    setSelectionModel([]);
  }, [
    filterLevelGuids,
    filterDiplomaGuids,
    filterBatchGuids,
    filterSectionGuids,
    filterStudyStatuses,
    filterGenders,
    distributionStatus,
    globalSearch
  ]);

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const postJson = async (path, body, progressText) => {
    try {
      setWorkingText(progressText);

      const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const result = await readJson(response);

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text: result?.message || "تم تنفيذ العملية",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadStudents();
      return true;
    } catch (error) {
      await showError(
        error?.message || "تعذر تنفيذ العملية"
      );
      return false;
    } finally {
      setWorkingText("");
    }
  };

  const moveOne = async (row) => {
    if (!newLevelGuid) {
      await showError(
        "برجاء اختيار المستوى الجديد أولًا"
      );
      return;
    }

    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد ترحيل الطالب",
      text: `هل تريد ترحيل ${row.studentName} إلى المستوى المحدد؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، ترحيل",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });

    if (!confirmed.isConfirmed) return;

    await postJson(
      "/api/diploma-students/move-level",
      {
        userGuid,
        studentLevelGuid:
          row.studentLevelGuid,
        newLevelGuid
      },
      `جاري ترحيل الطالب ${row.studentName}`
    );
  };

  const moveSelected = async () => {
    if (!newLevelGuid) {
      await showError(
        "برجاء اختيار المستوى المراد ترحيل الطلاب إليه"
      );
      return;
    }

    if (selectedRows.length === 0) {
      await showError(
        "حدد طالبًا واحدًا على الأقل"
      );
      return;
    }

    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد الترحيل الجماعي",
      text: `سيتم ترحيل ${selectedRows.length} طالب، هل تريد المتابعة؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، ترحيل",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });

    if (!confirmed.isConfirmed) return;

    await postJson(
      "/api/diploma-students/move-level-bulk",
      {
        userGuid,
        studentLevelGuids:
          selectedRows.map(
            (row) => row.studentLevelGuid
          ),
        newLevelGuid
      },
      `جاري ترحيل ${selectedRows.length} طالب`
    );
  };


  const normalizeExcelHeader = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[ـ]/g, "")
      .toLowerCase();

  const downloadSectionExcelTemplate = async () => {
    try {
      setWorkingText("جاري تحميل نموذج توزيع الشعب");

      const response = await fetch(
        SECTION_TEMPLATE_URL,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `تعذر تحميل نموذج Excel - HTTP ${response.status}`
        );
      }

      const blob = await response.blob();

      downloadBlob(
        blob,
        "نموذج توزيع الشعب.xlsx"
      );
    } catch (error) {
      await showError(
        error?.message ||
          "تعذر تحميل نموذج توزيع الشعب"
      );
    } finally {
      setWorkingText("");
    }
  };

  const readSectionExcelFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellText: true,
      cellDates: false
    });

    const firstSheetName = workbook.SheetNames?.[0];

    if (!firstSheetName) {
      throw new Error("ملف Excel لا يحتوي على أي Sheet");
    }

    const worksheet = workbook.Sheets[firstSheetName];

    const rawRows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: "",
        raw: false
      }
    );

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      throw new Error("ملف Excel فارغ");
    }

    const headerMap = new Map();

    Object.keys(rawRows[0] || {}).forEach((key) => {
      headerMap.set(
        normalizeExcelHeader(key),
        key
      );
    });

    const getHeader = (aliases) => {
      for (const alias of aliases) {
        const found = headerMap.get(
          normalizeExcelHeader(alias)
        );

        if (found) return found;
      }

      return "";
    };

    const nationalIdHeader = getHeader([
      "رقم الهوية",
      "الهوية",
      "nationalid",
      "national id"
    ]);

    const levelHeader = getHeader([
      "المستوى",
      "اسم المستوى",
      "level",
      "levelname"
    ]);

    const diplomaHeader = getHeader([
      "الدبلوم",
      "اسم الدبلوم",
      "التخصص",
      "diploma",
      "diplomname"
    ]);

    const sectionHeader = getHeader([
      "الشعبة",
      "رقم الشعبة",
      "section",
      "sectioncode"
    ]);

    if (
      !nationalIdHeader ||
      !levelHeader ||
      !diplomaHeader ||
      !sectionHeader
    ) {
      throw new Error(
        "أعمدة الملف يجب أن تكون: رقم الهوية، المستوى، الدبلوم، الشعبة"
      );
    }

    const parsedRows = rawRows
      .map((row, index) => {
        const rawSection =
          String(row[sectionHeader] ?? "").trim();

        const sectionMatch =
          rawSection.match(/\d+/);

        return {
          rowNumber: index + 2,
          nationalId:
            String(row[nationalIdHeader] ?? "")
              .trim()
              .replace(/\.0$/, ""),
          levelNumber: (() => {
            const rawLevel =
              String(row[levelHeader] ?? "").trim();

            const levelMatch =
              rawLevel.match(/\d+/);

            return levelMatch
              ? Number(levelMatch[0])
              : 0;
          })(),
          diplomName:
            String(row[diplomaHeader] ?? "").trim(),
          sectionCode:
            sectionMatch
              ? Number(sectionMatch[0])
              : 0
        };
      })
      .filter((row) =>
        row.nationalId ||
        row.levelNumber ||
        row.diplomName ||
        row.sectionCode
      );

    if (parsedRows.length === 0) {
      throw new Error("لا توجد صفوف بيانات داخل ملف Excel");
    }

    const invalidRows = parsedRows.filter(
      (row) =>
        !row.nationalId ||
        row.levelNumber < 1 ||
        row.levelNumber > 8 ||
        !row.diplomName ||
        row.sectionCode < 1 ||
        row.sectionCode > 8
    );

    if (invalidRows.length > 0) {
      throw new Error(
        `يوجد ${invalidRows.length} صف غير صحيح. المستوى يجب أن يكون من 1 إلى 8 والشعبة من 1 إلى 8. أول صف به مشكلة: ${invalidRows[0].rowNumber}`
      );
    }

    return parsedRows;
  };

  const handleSectionExcelUpload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!branchGuid) {
      await showError("اختر الفرع أولًا");
      return;
    }

    try {
      setWorkingText("جاري قراءة ملف توزيع الشعب");

      const excelRows =
        await readSectionExcelFile(file);

      setWorkingText("");

      const uniqueSections = [
        ...new Set(
          excelRows.map(
            (row) =>
              `${row.diplomName} | المستوى ${row.levelNumber} | الشعبة ${row.sectionCode}`
          )
        )
      ];

      const previewLines = uniqueSections
        .slice(0, 20)
        .map(
          (value) => `<div>${value}</div>`
        )
        .join("");

      const confirmed = await Swal.fire({
        icon: "question",
        title: "تأكيد رفع توزيع الشعب",
        html: `
          <div style="direction:rtl;text-align:right;font-family:Cairo">
            <div style="margin-bottom:8px">
              عدد الصفوف في الملف:
              <b>${excelRows.length}</b>
            </div>

            <div style="
              padding:10px 12px;
              border:1px solid #dfe8e3;
              border-radius:10px;
              background:#f7faf8;
              max-height:260px;
              overflow:auto;
              line-height:1.9
            ">
              ${previewLines}
              ${
                uniqueSections.length > 20
                  ? `<div>... وباقي ${uniqueSections.length - 20} توزيع</div>`
                  : ""
              }
            </div>

            <div style="
              margin-top:10px;
              padding:8px 10px;
              border-radius:8px;
              background:#fff4e5;
              color:#8a4b08
            ">
              المستوى في الملف يكون رقمًا فقط من 1 إلى 8.
              سيتم التوزيع فقط للطلاب حالتهم مستمر.
              إذا كانت الشعبة غير موجودة سيتم إنشاؤها تلقائيًا
              لنفس الفرع + الدبلوم + المستوى.
            </div>

            <div style="
              margin-top:8px;
              color:#ae1e21;
              font-weight:700
            ">
              إذا وجد صف غير صحيح لن يتم حفظ أي توزيع من الملف.
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "نعم، تنفيذ التوزيع",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546"
      });

      if (!confirmed.isConfirmed) return;

      setWorkingText(
        `جاري توزيع ${excelRows.length} طالب من ملف Excel`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        120000
      );

      let response;

      try {
        response = await fetch(
          `${API_BASE_URL}/api/diploma-students/sections/import-excel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userGuid,
              branchGuid,
              rows: excelRows
            }),
            signal: controller.signal
          }
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          throw new Error(
            "انتهت مهلة توزيع ملف Excel. لم يستجب السيرفر خلال دقيقتين."
          );
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      const result = await readJson(response);

      // الـ API خلص والحفظ تم بالفعل؛ اقفل شاشة "جاري التوزيع" فورًا.
      // كان سبب التعليق الظاهري إن workingText كان يفضل موجود
      // أثناء إعادة تحميل الطلاب والشعب بعد رسالة النجاح.
      setWorkingText("");

      const distribution =
        Array.isArray(result?.data?.distribution)
          ? result.data.distribution
          : [];

      await Swal.fire({
        icon: "success",
        title: "تم توزيع الشعب من Excel",
        html: `
          <div style="direction:rtl;text-align:right;font-family:Cairo">
            <div style="margin-bottom:8px">
              ${result?.message || "تم تنفيذ التوزيع بنجاح"}
            </div>

            ${
              Number(result?.data?.createdSections || 0) > 0
                ? `
                  <div style="
                    margin-bottom:8px;
                    padding:8px 10px;
                    border-radius:8px;
                    background:#eaf6ef;
                    color:#057546;
                    font-weight:700
                  ">
                    تم إنشاء ${result.data.createdSections}
                    شعبة جديدة تلقائيًا.
                  </div>
                `
                : ""
            }

            ${
              distribution.length
                ? `
                  <div style="
                    padding:10px 12px;
                    border:1px solid #dfe8e3;
                    border-radius:10px;
                    background:#f7faf8;
                    max-height:260px;
                    overflow:auto;
                    line-height:1.9
                  ">
                    ${distribution
                      .map(
                        (item) =>
                          `<div>${item.diplomName} - ${item.levelName} - ${item.sectionName}: ${item.studentCount} طالب</div>`
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      setSelectionModel([]);
      setFilterSectionGuid("all");
      setDistributionStatus("all");

      // تحديث القائمة والشعب معًا بدل الانتظار واحدًا وراء الآخر.
      await Promise.all([
        loadStudents(),
        loadSections()
      ]);
    } catch (error) {
      setWorkingText("");

      const details =
        Array.isArray(error?.validationErrors)
          ? error.validationErrors
          : [];

      if (details.length > 0) {
        await Swal.fire({
          icon: "error",
          title: "أخطاء ملف Excel",
          html: `
            <div style="direction:rtl;text-align:right;font-family:Cairo">
              <div style="margin-bottom:10px;font-weight:700">
                ${error?.message || "تعذر تنفيذ التوزيع"}
              </div>
              <div style="
                max-height:320px;
                overflow:auto;
                padding:10px 12px;
                border:1px solid #f1c7c7;
                border-radius:10px;
                background:#fff8f8;
                line-height:1.9
              ">
                ${details
                  .slice(0, 100)
                  .map((item) => `<div>• ${String(item)}</div>`)
                  .join("")}
              </div>
            </div>
          `,
          confirmButtonText: "حسنًا",
          confirmButtonColor: "#ae1e21",
          width: 760
        });
      } else {
        await showError(
          error?.message ||
            "تعذر قراءة أو توزيع ملف Excel"
        );
      }
    } finally {
      // حماية إضافية: ممنوع شاشة التحميل تفضل مفتوحة لأي سبب.
      setWorkingText("");
    }
  };

  const createSection = async () => {
    if (!filterLevelGuid || !filterDiplomaGuid) {
      await showError("اختر المستوى والدبلوم أولًا");
      return;
    }

   const inputOptions = Object.fromEntries(
  Array.from({ length: 20 }, (_, index) => {
    const sectionNumber = index + 1;
    return [String(sectionNumber), `الشعبة ${sectionNumber}`];
  })
);

    const result = await Swal.fire({
      title: "إنشاء شعبة جديدة",
      input: "select",
      inputLabel: "رقم الشعبة",
      inputOptions,
      inputPlaceholder: "اختر رقم الشعبة",
      showCancelButton: true,
      confirmButtonText: "إنشاء",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546",
      inputValidator: (value) =>
  !value ? "اختر رقم الشعبة من 1 إلى 20" : undefined
    });

    if (!result.isConfirmed) return;

    const sectionCode = Number(result.value);

    const success = await postJson(
      "/api/diploma-students/sections",
      {
        userGuid,
        branchGuid,
        levelGuid: filterLevelGuid,
        diplomGuid: filterDiplomaGuid,
        sectionCode
      },
      `جاري إنشاء الشعبة ${sectionCode}`
    );

    if (success) await loadSections();
  };

  const assignSelectedToSection = async () => {
    if (!targetSectionGuid) {
      await showError("اختر الشعبة المستهدفة أولًا");
      return;
    }

    if (selectedRows.length === 0) {
      await showError("حدد طالبًا واحدًا على الأقل");
      return;
    }

    const nonContinuingStudents = selectedRows.filter(
      (row) => !isContinuingStudent(row)
    );

    if (nonContinuingStudents.length > 0) {
      await showError(
        `لا يمكن توزيع ${nonContinuingStudents.length} طالب لأن حالتهم ليست مستمر`
      );
      return;
    }

    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد توزيع الطلاب",
      text: `سيتم توزيع ${selectedRows.length} طالب على الشعبة المحددة`,
      showCancelButton: true,
      confirmButtonText: "نعم، توزيع",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });
    if (!confirmed.isConfirmed) return;

    const success = await postJson(
      "/api/diploma-students/sections/assign",
      {
        userGuid,
        sectionGuid: targetSectionGuid,
        studentLevelGuids: selectedRows.map((row) => row.studentLevelGuid)
      },
      `جاري توزيع ${selectedRows.length} طالب`
    );

    if (success) await loadSections();
  };

  const distributeAllRandomly = async () => {
    if (!filterLevelGuid || !filterDiplomaGuid) {
      await showError("اختر المستوى والدبلوم أولًا");
      return;
    }

    const matchingStudents = rows.filter(
      (row) =>
        row.levelGuid === filterLevelGuid &&
        row.diplomaGuid === filterDiplomaGuid &&
        isContinuingStudent(row)
    );

    const excludedStudentsCount = rows.filter(
      (row) =>
        row.levelGuid === filterLevelGuid &&
        row.diplomaGuid === filterDiplomaGuid &&
        !isContinuingStudent(row)
    ).length;

    if (matchingStudents.length === 0) {
      await showError(
        "لا يوجد طلاب حالتهم مستمر مطابقون للمستوى والدبلوم المحددين"
      );
      return;
    }

    let studentsPerSection = null;
    let previewSections = [...sections].sort(
      (first, second) =>
        first.sectionCode - second.sectionCode
    );

    if (previewSections.length === 0) {
      const capacityResult = await Swal.fire({
        icon: "info",
        title: "إنشاء الشعب تلقائيًا",
        html: `
          <div style="direction:rtl;text-align:right;font-family:Cairo">
            لا توجد شعب منشأة لهذا الفرع والدبلوم والمستوى.
            <br />
            أدخل العدد الأقصى المطلوب من الطلاب داخل كل شعبة،
            وسيتم حساب عدد الشعب وإنشاؤها تلقائيًا.
          </div>
        `,
        input: "number",
        inputLabel: "عدد الطلاب في كل شعبة",
        inputPlaceholder: "مثال: 25",
        inputAttributes: {
          min: "1",
          max: String(matchingStudents.length),
          step: "1"
        },
        showCancelButton: true,
        confirmButtonText: "حساب التوزيع",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        inputValidator: (value) => {
          const count = Number(value);

          if (!Number.isInteger(count) || count < 1) {
            return "اكتب عددًا صحيحًا أكبر من صفر";
          }

          const requiredSections = Math.ceil(
            matchingStudents.length / count
          );

          if (requiredSections > 9) {
            return `هذا العدد يحتاج ${requiredSections} شعبة، والحد الأقصى 9 شعب. زوّد عدد الطلاب في الشعبة.`;
          }

          return undefined;
        }
      });

      if (!capacityResult.isConfirmed) return;

      studentsPerSection = Number(capacityResult.value);

      const requiredSections = Math.ceil(
        matchingStudents.length / studentsPerSection
      );

      previewSections = Array.from(
        { length: requiredSections },
        (_, index) => ({
          guid: "",
          sectionCode: index + 1,
          sectionName: `الشعبة ${index + 1}`,
          studentCount: 0,
          willBeCreated: true
        })
      );
    }

    const baseCount = Math.floor(
      matchingStudents.length / previewSections.length
    );

    const remainder =
      matchingStudents.length % previewSections.length;

    const distributionLines = previewSections.map(
      (section, index) =>
        `${section.sectionName}: ${
          baseCount + (index < remainder ? 1 : 0)
        } طالب${
          section.willBeCreated ? " — سيتم إنشاؤها تلقائيًا" : ""
        }`
    );

    const confirmation = await Swal.fire({
      icon: "question",
      title: "تأكيد التوزيع الجماعي العشوائي",
      html: `
        <div style="direction:rtl;text-align:right;font-family:Cairo">
          <div style="margin-bottom:8px">
            سيتم توزيع
            <b>${matchingStudents.length}</b>
            طالب حالتهم <b>مستمر</b> عشوائيًا وبالتساوي على
            <b>${previewSections.length}</b>
            شعبة.
          </div>

          ${
            sections.length === 0
              ? `
                <div style="
                  margin-bottom:8px;
                  padding:8px 10px;
                  border-radius:8px;
                  background:#eaf6ef;
                  color:#057546;
                  font-weight:700
                ">
                  لا توجد شعب حاليًا؛ سيتم إنشاء ${previewSections.length}
                  شعبة تلقائيًا بحد أقصى ${studentsPerSection}
                  طالب في الشعبة.
                </div>
              `
              : ""
          }

          ${
            excludedStudentsCount > 0
              ? `
                <div style="
                  margin-bottom:8px;
                  padding:8px 10px;
                  border-radius:8px;
                  background:#fff4e5;
                  color:#8a4b08
                ">
                  لن يتم توزيع ${excludedStudentsCount}
                  طالب لأن حالتهم ليست مستمر.
                </div>
              `
              : ""
          }

          <div style="
            padding:10px 12px;
            border:1px solid #dfe8e3;
            border-radius:10px;
            background:#f7faf8;
            line-height:2
          ">
            ${distributionLines
              .map((line) => `<div>${line}</div>`)
              .join("")}
          </div>

          <div style="margin-top:10px;color:#ae1e21;font-weight:700">
            سيتم استبدال أي توزيع سابق للطلاب المطابقين.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "نعم، تنفيذ التوزيع",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });

    if (!confirmation.isConfirmed) return;

    try {
      setWorkingText(
        `جاري توزيع ${matchingStudents.length} طالب عشوائيًا`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/diploma-students/sections/distribute-random`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            branchGuid,
            levelGuid: filterLevelGuid,
            diplomGuid: filterDiplomaGuid,
            studentsPerSection
          })
        }
      );

      const result = await readJson(response);

      const resultDistribution = Array.isArray(
        result?.data?.distribution
      )
        ? result.data.distribution
        : [];

      await Swal.fire({
        icon: "success",
        title: "تم التوزيع بنجاح",
        html: `
          <div style="direction:rtl;text-align:right;font-family:Cairo">
            <div style="margin-bottom:8px">
              ${result?.message || "تم توزيع الطلاب بالتساوي"}
            </div>

            ${
              Number(result?.data?.createdSections || 0) > 0
                ? `
                  <div style="
                    margin-bottom:8px;
                    padding:8px 10px;
                    border-radius:8px;
                    background:#eaf6ef;
                    color:#057546;
                    font-weight:700
                  ">
                    تم إنشاء ${result.data.createdSections}
                    شعبة تلقائيًا.
                  </div>
                `
                : ""
            }

            ${
              resultDistribution.length
                ? `
                  <div style="
                    padding:10px 12px;
                    border:1px solid #dfe8e3;
                    border-radius:10px;
                    background:#f7faf8;
                    line-height:2
                  ">
                    ${resultDistribution
                      .map(
                        (item) =>
                          `<div>${item.sectionName}: ${item.studentCount} طالب</div>`
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadStudents();
      await loadSections();
      setSelectionModel([]);
      setFilterSectionGuid("all");
      setDistributionStatus("all");
    } catch (error) {
      await showError(
        error?.message || "تعذر تنفيذ التوزيع الجماعي"
      );
    } finally {
      setWorkingText("");
    }
  };

  const removeSelectedFromSection = async () => {
    if (selectedRows.length === 0) {
      await showError("حدد طالبًا واحدًا على الأقل");
      return;
    }

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "إزالة الطلاب من الشعب",
      text: `سيتم جعل ${selectedRows.length} طالب غير موزعين`,
      showCancelButton: true,
      confirmButtonText: "نعم، إزالة",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#ae1e21"
    });
    if (!confirmed.isConfirmed) return;

    const success = await postJson(
      "/api/diploma-students/sections/remove",
      {
        userGuid,
        studentLevelGuids: selectedRows.map((row) => row.studentLevelGuid)
      },
      `جاري إزالة ${selectedRows.length} طالب من الشعب`
    );

    if (success) await loadSections();
  };

  const saveNotes = async () => {
    if (!notesRow || !notesText.trim()) {
      await showError(
        "برجاء إدخال الملاحظة المراد إضافتها"
      );
      return;
    }

    const success = await postJson(
      "/api/diploma-students/notes",
      {
        userGuid,
        studentLevelGuid:
          notesRow.studentLevelGuid,
        levelNotes: notesText.trim()
      },
      `جاري حفظ ملاحظة الطالب ${notesRow.studentName}`
    );

    if (success) {
      setNotesOpen(false);
      setNotesRow(null);
      setNotesText("");
    }
  };

  const loadTransferLookups = async () => {
    try {
      setWorkingText(
        "جاري تحميل بيانات نقل الطالب"
      );

      const params =
        new URLSearchParams({
          userGuid,
          _: String(Date.now())
        });

      const response = await fetch(
        `${API_BASE_URL}/api/diploma-students/transfer-lookups?${params}`,
        {
          cache: "no-store"
        }
      );

      const result = await readJson(response);

      setTransferLookups({
        branches:
          Array.isArray(
            result?.data?.branches)
            ? result.data.branches
            : [],
        diplomas:
          Array.isArray(
            result?.data?.diplomas)
            ? result.data.diplomas
            : [],
        batches:
          Array.isArray(
            result?.data?.batches)
            ? result.data.batches
            : []
      });

      return true;
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تحميل بيانات النقل"
      );
      return false;
    } finally {
      setWorkingText("");
    }
  };

  const openTransferPasswordStep = (row) => {
    setPendingTransferRow(row);
    setTransferPasswordInput("");
    setTransferPasswordOpen(true);
  };

  const confirmTransferPassword = async () => {
    if (!transferPasswordInput) {
      await showError(
        "برجاء إدخال كلمة مرور النقل"
      );
      return;
    }

    if (transferPasswordInput !== "1054") {
      await showError(
        "كلمة مرور النقل غير صحيحة"
      );
      return;
    }

    const loaded =
      await loadTransferLookups();

    if (!loaded) return;

    setTransferRow(pendingTransferRow);

    setTransferForm({
      updateStudyBranch: false,
      newStudyBranchGuid: "",
      updateDiploma: false,
      newDiplomaGuid: "",
      updateBatch: false,
      newBatchGuid: "",
      password: transferPasswordInput,
      reason: ""
    });

    setTransferPasswordOpen(false);
    setPendingTransferRow(null);
    setTransferOpen(true);
  };

  const transferStudent = async () => {
    if (!transferRow) {
      await showError(
        "بيانات الطالب غير موجودة"
      );
      return;
    }

    const hasAnyUpdate =
      transferForm.updateStudyBranch ||
      transferForm.updateDiploma ||
      transferForm.updateBatch;

    if (!hasAnyUpdate) {
      await showError(
        "حدد فرع الدراسة أو الدبلوم أو الدفعة"
      );
      return;
    }


    if (
      transferForm.updateStudyBranch &&
      !transferForm.newStudyBranchGuid
    ) {
      await showError(
        "برجاء اختيار فرع الدراسة الجديد"
      );
      return;
    }

    if (
      transferForm.updateDiploma &&
      !transferForm.newDiplomaGuid
    ) {
      await showError(
        "برجاء اختيار الدبلوم الجديد"
      );
      return;
    }

    if (
      transferForm.updateBatch &&
      !transferForm.newBatchGuid
    ) {
      await showError(
        "برجاء اختيار الدفعة الجديدة"
      );
      return;
    }

    if (!transferForm.password) {
      await showError(
        "برجاء إدخال كلمة مرور النقل"
      );
      return;
    }

    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد نقل الطالب",
      text:
        `هل تريد تنفيذ نقل الطالب ${transferRow.studentName}؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، تنفيذ النقل",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546"
    });

    if (!confirmed.isConfirmed)
      return;

    const success = await postJson(
      "/api/diploma-students/transfer",
      {
        userGuid,

        accountGuid:
          transferRow.accountGuid,

        studentLevelGuid:
          transferRow.studentLevelGuid,

        oldRegistrationBranchGuid:
          transferRow.registrationBranchGuid,

        newRegistrationBranchGuid:
          ZERO_GUID,

        updateRegistrationBranch:
          false,

        oldStudyBranchGuid:
          transferRow.studyBranchGuid !== ZERO_GUID
            ? transferRow.studyBranchGuid
            : toGuid(branchGuid),

        newStudyBranchGuid:
          toGuid(
            transferForm.newStudyBranchGuid),

        updateStudyBranch:
          transferForm.updateStudyBranch,

        oldDiplomaGuid:
          transferRow.diplomaGuid,

        newDiplomaGuid:
          toGuid(
            transferForm.newDiplomaGuid),

        updateDiploma:
          transferForm.updateDiploma,

        oldBatchGuid:
          transferRow.batchGuid,

        newBatchGuid:
          toGuid(
            transferForm.newBatchGuid),

        updateBatch:
          transferForm.updateBatch,

        password:
          transferForm.password,

        reason:
          transferForm.reason
      },
      `جاري نقل الطالب ${transferRow.studentName}`
    );

    if (success) {
      const destinationBranchGuid =
        transferForm.updateStudyBranch
          ? transferForm.newStudyBranchGuid
          : branchGuid;

      setTransferOpen(false);
      setTransferRow(null);

      if (
        destinationBranchGuid &&
        destinationBranchGuid !== branchGuid
      ) {
        setBranchGuid(destinationBranchGuid);
      } else {
        await loadStudents();
      }
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

  const openStatement = (row) => {
    setStatementStudent({
      accountGuid: row.accountGuid,
      nationalId: row.nationalId,
      studentName: row.studentName,
      studyType: row.regType
    });
    setStatementOpen(true);
  };

  const openAttachments = (row) => {
    if (!row.nationalId) {
      showError("رقم الهوية غير موجود");
      return;
    }

    window.open(
      `${ATTACHMENTS_BASE_URL}?identity=${encodeURIComponent(row.nationalId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const exportAllXlsx = () => {
    if (filteredRows.length === 0) {
      showError("لا توجد بيانات مطابقة للفلاتر الحالية للتصدير");
      return;
    }

    const data = filteredRows.map((row) => ({
      "كود": row.acadmyId,
      "اسم الطالب": row.studentName,
      "الاسم بالإنجليزية": row.studentNameEn,
      "رقم الهوية": row.nationalId,
      "رقم الجوال": row.studentTel,
      "البرنامج": row.typeName,
      "الدفعة/اليوم": row.batchName,
      "الدبلوم/الدورة": row.diplomName,
      "حالة الدراسة": row.statusName,
      "المستوى": row.levelName,
      "الإيميل": row.email,
      "ملاحظات": row.levelNotes,
      "النوع": row.typeStudent
    }));

    const sheet = XLSX.utils.json_to_sheet(data);
    sheet["!cols"] = Object.keys(data[0]).map(
      () => ({ wch: 22 })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "طلاب الدبلومات"
    );

    XLSX.writeFile(
      workbook,
      `قائمة طلاب الدبلومات - حسب الفلاتر ${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const exportInstitution = () => {
    if (rows.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }

    const sortedRows = [...rows].sort((a, b) => {
      const aDate = new Date(a.sortDate || 0).getTime() || 0;
      const bDate = new Date(b.sortDate || 0).getTime() || 0;

      if (aDate !== bDate)
        return bDate - aDate;

      return Number(b.acadmyId || 0) -
             Number(a.acadmyId || 0);
    });

    const headers = [
      "رقم الهوية",
      "الاسم الاول",
      "الاسم الثاني",
      "الاسم الثالث",
      "الاسم الاخير",
      "تاريخ الميلاد (m/d/Y)",
      "النوع ( ذكر / انثى)",
      "الجنسية",
      "المؤهل",
      "البريد الالكتروني",
      "رقم الجوال",
      "الاسم الاول باللغة الإنجليزية",
      "الاسم الثاني باللغة الإنجليزية",
      "الاسم الثالث باللغة الإنجليزية",
      "الاسم الاخير باللغة الإنجليزية"
    ];

    const records = sortedRows.map((row) => {
      const [
        firstName,
        secondName,
        thirdName,
        lastName
      ] = splitFullName(row.studentName);

      return [
        row.nationalId,
        firstName,
        secondName,
        thirdName,
        lastName,
        formatBirthDate(row.birthDate),
        genderText(row),
        nationalityText(row.studentNational),
        "ثانوي",
        row.email,
        row.studentTel,
        arabicPartToEnglish(firstName),
        arabicPartToEnglish(secondName),
        arabicPartToEnglish(thirdName),
        arabicPartToEnglish(lastName)
      ];
    });

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const html = `
<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8" />
<xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Students</x:Name>
<x:WorksheetOptions>
<x:DisplayRightToLeft />
</x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml>
</head>
<body dir="rtl">
<table border="1" dir="rtl"
 style="direction:rtl;font-family:Calibri;font-size:12pt;border-collapse:collapse">
<tr>
${headers.map((header) =>
  `<th style="background:#D9EAF7;font-weight:bold;text-align:center">${escapeHtml(header)}</th>`
).join("")}
</tr>
${records.map((record) => `
<tr>
${record.map((value) =>
  `<td style="mso-number-format:'\\@';text-align:center">${escapeHtml(value)}</td>`
).join("")}
</tr>`).join("")}
</table>
</body>
</html>`;

    downloadBlob(
      new Blob(
        ["\uFEFF", html],
        {
          type:
            "application/vnd.ms-excel;charset=utf-8"
        }
      ),
      `ملف المؤسسة - قائمة طلاب الدبلومات ${new Date()
        .toISOString()
        .replaceAll(":", "")
        .slice(0, 15)}.xls`
    );
  };

  const columns = useMemo(() => {
    const actionColumn = {
      field: "actions",
      headerName: isCompact ? "" : "الإجراءات",
      width: isPhone ? 30 : isTablet ? 40 : 56,
      minWidth: isPhone ? 30 : isTablet ? 40 : 56,
      maxWidth: isPhone ? 30 : isTablet ? 40 : 56,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            setMenuRow(params.row);
          }}
          sx={{
            width: isPhone ? 22 : isTablet ? 27 : 32,
            height: isPhone ? 22 : isTablet ? 27 : 32,
            p: 0,
            color: "#057546",
            backgroundColor: isCompact ? "#eef8f3" : undefined
          }}
        >
          <MoreVertIcon sx={{ fontSize: isPhone ? 14 : isTablet ? 16 : 18 }} />
        </IconButton>
      )
    };

    if (isPhone) {
      return [
        {
          ...actionColumn,
          width: 26,
          minWidth: 26,
          maxWidth: 26
        },
        {
          field: "studentName",
          headerName: "الطالب",
          width: 70,
          minWidth: 70,
          maxWidth: 70,
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          width: 58,
          minWidth: 58,
          maxWidth: 58
        },
        {
          field: "diplomName",
          headerName: "الدبلوم",
          width: 88,
          minWidth: 88,
          maxWidth: 88
        },
        {
          field: "sectionName",
          headerName: "الشعبة",
          width: 48,
          minWidth: 48,
          maxWidth: 48,
          renderCell: (params) =>
            params.row.sectionName ||
            "غير موزع"
        }
      ];
    }

    if (isTablet) {
      return [
        actionColumn,
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1,
          minWidth: 100,
          renderCell: (params) => shortStudentName(params.row.studentName)
        },
        { field: "nationalId", headerName: "الهوية", flex: .8, minWidth: 84 },
        { field: "studentTel", headerName: "الجوال", flex: .8, minWidth: 84 },
        { field: "diplomName", headerName: "الدبلوم/الدورة", flex: 1.05, minWidth: 112 },
        { field: "batchName", headerName: "الدفعة", flex: .8, minWidth: 86 },
        { field: "statusName", headerName: "الحالة", flex: .72, minWidth: 76 },
        { field: "levelName", headerName: "المستوى", flex: .7, minWidth: 74 },
        {
          field: "sectionName",
          headerName: "الشعبة",
          flex: .76,
          minWidth: 82,
          renderCell: (params) => params.row.sectionName || "غير موزع"
        }
      ];
    }

    return [
      actionColumn,
      { field: "acadmyId", headerName: "كود", minWidth: 78, flex: .55 },
      { field: "studentName", headerName: "اسم الطالب", minWidth: 190, flex: 1.5 },
      { field: "nationalId", headerName: "رقم الهوية", minWidth: 105, flex: .8 },
      { field: "studentTel", headerName: "رقم الجوال", minWidth: 105, flex: .8 },
      { field: "batchName", headerName: "الدفعة/اليوم", minWidth: 105, flex: .85 },
      { field: "diplomName", headerName: "الدبلوم/الدورة", minWidth: 170, flex: 1.35 },
      { field: "statusName", headerName: "حالة الدراسة", minWidth: 95, flex: .75 },
      { field: "levelName", headerName: "المستوى", minWidth: 85, flex: .65 },
      {
        field: "sectionName",
        headerName: "الشعبة",
        minWidth: 110,
        flex: .75,
        renderCell: (params) => params.row.sectionName || "غير موزع"
      },
      { field: "email", headerName: "الإيميل", minWidth: 155, flex: 1.1 },
      { field: "levelNotes", headerName: "ملاحظات", minWidth: 140, flex: 1 },
      { field: "typeStudent", headerName: "النوع", minWidth: 70, flex: .5 }
    ];
  }, [isPhone, isTablet, isCompact]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        direction: "ltr",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)"
      }}
    >
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".swal2-popup": {
              width: isPhone ? "88vw !important" : isTablet ? "540px !important" : undefined,
              padding: isPhone ? "0.75rem !important" : isTablet ? "1rem !important" : undefined
            },
            ".swal2-title": {
              fontFamily: "Cairo !important",
              fontSize: isPhone ? "0.82rem !important" : isTablet ? "1rem !important" : undefined
            },
            ".swal2-html-container, .swal2-input-label, .swal2-input, .swal2-select": {
              fontFamily: "Cairo !important",
              fontSize: isPhone ? "0.56rem !important" : isTablet ? "0.68rem !important" : undefined
            },
            ".swal2-confirm, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone ? "0.5rem !important" : isTablet ? "0.6rem !important" : undefined
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0, left: 0, right: 0, width: "100%",
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: "#17372b",
            borderBottom: "1px solid rgba(5,117,70,.12)",
            direction: "ltr"
          }}
        >
          <Toolbar
            sx={{
              direction: "ltr",
              minHeight: { xs: "50px !important", sm: "56px !important" },
              px: { xs: .75, sm: 1 },
              gap: .8
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background: "linear-gradient(135deg,#057546,#034d31)",
                boxShadow: "0 5px 14px rgba(5,117,70,.20)"
              }}
            >
        





      <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: { xs: ".67rem", sm: ".79rem" },
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              قائمة طلاب الدبلومات
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <Box
        component="main"
        sx={{
          ml: 0,
          mt: { xs: "50px", sm: "56px" },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          px: { xs: .45, sm: .65, md: .8 },
          py: { xs: .45, sm: .65, md: .8 },
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            ml: `${SIDEBAR_WIDTH}px`,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
            mt: 0,
            p: 1.5
          }
        }}
      >
        {isDesktop ? (
          <>
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? .7 : isTablet ? .9 : 1.4,
            mb: isPhone ? .55 : isTablet ? .75 : 1,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Stack
            direction="row"
            spacing={isPhone ? .55 : isTablet ? .7 : 1}
            alignItems="center"
            sx={{
              flexWrap: isCompact ? "wrap" : "nowrap",
              rowGap: isPhone ? .65 : isTablet ? .8 : 0
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                flex: 1,
                ...(isCompact && { flexBasis: "100%", width: "100%" })
              }}
            >
              <SchoolIcon
                sx={{
                  color: "#057546",
                  fontSize: isPhone ? 20 : isTablet ? 24 : 35
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone ? ".68rem" : isTablet ? ".84rem" : "1.18rem"
                  }}
                >
                  قائمة طلاب الدبلومات
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: isPhone ? ".38rem" : isTablet ? ".48rem" : ".74rem",
                    display: isPhone ? "none" : "block",
                    color: "#718078"
                  }}
                >
                  عرض البيانات والترحيل والنقل والتصدير
                </Typography>
              </Box>
            </Stack>

            <TextField
              select
              size="small"
              label="الفرع"
              value={branchGuid}
              disabled={branches.length <= 1}
              onChange={(event) =>
                setBranchGuid(event.target.value)
              }
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: isPhone ? 280 : isTablet ? 360 : 520,
                      "& .MuiMenuItem-root": {
                        minHeight: isPhone ? 30 : isTablet ? 34 : 42,
                        py: isPhone ? .35 : isTablet ? .45 : .7,
                        px: isPhone ? 1 : isTablet ? 1.2 : 1.5,
                        fontFamily: "Cairo",
                        fontSize: isPhone ? ".55rem" : isTablet ? ".65rem" : ".85rem",
                        whiteSpace: "normal",
                        lineHeight: 1.35
                      }
                    }
                  }
                }
              }}
              sx={{
                minWidth: 0,
                flex: isPhone ? "1 1 100%" : isTablet ? "1 1 58%" : "0 0 310px",
                "& .MuiInputBase-input": { fontSize: isPhone ? ".52rem" : isTablet ? ".62rem" : undefined },
                "& .MuiInputLabel-root": { fontSize: isPhone ? ".42rem" : isTablet ? ".5rem" : undefined }
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

            <TextField
              select
              size="small"
              label="المستوى الجديد"
              value={newLevelGuid}
              onChange={(event) =>
                setNewLevelGuid(event.target.value)
              }
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: isPhone ? 240 : 320,
                      "& .MuiMenuItem-root": {
                        minHeight: isPhone ? 30 : isTablet ? 34 : 42,
                        fontFamily: "Cairo",
                        fontSize: isPhone ? ".55rem" : isTablet ? ".65rem" : ".85rem"
                      }
                    }
                  }
                }
              }}
              sx={{
                minWidth: 0,
                flex: isPhone ? "1 1 58%" : isTablet ? "1 1 28%" : "0 0 190px",
                "& .MuiInputBase-input": { fontSize: isPhone ? ".52rem" : isTablet ? ".62rem" : undefined },
                "& .MuiInputLabel-root": { fontSize: isPhone ? ".42rem" : isTablet ? ".5rem" : undefined }
              }}
            >
              {levels.map((level) => (
                <MenuItem
                  key={level.guid}
                  value={level.guid}
                >
                  {level.levelName}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
              disabled={loading}
              size={isCompact ? "small" : "medium"}
              sx={{
                flex: isPhone ? "1 1 36%" : undefined,
                minWidth: 0,
                fontFamily: "Cairo",
                fontSize: isPhone ? ".5rem" : isTablet ? ".58rem" : undefined
              }}
            >
              تحديث
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={0.8}
            flexWrap="wrap"
            useFlexGap
            sx={{
              mt: isPhone ? .65 : isTablet ? .8 : 1,
              gap: isPhone ? .35 : isTablet ? .5 : .8,
              "& .MuiButton-root": {
                minHeight: isPhone ? 28 : isTablet ? 31 : undefined,
                px: isPhone ? .5 : isTablet ? .7 : undefined,
                fontFamily: "Cairo",
                fontSize: isPhone ? ".42rem" : isTablet ? ".5rem" : undefined
              },
              "& .MuiSvgIcon-root": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined }
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={() =>
                setSelectionModel(
                  filteredRows.map((row) => row.id)
                )
              }
            >
              تحديد الكل
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<DeselectIcon />}
              onClick={() =>
                setSelectionModel([])
              }
            >
              إلغاء التحديد
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<UpgradeIcon />}
              onClick={moveSelected}
              disabled={selectedRows.length === 0}
              sx={{ bgcolor: "#057546" }}
            >
              ترحيل المحدد ({selectedRows.length})
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportAllXlsx}
            >
              تصدير Excel
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<CorporateFareIcon />}
              onClick={exportInstitution}
            >
              ملف المؤسسة
            </Button>

            <Typography
              sx={{
                ml: "auto",
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#ae1e21",
                fontSize: isPhone ? ".44rem" : isTablet ? ".52rem" : undefined
              }}
            >
              عدد الطلاب: {filteredRows.length}
            </Typography>
          </Stack>
        </Paper>
          </>
        ) : (
          <>
        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.75 : isTablet ? 1 : 1.25,
            mb: isPhone ? 0.6 : isTablet ? 0.8 : 1,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isPhone
                ? "1fr"
                : isTablet
                  ? "minmax(0,1fr) minmax(190px,.8fr)"
                  : "minmax(260px,1fr) minmax(250px,340px) minmax(170px,210px) auto",
              gap: isPhone ? 0.7 : isTablet ? 0.85 : 1,
              alignItems: "center"
            }}
          >
            <Stack
              direction="row"
              spacing={0.7}
              alignItems="center"
              sx={{
                minWidth: 0
              }}
            >
              <SchoolIcon
                sx={{
                  color: "#057546",
                  fontSize: isPhone ? 20 : isTablet ? 24 : 34
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    fontSize: isPhone
                      ? "0.68rem"
                      : isTablet
                        ? "0.84rem"
                        : "1.08rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  قائمة طلاب الدبلومات
                </Typography>

                {!isPhone && (
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontSize: isTablet
                        ? "0.46rem"
                        : "0.68rem",
                      color: "#718078"
                    }}
                  >
                    عرض البيانات والترحيل والنقل والتصدير
                  </Typography>
                )}
              </Box>
            </Stack>

            <TextField
              select
              size="small"
              label="الفرع"
              value={branchGuid}
              disabled={branches.length <= 1}
              onChange={(event) =>
                setBranchGuid(
                  event.target.value
                )
              }
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: isPhone
                        ? 260
                        : isTablet
                          ? 340
                          : 440,
                      "& .MuiMenuItem-root": {
                        minHeight: isPhone
                          ? 29
                          : isTablet
                            ? 33
                            : 38,
                        py: isPhone
                          ? 0.3
                          : isTablet
                            ? 0.4
                            : 0.55,
                        px: isPhone
                          ? 0.8
                          : isTablet
                            ? 1
                            : 1.25,
                        fontFamily: "Cairo",
                        fontSize: isPhone
                          ? "0.5rem"
                          : isTablet
                            ? "0.6rem"
                            : "0.78rem",
                        whiteSpace: "normal",
                        lineHeight: 1.3
                      }
                    }
                  }
                }
              }}
              sx={{
                minWidth: 0,
                "& .MuiInputBase-input": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.5rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.78rem"
                },
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.4rem"
                    : isTablet
                      ? "0.48rem"
                      : "0.7rem"
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

            <TextField
              select
              size="small"
              label="المستوى الجديد"
              value={newLevelGuid}
              onChange={(event) =>
                setNewLevelGuid(
                  event.target.value
                )
              }
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: isPhone
                        ? 230
                        : 300,
                      "& .MuiMenuItem-root": {
                        minHeight: isPhone
                          ? 29
                          : isTablet
                            ? 33
                            : 38,
                        fontFamily: "Cairo",
                        fontSize: isPhone
                          ? "0.5rem"
                          : isTablet
                            ? "0.6rem"
                            : "0.78rem"
                      }
                    }
                  }
                }
              }}
              sx={{
                minWidth: 0
              }}
            >
              {levels.map((level) => (
                <MenuItem
                  key={level.guid}
                  value={level.guid}
                >
                  {level.levelName}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStudents}
              disabled={loading}
              size="small"
              sx={{
                minHeight: 34,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone
                  ? "0.48rem"
                  : isTablet
                    ? "0.56rem"
                    : "0.72rem"
              }}
            >
              تحديث
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isPhone
                ? "repeat(3,minmax(0,1fr))"
                : isTablet
                  ? "repeat(5,minmax(0,1fr))"
                  : "repeat(5,max-content) 1fr",
              gap: isPhone ? 0.35 : isTablet ? 0.5 : 0.65,
              mt: isPhone ? 0.65 : 0.8,
              alignItems: "center",

              "& .MuiButton-root": {
                minWidth: 0,
                minHeight: isPhone ? 28 : isTablet ? 31 : 32,
                px: isPhone ? 0.35 : isTablet ? 0.55 : 0.7,
                fontFamily: "Cairo",
                fontWeight: 850,
                fontSize: isPhone
                  ? "0.36rem"
                  : isTablet
                    ? "0.46rem"
                    : "0.68rem"
              },

              "& .MuiSvgIcon-root": {
                fontSize: isPhone ? 13 : isTablet ? 15 : 17
              }
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={() =>
                setSelectionModel(
                  filteredRows.map(
                    (row) => row.id
                  )
                )
              }
            >
              تحديد الكل
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<DeselectIcon />}
              onClick={() =>
                setSelectionModel([])
              }
            >
              إلغاء التحديد
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<UpgradeIcon />}
              onClick={moveSelected}
              disabled={
                selectedRows.length === 0
              }
              sx={{
                bgcolor: "#057546"
              }}
            >
              ترحيل ({selectedRows.length})
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportAllXlsx}
            >
              Excel
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<CorporateFareIcon />}
              onClick={exportInstitution}
            >
              ملف المؤسسة
            </Button>

            <Typography
              sx={{
                justifySelf: isPhone
                  ? "stretch"
                  : "end",
                gridColumn: isPhone
                  ? "1 / -1"
                  : undefined,
                fontFamily: "Cairo",
                fontWeight: 950,
                color: "#ae1e21",
                fontSize: isPhone
                  ? "0.43rem"
                  : isTablet
                    ? "0.52rem"
                    : "0.72rem",
                textAlign: isPhone
                  ? "center"
                  : "right"
              }}
            >
              عدد الطلاب: {filteredRows.length}
            </Typography>
          </Box>
        </Paper>
          </>
        )}

        <Paper
          elevation={0}
          sx={{
            p: isPhone ? 0.65 : isTablet ? 0.85 : 1,
            mb: isPhone ? 0.6 : isTablet ? 0.8 : 1,
            borderRadius: isPhone ? 1.4 : isTablet ? 1.8 : 3,
            border: "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={0.6}
            sx={{ mb: isPhone ? 0.55 : 0.75 }}
          >
            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 950,
                fontSize: isPhone
                  ? "0.56rem"
                  : isTablet
                    ? "0.66rem"
                    : "0.82rem"
              }}
            >
              فلاتر توزيع الشعب
            </Typography>

            <IconButton
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAdvancedFiltersOpen(true);
              }}
              sx={{
                width: isPhone ? 30 : isTablet ? 34 : 36,
                height: isPhone ? 30 : isTablet ? 34 : 36,
                border: "1px solid #9fcfb9",
                borderRadius: 1.2,
                color: "#057546",
                position: "relative",
                pointerEvents: "auto"
              }}
            >
              <FilterAltIcon
                sx={{
                  fontSize: isPhone ? 16 : isTablet ? 18 : 19
                }}
              />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isPhone
                ? "repeat(2,minmax(0,1fr))"
                : isTablet
                  ? "repeat(2,minmax(0,1fr))"
                  : "minmax(180px,220px) minmax(220px,280px) 1fr",
              gap: isPhone ? 0.45 : isTablet ? 0.6 : 0.7,
              alignItems: "center",

              "& .MuiInputLabel-root": {
                fontFamily: "Cairo",
                fontSize: isPhone
                  ? "0.38rem"
                  : isTablet
                    ? "0.46rem"
                    : "0.64rem"
              },

              "& .MuiInputBase-root": {
                minHeight: isPhone ? 31 : isTablet ? 34 : 36,
                fontFamily: "Cairo",
                fontSize: isPhone
                  ? "0.44rem"
                  : isTablet
                    ? "0.52rem"
                    : "0.7rem"
              }
            }}
          >
            <TextField
              select
              size="small"
              label="المستوى"
              value={filterLevelGuid}
              onChange={(event) => {
                setFilterLevelGuid(event.target.value);
                setFilterDiplomaGuid("");
                setFilterBatchGuid("");
                setFilterSectionGuid("all");
                setTargetSectionGuid("");
              }}
              fullWidth
            >
              <MenuItem value="">كل المستويات</MenuItem>

              {levels.map((level) => (
                <MenuItem
                  key={level.guid}
                  value={level.guid}
                >
                  {level.levelName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="الدبلوم"
              value={filterDiplomaGuid}
              disabled={!filterLevelGuid}
              onChange={(event) => {
                setFilterDiplomaGuid(event.target.value);
                setFilterBatchGuid("");
                setFilterSectionGuid("all");
                setTargetSectionGuid("");
              }}
              fullWidth
            >
              <MenuItem value="">كل الدبلومات</MenuItem>

              {diplomaOptions.map((item) => (
                <MenuItem
                  key={item.guid}
                  value={item.guid}
                >
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography
              sx={{
                display: isCompact ? "none" : "block",
                justifySelf: "end",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: "0.68rem",
                color: "#455a64"
              }}
            >
              الظاهر: {filteredRows.length} من {rows.length}
            </Typography>
          </Box>

          {filterLevelGuid && filterDiplomaGuid ? (
            <Box
              sx={{
                mt: isPhone ? 0.6 : 0.75,
                pt: isPhone ? 0.55 : 0.7,
                borderTop: "1px dashed rgba(5,117,70,.18)",
                display: "grid",
                gridTemplateColumns: isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : isTablet
                    ? "repeat(3,minmax(0,1fr))"
                    : "minmax(210px,1.2fr) repeat(6,max-content)",
                gap: isPhone ? 0.4 : isTablet ? 0.5 : 0.6,
                alignItems: "center",

                "& .MuiButton-root": {
                  minWidth: 0,
                  minHeight: isPhone ? 29 : isTablet ? 31 : 32,
                  px: isPhone ? 0.35 : isTablet ? 0.5 : 0.7,
                  fontFamily: "Cairo",
                  fontWeight: 850,
                  fontSize: isPhone
                    ? "0.35rem"
                    : isTablet
                      ? "0.44rem"
                      : "0.62rem"
                },

                "& .MuiSvgIcon-root": {
                  fontSize: isPhone ? 13 : isTablet ? 15 : 17
                }
              }}
            >
              <TextField
                select
                size="small"
                label="الشعبة المستهدفة"
                value={targetSectionGuid}
                onChange={(event) =>
                  setTargetSectionGuid(event.target.value)
                }
                sx={{
                  gridColumn: isPhone ? "1 / -1" : undefined,

                  "& .MuiInputLabel-root": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.38rem"
                      : isTablet
                        ? "0.46rem"
                        : "0.62rem"
                  },

                  "& .MuiInputBase-root": {
                    minHeight: isPhone ? 31 : isTablet ? 34 : 36,
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.44rem"
                      : isTablet
                        ? "0.52rem"
                        : "0.68rem"
                  }
                }}
              >
                {sections.map((section) => (
                  <MenuItem
                    key={section.guid}
                    value={section.guid}
                  >
                    {section.sectionName} ({section.studentCount})
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                onClick={assignSelectedToSection}
                disabled={
                  !targetSectionGuid ||
                  selectedRows.length === 0
                }
                sx={{
                  bgcolor: "#057546",
                  "&:hover": {
                    bgcolor: "#034d31"
                  }
                }}
              >
                إسناد ({selectedRows.length})
              </Button>

              <Button
                variant="outlined"
                onClick={createSection}
              >
                إنشاء شعبة
              </Button>

              <Button
                variant="contained"
                onClick={distributeAllRandomly}
                sx={{
                  bgcolor: "#7a4b00",
                  "&:hover": {
                    bgcolor: "#5f3a00"
                  }
                }}
              >
                توزيع عشوائي
              </Button>

              <input
                ref={sectionExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleSectionExcelUpload}
              />

              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={downloadSectionExcelTemplate}
              >
                نموذج Excel
              </Button>

              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={() =>
                  sectionExcelInputRef.current?.click()
                }
                disabled={!branchGuid}
                sx={{
                  bgcolor: "#1565c0",
                  "&:hover": {
                    bgcolor: "#0d47a1"
                  }
                }}
              >
                توزيع Excel
              </Button>

              <Button
                color="error"
                variant="outlined"
                onClick={removeSelectedFromSection}
                disabled={selectedRows.length === 0}
              >
                إزالة
              </Button>
            </Box>
          ) : (
            <Typography
              sx={{
                mt: 0.6,
                fontFamily: "Cairo",
                fontWeight: 800,
                fontSize: isPhone
                  ? "0.36rem"
                  : isTablet
                    ? "0.44rem"
                    : "0.62rem",
                color: "#7a5500"
              }}
            >
              اختر مستوى ودبلوم لإظهار أدوات إدارة الشعب.
            </Typography>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
            border:
              "1px solid rgba(5,117,70,.14)",
            overflow: "hidden",
            minHeight: isPhone ? 360 : isTablet ? 430 : "calc(100vh - 155px)"
          }}
        >
          <DataGrid
            autoHeight
            rows={filteredRows}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={
              setSelectionModel
            }
            rowHeight={isPhone ? 31 : isTablet ? 38 : 43}
            columnHeaderHeight={isPhone ? 30 : isTablet ? 36 : 48}
            pageSizeOptions={[15, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 15,
                  page: 0
                }
              }
            }}
            slots={{
              toolbar: isPhone ? undefined : GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: false
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

              "& .MuiDataGrid-scrollbar--horizontal, & .MuiDataGrid-scrollbar--vertical": {
                display: "none !important"
              },

              "& .MuiDataGrid-columnHeader": {
                px: isPhone ? .08 : isTablet ? .3 : .45
              },

              "& .MuiDataGrid-columnHeaderCheckbox, & .MuiDataGrid-cellCheckbox": {
                width: isPhone ? "28px !important" : isTablet ? "34px !important" : undefined,
                minWidth: isPhone ? "28px !important" : isTablet ? "34px !important" : undefined,
                maxWidth: isPhone ? "28px !important" : isTablet ? "34px !important" : undefined,
                px: "0 !important"
              },

              "& .MuiCheckbox-root": {
                p: isPhone ? "1px" : isTablet ? "2px" : undefined
              },

              "& .MuiCheckbox-root .MuiSvgIcon-root": {
                fontSize: isPhone ? 15 : isTablet ? 17 : undefined
              },

              "& .MuiDataGrid-columnSeparator": {
                display: isCompact ? "none" : undefined
              },

              "& .MuiDataGrid-toolbarContainer": {
                display: isPhone ? "none" : "flex",
                p: isTablet ? .4 : 1,
                gap: isTablet ? .4 : 1
              },

              "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                fontFamily: "Cairo",
                fontWeight: 800,
                fontSize: isTablet ? ".45rem" : undefined,
                minWidth: isTablet ? 0 : undefined,
                px: isTablet ? .45 : undefined
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone ? ".31rem" : isTablet ? ".42rem" : ".75rem",
                whiteSpace: "normal",
                lineHeight: 1.2,
                textAlign: "center"
              },

              "& .MuiDataGrid-cell": {
                fontFamily: "Cairo",
                fontWeight: 700,
                fontSize: isPhone ? ".31rem" : isTablet ? ".42rem" : ".75rem",
                px: isPhone ? .08 : isTablet ? .3 : .45,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              },

              "& .MuiDataGrid-row:nth-of-type(odd)": {
                backgroundColor:
                  "rgba(255,170,95,.18)"
              },

              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor:
                  "rgba(160,220,255,.10)"
              },

              "& .MuiDataGrid-footerContainer": {
                minHeight: isPhone ? 31 : isTablet ? 36 : 48
              }
            }}
          />
        </Paper>

    <Dialog
  open={advancedFiltersOpen}
  onClose={(event, reason) => {
    if (reason === "backdropClick") {
      setAdvancedFiltersOpen(false);
      return;
    }

    setAdvancedFiltersOpen(false);
  }}
  fullWidth
  maxWidth="xl"
  dir="rtl"
  disableRestoreFocus
  slotProps={{
    backdrop: {
      onMouseDown: (event) => {
        event.stopPropagation();
      }
    }
  }}
  PaperProps={{
    onMouseDown: (event) => {
      event.stopPropagation();
    },

    onClick: (event) => {
      event.stopPropagation();
    },

    sx: {
      width: isPhone
        ? "92vw"
        : isTablet
          ? "82vw"
          : "1450px",

      maxWidth: isPhone
        ? "92vw"
        : isTablet
          ? "760px"
          : "96vw",

      maxHeight: isPhone
        ? "78dvh"
        : isTablet
          ? "76dvh"
          : "92vh",

      m: 1,

      borderRadius: isPhone
        ? 2
        : 2.5,

      overflow: "hidden"
    }
  }}
>
  <DialogTitle
    sx={{
      px: isPhone
        ? 1
        : isTablet
          ? 1.5
          : 3,

      py: isPhone
        ? 0.75
        : isTablet
          ? 1
          : 1.8,

      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 0.6,

      fontFamily: "Cairo",
      fontWeight: 950,
      color: "#057546",

      fontSize: isPhone
        ? "0.72rem"
        : isTablet
          ? "0.84rem"
          : "1.25rem"
    }}
  >
    <span>الفلاتر المتقدمة</span>

    <IconButton
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setAdvancedFiltersOpen(false);
      }}
      sx={{
        width: isPhone
          ? 28
          : isTablet
            ? 32
            : 38,

        height: isPhone
          ? 28
          : isTablet
            ? 32
            : 38,

        color: "#ae1e21"
      }}
    >
      <CloseIcon
        sx={{
          fontSize: isPhone
            ? 17
            : isTablet
              ? 19
              : 23
        }}
      />
    </IconButton>
  </DialogTitle>

  <DialogContent
    dividers
    onMouseDown={(event) => {
      event.stopPropagation();
    }}
    onClick={(event) => {
      event.stopPropagation();
    }}
    sx={{
      p: isPhone
        ? 0.8
        : isTablet
          ? 1.1
          : 2.6,

      overflowY: "auto"
    }}
  >
    <Box
      sx={{
        display: "grid",

        gridTemplateColumns: isPhone
          ? "1fr"
          : isTablet
            ? "repeat(2,minmax(0,1fr))"
            : "repeat(3,minmax(0,1fr))",

        gap: isPhone
          ? 0.5
          : isTablet
            ? 0.65
            : 1.15,

        "& .MuiInputLabel-root": {
          fontFamily: "Cairo",

          fontSize: isPhone
            ? "0.4rem"
            : isTablet
              ? "0.48rem"
              : "0.85rem"
        },

        "& .MuiInputBase-root": {
          minHeight: isPhone
            ? 32
            : isTablet
              ? 35
              : 50,

          fontFamily: "Cairo",

          fontSize: isPhone
            ? "0.46rem"
            : isTablet
              ? "0.54rem"
              : "0.92rem"
        },

        "& .MuiSelect-select": {
          display: "flex",
          alignItems: "center"
        }
      }}
    >
      {/* ========================= */}
      {/* البحث العام */}
      {/* ========================= */}

      <TextField
        size="small"
        label="بحث عام"
        placeholder="الاسم، الهوية، الجوال، الدبلوم، الحالة..."
        value={globalSearch}
        onChange={(event) =>
          setGlobalSearch(
            event.target.value
          )
        }
        sx={{
          gridColumn: "1 / -1"
        }}
      />

      {/* ========================= */}
      {/* المستويات */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="المستويات"
        value={filterLevelGuids}
        onChange={(event) =>
          setFilterLevelGuids(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "كل المستويات"
              : selected.length === 1
                ? levels.find(
                    (item) =>
                      item.guid ===
                      selected[0]
                  )?.levelName ||
                  "1 محدد"
                : `${selected.length} مستويات`,

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  py: isPhone
                    ? 0.25
                    : isTablet
                      ? 0.4
                      : 0.75,

                  px: isPhone
                    ? 0.8
                    : isTablet
                      ? 1
                      : 1.5,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                },

                "& .MuiCheckbox-root": {
                  p: isPhone
                    ? 0.25
                    : isTablet
                      ? 0.4
                      : 0.55
                },

                "& .MuiCheckbox-root .MuiSvgIcon-root": {
                  fontSize: isPhone
                    ? 16
                    : isTablet
                      ? 18
                      : 22
                }
              }
            }
          }
        }}
      >
        {levels.map((level) => (
          <MenuItem
            key={level.guid}
            value={level.guid}
          >
            <Checkbox
              size="small"
              checked={filterLevelGuids.includes(
                level.guid
              )}
            />

            {level.levelName}
          </MenuItem>
        ))}
      </TextField>

      {/* ========================= */}
      {/* الدبلومات */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="الدبلومات"
        value={filterDiplomaGuids}
        onChange={(event) =>
          setFilterDiplomaGuids(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "كل الدبلومات"
              : selected.length === 1
                ? allDiplomaOptions.find(
                    (item) =>
                      item.guid ===
                      selected[0]
                  )?.name ||
                  "1 محدد"
                : `${selected.length} دبلومات`,

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  py: isPhone
                    ? 0.25
                    : isTablet
                      ? 0.4
                      : 0.75,

                  px: isPhone
                    ? 0.8
                    : isTablet
                      ? 1
                      : 1.5,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                },

                "& .MuiCheckbox-root": {
                  p: isPhone
                    ? 0.25
                    : isTablet
                      ? 0.4
                      : 0.55
                },

                "& .MuiCheckbox-root .MuiSvgIcon-root": {
                  fontSize: isPhone
                    ? 16
                    : isTablet
                      ? 18
                      : 22
                }
              }
            }
          }
        }}
      >
        {allDiplomaOptions.map(
          (item) => (
            <MenuItem
              key={item.guid}
              value={item.guid}
            >
              <Checkbox
                size="small"
                checked={filterDiplomaGuids.includes(
                  item.guid
                )}
              />

              {item.name}
            </MenuItem>
          )
        )}
      </TextField>

      {/* ========================= */}
      {/* الدفعات */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="الدفعات"
        value={filterBatchGuids}
        onChange={(event) =>
          setFilterBatchGuids(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "كل الدفعات"
              : selected.length === 1
                ? allBatchOptions.find(
                    (item) =>
                      item.guid ===
                      selected[0]
                  )?.name ||
                  "1 محدد"
                : `${selected.length} دفعات`,

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  py: isPhone
                    ? 0.25
                    : isTablet
                      ? 0.4
                      : 0.75,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                }
              }
            }
          }
        }}
      >
        {allBatchOptions.map(
          (item) => (
            <MenuItem
              key={item.guid}
              value={item.guid}
            >
              <Checkbox
                size="small"
                checked={filterBatchGuids.includes(
                  item.guid
                )}
              />

              {item.name}
            </MenuItem>
          )
        )}
      </TextField>

      {/* ========================= */}
      {/* الشعب */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="الشعب"
        value={filterSectionGuids}
        onChange={(event) =>
          setFilterSectionGuids(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "كل الشعب"
              : `${selected.length} محدد`,

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                }
              }
            }
          }
        }}
      >
        <MenuItem value="unassigned">
          <Checkbox
            size="small"
            checked={filterSectionGuids.includes(
              "unassigned"
            )}
          />

          غير موزعين
        </MenuItem>

        {allSectionOptions.map(
          (item) => (
            <MenuItem
              key={item.guid}
              value={item.guid}
            >
              <Checkbox
                size="small"
                checked={filterSectionGuids.includes(
                  item.guid
                )}
              />

              {item.name}
            </MenuItem>
          )
        )}
      </TextField>

      {/* ========================= */}
      {/* حالة الدراسة */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="حالة الدراسة"
        value={filterStudyStatuses}
        onChange={(event) =>
          setFilterStudyStatuses(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "كل الحالات"
              : selected.length === 1
                ? selected[0]
                : `${selected.length} حالات`,

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                }
              }
            }
          }
        }}
      >
        {studyStatusOptions.map(
          (value) => (
            <MenuItem
              key={value}
              value={value}
            >
              <Checkbox
                size="small"
                checked={filterStudyStatuses.includes(
                  value
                )}
              />

              {value}
            </MenuItem>
          )
        )}
      </TextField>

      {/* ========================= */}
      {/* النوع */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="النوع"
        value={filterGenders}
        onChange={(event) =>
          setFilterGenders(
            typeof event.target.value ===
              "string"
              ? event.target.value.split(",")
              : event.target.value
          )
        }
        SelectProps={{
          multiple: true,

          renderValue: (selected) =>
            selected.length === 0
              ? "الكل"
              : selected.join("، "),

          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: isPhone
                  ? 280
                  : isTablet
                    ? 360
                    : 520,

                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                }
              }
            }
          }
        }}
      >
        {genderOptions.map(
          (value) => (
            <MenuItem
              key={value}
              value={value}
            >
              <Checkbox
                size="small"
                checked={filterGenders.includes(
                  value
                )}
              />

              {value}
            </MenuItem>
          )
        )}
      </TextField>

      {/* ========================= */}
      {/* حالة التوزيع */}
      {/* ========================= */}

      <TextField
        select
        size="small"
        label="حالة التوزيع"
        value={distributionStatus}
        onChange={(event) =>
          setDistributionStatus(
            event.target.value
          )
        }
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                "& .MuiMenuItem-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 34
                      : 48,

                  fontFamily: "Cairo",

                  fontSize: isPhone
                    ? "0.48rem"
                    : isTablet
                      ? "0.6rem"
                      : "0.88rem"
                }
              }
            }
          }
        }}
      >
        <MenuItem value="all">
          الكل
        </MenuItem>

        <MenuItem value="assigned">
          تم توزيعهم
        </MenuItem>

        <MenuItem value="unassigned">
          غير موزعين
        </MenuItem>
      </TextField>
    </Box>
  </DialogContent>

  <DialogActions
    onMouseDown={(event) => {
      event.stopPropagation();
    }}
    onClick={(event) => {
      event.stopPropagation();
    }}
    sx={{
      px: isPhone
        ? 1
        : isTablet
          ? 1.5
          : 2.5,

      py: isPhone
        ? 0.7
        : isTablet
          ? 1
          : 1.5,

      gap: isPhone
        ? 0.6
        : 1
    }}
  >
    <Button
      variant="outlined"
      color="error"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        clearAdvancedFilters();
      }}
      sx={{
        minHeight: isDesktop
          ? 42
          : undefined,

        px: isDesktop
          ? 2.2
          : undefined,

        fontFamily: "Cairo",
        fontWeight: 900,

        fontSize: isPhone
          ? "0.46rem"
          : isTablet
            ? "0.62rem"
            : "0.82rem"
      }}
    >
      مسح الفلاتر
    </Button>

    <Button
      variant="contained"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setAdvancedFiltersOpen(false);
      }}
      sx={{
        minHeight: isDesktop
          ? 42
          : undefined,

        px: isDesktop
          ? 2.2
          : undefined,

        backgroundColor: "#057546",

        "&:hover": {
          backgroundColor: "#034d31"
        },

        fontFamily: "Cairo",
        fontWeight: 900,

        fontSize: isPhone
          ? "0.46rem"
          : isTablet
            ? "0.62rem"
            : "0.82rem"
      }}
    >
      تطبيق وإغلاق
    </Button>
  </DialogActions>
</Dialog>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              minWidth: isPhone ? 140 : isTablet ? 170 : 210,
              direction: "ltr",
              "& .MuiMenuItem-root": {
                minHeight: isPhone ? 28 : isTablet ? 32 : 42,
                fontFamily: "Cairo",
                fontSize: isPhone ? ".42rem" : isTablet ? ".5rem" : undefined
              },
              "& .MuiSvgIcon-root": { fontSize: isPhone ? 15 : isTablet ? 17 : undefined }
            }
          }}
        >
          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (!row) return;

              setEditStudent({
                studentCode: row.code,
                code: row.code,
                studentGuid: row.studentGuid,
                accountGuid: row.accountGuid,
                nationalId: row.nationalId
              });
              setEditOpen(true);
            }}
          >
            <EditIcon sx={{ ml: 1 }} />
            عرض البيانات
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
              if (row) moveOne(row);
            }}
          >
            <UpgradeIcon sx={{ ml: 1 }} />
            ترحيل
          </MenuItem>

          <MenuItem
            onClick={() => {
              closeMenu();
              moveSelected();
            }}
          >
            <SelectAllIcon sx={{ ml: 1 }} />
            ترحيل المحدد
          </MenuItem>

          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (!row) return;

              openTransferPasswordStep(row);
            }}
          >
            <DriveFileMoveIcon sx={{ ml: 1 }} />
            نقل
          </MenuItem>

          <MenuItem
            onClick={() => {
              const row = menuRow;
              closeMenu();
              if (!row) return;

              setNotesRow(row);
              setNotesText(row.levelNotes || "");
              setNotesOpen(true);
            }}
          >
            <NoteAddIcon sx={{ ml: 1 }} />
            إضافة ملاحظة
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

        <EditStudentDialog
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditStudent(null);
          }}
          student={editStudent}
          apiBaseUrl={API_BASE_URL}
          onSaved={loadStudents}
        />

        <Dialog
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          fullWidth
          maxWidth="sm"
          dir="rtl"
          fullScreen={isPhone}
          PaperProps={{
            sx: {
              borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
              maxHeight: isPhone ? "100dvh" : isTablet ? "90dvh" : undefined
            }
          }}
        >
          <DialogTitle>
            إضافة ملاحظة الطالب
          </DialogTitle>

          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={5}
              sx={{ mt: 1 }}
              label="الملاحظة"
              value={notesText}
              onChange={(event) =>
                setNotesText(event.target.value)
              }
            />
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setNotesOpen(false)}
              color="error"
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={saveNotes}
              sx={{ bgcolor: "#057546" }}
            >
              تأكيد
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={transferPasswordOpen}
          onClose={() => {
            setTransferPasswordOpen(false);
            setPendingTransferRow(null);
            setTransferPasswordInput("");
          }}
          fullWidth
          maxWidth="xs"
          dir="rtl"
          fullScreen={isPhone}
          PaperProps={{
            sx: {
              borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
              maxHeight: isPhone ? "100dvh" : isTablet ? "90dvh" : undefined
            }
          }}
        >
          <DialogTitle>
            التحقق من كلمة المرور
          </DialogTitle>

          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              type="password"
              size="small"
              label="كلمة المرور"
              value={transferPasswordInput}
              onChange={(event) =>
                setTransferPasswordInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  confirmTransferPassword();
                }
              }}
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => {
                setTransferPasswordOpen(false);
                setPendingTransferRow(null);
                setTransferPasswordInput("");
              }}
              color="error"
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={confirmTransferPassword}
              sx={{ bgcolor: "#057546" }}
            >
              تأكيد
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={transferOpen}
          onClose={() =>
            setTransferOpen(false)
          }
          fullWidth
          maxWidth="md"
          dir="rtl"
          fullScreen={isPhone}
          PaperProps={{
            sx: {
              borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
              maxHeight: isPhone ? "100dvh" : isTablet ? "90dvh" : undefined
            }
          }}
        >
          <DialogTitle>
            تحديد بيانات النقل
          </DialogTitle>

          <DialogContent>
            <Typography
              sx={{
                mb: 2,
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#057546"
              }}
            >
              {transferRow?.studentName || ""}
            </Typography>

            <Stack spacing={1.5}>              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        transferForm
                          .updateStudyBranch
                      }
                      onChange={(event) =>
                        setTransferForm(
                          (current) => ({
                            ...current,
                            updateStudyBranch:
                              event.target.checked,
                            newStudyBranchGuid:
                              event.target.checked
                                ? current
                                    .newStudyBranchGuid
                                : ""
                          })
                        )
                      }
                    />
                  }
                  label="تغيير فرع الدراسة"
                />

                <TextField
                  select
                  fullWidth
                  size="small"
                  disabled={
                    !transferForm
                      .updateStudyBranch
                  }
                  label={`فرع الدراسة الجديد — الحالي: ${
                    transferRow
                      ?.studyBranchName ||
                    "-"
                  }`}
                  value={
                    transferForm
                      .newStudyBranchGuid
                  }
                  onChange={(event) =>
                    setTransferForm(
                      (current) => ({
                        ...current,
                        newStudyBranchGuid:
                          event.target.value
                      })
                    )
                  }
                >
                  {transferLookups.branches.map(
                    (branch) => (
                      <MenuItem
                        key={branch.guid}
                        value={branch.guid}
                      >
                        {branch.branchName}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        transferForm
                          .updateDiploma
                      }
                      onChange={(event) =>
                        setTransferForm(
                          (current) => ({
                            ...current,
                            updateDiploma:
                              event.target.checked,
                            newDiplomaGuid:
                              event.target.checked
                                ? current
                                    .newDiplomaGuid
                                : ""
                          })
                        )
                      }
                    />
                  }
                  label="تغيير الدبلوم"
                />

                <TextField
                  select
                  fullWidth
                  size="small"
                  disabled={
                    !transferForm.updateDiploma
                  }
                  label={`الدبلوم الجديد — الحالي: ${
                    transferRow?.diplomName ||
                    "-"
                  }`}
                  value={
                    transferForm.newDiplomaGuid
                  }
                  onChange={(event) =>
                    setTransferForm(
                      (current) => ({
                        ...current,
                        newDiplomaGuid:
                          event.target.value
                      })
                    )
                  }
                >
                  {transferLookups.diplomas.map(
                    (diploma) => (
                      <MenuItem
                        key={diploma.guid}
                        value={diploma.guid}
                      >
                        {diploma.name}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        transferForm.updateBatch
                      }
                      onChange={(event) =>
                        setTransferForm(
                          (current) => ({
                            ...current,
                            updateBatch:
                              event.target.checked,
                            newBatchGuid:
                              event.target.checked
                                ? current
                                    .newBatchGuid
                                : ""
                          })
                        )
                      }
                    />
                  }
                  label="تغيير الدفعة"
                />

                <TextField
                  select
                  fullWidth
                  size="small"
                  disabled={
                    !transferForm.updateBatch
                  }
                  label={`الدفعة الجديدة — الحالية: ${
                    transferRow?.batchName ||
                    "-"
                  }`}
                  value={
                    transferForm.newBatchGuid
                  }
                  onChange={(event) =>
                    setTransferForm(
                      (current) => ({
                        ...current,
                        newBatchGuid:
                          event.target.value
                      })
                    )
                  }
                >
                  {transferLookups.batches.map(
                    (batch) => (
                      <MenuItem
                        key={batch.guid}
                        value={batch.guid}
                      >
                        {batch.name}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                label="سبب النقل — اختياري"
                value={transferForm.reason}
                onChange={(event) =>
                  setTransferForm(
                    (current) => ({
                      ...current,
                      reason:
                        event.target.value
                    })
                  )
                }
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() =>
                setTransferOpen(false)
              }
              color="error"
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={transferStudent}
              sx={{ bgcolor: "#057546" }}
            >
              حفظ النقل
            </Button>
          </DialogActions>
        </Dialog>

        <Backdrop
          open={Boolean(workingText)}
          sx={{
            backgroundColor:
              "rgba(9,36,25,.72)",
            backdropFilter: "blur(3px)"
          }}
        >
          <Paper
            elevation={12}
            sx={{
              minWidth: isPhone ? 245 : isTablet ? 320 : 330,
              maxWidth: isPhone ? "86vw" : undefined,
              px: isPhone ? 1.2 : isTablet ? 2 : 4,
              py: isPhone ? 1.2 : isTablet ? 2 : 3.5,
              borderRadius: isPhone ? 2 : isTablet ? 3 : 4,
              textAlign: "center",
              direction: "rtl"
            }}
          >
            <CircularProgress
              size={isPhone ? 34 : isTablet ? 44 : 55}
              sx={{
                color: "#057546",
                mb: 2
              }}
            />

            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900
              }}
            >
              {workingText}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontFamily: "Cairo",
                fontSize: isPhone ? ".42rem" : isTablet ? ".52rem" : ".8rem",
                color: "#78857f"
              }}
            >
              برجاء الانتظار حتى رجوع استجابة الخادم
            </Typography>
          </Paper>
        </Backdrop>
      </Box>
    </Box>
  );
};

export default DiplomaStudentsPage;