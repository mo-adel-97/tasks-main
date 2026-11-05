// تبويب "استقبال مكالمة" (صلاحية cs-agent): بحث بالجوال/الهوية/الاسم ← ملف العميل ← تسجيل مكالمة.
// لو العميل مش موجود: تسجيله (نفس بيانات الشاشة القديمة والديسكتوب) وبعدها يكمل عادي.
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, InputAdornment, Stack, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTasksPalette } from "../tasks/tasksCommon";
import { SectionCard } from "../tasks/TasksUi";
import { csGet } from "./csCommon";
import { CallDialog, CustomerProfileView, NewCustomerDialog } from "./CsDialogs";

export default function CallDesk({ onOpenTicket, onTicketCreated }) {
  const p = useTasksPalette();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) { setResults(null); return undefined; }
    const timer = setTimeout(() => {
      setSearching(true);
      csGet("/customers/search", { q })
        .then((rows) => {
          setResults(rows);
          // رقم هوية أو جوال مطابق تمامًا لعميل واحد: افتح ملفه على طول
          if (rows.length === 1 && (rows[0].nationalId === q || rows[0].tel === q)) setCustomer(rows[0]);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const reset = () => {
    setCustomer(null);
    setQuery("");
    setResults(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (customer) {
    return (
      <SectionCard sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Button startIcon={<ArrowBackIcon sx={{ transform: "scaleX(-1)" }} />} onClick={reset} sx={{ mb: 1.5, fontWeight: 700 }}>
          مكالمة أخرى / بحث جديد
        </Button>
        <CustomerProfileView accountGuid={customer.accountGuid} reloadKey={reloadKey} onOpenTicket={onOpenTicket} onNewCall={() => setCallOpen(true)} />
        <CallDialog
          open={callOpen}
          customer={customer}
          onClose={() => setCallOpen(false)}
          onCreated={(guid, isOpen) => {
            setCallOpen(false);
            setReloadKey((k) => k + 1);
            onTicketCreated?.();
            if (isOpen && guid) onOpenTicket(guid);
          }}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
        <Box sx={{ fontSize: 22, fontWeight: 800, color: p.text }}>استقبال مكالمة</Box>
        <Box sx={{ fontSize: 13.5, color: p.muted, mt: 0.5, mb: 2.5 }}>
          بعد الترحيب بالمتصل اسأله عن رقم الهوية أو رقم الجوال
        </Box>
        <TextField
          inputRef={inputRef}
          autoFocus
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="رقم الهوية أو الجوال أو الاسم…"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment> : null,
            sx: { fontSize: 18, borderRadius: 3, py: 0.5 }
          }}
        />

        {results && results.length > 0 ? (
          <Stack spacing={1} sx={{ mt: 2, textAlign: "start" }}>
            {results.map((r) => (
              <Box key={r.accountGuid} onClick={() => setCustomer(r)}
                sx={{ p: 1.5, borderRadius: 2.5, border: `1px solid ${p.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 1.5, "&:hover": { bgcolor: p.hover } }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: p.tone("#057546").bg, color: p.tone("#057546").fg, flexShrink: 0 }}>
                  <PersonIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontWeight: 800, fontSize: 15, color: p.text }}>{r.name}</Box>
                  <Box sx={{ fontSize: 12.5, color: p.muted }}>
                    <bdi dir="ltr">{r.tel || "—"}</bdi> · <bdi dir="ltr">{r.nationalId || "—"}</bdi>{r.branch ? ` · ${r.branch}` : ""}
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : null}

        {results && results.length === 0 && !searching ? (
          <Box sx={{ mt: 2.5, p: 2.5, borderRadius: 3, border: `1px dashed ${p.borderStrong}` }}>
            <Box sx={{ fontSize: 15, fontWeight: 800, color: p.text }}>لا يوجد عميل مطابق</Box>
            <Box sx={{ fontSize: 13, color: p.muted, mt: 0.5, mb: 1.5 }}>سجّل بيانات المتصل ثم سجّل المكالمة.</Box>
            <Button variant="contained" startIcon={<PersonAddAlt1Icon />} onClick={() => setNewCustomerOpen(true)}
              sx={{ bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#04633b" } }}>
              تسجيل عميل جديد
            </Button>
          </Box>
        ) : null}

        {results && results.length > 0 ? (
          <Button size="small" startIcon={<PersonAddAlt1Icon />} onClick={() => setNewCustomerOpen(true)} sx={{ mt: 1.5 }}>
            المتصل غير موجود في النتائج؟ سجّله كعميل جديد
          </Button>
        ) : null}
      </Box>

      <NewCustomerDialog
        open={newCustomerOpen}
        initial={query}
        onClose={() => setNewCustomerOpen(false)}
        onCreated={(accountGuid) => {
          setNewCustomerOpen(false);
          setCustomer({ accountGuid });
          setCallOpen(true);
        }}
      />
    </SectionCard>
  );
}
