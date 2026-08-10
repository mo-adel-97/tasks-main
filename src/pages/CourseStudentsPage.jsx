import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Backdrop, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, IconButton, Menu, MenuItem,
  Paper, Stack, Tab, Tabs, TextField, Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SchoolIcon from "@mui/icons-material/School";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import DeselectIcon from "@mui/icons-material/Deselect";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";

import Sidebar from "../components/Sidebar";
import StudentStatementDialog2 from "../components/StudentStatementDialog2";
import EditStudentDialog from "../components/EditStudentDialog";
import RegisterDocumentDialog from "../components/RegisterDocumentDialog";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5258";
const ATTACHMENTS_BASE_URL = "https://sstli.com/arc-api/images_view.php";
const ZERO_GUID = "00000000-0000-0000-0000-000000000000";
const SIDEBAR_WIDTH = 280;

const unwrap = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  for (const key of ["value", "Value", "data", "Data", "string", "String"]) {
    if (value[key] !== undefined && value[key] !== value) return unwrap(value[key]);
  }
  return "";
};

const pick = (row, names, fallback = "") => {
  for (const name of names) {
    const key = Object.keys(row || {}).find(
      (item) => item.toLowerCase() === String(name).toLowerCase()
    );
    if (!key) continue;
    const value = unwrap(row[key]);
    if (value !== null && value !== undefined && String(value).trim() !== "")
      return value;
  }
  return fallback;
};

const toGuid = (value) => {
  const text = String(unwrap(value) ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)
    ? text
    : ZERO_GUID;
};

const isValidGuid = (value) => toGuid(value) !== ZERO_GUID;

const readJson = async (response) => {
  const text = await response.text();
  let result = {};
  try { result = text ? JSON.parse(text) : {}; } catch { result = {}; }
  if (!response.ok) {
    throw new Error(
      result?.details
        ? `${result?.message || "حدث خطأ"}: ${result.details}`
        : result?.message || text || `HTTP ${response.status}`
    );
  }
  return result;
};

const alertError = (text) => Swal.fire({
  icon: "error", title: "تنبيه", text,
  confirmButtonText: "حسنًا", confirmButtonColor: "#ae1e21"
});

const normalizeRow = (item, index) => ({
  ...item,
  id: `${pick(item, ["StudentLevelGuid", "Guid"], index + 1)}-${index}`,
  code: pick(item, ["Code", "AcadmyId"]),
  studentName: pick(item, ["StudentName"]),
  studentNameEn: pick(item, ["StudentNameEn"]),
  nationalId: pick(item, ["NationalId"]),
  studentTel: pick(item, ["StudentTel"]),
  batchOrDate: pick(item, ["BatchOrDate", "BatchName"]),
  programName: pick(item, ["ProgramName", "TYPENAME"]),
  courseName: pick(item, ["CourseName", "DiplomName"]),
  studyStatus: pick(item, ["StudyStatus", "StautName", "StatusName"]),
  levelName: pick(item, ["LevelName"]),
  email: pick(item, ["Email"]),
  notes: pick(item, ["Notes", "LevelNotes"]),
  gender: pick(item, ["Gender", "TYPESTUDENT"]),
  ahliTrainingStatus: pick(item, ["AhliTrainingStatusText"]),
  ahliTrainingDetails: pick(item, ["AhliTrainingDetails"]),
  regDocGuid: toGuid(pick(item, ["RegDocGuid"])),
  accountGuid: toGuid(pick(item, ["AccountGuid", "StudentGuid"])),
  courseGuid: toGuid(pick(item, ["CourseGuid"])),
  diplomaGuid: toGuid(pick(item, ["DiplomGuid"])),
  batchGuid: toGuid(pick(item, ["BatchGuid"])),
  studyBranchGuid: toGuid(pick(item, ["BranchGuid", "StudyBranchGuid"])),
  registrationBranchGuid: toGuid(pick(item, ["RegistrationBranchGuid", "BarnchGuid"])),
  studentLevelGuid: toGuid(pick(item, ["StudentLevelGuid", "Guid"])),
  registrationBranchName: pick(item, ["BrEName", "RegistrationBranchName"])
});

export default function CourseStudentsPage() {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  }, []);

  const userGuid = String(user?.guid || user?.Guid || "").trim();

  const [regType, setRegType] = useState(1);
  const [branches, setBranches] = useState([]);
  const [branchGuid, setBranchGuid] = useState("");
  const [batches, setBatches] = useState([]);
  const [batchKey, setBatchKey] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseGuid, setCourseGuid] = useState("");
  const [rows, setRows] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workingText, setWorkingText] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const requestRef = useRef(0);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 25, page: 0 });

  const [statementOpen, setStatementOpen] = useState(false);
  const [statementStudent, setStatementStudent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [registerDocumentOpen, setRegisterDocumentOpen] = useState(false);
  const [registerDocumentRow, setRegisterDocumentRow] = useState(null);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [notesRow, setNotesRow] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [statusGuid, setStatusGuid] = useState("");
  const [statusRow, setStatusRow] = useState(null);

  const [finishOpen, setFinishOpen] = useState(false);
  const [finishRow, setFinishRow] = useState(null);
  const [finishStatusGuid, setFinishStatusGuid] = useState("");
  const [finishMark, setFinishMark] = useState("");
  const [finishNotes, setFinishNotes] = useState("");

  const [ahliOpen, setAhliOpen] = useState(false);
  const [ahliRow, setAhliRow] = useState(null);
  const [ahliStatus, setAhliStatus] = useState("");
  const [ahliDetails, setAhliDetails] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingTransferRows, setPendingTransferRows] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLookups, setTransferLookups] = useState({
    branches: [], courses: [], batches: []
  });
  const [transferForm, setTransferForm] = useState({
    updateRegistrationBranch: false,
    newRegistrationBranchGuid: "",
    updateStudyBranch: false,
    newStudyBranchGuid: "",
    updateCourse: false,
    newCourseGuid: "",
    updateBatch: false,
    newBatchGuid: "",
    reason: ""
  });

  const selectedRows = useMemo(() => {
    const ids = new Set(selectionModel.map(String));
    return rows.filter((row) => ids.has(String(row.id)));
  }, [rows, selectionModel]);

  const selectedBatch = useMemo(
    () => batches.find((item) => String(item.key) === String(batchKey)),
    [batches, batchKey]
  );

  const postJson = async (path, body, progressText) => {
    const snapshot = { branchGuid, batchKey, courseGuid, regType, paginationModel };
    try {
      setWorkingText(progressText);
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readJson(response);
      await Swal.fire({
        icon: "success", title: "تم بنجاح",
        text: result?.message || "تم تنفيذ العملية",
        confirmButtonText: "حسنًا", confirmButtonColor: "#057546"
      });
      await loadStudents();
      setBranchGuid(snapshot.branchGuid);
      setBatchKey(snapshot.batchKey);
      setCourseGuid(snapshot.courseGuid);
      setRegType(snapshot.regType);
      setPaginationModel(snapshot.paginationModel);
      return true;
    } catch (error) {
      await alertError(error?.message || "تعذر تنفيذ العملية");
      return false;
    } finally {
      setWorkingText("");
    }
  };

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/course-students/branches?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      const data = Array.isArray(result?.data) ? result.data : [];
      setBranches(data);
      setBranchGuid((current) =>
        data.some((x) => String(x.guid) === String(current))
          ? current
          : String(data[0]?.guid || "")
      );
    } catch (error) {
      await alertError(error?.message || "تعذر تحميل الفروع");
    }
  }, [userGuid]);

  const loadBatches = useCallback(async () => {
    if (!branchGuid) {
      setBatches([]); setBatchKey(""); return;
    }
    try {
      const params = new URLSearchParams({ userGuid, branchGuid, regType: String(regType) });
      const response = await fetch(
        `${API_BASE_URL}/api/course-students/batches?${params}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      const data = (Array.isArray(result?.data) ? result.data : []).map((item, index) => {
        const guid = toGuid(pick(item, ["Guid"]));
        const name = String(pick(item, ["Name"]));
        const batchDate = String(pick(item, ["BatchDate"]));
        return { ...item, guid, name, batchDate, key: `${guid}|${batchDate}|${index}` };
      });
      setBatches(data);
      setBatchKey((current) => data.some((x) => String(x.key) === String(current)) ? current : "");
    } catch (error) {
      await alertError(error?.message || "تعذر تحميل الدفعات");
    }
  }, [userGuid, branchGuid, regType]);

  const loadCourses = useCallback(async () => {
    if (!branchGuid || !selectedBatch) {
      setCourses([]); setCourseGuid(""); return;
    }
    try {
      const params = new URLSearchParams({
        userGuid,
        branchGuid,
        regType: String(regType),
        batchGuid: selectedBatch.guid,
        batchDate: selectedBatch.batchDate || ""
      });
      const response = await fetch(
        `${API_BASE_URL}/api/course-students/courses?${params}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      const data = (Array.isArray(result?.data) ? result.data : []).map((item) => ({
        ...item,
        guid: toGuid(pick(item, ["Guid"])),
        name: String(pick(item, ["Name"]))
      }));
      setCourses(data);
      setCourseGuid((current) => data.some((x) => String(x.guid) === String(current)) ? current : "");
    } catch (error) {
      await alertError(error?.message || "تعذر تحميل الدورات");
    }
  }, [userGuid, branchGuid, regType, selectedBatch]);

  const loadStudents = useCallback(async () => {
    if (!branchGuid || !selectedBatch || !courseGuid) {
      setRows([]); return;
    }

    const requestId = ++requestRef.current;
    try {
      setLoading(true);
      setSelectionModel([]);

      const params = new URLSearchParams({
        userGuid,
        branchGuid,
        regType: String(regType),
        courseGuid,
        batchGuid: selectedBatch.guid,
        batchDate: selectedBatch.batchDate || "",
        _: String(Date.now())
      });

      const response = await fetch(
        `${API_BASE_URL}/api/course-students?${params}`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const result = await readJson(response);
      if (requestId !== requestRef.current) return;

      setRows(
        (Array.isArray(result?.data) ? result.data : [])
          .map((item, index) => normalizeRow(item, index))
      );
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setRows([]);
      await alertError(error?.message || "تعذر تحميل طلاب الدورات");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [userGuid, branchGuid, regType, courseGuid, selectedBatch]);

  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => { loadBatches(); }, [loadBatches]);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const closeMenu = () => { setAnchorEl(null); setMenuRow(null); };

  const loadStatuses = async (auto) => {
    const response = await fetch(
      `${API_BASE_URL}/api/course-students/statuses?userGuid=${encodeURIComponent(userGuid)}&auto=${auto}`,
      { cache: "no-store" }
    );
    const result = await readJson(response);
    return (Array.isArray(result?.data) ? result.data : []).map((item) => ({
      guid: toGuid(pick(item, ["Guid"])),
      name: String(pick(item, ["Name"]))
    }));
  };

  const openStatement = (row) => {
    setStatementStudent({
      accountGuid: row.accountGuid,
      nationalId: row.nationalId,
      studentName: row.studentName,
      studyType: regType
    });
    setStatementOpen(true);
  };

  const openStatementDocument = async (row) => {
    const formName = String(row?.formName || row?.FormName || "").trim().toLowerCase();
    if (formName !== "addregdoc") {
      await alertError("عرض المستند متاح حاليًا لاستمارات التسجيل فقط");
      return;
    }

    const docGuid = row?.actionGuid || row?.ActionGuid || row?.docGuid || row?.DocGuid || "";
    if (!docGuid || docGuid === ZERO_GUID) {
      await alertError("لا يمكن قراءة معرف استمارة التسجيل");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reception-office/student-statement/register-order/check?docGuid=${encodeURIComponent(docGuid)}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      setRegisterDocumentRow({
        ...row,
        actionGuid: docGuid,
        ActionGuid: docGuid,
        docGuid,
        DocGuid: docGuid,
        documentNo:
          row?.documentNo ||
          row?.DocumentNo ||
          row?.code ||
          row?.Code ||
          "",
        hasOrder: Boolean(result?.hasOrder)
      });
      setRegisterDocumentOpen(true);
    } catch (error) {
      await alertError(error?.message || "تعذر فتح استمارة التسجيل");
    }
  };

  const exportXlsx = () => {
    if (!rows.length) { alertError("لا توجد بيانات للتصدير"); return; }
    const data = rows.map((row) => ({
      "كود": row.code,
      "اسم الطالب": row.studentName,
      "رقم الهوية": row.nationalId,
      "رقم الجوال": row.studentTel,
      "الدفعة/اليوم": row.batchOrDate,
      "البرنامج": row.programName,
      "الدبلوم/الدورة": row.courseName,
      "حالة الدراسة": row.studyStatus,
      "المستوى": row.levelName,
      "الإيميل": row.email,
      "ملاحظات": row.notes,
      "النوع": row.gender,
      "موقف التدريب الأهلي": row.ahliTrainingStatus,
      "رقم الدورة/السبب": row.ahliTrainingDetails
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    sheet["!cols"] = Object.keys(data[0]).map(() => ({ wch: 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, regType === 1 ? "الدورات التأهيلية" : "الدورات التطويرية");
    XLSX.writeFile(
      workbook,
      `طلاب_الدورات_${regType === 1 ? "التأهيلية" : "التطويرية"}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const openTransferPassword = (items) => {
    if (!items.length) { alertError("حدد طالبًا واحدًا على الأقل"); return; }
    setPendingTransferRows(items);
    setPassword("");
    setPasswordOpen(true);
  };

  const confirmPassword = async () => {
    if (password !== "1054") {
      await alertError("كلمة مرور النقل غير صحيحة");
      return;
    }
    try {
      setWorkingText("جاري تحميل بيانات النقل");
      const params = new URLSearchParams({ userGuid, branchGuid, regType: String(regType) });
      const response = await fetch(
        `${API_BASE_URL}/api/course-students/transfer-lookups?${params}`,
        { cache: "no-store" }
      );
      const result = await readJson(response);
      setTransferLookups({
        branches: Array.isArray(result?.data?.branches) ? result.data.branches : [],
        courses: Array.isArray(result?.data?.courses) ? result.data.courses : [],
        batches: Array.isArray(result?.data?.batches) ? result.data.batches : []
      });
      setTransferForm({
        updateRegistrationBranch: false,
        newRegistrationBranchGuid: "",
        updateStudyBranch: false,
        newStudyBranchGuid: "",
        updateCourse: false,
        newCourseGuid: "",
        updateBatch: false,
        newBatchGuid: "",
        reason: ""
      });
      setPasswordOpen(false);
      setTransferOpen(true);
    } catch (error) {
      await alertError(error?.message || "تعذر تحميل بيانات النقل");
    } finally {
      setWorkingText("");
    }
  };

  const saveTransfer = async () => {
    const body = {
      userGuid,
      password,
      updateRegistrationBranch: transferForm.updateRegistrationBranch,
      newRegistrationBranchGuid: toGuid(transferForm.newRegistrationBranchGuid),
      updateStudyBranch: transferForm.updateStudyBranch,
      newStudyBranchGuid: toGuid(transferForm.newStudyBranchGuid),
      updateCourse: transferForm.updateCourse,
      newCourseGuid: toGuid(transferForm.newCourseGuid),
      updateBatch: transferForm.updateBatch,
      newBatchGuid: toGuid(transferForm.newBatchGuid),
      reason: transferForm.reason
    };

    const isBulk = pendingTransferRows.length > 1;
    if (isBulk) {
      body.studentLevelGuids = pendingTransferRows.map((row) => row.studentLevelGuid);
    } else {
      body.accountGuid = pendingTransferRows[0].accountGuid;
      body.studentLevelGuid = pendingTransferRows[0].studentLevelGuid;
    }

    const success = await postJson(
      isBulk ? "/api/course-students/transfer-bulk" : "/api/course-students/transfer",
      body,
      isBulk ? `جاري نقل ${pendingTransferRows.length} طالب` : `جاري نقل ${pendingTransferRows[0].studentName}`
    );

    if (success) {
      setTransferOpen(false);
      setPendingTransferRows([]);
    }
  };

  const columns = useMemo(() => [
    {
      field: "actions", headerName: "الإجراءات", width: 52, sortable: false, filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={(event) => {
          setAnchorEl(event.currentTarget); setMenuRow(params.row);
        }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    },
    { field: "code", headerName: "كود", minWidth: 90, flex: .7 },
    { field: "studentName", headerName: "اسم الطالب", minWidth: 180, flex: 1.5 },
    { field: "nationalId", headerName: "رقم الهوية", minWidth: 105, flex: .85 },
    { field: "studentTel", headerName: "رقم الجوال", minWidth: 105, flex: .85 },
    { field: "batchOrDate", headerName: "الدفعة/اليوم", minWidth: 105, flex: .9 },
    { field: "programName", headerName: "البرنامج", minWidth: 95, flex: .8 },
    { field: "courseName", headerName: "الدبلوم/الدورة", minWidth: 170, flex: 1.35 },
    { field: "studyStatus", headerName: "حالة الدراسة", minWidth: 95, flex: .8 },
    { field: "levelName", headerName: "المستوى", minWidth: 80, flex: .65 },
    { field: "email", headerName: "الإيميل", minWidth: 145, flex: 1.1 },
    { field: "notes", headerName: "ملاحظات", minWidth: 130, flex: 1 },
    { field: "gender", headerName: "النوع", minWidth: 65, flex: .5 },
    { field: "ahliTrainingStatus", headerName: "موقف التدريب الأهلي", minWidth: 130, flex: 1 }
  ], []);

  return (
    <Box sx={{ minHeight: "100vh", direction: "ltr", bgcolor: "#f6faf8" }}>
      <Sidebar />
      <Box component="main" sx={{ ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` }, p: 1 }}>
        <Paper elevation={0} sx={{ p: 1.2, borderRadius: 3, border: "1px solid #dbece4" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems="center" mb={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <SchoolIcon sx={{ color: "#057546", fontSize: 34 }} />
              <Box dir="ltr">
                <Typography fontWeight={900} fontSize={20}>قائمة طلاب الدورات</Typography>
                <Typography color="text.secondary" fontSize={12}>
                  عرض البيانات والنقل وتغيير الحالة وإنهاء الدراسة
                </Typography>
              </Box>
            </Stack>

            <TextField
              select size="small" label="الفرع" value={branchGuid}
              onChange={(event) => setBranchGuid(event.target.value)}
              sx={{ minWidth: 280 }}
            >
              {branches.map((item) => (
                <MenuItem key={item.guid} value={item.guid}>{item.branchName}</MenuItem>
              ))}
            </TextField>

            <TextField
              select size="small" label="الدفعة" value={batchKey}
              onChange={(event) => setBatchKey(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              {batches.map((item) => (
                <MenuItem key={item.key} value={item.key}>{item.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              select size="small" label="الدورة" value={courseGuid}
              onChange={(event) => setCourseGuid(event.target.value)}
              sx={{ minWidth: 260 }}
            >
              {courses.map((item) => (
                <MenuItem key={item.guid} value={item.guid}>{item.name}</MenuItem>
              ))}
            </TextField>

            <Button startIcon={<RefreshIcon />} onClick={loadStudents}>تحديث</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={exportXlsx}>تصدير Excel</Button>
          </Stack>

          <Tabs
            value={regType}
            onChange={(_, value) => setRegType(value)}
            variant="fullWidth"
            sx={{ mb: .5 }}
          >
            <Tab value={1} label="الدورات التأهيلية" />
            <Tab value={2} label="الدورات التطويرية" />
          </Tabs>

          <Stack direction="row" spacing={1} mb={.5} dir="ltr">
            <Button startIcon={<SelectAllIcon />} onClick={() => setSelectionModel(rows.map((x) => x.id))}>
              تحديد الكل
            </Button>
            <Button startIcon={<DeselectIcon />} onClick={() => setSelectionModel([])}>
              إلغاء التحديد
            </Button>
            <Button
              startIcon={<DriveFileMoveIcon />}
              disabled={!selectedRows.length}
              onClick={() => openTransferPassword(selectedRows)}
            >
              نقل المحدد ({selectedRows.length})
            </Button>
            <Typography sx={{ ml: "auto", fontWeight: 900, color: "#ae1e21" }}>
              عدد الطلاب: {rows.length}
            </Typography>
          </Stack>

          <Box sx={{ height: "calc(100vh - 225px)", minHeight: 520 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={(value) => setSelectionModel(Array.from(value || []))}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true } }}
              pageSizeOptions={[15, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sx={{
                direction: "ltr",
                border: 0,
                "& .MuiDataGrid-columnHeaders": { bgcolor: "#edf8f3", fontWeight: 900 },
                "& .MuiDataGrid-row:nth-of-type(odd)": { bgcolor: "#fff4ea" },
                "& .MuiDataGrid-cell": { fontWeight: 700, fontSize: 12.5 }
              }}
            />
          </Box>
        </Paper>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => { setEditStudent(menuRow); setEditOpen(true); closeMenu(); }}>
          عرض البيانات
        </MenuItem>
        <MenuItem onClick={() => { openStatement(menuRow); closeMenu(); }}>كشف حساب</MenuItem>
        <MenuItem onClick={() => {
          window.open(`${ATTACHMENTS_BASE_URL}?identity=${encodeURIComponent(menuRow?.nationalId || "")}`, "_blank");
          closeMenu();
        }}>
          عرض المرفقات
        </MenuItem>
        <MenuItem onClick={() => { openTransferPassword([menuRow]); closeMenu(); }}>نقل</MenuItem>
        <MenuItem onClick={() => {
          setNotesRow(menuRow); setNotesText(menuRow?.notes || ""); setNotesOpen(true); closeMenu();
        }}>
          إضافة ملاحظة
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            setStatuses(await loadStatuses(0));
            setStatusRow(menuRow); setStatusGuid(""); setStatusOpen(true); closeMenu();
          } catch (error) { await alertError(error?.message || "تعذر تحميل الحالات"); }
        }}>
          تغيير الحالة
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            setStatuses(await loadStatuses(1));
            setFinishRow(menuRow); setFinishStatusGuid(""); setFinishMark(""); setFinishNotes("");
            setFinishOpen(true); closeMenu();
          } catch (error) { await alertError(error?.message || "تعذر تحميل الحالات"); }
        }}>
          إنهاء دراسة
        </MenuItem>
        <MenuItem onClick={() => {
          setAhliRow(menuRow);
          setAhliStatus(
            menuRow?.ahliTrainingStatus === "تم الرفع" ? "1" :
            menuRow?.ahliTrainingStatus === "لم يتم الرفع" ? "2" :
            menuRow?.ahliTrainingStatus === "مؤجل" ? "3" : ""
          );
          setAhliDetails(menuRow?.ahliTrainingDetails || "");
          setAhliOpen(true);
          closeMenu();
        }}>
          موقف الطالب من التدريب الأهلي
        </MenuItem>
      </Menu>

      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>إضافة ملاحظة</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline minRows={5} value={notesText}
            onChange={(event) => setNotesText(event.target.value)} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setNotesOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={async () => {
            if (!notesText.trim()) {
              await alertError("برجاء إدخال الملاحظة المراد إضافتها");
              return;
            }

            const effectiveStudentLevelGuid = toGuid(notesRow?.studentLevelGuid);
            const effectiveAccountGuid = isValidGuid(notesRow?.accountGuid)
              ? notesRow.accountGuid
              : ZERO_GUID;
            const effectiveCourseGuid = isValidGuid(notesRow?.courseGuid)
              ? notesRow.courseGuid
              : toGuid(courseGuid);
            const effectiveBranchGuid = isValidGuid(notesRow?.studyBranchGuid)
              ? notesRow.studyBranchGuid
              : toGuid(branchGuid);

            // StudentLevelGuid هو المفتاح الأساسي للصف، فلا نوقف الحفظ بسبب
            // نقص AccountGuid أو CourseGuid في بيانات الجريد.
            if (!isValidGuid(effectiveStudentLevelGuid) &&
                (!isValidGuid(effectiveAccountGuid) ||
                 !isValidGuid(effectiveCourseGuid) ||
                 !isValidGuid(effectiveBranchGuid))) {
              await alertError("تعذر تحديد قيد دراسة الطالب المحدد");
              return;
            }

            const ok = await postJson("/api/course-students/notes", {
              userGuid,
              studentLevelGuid: effectiveStudentLevelGuid,
              accountGuid: effectiveAccountGuid,
              courseGuid: effectiveCourseGuid,
              branchGuid: effectiveBranchGuid,
              levelNotes: notesText.trim()
            }, "جاري حفظ الملاحظة");
            if (ok) setNotesOpen(false);
          }}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>تغيير حالة الطالب</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="حالة التسجيل" value={statusGuid}
            onChange={(event) => setStatusGuid(event.target.value)} sx={{ mt: 1 }}>
            {statuses.map((item) => <MenuItem key={item.guid} value={item.guid}>{item.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setStatusOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={async () => {
            if (!isValidGuid(statusGuid)) {
              await alertError("برجاء اختيار حالة التسجيل");
              return;
            }
            const effectiveCourseGuid = isValidGuid(statusRow?.courseGuid)
              ? statusRow.courseGuid
              : courseGuid;

            const ok = await postJson("/api/course-students/change-status", {
              userGuid,
              studentLevelGuid: toGuid(statusRow?.studentLevelGuid),
              accountGuid: toGuid(statusRow?.accountGuid),
              courseGuid: toGuid(effectiveCourseGuid),
              statusGuid: toGuid(statusGuid),
              nationalId: String(statusRow?.nationalId || "").trim(),
              acadmyId: String(statusRow?.code || "").trim()
            }, "جاري تغيير حالة الطالب");
            if (ok) setStatusOpen(false);
          }}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={finishOpen} onClose={() => setFinishOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>إنهاء دراسة طالب</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={1}>
            <TextField select fullWidth label="حالة التسجيل" value={finishStatusGuid}
              onChange={(event) => setFinishStatusGuid(event.target.value)}>
              {statuses.map((item) => <MenuItem key={item.guid} value={item.guid}>{item.name}</MenuItem>)}
            </TextField>
            <TextField type="number" label="النسبة" value={finishMark}
              onChange={(event) => setFinishMark(event.target.value)} />
            <TextField multiline minRows={5} label="ملاحظات" value={finishNotes}
              onChange={(event) => setFinishNotes(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setFinishOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={async () => {
            if (!isValidGuid(finishStatusGuid)) {
              await alertError("برجاء اختيار حالة التسجيل");
              return;
            }
            if (String(finishMark).trim() === "") {
              await alertError("برجاء تحديد نسبة الاختبار الخاصة بالطالب");
              return;
            }
            const mark = Number(finishMark);
            if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
              await alertError("النسبة يجب أن تكون بين صفر و100");
              return;
            }
            if (!isValidGuid(finishRow?.studentLevelGuid)) {
              await alertError("تعذر قراءة قيد دراسة الطالب من الصف المحدد");
              return;
            }

            const ok = await postJson("/api/course-students/finish-study", {
              userGuid,
              accountGuid: finishRow.accountGuid,
              studentLevelGuid: finishRow.studentLevelGuid,
              statusGuid: finishStatusGuid,
              levelMark: mark,
              levelNotes: finishNotes
            }, "جاري إنهاء دراسة الطالب");
            if (ok) setFinishOpen(false);
          }}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ahliOpen} onClose={() => setAhliOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>موقف الطالب من التدريب الأهلي</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={1}>
            <Typography fontWeight={900} textAlign="left">هل تم رفع الطالب على التدريب الأهلي؟</Typography>
            <TextField select fullWidth label="اختر الحالة" value={ahliStatus}
              onChange={(event) => setAhliStatus(event.target.value)}>
              <MenuItem value="1">نعم - تم الرفع</MenuItem>
              <MenuItem value="2">لا - لم يتم الرفع</MenuItem>
              <MenuItem value="3">مؤجل</MenuItem>
            </TextField>
            <TextField
              multiline minRows={4}
              label={String(ahliStatus) === "1" ? "رقم الدورة" : String(ahliStatus) === "3" ? "سبب التأجيل" : "سبب عدم الرفع"}
              value={ahliDetails}
              onChange={(event) => setAhliDetails(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setAhliOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={async () => {
            if (!isValidGuid(ahliRow?.studentLevelGuid)) {
              await alertError("تعذر قراءة قيد دراسة الطالب من الصف المحدد");
              return;
            }
            if (![1, 2, 3].includes(Number(ahliStatus))) {
              await alertError("برجاء اختيار موقف التدريب الأهلي");
              return;
            }
            if (!String(ahliDetails || "").trim()) {
              await alertError("برجاء كتابة رقم الدورة أو السبب");
              return;
            }

            const ok = await postJson("/api/course-students/ahli-training", {
              userGuid,
              studentLevelGuid: ahliRow.studentLevelGuid,
              accountGuid: ahliRow.accountGuid,
              courseGuid: ahliRow.courseGuid,
              branchGuid: ahliRow.studyBranchGuid || branchGuid,
              status: Number(ahliStatus),
              details: String(ahliDetails).trim()
            }, "جاري حفظ موقف التدريب الأهلي");
            if (ok) setAhliOpen(false);
          }}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} fullWidth maxWidth="xs" dir="rtl">
        <DialogTitle>التحقق من كلمة المرور</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth type="password" label="كلمة المرور"
            value={password} onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") confirmPassword(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setPasswordOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={confirmPassword}>تأكيد</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} fullWidth maxWidth="md" dir="ltr">
        <DialogTitle>
          {pendingTransferRows.length > 1
            ? `نقل كل الطلاب المحددين (${pendingTransferRows.length})`
            : `نقل الطالب ${pendingTransferRows[0]?.studentName || ""}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} mt={1}>
            {[
              ["updateRegistrationBranch", "newRegistrationBranchGuid", "فرع التسجيل", transferLookups.branches, "branchName"],
              ["updateStudyBranch", "newStudyBranchGuid", "فرع الدراسة", transferLookups.branches, "branchName"],
              ["updateCourse", "newCourseGuid", "الدورة", transferLookups.courses, "Name"],
              ["updateBatch", "newBatchGuid", "الدفعة", transferLookups.batches, "Name"]
            ].map(([checkKey, valueKey, label, items, nameKey]) => (
              <Box key={checkKey}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(transferForm[checkKey])}
                      onChange={(event) => setTransferForm((current) => ({
                        ...current,
                        [checkKey]: event.target.checked,
                        [valueKey]: event.target.checked ? current[valueKey] : ""
                      }))}
                    />
                  }
                  label={`تغيير ${label}`}
                />
                <TextField
                  select fullWidth size="small" label={`${label} الجديد`}
                  disabled={!transferForm[checkKey]}
                  value={transferForm[valueKey]}
                  onChange={(event) => setTransferForm((current) => ({
                    ...current, [valueKey]: event.target.value
                  }))}
                >
                  {items.map((item, index) => {
                    const guid = String(item.guid || item.Guid || "");
                    const name = String(item[nameKey] || item.name || item.Name || "");
                    return <MenuItem key={`${guid}-${index}`} value={guid}>{name}</MenuItem>;
                  })}
                </TextField>
              </Box>
            ))}
            <TextField
              multiline minRows={3} label="سبب النقل — اختياري"
              value={transferForm.reason}
              onChange={(event) => setTransferForm((current) => ({
                ...current, reason: event.target.value
              }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setTransferOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={saveTransfer}>حفظ النقل</Button>
        </DialogActions>
      </Dialog>

      <StudentStatementDialog2
        open={statementOpen}
        onClose={() => {
          setStatementOpen(false);
          setStatementStudent(null);
        }}
        student={statementStudent}
        apiBaseUrl={API_BASE_URL}
        onOpenStatementDocument={openStatementDocument}
      />

      <EditStudentDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        student={editStudent}
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
          registerDocumentRow?.docGuid ||
          registerDocumentRow?.DocGuid ||
          ""
        }
        documentNo={
          registerDocumentRow?.documentNo ||
          registerDocumentRow?.DocumentNo ||
          registerDocumentRow?.code ||
          registerDocumentRow?.Code ||
          ""
        }
        apiBaseUrl={API_BASE_URL}
      />

      <Backdrop open={Boolean(workingText)} sx={{ zIndex: 1600, color: "#fff" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="inherit" />
          <Typography fontWeight={900}>{workingText}</Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}