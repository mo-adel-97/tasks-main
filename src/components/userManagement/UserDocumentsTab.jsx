import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";
import * as uiLayout from "../common/uiLayout";

// الدفاتر (المستندات) اللي تظهر للمستخدم في الشاشات، زي دفاتر استمارة الرسوم.
// المصدر: جدول RegSettingUser (نفس اللي الديسكتوب بيستخدمه في إعداد المستندات).
const FEES_FORM_DOC_TYPE = "88c5943d-4ff2-4a6e-8ac3-fee1f60298bc";

const readJson = async (response, fallback) => {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.error || fallback);
  return result;
};

// زرار الحفظ الرئيسي في صفحة المستخدم بيحفظ الدفاتر كمان (saveIfDirty) عشان مايتلخبطش مع زرار "حفظ الدفاتر".
const UserDocumentsTab = forwardRef(function UserDocumentsTab({ apiBaseUrl, actorGuid, targetUserGuid, targetUserName, border, primary }, ref) {
  const [docType, setDocType] = useState(FEES_FORM_DOC_TYPE);
  const [docTypes, setDocTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [initial, setInitial] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (type) => {
    if (!targetUserGuid) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid: actorGuid, docTypeGuid: type });
      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/${encodeURIComponent(targetUserGuid)}/documents?${params}`, { cache: "no-store" }),
        "تعذر تحميل الدفاتر"
      );
      const rows = Array.isArray(result?.data) ? result.data : [];
      const assigned = new Set(rows.filter((r) => r.assigned).map((r) => String(r.guid).toLowerCase()));
      setDocTypes(Array.isArray(result?.docTypes) ? result.docTypes : []);
      setDocuments(rows);
      setSelected(new Set(assigned));
      setInitial(new Set(assigned));
    } catch (e) {
      setError(e.message || "تعذر تحميل الدفاتر");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, actorGuid, targetUserGuid]);

  useEffect(() => {
    load(docType);
  }, [load, docType]);

  const groups = useMemo(() => {
    const q = search.trim();
    const map = new Map();
    documents
      .filter((d) => !q || d.name.includes(q) || d.branchName.includes(q) || String(d.code).includes(q))
      .forEach((d) => {
        const key = d.branchName || "بدون فرع";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(d);
      });
    return Array.from(map.entries());
  }, [documents, search]);

  const dirty = useMemo(() => {
    if (selected.size !== initial.size) return true;
    for (const g of selected) if (!initial.has(g)) return true;
    return false;
  }, [selected, initial]);

  const toggle = (guid) => {
    const key = String(guid).toLowerCase();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroup = (docs) => {
    const keys = docs.map((d) => String(d.guid).toLowerCase());
    const allOn = keys.every((k) => selected.has(k));
    setSelected((current) => {
      const next = new Set(current);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const persist = useCallback(async () => {
    const result = await readJson(
        await fetch(`${apiBaseUrl}/api/user-management/${encodeURIComponent(targetUserGuid)}/documents`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid: actorGuid, docTypeGuid: docType, regSettingGuids: Array.from(selected) })
        }),
        "تعذر حفظ الدفاتر"
      );
    setInitial(new Set(selected));
    load(docType);
    return result;
  }, [apiBaseUrl, actorGuid, targetUserGuid, docType, selected, load]);

  useImperativeHandle(ref, () => ({
    isDirty: () => dirty,
    saveIfDirty: async () => (dirty && targetUserGuid ? persist() : null)
  }), [dirty, targetUserGuid, persist]);

  const save = async () => {
    setSaving(true);
    try {
      const result = await persist();
      await Swal.fire({ icon: "success", title: "تم الحفظ", text: result?.message || "تم حفظ دفاتر المستخدم بنجاح" });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e.message || "تعذر حفظ الدفاتر" });
    } finally {
      setSaving(false);
    }
  };

  if (!targetUserGuid) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">اختر مستخدمًا محفوظًا أولًا لتحديد الدفاتر التي تظهر له.</Alert>
      </Box>
    );
  }

  const typeName = docTypes.find((t) => String(t.guid).toLowerCase() === docType)?.name || "استمارة رسوم";

  return (
    <Box sx={{ p: { xs: 0.75, sm: 1.25, md: 1.5 }, display: "grid", gap: 1.25 }}>
      <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
        حدد الدفاتر التي تظهر للمستخدم <b>{targetUserName}</b> عند إنشاء مستند من نوع «{typeName}».
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="user-docs-type">نوع المستند</InputLabel>
          <Select
            labelId="user-docs-type"
            id="user-docs-type-select"
            label="نوع المستند"
            value={docType}
            onChange={(e) => setDocType(String(e.target.value).toLowerCase())}
          >
            {docTypes.length === 0 && <MenuItem value={FEES_FORM_DOC_TYPE}>استمارة رسوم</MenuItem>}
            {docTypes.map((t) => (
              <MenuItem key={t.guid} value={String(t.guid).toLowerCase()}>
                {t.name || "بدون اسم"} ({t.assigned}/{t.docs})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          id="user-docs-search"
          size="small"
          placeholder="بحث باسم الدفتر أو الفرع"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 0 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />

        <Chip label={`المحدد: ${selected.size} من ${documents.length}`} sx={{ fontWeight: 700 }} />

        <Button
          sx={uiLayout.buttonSx}
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={!dirty || saving || loading}
          onClick={save}
        >
          حفظ الدفاتر
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ p: 3, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
      ) : groups.length === 0 ? (
        <Alert severity="info">لا توجد دفاتر مطابقة.</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {groups.map(([branch, docs]) => {
            const keys = docs.map((d) => String(d.guid).toLowerCase());
            const on = keys.filter((k) => selected.has(k)).length;
            return (
              <Box key={branch} sx={{ border: `1px solid ${border}`, borderRadius: 1.5, overflow: "hidden", minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 1.25, py: 0.6, bgcolor: "action.hover", borderBottom: `1px solid ${border}` }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: primary }}>{branch}</Typography>
                  <Button size="small" onClick={() => toggleGroup(docs)} sx={{ fontSize: 12 }}>
                    {on === docs.length ? "إلغاء الكل" : "الكل"} ({on}/{docs.length})
                  </Button>
                </Stack>
                <Box sx={{ px: 1, py: 0.5, display: "grid" }}>
                  {docs.map((d) => (
                    <FormControlLabel
                      key={d.guid}
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          id={`user-doc-${d.guid}`}
                          size="small"
                          checked={selected.has(String(d.guid).toLowerCase())}
                          onChange={() => toggle(d.guid)}
                        />
                      }
                      label={<Typography sx={{ fontSize: 13.5 }}>{d.name}</Typography>}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
});

export default UserDocumentsTab;
