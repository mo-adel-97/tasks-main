import * as uiLayout from './common/uiLayout';
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stack
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import Swal from "sweetalert2";

const API_BASE = "https://filesregsiteration.sstli.com/erp/update_api.php"; 
// مثال: https://sstli.com/erp/update_api.php

export default function UploadUpdate() {
  const userGuid = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      return u?.guid || "";
    } catch {
      return "";
    }
  }, []);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null); // {success, message, ...}

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setLastResult(null);

    if (!f) {
      setFile(null);
      return;
    }

  const ext = (f.name.split(".").pop() || "").toLowerCase();
if (!["zip", "rar"].includes(ext)) {
  setFile(null);
  e.target.value = "";
  Swal.fire({
    icon: "error",
    title: "ملف غير صحيح",
    text: "مسموح فقط برفع ملفات ZIP أو RAR"
  });
  return;
}


    setFile(f);
  };

  const handleUpload = async () => {
    if (!userGuid) {
      Swal.fire({
        icon: "error",
        title: "مفيش User GUID",
        text: "مش لاقي user.guid في localStorage"
      });
      return;
    }

    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "اختار ملف",
        text: "لازم تختار ملف ZIP الأول"
      });
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const formData = new FormData();
      formData.append("userguid", userGuid);
      formData.append("update_zip", file);

 const res = await fetch(`${API_BASE}?action=upload_update`, {
  method: "POST",
  headers: {
    "X-API-KEY": "CHANGE_ME_TO_RANDOM_KEY"
  },
  body: formData
});


      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const msg = data?.message || "فشل رفع التحديث";
        setLastResult({ success: false, message: msg, raw: data });
        Swal.fire({
          icon: "error",
          title: "خطأ في رفع التحديث",
          html: `<div style="text-align:right">سبب الخطأ: ${msg}</div>`
        });
        return;
      }

      setLastResult({ success: true, message: data?.message || "تم الرفع", raw: data });

      Swal.fire({
        icon: "success",
        title: "تم رفع التحديث بنجاح",
        html: `
          <div style="text-align:right">
            <div><b>الملف:</b> ${data.zip || ""}</div>
            ${data.download_url ? `<div style="margin-top:8px"><a href="${data.download_url}" target="_blank">تحميل التحديث</a></div>` : ""}
          </div>
        `,
        confirmButtonText: "تمام"
      });

      // تفريغ الملف بعد النجاح
      setFile(null);
      const input = document.getElementById("updateZipInput");
      if (input) input.value = "";
    } catch (err) {
      setLastResult({ success: false, message: String(err?.message || err) });
      Swal.fire({
        icon: "error",
        title: "خطأ غير متوقع",
        text: String(err?.message || err)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2, direction: "rtl" }}>
      <Paper sx={uiLayout.withUiSx({ p: 3, borderRadius: 3 }, uiLayout.pageHeaderSx)}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <SystemUpdateAltIcon />
          <Typography variant="h6" sx={{ fontFamily: "Cairo", fontWeight: 800 }}>
            رفع تحديث النظام
          </Typography>
        </Stack>

        <Typography sx={{ mb: 2, fontFamily: "Cairo", opacity: 0.9 }}>
          ارفع ملف التحديث بصيغة <b>ZIP</b> — عند الرفع النظام هيعمل <b>ceckversionnew = true</b> لكل المستخدمين.
        </Typography>

        {!userGuid && (
          <Alert severity="error" sx={{ mb: 2 }}>
            مش لاقي user.guid في localStorage — لازم تكون مسجل دخول.
          </Alert>
        )}

        <Stack sx={uiLayout.actionBarSx} spacing={2}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={uiLayout.withUiSx({ fontFamily: "Cairo", borderRadius: 2, py: 1.2 }, uiLayout.buttonSx)}
            disabled={loading}
          >
            {file ? `تم اختيار: ${file.name}` : "اختيار ملف ZIP"}
           <input
  id="updateZipInput"
  type="file"
  hidden
  accept=".zip,.rar"
  onChange={onPickFile}
/>

          </Button>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={loading || !file || !userGuid}
            sx={uiLayout.withUiSx({ fontFamily: "Cairo", borderRadius: 2, py: 1.2 }, uiLayout.buttonSx)}
          >
            رفع التحديث
          </Button>

          {loading && <LinearProgress />}

          {lastResult?.message && (
            <Alert severity={lastResult.success ? "success" : "error"}>
              {lastResult.message}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
