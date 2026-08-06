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
  Checkbox,
  CircularProgress,
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

import Sidebar from "../components/Sidebar";
import StudentStatementDialog2
  from "../components/StudentStatementDialog2";
import EditStudentDialog
  from "../components/EditStudentDialog";
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
    throw new Error(
      result?.details
        ? `${result?.message || "حدث خطأ"}: ${result.details}`
        : result?.message || text || `HTTP ${response.status}`
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
  const isDesktop = useMediaQuery(
    theme.breakpoints.up("lg")
  );

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
    if (rows.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }

    const data = rows.map((row) => ({
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
      `قائمة طلاب الدبلومات ${new Date()
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
    const items = [
      {
        field: "actions",
        headerName: "الإجراءات",
        width: 56,
        minWidth: 56,
        maxWidth: 56,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(event) => {
              setAnchorEl(event.currentTarget);
              setMenuRow(params.row);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )
      },
      {
        field: "acadmyId",
        headerName: "كود",
        minWidth: 78,
        flex: 0.55
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        minWidth: 190,
        flex: 1.5
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        minWidth: 105,
        flex: 0.8
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        minWidth: 105,
        flex: 0.8
      },
      {
        field: "batchName",
        headerName: "الدفعة/اليوم",
        minWidth: 105,
        flex: 0.85
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        minWidth: 170,
        flex: 1.35
      },
      {
        field: "statusName",
        headerName: "حالة الدراسة",
        minWidth: 95,
        flex: 0.75
      },
      {
        field: "levelName",
        headerName: "المستوى",
        minWidth: 85,
        flex: 0.65
      },
      {
        field: "email",
        headerName: "الإيميل",
        minWidth: 155,
        flex: 1.1
      },
      {
        field: "levelNotes",
        headerName: "ملاحظات",
        minWidth: 140,
        flex: 1
      },
      {
        field: "typeStudent",
        headerName: "النوع",
        minWidth: 70,
        flex: 0.5
      }
    ];

    if (!isDesktop) {
      return items.filter(
        (column) =>
          !["email", "batchName"].includes(
            column.field
          )
      );
    }

    return items;
  }, [isDesktop]);

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
            md: 1.5
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.4,
            mb: 1,
            borderRadius: 3,
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              lg: "row"
            }}
            spacing={1}
            alignItems="center"
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flex: 1 }}
            >
              <SchoolIcon
                sx={{
                  color: "#057546",
                  fontSize: 35
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: "1.18rem"
                  }}
                >
                  قائمة طلاب الدبلومات
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: ".74rem",
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
              sx={{
                minWidth: {
                  xs: "100%",
                  lg: 310
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
                setNewLevelGuid(event.target.value)
              }
              sx={{
                minWidth: {
                  xs: "100%",
                  lg: 190
                }
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
            >
              تحديث
            </Button>
          </Stack>

          <Stack
            direction="row"
            spacing={0.8}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1 }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={() =>
                setSelectionModel(
                  rows.map((row) => row.id)
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
                color: "#ae1e21"
              }}
            >
              عدد الطلاب: {rows.length}
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid rgba(5,117,70,.14)",
            overflow: "hidden",
            minHeight: "calc(100vh - 155px)"
          }}
        >
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={
              setSelectionModel
            }
            rowHeight={43}
            columnHeaderHeight={48}
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
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: {
                  debounceMs: 300
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

              "& .MuiDataGrid-scrollbar--horizontal, & .MuiDataGrid-scrollbar--vertical": {
                display: "none !important"
              },

              "& .MuiDataGrid-columnHeader": {
                px: 0.45
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: ".75rem",
                whiteSpace: "normal",
                lineHeight: 1.2,
                textAlign: "center"
              },

              "& .MuiDataGrid-cell": {
                fontFamily: "Cairo",
                fontWeight: 700,
                fontSize: ".75rem",
                px: 0.45,
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
                minHeight: 48
              }
            }}
          />
        </Paper>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              minWidth: 210,
              direction: "ltr"
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
            zIndex: (currentTheme) =>
              currentTheme.zIndex.modal + 30,
            backgroundColor:
              "rgba(9,36,25,.72)",
            backdropFilter: "blur(3px)"
          }}
        >
          <Paper
            elevation={12}
            sx={{
              minWidth: 330,
              px: 4,
              py: 3.5,
              borderRadius: 4,
              textAlign: "center",
              direction: "rtl"
            }}
          >
            <CircularProgress
              size={55}
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
                fontSize: ".8rem",
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