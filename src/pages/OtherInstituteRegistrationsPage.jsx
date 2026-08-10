import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import InfoIcon from "@mui/icons-material/Info";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const SIDEBAR_WIDTH = 280;

const primaryColor = "#80b49e";
const primaryDark = "#6a9a87";
const primaryLight = "#eef7f3";
const textColor = "#2c3e50";
const dangerColor = "#d32f2f";
const warningColor = "#ed6c02";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5258/api";

const allowedGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e"
];

const safeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);

  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const isActiveRegistered = (value) =>
  value === true ||
  value === 1 ||
  String(value).toLowerCase() === "true";

const getStatusChip = (isStillRegistered) => {
  const active = isActiveRegistered(isStillRegistered);

  if (active) {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="مازال مسجلاً"
        size="small"
        sx={{
          backgroundColor: "#e8f5e9",
          color: "#1b5e20",
          fontWeight: 900,
          direction: "ltr",
          maxWidth: "100%",
          "& .MuiChip-label": {
            textAlign: "left",
            whiteSpace: "normal"
          }
        }}
      />
    );
  }

  return (
    <Chip
      icon={<CancelIcon />}
      label="لم يعد مسجلاً"
      size="small"
      sx={{
        backgroundColor: "#ffebee",
        color: "#b71c1c",
        fontWeight: 900,
        direction: "ltr",
        maxWidth: "100%",
        "& .MuiChip-label": {
          textAlign: "left",
          whiteSpace: "normal"
        }
      }}
    />
  );
};

export default function OtherInstituteRegistrationsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userGuid = String(user?.guid || "").toLowerCase();

  const canAccess = allowedGuids.includes(userGuid);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [updateNote, setUpdateNote] = useState("");

  const loadData = async () => {
    if (!canAccess) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admission-requests/other-institute-registrations?userGuid=${encodeURIComponent(
          userGuid
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "حدث خطأ أثناء تحميل البيانات");
      }

      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const isStill = isActiveRegistered(row.isStillRegistered);

      if (statusFilter === "active" && !isStill) return false;
      if (statusFilter === "inactive" && isStill) return false;

      if (!q) return true;

      const text = [
        row.orderCode,
        row.regDocCode,
        row.studentName,
        row.nationalId,
        row.studentTel,
        row.branchName,
        row.sellerName,
        row.traineeStatusNote,
        row.otherInstituteName,
        row.notes,
        row.statusUpdateNote,
        row.createdAt,
        row.statusUpdatedAt
      ]
        .map(safeText)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [rows, search, statusFilter]);

  const totalCount = rows.length;
  const activeCount = rows.filter((x) =>
    isActiveRegistered(x.isStillRegistered)
  ).length;
  const inactiveCount = totalCount - activeCount;

  const openConfirm = (row) => {
    setSelectedRow(row);
    setUpdateNote("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (savingId) return;
    setConfirmOpen(false);
    setSelectedRow(null);
    setUpdateNote("");
  };

  const markAsNotRegistered = async () => {
    if (!selectedRow) return;

    const id = selectedRow.id || selectedRow.ID;

    if (!id) {
      setError("لا يمكن قراءة كود السجل");
      return;
    }

    setSavingId(id);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admission-requests/other-institute-registrations/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            isStillRegistered: false,
            userGuid,
            note: updateNote
          })
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "حدث خطأ أثناء تحديث الحالة");
      }

      setRows((prev) =>
        prev.map((x) => {
          const rowId = x.id || x.ID;
          if (String(rowId) !== String(id)) return x;

          return {
            ...x,
            isStillRegistered: false,
            statusText: "لم يعد مسجلاً",
            statusUpdateNote: updateNote,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedByGuid: userGuid
          };
        })
      );

      setSuccessMessage("تم تحديث الحالة بنجاح");
      closeConfirm();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث الحالة");
    } finally {
      setSavingId(null);
    }
  };

  const commonCellSx = {
    fontFamily: "Cairo",
    fontWeight: 700,
    textAlign: "left",
    verticalAlign: "top",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.7,
    px: 1.2,
    py: 1.4
  };

  const headerCellSx = {
    fontFamily: "Cairo",
    fontWeight: 900,
    backgroundColor: primaryLight,
    color: textColor,
    textAlign: "left",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.6,
    px: 1.2,
    py: 1.4
  };

  if (!canAccess) {
    return (
      <Box sx={{ display: "flex", direction: "ltr" }}>
        <Sidebar />

        <Box
          sx={{
            marginLeft: `${SIDEBAR_WIDTH}px`,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
            minHeight: "100vh",
            p: 3,
            backgroundColor: "#f7faf9",
            direction: "ltr",
            textAlign: "left"
          }}
        >
          <Alert severity="error" sx={{ fontFamily: "Cairo", textAlign: "left" }}>
            ليس لديك صلاحية الوصول إلى صفحة المسجلين في معاهد أخرى
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", direction: "ltr" }}>
      <Sidebar />

      <Box
        sx={{
          marginLeft: `${SIDEBAR_WIDTH}px`,
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          minHeight: "100vh",
          p: 3,
          backgroundColor: "#f7faf9",
          direction: "ltr",
          textAlign: "left",
          fontFamily: "Cairo, Arial",
          overflowX: "hidden"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            border: "1px solid #e4eeea",
            background: "linear-gradient(135deg, #ffffff 0%, #f4fbf8 100%)",
            direction: "ltr",
            textAlign: "left"
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box sx={{ textAlign: "left" }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SchoolIcon sx={{ color: primaryDark, fontSize: 34 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    color: textColor,
                    textAlign: "left",
                    fontFamily: "Cairo"
                  }}
                >
                  المسجلين في معاهد أخرى
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 1,
                  color: "#607d70",
                  fontWeight: 600,
                  textAlign: "left",
                  fontFamily: "Cairo"
                }}
              >
                تقرير متابعة الطلاب الذين تم تسجيلهم كمسجلين في معاهد أخرى، مع إمكانية تحديث الحالة عند طي القيد.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                fontFamily: "Cairo",
                minWidth: 130
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e4eeea",
                textAlign: "left",
                minHeight: 95
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <InfoIcon sx={{ color: primaryDark }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, textAlign: "left" }}>
                    إجمالي السجلات
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: primaryDark }}>
                    {totalCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e4eeea",
                textAlign: "left",
                minHeight: 95
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleIcon sx={{ color: primaryDark }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, textAlign: "left" }}>
                    مازالوا مسجلين
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: primaryDark }}>
                    {activeCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e4eeea",
                textAlign: "left",
                minHeight: 95
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CancelIcon sx={{ color: dangerColor }} />
                <Box>
                  <Typography sx={{ fontWeight: 900, textAlign: "left" }}>
                    لم يعودوا مسجلين
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: dangerColor }}>
                    {inactiveCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 4,
            border: "1px solid #e4eeea",
            direction: "ltr",
            textAlign: "left"
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم الطالب، رقم الهوية، المعهد الآخر، الفرع، مسئول التسجيل..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "#8aa99c", mr: 1 }} />
                }}
                sx={{
                  direction: "ltr",
                  "& input": {
                    textAlign: "left",
                    fontFamily: "Cairo",
                    fontWeight: 700
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  direction: "ltr",
                  "& .MuiInputBase-input": {
                    textAlign: "left",
                    fontFamily: "Cairo",
                    fontWeight: 700
                  },
                  "& .MuiInputLabel-root": {
                    left: 0,
                    right: "auto",
                    transformOrigin: "left"
                  }
                }}
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="active">مازال مسجلاً</MenuItem>
                <MenuItem value="inactive">لم يعد مسجلاً</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left", fontFamily: "Cairo" }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2, textAlign: "left", fontFamily: "Cairo" }}>
            {successMessage}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid #e4eeea",
            overflow: "hidden",
            direction: "ltr",
            textAlign: "left",
            width: "100%"
          }}
        >
          {loading ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <CircularProgress sx={{ color: primaryDark }} />
              <Typography sx={{ mt: 2, fontWeight: 800 }}>
                جاري تحميل البيانات...
              </Typography>
            </Box>
          ) : (
            <TableContainer
              sx={{
                maxHeight: "calc(100vh - 360px)",
                overflowX: "hidden",
                width: "100%"
              }}
            >
              <Table
                stickyHeader
                sx={{
                  tableLayout: "fixed",
                  width: "100%"
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      الحالة
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      هل سوّى طي قيد من المعهد الآخر؟
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "9%" }}>
                      رقم الطلب
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الاستمارة
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "15%" }}>
                      اسم الطالب
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الهوية
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      رقم الجوال
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "12%" }}>
                      الفرع
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "10%" }}>
                      مسئول التسجيل
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "14%" }}>
                      ملاحظة مسئول التسجيل
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "13%" }}>
                      المعهد الآخر
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: "15%" }}>
                      ملاحظات
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} sx={{ textAlign: "center", py: 5 }}>
                        <Typography sx={{ fontWeight: 900, color: "#789" }}>
                          لا توجد بيانات للعرض
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const id = row.id || row.ID;
                      const isStill = isActiveRegistered(row.isStillRegistered);

                      return (
                        <TableRow key={id} hover>
                          <TableCell sx={commonCellSx}>
                            <Stack spacing={1}>
                              {getStatusChip(row.isStillRegistered)}

                              {row.statusUpdatedAt && (
                                <Typography
                                  sx={{
                                    fontSize: "0.72rem",
                                    color: "#789",
                                    fontWeight: 700,
                                    textAlign: "left"
                                  }}
                                >
                                  تحديث: {formatDate(row.statusUpdatedAt)}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            {isStill ? (
                              <Tooltip title="تحديث الحالة إلى لم يعد مسجلاً">
                                <span>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<DoneAllIcon />}
                                    disabled={savingId === id}
                                    onClick={() => openConfirm(row)}
                                    sx={{
                                      fontWeight: 900,
                                      borderRadius: 2,
                                      backgroundColor: warningColor,
                                      fontFamily: "Cairo",
                                      width: "100%",
                                      whiteSpace: "normal",
                                      lineHeight: 1.5,
                                      py: 0.8,
                                      "&:hover": {
                                        backgroundColor: "#c75a00"
                                      }
                                    }}
                                  >
                                   تحديث حالته
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Chip
                                label="تم طي القيد"
                                size="small"
                                sx={{
                                  fontWeight: 900,
                                  backgroundColor: "#ffebee",
                                  color: "#b71c1c",
                                  whiteSpace: "normal",
                                  height: "auto",
                                  py: 0.5,
                                  "& .MuiChip-label": {
                                    whiteSpace: "normal"
                                  }
                                }}
                              />
                            )}
                          </TableCell>

                          <TableCell sx={commonCellSx}>{safeText(row.orderCode)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.regDocCode)}</TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <PersonIcon sx={{ color: primaryDark, fontSize: 18, mt: 0.3 }} />
                              <span>{safeText(row.studentName)}</span>
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>{safeText(row.nationalId)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.studentTel)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.branchName)}</TableCell>
                          <TableCell sx={commonCellSx}>{safeText(row.sellerName)}</TableCell>

                          <TableCell sx={commonCellSx}>
                            {row.traineeStatusNote ? (
                              <Tooltip title={safeText(row.traineeStatusNote)} arrow>
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 800,
                                    fontSize: "0.82rem",
                                    textAlign: "left",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                    color: textColor
                                  }}
                                >
                                  {safeText(row.traineeStatusNote)}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  color: "#9aa7a1",
                                  textAlign: "left"
                                }}
                              >
                                لا توجد ملاحظة
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <BusinessIcon sx={{ color: primaryDark, fontSize: 18, mt: 0.3 }} />
                              <span>{safeText(row.otherInstituteName)}</span>
                            </Stack>
                          </TableCell>

                          <TableCell sx={commonCellSx}>
                            <Stack spacing={0.8}>
                              {row.notes && (
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    textAlign: "left",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  {safeText(row.notes)}
                                </Typography>
                              )}

                              {row.statusUpdateNote && (
                                <Typography
                                  sx={{
                                    fontFamily: "Cairo",
                                    fontWeight: 800,
                                    fontSize: "0.78rem",
                                    color: dangerColor,
                                    textAlign: "left",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  ملاحظة طي القيد: {safeText(row.statusUpdateNote)}
                                </Typography>
                              )}

                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 700,
                                  fontSize: "0.72rem",
                                  color: "#789",
                                  textAlign: "left"
                                }}
                              >
                                تاريخ التسجيل: {formatDate(row.createdAt)}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Dialog
          open={confirmOpen}
          onClose={closeConfirm}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              direction: "ltr",
              textAlign: "left",
              borderRadius: 4
            }
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Cairo",
              fontWeight: 900,
              textAlign: "left",
              color: textColor
            }}
          >
            تأكيد طي القيد من المعهد الآخر
          </DialogTitle>

          <DialogContent sx={{ textAlign: "left" }}>
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 700, mb: 2 }}>
              هل أنت متأكد أن الطالب لم يعد مسجلاً في المعهد الآخر؟
            </Typography>

            {selectedRow && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 3,
                  backgroundColor: "#f7faf9",
                  border: "1px solid #e4eeea",
                  textAlign: "left"
                }}
              >
                <Typography sx={{ fontWeight: 900, textAlign: "left" }}>
                  الطالب: {safeText(selectedRow.studentName)}
                </Typography>
                <Typography sx={{ fontWeight: 800, textAlign: "left" }}>
                  رقم الهوية: {safeText(selectedRow.nationalId)}
                </Typography>
                <Typography sx={{ fontWeight: 800, textAlign: "left" }}>
                  المعهد الآخر: {safeText(selectedRow.otherInstituteName)}
                </Typography>
              </Paper>
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="ملاحظة التحديث"
              placeholder="مثال: تم طي قيده من المعهد الآخر بناءً على الإفادة"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              sx={{
                direction: "ltr",
                "& textarea": {
                  textAlign: "left",
                  fontFamily: "Cairo",
                  fontWeight: 700
                },
                "& .MuiInputLabel-root": {
                  left: 0,
                  right: "auto",
                  transformOrigin: "left"
                }
              }}
            />
          </DialogContent>

          <Divider />

          <DialogActions sx={{ justifyContent: "flex-start", p: 2 }}>
            <Button
              onClick={closeConfirm}
              disabled={!!savingId}
              sx={{ fontFamily: "Cairo", fontWeight: 900 }}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={markAsNotRegistered}
              disabled={!!savingId}
              startIcon={savingId ? <CircularProgress size={16} /> : <DoneAllIcon />}
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 2,
                backgroundColor: warningColor,
                "&:hover": {
                  backgroundColor: "#c75a00"
                }
              }}
            >
              تأكيد طي القيد
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}