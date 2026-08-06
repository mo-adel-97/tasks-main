import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import Sidebar from "../components/Sidebar";

const SIDEBAR_WIDTH = 280;
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const today = () => new Date().toISOString().slice(0, 10);

const exportCsv = (rows, fileName) => {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const headers = ["اسم المتدرب", "رقم الجوال", "رقم الهوية", "الدبلوم/الدورة", "المدينة"];
  const lines = [
    headers.map(quote).join(","),
    ...rows.map((row) => [row.name, row.phoneNumber, row.nationalIdNumber, row.diploma, row.city].map(quote).join(","))
  ];

  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const RegistrationRequestsPage = ({ mode, title, subtitle, exportFileName }) => {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const userGuid = String(user?.guid || user?.Guid || "").trim();

  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!userGuid) return setError("بيانات المستخدم غير موجودة");
    if (!fromDate || !toDate) return setError("برجاء تحديد تاريخ البداية والنهاية");
    if (fromDate > toDate) return setError("تاريخ البداية يجب ألا يتجاوز تاريخ النهاية");

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ userGuid, mode, fromDate, toDate });
      const response = await fetch(`${API_BASE_URL}/api/registration-requests?${params.toString()}`, {
        headers: { Accept: "application/json" }
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok) throw new Error(result?.message || "تعذر تحميل البيانات");
      setRows(Array.isArray(result?.data?.rows) ? result.data.rows : []);
    } catch (ex) {
      setRows([]);
      setError(ex?.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f8f7", direction: "ltr" }}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${SIDEBAR_WIDTH}px`,
          zIndex: 1200,
          overflowY: "auto",
          background: "#fff"
        }}
      >
        <Sidebar />
      </Box>

      <Box
        component="main"
        sx={{
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight: "100vh",
          p: { xs: 1.5, md: 3 },
          direction: "ltr"
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(5,117,70,.13)", overflow: "hidden" }}>
          <Box sx={{ p: 3, background: "linear-gradient(135deg,#fff,#edf8f3)", borderBottom: "1px solid rgba(5,117,70,.12)" }}>
            <Typography variant="h5" sx={{ fontFamily: "Cairo", fontWeight: 900, color: "#034d31" }}>
              {title}
            </Typography>
            <Typography sx={{ mt: .5, fontFamily: "Cairo", color: "#60756d" }}>{subtitle}</Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
              <TextField type="date" label="من تاريخ" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField type="date" label="إلى تاريخ" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />

              <Button variant="contained" startIcon={<SearchIcon />} onClick={loadData} disabled={loading} sx={{ fontFamily: "Cairo", fontWeight: 800, background: "#057546" }}>
                عرض
              </Button>

              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} disabled={loading} sx={{ fontFamily: "Cairo", fontWeight: 800 }}>
                تحديث
              </Button>

              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCsv(rows, exportFileName)} disabled={loading || rows.length === 0} sx={{ fontFamily: "Cairo", fontWeight: 800, color: "#ae1e21", borderColor: "#ae1e21" }}>
                تصدير Excel
              </Button>

              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ px: 2, py: 1, borderRadius: 2, background: "#edf8f3", color: "#034d31", fontFamily: "Cairo", fontWeight: 900 }}>
                العدد: {rows.length}
              </Box>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2, fontFamily: "Cairo" }}>{error}</Alert>}

            <Box sx={{ border: "1px solid rgba(5,117,70,.13)", borderRadius: 3, overflow: "auto", minHeight: 360 }}>
              {loading ? (
                <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box component="table" sx={{ width: "100%", minWidth: 850, borderCollapse: "collapse", direction: "ltr", "& th": { p: 1.5, background: "#057546", color: "#fff", fontFamily: "Cairo", fontWeight: 900, textAlign: "left" }, "& td": { p: 1.35, borderBottom: "1px solid rgba(5,117,70,.09)", fontFamily: "Cairo", textAlign: "left" }, "& tbody tr:hover": { background: "#f1faf6" } }}>
                  <thead>
                    <tr>
                      <th>اسم المتدرب</th>
                      <th>رقم الجوال</th>
                      <th>رقم الهوية</th>
                      <th>الدبلوم/الدورة</th>
                      <th>المدينة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={5}>لا توجد بيانات خلال الفترة المحددة</td></tr>
                    ) : rows.map((row, index) => (
                      <tr key={`${row.nationalIdNumber}-${index}`}>
                        <td>{row.name || "-"}</td>
                        <td>{row.phoneNumber || "-"}</td>
                        <td>{row.nationalIdNumber || "-"}</td>
                        <td>{row.diploma || "-"}</td>
                        <td>{row.city || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegistrationRequestsPage;
