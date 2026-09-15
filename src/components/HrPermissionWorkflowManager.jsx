import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f4f9f6";

const DEFAULT_PERMISSION_TYPES = [
  { value: 1, name: "تأخير حضور" },
  { value: 2, name: "انصراف مبكر" },
  { value: 3, name: "خروج أثناء الدوام" },
  { value: 4, name: "إذن يوم كامل" }
];

const APPROVER_SOURCES = [
  {
    value: "ORG_DIRECT_MANAGER",
    name: "المسؤول المباشر",
    description: "المسؤول المباشر للموظف من الهيكل الإداري الموحد"
  },
  {
    value: "ORG_PARENT_MANAGER",
    name: "مسؤول الوحدة الأعلى",
    description: "أقرب مسؤول في الوحدة التنظيمية الأعلى"
  },
  {
    value: "ORG_ROOT_MANAGER",
    name: "الإدارة العليا / الجذر",
    description: "مسؤول أعلى مستوى في الهيكل"
  },
  {
    value: "ORG_UNIT_MANAGER",
    name: "مسؤول وحدة محددة",
    description: "مسؤولو وحدة تنظيمية تختارها"
  },
  {
    value: "SPECIFIC_USERS",
    name: "مستخدمون محددون",
    description: "أشخاص تختارهم بالاسم"
  }
];

const getActor = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      actorUserGuid:
        user?.guid ||
        user?.Guid ||
        user?.userGuid ||
        user?.UserGuid ||
        null,
      actorName:
        user?.fullName ||
        user?.FullName ||
        user?.userName ||
        user?.UserName ||
        "مستخدم النظام"
    };
  } catch {
    return { actorUserGuid: null, actorName: "مستخدم النظام" };
  }
};

const pick = (obj, ...names) => {
  for (const name of names) {
    if (obj?.[name] !== undefined && obj?.[name] !== null) {
      return obj[name];
    }
  }
  return undefined;
};

const arrayFrom = (obj, ...names) => {
  const value = pick(obj, ...names);
  return Array.isArray(value) ? value : [];
};

const boolValue = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || String(value).toLowerCase() === "true") {
    return true;
  }
  if (value === 0 || value === "0" || String(value).toLowerCase() === "false") {
    return false;
  }
  return fallback;
};

const emptyStep = (index = 0) => ({
  stepName: `الخطوة ${index + 1}`,
  approverSource: "ORG_DIRECT_MANAGER",
  targetOrgUnitGuid: "",
  approvalMode: "ANY",
  approverUserGuids: []
});

const emptyPolicy = () => ({
  policyGuid: null,
  policyName: "",
  permissionType: "",
  sourceOrgUnitGuid: "",
  includeDescendants: true,
  priority: 100,
  isActive: true,
  notes: "",
  steps: [emptyStep(0)]
});

const normalizeStep = (step, index = 0) => {
  const approvers = arrayFrom(
    step,
    "approverUserGuids",
    "ApproverUserGuids",
    "userGuids",
    "UserGuids"
  );

  const nestedApprovers = arrayFrom(
    step,
    "approvers",
    "Approvers"
  )
    .map((x) =>
      pick(
        x,
        "userGuid",
        "UserGuid",
        "approverUserGuid",
        "ApproverUserGuid",
        "employeeGuid",
        "EmployeeGuid"
      )
    )
    .filter(Boolean);

  return {
    stepName:
      pick(step, "stepName", "StepName", "name", "Name") ||
      `الخطوة ${index + 1}`,
    approverSource:
      pick(step, "approverSource", "ApproverSource") ||
      "ORG_DIRECT_MANAGER",
    targetOrgUnitGuid:
      pick(step, "targetOrgUnitGuid", "TargetOrgUnitGuid") || "",
    approvalMode:
      String(
        pick(step, "approvalMode", "ApprovalMode") || "ANY"
      ).toUpperCase(),
    approverUserGuids: [
      ...new Set(
        [...approvers, ...nestedApprovers]
          .map(String)
          .filter(Boolean)
      )
    ]
  };
};

const normalizePolicy = (policy) => {
  const rawSteps = arrayFrom(policy, "steps", "Steps", "policySteps", "PolicySteps");

  return {
    policyGuid: pick(policy, "policyGuid", "PolicyGuid") || null,
    policyName:
      pick(policy, "policyName", "PolicyName", "name", "Name") || "",
    permissionType:
      pick(policy, "permissionType", "PermissionType") ?? "",
    sourceOrgUnitGuid:
      pick(policy, "sourceOrgUnitGuid", "SourceOrgUnitGuid") || "",
    includeDescendants: boolValue(
      pick(policy, "includeDescendants", "IncludeDescendants"),
      true
    ),
    priority: Number(
      pick(policy, "priority", "Priority") ?? 100
    ),
    isActive: boolValue(
      pick(policy, "isActive", "IsActive"),
      true
    ),
    notes: pick(policy, "notes", "Notes") || "",
    steps: rawSteps.length
      ? rawSteps.map(normalizeStep)
      : [emptyStep(0)]
  };
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff"
  }
};

const externalLabelSx = {
  mb: 0.45,
  fontSize: 11.5,
  fontWeight: 900,
  color: "#52635c"
};

export default function HrPermissionWorkflowManager() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({});
  const [policies, setPolicies] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [form, setForm] = useState(emptyPolicy());

  const actor = useMemo(getActor, []);

  const orgUnits = useMemo(() => {
    return arrayFrom(
      config,
      "orgUnits",
      "OrgUnits",
      "units",
      "Units",
      "organizationUnits",
      "OrganizationUnits"
    );
  }, [config]);

  const employees = useMemo(() => {
    return arrayFrom(
      config,
      "employees",
      "Employees",
      "users",
      "Users"
    );
  }, [config]);

  const permissionTypes = useMemo(() => {
    const configured = arrayFrom(
      config,
      "permissionTypes",
      "PermissionTypes"
    );

    if (!configured.length) return DEFAULT_PERMISSION_TYPES;

    return configured.map((item, index) => ({
      value: Number(
        pick(item, "value", "Value", "permissionType", "PermissionType") ??
        index + 1
      ),
      name:
        pick(item, "name", "Name", "label", "Label", "permissionTypeName", "PermissionTypeName") ||
        `نوع ${index + 1}`
    }));
  }, [config]);

  const unitGuid = (unit) =>
    pick(unit, "orgUnitGuid", "OrgUnitGuid", "unitGuid", "UnitGuid", "guid", "Guid");

  const unitName = (unit) =>
    pick(unit, "unitName", "UnitName", "name", "Name") || "وحدة بدون اسم";

  const employeeGuid = (employee) =>
    pick(employee, "employeeGuid", "EmployeeGuid", "userGuid", "UserGuid", "guid", "Guid");

  const employeeName = (employee) =>
    pick(employee, "employeeName", "EmployeeName", "fullName", "FullName", "name", "Name") || "";

  const employeeCode = (employee) =>
    pick(employee, "employeeCode", "EmployeeCode", "code", "Code") || "";

  const permissionTypeName = useCallback(
    (value) =>
      permissionTypes.find((x) => Number(x.value) === Number(value))?.name ||
      (value ? `نوع ${value}` : "كل أنواع الأذونات"),
    [permissionTypes]
  );

  const orgUnitName = useCallback(
    (guid) =>
      orgUnits.find((x) => String(unitGuid(x)) === String(guid))?.unitName ||
      orgUnits.find((x) => String(unitGuid(x)) === String(guid))?.UnitName ||
      orgUnits.find((x) => String(unitGuid(x)) === String(guid))?.name ||
      (guid ? "وحدة غير معروفة" : "كل الهيكل"),
    [orgUnits]
  );

  const requestJson = useCallback(async (url, options = {}) => {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    if (actor.actorUserGuid) {
      headers["X-User-Guid"] = actor.actorUserGuid;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر تنفيذ العملية"
      );
    }

    return result;
  }, [actor.actorUserGuid]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const approvalUrl = actor.actorUserGuid
        ? `${API_BASE_URL}/api/hr/permissions/workflow/my-approvals?actorUserGuid=${encodeURIComponent(actor.actorUserGuid)}`
        : null;

      const [configResult, policiesResult, approvalsResult] =
        await Promise.all([
          requestJson(`${API_BASE_URL}/api/hr/permissions/workflow/config`),
          requestJson(`${API_BASE_URL}/api/hr/permissions/workflow/policies`),
          approvalUrl
            ? requestJson(approvalUrl).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] })
        ]);

      setConfig(configResult?.data || {});
      setPolicies(
        (Array.isArray(policiesResult?.data) ? policiesResult.data : [])
          .map(normalizePolicy)
      );
      setApprovals(
        Array.isArray(approvalsResult?.data)
          ? approvalsResult.data
          : []
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل مسارات الأذونات",
        text: error?.message || "حدث خطأ أثناء التحميل"
      });
    } finally {
      setLoading(false);
    }
  }, [actor.actorUserGuid, requestJson]);

  useEffect(() => {
    if (!open) return;
    loadWorkspace();
  }, [open, loadWorkspace]);

  const openManager = () => {
    setTab(0);
    setForm(emptyPolicy());
    setOpen(true);
  };

  const startNewPolicy = () => {
    setForm(emptyPolicy());
    setTab(1);
  };

  const editPolicy = (policy) => {
    setForm(normalizePolicy(policy));
    setTab(1);
  };

  const updateStep = (index, patch) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index
          ? { ...step, ...patch }
          : step
      )
    }));
  };

  const addStep = () => {
    setForm((current) => ({
      ...current,
      steps: [
        ...current.steps,
        emptyStep(current.steps.length)
      ]
    }));
  };

  const removeStep = (index) => {
    setForm((current) => ({
      ...current,
      steps:
        current.steps.length <= 1
          ? current.steps
          : current.steps.filter((_, stepIndex) => stepIndex !== index)
    }));
  };

  const moveStep = (index, direction) => {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.steps.length) {
        return current;
      }

      const steps = [...current.steps];
      [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
      return { ...current, steps };
    });
  };

  const buildPayload = (policy = form, override = {}) => ({
    policyGuid: policy.policyGuid || null,
    policyName: String(policy.policyName || "").trim(),
    permissionType:
      policy.permissionType === "" ||
      policy.permissionType === null ||
      policy.permissionType === undefined
        ? null
        : Number(policy.permissionType),
    sourceOrgUnitGuid: policy.sourceOrgUnitGuid || null,
    includeDescendants: Boolean(policy.includeDescendants),
    priority: Number(policy.priority || 100),
    isActive:
      override.isActive !== undefined
        ? Boolean(override.isActive)
        : Boolean(policy.isActive),
    notes: String(policy.notes || "").trim() || null,
    actorUserGuid: actor.actorUserGuid,
    steps: (policy.steps || []).map((step, index) => ({
      stepName:
        String(step.stepName || "").trim() ||
        `الخطوة ${index + 1}`,
      approverSource: step.approverSource || "ORG_DIRECT_MANAGER",
      targetOrgUnitGuid:
        step.approverSource === "ORG_UNIT_MANAGER"
          ? step.targetOrgUnitGuid || null
          : null,
      approvalMode:
        String(step.approvalMode || "ANY").toUpperCase() === "ALL"
          ? "ALL"
          : "ANY",
      approverUserGuids:
        step.approverSource === "SPECIFIC_USERS"
          ? (step.approverUserGuids || []).filter(Boolean)
          : []
    }))
  });

  const validatePolicy = () => {
    if (!actor.actorUserGuid) {
      return "تعذر تحديد المستخدم الحالي";
    }

    if (!String(form.policyName || "").trim()) {
      return "اسم المسار مطلوب";
    }

    if (!Array.isArray(form.steps) || !form.steps.length) {
      return "أضف خطوة موافقة واحدة على الأقل";
    }

    for (let index = 0; index < form.steps.length; index += 1) {
      const step = form.steps[index];
      if (!String(step.stepName || "").trim()) {
        return `اسم الخطوة ${index + 1} مطلوب`;
      }

      if (
        step.approverSource === "ORG_UNIT_MANAGER" &&
        !step.targetOrgUnitGuid
      ) {
        return `اختر الوحدة التنظيمية للخطوة ${index + 1}`;
      }

      if (
        step.approverSource === "SPECIFIC_USERS" &&
        !(step.approverUserGuids || []).length
      ) {
        return `اختر موافقًا واحدًا على الأقل في الخطوة ${index + 1}`;
      }
    }

    return "";
  };

  const savePolicy = async () => {
    const validation = validatePolicy();

    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: "راجع بيانات المسار",
        text: validation
      });
      return;
    }

    setSaving(true);

    try {
      await requestJson(
        `${API_BASE_URL}/api/hr/permissions/workflow/policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload())
        }
      );

      await Swal.fire({
        icon: "success",
        title: "تم حفظ المسار",
        text: "سيُطبق المسار على الطلبات الجديدة المطابقة فقط."
      });

      await loadWorkspace();
      setTab(0);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ المسار",
        text: error?.message || "حدث خطأ أثناء الحفظ"
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePolicy = async (policy) => {
    if (!actor.actorUserGuid) return;

    const nextActive = !policy.isActive;
    const confirm = await Swal.fire({
      icon: "question",
      title: nextActive ? "تفعيل المسار؟" : "إيقاف المسار؟",
      text:
        "التغيير يؤثر على الطلبات الجديدة فقط، أما الطلبات الجارية فتبقى على المسار المجمد عند إنشائها.",
      showCancelButton: true,
      confirmButtonText: nextActive ? "تفعيل" : "إيقاف",
      cancelButtonText: "رجوع"
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);

    try {
      await requestJson(
        `${API_BASE_URL}/api/hr/permissions/workflow/policy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildPayload(policy, { isActive: nextActive })
          )
        }
      );

      await loadWorkspace();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحديث المسار",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setSaving(false);
    }
  };

  const decideApproval = async (row, decision) => {
    if (!actor.actorUserGuid) return;

    const approve = decision === "APPROVE";

    const prompt = await Swal.fire({
      icon: approve ? "question" : "warning",
      title: approve ? "اعتماد طلب الإذن؟" : "رفض طلب الإذن؟",
      input: "textarea",
      inputLabel: approve ? "ملاحظات - اختياري" : "سبب الرفض / الملاحظات",
      inputPlaceholder: "اكتب الملاحظات هنا...",
      showCancelButton: true,
      confirmButtonText: approve ? "اعتماد" : "رفض",
      cancelButtonText: "رجوع",
      confirmButtonColor: approve ? primary : "#b42318"
    });

    if (!prompt.isConfirmed) return;

    const guid = pick(
      row,
      "permissionGuid",
      "PermissionGuid"
    );

    if (!guid) return;

    setSaving(true);

    try {
      await requestJson(
        `${API_BASE_URL}/api/hr/permissions/workflow/${encodeURIComponent(guid)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorUserGuid: actor.actorUserGuid,
            actorName: actor.actorName,
            decision,
            notes: String(prompt.value || "").trim() || null
          })
        }
      );

      await loadWorkspace();

      await Swal.fire({
        icon: "success",
        title: approve ? "تم الاعتماد" : "تم الرفض",
        text: "تم تنفيذ القرار وتحديث مسار الطلب."
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تنفيذ القرار",
        text: error?.message || "حدث خطأ"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPolicyList = () => (
    <Stack spacing={1}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1}
      >
        <Alert severity="info" sx={{ flex: 1, borderRadius: 2, py: 0.3 }}>
          كل طلب جديد يأخذ نسخة مجمدة من المسار المطابق. تعديل المسار لاحقًا لا يغيّر الطلبات الجارية.
        </Alert>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={startNewPolicy}
          sx={{ bgcolor: primary, fontWeight: 900, whiteSpace: "nowrap" }}
        >
          مسار جديد
        </Button>
      </Stack>

      {!policies.length && !loading && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          لا توجد مسارات أذونات محفوظة. أنشئ مسارًا قبل استقبال طلبات الموظفين.
        </Alert>
      )}

      {policies.map((policy) => (
        <Paper
          key={policy.policyGuid || `${policy.policyName}-${policy.priority}`}
          variant="outlined"
          sx={{
            p: { xs: 1, sm: 1.25 },
            borderRadius: 2.3,
            borderColor: border,
            bgcolor: "#fff"
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            gap={1}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" gap={0.7} flexWrap="wrap">
                <Typography sx={{ fontWeight: 950, color: primaryDark }}>
                  {policy.policyName || "مسار بدون اسم"}
                </Typography>
                <Chip
                  size="small"
                  label={policy.isActive ? "فعال" : "متوقف"}
                  color={policy.isActive ? "success" : "default"}
                  sx={{ height: 22, fontWeight: 850 }}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`أولوية ${policy.priority}`}
                  sx={{ height: 22 }}
                />
              </Stack>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.45, fontSize: 11.5, lineHeight: 1.6 }}
              >
                {permissionTypeName(policy.permissionType)}
                {" • "}
                {orgUnitName(policy.sourceOrgUnitGuid)}
                {policy.sourceOrgUnitGuid && policy.includeDescendants
                  ? " وما تحتها"
                  : ""}
                {" • "}
                {policy.steps.length} خطوة
              </Typography>

              <Stack
                direction="row"
                flexWrap="wrap"
                useFlexGap
                gap={0.5}
                sx={{ mt: 0.75 }}
              >
                {policy.steps.map((step, index) => (
                  <Chip
                    key={`${policy.policyGuid}-step-${index}`}
                    size="small"
                    label={`${index + 1}. ${step.stepName}`}
                    variant="outlined"
                    sx={{ height: 24, fontSize: 11 }}
                  />
                ))}
              </Stack>
            </Box>

            <Stack
              direction="row"
              gap={0.6}
              alignItems="center"
              flexShrink={0}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={() => editPolicy(policy)}
                sx={{ fontWeight: 850 }}
              >
                تعديل
              </Button>

              <Button
                size="small"
                color={policy.isActive ? "warning" : "success"}
                onClick={() => togglePolicy(policy)}
                disabled={saving}
                sx={{ fontWeight: 850 }}
              >
                {policy.isActive ? "إيقاف" : "تفعيل"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const renderPolicyForm = () => (
    <Stack spacing={1.25}>
      <Alert severity="info" sx={{ borderRadius: 2, py: 0.3 }}>
        المسار يحدد من يوافق وبأي ترتيب. مصدر المسؤولين هو نفس الهيكل الإداري الموحد المستخدم في الموارد البشرية.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.25fr .75fr" },
          gap: 1,
          "& > *": { minWidth: 0 }
        }}
      >
        <TextField
          size="small"
          label="اسم المسار"
          value={form.policyName}
          onChange={(e) =>
            setForm((x) => ({ ...x, policyName: e.target.value }))
          }
          sx={inputSx}
          fullWidth
        />

        <TextField
          size="small"
          type="number"
          label="الأولوية"
          value={form.priority}
          onChange={(e) =>
            setForm((x) => ({ ...x, priority: e.target.value }))
          }
          inputProps={{ min: 1, dir: "ltr" }}
          sx={inputSx}
          fullWidth
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
          "& > *": { minWidth: 0 }
        }}
      >
        <FormControl size="small" fullWidth sx={inputSx}>
          <InputLabel>نوع الإذن</InputLabel>
          <Select
            label="نوع الإذن"
            value={form.permissionType}
            onChange={(e) =>
              setForm((x) => ({
                ...x,
                permissionType: e.target.value
              }))
            }
          >
            <MenuItem value="">كل أنواع الأذونات</MenuItem>
            {permissionTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          options={orgUnits}
          value={
            orgUnits.find(
              (x) =>
                String(unitGuid(x)) ===
                String(form.sourceOrgUnitGuid)
            ) || null
          }
          onChange={(_, value) =>
            setForm((x) => ({
              ...x,
              sourceOrgUnitGuid: value ? unitGuid(value) : ""
            }))
          }
          getOptionLabel={(option) => unitName(option)}
          isOptionEqualToValue={(a, b) =>
            String(unitGuid(a)) === String(unitGuid(b))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="تطبيق على وحدة - اختياري"
              placeholder="كل الهيكل"
              sx={inputSx}
            />
          )}
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{ p: 0.8, borderRadius: 2, borderColor: border, bgcolor: "#fff" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={0.5}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={form.includeDescendants}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    includeDescendants: e.target.checked
                  }))
                }
              />
            }
            label="يشمل الوحدات التابعة"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={(e) =>
                  setForm((x) => ({
                    ...x,
                    isActive: e.target.checked
                  }))
                }
              />
            }
            label="المسار فعال"
          />
        </Stack>
      </Paper>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Box>
          <Typography sx={{ fontWeight: 950, color: primaryDark }}>
            خطوات الموافقة
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 11 }}>
            ANY = موافقة أي شخص تكفي، ALL = موافقة جميع الأشخاص في الخطوة.
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={addStep}
          sx={{ fontWeight: 850, whiteSpace: "nowrap" }}
        >
          إضافة خطوة
        </Button>
      </Stack>

      {form.steps.map((step, index) => {
        const selectedPeople = employees.filter((employee) =>
          (step.approverUserGuids || [])
            .map(String)
            .includes(String(employeeGuid(employee)))
        );

        return (
          <Paper
            key={`permission-step-${index}`}
            variant="outlined"
            sx={{
              p: { xs: 1, sm: 1.2 },
              borderRadius: 2.3,
              borderColor: border,
              bgcolor: "#fff"
            }}
          >
            <Stack spacing={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
              >
                <Typography sx={{ fontWeight: 950, color: primaryDark }}>
                  الخطوة {index + 1}
                </Typography>

                <Stack direction="row" gap={0.2}>
                  <Tooltip title="لأعلى">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => moveStep(index, -1)}
                      >
                        <KeyboardArrowUpRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="لأسفل">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === form.steps.length - 1}
                        onClick={() => moveStep(index, 1)}
                      >
                        <KeyboardArrowDownRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="حذف الخطوة">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={form.steps.length <= 1}
                        onClick={() => removeStep(index)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1.2fr 1fr .7fr"
                  },
                  gap: 0.9,
                  "& > *": { minWidth: 0 }
                }}
              >
                <TextField
                  size="small"
                  label="اسم الخطوة"
                  value={step.stepName}
                  onChange={(e) =>
                    updateStep(index, { stepName: e.target.value })
                  }
                  sx={inputSx}
                  fullWidth
                />

                <FormControl size="small" fullWidth sx={inputSx}>
                  <InputLabel>مصدر الموافق</InputLabel>
                  <Select
                    label="مصدر الموافق"
                    value={step.approverSource}
                    onChange={(e) =>
                      updateStep(index, {
                        approverSource: e.target.value,
                        targetOrgUnitGuid: "",
                        approverUserGuids: []
                      })
                    }
                  >
                    {APPROVER_SOURCES.map((source) => (
                      <MenuItem key={source.value} value={source.value}>
                        {source.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={inputSx}>
                  <InputLabel>طريقة الموافقة</InputLabel>
                  <Select
                    label="طريقة الموافقة"
                    value={step.approvalMode}
                    onChange={(e) =>
                      updateStep(index, {
                        approvalMode: e.target.value
                      })
                    }
                  >
                    <MenuItem value="ANY">أي واحد يكفي</MenuItem>
                    <MenuItem value="ALL">موافقة الجميع</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {step.approverSource === "ORG_UNIT_MANAGER" && (
                <Autocomplete
                  options={orgUnits}
                  value={
                    orgUnits.find(
                      (x) =>
                        String(unitGuid(x)) ===
                        String(step.targetOrgUnitGuid)
                    ) || null
                  }
                  onChange={(_, value) =>
                    updateStep(index, {
                      targetOrgUnitGuid: value ? unitGuid(value) : ""
                    })
                  }
                  getOptionLabel={(option) => unitName(option)}
                  isOptionEqualToValue={(a, b) =>
                    String(unitGuid(a)) === String(unitGuid(b))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="الوحدة التي نأخذ مسؤوليها"
                      sx={inputSx}
                    />
                  )}
                />
              )}

              {step.approverSource === "SPECIFIC_USERS" && (
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={employees}
                  value={selectedPeople}
                  onChange={(_, values) =>
                    updateStep(index, {
                      approverUserGuids:
                        (values || [])
                          .map(employeeGuid)
                          .filter(Boolean)
                    })
                  }
                  getOptionLabel={(option) =>
                    `${employeeName(option)}${employeeCode(option) ? ` - ${employeeCode(option)}` : ""}`
                  }
                  isOptionEqualToValue={(a, b) =>
                    String(employeeGuid(a)) === String(employeeGuid(b))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="الموافقون بالاسم"
                      placeholder="اختر شخصًا أو أكثر"
                      sx={inputSx}
                    />
                  )}
                />
              )}

              <Alert severity="success" sx={{ py: 0.25, borderRadius: 1.7 }}>
                {APPROVER_SOURCES.find((x) => x.value === step.approverSource)?.description ||
                  "يتم تحديد الموافق من إعدادات المسار."}
              </Alert>
            </Stack>
          </Paper>
        );
      })}

      <TextField
        size="small"
        multiline
        minRows={2}
        label="ملاحظات المسار"
        value={form.notes}
        onChange={(e) =>
          setForm((x) => ({ ...x, notes: e.target.value }))
        }
        sx={inputSx}
        fullWidth
      />
    </Stack>
  );

  const renderApprovals = () => (
    <Stack spacing={1}>
      <Alert severity="info" sx={{ borderRadius: 2, py: 0.3 }}>
        تظهر هنا فقط الطلبات التي وصل دور موافقتك عليها من المسارات المجمدة.
      </Alert>

      {!approvals.length && !loading && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          لا توجد طلبات أذونات تنتظر موافقتك حاليًا.
        </Alert>
      )}

      {approvals.map((row, index) => {
        const guid = pick(row, "permissionGuid", "PermissionGuid") || index;
        const name =
          pick(row, "employeeName", "EmployeeName") || "موظف";
        const type =
          pick(row, "permissionType", "PermissionType");
        const typeName =
          pick(row, "permissionTypeName", "PermissionTypeName") ||
          permissionTypeName(type);
        const date =
          String(
            pick(row, "permissionDate", "PermissionDate") || ""
          ).slice(0, 10);
        const reason =
          pick(row, "reason", "Reason") || "";
        const role =
          pick(
            row,
            "currentApprovalRole",
            "CurrentApprovalRole",
            "stepName",
            "StepName"
          ) || "خطوة الموافقة الحالية";

        return (
          <Paper
            key={guid}
            variant="outlined"
            sx={{
              p: 1.15,
              borderRadius: 2.3,
              borderColor: border,
              bgcolor: "#fff"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              gap={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, color: primaryDark }}>
                  {name}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.3, fontSize: 11.5, lineHeight: 1.6 }}
                >
                  {typeName} • {date || "-"} • {role}
                </Typography>
                {reason && (
                  <Typography sx={{ mt: 0.45, fontSize: 12 }}>
                    {reason}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" gap={0.6} flexShrink={0}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => decideApproval(row, "APPROVE")}
                  disabled={saving}
                  sx={{ bgcolor: primary, fontWeight: 900 }}
                >
                  اعتماد
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => decideApproval(row, "REJECT")}
                  disabled={saving}
                  sx={{ fontWeight: 900 }}
                >
                  رفض
                </Button>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<RouteRoundedIcon />}
        onClick={openManager}
        sx={{
          color: "#fff",
          borderColor: "rgba(255,255,255,.55)",
          fontWeight: 900,
          whiteSpace: "nowrap",
          "&:hover": {
            borderColor: "#fff",
            bgcolor: "rgba(255,255,255,.08)"
          }
        }}
      >
        مسارات الأذونات
      </Button>

      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        fullWidth
        maxWidth="lg"
        dir="rtl"
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 12px)",
              sm: "calc(100% - 32px)",
              md: "min(1040px, calc(100% - 48px))"
            },
            maxWidth: "1040px !important",
            maxHeight: { xs: "95dvh", sm: "90vh" },
            m: { xs: 0.75, sm: 2 },
            borderRadius: { xs: 2.5, sm: 3 },
            overflow: "hidden",
            direction: "rtl"
          }
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 1.25, sm: 2 },
            py: { xs: 1.05, sm: 1.35 },
            borderBottom: `1px solid ${border}`,
            bgcolor: "#fff"
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 950,
                  fontSize: { xs: 15, sm: 18 },
                  color: primaryDark
                }}
              >
                إدارة الأذونات ومسارات الموافقات
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.2, fontSize: 11.5, lineHeight: 1.5 }}
              >
                الموافقون يأتون من نفس الهيكل الإداري الموحد، والمسار يثبت على الطلب لحظة إنشائه.
              </Typography>
            </Box>

            <Stack direction="row" gap={0.35} flexShrink={0}>
              <Tooltip title="تحديث">
                <span>
                  <IconButton
                    size="small"
                    disabled={loading || saving}
                    onClick={loadWorkspace}
                    sx={{ border: `1px solid ${border}` }}
                  >
                    <RefreshRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                disabled={saving}
                sx={{ border: `1px solid ${border}` }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <Box
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: `1px solid ${border}`,
            bgcolor: "#fff"
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                fontWeight: 900,
                fontSize: { xs: 11.5, sm: 12.5 }
              }
            }}
          >
            <Tab label={`المسارات الحالية (${policies.length})`} />
            <Tab label={form.policyGuid ? "تعديل المسار" : "إنشاء مسار"} />
            <Tab label={`موافقاتي (${approvals.length})`} />
          </Tabs>
        </Box>

        <DialogContent
          sx={{
            p: { xs: "12px !important", sm: "18px !important" },
            bgcolor: soft,
            overflowX: "hidden"
          }}
        >
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 1, fontSize: 12 }}>
                جاري تحميل إعدادات المسارات...
              </Typography>
            </Stack>
          ) : (
            <>
              {tab === 0 && renderPolicyList()}
              {tab === 1 && renderPolicyForm()}
              {tab === 2 && renderApprovals()}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 1.25, sm: 2 },
            py: 1.1,
            gap: 0.7,
            borderTop: `1px solid ${border}`,
            bgcolor: "#fff",
            justifyContent: "flex-start",
            flexWrap: "wrap"
          }}
        >
          {tab === 1 && (
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              disabled={saving || loading}
              onClick={savePolicy}
              sx={{
                bgcolor: primary,
                minWidth: 125,
                fontWeight: 900,
                "&:hover": { bgcolor: primaryDark }
              }}
            >
              {saving ? "جاري الحفظ..." : "حفظ المسار"}
            </Button>
          )}

          <Button
            onClick={() => setOpen(false)}
            disabled={saving}
            sx={{ fontWeight: 850, color: primary }}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
