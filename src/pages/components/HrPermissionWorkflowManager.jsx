import * as uiLayout from '../../components/common/uiLayout';
import '../rtl-forms-fix.css';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f6faf8";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getStoredUserGuid = (user) => {
  const candidate =
    user?.userGuid ||
    user?.UserGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    user?.sellerGuid ||
    user?.SellerGuid ||
    localStorage.getItem("userGuid") ||
    localStorage.getItem("UserGuid") ||
    localStorage.getItem("guid") ||
    "";

  const value = String(candidate || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : "";
};

const getActor = () => {
  const user = getStoredUser();
  return {
    actorUserGuid: getStoredUserGuid(user) || null,
    actorName:
      user?.fullName ||
      user?.FullName ||
      user?.ManFullName ||
      user?.manFullName ||
      user?.userName ||
      user?.UserName ||
      user?.name ||
      user?.Name ||
      "مستخدم النظام"
  };
};

const emptyStep = (name = "المسؤول المباشر", source = "ORG_DIRECT_MANAGER", targetOrgUnitGuid = "") => ({
  stepName: name,
  approverSource: source,
  targetOrgUnitGuid,
  approvalMode: "ANY",
  approverUserGuids: []
});

const emptyPolicy = () => ({
  policyGuid: null,
  policyName: "مسار اعتماد الأذونات",
  permissionType: "",
  sourceOrgUnitGuid: "",
  includeDescendants: true,
  priority: 100,
  isActive: true,
  notes: "",
  steps: [emptyStep()]
});

const typeName = (type) => ({
  1: "تأخير حضور",
  2: "انصراف مبكر",
  3: "خروج أثناء الدوام",
  4: "إذن يوم كامل"
}[Number(type)] || "كل أنواع الأذونات");

const sourceName = (source) => ({
  ORG_DIRECT_MANAGER: "المسؤول المباشر للموظف",
  ORG_PARENT_MANAGER: "المسؤول الأعلى من مدير الموظف",
  ORG_ROOT_MANAGER: "الإدارة العليا",
  ORG_UNIT_MANAGER: "مسؤولو إدارة / وحدة محددة",
  SPECIFIC_USERS: "أشخاص محددون بالاسم"
}[source] || source || "غير محدد");

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");

const isHrUnitRecord = (unit) => {
  const name = normalizeText(unit?.unitName);
  const code = normalizeText(unit?.unitCode);
  return (
    name.includes("الموارد البشريه") ||
    name.includes("موارد بشريه") ||
    name.includes("اداره الموارد البشريه") ||
    name.includes("human resources") ||
    code === "hr" ||
    code.startsWith("hr-") ||
    code.startsWith("hr ")
  );
};

export default function HrPermissionWorkflowManager({ buttonColor = "#fff", buttonTextColor = "#034d31" }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ permissionTypes: [], approverSources: [], units: [], employees: [] });
  const [policies, setPolicies] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [form, setForm] = useState(emptyPolicy());

  const actor = useMemo(() => getActor(), [open]);
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(actor.actorUserGuid ? { "X-User-Guid": actor.actorUserGuid } : {})
    }),
    [actor.actorUserGuid]
  );

  const units = Array.isArray(config?.units) ? config.units : [];
  const employees = Array.isArray(config?.employees) ? config.employees : [];

  const unitName = useCallback(
    (guid) => units.find((u) => String(u.orgUnitGuid) === String(guid))?.unitName || "",
    [units]
  );

  const hrUnit = useMemo(
    () => units.find((unit) => isHrUnitRecord(unit)) || null,
    [units]
  );

  const isHrStep = useCallback((step) => {
    if (!step) return false;
    if (step.approverSource === "HR_MANAGER") return true;
    if (normalizeText(step.stepName).includes("الموارد البشريه")) return true;
    return (
      step.approverSource === "ORG_UNIT_MANAGER" &&
      hrUnit?.orgUnitGuid &&
      String(step.targetOrgUnitGuid || "") === String(hrUnit.orgUnitGuid)
    );
  }, [hrUnit]);

  const automaticHrStep = useMemo(() => ({
    stepName: "الموارد البشرية",
    approverSource: "ORG_UNIT_MANAGER",
    targetOrgUnitGuid: hrUnit?.orgUnitGuid || "",
    approvalMode: "ANY",
    approverUserGuids: []
  }), [hrUnit]);

  const employeeName = useCallback(
    (guid) => employees.find((u) => String(u.employeeGuid) === String(guid))?.employeeName || "",
    [employees]
  );

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const approvalsUrl = `${API_BASE_URL}/api/hr/permissions/workflow/my-approvals?actorUserGuid=${encodeURIComponent(actor.actorUserGuid || "")}`;
      const [c, p, a] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hr/permissions/workflow/config`, { cache: "no-store", headers }),
        fetch(`${API_BASE_URL}/api/hr/permissions/workflow/policies`, { cache: "no-store", headers }),
        actor.actorUserGuid ? fetch(approvalsUrl, { cache: "no-store", headers }) : Promise.resolve(null)
      ]);

      const cj = await c.json().catch(() => null);
      const pj = await p.json().catch(() => null);
      const aj = a ? await a.json().catch(() => null) : null;

      if (!c.ok) throw new Error(cj?.message || "تعذر تحميل إعدادات الأذونات");
      if (!p.ok) throw new Error(pj?.message || "تعذر تحميل مسارات الاعتماد");

      setConfig(cj?.data || { permissionTypes: [], approverSources: [], units: [], employees: [] });
      setPolicies(Array.isArray(pj?.data) ? pj.data : []);
      setApprovals(Array.isArray(aj?.data) ? aj.data : []);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر تحميل إعدادات الاعتماد",
        text: e?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  }, [open, actor.actorUserGuid, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const addStep = (step = emptyStep()) => {
    setForm((x) => ({ ...x, steps: [...x.steps, step] }));
  };

  const addExecutiveStep = () => {
    addStep(emptyStep("الإدارة العليا", "ORG_ROOT_MANAGER"));
  };

  const updateStep = (index, patch) => {
    setForm((x) => ({
      ...x,
      steps: x.steps.map((step, i) => (i === index ? { ...step, ...patch } : step))
    }));
  };

  const removeStep = (index) => {
    setForm((x) => ({
      ...x,
      steps: x.steps.length <= 1 ? x.steps : x.steps.filter((_, i) => i !== index)
    }));
  };

  const moveStep = (index, direction) => {
    setForm((x) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= x.steps.length) return x;
      const steps = [...x.steps];
      [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
      return { ...x, steps };
    });
  };

  const editPolicy = (row) => {
    setForm({
      policyGuid: row.policyGuid,
      policyName: row.policyName || "",
      permissionType: row.permissionType ?? "",
      sourceOrgUnitGuid: row.sourceOrgUnitGuid || "",
      includeDescendants: row.includeDescendants !== false,
      priority: row.priority ?? 100,
      isActive: row.isActive !== false,
      notes: row.notes || "",
      steps: (() => {
        const editable = (row.steps || [])
          .filter((step) => !isHrStep(step))
          .map((s) => ({
            stepName: s.stepName || sourceName(s.approverSource),
            approverSource: s.approverSource || "ORG_DIRECT_MANAGER",
            targetOrgUnitGuid: s.targetOrgUnitGuid || "",
            approvalMode: s.approvalMode || "ANY",
            approverUserGuids: (s.approvers || []).map((u) => u.approverUserGuid).filter(Boolean)
          }));
        return editable.length ? editable : [emptyStep()];
      })()
    });
    setTab(1);
  };

  const stepDestination = (step) => {
    if (step.approverSource === "ORG_UNIT_MANAGER") {
      return step.targetOrgUnitGuid
        ? `مسؤولو ${unitName(step.targetOrgUnitGuid) || "الوحدة المحددة"}`
        : "اختر الإدارة / الوحدة التي سيذهب إليها الطلب";
    }

    if (step.approverSource === "SPECIFIC_USERS") {
      const names = (step.approverUserGuids || []).map(employeeName).filter(Boolean);
      return names.length ? names.join("، ") : "اختر الشخص أو الأشخاص الذين سيعتمدون هذه الخطوة";
    }

    return sourceName(step.approverSource);
  };

  const validatePolicy = () => {
    if (!actor.actorUserGuid) return "تعذر تحديد المستخدم الحالي";
    if (!form.policyName.trim()) return "اكتب اسمًا واضحًا للمسار";
    if (!form.steps.length) return "أضف خطوة اعتماد واحدة على الأقل قبل الموارد البشرية";
    if (!hrUnit?.orgUnitGuid) {
      return "لم يتم العثور على وحدة الموارد البشرية في الهيكل الإداري. اضبط وحدة الموارد البشرية ومسؤولها أولًا من الهيكل الإداري.";
    }

    for (let index = 0; index < form.steps.length; index += 1) {
      const step = form.steps[index];
      if (!String(step.stepName || "").trim()) {
        return `اكتب اسم الخطوة رقم ${index + 1}`;
      }
      if (step.approverSource === "ORG_UNIT_MANAGER" && !step.targetOrgUnitGuid) {
        return `اختر الإدارة / الوحدة في الخطوة رقم ${index + 1}`;
      }
      if (step.approverSource === "ORG_UNIT_MANAGER" && String(step.targetOrgUnitGuid) === String(hrUnit.orgUnitGuid)) {
        return "الموارد البشرية مرحلة أخيرة ثابتة وتُضاف تلقائيًا؛ لا تضفها كخطوة يدوية.";
      }
      if (step.approverSource === "SPECIFIC_USERS" && !(step.approverUserGuids || []).length) {
        return `اختر شخصًا واحدًا على الأقل في الخطوة رقم ${index + 1}`;
      }
    }

    return "";
  };

  const savePolicy = async () => {
    const validation = validatePolicy();
    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: "راجع مسار الاعتماد",
        text: validation
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/permissions/workflow/policy`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          permissionType: form.permissionType === "" ? null : Number(form.permissionType),
          sourceOrgUnitGuid: form.sourceOrgUnitGuid || null,
          actorUserGuid: actor.actorUserGuid,
          steps: [...form.steps, automaticHrStep].map((s) => ({
            ...s,
            targetOrgUnitGuid: s.approverSource === "ORG_UNIT_MANAGER" ? s.targetOrgUnitGuid || null : null,
            approverUserGuids: s.approverSource === "SPECIFIC_USERS" ? s.approverUserGuids : []
          }))
        })
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر حفظ مسار الاعتماد");

      await Swal.fire({
        icon: "success",
        title: "تم حفظ مسار الاعتماد",
        text: "أي طلب جديد مطابق لهذا المسار سيمر على الخطوات بالترتيب ثم ينتقل تلقائيًا إلى الموارد البشرية كمرحلة أخيرة."
      });

      setForm(emptyPolicy());
      setTab(0);
      await load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر حفظ المسار",
        text: e?.message || "حدث خطأ"
      });
    } finally {
      setLoading(false);
    }
  };

  const decide = async (row, decision) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hr/permissions/workflow/${row.permissionGuid}/decision`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          actorUserGuid: actor.actorUserGuid,
          actorName: actor.actorName,
          decision,
          notes: ""
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || "تعذر تنفيذ القرار");
      await load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر تنفيذ القرار", text: e?.message || "حدث خطأ" });
    } finally {
      setLoading(false);
    }
  };

  const renderSavedPolicies = () => (
    <Stack spacing={1.2}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2.5, borderColor: border, bgcolor: "#fff" }}>
        <Typography sx={{ fontWeight: 950, color: primaryDark, mb: 0.35 }}>
          كيف يعمل المسار؟
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.8 }}>
          الطلب يبدأ من أول خطوة ثم ينتقل للخطوة التالية بعد اعتمادها. الموارد البشرية مرحلة نهائية ثابتة في أذونات الموظفين وتُضاف تلقائيًا عند حفظ المسار؛ لا تحتاج لإضافتها يدويًا.
        </Typography>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
        <Box>
          <Typography sx={{ fontWeight: 950 }}>المسارات المحفوظة</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            كل مسار يحدد من يعتمد الطلب وبأي ترتيب.
          </Typography>
        </Box>
        <Button
          startIcon={<AddRoundedIcon />}
          variant="contained"
          onClick={() => {
            setForm(emptyPolicy());
            setTab(1);
          }}
          sx={uiLayout.withUiSx({ alignSelf: { xs: "stretch", sm: "center" } }, uiLayout.buttonSx)}
        >
          إنشاء مسار اعتماد
        </Button>
      </Stack>

      {policies.map((policy) => (
        <Paper
          key={policy.policyGuid}
          variant="outlined"
          sx={{ p: 1.25, borderRadius: 2.5, borderColor: border, cursor: "pointer", bgcolor: "#fff" }}
          onClick={() => editPolicy(policy)}
        >
          <Stack spacing={0.8}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={0.8}>
              <Box>
                <Stack direction="row" gap={0.6} alignItems="center" flexWrap="wrap">
                  <Typography sx={{ fontWeight: 950, color: primaryDark }}>{policy.policyName}</Typography>
                  <Chip
                    size="small"
                    color={policy.isActive === false ? "default" : "success"}
                    label={policy.isActive === false ? "متوقف" : "فعال"}
                    sx={{ height: 22, fontWeight: 850 }}
                  />
                </Stack>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.35 }}>
                  يطبق على: {typeName(policy.permissionType)} • {policy.sourceOrgUnitName || "كل الوحدات"}
                  {policy.sourceOrgUnitGuid && policy.includeDescendants ? " والوحدات التابعة لها" : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                ترتيب التطبيق: {policy.priority ?? 100}
              </Typography>
            </Stack>

            <Box sx={{ p: 0.9, borderRadius: 2, bgcolor: soft, border: `1px solid ${border}` }}>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", mb: 0.6 }}>
                رحلة الطلب
              </Typography>
              <Stack direction="row" gap={0.55} flexWrap="wrap" useFlexGap alignItems="center">
                <Chip size="small" icon={<PersonRoundedIcon />} label="الموظف" variant="outlined" />
                {(policy.steps || []).map((step, index) => (
                  <React.Fragment key={step.policyStepGuid || `${policy.policyGuid}-${index}`}>
                    <Typography sx={{ color: "text.disabled", fontWeight: 900 }}>←</Typography>
                    <Chip
                      size="small"
                      color={isHrStep(step) ? "success" : "default"}
                      label={`${index + 1}. ${step.stepName || sourceName(step.approverSource)}`}
                      sx={{ fontWeight: 850 }}
                    />
                  </React.Fragment>
                ))}
                {!(policy.steps || []).some((step) => isHrStep(step)) && (
                  <>
                    <Typography sx={{ color: "text.disabled", fontWeight: 900 }}>←</Typography>
                    <Chip
                      size="small"
                      color="warning"
                      label="الموارد البشرية — تُضاف عند إعادة حفظ المسار"
                      sx={{ fontWeight: 850 }}
                    />
                  </>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ))}

      {!policies.length && (
        <Alert severity="info" sx={{ borderRadius: 2.5 }}>
          لا يوجد مسار مخصص محفوظ حاليًا. أنشئ المسار وحدد الخطوات التي تسبق الموارد البشرية؛ الموارد البشرية ستُضاف تلقائيًا كآخر مرحلة عند الحفظ.
        </Alert>
      )}
    </Stack>
  );

  const renderPolicyForm = () => (
    <Stack spacing={1.35}>
      <Alert severity="info" sx={{ borderRadius: 2.5 }}>
        حدد على من يطبق المسار ورتّب الموافقات التي تسبق الموارد البشرية. الموارد البشرية مرحلة أخيرة ثابتة وتُضاف تلقائيًا عند الحفظ.
      </Alert>

      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, borderColor: border, bgcolor: "#fff" }}>
        <Typography sx={{ fontWeight: 950, color: primaryDark, mb: 1 }}>1) نطاق المسار</Typography>
        <Box
          sx={uiLayout.withUiSx({
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1.3fr" },
            gap: 1
          }, uiLayout.formSectionSx)}
        >
          <TextField
            sx={uiLayout.formFieldSx}
            InputLabelProps={{ shrink: true }}
            size="small"
            label="اسم المسار"
            helperText="اسم للتعريف فقط، مثل: أذونات موظفي الفروع"
            value={form.policyName}
            onChange={(e) => setForm((x) => ({ ...x, policyName: e.target.value }))}
          />

          <FormControl sx={uiLayout.formFieldSx} size="small">
            <InputLabel>نوع الإذن الذي ينطبق عليه</InputLabel>
            <Select
              label="نوع الإذن الذي ينطبق عليه"
              value={form.permissionType}
              onChange={(e) => setForm((x) => ({ ...x, permissionType: e.target.value }))}
            >
              <MenuItem value="">كل أنواع الأذونات</MenuItem>
              {(config.permissionTypes || []).map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={uiLayout.formFieldSx} size="small">
            <InputLabel>موظفو أي وحدة؟</InputLabel>
            <Select
              label="موظفو أي وحدة؟"
              value={form.sourceOrgUnitGuid}
              onChange={(e) => setForm((x) => ({ ...x, sourceOrgUnitGuid: e.target.value }))}
            >
              <MenuItem value="">كل الوحدات / كل الموظفين</MenuItem>
              {units.map((unit) => (
                <MenuItem key={unit.orgUnitGuid} value={unit.orgUnitGuid}>{unit.unitName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={uiLayout.formFieldSx} size="small">
            <InputLabel>هل يشمل الوحدات التابعة؟</InputLabel>
            <Select
              label="هل يشمل الوحدات التابعة؟"
              value={form.includeDescendants ? "yes" : "no"}
              onChange={(e) => setForm((x) => ({ ...x, includeDescendants: e.target.value === "yes" }))}
            >
              <MenuItem value="yes">نعم، الوحدة وكل ما يتبعها</MenuItem>
              <MenuItem value="no">لا، هذه الوحدة فقط</MenuItem>
            </Select>
          </FormControl>

          <TextField
            sx={uiLayout.formFieldSx}
            InputLabelProps={{ shrink: true }}
            size="small"
            type="number"
            label="ترتيب التطبيق"
            helperText="يُستخدم عند وجود أكثر من مسار مطابق"
            value={form.priority}
            onChange={(e) => setForm((x) => ({ ...x, priority: Number(e.target.value || 100) }))}
            inputProps={{ dir: "ltr", min: 1, style: { direction: "ltr", unicodeBidi: "isolate" } }}
          />

          <FormControl sx={uiLayout.formFieldSx} size="small">
            <InputLabel>حالة المسار</InputLabel>
            <Select
              label="حالة المسار"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm((x) => ({ ...x, isActive: e.target.value === "active" }))}
            >
              <MenuItem value="active">فعال ويستقبل طلبات جديدة</MenuItem>
              <MenuItem value="inactive">متوقف مؤقتًا</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, borderColor: border, bgcolor: "#fff" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1} sx={{ mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 950, color: primaryDark }}>2) ترتيب جهات الاعتماد</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              هذه الخطوات تسبق الموارد البشرية. بعد اكتمالها ينتقل الطلب تلقائيًا إلى الموارد البشرية كآخر مرحلة.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={0.6}>
            <Button size="small" variant="outlined" startIcon={<AccountBalanceRoundedIcon />} onClick={addExecutiveStep}>
              إضافة الإدارة العليا قبل الموارد البشرية
            </Button>
            <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => addStep()}>
              خطوة أخرى
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1}>
          {form.steps.map((step, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={uiLayout.withUiSx({ p: 1.1, borderRadius: 2.5, borderColor: border, bgcolor: soft }, uiLayout.formSectionSx)}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 950, color: primaryDark }}>الموافقة رقم {index + 1}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                      سيذهب الطلب هنا إلى: <strong>{stepDestination(step)}</strong>
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={0.1}>
                    <IconButton size="small" disabled={index === 0} onClick={() => moveStep(index, -1)}>
                      <KeyboardArrowUpRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === form.steps.length - 1} onClick={() => moveStep(index, 1)}>
                      <KeyboardArrowDownRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" disabled={form.steps.length === 1} onClick={() => removeStep(index)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box
                  sx={uiLayout.withUiSx({
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.25fr 1fr" },
                    gap: 1
                  }, uiLayout.formSectionSx)}
                >
                  <TextField
                    sx={uiLayout.formFieldSx}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    label="اسم الخطوة الظاهر للمستخدم"
                    value={step.stepName}
                    onChange={(e) => updateStep(index, { stepName: e.target.value })}
                  />

                  <FormControl sx={uiLayout.formFieldSx} size="small">
                    <InputLabel>من يعتمد هذه الخطوة؟</InputLabel>
                    <Select
                      label="من يعتمد هذه الخطوة؟"
                      value={step.approverSource}
                      onChange={(e) => {
                        const source = e.target.value;
                        updateStep(index, {
                          approverSource: source,
                          targetOrgUnitGuid: "",
                          approverUserGuids: [],
                          stepName: source === "ORG_DIRECT_MANAGER"
                            ? "المسؤول المباشر"
                            : source === "ORG_PARENT_MANAGER"
                              ? "المسؤول الأعلى"
                              : source === "ORG_ROOT_MANAGER"
                                ? "الإدارة العليا"
                                : source === "ORG_UNIT_MANAGER"
                                  ? "إدارة / وحدة محددة"
                                  : source === "SPECIFIC_USERS"
                                    ? "أشخاص محددون"
                                    : step.stepName
                        });
                      }}
                    >
                      {(config.approverSources || []).map((source) => (
                        <MenuItem key={source.value} value={source.value}>
                          {sourceName(source.value)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={uiLayout.formFieldSx} size="small">
                    <InputLabel>إذا كان هناك أكثر من مسؤول</InputLabel>
                    <Select
                      label="إذا كان هناك أكثر من مسؤول"
                      value={step.approvalMode}
                      onChange={(e) => updateStep(index, { approvalMode: e.target.value })}
                    >
                      <MenuItem value="ANY">يكفي اعتماد شخص واحد</MenuItem>
                      <MenuItem value="ALL">يجب اعتماد جميع المسؤولين</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {step.approverSource === "ORG_UNIT_MANAGER" && (
                  <FormControl size="small" fullWidth sx={uiLayout.formFieldSx}>
                    <InputLabel>اختر الإدارة / الوحدة التي سيذهب إليها الطلب</InputLabel>
                    <Select
                      label="اختر الإدارة / الوحدة التي سيذهب إليها الطلب"
                      value={step.targetOrgUnitGuid}
                      onChange={(e) => {
                        const selectedGuid = e.target.value;
                        const selectedName = unitName(selectedGuid);
                        updateStep(index, {
                          targetOrgUnitGuid: selectedGuid,
                          stepName: selectedName || step.stepName
                        });
                      }}
                    >
                      {units.filter((unit) => !isHrUnitRecord(unit)).map((unit) => (
                        <MenuItem key={unit.orgUnitGuid} value={unit.orgUnitGuid}>{unit.unitName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {step.approverSource === "SPECIFIC_USERS" && (
                  <Autocomplete
                    multiple
                    options={employees}
                    getOptionLabel={(option) => option.employeeName || ""}
                    value={employees.filter((u) => (step.approverUserGuids || []).includes(u.employeeGuid))}
                    onChange={(_, values) => updateStep(index, { approverUserGuids: values.map((x) => x.employeeGuid) })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={uiLayout.formFieldSx}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        label="اختر الأشخاص الذين سيعتمدون هذه الخطوة"
                      />
                    )}
                  />
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            mt: 1.2,
            p: 1.15,
            borderRadius: 2.5,
            borderColor: hrUnit?.orgUnitGuid ? "rgba(5,117,70,.32)" : "rgba(183,121,31,.4)",
            bgcolor: hrUnit?.orgUnitGuid ? "#edf8f2" : "#fff8e8"
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.8}>
            <Box>
              <Typography sx={{ fontWeight: 1000, color: primaryDark }}>
                الموافقة رقم {form.steps.length + 1} — الموارد البشرية (تلقائيًا)
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25, lineHeight: 1.7 }}>
                بعد اكتمال الخطوات السابقة ينتقل الطلب تلقائيًا إلى مسؤولي الموارد البشرية، ثم يكتمل الاعتماد النهائي. هذه المرحلة ثابتة ولا تحتاج إلى زر إضافة.
              </Typography>
            </Box>
            <Chip
              size="small"
              color={hrUnit?.orgUnitGuid ? "success" : "warning"}
              label={hrUnit?.unitName || "لم يتم العثور على وحدة الموارد البشرية"}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 900 }}
            />
          </Stack>
        </Paper>
      </Paper>

      <TextField
        sx={uiLayout.formFieldSx}
        InputLabelProps={{ shrink: true }}
        multiline
        minRows={2}
        label="ملاحظات داخلية على المسار - اختياري"
        value={form.notes}
        onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
      />
    </Stack>
  );

  const renderMyApprovals = () => (
    <Stack spacing={1}>
      <Alert severity="success" icon={<FactCheckRoundedIcon />} sx={{ borderRadius: 2.5 }}>
        هذه الطلبات عندك الآن لأنك المسؤول عن المرحلة الحالية. إذا كانت هذه آخر موافقة قبل الموارد البشرية فسينتقل الطلب بعدها تلقائيًا إلى الموارد البشرية.
      </Alert>

      {approvals.map((row) => (
        <Paper key={row.permissionGuid} variant="outlined" sx={{ p: 1.15, borderRadius: 2.5, borderColor: border }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ fontWeight: 950, color: primaryDark }}>{row.employeeName}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                {typeName(row.permissionType)} • {row.permissionDate?.slice?.(0, 10) || row.permissionDate}
              </Typography>
              <Typography sx={{ fontSize: 12.5, mt: 0.45 }}>
                سبب الطلب: {row.reason || "-"}
              </Typography>
              <Typography sx={{ fontSize: 12.5, mt: 0.45, fontWeight: 850 }}>
                الطلب عندك بصفة: {row.stepName || "الموافق الحالي"}
              </Typography>
            </Box>
            <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.7} alignItems="center">
              <Button sx={uiLayout.buttonSx} color="error" variant="outlined" onClick={() => decide(row, "REJECT")}>رفض</Button>
              <Button sx={uiLayout.buttonSx} color="success" variant="contained" onClick={() => decide(row, "APPROVE")}>اعتماد</Button>
            </Stack>
          </Stack>
        </Paper>
      ))}

      {!approvals.length && <Alert severity="info">لا توجد طلبات أذونات تنتظر قرارك حاليًا.</Alert>}
    </Stack>
  );

  return (
    <>
      <Button
        variant="contained"
        startIcon={<SettingsSuggestRoundedIcon />}
        onClick={() => setOpen(true)}
        sx={uiLayout.withUiSx({
          bgcolor: buttonColor,
          color: buttonTextColor,
          fontWeight: 900,
          "&:hover": { bgcolor: buttonColor, opacity: 0.92 }
        }, uiLayout.buttonSx)}
      >
        تحديد جهة الاعتماد
      </Button>

      <Dialog
        sx={uiLayout.dialogLayoutSx}
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        dir="rtl"
        PaperProps={{
          sx: {
            width: { xs: "calc(100% - 12px)", sm: "min(980px, calc(100% - 32px))" },
            maxWidth: "980px !important",
            maxHeight: { xs: "95dvh", sm: "90vh" },
            borderRadius: 3,
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${border}`, py: 1.35 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box>
              <Typography sx={{ fontWeight: 1000, fontSize: { xs: 17, sm: 20 }, color: primaryDark }}>
                مسار اعتماد أذونات الموظفين
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25, lineHeight: 1.7 }}>
                هنا تحدد بوضوح الموافقات التي تسبق الموارد البشرية. الموارد البشرية مرحلة أخيرة ثابتة في كل مسار اعتماد أذونات.
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
          </Stack>
        </DialogTitle>

        <Box sx={{ px: { xs: 1, sm: 2 }, borderBottom: `1px solid ${border}`, bgcolor: "#fff" }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
            <Tab label={`المسارات المحفوظة (${policies.length})`} />
            <Tab label={form.policyGuid ? "تعديل المسار" : "إنشاء مسار"} />
            <Tab label={`طلبات عندي (${approvals.length})`} />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ bgcolor: soft, p: { xs: 1.25, sm: 2 } }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <Typography color="text.secondary">جاري تحميل إعدادات الاعتماد...</Typography>
            </Stack>
          ) : (
            <>
              {tab === 0 && renderSavedPolicies()}
              {tab === 1 && renderPolicyForm()}
              {tab === 2 && renderMyApprovals()}
            </>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          {tab === 1 && (
            <Button sx={uiLayout.buttonSx} variant="contained" onClick={savePolicy} disabled={loading}>
              حفظ مسار الاعتماد
            </Button>
          )}
          <Button sx={uiLayout.buttonSx} onClick={() => setOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
