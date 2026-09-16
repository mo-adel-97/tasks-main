import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import HistoryIcon from "@mui/icons-material/History";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";






/* ============================================================
   الاتجاهات - عدل القيم الثلاث فقط لو احتجت
   ============================================================ */
// ============================================================
// RTL dialog form system
// Keeps Arabic labels above controls instead of floating on the outline,
// normalizes spacing/alignment, and preserves LTR rendering for date/time.
// ============================================================
const RTL_DIALOG_SX = {
  "& .MuiDialog-paper": {
    direction: "rtl",
    textAlign: "right",
    backgroundImage: "none"
  },
  "& .MuiDialogTitle-root": {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  },
  "& .MuiDialogContent-root": {
    direction: "rtl",
    textAlign: "right",
    overflowX: "hidden",

    "& .MuiFormControl-root": {
      direction: "rtl",
      textAlign: "right"
    },

    // Use a real external-looking label above the control. This avoids the
    // outlined-border/label collision that appears in Arabic RTL forms.
    "& .MuiInputLabel-root": {
      position: "static !important",
      transform: "none !important",
      transformOrigin: "top right !important",
      width: "100%",
      maxWidth: "100%",
      margin: "0 0 6px 0",
      padding: 0,
      direction: "rtl",
      textAlign: "right",
      whiteSpace: "normal",
      overflow: "visible",
      lineHeight: 1.45,
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontSize: "0.78rem",
      fontWeight: 800,
      color: "#52635c",
      pointerEvents: "auto"
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#057546"
    },
    "& .MuiInputLabel-root.Mui-error": {
      color: "#d32f2f"
    },
    "& .MuiInputLabel-root.Mui-disabled": {
      color: "rgba(0,0,0,.42)"
    },

    "& .MuiOutlinedInput-root": {
      direction: "rtl",
      textAlign: "right",
      borderRadius: "10px",
      backgroundColor: "#fff",
      transition: "border-color .18s ease, box-shadow .18s ease, background-color .18s ease",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d7e3dd"
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#9fc7b5"
      },
      "&.Mui-focused": {
        boxShadow: "0 0 0 3px rgba(5,117,70,.08)"
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#057546",
        borderWidth: "1.5px"
      },
      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d32f2f"
      }
    },

    // The label is no longer inside the outline, so remove MUI's notch.
    "& .MuiOutlinedInput-notchedOutline legend": {
      maxWidth: "0 !important"
    },
    "& .MuiOutlinedInput-notchedOutline legend > span": {
      display: "none !important"
    },

    "& .MuiInputBase-input, & textarea, & .MuiSelect-select": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiSelect-select": {
      paddingRight: "14px !important",
      paddingLeft: "40px !important"
    },
    "& .MuiSelect-icon": {
      right: "auto !important",
      left: "10px !important"
    },
    "& .MuiInputAdornment-positionStart": {
      marginRight: "0 !important",
      marginLeft: "8px !important"
    },
    "& .MuiInputAdornment-positionEnd": {
      marginLeft: "0 !important",
      marginRight: "8px !important"
    },
    "& .MuiFormHelperText-root": {
      direction: "rtl",
      textAlign: "right",
      marginLeft: 0,
      marginRight: 0,
      marginTop: "5px",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },
    "& .MuiAutocomplete-inputRoot": {
      direction: "rtl",
      paddingRight: "10px !important",
      paddingLeft: "38px !important"
    },
    "& .MuiAutocomplete-endAdornment": {
      right: "auto !important",
      left: "8px !important"
    },
    "& .MuiFormControlLabel-root": {
      direction: "rtl",
      marginLeft: 0,
      marginRight: 0,
      gap: "3px"
    },
    "& .MuiFormControlLabel-label": {
      direction: "rtl",
      textAlign: "right",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
    },

    // Dates and times must keep their natural numeric order in Arabic UI.
    '& input[type="date"], & input[type="time"], & input[type="datetime-local"]': {
      direction: "ltr !important",
      textAlign: "center !important",
      unicodeBidi: "isolate"
    }
  },
  "& .MuiDialogActions-root": {
    direction: "rtl",
    gap: "8px",
    flexWrap: "wrap",
    padding: { xs: "12px 14px", sm: "14px 20px" },
    borderTop: "1px solid #edf2ef",
    "& .MuiButton-root": {
      minHeight: 38,
      borderRadius: "10px",
      textTransform: "none",
      fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif',
      fontWeight: 800
    },
    "& .MuiButton-startIcon": {
      marginRight: "0 !important",
      marginLeft: "6px !important"
    },
    "& .MuiButton-endIcon": {
      marginLeft: "0 !important",
      marginRight: "6px !important"
    }
  }
};

const PAGE_DIRECTION = "rtl"; // اتجاه الصفحة الرئيسية
const PAGE_TEXT_ALIGN = "right"; // محاذاة نصوص الصفحة الرئيسية
const CENTER_TEXT_ALIGN = "center";

// ============================================================
// اتجاهات الديالوج مستقلة تمامًا عن الصفحة
// غيّر القيم دي فقط لو عايز تعكس الديالوجات بدون لمس الصفحة
// ============================================================
const DIALOG_DIRECTION = "rtl"; // عكس اتجاه الصفحة عندك بصريًا
const DIALOG_TEXT_ALIGN = "right";
const DIALOG_CENTER_TEXT_ALIGN = "center";

const RTL_MENU_PROPS = {
  PaperProps: {
    sx: {
      direction: "rtl",
      textAlign: "right",
      mt: 0.5,
      borderRadius: "10px",
      maxHeight: 360,
      "& .MuiMenuItem-root": {
        direction: "rtl",
        textAlign: "right",
        justifyContent: "flex-start",
        minHeight: 40,
        fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
      }
    }
  },
  MenuListProps: {
    dir: "rtl",
    sx: { py: 0.5 }
  }
};

const RTL_AUTOCOMPLETE_LISTBOX_PROPS = {
  dir: "rtl",
  style: {
    direction: "rtl",
    textAlign: "right",
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Arial, sans-serif'
  }
};

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";

const emptyForm = {
  departmentName: "",
  managerGuid: "",
  description: "",
  notes: "",
  isActive: true
};

const getCurrentUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.guid || user?.Guid || null;
  } catch {
    return null;
  }
};

/* ============================================================
   HR ORGANIZATION DESIGNER - local to this page
   Keeps the hierarchy self-contained in HrDepartmentsPage so the
   screen does not depend on another frontend file for its core UI.
   ============================================================ */
const ORG_UNIT_TYPE_META = {
  COMPANY: { label: "الشركة / الجذر", rank: 0, short: "جذر" },
  DEPARTMENT: { label: "إدارة / قسم", rank: 10, short: "قسم" },
  BRANCH: { label: "فرع", rank: 20, short: "فرع" },
  TEAM: { label: "فريق", rank: 30, short: "فريق" },
  CUSTOM: { label: "وحدة مخصصة", rank: 40, short: "وحدة" }
};

const ORG_ROLE_NAMES = {
  MANAGER: "مسؤول",
  EXECUTIVE_MANAGER: "مدير تنفيذي",
  GENERAL_SUPERVISOR: "مشرف عام",
  BRANCH_SUPERVISOR: "مشرف فرع",
  ADMIN_MANAGER: "مدير إداري",
  DEPARTMENT_MANAGER: "مدير إدارة / قسم",
  DEPUTY: "نائب / بديل",
  COMPANY_HEAD: "رئيس الشركة"
};

const getOrgUnitMeta = (type) =>
  ORG_UNIT_TYPE_META[String(type || "CUSTOM").toUpperCase()] ||
  ORG_UNIT_TYPE_META.CUSTOM;

const getOrgRoleName = (role) =>
  ORG_ROLE_NAMES[String(role || "MANAGER").toUpperCase()] || role || "مسؤول";

const normalizeOrgGuid = (value) => String(value || "").trim().toLowerCase();

const compareOrgUnits = (a, b) => {
  const typeCompare = getOrgUnitMeta(a?.unitType).rank - getOrgUnitMeta(b?.unitType).rank;
  if (typeCompare !== 0) return typeCompare;

  const sortCompare = Number(a?.sortOrder ?? 100) - Number(b?.sortOrder ?? 100);
  if (sortCompare !== 0) return sortCompare;

  return String(a?.unitName || "").localeCompare(String(b?.unitName || ""), "ar");
};

const emptyOrgUnitForm = () => ({
  orgUnitGuid: null,
  unitCode: "",
  unitName: "",
  unitType: "CUSTOM",
  parentOrgUnitGuid: "",
  sortOrder: 100,
  notes: ""
});

const emptyOrgManagerForm = () => ({
  orgUnitManagerGuid: null,
  orgUnitGuid: "",
  managerUserGuid: "",
  managerRole: "MANAGER",
  priority: 100,
  isPrimary: true,
  canViewTeam: true,
  canViewDescendants: true,
  canApproveLeaves: true,
  canApprovePermissions: true,
  canReviewAttendance: true,
  notes: ""
});

const getOrgActor = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      actorUserGuid:
        user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || null,
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

function OrgTreeNode({
  node,
  childrenMap,
  managersByUnit,
  onEdit,
  onDelete,
  depth = 0
}) {
  const children = childrenMap.get(node.orgUnitGuid) || [];
  const managers = (managersByUnit.get(node.orgUnitGuid) || [])
    .slice()
    .sort(
      (a, b) =>
        Number(a?.priority ?? 100) - Number(b?.priority ?? 100) ||
        Number(Boolean(b?.isPrimary)) - Number(Boolean(a?.isPrimary)) ||
        String(a?.managerName || "").localeCompare(
          String(b?.managerName || ""),
          "ar"
        )
    );
  const meta = getOrgUnitMeta(node?.unitType);
  const isRoot = !node?.parentOrgUnitGuid;

  return (
    <Box
      sx={{
        position: "relative",
        marginInlineStart: depth ? { xs: 1.3, sm: 2.4 } : 0,
        mb: depth === 0 ? 1.25 : 0.7
      }}
    >
      {depth > 0 && (
        <>
          <Box
            sx={(theme) => ({
              position: "absolute",
              insetInlineStart: { xs: -8, sm: -15 },
              top: -10,
              bottom: 16,
              borderInlineStart: `2px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(86,190,143,.35)"
                  : "rgba(5,117,70,.20)"
              }`
            })}
          />
          <Box
            sx={(theme) => ({
              position: "absolute",
              insetInlineStart: { xs: -8, sm: -15 },
              top: 29,
              width: { xs: 8, sm: 15 },
              borderTop: `2px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(86,190,143,.35)"
                  : "rgba(5,117,70,.20)"
              }`
            })}
          />
        </>
      )}

      <Paper
        elevation={0}
        sx={(theme) => ({
          position: "relative",
          overflow: "hidden",
          p: { xs: 1.05, sm: 1.2 },
          borderRadius: 2.7,
          border: "1px solid",
          borderColor:
            depth === 0
              ? theme.palette.mode === "dark"
                ? "rgba(80,205,147,.52)"
                : "rgba(5,117,70,.40)"
              : theme.palette.divider,
          bgcolor:
            depth === 0
              ? theme.palette.mode === "dark"
                ? "rgba(5,117,70,.16)"
                : "rgba(5,117,70,.045)"
              : theme.palette.background.paper,
          boxShadow:
            depth === 0
              ? theme.palette.mode === "dark"
                ? "0 12px 30px rgba(0,0,0,.18)"
                : "0 10px 28px rgba(5,117,70,.08)"
              : "none",
          transition: "border-color .16s ease, box-shadow .16s ease, transform .16s ease",
          "&:hover": {
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(80,205,147,.62)"
                : "rgba(5,117,70,.38)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 22px rgba(0,0,0,.18)"
                : "0 8px 22px rgba(5,117,70,.07)"
          },
          "&::before": {
            content: '\"\"',
            position: "absolute",
            insetBlock: 0,
            insetInlineStart: 0,
            width: depth === 0 ? 5 : 3,
            bgcolor:
              node?.unitType === "COMPANY"
                ? primaryColor
                : node?.unitType === "DEPARTMENT"
                  ? "#2e7d32"
                  : node?.unitType === "BRANCH"
                    ? "#0288d1"
                    : node?.unitType === "TEAM"
                      ? "#7b1fa2"
                      : "#64748b"
          }
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          gap={1.1}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              gap={0.65}
            >
              <Avatar
                variant="rounded"
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(64,188,132,.18)"
                      : "rgba(5,117,70,.10)",
                  color:
                    theme.palette.mode === "dark" ? "#7ad8aa" : primaryColor,
                  border: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(80,205,147,.28)"
                      : "rgba(5,117,70,.16)"
                })}
              >
                <AccountTreeRoundedIcon sx={{ fontSize: 18 }} />
              </Avatar>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  fontSize: { xs: ".82rem", sm: ".92rem" },
                  color: "text.primary"
                }}
              >
                {node?.unitName || "وحدة بدون اسم"}
              </Typography>

              <Chip
                size="small"
                label={meta.label}
                sx={(theme) => ({
                  height: 24,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,.07)"
                      : "rgba(15,23,42,.05)",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider"
                })}
              />

              <Chip
                size="small"
                variant="outlined"
                label={`أولوية ${Number(node?.sortOrder ?? 100)}`}
                sx={{
                  height: 24,
                  fontFamily: "Cairo",
                  fontWeight: 850,
                  borderColor: "divider",
                  color: "text.secondary"
                }}
              />

              <Chip
                size="small"
                variant="outlined"
                label={`${Number(node?.directMembers || 0)} عضو مباشر`}
                sx={{
                  height: 24,
                  fontFamily: "Cairo",
                  fontWeight: 850,
                  borderColor: "divider",
                  color: "text.secondary"
                }}
              />

              {depth > 0 && (
                <Chip
                  size="small"
                  label={`المستوى ${depth + 1}`}
                  sx={(theme) => ({
                    height: 24,
                    fontFamily: "Cairo",
                    fontWeight: 850,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(5,117,70,.18)"
                        : "rgba(5,117,70,.07)",
                    color:
                      theme.palette.mode === "dark" ? "#7ad8aa" : primaryColor
                  })}
                />
              )}
            </Stack>

            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              gap={0.55}
              sx={{ mt: 0.8, minHeight: 26 }}
            >
              {managers.length ? (
                managers.map((manager) => (
                  <Chip
                    key={manager?.orgUnitManagerGuid}
                    size="small"
                    label={`${manager?.managerName || "مسؤول"} • ${getOrgRoleName(
                      manager?.managerRole
                    )}${manager?.isPrimary ? " • أساسي" : ""}`}
                    sx={(theme) => ({
                      maxWidth: "100%",
                      fontFamily: "Cairo",
                      fontWeight: manager?.isPrimary ? 900 : 800,
                      color:
                        theme.palette.mode === "dark"
                          ? manager?.isPrimary
                            ? "#c9f7de"
                            : theme.palette.text.secondary
                          : manager?.isPrimary
                            ? "#075b38"
                            : theme.palette.text.secondary,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? manager?.isPrimary
                            ? "rgba(34,197,94,.14)"
                            : "rgba(255,255,255,.05)"
                          : manager?.isPrimary
                            ? "rgba(34,197,94,.10)"
                            : "rgba(15,23,42,.04)",
                      border: "1px solid",
                      borderColor:
                        theme.palette.mode === "dark"
                          ? manager?.isPrimary
                            ? "rgba(74,222,128,.30)"
                            : theme.palette.divider
                          : manager?.isPrimary
                            ? "rgba(34,197,94,.24)"
                            : theme.palette.divider,
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }
                    })}
                  />
                ))
              ) : (
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: ".68rem",
                    color: "text.secondary",
                    alignSelf: "center"
                  }}
                >
                  لا يوجد مسؤول محدد لهذه الوحدة
                </Typography>
              )}
            </Stack>
          </Box>

          <Stack
            direction="row"
            useFlexGap
            gap={0.65}
            flexWrap="wrap"
            sx={{ flexShrink: 0 }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => onEdit(node)}
              sx={(theme) => ({
                minHeight: 38,
                px: 1.45,
                borderRadius: 2,
                fontFamily: "Cairo",
                fontWeight: 950,
                bgcolor:
                  theme.palette.mode === "dark" ? "#0b8a58" : primaryColor,
                color: "#fff",
                boxShadow: "none",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark" ? "#0a7b50" : primaryDark,
                  boxShadow: "none"
                }
              })}
            >
              تعديل
            </Button>

            <Tooltip
              title={
                isRoot && node?.unitType === "COMPANY"
                  ? "وحدة الجذر الأساسية لا تُحذف"
                  : "حذف الوحدة من الهيكل"
              }
            >
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  disabled={isRoot && node?.unitType === "COMPANY"}
                  onClick={() => onDelete(node)}
                  sx={(theme) => ({
                    minHeight: 38,
                    px: 1.35,
                    borderRadius: 2,
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    borderWidth: "1.5px",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(239,68,68,.09)"
                        : "rgba(211,47,47,.035)",
                    "&:hover": {
                      borderWidth: "1.5px",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(239,68,68,.16)"
                          : "rgba(211,47,47,.08)"
                    }
                  })}
                >
                  حذف
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {children.length > 0 && (
        <Stack spacing={0.2} sx={{ mt: 0.55 }}>
          {children.map((child) => (
            <OrgTreeNode
              key={child.orgUnitGuid}
              node={child}
              childrenMap={childrenMap}
              managersByUnit={managersByUnit}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function HrOrganizationDesigner() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookups, setLookups] = useState({ units: [], employees: [] });
  const [tree, setTree] = useState({ units: [], managers: [], members: [] });

  const [unitOpen, setUnitOpen] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyOrgUnitForm());
  const [managerForm, setManagerForm] = useState(emptyOrgManagerForm());
  const [memberUnitGuid, setMemberUnitGuid] = useState("");
  const [memberEmployeeGuid, setMemberEmployeeGuid] = useState("");
  const [memberPrimary, setMemberPrimary] = useState(true);
  const [previewEmployeeGuid, setPreviewEmployeeGuid] = useState("");
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const actor = useMemo(() => getOrgActor(), []);

  const requestHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(actor.actorUserGuid
        ? { "X-User-Guid": actor.actorUserGuid }
        : {})
    }),
    [actor.actorUserGuid]
  );

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [lookupResponse, treeResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hr/org-v2/lookups`, {
          cache: "no-store",
          headers: { Accept: "application/json" }
        }),
        fetch(`${API_BASE_URL}/api/hr/org-v2/tree`, {
          cache: "no-store",
          headers: { Accept: "application/json" }
        })
      ]);

      const [lookupResult, treeResult] = await Promise.all([
        lookupResponse.json().catch(() => null),
        treeResponse.json().catch(() => null)
      ]);

      if (!lookupResponse.ok) {
        throw new Error(
          lookupResult?.message || "تعذر تحميل إعدادات الهيكل الإداري"
        );
      }

      if (!treeResponse.ok) {
        throw new Error(
          treeResult?.message || "تعذر تحميل شجرة الهيكل الإداري"
        );
      }

      setLookups({
        units: Array.isArray(lookupResult?.data?.units)
          ? lookupResult.data.units
          : [],
        employees: Array.isArray(lookupResult?.data?.employees)
          ? lookupResult.data.employees
          : []
      });

      setTree({
        units: Array.isArray(treeResult?.data?.units)
          ? treeResult.data.units
          : [],
        managers: Array.isArray(treeResult?.data?.managers)
          ? treeResult.data.managers
          : [],
        members: Array.isArray(treeResult?.data?.members)
          ? treeResult.data.members
          : []
      });
    } catch (loadError) {
      setError(loadError?.message || "تعذر تحميل الهيكل الإداري");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const childrenMap = useMemo(() => {
    const map = new Map();

    tree.units.forEach((unit) => {
      const key = unit?.parentOrgUnitGuid || "ROOT";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(unit);
    });

    map.forEach((items, key) => {
      map.set(key, items.slice().sort(compareOrgUnits));
    });

    return map;
  }, [tree.units]);

  const managersByUnit = useMemo(() => {
    const map = new Map();

    tree.managers.forEach((manager) => {
      if (!map.has(manager?.orgUnitGuid)) {
        map.set(manager?.orgUnitGuid, []);
      }
      map.get(manager?.orgUnitGuid).push(manager);
    });

    map.forEach((items, key) => {
      map.set(
        key,
        items.slice().sort(
          (a, b) =>
            Number(a?.priority ?? 100) - Number(b?.priority ?? 100) ||
            Number(Boolean(b?.isPrimary)) - Number(Boolean(a?.isPrimary)) ||
            String(a?.managerName || "").localeCompare(
              String(b?.managerName || ""),
              "ar"
            )
        )
      );
    });

    return map;
  }, [tree.managers]);

  const roots = useMemo(
    () => (childrenMap.get("ROOT") || []).slice().sort(compareOrgUnits),
    [childrenMap]
  );

  const orderedUnits = useMemo(() => {
    const result = [];
    const visited = new Set();

    const walk = (unit, depth = 0) => {
      const guid = normalizeOrgGuid(unit?.orgUnitGuid);
      if (!guid || visited.has(guid)) return;
      visited.add(guid);

      result.push({ ...unit, __depth: depth });
      const children = childrenMap.get(unit?.orgUnitGuid) || [];
      children.forEach((child) => walk(child, depth + 1));
    };

    roots.forEach((root) => walk(root, 0));

    tree.units
      .slice()
      .sort(compareOrgUnits)
      .forEach((unit) => {
        if (!visited.has(normalizeOrgGuid(unit?.orgUnitGuid))) {
          walk(unit, 0);
        }
      });

    return result;
  }, [childrenMap, roots, tree.units]);

  const descendantGuidsForEditing = useMemo(() => {
    if (!unitForm?.orgUnitGuid) return new Set();

    const result = new Set([normalizeOrgGuid(unitForm.orgUnitGuid)]);
    const walk = (guid) => {
      const children = childrenMap.get(guid) || [];
      children.forEach((child) => {
        const childGuid = normalizeOrgGuid(child?.orgUnitGuid);
        if (!childGuid || result.has(childGuid)) return;
        result.add(childGuid);
        walk(child?.orgUnitGuid);
      });
    };

    walk(unitForm.orgUnitGuid);
    return result;
  }, [childrenMap, unitForm?.orgUnitGuid]);

  const openCreateUnit = () => {
    setUnitForm(emptyOrgUnitForm());
    setUnitOpen(true);
  };

  const openEditUnit = (unit) => {
    setUnitForm({
      orgUnitGuid: unit?.orgUnitGuid || null,
      unitCode: unit?.unitCode || "",
      unitName: unit?.unitName || "",
      unitType: unit?.unitType || "CUSTOM",
      parentOrgUnitGuid: unit?.parentOrgUnitGuid || "",
      sortOrder: Number(unit?.sortOrder ?? 100),
      notes: unit?.notes || ""
    });
    setUnitOpen(true);
  };

  const saveUnit = async () => {
    if (!String(unitForm?.unitName || "").trim()) {
      setError("اسم الوحدة مطلوب");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/hr/org-v2/unit`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          ...unitForm,
          unitName: String(unitForm.unitName).trim(),
          parentOrgUnitGuid: unitForm.parentOrgUnitGuid || null,
          sortOrder: Number(unitForm.sortOrder || 100),
          actorUserGuid: actor.actorUserGuid
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "تعذر حفظ الوحدة التنظيمية"
        );
      }

      setUnitOpen(false);
      setUnitForm(emptyOrgUnitForm());
      await loadAll();
    } catch (saveError) {
      setError(saveError?.message || "تعذر حفظ الوحدة التنظيمية");
    } finally {
      setLoading(false);
    }
  };

  const executeDeleteUnit = async () => {
    const guid = deleteTarget?.orgUnitGuid;
    if (!guid) return;

    try {
      setDeleteLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (actor.actorUserGuid) {
        params.set("actorUserGuid", actor.actorUserGuid);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/org-v2/unit/${encodeURIComponent(guid)}${
          params.toString() ? `?${params.toString()}` : ""
        }`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" }
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || "تعذر حذف الوحدة التنظيمية"
        );
      }

      setDeleteTarget(null);
      await loadAll();
    } catch (deleteError) {
      setError(deleteError?.message || "تعذر حذف الوحدة التنظيمية");
    } finally {
      setDeleteLoading(false);
    }
  };

  const saveManager = async () => {
    if (!managerForm.orgUnitGuid || !managerForm.managerUserGuid) {
      setError("اختر الوحدة والمسؤول أولًا");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/hr/org-v2/manager`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          ...managerForm,
          priority: Number(managerForm.priority || 100),
          actorUserGuid: actor.actorUserGuid
        })
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر حفظ المسؤول");
      }

      setManagerForm(emptyOrgManagerForm());
      await loadAll();
    } catch (managerError) {
      setError(managerError?.message || "تعذر حفظ المسؤول");
    } finally {
      setLoading(false);
    }
  };

  const removeManager = async (guid) => {
    if (!guid) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/org-v2/manager/${encodeURIComponent(guid)}`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "تعذر إيقاف تعيين المسؤول");
      }

      await loadAll();
    } catch (managerError) {
      setError(managerError?.message || "تعذر إيقاف تعيين المسؤول");
    } finally {
      setLoading(false);
    }
  };

  const saveMember = async () => {
    if (!memberUnitGuid || !memberEmployeeGuid) {
      setError("اختر الوحدة والموظف أولًا");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/hr/org-v2/member`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          orgUnitGuid: memberUnitGuid,
          employeeGuid: memberEmployeeGuid,
          isPrimary: memberPrimary,
          actorUserGuid: actor.actorUserGuid
        })
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || "تعذر ربط الموظف");
      }

      setMemberEmployeeGuid("");
      await loadAll();
    } catch (memberError) {
      setError(memberError?.message || "تعذر ربط الموظف");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (guid) => {
    if (!guid) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/org-v2/member/${encodeURIComponent(guid)}`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "تعذر إزالة عضوية الموظف");
      }

      await loadAll();
    } catch (memberError) {
      setError(memberError?.message || "تعذر إزالة عضوية الموظف");
    } finally {
      setLoading(false);
    }
  };

  const testEmployee = async () => {
    if (!previewEmployeeGuid) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/org-v2/manager-chain/${encodeURIComponent(
          previewEmployeeGuid
        )}`,
        { cache: "no-store", headers: { Accept: "application/json" } }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "تعذر اختبار الهيكل الإداري");
      }

      setPreview(result);
    } catch (previewError) {
      setError(previewError?.message || "تعذر اختبار الهيكل الإداري");
    } finally {
      setLoading(false);
    }
  };

  const renderUnitOption = (unit) => (
    <MenuItem key={unit.orgUnitGuid} value={unit.orgUnitGuid}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.7,
          width: "100%",
          paddingInlineStart: `${Math.min(Number(unit.__depth || 0), 7) * 12}px`
        }}
      >
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 850 }}>
          {unit.unitName}
        </Typography>
        <Typography sx={{ fontSize: ".66rem", color: "text.secondary" }}>
          {getOrgUnitMeta(unit.unitType).short}
        </Typography>
      </Box>
    </MenuItem>
  );

  const reversedPreviewChain = useMemo(() => {
    const chain = Array.isArray(preview?.chain) ? preview.chain : [];
    return chain.slice().reverse();
  }, [preview]);

  return (
    <Box dir="rtl" sx={{ minWidth: 0 }}>
      <Paper
        elevation={0}
        sx={(theme) => ({
          mb: 1.2,
          p: { xs: 1, sm: 1.2 },
          borderRadius: 2.7,
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? "rgba(80,205,147,.28)"
              : "rgba(5,117,70,.18)",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(5,117,70,.12)"
              : "rgba(5,117,70,.04)"
        })}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ lg: "center" }}
          gap={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={0.8}>
              <Avatar
                variant="rounded"
                sx={(theme) => ({
                  width: 38,
                  height: 38,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(80,205,147,.16)"
                      : "rgba(5,117,70,.10)",
                  color:
                    theme.palette.mode === "dark" ? "#7ad8aa" : primaryColor
                })}
              >
                <AccountTreeRoundedIcon />
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    color: "text.primary"
                  }}
                >
                  الهيكل التنظيمي الفعلي
                </Typography>
                <Typography
                  sx={{
                    mt: 0.2,
                    fontFamily: "Cairo",
                    fontSize: ".68rem",
                    color: "text.secondary"
                  }}
                >
                  الفئة الأعلى تظهر أولًا، ثم الأولوية داخل نفس المستوى، وبعدها الوحدات التابعة تحت أبيها مباشرة.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.7}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAll}
              disabled={loading}
              sx={(theme) => ({
                minHeight: 40,
                borderRadius: 2,
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "text.primary",
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,.22)"
                    : "rgba(5,117,70,.28)",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,.04)"
                    : "transparent"
              })}
            >
              تحديث
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateUnit}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                fontFamily: "Cairo",
                fontWeight: 950,
                bgcolor: primaryColor,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { bgcolor: primaryDark, boxShadow: "none" }
              }}
            >
              وحدة جديدة
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={(theme) => ({
          mb: 1.15,
          minHeight: 44,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": {
            minHeight: 44,
            fontFamily: "Cairo",
            fontWeight: 900,
            color: "text.secondary",
            borderRadius: "10px 10px 0 0",
            px: { xs: 1.2, sm: 1.8 }
          },
          "& .MuiTab-root.Mui-selected": {
            color: theme.palette.mode === "dark" ? "#79d7aa" : primaryColor,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(5,117,70,.14)"
                : "rgba(5,117,70,.05)"
          },
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: 3,
            bgcolor: theme.palette.mode === "dark" ? "#56c98d" : primaryColor
          }
        })}
      >
        <Tab label="الهيكل التنظيمي" />
        <Tab label="المسؤولون والصلاحيات" />
        <Tab label="أعضاء الوحدات" />
        <Tab label="اختبار الهيكل" />
      </Tabs>

      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 3 }}>
          <CircularProgress size={30} />
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1.1, fontFamily: "Cairo" }}>
          {error}
        </Alert>
      )}

      {tab === 0 && !loading && (
        <Box>
          <Alert
            severity="info"
            sx={{ mb: 1.1, fontFamily: "Cairo", alignItems: "center" }}
          >
            داخل كل مستوى: الإدارات والأقسام قبل الفروع، والفروع قبل الفرق، ثم يتم تطبيق رقم الأولوية؛ الرقم الأصغر يظهر أولًا.
          </Alert>

          <Stack spacing={0.2}>
            {roots.map((root) => (
              <OrgTreeNode
                key={root.orgUnitGuid}
                node={root}
                childrenMap={childrenMap}
                managersByUnit={managersByUnit}
                onEdit={openEditUnit}
                onDelete={setDeleteTarget}
              />
            ))}
          </Stack>

          {!roots.length && (
            <Alert severity="warning" sx={{ fontFamily: "Cairo" }}>
              لا توجد وحدة جذر فعالة في الهيكل.
            </Alert>
          )}
        </Box>
      )}

      {tab === 1 && !loading && (
        <Stack spacing={1.05}>
          <Paper
            variant="outlined"
            sx={{ p: 1.2, borderRadius: 2.5, borderColor: "divider" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1.05fr 1.45fr 1fr .7fr auto"
                },
                gap: 1,
                alignItems: "end"
              }}
            >
              <FormControl size="small" sx={uiLayout.formFieldSx}>
                <InputLabel>الوحدة</InputLabel>
                <Select
                  label="الوحدة"
                  value={managerForm.orgUnitGuid}
                  onChange={(event) =>
                    setManagerForm((current) => ({
                      ...current,
                      orgUnitGuid: event.target.value
                    }))
                  }
                >
                  {orderedUnits.map(renderUnitOption)}
                </Select>
              </FormControl>

              <Autocomplete
                size="small"
                options={lookups.employees}
                getOptionLabel={(option) =>
                  `${option?.employeeName || ""}${
                    option?.jobTitleName ? ` - ${option.jobTitleName}` : ""
                  }`
                }
                value={
                  lookups.employees.find(
                    (employee) =>
                      normalizeOrgGuid(employee?.employeeGuid) ===
                      normalizeOrgGuid(managerForm.managerUserGuid)
                  ) || null
                }
                onChange={(_, value) =>
                  setManagerForm((current) => ({
                    ...current,
                    managerUserGuid: value?.employeeGuid || ""
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={uiLayout.formFieldSx}
                    InputLabelProps={{ shrink: true }}
                    label="المسؤول"
                  />
                )}
              />

              <FormControl size="small" sx={uiLayout.formFieldSx}>
                <InputLabel>الصفة</InputLabel>
                <Select
                  label="الصفة"
                  value={managerForm.managerRole}
                  onChange={(event) =>
                    setManagerForm((current) => ({
                      ...current,
                      managerRole: event.target.value
                    }))
                  }
                >
                  <MenuItem value="COMPANY_HEAD">رئيس الشركة</MenuItem>
                  <MenuItem value="EXECUTIVE_MANAGER">مدير تنفيذي</MenuItem>
                  <MenuItem value="GENERAL_SUPERVISOR">مشرف عام</MenuItem>
                  <MenuItem value="DEPARTMENT_MANAGER">مدير إدارة / قسم</MenuItem>
                  <MenuItem value="BRANCH_SUPERVISOR">مشرف فرع</MenuItem>
                  <MenuItem value="ADMIN_MANAGER">مدير إداري</MenuItem>
                  <MenuItem value="DEPUTY">نائب / بديل</MenuItem>
                  <MenuItem value="MANAGER">مسؤول</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="number"
                label="الأولوية"
                value={managerForm.priority}
                onChange={(event) =>
                  setManagerForm((current) => ({
                    ...current,
                    priority: Number(event.target.value || 100)
                  }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ dir: "ltr" }}
              />

              <Button
                variant="contained"
                startIcon={<SupervisorAccountRoundedIcon />}
                onClick={saveManager}
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  bgcolor: primaryColor,
                  boxShadow: "none",
                  "&:hover": { bgcolor: primaryDark, boxShadow: "none" }
                }}
              >
                حفظ المسؤول
              </Button>
            </Box>

            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              gap={0.3}
              sx={{ mt: 1 }}
            >
              {[
                ["isPrimary", "مسؤول أساسي"],
                ["canViewTeam", "يرى الفريق"],
                ["canViewDescendants", "يرى الوحدات التابعة"],
                ["canApproveLeaves", "يعتمد الإجازات"],
                ["canApprovePermissions", "يعتمد الأذونات"],
                ["canReviewAttendance", "يراجع الحضور"]
              ].map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  sx={{
                    m: 0,
                    px: 0.55,
                    borderRadius: 1.5,
                    "& .MuiFormControlLabel-label": {
                      fontFamily: "Cairo",
                      fontSize: ".70rem",
                      fontWeight: 800
                    }
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(managerForm[key])}
                      onChange={(event) =>
                        setManagerForm((current) => ({
                          ...current,
                          [key]: event.target.checked
                        }))
                      }
                    />
                  }
                  label={label}
                />
              ))}
            </Stack>
          </Paper>

          {orderedUnits.map((unit) => {
            const managers = managersByUnit.get(unit.orgUnitGuid) || [];
            if (!managers.length) return null;

            return (
              <Paper
                key={unit.orgUnitGuid}
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 2.4,
                  borderColor: "divider",
                  marginInlineStart: `${Math.min(Number(unit.__depth || 0), 6) * 10}px`
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  gap={0.6}
                  sx={{ mb: 0.7 }}
                >
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 950 }}>
                    {unit.unitName}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={getOrgUnitMeta(unit.unitType).label}
                  />
                </Stack>

                <Stack spacing={0.55}>
                  {managers.map((manager) => (
                    <Stack
                      key={manager.orgUnitManagerGuid}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                      gap={0.8}
                      sx={(theme) => ({
                        p: 0.8,
                        borderRadius: 1.8,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,.03)"
                            : "rgba(15,23,42,.025)",
                        border: "1px solid",
                        borderColor: "divider"
                      })}
                    >
                      <Box>
                        <Typography
                          sx={{ fontFamily: "Cairo", fontWeight: 900 }}
                        >
                          {manager.managerName} — {getOrgRoleName(manager.managerRole)}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.2,
                            fontFamily: "Cairo",
                            fontSize: ".65rem",
                            color: "text.secondary"
                          }}
                        >
                          أولوية {Number(manager.priority ?? 100)}
                          {manager.isPrimary ? " • أساسي" : ""}
                          {manager.canViewTeam ? " • رؤية الفريق" : " • بدون رؤية"}
                          {manager.canViewDescendants ? " • يرى التابع" : ""}
                          {manager.canApproveLeaves ? " • إجازات" : ""}
                          {manager.canApprovePermissions ? " • أذونات" : ""}
                          {manager.canReviewAttendance ? " • حضور" : ""}
                        </Typography>
                      </Box>

                      <Tooltip title="إزالة تعيين المسؤول">
                        <IconButton
                          color="error"
                          onClick={() => removeManager(manager.orgUnitManagerGuid)}
                          sx={(theme) => ({
                            border: "1px solid",
                            borderColor:
                              theme.palette.mode === "dark"
                                ? "rgba(239,68,68,.35)"
                                : "rgba(211,47,47,.22)",
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "rgba(239,68,68,.08)"
                                : "rgba(211,47,47,.035)"
                          })}
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {tab === 2 && !loading && (
        <Stack spacing={1.05}>
          <Alert severity="info" sx={{ fontFamily: "Cairo" }}>
            العضوية الأساسية هي مكان الموظف الرئيسي في الهيكل. يمكن الاحتفاظ بعلاقات ثانوية عند الحاجة.
          </Alert>

          <Paper
            variant="outlined"
            sx={{ p: 1.2, borderRadius: 2.5, borderColor: "divider" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1.5fr auto auto"
                },
                gap: 1,
                alignItems: "end"
              }}
            >
              <FormControl size="small" sx={uiLayout.formFieldSx}>
                <InputLabel>الوحدة</InputLabel>
                <Select
                  label="الوحدة"
                  value={memberUnitGuid}
                  onChange={(event) => setMemberUnitGuid(event.target.value)}
                >
                  {orderedUnits.map(renderUnitOption)}
                </Select>
              </FormControl>

              <Autocomplete
                size="small"
                options={lookups.employees}
                getOptionLabel={(option) =>
                  `${option?.employeeName || ""}${
                    option?.jobTitleName ? ` - ${option.jobTitleName}` : ""
                  }`
                }
                value={
                  lookups.employees.find(
                    (employee) =>
                      normalizeOrgGuid(employee?.employeeGuid) ===
                      normalizeOrgGuid(memberEmployeeGuid)
                  ) || null
                }
                onChange={(_, value) =>
                  setMemberEmployeeGuid(value?.employeeGuid || "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={uiLayout.formFieldSx}
                    InputLabelProps={{ shrink: true }}
                    label="الموظف"
                  />
                )}
              />

              <FormControlLabel
                sx={{
                  m: 0,
                  minHeight: 40,
                  px: 0.5,
                  "& .MuiFormControlLabel-label": {
                    fontFamily: "Cairo",
                    fontWeight: 850,
                    fontSize: ".72rem"
                  }
                }}
                control={
                  <Checkbox
                    checked={memberPrimary}
                    onChange={(event) => setMemberPrimary(event.target.checked)}
                  />
                }
                label="الوحدة الأساسية"
              />

              <Button
                variant="contained"
                startIcon={<GroupsIcon />}
                onClick={saveMember}
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  bgcolor: primaryColor,
                  boxShadow: "none",
                  "&:hover": { bgcolor: primaryDark, boxShadow: "none" }
                }}
              >
                ربط الموظف
              </Button>
            </Box>
          </Paper>

          {orderedUnits.map((unit) => {
            const members = tree.members
              .filter(
                (member) =>
                  normalizeOrgGuid(member?.orgUnitGuid) ===
                  normalizeOrgGuid(unit?.orgUnitGuid)
              )
              .sort(
                (a, b) =>
                  Number(Boolean(b?.isPrimary)) - Number(Boolean(a?.isPrimary)) ||
                  String(a?.employeeName || "").localeCompare(
                    String(b?.employeeName || ""),
                    "ar"
                  )
              );

            if (!members.length) return null;

            return (
              <Paper
                key={unit.orgUnitGuid}
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 2.4,
                  borderColor: "divider",
                  marginInlineStart: `${Math.min(Number(unit.__depth || 0), 6) * 10}px`
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  gap={0.6}
                  sx={{ mb: 0.75 }}
                >
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 950 }}>
                    {unit.unitName}
                  </Typography>
                  <Chip size="small" label={`${members.length} عضو`} />
                </Stack>

                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.6}>
                  {members.map((member) => (
                    <Chip
                      key={member.orgUnitMemberGuid}
                      label={`${member.employeeName}${
                        member.isPrimary ? " • أساسي" : ""
                      }`}
                      variant={member.isPrimary ? "filled" : "outlined"}
                      onDelete={() => removeMember(member.orgUnitMemberGuid)}
                      sx={(theme) => ({
                        fontFamily: "Cairo",
                        fontWeight: member.isPrimary ? 900 : 800,
                        bgcolor: member.isPrimary
                          ? theme.palette.mode === "dark"
                            ? "rgba(38,122,82,.34)"
                            : "#dff3e8"
                          : theme.palette.mode === "dark"
                            ? "rgba(255,255,255,.045)"
                            : "transparent",
                        color: member.isPrimary
                          ? theme.palette.mode === "dark"
                            ? "#b9e8d0"
                            : primaryDark
                          : "text.primary",
                        border: "1px solid",
                        borderColor: member.isPrimary
                          ? theme.palette.mode === "dark"
                            ? "rgba(93,190,139,.34)"
                            : "rgba(5,117,70,.18)"
                          : "divider",
                        "& .MuiChip-deleteIcon": {
                          color: theme.palette.mode === "dark"
                            ? "#8fd3b2"
                            : "rgba(5,117,70,.72)",
                          "&:hover": {
                            color: theme.palette.mode === "dark"
                              ? "#d8f5e6"
                              : primaryDark
                          }
                        }
                      })}
                    />
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {tab === 3 && !loading && (
        <Stack spacing={1.1}>
          <Paper
            variant="outlined"
            sx={{ p: 1.2, borderRadius: 2.5, borderColor: "divider" }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ md: "end" }}
              gap={1}
            >
              <Autocomplete
                fullWidth
                options={lookups.employees}
                getOptionLabel={(option) =>
                  `${option?.employeeName || ""}${
                    option?.jobTitleName ? ` - ${option.jobTitleName}` : ""
                  }`
                }
                value={
                  lookups.employees.find(
                    (employee) =>
                      normalizeOrgGuid(employee?.employeeGuid) ===
                      normalizeOrgGuid(previewEmployeeGuid)
                  ) || null
                }
                onChange={(_, value) => {
                  setPreviewEmployeeGuid(value?.employeeGuid || "");
                  setPreview(null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={uiLayout.formFieldSx}
                    InputLabelProps={{ shrink: true }}
                    label="الموظف"
                  />
                )}
              />

              <Button
                variant="contained"
                disabled={!previewEmployeeGuid}
                startIcon={<AccountTreeRoundedIcon />}
                onClick={testEmployee}
                sx={(theme) => ({
                  minHeight: 42,
                  minWidth: { md: 190 },
                  borderRadius: 2,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: "#fff",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "#0b5a3d"
                      : primaryColor,
                  border: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? "rgba(150,220,183,.22)"
                      : "transparent",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "#0e6a48"
                        : primaryDark,
                    boxShadow: "none"
                  },
                  "&.Mui-disabled": {
                    color:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,.38)"
                        : undefined,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,.06)"
                        : undefined,
                    borderColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,.08)"
                        : undefined
                  }
                })}
              >
                عرض السلسلة الإدارية
              </Button>
            </Stack>
          </Paper>

          {preview && (
            <Paper
              elevation={0}
              sx={(theme) => ({
                p: { xs: 1.15, sm: 1.5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(80,205,147,.28)"
                    : "rgba(5,117,70,.18)",
                bgcolor: "background.paper"
              })}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                gap={0.8}
                sx={{ mb: 1.2 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      color: "text.primary"
                    }}
                  >
                    السلسلة الإدارية الفعلية
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.2,
                      fontFamily: "Cairo",
                      fontSize: ".68rem",
                      color: "text.secondary"
                    }}
                  >
                    من أعلى مستوى إداري إلى الوحدة الأقرب للموظف.
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${reversedPreviewChain.length} مستوى`}
                  sx={(theme) => ({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,.055)"
                        : "rgba(5,117,70,.06)",
                    color:
                      theme.palette.mode === "dark"
                        ? "#d8e7e0"
                        : primaryDark,
                    border: "1px solid",
                    borderColor:
                      theme.palette.mode === "dark"
                        ? "rgba(192,218,205,.18)"
                        : "rgba(5,117,70,.12)"
                  })}
                />
              </Stack>

              <Box sx={{ position: "relative" }}>
                {reversedPreviewChain.map((level, index) => {
                  const isLast = index === reversedPreviewChain.length - 1;
                  const managers = Array.isArray(level?.managers)
                    ? level.managers.slice().sort(
                        (a, b) =>
                          Number(a?.priority ?? 100) -
                            Number(b?.priority ?? 100) ||
                          Number(Boolean(b?.isPrimary)) -
                            Number(Boolean(a?.isPrimary))
                      )
                    : [];

                  return (
                    <Box
                      key={`${level?.orgUnitGuid || "level"}-${index}`}
                      sx={{
                        position: "relative",
                        display: "grid",
                        gridTemplateColumns: "42px minmax(0,1fr)",
                        gap: 1,
                        pb: isLast ? 0 : 1.1
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          justifyContent: "center"
                        }}
                      >
                        {!isLast && (
                          <Box
                            sx={(theme) => ({
                              position: "absolute",
                              top: 36,
                              bottom: -12,
                              width: 2,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(86,201,141,.28)"
                                  : "rgba(5,117,70,.16)"
                            })}
                          />
                        )}
                        <Avatar
                          sx={(theme) => ({
                            width: 34,
                            height: 34,
                            fontSize: ".74rem",
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "rgba(5,117,70,.34)"
                                : primaryColor,
                            color: "#fff",
                            border: "2px solid",
                            borderColor: theme.palette.background.paper,
                            zIndex: 1
                          })}
                        >
                          {index + 1}
                        </Avatar>
                      </Box>

                      <Paper
                        variant="outlined"
                        sx={(theme) => ({
                          p: 1,
                          borderRadius: 2.3,
                          borderColor: "divider",
                          bgcolor:
                            index === 0
                              ? theme.palette.mode === "dark"
                                ? "rgba(5,117,70,.12)"
                                : "rgba(5,117,70,.035)"
                              : theme.palette.background.paper
                        })}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                          gap={0.6}
                        >
                          <Typography
                            sx={{ fontFamily: "Cairo", fontWeight: 950 }}
                          >
                            {level?.unitName || "وحدة"}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={getOrgUnitMeta(level?.unitType).label}
                          />
                          {index === 0 && (
                            <Chip
                              size="small"
                              label="الأعلى"
                              sx={(theme) => ({
                                fontFamily: "Cairo",
                                fontWeight: 950,
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? "#214f3d"
                                    : "#dff4e8",
                                color:
                                  theme.palette.mode === "dark"
                                    ? "#e6f7ee"
                                    : "#075b3a",
                                border: "1px solid",
                                borderColor:
                                  theme.palette.mode === "dark"
                                    ? "rgba(150,220,183,.26)"
                                    : "rgba(5,117,70,.18)"
                              })}
                            />
                          )}
                          {isLast && (
                            <Chip
                              size="small"
                              label="الأقرب للموظف"
                              sx={(theme) => ({
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,.06)"
                                    : "#f4f7f5",
                                color:
                                  theme.palette.mode === "dark"
                                    ? "#e1ebe6"
                                    : "#34483f",
                                border: "1px solid",
                                borderColor:
                                  theme.palette.mode === "dark"
                                    ? "rgba(200,220,210,.20)"
                                    : "rgba(52,72,63,.14)"
                              })}
                            />
                          )}
                        </Stack>

                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          useFlexGap
                          gap={0.5}
                          sx={{ mt: 0.75 }}
                        >
                          {managers.length ? (
                            managers.map((manager) => (
                              <Chip
                                key={`${manager?.managerUserGuid || manager?.managerName}-${manager?.managerRole}`}
                                size="small"
                                variant="outlined"
                                label={`${manager?.managerName || "مسؤول"} • ${getOrgRoleName(
                                  manager?.managerRole
                                )}`}
                                sx={(theme) => ({
                                  fontFamily: "Cairo",
                                  fontWeight: manager?.isPrimary ? 950 : 800,
                                  bgcolor: manager?.isPrimary
                                    ? theme.palette.mode === "dark"
                                      ? "#24583f"
                                      : "#e3f5ea"
                                    : theme.palette.mode === "dark"
                                      ? "rgba(255,255,255,.035)"
                                      : "transparent",
                                  color: manager?.isPrimary
                                    ? theme.palette.mode === "dark"
                                      ? "#eefaf3"
                                      : "#075b3a"
                                    : theme.palette.mode === "dark"
                                      ? "#d8e5df"
                                      : "text.primary",
                                  borderColor: manager?.isPrimary
                                    ? theme.palette.mode === "dark"
                                      ? "rgba(144,216,177,.30)"
                                      : "rgba(5,117,70,.20)"
                                    : theme.palette.mode === "dark"
                                      ? "rgba(190,214,203,.22)"
                                      : "divider",
                                  "& .MuiChip-label": {
                                    px: 1.1
                                  }
                                })}
                              />
                            ))
                          ) : (
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: ".67rem",
                                color: "text.secondary"
                              }}
                            >
                              لا يوجد مسؤول في هذا المستوى
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    </Box>
                  );
                })}

                {!reversedPreviewChain.length && (
                  <Alert severity="warning" sx={{ fontFamily: "Cairo" }}>
                    الموظف لا يملك سلسلة إدارية فعالة حاليًا.
                  </Alert>
                )}
              </Box>
            </Paper>
          )}
        </Stack>
      )}

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        fullWidth
        maxWidth="sm"
        dir="rtl"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 950 }}>
                {unitForm.orgUnitGuid
                  ? "تعديل الوحدة التنظيمية"
                  : "وحدة تنظيمية جديدة"}
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontFamily: "Cairo",
                  fontSize: ".66rem",
                  color: "text.secondary"
                }}
              >
                الأب يحدد مكان الوحدة، والأولوية ترتب الوحدات داخل نفس المستوى.
              </Typography>
            </Box>
            <IconButton onClick={() => setUnitOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.05} sx={{ pt: 0.5 }}>
            <TextField
              sx={uiLayout.formFieldSx}
              InputLabelProps={{ shrink: true }}
              label="اسم الوحدة"
              value={unitForm.unitName}
              onChange={(event) =>
                setUnitForm((current) => ({
                  ...current,
                  unitName: event.target.value
                }))
              }
            />

            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>نوع الوحدة</InputLabel>
              <Select
                label="نوع الوحدة"
                value={unitForm.unitType}
                onChange={(event) =>
                  setUnitForm((current) => ({
                    ...current,
                    unitType: event.target.value
                  }))
                }
              >
                <MenuItem value="COMPANY">شركة / جذر</MenuItem>
                <MenuItem value="DEPARTMENT">إدارة / قسم</MenuItem>
                <MenuItem value="BRANCH">فرع</MenuItem>
                <MenuItem value="TEAM">فريق</MenuItem>
                <MenuItem value="CUSTOM">وحدة مخصصة</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={uiLayout.formFieldSx}>
              <InputLabel>تحت أي وحدة؟</InputLabel>
              <Select
                label="تحت أي وحدة؟"
                value={unitForm.parentOrgUnitGuid || ""}
                onChange={(event) =>
                  setUnitForm((current) => ({
                    ...current,
                    parentOrgUnitGuid: event.target.value
                  }))
                }
              >
                <MenuItem value="">بدون أب / جذر</MenuItem>
                {orderedUnits
                  .filter(
                    (unit) =>
                      !descendantGuidsForEditing.has(
                        normalizeOrgGuid(unit?.orgUnitGuid)
                      )
                  )
                  .map(renderUnitOption)}
              </Select>
            </FormControl>

            <TextField
              sx={uiLayout.formFieldSx}
              InputLabelProps={{ shrink: true }}
              type="number"
              label="أولوية العرض داخل نفس المستوى"
              helperText="الرقم الأصغر يظهر أولًا بعد تجميع الفئات الأعلى معًا. مثال: 10 قبل 20 قبل 30."
              value={unitForm.sortOrder}
              onChange={(event) =>
                setUnitForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value || 100)
                }))
              }
              inputProps={{
                dir: "ltr",
                style: { direction: "ltr", unicodeBidi: "isolate" }
              }}
            />

            <TextField
              sx={uiLayout.formFieldSx}
              InputLabelProps={{ shrink: true }}
              multiline
              minRows={2}
              label="ملاحظات"
              value={unitForm.notes || ""}
              onChange={(event) =>
                setUnitForm((current) => ({
                  ...current,
                  notes: event.target.value
                }))
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button onClick={() => setUnitOpen(false)} sx={uiLayout.buttonSx}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={saveUnit}
            sx={uiLayout.withUiSx(
              {
                bgcolor: primaryColor,
                fontFamily: "Cairo",
                fontWeight: 950,
                "&:hover": { bgcolor: primaryDark }
              },
              uiLayout.buttonSx
            )}
          >
            حفظ الوحدة
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={0.7}>
            <DeleteOutlineRoundedIcon color="error" />
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 950 }}>
              حذف الوحدة التنظيمية
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            sx={{ fontFamily: "Cairo", lineHeight: 1.9, color: "text.primary" }}
          >
            هل تريد حذف وحدة
            <Box component="span" sx={{ mx: 0.6, fontWeight: 950 }}>
              {deleteTarget?.unitName}
            </Box>
            من الهيكل؟
          </Typography>
          <Alert severity="warning" sx={{ mt: 1, fontFamily: "Cairo" }}>
            إذا كانت الوحدة تحتوي على وحدات تابعة أو أعضاء مباشرين سيمنع النظام الحذف حتى يتم نقلهم أولًا.
          </Alert>
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
            sx={uiLayout.buttonSx}
          >
            رجوع
          </Button>
          <Button
            color="error"
            variant="contained"
            startIcon={
              deleteLoading ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
            onClick={executeDeleteUnit}
            disabled={deleteLoading}
            sx={{
              minHeight: 38,
              borderRadius: 2,
              fontFamily: "Cairo",
              fontWeight: 950,
              boxShadow: "none"
            }}
          >
            حذف الوحدة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


const HrDepartmentsPage = () => {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isPhone = useMediaQuery("(max-width:599px)");
  const isCompact = !isDesktop;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  // خيارات مدير القسم: موظفو نفس القسم فقط
  const [departmentManagers, setDepartmentManagers] = useState([]);
  const [departmentManagersLoading, setDepartmentManagersLoading] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [error, setError] = useState("");

  const [orgOpen, setOrgOpen] = useState(false);
  const [orgTab, setOrgTab] = useState(0);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgLookups, setOrgLookups] = useState({
    branches: [], departments: [], jobTitles: [], employees: []
  });
  const [orgAssignments, setOrgAssignments] = useState([]);
  const [orgRules, setOrgRules] = useState([]);
  const [orgAssignmentForm, setOrgAssignmentForm] = useState({
    scopeType: 1, scopeGuid: "", managerUserGuid: "",
    managerKind: "BRANCH_SUPERVISOR", priority: 10,
    isPrimary: false, canApproveLeaves: true, notes: ""
  });
  const [orgRuleForm, setOrgRuleForm] = useState({
    ruleName: "", sourceLegacyJobCode: "", sourceDepartmentGuid: "",
    managerSourceType: "BRANCH_MANAGERS", targetDepartmentGuid: "",
    priority: 100, isActive: true, notes: ""
  });
  const [orgPreviewEmployeeGuid, setOrgPreviewEmployeeGuid] = useState("");
  const [orgPreview, setOrgPreview] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    isActive: ""
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    isActive: ""
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeesDepartment, setEmployeesDepartment] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // نقل الموظفين بين الأقسام
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeGuids, setSelectedEmployeeGuids] = useState([]);
  const [transferTargetGuid, setTransferTargetGuid] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferringEmployees, setTransferringEmployees] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  // منع تعطيل قسم به موظفون نشطون
  const [deactivateBlockedOpen, setDeactivateBlockedOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDepartment, setHistoryDepartment] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (appliedFilters.search.trim()) {
        params.set("search", appliedFilters.search.trim());
      }

      if (appliedFilters.isActive !== "") {
        params.set("isActive", String(appliedFilters.isActive));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments${
          params.toString() ? `?${params}` : ""
        }`,
        {
          headers: { Accept: "application/json" }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل الأقسام");
      }

      setDepartments(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setDepartments([]);
      setError(err?.message || "حدث خطأ أثناء تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const loadLookups = useCallback(async () => {
    try {
      setLookupsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/lookups`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل القوائم");
      }

      setManagers(
        Array.isArray(result?.data?.managers)
          ? result.data.managers
          : []
      );
    } catch (err) {
      console.error("Department lookups error:", err);
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d?.isActive === true).length;
    const inactive = total - active;
    const employees = departments.reduce(
      (sum, d) => sum + Number(d?.employeeCount || 0),
      0
    );

    return { total, active, inactive, employees };
  }, [departments]);

  const filteredDepartmentEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();

    if (!q) return departmentEmployees;

    return departmentEmployees.filter((employee) => {
      const values = [
        employee?.fullName,
        employee?.employeeCode,
        employee?.mobile,
        employee?.email,
        employee?.jobTitle
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(q)
      );
    });
  }, [departmentEmployees, employeeSearch]);

  const transferTargetDepartment = useMemo(
    () =>
      departments.find(
        (department) =>
          String(department?.departmentGuid || "").toLowerCase() ===
          String(transferTargetGuid || "").toLowerCase()
      ) || null,
    [departments, transferTargetGuid]
  );

  // تحميل جميع موظفي القسم من نفس endpoint المستخدم في شاشة ملفات الموظفين.
  // مهم: endpoint الخاص بـ /departments/{guid}/employees يعيد 20 سجل فقط في البيئة الحالية،
  // لذلك نعتمد على /api/hr/employees مع فلتر departmentGuid لأنه يعيد القائمة الكاملة،
  // ثم نعمل فلترة/إزالة تكرار دفاعية على الفرونت.
  const fetchAllDepartmentEmployees = useCallback(
    async (departmentGuid, expectedCount = 0) => {
      if (!departmentGuid) return [];

      const normalizeEmployeesResponse = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.items)) return payload.data.items;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.results)) return payload.results;
        return [];
      };

      const normalizeGuid = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();

      const removeDuplicates = (employees) => {
        const seen = new Set();

        return employees.filter((employee, index) => {
          const key = normalizeGuid(
            employee?.employeeGuid ||
            employee?.guid ||
            employee?.employeeId ||
            employee?.id ||
            employee?.employeeCode ||
            employee?.nationalId ||
            employee?.email ||
            employee?.mobile ||
            `${employee?.fullName || employee?.name || "employee"}-${index}`
          );

          if (!key || seen.has(key)) return false;

          seen.add(key);
          return true;
        });
      };

      const wantedDepartmentGuid = normalizeGuid(departmentGuid);

      // هذا هو نفس الـ endpoint المستخدم في شاشة الموظفين،
      // والفلتر departmentGuid مدعوم بالفعل هناك.
      const params = new URLSearchParams();
      params.set("departmentGuid", departmentGuid);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/employees?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" }
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل جميع موظفي القسم"
        );
      }

      let employees = normalizeEmployeesResponse(result);

      // حماية إضافية: لو الـ API أعاد موظفين من أقسام أخرى لأي سبب،
      // نحتفظ فقط بموظفي القسم المطلوب. ولو الحقل غير موجود في الاستجابة
      // نثق في فلتر الـ API ولا نستبعد السجل.
      const employeesWithDepartmentInfo = employees.filter(
        (employee) => employee?.departmentGuid
      );

      if (employeesWithDepartmentInfo.length > 0) {
        employees = employees.filter(
          (employee) =>
            normalizeGuid(employee?.departmentGuid) ===
            wantedDepartmentGuid
        );
      }

      employees = removeDuplicates(employees);

      // expectedCount للعرض/التشخيص فقط؛ لا نقصّ النتائج ولا نحددها بـ 20.
      if (
        Number(expectedCount) > 0 &&
        employees.length < Number(expectedCount)
      ) {
        console.warn(
          `Department employees count mismatch: expected ${expectedCount}, received ${employees.length}`,
          {
            departmentGuid,
            expectedCount: Number(expectedCount),
            receivedCount: employees.length
          }
        );
      }

      return employees;
    },
    []
  );

  const loadDepartmentManagers = useCallback(
    async (departmentGuid, currentManagerGuid = "", expectedCount = 0) => {
      if (!departmentGuid) {
        setDepartmentManagers([]);
        return;
      }

      try {
        setDepartmentManagersLoading(true);
        setDepartmentManagers([]);

        const employees = await fetchAllDepartmentEmployees(
          departmentGuid,
          expectedCount
        );

        const currentGuid = String(currentManagerGuid || "")
          .trim()
          .toLowerCase();

        const options = employees
          .filter((employee) => {
            const guid = String(
              employee?.employeeGuid ||
              employee?.guid ||
              ""
            )
              .trim()
              .toLowerCase();

            return employee?.isActive === true || guid === currentGuid;
          })
          .sort((a, b) =>
            String(a?.fullName || "").localeCompare(
              String(b?.fullName || ""),
              "ar"
            )
          );

        setDepartmentManagers(options);
      } catch (err) {
        console.error("Department managers error:", err);
        setDepartmentManagers([]);
        setFormError(
          err?.message || "حدث خطأ أثناء تحميل موظفي القسم"
        );
      } finally {
        setDepartmentManagersLoading(false);
      }
    },
    [fetchAllDepartmentEmployees]
  );

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setDepartmentManagers([]);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = async (department) => {
    setEditingDepartment(department);
    setDepartmentManagers([]);
    setForm({
      departmentName: department?.departmentName || "",
      managerGuid: department?.managerGuid || "",
      description: department?.description || "",
      notes: department?.notes || "",
      isActive: department?.isActive === true
    });
    setFormError("");
    setFormOpen(true);

    await loadDepartmentManagers(
      department?.departmentGuid,
      department?.managerGuid,
      department?.employeeCount
    );
  };

  const saveDepartment = async () => {
    if (!form.departmentName.trim()) {
      setFormError("اسم القسم مطلوب");
      return;
    }

    if (
      editingDepartment?.departmentGuid &&
      editingDepartment?.isActive === true &&
      form.isActive === false &&
      Number(editingDepartment?.activeEmployeeCount || 0) > 0
    ) {
      setDeactivateBlockedOpen(true);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        departmentName: form.departmentName.trim(),
        managerGuid: form.managerGuid || null,
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        isActive: form.isActive === true,
        changedByUserGuid: getCurrentUserGuid()
      };

      const isEdit = !!editingDepartment?.departmentGuid;
      const url = isEdit
        ? `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
            editingDepartment.departmentGuid
          )}`
        : `${API_BASE_URL}/api/hr/departments`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر حفظ القسم");
      }

      setFormOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(err?.message || "حدث خطأ أثناء حفظ القسم");
    } finally {
      setSaving(false);
    }
  };

  const openEmployees = async (department) => {
    try {
      setEmployeesDepartment(department);
      setEmployeesOpen(true);
      setEmployeesLoading(true);
      setDepartmentEmployees([]);
      setEmployeeSearch("");
      setSelectedEmployeeGuids([]);
      setTransferTargetGuid("");
      setTransferError("");

      const employees = await fetchAllDepartmentEmployees(
        department?.departmentGuid,
        department?.employeeCount
      );

      setDepartmentEmployees(employees);
    } catch (err) {
      setError(err?.message || "حدث خطأ أثناء تحميل موظفي القسم");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeGuid) => {
    const guid = String(employeeGuid || "");
    if (!guid) return;

    setSelectedEmployeeGuids((current) =>
      current.includes(guid)
        ? current.filter((item) => item !== guid)
        : [...current, guid]
    );
  };

  const toggleSelectAllVisibleEmployees = () => {
    const visibleGuids = filteredDepartmentEmployees
      .map((employee) => String(employee?.employeeGuid || ""))
      .filter(Boolean);

    const allSelected =
      visibleGuids.length > 0 &&
      visibleGuids.every((guid) =>
        selectedEmployeeGuids.includes(guid)
      );

    if (allSelected) {
      setSelectedEmployeeGuids((current) =>
        current.filter((guid) => !visibleGuids.includes(guid))
      );
      return;
    }

    setSelectedEmployeeGuids((current) =>
      Array.from(new Set([...current, ...visibleGuids]))
    );
  };

  const requestTransferEmployees = () => {
    setTransferError("");

    if (selectedEmployeeGuids.length === 0) {
      setTransferError("حدد موظفًا واحدًا على الأقل للنقل");
      return;
    }

    if (!transferTargetGuid) {
      setTransferError("اختر القسم المنقول إليه");
      return;
    }

    if (
      String(transferTargetGuid).toLowerCase() ===
      String(employeesDepartment?.departmentGuid || "").toLowerCase()
    ) {
      setTransferError("القسم الجديد يجب أن يكون مختلفًا عن القسم الحالي");
      return;
    }

    setTransferConfirmOpen(true);
  };

  const executeTransferEmployees = async () => {
    try {
      setTransferringEmployees(true);
      setTransferError("");

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/transfer-employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            employeeGuids: selectedEmployeeGuids,
            targetDepartmentGuid: transferTargetGuid,
            changedByUserGuid: getCurrentUserGuid()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر نقل الموظفين"
        );
      }

      setTransferConfirmOpen(false);

      const currentDepartment = employeesDepartment;

      await loadDepartments();

      if (currentDepartment?.departmentGuid) {
        await openEmployees(currentDepartment);
      }
    } catch (err) {
      setTransferConfirmOpen(false);
      setTransferError(
        err?.message || "حدث خطأ أثناء نقل الموظفين"
      );
    } finally {
      setTransferringEmployees(false);
    }
  };

  const openHistory = async (department) => {
    try {
      setHistoryDepartment(department);
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistory([]);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
          department.departmentGuid
        )}/history`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل السجل");

      setHistory(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || "حدث خطأ أثناء تحميل سجل القسم");
    } finally {
      setHistoryLoading(false);
    }
  };

  const syncLeaveRoutesWithHierarchy = useCallback(async () => {
    const actor = getCurrentUserGuid();

    if (!actor) return null;

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const response = await fetch(
        `${API_BASE_URL}/api/hr/leaves/workflow/sync-active`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Guid": actor
          },
          body: JSON.stringify({
            actorUserGuid: actor,
            actorName:
              currentUser?.fullName ||
              currentUser?.FullName ||
              currentUser?.userName ||
              "تحديث الهيكل الإداري"
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.warn(
          "Leave route hierarchy sync failed:",
          result?.message || result?.error
        );
        return null;
      }

      return result;
    } catch (syncError) {
      console.warn(
        "Leave route hierarchy sync failed:",
        syncError
      );
      return null;
    }
  }, []);

  const loadOrgStructure = useCallback(async () => {
    try {
      setOrgLoading(true);
      setError("");

      const actor = getCurrentUserGuid();

      const requestOptions = {
        cache: "no-store",
        headers: actor
          ? { "X-User-Guid": actor }
          : {}
      };

      const [lookupsResponse, assignmentsResponse, rulesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/hr/org/lookups`, requestOptions),
          fetch(`${API_BASE_URL}/api/hr/org/assignments`, requestOptions),
          fetch(`${API_BASE_URL}/api/hr/org/rules`, requestOptions)
        ]);

      const [lookups, assignments, rules] = await Promise.all([
        lookupsResponse.json().catch(() => null),
        assignmentsResponse.json().catch(() => null),
        rulesResponse.json().catch(() => null)
      ]);

      const getApiError = (payload, fallback) => {
        const message = payload?.message || fallback;
        const detail = payload?.error || payload?.detail || "";

        return detail
          ? `${message} — ${detail}`
          : message;
      };

      if (!lookupsResponse.ok) {
        throw new Error(
          getApiError(
            lookups,
            "تعذر تحميل إعدادات الهيكل الإداري"
          )
        );
      }

      if (!assignmentsResponse.ok) {
        throw new Error(
          getApiError(
            assignments,
            "تعذر تحميل مديري الهيكل"
          )
        );
      }

      if (!rulesResponse.ok) {
        throw new Error(
          getApiError(
            rules,
            "تعذر تحميل قواعد المدير المباشر"
          )
        );
      }

      setOrgLookups({
        branches: Array.isArray(lookups?.branches)
          ? lookups.branches
          : [],
        departments: Array.isArray(lookups?.departments)
          ? lookups.departments
          : [],
        jobTitles: Array.isArray(lookups?.jobTitles)
          ? lookups.jobTitles
          : [],
        employees: Array.isArray(lookups?.employees)
          ? lookups.employees
          : []
      });

      setOrgAssignments(
        Array.isArray(assignments?.data)
          ? assignments.data
          : []
      );

      setOrgRules(
        Array.isArray(rules?.data)
          ? rules.data
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
        "تعذر تحميل الهيكل الإداري"
      );
    } finally {
      setOrgLoading(false);
    }
  }, []);

  const openOrgStructure = async () => {
    setOrgOpen(true);
    await loadOrgStructure();
  };

  const saveOrgAssignment = async () => {
    if (!orgAssignmentForm.scopeGuid || !orgAssignmentForm.managerUserGuid) {
      setError("اختر الفرع/القسم والمدير");
      return;
    }
    try {
      setOrgLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hr/org/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orgAssignmentForm,
          scopeType: Number(orgAssignmentForm.scopeType),
          priority: Number(orgAssignmentForm.priority || 100),
          actorUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر حفظ المدير");
      setOrgAssignmentForm((c) => ({ ...c, managerUserGuid: "", notes: "" }));
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر حفظ المدير");
    } finally {
      setOrgLoading(false);
    }
  };

  const removeOrgAssignment = async (guid) => {
    try {
      setOrgLoading(true);
      const actor = getCurrentUserGuid() || "";
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/assignments/${encodeURIComponent(guid)}?actorUserGuid=${encodeURIComponent(actor)}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر إيقاف المدير");
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر إيقاف المدير");
    } finally {
      setOrgLoading(false);
    }
  };

  const saveOrgRule = async () => {
    if (!orgRuleForm.ruleName.trim()) {
      setError("اسم قاعدة المدير المباشر مطلوب");
      return;
    }
    try {
      setOrgLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hr/org/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orgRuleForm,
          sourceLegacyJobCode: orgRuleForm.sourceLegacyJobCode === ""
            ? null : Number(orgRuleForm.sourceLegacyJobCode),
          sourceDepartmentGuid: orgRuleForm.sourceDepartmentGuid || null,
          targetDepartmentGuid: orgRuleForm.targetDepartmentGuid || null,
          priority: Number(orgRuleForm.priority || 100),
          actorUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر حفظ القاعدة");
      setOrgRuleForm({
        ruleName: "", sourceLegacyJobCode: "", sourceDepartmentGuid: "",
        managerSourceType: "BRANCH_MANAGERS", targetDepartmentGuid: "",
        priority: 100, isActive: true, notes: ""
      });
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر حفظ القاعدة");
    } finally {
      setOrgLoading(false);
    }
  };

  const removeOrgRule = async (guid) => {
    try {
      setOrgLoading(true);
      const actor = getCurrentUserGuid() || "";
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/rules/${encodeURIComponent(guid)}?actorUserGuid=${encodeURIComponent(actor)}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر إيقاف القاعدة");
      await syncLeaveRoutesWithHierarchy();
      await loadOrgStructure();
    } catch (err) {
      setError(err?.message || "تعذر إيقاف القاعدة");
    } finally {
      setOrgLoading(false);
    }
  };

  const previewOrgManager = async () => {
    if (!orgPreviewEmployeeGuid) return;
    try {
      setOrgLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/hr/org/manager-chain/${encodeURIComponent(orgPreviewEmployeeGuid)}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحديد المدير المباشر");
      setOrgPreview(result);
    } catch (err) {
      setError(err?.message || "تعذر تحديد المدير المباشر");
      setOrgPreview(null);
    } finally {
      setOrgLoading(false);
    }
  };

  const applyFilters = () => setAppliedFilters({ ...filters });

  const clearFilters = () => {
    const empty = { search: "", isActive: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const renderMobileDepartment = (department) => (
    <Paper
      key={department?.departmentGuid}
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.2 },
        borderRadius: 2.6,
        border: "1px solid rgba(5,117,70,.10)",
        background: "#fff"
      }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      sx={{ direction: DIALOG_DIRECTION }}
                    >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: primaryLight,
                color: primaryColor
              }}
            >
              <BusinessCenterIcon sx={{ fontSize: 20 }} />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: { xs: ".78rem", sm: ".9rem" },
                  textAlign: PAGE_TEXT_ALIGN
                }}
              >
                {department?.departmentName || "بدون اسم"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#748078",
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  textAlign: PAGE_TEXT_ALIGN
                }}
              >
                مدير القسم: {department?.managerName || "غير محدد"}
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={department?.isActive ? "نشط" : "غير نشط"}
            color={department?.isActive ? "success" : "default"}
            sx={{ fontFamily: "Cairo", fontWeight: 900 }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 0.55
          }}
        >
          <MiniStat label="الموظفون" value={department?.employeeCount || 0} />
          <MiniStat label="النشطون" value={department?.activeEmployeeCount || 0} />
          <MiniStat label="غير النشطين" value={department?.inactiveEmployeeCount || 0} />
          <MiniStat label="المسميات" value={department?.jobTitleCount || 0} />
        </Box>

        <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.5}>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={<GroupsIcon />}
            onClick={() => openEmployees(department)}
            sx={uiLayout.withUiSx(buttonSx, uiLayout.buttonSx)}
          >
            الموظفون
          </Button>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => openEditDialog(department)}
            sx={uiLayout.withUiSx(buttonSx, uiLayout.buttonSx)}
          >
            تعديل
          </Button>
          <IconButton
            size="small"
            onClick={() => openHistory(department)}
            sx={{ color: primaryColor, bgcolor: primaryLight }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box
      dir={PAGE_DIRECTION}
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background: "linear-gradient(180deg,#f7fbf9 0%,#ffffff 100%)",
        fontFamily: "Cairo, Arial, sans-serif",
        textAlign: PAGE_TEXT_ALIGN
      }}
    >
      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: 1250,
            height: { xs: 50, sm: 56 },
            justifyContent: "center",
            bgcolor: "#fff",
            color: primaryDark,
            borderBottom: "1px solid rgba(5,117,70,.12)"
          }}
        >
          <Toolbar
            disableGutters
            sx={{ minHeight: { xs: "var(--app-header-height, 56px)", sm: "var(--app-header-height, 56px)" }, px: 1 }}
          >
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              sx={{
                width: 36,
                height: 36,
                color: "#fff",
                background: `linear-gradient(135deg,${primaryColor},${primaryDark})`
              }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: { xs: ".78rem", sm: ".9rem" },
                textAlign: PAGE_TEXT_ALIGN
              }}
            >
              الموارد البشرية - الأقسام
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          minWidth: 0,
          
          
          boxSizing: "border-box",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            px: 1.5,
            py: 1.5
          },
          ...navigationContentSx, ...uiLayout.scopeSx
        }}
      >
        <Stack spacing={{ xs: 1, sm: 1.3, md: 1.6 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.2, sm: 1.5, md: 2 },
              borderRadius: 3.5,
              color: "#fff",
              background: `linear-gradient(135deg,${primaryColor},${primaryDark})`
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography className="hr-page-title" sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: { xs: "1rem", md: "1.35rem" } }}>
                  إدارة الأقسام
                </Typography>
                <Typography sx={{ mt: 0.25, opacity: 0.9, fontFamily: "Cairo", fontSize: { xs: "0.75rem", md: ".82rem" } }}>
                  إدارة هيكل الأقسام ومديريها ومتابعة الموظفين بدون المساس ببيانات النظام القديمة
                </Typography>
              </Box>

              <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.6}>
                <Tooltip title="تحديث">
                  <IconButton
                    onClick={() => {
                      loadDepartments();
                      loadLookups();
                    }}
                    sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.12)" }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<AccountTreeRoundedIcon />}
                  onClick={openOrgStructure}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo", fontWeight: 900,
                    borderColor: "rgba(255,255,255,.75)", color: "#fff",
                    "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,.10)" }
                  }, uiLayout.buttonSx)}
                >
                  الهيكل الإداري
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    bgcolor: "#fff",
                    color: primaryDark,
                    "&:hover": { bgcolor: "#f2f7f4" }
                  }, uiLayout.buttonSx)}
                >
                  إضافة قسم
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                sm: "repeat(4,minmax(0,1fr))"
              },
              gap: { xs: 0.6, sm: 0.9 }
            }}
          >
            <StatCard title="إجمالي الأقسام" value={stats.total} icon={<AccountTreeIcon />} />
            <StatCard title="الأقسام النشطة" value={stats.active} icon={<CheckCircleIcon />} />
            <StatCard title="غير النشطة" value={stats.inactive} icon={<BusinessCenterIcon />} />
            <StatCard title="الموظفون داخل الأقسام" value={stats.employees} icon={<GroupsIcon />} />
          </Box>

          <Paper elevation={0} sx={sectionSx}>
            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1fr auto auto" },
                gap: 0.8,
                alignItems: "center"
              }, uiLayout.filterBarSx)}
            >
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث"
                placeholder="اسم القسم أو الكود أو المدير"
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: primaryColor }} />
                    </InputAdornment>
                  )
                }}
              />

              <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={filters.isActive}
                  onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value }))}
                >
                  <MenuItem value="">كل الحالات</MenuItem>
                  <MenuItem value={true}>نشط</MenuItem>
                  <MenuItem value={false}>غير نشط</MenuItem>
                </Select>
              </FormControl>

              <Button variant="contained" onClick={applyFilters} startIcon={<SearchIcon />} sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}>
                تطبيق
              </Button>
              <Button variant="outlined" onClick={clearFilters} sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}>
                مسح
              </Button>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...sectionSx, p: 0, overflow: "hidden" }}>
            <Box sx={{ p: { xs: 1, sm: 1.3 }, borderBottom: "1px solid rgba(5,117,70,.10)" }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
                قائمة الأقسام
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#7a8580" }}>
                عدد النتائج: {departments.length}
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 7, display: "grid", placeItems: "center" }}>
                <CircularProgress sx={{ color: primaryColor }} />
              </Box>
            ) : departments.length === 0 ? (
              <Box sx={{ py: 7, textAlign: CENTER_TEXT_ALIGN }}>
                <Typography sx={{ fontFamily: "Cairo", fontWeight: 800 }}>لا توجد أقسام</Typography>
              </Box>
            ) : isCompact ? (
              <Box
                sx={{
                  p: 0.7,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" },
                  gap: 0.65
                }}
              >
                {departments.map(renderMobileDepartment)}
              </Box>
            ) : (
              <TableContainer sx={uiLayout.tableContainerSx}>
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      {["الكود", "القسم", "مدير القسم", "الموظفون", "المسميات", "نشط", "غير نشط", "الحالة", "الإجراءات"].map((h) => (
                        <TableCell key={h} align="right" sx={headCellSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments.map((department) => (
                      <TableRow key={department?.departmentGuid} hover>
                        <TableCell align="center">{department?.departmentCode ?? "-"}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: ".78rem" }}>
                            {department?.departmentName || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{department?.managerName || "غير محدد"}</TableCell>
                        <TableCell align="center">{department?.employeeCount || 0}</TableCell>
                        <TableCell align="center">{department?.jobTitleCount || 0}</TableCell>
                        <TableCell align="center">{department?.activeEmployeeCount || 0}</TableCell>
                        <TableCell align="center">{department?.inactiveEmployeeCount || 0}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={department?.isActive ? "نشط" : "غير نشط"}
                            color={department?.isActive ? "success" : "default"}
                            sx={{ fontFamily: "Cairo", fontWeight: 900 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.4} justifyContent="center">
                            <Tooltip title="موظفو القسم">
                              <IconButton size="small" onClick={() => openEmployees(department)} sx={actionIconSx}>
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton size="small" onClick={() => openEditDialog(department)} sx={actionIconSx}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="سجل التعديلات">
                              <IconButton size="small" onClick={() => openHistory(department)} sx={actionIconSx}>
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      </PageContainer>

      <Dialog
        sx={[uiLayout.dialogLayoutSx, RTL_DIALOG_SX]}
        open={formOpen}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setDepartmentManagers([]);
          }
        }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 16px)",
              sm: "min(760px, calc(100% - 32px))"
            },
            maxWidth: "760px !important",
            m: { xs: 1, sm: 2 },
            borderRadius: { xs: 2.5, sm: 3 },
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN,
            overflow: "hidden",
            backgroundImage: "none"
          }
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 1.5, sm: 2.25 },
            py: { xs: 1.15, sm: 1.35 },
            borderBottom: "1px solid rgba(5,117,70,.10)",
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN,
            bgcolor: "#fff"
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  fontSize: { xs: "1rem", sm: "1.08rem" },
                  color: primaryDark,
                  textAlign: DIALOG_TEXT_ALIGN
                }}
              >
                {editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontFamily: "Cairo",
                  fontSize: "0.72rem",
                  lineHeight: 1.6,
                  color: "#7a8580"
                }}
              >
                {editingDepartment
                  ? "حدّث اسم القسم ومديره وبياناته الأساسية."
                  : "أدخل بيانات القسم، ويمكن تعيين المدير بعد إضافة موظفين إليه."}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setFormOpen(false);
                setDepartmentManagers([]);
              }}
              disabled={saving}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 1.25, sm: 2.25 },
            py: { xs: 1.25, sm: 1.7 },
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN,
            bgcolor: "#fbfdfc",
            overflowX: "hidden"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))"
              },
              gap: { xs: 1.1, sm: 1.25 },
              width: "100%",
              minWidth: 0,
              alignItems: "start",
              "& > *": {
                minWidth: 0,
                width: "100%"
              }
            }}
          >
            {formError && (
              <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
                {formError}
              </Alert>
            )}

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="اسم القسم"
              fullWidth
              value={form.departmentName}
              onChange={(e) => setForm((p) => ({ ...p, departmentName: e.target.value }))}
            />

            <Autocomplete
              ListboxProps={RTL_AUTOCOMPLETE_LISTBOX_PROPS}
              fullWidth
              options={departmentManagers}
              loading={departmentManagersLoading}
              disabled={!editingDepartment}
              value={
                departmentManagers.find((employee) => {
                  const optionGuid = String(
                    employee?.employeeGuid ||
                    employee?.guid ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                  return (
                    optionGuid ===
                    String(form.managerGuid || "")
                      .trim()
                      .toLowerCase()
                  );
                }) || null
              }
              onChange={(_, employee) => {
                setForm((current) => ({
                  ...current,
                  managerGuid:
                    employee?.employeeGuid ||
                    employee?.guid ||
                    ""
                }));
              }}
              isOptionEqualToValue={(option, value) => {
                const optionGuid = String(
                  option?.employeeGuid ||
                  option?.guid ||
                  ""
                )
                  .trim()
                  .toLowerCase();

                const valueGuid = String(
                  value?.employeeGuid ||
                  value?.guid ||
                  ""
                )
                  .trim()
                  .toLowerCase();

                return optionGuid === valueGuid;
              }}
              getOptionLabel={(employee) => {
                const name =
                  employee?.fullName ||
                  employee?.name ||
                  "غير محدد";

                const jobTitle =
                  employee?.jobTitle || "";

                return jobTitle
                  ? `${name} - ${jobTitle}`
                  : name;
              }}
              noOptionsText="لا يوجد موظفون مطابقون داخل القسم"
              loadingText="جاري تحميل موظفي القسم..."
              clearText="مسح"
              openText="فتح"
              closeText="إغلاق"
              renderOption={(props, employee) => (
                <Box
                  component="li"
                  {...props}
                  key={
                    employee?.employeeGuid ||
                    employee?.guid
                  }
                  sx={{
                    display: "flex !important",
                    alignItems: "center",
                    gap: 1,
                    direction: DIALOG_DIRECTION,
                    textAlign: DIALOG_TEXT_ALIGN,
                    fontFamily: "Cairo"
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: primaryLight,
                      color: primaryColor,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: ".75rem"
                    }}
                  >
                    {String(
                      employee?.fullName ||
                      employee?.name ||
                      "م"
                    )
                      .trim()
                      .charAt(0)}
                  </Avatar>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      textAlign: DIALOG_TEXT_ALIGN
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        fontSize: "0.75rem"
                      }}
                    >
                      {employee?.fullName ||
                        employee?.name ||
                        "غير محدد"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.15,
                        fontFamily: "Cairo",
                        color: "#748078",
                        fontSize: "0.75rem"
                      }}
                    >
                      {employee?.jobTitle || "غير محدد"}
                      {employee?.isActive === false
                        ? " - غير نشط"
                        : ""}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField InputLabelProps={{ shrink: true }}
                  {...params}
                  label="مدير القسم"
                  placeholder={
                    editingDepartment
                      ? "اكتب اسم الموظف للبحث داخل القسم"
                      : "احفظ القسم أولاً ثم عيّن المدير"
                  }
                  helperText={
                    editingDepartment
                      ? "البحث يتم داخل موظفي هذا القسم فقط"
                      : "بعد إنشاء القسم وإضافة الموظفين إليه يمكنك تعيين مدير القسم"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {departmentManagersLoading ? (
                          <CircularProgress
                            color="inherit"
                            size={18}
                          />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                  sx={uiLayout.withUiSx({
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Cairo",
                      textAlign: DIALOG_TEXT_ALIGN
                    }
                  }, uiLayout.formFieldSx)}
                />
              )}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="وصف القسم"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="ملاحظات"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />

            {editingDepartment && (
              <FormControl
                fullWidth
                sx={uiLayout.withUiSx({
                  gridColumn: { sm: "1 / -1" }
                }, uiLayout.formFieldSx)}
              >
                <InputLabel>الحالة</InputLabel>
                <Select
                  MenuProps={RTL_MENU_PROPS}
                  label="الحالة"
                  value={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))}
                >
                  <MenuItem value={true}>نشط</MenuItem>
                  <MenuItem value={false}>غير نشط</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: { xs: 1.25, sm: 2.25 },
            py: { xs: 1.05, sm: 1.2 },
            direction: DIALOG_DIRECTION,
            justifyContent: "flex-start",
            gap: 0.75,
            bgcolor: "#fff"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={saveDepartment}
            disabled={saving}
            variant="contained"
            sx={uiLayout.withUiSx({
              ...primaryButtonSx,
              minWidth: 104
            }, uiLayout.buttonSx)}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "حفظ"}
          </Button>
          <Button
            onClick={() => {
              setFormOpen(false);
              setDepartmentManagers([]);
            }}
            disabled={saving}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={employeesOpen}
        onClose={() => setEmployeesOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                موظفو {employeesDepartment?.departmentName || "القسم"}
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#7a8580" }}>
                {departmentEmployees.length} موظف
              </Typography>
            </Box>
            <IconButton onClick={() => setEmployeesOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          {employeesLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : departmentEmployees.length === 0 ? (
            <Typography sx={{ py: 5, textAlign: DIALOG_CENTER_TEXT_ALIGN, fontFamily: "Cairo" }}>
              لا يوجد موظفون في هذا القسم
            </Typography>
          ) : (
            <Stack spacing={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2.2,
                  bgcolor: "#f8fbf9",
                  border: "1px solid rgba(5,117,70,.10)"
                }}
              >
                <Box
                  sx={uiLayout.withUiSx({
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "minmax(220px,1.5fr) minmax(200px,1fr) auto"
                    },
                    gap: 0.7,
                    alignItems: "center"
                  }, uiLayout.filterBarSx)}
                >
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    size="small"
                    label="بحث داخل موظفي القسم"
                    placeholder="الاسم، الكود، الجوال أو المسمى"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: primaryColor }} />
                        </InputAdornment>
                      )
                    }}
                  />

                  <FormControl sx={uiLayout.formFieldSx} size="small" fullWidth>
                    <InputLabel>نقل إلى قسم</InputLabel>
                    <Select
                  MenuProps={RTL_MENU_PROPS}
                      label="نقل إلى قسم"
                      value={transferTargetGuid}
                      onChange={(event) => {
                        setTransferTargetGuid(event.target.value);
                        setTransferError("");
                      }}
                    >
                      <MenuItem value="">اختر القسم</MenuItem>
                      {departments
                        .filter(
                          (department) =>
                            department?.isActive === true &&
                            String(department?.departmentGuid || "").toLowerCase() !==
                              String(employeesDepartment?.departmentGuid || "").toLowerCase()
                        )
                        .map((department) => (
                          <MenuItem
                            key={department?.departmentGuid}
                            value={department?.departmentGuid || ""}
                          >
                            {department?.departmentName || "غير محدد"}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<SwapHorizIcon />}
                    onClick={requestTransferEmployees}
                    disabled={
                      transferringEmployees ||
                      selectedEmployeeGuids.length === 0
                    }
                    sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
                  >
                    نقل المحددين ({selectedEmployeeGuids.length})
                  </Button>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ mt: 0.7 }}
                >
                  <Checkbox
                    size="small"
                    checked={
                      filteredDepartmentEmployees.length > 0 &&
                      filteredDepartmentEmployees.every((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      )
                    }
                    indeterminate={
                      filteredDepartmentEmployees.some((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      ) &&
                      !filteredDepartmentEmployees.every((employee) =>
                        selectedEmployeeGuids.includes(
                          String(employee?.employeeGuid || "")
                        )
                      )
                    }
                    onChange={toggleSelectAllVisibleEmployees}
                    sx={{ color: primaryColor }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontSize: "0.75rem",
                      color: "#66756e",
                      textAlign: DIALOG_TEXT_ALIGN
                    }}
                  >
                    تحديد كل النتائج الظاهرة ({filteredDepartmentEmployees.length})
                  </Typography>
                </Stack>

                {transferError && (
                  <Alert severity="error" sx={{ mt: 0.7 }}>
                    {transferError}
                  </Alert>
                )}
              </Paper>

              {filteredDepartmentEmployees.length === 0 ? (
                <Typography
                  sx={{
                    py: 4,
                    textAlign: DIALOG_CENTER_TEXT_ALIGN,
                    fontFamily: "Cairo"
                  }}
                >
                  لا توجد نتائج مطابقة للبحث
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2,minmax(0,1fr))"
                    },
                    gap: 0.7
                  }}
                >
                  {filteredDepartmentEmployees.map((employee) => {
                    const employeeGuid = String(
                      employee?.employeeGuid || ""
                    );
                    const selected =
                      selectedEmployeeGuids.includes(employeeGuid);

                    return (
                      <Paper
                        key={employee?.employeeGuid}
                        elevation={0}
                        onClick={() =>
                          toggleEmployeeSelection(employeeGuid)
                        }
                        sx={{
                          p: 0.8,
                          border: selected
                            ? "1px solid rgba(5,117,70,.38)"
                            : "1px solid rgba(5,117,70,.10)",
                          borderRadius: 2.2,
                          bgcolor: selected ? "#f0f9f5" : "#fff",
                          cursor: "pointer"
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.7}
                          alignItems="center"
                          sx={{ direction: DIALOG_DIRECTION }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() =>
                              toggleEmployeeSelection(employeeGuid)
                            }
                            sx={{ color: primaryColor }}
                          />

                          <Avatar sx={{ width: 36, height: 36, bgcolor: primaryLight, color: primaryColor }}>
                            {(employee?.fullName || "م").trim().charAt(0)}
                          </Avatar>

                          <Box sx={{ minWidth: 0, flex: 1, textAlign: DIALOG_TEXT_ALIGN }}>
                            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: ".75rem" }}>
                              {employee?.fullName || "بدون اسم"}
                            </Typography>
                            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: "#728078" }}>
                              {employee?.jobTitle || "غير محدد"}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={employee?.isActive ? "نشط" : "غير نشط"}
                            color={employee?.isActive ? "success" : "default"}
                          />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={transferConfirmOpen}
        onClose={() =>
          !transferringEmployees &&
          setTransferConfirmOpen(false)
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={0.7} alignItems="center">
            <SwapHorizIcon sx={{ color: primaryColor }} />
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
              تأكيد نقل الموظفين
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Cairo", fontSize: ".75rem", lineHeight: 1.8, textAlign: DIALOG_TEXT_ALIGN }}>
            سيتم نقل {selectedEmployeeGuids.length} موظف من
            {` ${employeesDepartment?.departmentName || "القسم الحالي"} `}
            إلى
            {` ${transferTargetDepartment?.departmentName || "القسم المحدد"}.`}
          </Typography>
          <Alert severity="warning" sx={{ mt: 1 }}>
            سيتم تحديث القسم في User_Info مع الحفاظ على UserDepart القديم متوافقًا مع Department.ID.
          </Alert>
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ direction: DIALOG_DIRECTION }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={() => setTransferConfirmOpen(false)}
            disabled={transferringEmployees}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button
            onClick={executeTransferEmployees}
            disabled={transferringEmployees}
            variant="contained"
            sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
          >
            {transferringEmployees ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "تأكيد النقل"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={orgOpen}
        onClose={() => setOrgOpen(false)}
        maxWidth="xl"
        fullWidth
        dir={DIALOG_DIRECTION}
        PaperProps={{ sx: {
          borderRadius: 3,
          direction: DIALOG_DIRECTION,
          textAlign: DIALOG_TEXT_ALIGN,
          minHeight: { xs: "90vh", md: "82vh" }
        }}}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 950, fontSize: 19 }}>
                الهيكل الإداري المرن
              </Typography>
              <Typography color="text.secondary" sx={{ fontFamily: "Cairo", fontSize: 12 }}>
                المصدر الموحد للرؤية الإدارية والمدير المباشر ومسارات الإجازات والأذونات
              </Typography>
            </Box>
            <IconButton onClick={() => setOrgOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <HrOrganizationDesigner />
        </DialogContent>
        <DialogActions sx={uiLayout.dialogActionsSx}><Button sx={uiLayout.buttonSx} onClick={() => setOrgOpen(false)}>إغلاق</Button></DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={deactivateBlockedOpen}
        onClose={() => setDeactivateBlockedOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={0.7} alignItems="center">
            <WarningAmberRoundedIcon sx={{ color: accentColor }} />
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark }}>
              لا يمكن تعطيل القسم الآن
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Cairo", fontSize: ".75rem", lineHeight: 1.8, textAlign: DIALOG_TEXT_ALIGN }}>
            القسم يحتوي على {editingDepartment?.activeEmployeeCount || 0} موظف نشط.
            انقل الموظفين النشطين إلى قسم آخر أولًا، وبعدها تقدر تعطّل القسم بأمان.
          </Typography>
        </DialogContent>
        <DialogActions sx={uiLayout.withUiSx({ direction: DIALOG_DIRECTION }, uiLayout.dialogActionsSx)}>
          <Button
            onClick={() => setDeactivateBlockedOpen(false)}
            sx={uiLayout.withUiSx(dangerButtonSx, uiLayout.buttonSx)}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={<GroupsIcon />}
            onClick={() => {
              const department = editingDepartment;
              setDeactivateBlockedOpen(false);
              setFormOpen(false);
              setDepartmentManagers([]);
              if (department) openEmployees(department);
            }}
            sx={uiLayout.withUiSx(primaryButtonSx, uiLayout.buttonSx)}
          >
            فتح الموظفين ونقلهم
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        sx={uiLayout.withUiSx(RTL_DIALOG_SX, uiLayout.dialogLayoutSx)}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }
        }}
      >
        <DialogTitle
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ direction: DIALOG_DIRECTION }}
          >
            <Box sx={{ textAlign: DIALOG_TEXT_ALIGN }}>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                سجل تعديلات {historyDepartment?.departmentName || "القسم"}
              </Typography>
            </Box>
            <IconButton onClick={() => setHistoryOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent
          sx={{
            direction: DIALOG_DIRECTION,
            textAlign: DIALOG_TEXT_ALIGN
          }}
        >
          {historyLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : history.length === 0 ? (
            <Typography sx={{ py: 5, textAlign: DIALOG_CENTER_TEXT_ALIGN, fontFamily: "Cairo" }}>
              لا توجد تعديلات مسجلة
            </Typography>
          ) : (
            <Stack spacing={0.7}>
              {history.map((item) => (
                <Paper key={item?.id} elevation={0} sx={{ p: 1, borderRadius: 2, border: "1px solid rgba(5,117,70,.09)" }}>
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, fontSize: "0.75rem", color: primaryDark, textAlign: DIALOG_TEXT_ALIGN }}>
                    {item?.fieldLabel || item?.fieldName}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontFamily: "Cairo", fontSize: "0.75rem", textAlign: DIALOG_TEXT_ALIGN }}>
                    من: {item?.oldValue || "-"} ← إلى: {item?.newValue || "-"}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontFamily: "Cairo", fontSize: "0.75rem", color: "#7b8781", textAlign: DIALOG_TEXT_ALIGN }}>
                    {item?.changedByName || "مستخدم غير محدد"}
                    {item?.changedAt ? ` - ${new Date(item.changedAt).toLocaleString("ar-EG")}` : ""}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box></NavigationShell>
  );
};

const MiniStat = ({ label, value }) => (
  <Box sx={{ p: 0.55, borderRadius: 1.8, bgcolor: "#f6faf8", textAlign: CENTER_TEXT_ALIGN }}>
    <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, fontSize: "0.75rem" }}>{value}</Typography>
    <Typography sx={{ fontFamily: "Cairo", color: "#728078", fontSize: "0.75rem" }}>{label}</Typography>
  </Box>
);

const StatCard = ({ title, value, icon }) => (
  <Paper elevation={0} sx={{ p: { xs: 0.8, sm: 1.1 }, borderRadius: 2.7, border: "1px solid rgba(5,117,70,.10)" }}>
    <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
      <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: primaryLight, color: primaryColor }}>
        {icon}
      </Box>
      <Box sx={{ textAlign: CENTER_TEXT_ALIGN }}>
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: primaryDark, fontSize: { xs: ".9rem", sm: "1.05rem" } }}>{value}</Typography>
        <Typography sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: { xs: "0.75rem", sm: "0.75rem" } }}>{title}</Typography>
      </Box>
    </Stack>
  </Paper>
);

const sectionSx = {
  p: { xs: 0.9, sm: 1.2, md: 1.5 },
  borderRadius: 3,
  border: "1px solid rgba(5,117,70,.10)",
  boxShadow: "0 4px 16px rgba(5,117,70,.04)"
};

const headCellSx = {
  bgcolor: "#f6faf8",
  color: primaryDark,
  fontFamily: "Cairo",
  fontWeight: 900,
  fontSize: ".72rem",
  whiteSpace: "nowrap"
};

const actionIconSx = {
  color: primaryColor,
  bgcolor: primaryLight,
  border: "1px solid rgba(5,117,70,.10)",
  "&:hover": { bgcolor: "#d9eee5" }
};

const buttonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  fontSize: ".6rem",
  color: primaryColor,
  borderColor: "rgba(5,117,70,.25)"
};

const primaryButtonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  bgcolor: primaryColor,
  "&:hover": { bgcolor: primaryDark }
};

const dangerButtonSx = {
  fontFamily: "Cairo",
  fontWeight: 900,
  color: accentColor,
  borderColor: "rgba(174,30,33,.35)"
};

export default HrDepartmentsPage;