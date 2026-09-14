import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
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
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import SelectAllIcon from "@mui/icons-material/SelectAll";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";
const ZERO_GUID = "00000000-0000-0000-0000-000000000000";

/*
 * UserJop يظل هو الـ Legacy index القديم كما هو.
 * أسماء الوظائف نفسها تأتي من HR_JobTitle.
 * لا نستخدم index الخاص بـ map نهائياً عند الحفظ.
 */

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = readUser();

const getUserGuid = () =>
  String(
    currentUser?.guid ||
    currentUser?.Guid ||
    currentUser?.userGuid ||
    currentUser?.UserGuid ||
    ""
  ).trim();

const norm = (value) =>
  String(value ?? "").trim().toLowerCase();

const emptyUser = () => ({
  guid: "",
  code: "",
  fullName: "",
  userName: "",
  password: "",
  isUse: true,

  // فروع مخصصة للتقارير
  chkBranch: false,
  branchGuid: ZERO_GUID,
  branchName: "",

  // بيانات وظيفية
  chkAmount: false,
  chkOtherFess: false,
  sellerGuid: ZERO_GUID,
  sellerName: "",
  branchForWork: ZERO_GUID,
  branchForWorkName: "",
  chkTrainer: false,
  trainerGuid: ZERO_GUID,
  trainerName: "",
  userJop: -1,
  departmentGuid: ZERO_GUID,
  departmentName: "",
  chkAccept: false,

  // موجودة في ShowUserInfo بالديسكتوب، لكن الحفظ القديم معلق.
  chkAllowCompany: false
});

const emptyPermission = (form) => ({
  name: form?.name || "",
  guid: form?.guid || "",
  add: false,
  edit: false,
  del: false,
  print: false,
  find: false,
  view: false
});

function LookupDialog({
  open,
  title,
  rows,
  loading,
  search,
  setSearch,
  onClose,
  onPick,
  columns = []
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.5, sm: 2.5 },
          maxHeight: { xs: "92vh", sm: "82vh" },
          m: { xs: 1, sm: 2 }
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 900,
          fontSize: { xs: 18, sm: 22 },
          py: { xs: 1, sm: 1.5 }
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 1, sm: 2 } }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{
            mb: { xs: 0.7, sm: 1 },
            "& .MuiInputBase-root": {
              minHeight: { xs: 34, sm: 38 }
            },
            "& input": {
              fontSize: { xs: 11.5, sm: 13 }
            }
          }}
        />

        {loading ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 0.7
            }}
          >
            {rows.map((row, index) => (
              <Paper
                key={row.guid || row.code || index}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{
                  px: { xs: 0.7, sm: 1 },
                  py: { xs: 0.5, sm: 0.7 },
                  cursor: "pointer",
                  borderColor: border,
                  "&:hover": {
                    bgcolor: "#eef8f3",
                    borderColor: primary
                  }
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "52px minmax(0,1fr) 58px",
                      sm: "70px minmax(0,1fr) 90px 60px"
                    },
                    alignItems: "center",
                    gap: { xs: 0.45, sm: 0.8 }
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 9, sm: 11 } }}
                    >
                      {columns[0]?.label || "الكود"}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: 11, sm: 13 }
                      }}
                    >
                      {row[columns[0]?.key] ?? "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 9, sm: 11 } }}
                    >
                      {columns[1]?.label || "الاسم"}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: 11, sm: 13 }
                      }}
                    >
                      {row[columns[1]?.key] ?? "-"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: 11 }}
                    >
                      {columns[2]?.label || "الحالة"}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                      {row[columns[2]?.key] ?? "-"}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => onPick(row)}
                    sx={{
                      minWidth: 0,
                      px: { xs: 0.4, sm: 0.7 },
                      fontSize: { xs: 10, sm: 12 }
                    }}
                  >
                    اختيار
                  </Button>
                </Box>
              </Paper>
            ))}

            {!rows.length && (
              <Alert severity="info">
                لا توجد نتائج.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UserManagement() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [permissionLoading, setPermissionLoading] =
    useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [model, setModel] = useState(emptyUser());

  const [menus, setMenus] = useState([]);
  const [forms, setForms] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  const [jobTitles, setJobTitles] = useState([]);
  const [jobTitlesLoading, setJobTitlesLoading] = useState(false);

  const [lookup, setLookup] = useState({
    open: false,
    type: "",
    title: "",
    rows: [],
    loading: false,
    search: ""
  });

  const isEdit = Boolean(model.guid);

  const setField = useCallback((field, value) => {
    setModel((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  // ============================================================
  // Permission - one source: Form_Name + User_Premision
  // ============================================================
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = String(localStorage.getItem("token") || "").trim();
        if (!token) {
          if (alive) setAuthorized(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/screen-access/me?key=user-management`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          }
        );
        const result = await response.json().catch(() => null);
        if (alive) setAuthorized(response.ok && result?.allowed === true);
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // ============================================================
  // Bootstrap: menus + forms + branches
  // ============================================================
  const loadBootstrap = useCallback(async () => {
    if (!authorized || !userGuid) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`,
        { cache: "no-store" }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          "تعذر تحميل إعدادات شاشة المستخدم"
        );
      }

      const data = result?.data || {};

      const loadedMenus =
        Array.isArray(data?.menus)
          ? data.menus
          : [];

      const loadedForms =
        Array.isArray(data?.forms)
          ? data.forms
          : [];

      const loadedBranches =
        Array.isArray(data?.branches)
          ? data.branches
          : [];

      setMenus(
        loadedMenus.map((item) => ({
          ...item,
          view: false
        }))
      );

      setForms(loadedForms);

      // مطابق للديسكتوب: FormGrid يبدأ فارغًا،
      // ولا نضيف الشاشة إلا عند اختيارها.
      setPermissions([]);

      setAvailableBranches(loadedBranches);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر التحميل",
        text:
          e?.message ||
          "تعذر تحميل إعدادات شاشة المستخدم"
      });
    } finally {
      setLoading(false);
    }
  }, [authorized, userGuid]);

  useEffect(() => {
    if (authorized) {
      loadBootstrap();
    }
  }, [authorized, loadBootstrap]);

  // ============================================================
  // HR Job Titles
  // UserJop remains the legacy code/index stored in User_Info.
  // Legacy code 12 is kept in DB but hidden for new selections.
  // ============================================================
  const loadJobTitles = useCallback(async () => {
    if (!authorized) return;

    setJobTitlesLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/hr/job-titles/lookups`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل الوظائف والمسميات الوظيفية"
        );
      }

      const rows = Array.isArray(result?.data)
        ? result.data
        : [];

      setJobTitles(
        rows
          .filter(
            (job) =>
              job?.isActive === true &&
              Number.isInteger(Number(job?.legacyJobCode))
          )
          .sort(
            (a, b) =>
              Number(a.legacyJobCode) -
              Number(b.legacyJobCode)
          )
      );
    } catch (e) {
      console.error("Failed to load HR job titles:", e);
      setJobTitles([]);
    } finally {
      setJobTitlesLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    if (authorized) {
      loadJobTitles();
    }
  }, [authorized, loadJobTitles]);

  // ============================================================
  // New
  // ============================================================
  const newUser = useCallback(() => {
    setModel(emptyUser());
    setSelectedBranches([]);

    setMenus((current) =>
      current.map((item) => ({
        ...item,
        view: false
      }))
    );

    // مطابق CMDNew في الديسكتوب: FormGrid.Rows.Clear()
    setPermissions([]);

    setTab(0);
  }, [forms]);

  // ============================================================
  // Lookups
  // ============================================================
  const openLookup = useCallback((type, title) => {
    setLookup({
      open: true,
      type,
      title,
      rows: [],
      loading: false,
      search: ""
    });
  }, []);

  const closeLookup = useCallback(() => {
    setLookup((current) => ({
      ...current,
      open: false
    }));
  }, []);

  useEffect(() => {
    if (!lookup.open || !authorized) return;

    const timer = setTimeout(async () => {
      setLookup((current) => ({
        ...current,
        loading: true
      }));

      try {
        const params =
          new URLSearchParams({
            userGuid,
            q: lookup.search || ""
          });

        let url = "";

        if (lookup.type === "users") {
          url = `${API_BASE_URL}/api/user-management/users?${params}`;
        } else if (lookup.type === "branchForWork") {
          url = `${API_BASE_URL}/api/user-management/branches?${params}`;
        } else if (lookup.type === "seller") {
          url = `${API_BASE_URL}/api/user-management/salesmen?${params}`;
        } else if (lookup.type === "trainer") {
          if (
            model.branchForWork &&
            model.branchForWork !== ZERO_GUID
          ) {
            params.set(
              "branchGuid",
              model.branchForWork
            );
          }

          url = `${API_BASE_URL}/api/user-management/trainers?${params}`;
        } else if (lookup.type === "department") {
          url = `${API_BASE_URL}/api/user-management/departments?${params}`;
        }

        if (!url) return;

        const response = await fetch(url, {
          cache: "no-store"
        });

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل القائمة"
          );
        }

        setLookup((current) => ({
          ...current,
          rows:
            Array.isArray(result?.data)
              ? result.data
              : []
        }));
      } catch (e) {
        setLookup((current) => ({
          ...current,
          rows: []
        }));
      } finally {
        setLookup((current) => ({
          ...current,
          loading: false
        }));
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    lookup.open,
    lookup.type,
    lookup.search,
    authorized,
    userGuid,
    model.branchForWork
  ]);

  const loadUser = useCallback(
    async (code) => {
      closeLookup();
      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/user-management/users/${encodeURIComponent(code)}?userGuid=${encodeURIComponent(userGuid)}`,
          { cache: "no-store" }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل بيانات المستخدم"
          );
        }

        const data = result?.data || {};

        setModel({
          ...emptyUser(),
          ...(data?.user || {})
        });

        const userMenus =
          Array.isArray(data?.menus)
            ? data.menus
            : [];

        const menuMap =
          new Map(
            userMenus.map((item) => [
              norm(item.guid),
              Boolean(item.view)
            ])
          );

        setMenus((current) =>
          current.map((item) => ({
            ...item,
            view:
              menuMap.get(norm(item.guid)) ||
              false
          }))
        );

        const userPermissions =
          Array.isArray(data?.permissions)
            ? data.permissions
            : [];

        const permissionMap =
          new Map(
            userPermissions.map((item) => [
              norm(item.guid),
              item
            ])
          );

        setPermissions(
          userPermissions.map((p) => {
            const form =
              forms.find(
                (f) =>
                  norm(f.guid) === norm(p.guid)
              );

            return {
              name:
                p.name ||
                form?.name ||
                "",
              guid: p.guid,
              add: Boolean(p.add),
              edit: Boolean(p.edit),
              del: Boolean(p.del),
              print: Boolean(p.print),
              find: Boolean(p.find),
              view: Boolean(p.view)
            };
          })
        );

        setSelectedBranches(
          Array.isArray(data?.branches)
            ? data.branches
            : []
        );

        setTab(0);
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "تعذر التحميل",
          text:
            e?.message ||
            "تعذر تحميل بيانات المستخدم"
        });
      } finally {
        setLoading(false);
      }
    },
    [closeLookup, forms, userGuid]
  );

  const pickLookup = useCallback(
    (row) => {
      if (lookup.type === "users") {
        loadUser(row.code);
        return;
      }

      if (lookup.type === "branchForWork") {
        setModel((current) => ({
          ...current,
          branchForWork: row.guid || ZERO_GUID,
          branchForWorkName: row.name || "",
          // تغيير الفرع يلغي المدرب لو كان تابعًا لفرع آخر
          trainerGuid: ZERO_GUID,
          trainerName: ""
        }));
      }

      if (lookup.type === "seller") {
        setModel((current) => ({
          ...current,
          sellerGuid: row.guid || ZERO_GUID,
          sellerName: row.name || ""
        }));
      }

      if (lookup.type === "trainer") {
        setModel((current) => ({
          ...current,
          trainerGuid: row.guid || ZERO_GUID,
          trainerName: row.name || ""
        }));
      }

      if (lookup.type === "department") {
        setModel((current) => ({
          ...current,
          departmentGuid:
            row.guid || ZERO_GUID,
          departmentName: row.name || ""
        }));
      }

      closeLookup();
    },
    [lookup.type, closeLookup, loadUser]
  );

  // ============================================================
  // Permissions editing
  // ============================================================
  const updatePermission = useCallback(
    (index, field, value) => {
      setPermissions((current) => {
        const next = current.slice();
        next[index] = {
          ...next[index],
          [field]: value
        };
        return next;
      });
    },
    []
  );

  const fullControl = useCallback(() => {
    setMenus((current) =>
      current.map((item) => ({
        ...item,
        view: true
      }))
    );

    setPermissions(
      forms.map((form) => ({
        name: form.name,
        guid: form.guid,
        add: true,
        edit: true,
        del: true,
        print: true,
        find: true,
        view: true
      }))
    );
  }, [forms]);

  const deleteAllPermissions = useCallback(() => {
    setMenus((current) =>
      current.map((item) => ({
        ...item,
        view: false
      }))
    );

    // مطابق CmdDelAll: FormGrid.Rows.Clear()
    setPermissions([]);
  }, []);

  const addFormToPermissions = useCallback(
    (form) => {
      setPermissions((current) => {
        const existing = current.find(
          (item) =>
            norm(item.guid) === norm(form.guid)
        );

        if (existing) return current;

        return [
          ...current,
          emptyPermission(form)
        ];
      });
    },
    []
  );

  // ============================================================
  // Branch assignment dual list
  // ============================================================
  const selectedBranchGuids =
    useMemo(
      () =>
        new Set(
          selectedBranches.map((b) =>
            norm(b.guid)
          )
        ),
      [selectedBranches]
    );

  const unselectedBranches =
    useMemo(
      () =>
        availableBranches.filter(
          (b) =>
            !selectedBranchGuids.has(
              norm(b.guid)
            )
        ),
      [
        availableBranches,
        selectedBranchGuids
      ]
    );

  const addAllowedBranch = useCallback((branch) => {
    setSelectedBranches((current) => {
      if (
        current.some(
          (item) =>
            norm(item.guid) ===
            norm(branch.guid)
        )
      ) {
        return current;
      }

      return [...current, branch];
    });
  }, []);

  const removeAllowedBranch = useCallback(
    (guid) => {
      setSelectedBranches((current) =>
        current.filter(
          (item) =>
            norm(item.guid) !== norm(guid)
        )
      );
    },
    []
  );

  // ============================================================
  // Save / Update
  // ============================================================
  const validate = useCallback(() => {
    if (!model.fullName.trim())
      return "برجاء إدخال اسم الموظف";

    if (!model.userName.trim())
      return "برجاء إدخال اسم المستخدم";

    if (!model.password.trim())
      return "برجاء إدخال كلمة المرور";

    // مطابق للديسكتوب: مندوب البيع مطلوب.
    if (
      !model.sellerGuid ||
      model.sellerGuid === ZERO_GUID
    ) {
      return "برجاء اختيار حساب مندوب البيع أولاً";
    }

    if (
      model.chkTrainer &&
      (
        !model.trainerGuid ||
        model.trainerGuid === ZERO_GUID
      )
    ) {
      return "المستخدم محدد كمدرب؛ برجاء اختيار المدرب";
    }

    return "";
  }, [model]);

  const save = useCallback(async () => {
    const validation = validate();

    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: "راجع البيانات",
        text: validation
      });
      return;
    }

    let reason = "";

    if (isEdit) {
      const result = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder:
          "اكتب سبب تعديل بيانات المستخدم...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        inputValidator: (value) =>
          !String(value || "").trim()
            ? "سبب التعديل مطلوب"
            : undefined
      });

      if (!result.isConfirmed) return;
      reason = String(result.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      reason,
      user: {
        ...model,

        // الـ API يعرف Code و Guid كنصوص.
        // ShowUserInfo/قائمة المستخدمين قد يعيدان Code كرقم،
        // لذلك نحوله صراحةً قبل JSON.stringify حتى لا يفشل Model Binding.
        code: String(model.code ?? ""),
        guid: String(model.guid ?? ""),

        userJop:
          Number.isFinite(Number(model.userJop))
            ? Number(model.userJop)
            : -1
      },
      menus: menus.map((item) => ({
        guid: item.guid,
        view: Boolean(item.view)
      })),
      permissions: permissions.map((p) => ({
        guid: p.guid,
        add: Boolean(p.add),
        edit: Boolean(p.edit),
        del: Boolean(p.del),
        print: Boolean(p.print),
        find: Boolean(p.find),
        view: Boolean(p.view)
      })),
      branches: selectedBranches.map(
        (item) => item.guid
      )
    };

    setSaving(true);

    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/user-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/user-management`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const raw = await response.text();
      let result = null;

      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
          raw ||
          "تعذر حفظ المستخدم"
        );
      }

      const saved = result?.data || {};

      setModel((current) => ({
        ...current,
        guid: saved.guid || current.guid,
        code: saved.code || current.code
      }));

      await Swal.fire({
        icon: "success",
        title: isEdit
          ? "تم تعديل المستخدم"
          : "تم حفظ المستخدم",
        text:
          result?.message ||
          "تمت العملية بنجاح"
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الحفظ",
        text:
          e?.message ||
          "تعذر حفظ بيانات المستخدم"
      });
    } finally {
      setSaving(false);
    }
  }, [
    validate,
    isEdit,
    userGuid,
    model,
    menus,
    permissions,
    selectedBranches
  ]);

  // ============================================================
  // Render states
  // ============================================================
  if (permissionLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          لا توجد لديك صلاحية إضافة مستخدم ضمن قائمة ملف.
        </Alert>
      </Box>
    );
  }

  const lookupColumns =
    lookup.type === "users"
      ? [
          { key: "code", label: "الكود" },
          { key: "name", label: "اسم المستخدم" },
          { key: "status", label: "الحالة" }
        ]
      : [
          { key: "code", label: "الكود" },
          { key: "name", label: "البيان" },
          { key: "status", label: "الحالة" }
        ];

  const content = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        bgcolor: soft,
        p: { xs: 0.5, sm: 0.75, md: 1 }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${border}`,
          borderRadius: { xs: 1.2, sm: 2 },
          overflow: "hidden",

          "& .MuiInputBase-root": {
            minHeight: { xs: 34, sm: 38 }
          },
          "& .MuiInputBase-input": {
            fontSize: { xs: 11.5, sm: 13.5 },
            py: { xs: 0.55, sm: 0.8 }
          },
          "& .MuiInputLabel-root": {
            fontSize: { xs: 10.5, sm: 12.5 }
          },
          "& .MuiButton-root": {
            minHeight: { xs: 32, sm: 36 },
            fontSize: { xs: 10.8, sm: 13.5 },
            lineHeight: 1.15
          },
          "& .MuiSvgIcon-root": {
            fontSize: { xs: 18, sm: 20 }
          }
        }}
      >
        <Box
          sx={{
            bgcolor: primaryDark,
            color: "#fff",
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.7, sm: 0.9 },
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{ color: "#fff" }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <PersonAddAlt1Icon />

          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: {
                  xs: 17,
                  sm: 20,
                  md: 22
                }
              }}
            >
              إضافة مستخدم
            </Typography>
          </Box>

          <Chip
            label={
              isEdit
                ? `تعديل المستخدم #${model.code}`
                : "مستخدم جديد"
            }
            size="small"
            sx={{
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900
            }}
          />
        </Box>

        <Box
          sx={{
            p: 1,
            borderBottom: `1px solid ${border}`
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(3, minmax(0, 1fr))",
                sm: "repeat(3, max-content)"
              },
              gap: { xs: 0.5, sm: 0.75 },
              justifyContent: { sm: "start" }
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={newUser}
              sx={{
                bgcolor: "#1976d2",
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.7, sm: 2 },
                fontSize: { xs: 10.5, sm: 13.5 },
                lineHeight: 1.1,
                whiteSpace: "normal"
              }}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() =>
                openLookup(
                  "users",
                  "قائمة المستخدمين"
                )
              }
              sx={{
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.7, sm: 2 },
                fontSize: { xs: 10.5, sm: 13.5 },
                lineHeight: 1.1,
                whiteSpace: "normal"
              }}
            >
              بحث عن مستخدم
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={
                saving
                  ? <CircularProgress size={18} color="inherit" />
                  : <SaveIcon />
              }
              onClick={save}
              disabled={saving || loading}
              sx={{
                fontWeight: 900,
                minWidth: 0,
                px: { xs: 0.7, sm: 2 },
                fontSize: { xs: 10.5, sm: 13.5 },
                lineHeight: 1.1,
                whiteSpace: "normal"
              }}
            >
              {isEdit
                ? "حفظ التعديل"
                : "حفظ"}
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant={isMobile ? "fullWidth" : "standard"}
          scrollButtons={false}
          sx={{
            borderBottom: `1px solid ${border}`,
            minHeight: { xs: 42, sm: 48 },
            "& .MuiTab-root": {
              minHeight: { xs: 42, sm: 48 },
              py: { xs: 0.5, sm: 1 },
              px: { xs: 0.7, sm: 2 },
              fontSize: { xs: 12, sm: 14 }
            }
          }}
        >
          <Tab
            icon={<BadgeIcon />}
            iconPosition="start"
            label="بيانات أساسية"
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="القوائم والصلاحيات"
          />
        </Tabs>

        {loading && (
          <Box
            sx={{
              p: 1,
              display: "flex",
              gap: 1,
              alignItems: "center"
            }}
          >
            <CircularProgress size={20} />
            <Typography>
              جاري التحميل...
            </Typography>
          </Box>
        )}

        {tab === 0 && (
          <Box sx={{ p: { xs: 0.75, sm: 1.25, md: 1.5 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2,minmax(0,1fr))",
                  md: "repeat(4,minmax(0,1fr))"
                },
                gap: { xs: 0.45, sm: 0.7 }
              }}
            >
              <TextField
                size="small"
                label="كود"
                value={model.code}
                disabled
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField
                size="small"
                label="اسم الموظف"
                value={model.fullName}
                onChange={(e) =>
                  setField(
                    "fullName",
                    e.target.value
                  )
                }
              />

              <TextField
                size="small"
                label="User Name"
                value={model.userName}
                onChange={(e) =>
                  setField(
                    "userName",
                    e.target.value
                  )
                }
                inputProps={{ dir: "ltr" }}
              />

              <TextField
                size="small"
                label="Password"
                value={model.password}
                onChange={(e) =>
                  setField(
                    "password",
                    e.target.value
                  )
                }
                inputProps={{ dir: "ltr" }}
              />

              <FormControl size="small" fullWidth>
                <InputLabel id="user-job-label">
                  الوظيفة
                </InputLabel>

                <Select
                  labelId="user-job-label"
                  label="الوظيفة"
                  value={
                    Number.isInteger(Number(model.userJop)) &&
                    Number(model.userJop) >= 0
                      ? Number(model.userJop)
                      : ""
                  }
                  onChange={(e) =>
                    setField(
                      "userJop",
                      Number(e.target.value)
                    )
                  }
                  renderValue={(selectedLegacyCode) => {
                    const selected =
                      jobTitles.find(
                        (job) =>
                          Number(job.legacyJobCode) ===
                          Number(selectedLegacyCode)
                      );

                    return (
                      selected?.jobTitleName ||
                      `وظيفة قديمة رقم ${selectedLegacyCode}`
                    );
                  }}
                  disabled={jobTitlesLoading}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: { xs: 260, sm: 360 },
                        "& .MuiMenuItem-root": {
                          minHeight: { xs: 32, sm: 38 },
                          fontSize: { xs: 11.5, sm: 13.5 },
                          py: { xs: 0.35, sm: 0.65 }
                        }
                      }
                    }
                  }}
                >
                  {jobTitles
                    .filter(
                      (job) =>
                        job.showInUserSelection === true ||
                        Number(job.legacyJobCode) ===
                          Number(model.userJop)
                    )
                    .map((job) => {
                      const legacyCode =
                        Number(job.legacyJobCode);

                      const hiddenLegacy =
                        job.showInUserSelection !== true;

                      return (
                        <MenuItem
                          key={
                            job.jobTitleGuid ||
                            `legacy-${legacyCode}`
                          }
                          value={legacyCode}
                          disabled={hiddenLegacy}
                        >
                          {job.jobTitleName}
                          {hiddenLegacy
                            ? " — غير مستخدم"
                            : ""}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="الفرع التابع له"
                value={model.branchForWorkName}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          openLookup(
                            "branchForWork",
                            "قائمة الفروع"
                          )
                        }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                size="small"
                label="القسم التابع له"
                value={model.departmentName}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          openLookup(
                            "department",
                            "قائمة الأقسام"
                          )
                        }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                size="small"
                label="مندوب البيع"
                value={model.sellerName}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          openLookup(
                            "seller",
                            "قائمة مندوبي البيع"
                          )
                        }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Divider sx={{ my: { xs: 1, sm: 1.5 } }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2,minmax(0,1fr))",
                  sm: "repeat(3,minmax(0,1fr))",
                  lg: "repeat(4,minmax(0,1fr))"
                },
                gap: { xs: 0.1, sm: 0.35 },
                "& .MuiFormControlLabel-root": {
                  m: 0,
                  minWidth: 0
                },
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: 9.8, sm: 12.5 },
                  lineHeight: 1.15
                },
                "& .MuiCheckbox-root": {
                  p: { xs: 0.5, sm: 1 }
                }
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.isUse}
                    onChange={(e) =>
                      setField(
                        "isUse",
                        e.target.checked
                      )
                    }
                  />
                }
                label="نشط"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkAmount}
                    onChange={(e) =>
                      setField(
                        "chkAmount",
                        e.target.checked
                      )
                    }
                  />
                }
                label="إدخال مبالغ صفرية"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkOtherFess}
                    onChange={(e) =>
                      setField(
                        "chkOtherFess",
                        e.target.checked
                      )
                    }
                  />
                }
                label="إضافة رسوم للطالب في عدم وجود ملف تدريبي"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkAccept}
                    onChange={(e) =>
                      setField(
                        "chkAccept",
                        e.target.checked
                      )
                    }
                  />
                }
                label="قبول طالب من البرنامج القديم"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkAllowCompany}
                    disabled
                  />
                }
                label="السماح للشركات"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkTrainer}
                    onChange={(e) => {
                      const checked =
                        e.target.checked;

                      setModel((current) => ({
                        ...current,
                        chkTrainer: checked,
                        trainerGuid:
                          checked
                            ? current.trainerGuid
                            : ZERO_GUID,
                        trainerName:
                          checked
                            ? current.trainerName
                            : ""
                      }));
                    }}
                  />
                }
                label="الموظف يعمل كمدرب"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={model.chkBranch}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      setModel((current) => ({
                        ...current,
                        chkBranch: checked,

                        // لا يوجد اختيار "فرع تقارير" منفصل في الواجهة.
                        // الفروع المعتمدة فعليًا هي القائمة المختارة أسفل الشاشة.
                        branchGuid: ZERO_GUID,
                        branchName: ""
                      }));
                    }}
                  />
                }
                label="فروع مخصصة للتقارير"
              />
            </Box>

            {(model.chkTrainer ||
              model.chkBranch) && (
              <Box
                sx={{
                  mt: 1.5,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2,minmax(0,1fr))"
                  },
                  gap: 1
                }}
              >
                {model.chkTrainer && (
                  <TextField
                    size="small"
                    label="المدرب"
                    value={model.trainerName}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              openLookup(
                                "trainer",
                                "قائمة المدربين"
                              )
                            }
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}

                {model.chkBranch && (
                  <TextField
                    size="small"
                    label="فرع التقارير"
                    value={model.branchName}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              openLookup(
                                "reportBranch",
                                "قائمة الفروع"
                              )
                            }
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              </Box>
            )}

            <Divider sx={{ my: { xs: 1, sm: 1.5 } }} />

            <Typography
              sx={{
                fontWeight: 900,
                mb: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: 14, sm: 16 }
              }}
            >
              الفروع المسموح بها للمستخدم
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr"
                },
                gap: { xs: 0.75, sm: 1 }
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderColor: border
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    mb: 1
                  }}
                >
                  قائمة الفروع
                </Typography>

                <Box
                  sx={{
                    maxHeight: { xs: 165, sm: 230, md: 280 },
                    overflow: "auto",
                    display: "grid",
                    gap: 0.5
                  }}
                >
                  {unselectedBranches.map(
                    (branch) => (
                      <Button
                        key={branch.guid}
                        variant="text"
                        onClick={() =>
                          addAllowedBranch(branch)
                        }
                        sx={{
                          justifyContent: "space-between",
                          color: "text.primary",
                          minHeight: { xs: 28, sm: 34 },
                          py: { xs: 0.15, sm: 0.4 },
                          px: { xs: 0.35, sm: 0.8 },
                          fontSize: { xs: 10.5, sm: 13 }
                        }}
                      >
                        <span>{branch.name}</span>
                        <AddIcon fontSize="small" />
                      </Button>
                    )
                  )}
                </Box>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderColor: border
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    mb: 1
                  }}
                >
                  الفروع المختارة
                </Typography>

                <Box
                  sx={{
                    maxHeight: { xs: 165, sm: 230, md: 280 },
                    overflow: "auto",
                    display: "grid",
                    gap: 0.5
                  }}
                >
                  {selectedBranches.map(
                    (branch) => (
                      <Button
                        key={branch.guid}
                        color="error"
                        variant="text"
                        onClick={() =>
                          removeAllowedBranch(
                            branch.guid
                          )
                        }
                        sx={{
                          justifyContent: "space-between",
                          minHeight: { xs: 28, sm: 34 },
                          py: { xs: 0.15, sm: 0.4 },
                          px: { xs: 0.35, sm: 0.8 },
                          fontSize: { xs: 10.5, sm: 13 }
                        }}
                      >
                        <span>{branch.name}</span>
                        <CloseIcon fontSize="small" />
                      </Button>
                    )
                  )}

                  {!selectedBranches.length && (
                    <Alert severity="info">
                      لم يتم اختيار فروع.
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: { xs: 0.75, sm: 1.25, md: 1.5 } }}>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                mb: { xs: 0.7, sm: 1 },
                "& .MuiButton-root": {
                  flex: { xs: 1, sm: "0 0 auto" },
                  fontSize: { xs: 10.5, sm: 13 }
                }
              }}
            >
              <Button
                variant="outlined"
                startIcon={<SelectAllIcon />}
                onClick={fullControl}
              >
                حقوق كاملة
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={deleteAllPermissions}
              >
                حذف الكل
              </Button>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  xl: "280px minmax(0,1fr)"
                },
                gap: { xs: 0.75, sm: 1 }
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  borderColor: border,
                  overflow: "hidden"
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#eef7f3"
                  }}
                >
                  <Typography sx={{ fontWeight: 900 }}>
                    القوائم الرئيسية
                  </Typography>
                </Box>

                <Box
                  sx={{
                    maxHeight: { xs: 260, sm: 340, md: 420 },
                    overflow: "auto"
                  }}
                >
                  {menus.map((item, index) => (
                    <FormControlLabel
                      key={item.guid}
                      sx={{
                        width: "100%",
                        m: 0,
                        px: 1,
                        borderBottom:
                          `1px solid ${border}`
                      }}
                      control={
                        <Checkbox
                          checked={Boolean(item.view)}
                          onChange={(e) => {
                            const checked =
                              e.target.checked;

                            setMenus((current) => {
                              const next =
                                current.slice();

                              next[index] = {
                                ...next[index],
                                view: checked
                              };

                              return next;
                            });
                          }}
                        />
                      }
                      label={item.name}
                    />
                  ))}
                </Box>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  borderColor: border,
                  overflow: "hidden"
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#eef7f3",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    gap: 0.75
                  }}
                >
                  <Typography sx={{ fontWeight: 900 }}>
                    الشاشات والصلاحيات
                  </Typography>

                  <Autocomplete
                    size="small"
                    options={forms}
                    getOptionLabel={(o) =>
                      o?.name || ""
                    }
                    onChange={(_, value) => {
                      if (value)
                        addFormToPermissions(value);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="بحث عن شاشة..."
                      />
                    )}
                    sx={{
                      width: { xs: "100%", sm: 280 },
                      minWidth: 0
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    overflow: "auto",
                    maxHeight: { xs: 360, sm: 340, md: 420 }
                  }}
                >
                  {/* MOBILE: cards compact, no horizontal scroll */}
                  <Box
                    sx={{
                      display: { xs: "grid", sm: "none" },
                      gap: 0.5,
                      p: 0.5
                    }}
                  >
                    {permissions.map((p, index) => (
                      <Paper
                        key={p.guid}
                        variant="outlined"
                        sx={{
                          p: 0.6,
                          borderColor: border
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 900,
                            lineHeight: 1.2,
                            mb: 0.35
                          }}
                        >
                          {p.name}
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3,minmax(0,1fr))",
                            gap: 0.1
                          }}
                        >
                          {[
                            ["add", "جديد"],
                            ["edit", "تعديل"],
                            ["del", "حذف"],
                            ["print", "طباعة"],
                            ["find", "بحث"],
                            ["view", "عرض"]
                          ].map(([field, label]) => (
                            <FormControlLabel
                              key={field}
                              sx={{
                                m: 0,
                                minWidth: 0,
                                "& .MuiFormControlLabel-label": {
                                  fontSize: 9.2,
                                  lineHeight: 1.1
                                }
                              }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={Boolean(p[field])}
                                  onChange={(e) =>
                                    updatePermission(
                                      index,
                                      field,
                                      e.target.checked
                                    )
                                  }
                                  sx={{
                                    p: 0.3,
                                    "& .MuiSvgIcon-root": {
                                      fontSize: 17
                                    }
                                  }}
                                />
                              }
                              label={label}
                            />
                          ))}
                        </Box>
                      </Paper>
                    ))}

                    {!permissions.length && (
                      <Alert
                        severity="info"
                        sx={{
                          py: 0.35,
                          fontSize: 10.5
                        }}
                      >
                        لم تتم إضافة شاشات للصلاحيات.
                      </Alert>
                    )}
                  </Box>

                  {/* TABLET / DESKTOP */}
                  <Box
                    sx={{
                      display: { xs: "none", sm: "block" },
                      minWidth: 760
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(180px,1fr) repeat(6,70px)",
                        bgcolor: "#f7faf8",
                        borderBottom:
                          `1px solid ${border}`,
                        fontWeight: 900
                      }}
                    >
                      {[
                        "اسم الشاشة",
                        "جديد",
                        "تعديل",
                        "حذف/إلغاء",
                        "طباعة",
                        "بحث",
                        "عرض"
                      ].map((h) => (
                        <Box
                          key={h}
                          sx={{
                            p: 1,
                            textAlign: "center"
                          }}
                        >
                          {h}
                        </Box>
                      ))}
                    </Box>

                    {permissions.map((p, index) => (
                      <Box
                        key={p.guid}
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(180px,1fr) repeat(6,70px)",
                          alignItems: "center",
                          borderBottom:
                            `1px solid ${border}`
                        }}
                      >
                        <Typography
                          sx={{
                            px: 1,
                            fontWeight: 700
                          }}
                        >
                          {p.name}
                        </Typography>

                        {[
                          "add",
                          "edit",
                          "del",
                          "print",
                          "find",
                          "view"
                        ].map((field) => (
                          <Box
                            key={field}
                            sx={{
                              textAlign: "center"
                            }}
                          >
                            <Checkbox
                              checked={Boolean(p[field])}
                              onChange={(e) =>
                                updatePermission(
                                  index,
                                  field,
                                  e.target.checked
                                )
                              }
                            />
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>

      <LookupDialog
        open={lookup.open}
        title={lookup.title}
        rows={lookup.rows}
        loading={lookup.loading}
        search={lookup.search}
        setSearch={(value) =>
          setLookup((current) => ({
            ...current,
            search: value
          }))
        }
        onClose={closeLookup}
        onPick={pickLookup}
        columns={lookupColumns}
      />
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
            setMobileSidebarOpen(false)
          }><Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: soft
      }}
    >
      

      

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          ...navigationContentSx
        }}
      >
        {content}
      </Box>
    </Box></NavigationShell>
  );
}
