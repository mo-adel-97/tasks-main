// المحادثة على التقرير بين الموظف والإدارة + سجل الإرسال والمراجعة والإعادة.
import React, { useState } from "react";
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography, alpha } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import P2PToneChip from "./P2PToneChip";
import { p2pApi, toast, useUi } from "./p2pShared";

const KIND = {
  submit: { label: "أُرسل التقرير", tone: "info" },
  review: { label: "تمت المراجعة", tone: "success" },
  return: { label: "أُعيد للاستكمال", tone: "error" },
  comment: null
};

export default function P2PThread({ report, onChanged, number }) {
  const ui = useUi();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const comments = report?.comments || [];

  if (!report || (!comments.length && !report.canComment)) return null;

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await p2pApi(`/reports/${report.guid}/comments`, { method: "POST", body: { body: text.trim() } });
      setText("");
      await onChanged?.();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2.2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        {number ? <Box sx={ui.badge}>{number}</Box> : <ForumRoundedIcon sx={{ color: ui.greenText }} />}
        <Box sx={{ flex: 1 }}>
          <Typography sx={ui.sectionTitle}>المحادثة مع {report.isOwner ? "الإدارة" : "الموظف"}</Typography>
          <Typography variant="caption" color="text.secondary">
            الردود والملاحظات بين الموظف وإدارة التعاقدات، مع سجل الإرسال والمراجعة
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.2} sx={{ mb: report.canComment ? 1.5 : 0 }}>
        {!comments.length ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 1.5 }}>لا توجد ردود بعد</Typography>
        ) : null}
        {comments.map((c) => {
          const kind = KIND[c.kind];
          const tint = c.fromManager ? "#1565c0" : "#057546";
          return (
            <Box key={c.id} sx={{ display: "flex", justifyContent: c.isMine ? "flex-start" : "flex-end" }}>
              <Box
                sx={{
                  maxWidth: { xs: "92%", md: "72%" },
                  p: 1.4,
                  borderRadius: 2.5,
                  bgcolor: alpha(tint, ui.dark ? 0.16 : 0.07),
                  border: `1px solid ${alpha(tint, ui.dark ? 0.4 : 0.22)}`
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: c.body ? 0.6 : 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13.5 }}>
                    {c.authorName || "—"}
                    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>
                      {" "}({c.fromManager ? "الإدارة" : "الموظف"})
                    </Typography>
                  </Typography>
                  {kind ? <P2PToneChip size="small" label={kind.label} tone={kind.tone} /> : null}
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{c.createdAt}</Typography>
                </Stack>
                {c.body ? <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14.5 }}>{c.body}</Typography> : null}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {report.canComment ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-end" }}>
          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={report.isOwner ? "اكتب ردك أو استفسارك للإدارة..." : "اكتب ردك أو ملاحظتك للموظف..."}
            multiline
            minRows={1}
            maxRows={5}
            fullWidth
            inputProps={{ maxLength: 2000, "aria-label": "نص الرد" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
            }}
          />
          <Button
            variant="contained"
            onClick={send}
            disabled={sending || !text.trim()}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
            sx={{ ...ui.primaryBtn, minWidth: 120, height: 40 }}
          >
            إرسال
          </Button>
        </Stack>
      ) : null}
    </Paper>
  );
}
