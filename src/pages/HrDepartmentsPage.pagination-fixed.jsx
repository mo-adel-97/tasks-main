import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/hrLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AddIcon from '@mui/icons-material/Add';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import HrOrganizationDesigner from './components/HrOrganizationDesigner';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api4.sstli.com';

const primary = '#057546';
const primaryDark = '#034d31';
const primaryLight = '#e6f3ee';
const danger = '#ae1e21';

const emptyForm = {
  departmentName: '',
  managerGuid: '',
  description: '',
  notes: '',
  isActive: true
};

const getCurrentUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.guid || user?.Guid || null;
  } catch {
    return null;
  }
};

const rtlMenuProps = {
  PaperProps: {
    sx: {
      direction: 'rtl',
      textAlign: 'right',
      mt: 0.5,
      borderRadius: 2,
      maxHeight: 360,
      '& .MuiMenuItem-root': {
        direction: 'rtl',
        textAlign: 'right',
        justifyContent: 'flex-start',
        minHeight: 38,
        fontFamily: 'Cairo, Arial, sans-serif'
      }
    }
  }
};

const HrDepartmentsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const isPhone = useMediaQuery('(max-width:599.95px)');
  const isTablet = !isPhone && !isDesktop;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ search: '', isActive: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', isActive: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [departmentManagers, setDepartmentManagers] = useState([]);
  const [departmentManagersLoading, setDepartmentManagersLoading] = useState(false);

  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeesDepartment, setEmployeesDepartment] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(20);
  const [employeeTotal, setEmployeeTotal] = useState(0);

  const [selectedEmployeeGuids, setSelectedEmployeeGuids] = useState([]);
  const [transferTargetGuid, setTransferTargetGuid] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferringEmployees, setTransferringEmployees] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDepartment, setHistoryDepartment] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [orgOpen, setOrgOpen] = useState(false);
  const [deactivateBlockedOpen, setDeactivateBlockedOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const surfaceSx = useMemo(
    () => ({
      bgcolor: isDark ? '#151f1a' : '#fff',
      border: isDark
        ? '1px solid rgba(128,201,167,.38)'
        : '1px solid rgba(5,117,70,.11)',
      boxShadow: 'none'
    }),
    [isDark]
  );

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (appliedFilters.search.trim()) params.set('search', appliedFilters.search.trim());
      if (appliedFilters.isActive !== '') params.set('isActive', String(appliedFilters.isActive));

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments${params.toString() ? `?${params.toString()}` : ''}`,
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر تحميل الأقسام');
      setDepartments(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setDepartments([]);
      setError(err?.message || 'حدث خطأ أثناء تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((item) => item?.isActive === true).length;
    const employees = departments.reduce(
      (sum, item) => sum + Number(item?.employeeCount || 0),
      0
    );
    return { total, active, inactive: total - active, employees };
  }, [departments]);

  const employeePageCount = useMemo(
    () => (employeeTotal > 0 ? Math.ceil(employeeTotal / employeePageSize) : 0),
    [employeeTotal, employeePageSize]
  );

  const loadDepartmentManagers = useCallback(async (departmentGuid, currentManagerGuid = '') => {
    if (!departmentGuid) {
      setDepartmentManagers([]);
      return;
    }

    try {
      setDepartmentManagersLoading(true);
      setDepartmentManagers([]);

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(departmentGuid)}/employees?page=1&pageSize=1000`,
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر تحميل موظفي القسم');

      const currentGuid = String(currentManagerGuid || '').trim().toLowerCase();
      const options = (Array.isArray(result?.data) ? result.data : [])
        .filter((employee) => {
          const guid = String(employee?.employeeGuid || employee?.guid || '').trim().toLowerCase();
          return employee?.isActive === true || guid === currentGuid;
        })
        .sort((a, b) => String(a?.fullName || '').localeCompare(String(b?.fullName || ''), 'ar'));

      setDepartmentManagers(options);
    } catch (err) {
      setDepartmentManagers([]);
      setFormError(err?.message || 'تعذر تحميل موظفي القسم');
    } finally {
      setDepartmentManagersLoading(false);
    }
  }, []);

  const openCreateDialog = () => {
    setEditingDepartment(null);
    setDepartmentManagers([]);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEditDialog = async (department) => {
    setEditingDepartment(department);
    setDepartmentManagers([]);
    setForm({
      departmentName: department?.departmentName || '',
      managerGuid: department?.managerGuid || '',
      description: department?.description || '',
      notes: department?.notes || '',
      isActive: department?.isActive === true
    });
    setFormError('');
    setFormOpen(true);
    await loadDepartmentManagers(department?.departmentGuid, department?.managerGuid);
  };

  const saveDepartment = async () => {
    if (!form.departmentName.trim()) {
      setFormError('اسم القسم مطلوب');
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
      setFormError('');
      const isEdit = Boolean(editingDepartment?.departmentGuid);
      const url = isEdit
        ? `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(editingDepartment.departmentGuid)}`
        : `${API_BASE_URL}/api/hr/departments`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          departmentName: form.departmentName.trim(),
          managerGuid: form.managerGuid || null,
          description: form.description.trim() || null,
          notes: form.notes.trim() || null,
          isActive: form.isActive === true,
          changedByUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر حفظ القسم');

      setFormOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(err?.message || 'حدث خطأ أثناء حفظ القسم');
    } finally {
      setSaving(false);
    }
  };

  const openEmployees = (department) => {
    setEmployeesDepartment(department);
    setEmployeesOpen(true);
    setDepartmentEmployees([]);
    setEmployeeSearch('');
    setEmployeePage(1);
    setEmployeePageSize(20);
    setEmployeeTotal(Number(department?.employeeCount || 0));
    setSelectedEmployeeGuids([]);
    setTransferTargetGuid('');
    setTransferError('');
  };

  const loadDepartmentEmployees = useCallback(async () => {
    if (!employeesOpen || !employeesDepartment?.departmentGuid) return;

    try {
      setEmployeesLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(employeePage),
        pageSize: String(employeePageSize)
      });
      if (employeeSearch.trim()) params.set('search', employeeSearch.trim());

      const response = await fetch(
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(
          employeesDepartment.departmentGuid
        )}/employees?${params.toString()}`,
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر تحميل الموظفين');

      setDepartmentEmployees(Array.isArray(result?.data) ? result.data : []);
      setEmployeeTotal(
        Number(
          result?.totalCount ??
            result?.total ??
            result?.count ??
            employeesDepartment?.employeeCount ??
            0
        )
      );
    } catch (err) {
      setDepartmentEmployees([]);
      setError(err?.message || 'حدث خطأ أثناء تحميل موظفي القسم');
    } finally {
      setEmployeesLoading(false);
    }
  }, [employeesOpen, employeesDepartment, employeePage, employeePageSize, employeeSearch]);

  useEffect(() => {
    if (!employeesOpen) return undefined;
    const timer = setTimeout(
      () => loadDepartmentEmployees(),
      employeeSearch.trim() ? 350 : 0
    );
    return () => clearTimeout(timer);
  }, [employeesOpen, employeeSearch, employeePage, employeePageSize, loadDepartmentEmployees]);

  useEffect(() => {
    if (!employeesOpen || employeePageCount === 0) return;
    if (employeePage > employeePageCount) setEmployeePage(employeePageCount);
  }, [employeesOpen, employeePage, employeePageCount]);

  const toggleEmployeeSelection = (employeeGuid) => {
    const guid = String(employeeGuid || '');
    if (!guid) return;
    setSelectedEmployeeGuids((current) =>
      current.includes(guid)
        ? current.filter((item) => item !== guid)
        : [...current, guid]
    );
  };

  const toggleSelectAllCurrentPage = () => {
    const visible = departmentEmployees
      .map((employee) => String(employee?.employeeGuid || ''))
      .filter(Boolean);
    const allSelected = visible.length > 0 && visible.every((guid) => selectedEmployeeGuids.includes(guid));

    setSelectedEmployeeGuids((current) =>
      allSelected
        ? current.filter((guid) => !visible.includes(guid))
        : Array.from(new Set([...current, ...visible]))
    );
  };

  const transferTargetDepartment = useMemo(
    () =>
      departments.find(
        (department) =>
          String(department?.departmentGuid || '').toLowerCase() ===
          String(transferTargetGuid || '').toLowerCase()
      ) || null,
    [departments, transferTargetGuid]
  );

  const requestTransferEmployees = () => {
    setTransferError('');
    if (selectedEmployeeGuids.length === 0) {
      setTransferError('حدد موظفًا واحدًا على الأقل للنقل');
      return;
    }
    if (!transferTargetGuid) {
      setTransferError('اختر القسم المنقول إليه');
      return;
    }
    if (
      String(transferTargetGuid).toLowerCase() ===
      String(employeesDepartment?.departmentGuid || '').toLowerCase()
    ) {
      setTransferError('القسم الجديد يجب أن يكون مختلفًا عن القسم الحالي');
      return;
    }
    setTransferConfirmOpen(true);
  };

  const executeTransferEmployees = async () => {
    try {
      setTransferringEmployees(true);
      setTransferError('');
      const response = await fetch(`${API_BASE_URL}/api/hr/departments/transfer-employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          employeeGuids: selectedEmployeeGuids,
          targetDepartmentGuid: transferTargetGuid,
          changedByUserGuid: getCurrentUserGuid()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر نقل الموظفين');

      setTransferConfirmOpen(false);
      setSelectedEmployeeGuids([]);
      await loadDepartments();
      await loadDepartmentEmployees();
    } catch (err) {
      setTransferConfirmOpen(false);
      setTransferError(err?.message || 'حدث خطأ أثناء نقل الموظفين');
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
        `${API_BASE_URL}/api/hr/departments/${encodeURIComponent(department.departmentGuid)}/history`,
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'تعذر تحميل السجل');
      setHistory(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء تحميل سجل القسم');
    } finally {
      setHistoryLoading(false);
    }
  };

  const applyFilters = () => setAppliedFilters({ ...filters });
  const clearFilters = () => {
    const empty = { search: '', isActive: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const handleCloseEmployees = () => {
    if (transferringEmployees) return;
    setEmployeesOpen(false);
    setEmployeesDepartment(null);
    setDepartmentEmployees([]);
    setSelectedEmployeeGuids([]);
    setEmployeeSearch('');
    setTransferTargetGuid('');
    setTransferError('');
  };

  const renderDepartmentCard = (department) => (
    <Paper
      key={department?.departmentGuid}
      elevation={0}
      sx={{ ...surfaceSx, p: 1, borderRadius: 2.5 }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box minWidth={0}>
            <Typography sx={{ fontFamily: 'Cairo', fontWeight: 900, fontSize: '.82rem' }}>
              {department?.departmentName || 'بدون اسم'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.15, fontFamily: 'Cairo', fontSize: '.68rem' }}>
              مدير القسم: {department?.managerName || 'غير محدد'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={department?.isActive ? 'نشط' : 'غير نشط'}
            color={department?.isActive ? 'success' : 'default'}
          />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 0.45 }}>
          <MiniStat label="الموظفون" value={department?.employeeCount || 0} />
          <MiniStat label="النشطون" value={department?.activeEmployeeCount || 0} />
          <MiniStat label="غير النشطين" value={department?.inactiveEmployeeCount || 0} />
          <MiniStat label="المسميات" value={department?.jobTitleCount || 0} />
        </Box>

        <Stack direction="row" spacing={0.45}>
          <Button fullWidth size="small" variant="outlined" startIcon={<GroupsIcon />} onClick={() => openEmployees(department)}>
            الموظفون
          </Button>
          <Button fullWidth size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => openEditDialog(department)}>
            تعديل
          </Button>
          <IconButton size="small" onClick={() => openHistory(department)} sx={{ color: primary }}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <NavigationShell
      variant="standard"
      mobileOpen={mobileSidebarOpen}
      onMobileClose={() => setMobileSidebarOpen(false)}
    >
      <Box
        dir="rtl"
        sx={{
          minHeight: '100dvh',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          bgcolor: 'background.default',
          fontFamily: 'Cairo, Arial, sans-serif'
        }}
      >
        {!isDesktop && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              zIndex: 1250,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Toolbar disableGutters sx={{ minHeight: 'var(--app-header-height, 56px)', px: 1 }}>
              <IconButton
                onClick={() => setMobileSidebarOpen(true)}
                sx={{ width: 36, height: 36, color: '#fff', bgcolor: primary }}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '.85rem', textAlign: 'right' }}>
                الموارد البشرية - الأقسام
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <PageContainer
          component="main"
          sx={{
            mt: isDesktop ? 0 : 'var(--app-header-height, 56px)',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            p: isPhone ? 0.7 : isTablet ? 1 : 1.5,
            ...navigationContentSx,
            ...uiLayout.scopeSx
          }}
        >
          <Stack spacing={1}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 1 : 1.35,
                borderRadius: 2.5,
                color: '#fff',
                background: `linear-gradient(135deg,${primary},${primaryDark})`
              }}
            >
              <Stack
                direction={isPhone ? 'column' : 'row'}
                alignItems={isPhone ? 'stretch' : 'center'}
                justifyContent="space-between"
                gap={0.8}
              >
                <Box>
                  <Typography sx={{ fontWeight: 950, fontSize: isPhone ? '1rem' : '1.1rem' }}>
                    إدارة الأقسام
                  </Typography>
                  <Typography sx={{ mt: 0.15, opacity: 0.82, fontSize: '.7rem' }}>
                    إدارة الأقسام والمديرين ومتابعة موظفي كل قسم
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="تحديث">
                    <IconButton onClick={loadDepartments} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.10)' }}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    startIcon={<AccountTreeRoundedIcon />}
                    onClick={() => setOrgOpen(true)}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.55)' }}
                  >
                    الهيكل الإداري
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateDialog}
                    sx={{ bgcolor: '#fff', color: primaryDark, '&:hover': { bgcolor: '#f4f8f6' } }}
                  >
                    إضافة قسم
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 0.7 }}>
              <StatCard title="إجمالي الأقسام" value={stats.total} icon={<AccountTreeIcon />} surfaceSx={surfaceSx} />
              <StatCard title="الأقسام النشطة" value={stats.active} icon={<CheckCircleIcon />} surfaceSx={surfaceSx} />
              <StatCard title="غير النشطة" value={stats.inactive} icon={<BusinessCenterIcon />} surfaceSx={surfaceSx} />
              <StatCard title="الموظفون داخل الأقسام" value={stats.employees} icon={<GroupsIcon />} surfaceSx={surfaceSx} />
            </Box>

            <Paper elevation={0} sx={{ ...surfaceSx, p: 1, borderRadius: 2.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop ? '2fr 1fr auto auto' : '1fr',
                  gap: 0.7,
                  alignItems: 'center'
                }}
              >
                <TextField
                  size="small"
                  label="بحث"
                  placeholder="اسم القسم أو الكود أو المدير"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon sx={{ color: primary }} />
                      </InputAdornment>
                    )
                  }}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    MenuProps={rtlMenuProps}
                    label="الحالة"
                    value={filters.isActive}
                    onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
                  >
                    <MenuItem value="">كل الحالات</MenuItem>
                    <MenuItem value={true}>نشط</MenuItem>
                    <MenuItem value={false}>غير نشط</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={applyFilters} startIcon={<SearchIcon />} sx={{ bgcolor: primary }}>
                  تطبيق
                </Button>
                <Button variant="outlined" onClick={clearFilters} color="error">
                  مسح
                </Button>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...surfaceSx, borderRadius: 2.5, overflow: 'hidden' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 900 }}>قائمة الأقسام</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>
                  عدد النتائج: {departments.length}
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center' }}>
                  <CircularProgress sx={{ color: primary }} />
                </Box>
              ) : departments.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography>لا توجد أقسام</Typography>
                </Box>
              ) : !isDesktop ? (
                <Box sx={{ p: 0.7, display: 'grid', gridTemplateColumns: isTablet ? 'repeat(2,minmax(0,1fr))' : '1fr', gap: 0.7 }}>
                  {departments.map(renderDepartmentCard)}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(128,201,167,.08)' : '#edf7f2' }}>
                      <TableRow>
                        {['الكود', 'القسم', 'مدير القسم', 'الموظفون', 'المسميات', 'نشط', 'غير نشط', 'الحالة', 'الإجراءات'].map((header) => (
                          <TableCell key={header} align="right" sx={{ fontWeight: 900 }}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {departments.map((department) => (
                        <TableRow key={department?.departmentGuid} hover>
                          <TableCell align="center">{department?.departmentCode ?? '-'}</TableCell>
                          <TableCell><Typography sx={{ fontWeight: 900, fontSize: '.76rem' }}>{department?.departmentName || '-'}</Typography></TableCell>
                          <TableCell>{department?.managerName || 'غير محدد'}</TableCell>
                          <TableCell align="center">{department?.employeeCount || 0}</TableCell>
                          <TableCell align="center">{department?.jobTitleCount || 0}</TableCell>
                          <TableCell align="center">{department?.activeEmployeeCount || 0}</TableCell>
                          <TableCell align="center">{department?.inactiveEmployeeCount || 0}</TableCell>
                          <TableCell><Chip size="small" label={department?.isActive ? 'نشط' : 'غير نشط'} color={department?.isActive ? 'success' : 'default'} /></TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.2} justifyContent="center">
                              <Tooltip title="موظفو القسم"><IconButton size="small" onClick={() => openEmployees(department)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="تعديل"><IconButton size="small" onClick={() => openEditDialog(department)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                              <Tooltip title="السجل"><IconButton size="small" onClick={() => openHistory(department)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
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

        <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{editingDepartment ? 'تعديل القسم' : 'إضافة قسم جديد'}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>
                  {editingDepartment ? 'حدّث بيانات القسم.' : 'أدخل بيانات القسم الأساسية.'}
                </Typography>
              </Box>
              <IconButton onClick={() => setFormOpen(false)} disabled={saving}><CloseIcon /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 1 }}>
              {formError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{formError}</Alert>}
              <TextField label="اسم القسم" value={form.departmentName} onChange={(e) => setForm((prev) => ({ ...prev, departmentName: e.target.value }))} />
              <Autocomplete
                options={departmentManagers}
                loading={departmentManagersLoading}
                disabled={!editingDepartment}
                value={departmentManagers.find((employee) => String(employee?.employeeGuid || employee?.guid || '').toLowerCase() === String(form.managerGuid || '').toLowerCase()) || null}
                onChange={(_, employee) => setForm((prev) => ({ ...prev, managerGuid: employee?.employeeGuid || employee?.guid || '' }))}
                getOptionLabel={(employee) => `${employee?.fullName || employee?.name || 'غير محدد'}${employee?.jobTitle ? ` - ${employee.jobTitle}` : ''}`}
                renderInput={(params) => <TextField {...params} label="مدير القسم" placeholder={editingDepartment ? 'اختر مدير القسم' : 'احفظ القسم أولاً'} />}
              />
              <TextField label="وصف القسم" multiline minRows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              <TextField label="ملاحظات" multiline minRows={2} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              {editingDepartment && (
                <FormControl fullWidth sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <InputLabel>الحالة</InputLabel>
                  <Select label="الحالة" value={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value }))}>
                    <MenuItem value={true}>نشط</MenuItem>
                    <MenuItem value={false}>غير نشط</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1 }}>
            <Button onClick={saveDepartment} disabled={saving} variant="contained" sx={{ bgcolor: primary }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'حفظ'}
            </Button>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>إلغاء</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={employeesOpen}
          onClose={handleCloseEmployees}
          fullWidth
          maxWidth={false}
          PaperProps={{
            sx: {
              width: isPhone ? 'calc(100% - 12px)' : 'min(1180px, calc(100% - 32px))',
              maxWidth: '1180px',
              maxHeight: '92dvh',
              borderRadius: 2.5,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box minWidth={0}>
                <Typography sx={{ fontWeight: 950, color: isDark ? 'text.primary' : primaryDark }}>
                  موظفو {employeesDepartment?.departmentName || 'القسم'}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '.7rem' }}>
                  {employeeTotal} موظف
                </Typography>
              </Box>
              <IconButton onClick={handleCloseEmployees}><CloseIcon /></IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: isPhone ? 0.8 : 1.2, overflowX: 'hidden' }}>
            <Paper elevation={0} sx={{ ...surfaceSx, p: 0.8, mb: 0.8, borderRadius: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(260px,1.5fr) minmax(220px,1fr) auto' : '1fr', gap: 0.7, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="بحث داخل موظفي القسم"
                  placeholder="الاسم، الكود، الجوال أو المسمى"
                  value={employeeSearch}
                  onChange={(event) => {
                    setEmployeeSearch(event.target.value);
                    setEmployeePage(1);
                    setSelectedEmployeeGuids([]);
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: primary }} /></InputAdornment>
                  }}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>نقل إلى قسم</InputLabel>
                  <Select
                    MenuProps={rtlMenuProps}
                    label="نقل إلى قسم"
                    value={transferTargetGuid}
                    onChange={(event) => {
                      setTransferTargetGuid(event.target.value);
                      setTransferError('');
                    }}
                  >
                    <MenuItem value="">اختر القسم</MenuItem>
                    {departments
                      .filter((department) => department?.isActive === true && String(department?.departmentGuid || '').toLowerCase() !== String(employeesDepartment?.departmentGuid || '').toLowerCase())
                      .map((department) => (
                        <MenuItem key={department?.departmentGuid} value={department?.departmentGuid || ''}>
                          {department?.departmentName || 'غير محدد'}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<SwapHorizIcon />}
                  onClick={requestTransferEmployees}
                  disabled={transferringEmployees || selectedEmployeeGuids.length === 0}
                  sx={{ bgcolor: primary, minHeight: 40 }}
                >
                  نقل المحددين ({selectedEmployeeGuids.length})
                </Button>
              </Box>

              <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mt: 0.55 }}>
                <Checkbox
                  size="small"
                  checked={departmentEmployees.length > 0 && departmentEmployees.every((employee) => selectedEmployeeGuids.includes(String(employee?.employeeGuid || '')))}
                  indeterminate={departmentEmployees.some((employee) => selectedEmployeeGuids.includes(String(employee?.employeeGuid || ''))) && !departmentEmployees.every((employee) => selectedEmployeeGuids.includes(String(employee?.employeeGuid || '')))}
                  onChange={toggleSelectAllCurrentPage}
                  sx={{ color: primary }}
                />
                <Typography color="text.secondary" sx={{ fontSize: '.7rem' }}>
                  تحديد موظفي الصفحة الحالية ({departmentEmployees.length})
                </Typography>
              </Stack>

              {transferError && <Alert severity="error" sx={{ mt: 0.6 }}>{transferError}</Alert>}
            </Paper>

            {employeesLoading ? (
              <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress sx={{ color: primary }} /></Box>
            ) : departmentEmployees.length === 0 ? (
              <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Typography>{employeeSearch.trim() ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد موظفون في هذا القسم'}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2,minmax(0,1fr))' : '1fr', gap: 0.6 }}>
                {departmentEmployees.map((employee) => {
                  const guid = String(employee?.employeeGuid || '');
                  const selected = selectedEmployeeGuids.includes(guid);
                  return (
                    <Paper
                      key={guid}
                      elevation={0}
                      onClick={() => toggleEmployeeSelection(guid)}
                      sx={{
                        ...surfaceSx,
                        p: 0.75,
                        borderRadius: 2,
                        cursor: 'pointer',
                        borderColor: selected ? 'rgba(5,117,70,.55)' : surfaceSx.borderColor,
                        bgcolor: selected ? (isDark ? 'rgba(69,168,121,.14)' : '#f0f9f5') : surfaceSx.bgcolor
                      }}
                    >
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Checkbox size="small" checked={selected} onClick={(e) => e.stopPropagation()} onChange={() => toggleEmployeeSelection(guid)} sx={{ color: primary }} />
                        <Avatar sx={{ width: 34, height: 34, bgcolor: isDark ? 'rgba(128,201,167,.16)' : primaryLight, color: isDark ? '#80c9a7' : primary }}>
                          {(employee?.fullName || 'م').trim().charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {employee?.fullName || 'بدون اسم'}
                          </Typography>
                          <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>
                            {employee?.jobTitle || 'غير محدد'}
                          </Typography>
                        </Box>
                        <Chip size="small" label={employee?.isActive ? 'نشط' : 'غير نشط'} color={employee?.isActive ? 'success' : 'default'} />
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}

            {employeeTotal > 0 && (
              <Box sx={{ mt: 0.85, pt: 0.8, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.8, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 112 }}>
                  <InputLabel>عدد الصفوف</InputLabel>
                  <Select
                    MenuProps={rtlMenuProps}
                    value={employeePageSize}
                    label="عدد الصفوف"
                    onChange={(event) => {
                      setEmployeePageSize(Number(event.target.value));
                      setEmployeePage(1);
                      setSelectedEmployeeGuids([]);
                    }}
                  >
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>

                <Pagination
                  page={Math.min(employeePage, Math.max(1, employeePageCount))}
                  count={Math.max(1, employeePageCount)}
                  onChange={(_, nextPage) => {
                    setEmployeePage(nextPage);
                    setSelectedEmployeeGuids([]);
                  }}
                  color="primary"
                  size="small"
                  siblingCount={1}
                  boundaryCount={1}
                  sx={{ direction: 'ltr' }}
                />

                <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>
                  إجمالي الموظفين: {employeeTotal}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={transferConfirmOpen} onClose={() => !transferringEmployees && setTransferConfirmOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <SwapHorizIcon sx={{ color: primary }} />
              <Typography sx={{ fontWeight: 900 }}>تأكيد نقل الموظفين</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '.75rem', lineHeight: 1.8 }}>
              سيتم نقل {selectedEmployeeGuids.length} موظف من {employeesDepartment?.departmentName || 'القسم الحالي'} إلى {transferTargetDepartment?.departmentName || 'القسم المحدد'}.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransferConfirmOpen(false)} disabled={transferringEmployees}>إلغاء</Button>
            <Button onClick={executeTransferEmployees} disabled={transferringEmployees} variant="contained" sx={{ bgcolor: primary }}>
              {transferringEmployees ? <CircularProgress size={18} color="inherit" /> : 'تأكيد النقل'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={{ fontWeight: 900 }}>سجل القسم</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>{historyDepartment?.departmentName || ''}</Typography>
              </Box>
              <IconButton onClick={() => setHistoryOpen(false)}><CloseIcon /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {historyLoading ? (
              <Box sx={{ minHeight: 160, display: 'grid', placeItems: 'center' }}><CircularProgress sx={{ color: primary }} /></Box>
            ) : history.length === 0 ? (
              <Typography sx={{ py: 3, textAlign: 'center' }}>لا يوجد سجل تعديلات</Typography>
            ) : (
              <Stack spacing={0.6}>
                {history.map((item, index) => (
                  <Paper key={item?.guid || item?.id || index} elevation={0} sx={{ ...surfaceSx, p: 0.9, borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '.74rem' }}>
                      {item?.actionName || item?.action || item?.description || item?.changeType || 'تعديل'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.2, fontSize: '.66rem' }}>
                      {item?.changedByName || item?.userName || item?.createdByName || 'غير محدد'}
                      {item?.createdAt || item?.changeDate || item?.changedAt ? ` • ${new Date(item?.createdAt || item?.changeDate || item?.changedAt).toLocaleString('ar-EG')}` : ''}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={orgOpen} onClose={() => setOrgOpen(false)} fullWidth maxWidth="xl">
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography sx={{ fontWeight: 950 }}>الهيكل الإداري المرن</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '.68rem' }}>إدارة الرؤية الإدارية والمدير المباشر</Typography>
              </Box>
              <IconButton onClick={() => setOrgOpen(false)}><CloseIcon /></IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers><HrOrganizationDesigner /></DialogContent>
          <DialogActions><Button onClick={() => setOrgOpen(false)}>إغلاق</Button></DialogActions>
        </Dialog>

        <Dialog open={deactivateBlockedOpen} onClose={() => setDeactivateBlockedOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <WarningAmberRoundedIcon color="warning" />
              <Typography sx={{ fontWeight: 900 }}>لا يمكن تعطيل القسم</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: '.75rem', lineHeight: 1.7 }}>
              يوجد موظفون نشطون داخل هذا القسم. انقل الموظفين أو عطّل ارتباطهم أولاً ثم حاول مرة أخرى.
            </Typography>
          </DialogContent>
          <DialogActions><Button onClick={() => setDeactivateBlockedOpen(false)}>إغلاق</Button></DialogActions>
        </Dialog>
      </Box>
    </NavigationShell>
  );
};

const StatCard = ({ title, value, icon, surfaceSx }) => (
  <Paper elevation={0} sx={{ ...surfaceSx, p: 0.9, borderRadius: 2.3 }}>
    <Stack direction="row" alignItems="center" spacing={0.7}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.7, display: 'grid', placeItems: 'center', bgcolor: 'rgba(5,117,70,.08)', color: primary }}>
        {icon}
      </Box>
      <Box>
        <Typography color="text.secondary" sx={{ fontSize: '.66rem' }}>{title}</Typography>
        <Typography sx={{ fontWeight: 950, fontSize: '1rem', color: primary }}>{value}</Typography>
      </Box>
    </Stack>
  </Paper>
);

const MiniStat = ({ label, value }) => (
  <Box sx={{ p: 0.45, borderRadius: 1.4, textAlign: 'center', bgcolor: 'rgba(5,117,70,.045)' }}>
    <Typography sx={{ fontWeight: 950, fontSize: '.72rem', color: primary }}>{value}</Typography>
    <Typography color="text.secondary" sx={{ fontSize: '.57rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Typography>
  </Box>
);

export default HrDepartmentsPage;
