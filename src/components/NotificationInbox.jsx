import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

/*
  صندوق الإشعارات (جرس السايدبار): تصميم صندوق وارد —
  تبويب الكل/غير المقروء، تجميع حسب اليوم، أيقونة ولون لكل نوع، المنفّذ والوقت النسبي.
*/

const primary = "#057546";

const HR_STYLES = {
  EMPLOYEE_CREATED: { icon: PersonAddAlt1RoundedIcon, color: "#057546", label: "مستخدم جديد" },
  BRANCH_TRANSFER: { icon: SwapHorizRoundedIcon, color: "#1d4ed8", label: "نقل بين الفروع" },
  JOB_CHANGE: { icon: WorkRoundedIcon, color: "#7c3aed", label: "المسمى الوظيفي" },
  STATUS_CHANGE: { icon: PowerSettingsNewRoundedIcon, color: "#ae1e21", label: "إيقاف / تنشيط" },
  TRAINER_CHANGE: { icon: SchoolRoundedIcon, color: "#c2410c", label: "المدربين" },
  DEPARTMENT_CHANGE: { icon: AccountTreeRoundedIcon, color: "#0f766e", label: "الأقسام" },
  ESTABLISHMENT_CHANGE: { icon: ApartmentRoundedIcon, color: "#92400e", label: "المنشآت" },
  DATA_UPDATE: { icon: EditNoteRoundedIcon, color: "#475569", label: "تعديل بيانات" },
  PERMISSION_CHANGE: { icon: AdminPanelSettingsRoundedIcon, color: "#be185d", label: "الصلاحيات" }
};

const styleOf = (type = "") => {
  if (type.startsWith("HREV_")) return HR_STYLES[type.slice(5)] || HR_STYLES.DATA_UPDATE;
  if (type.startsWith("TASK_")) return { icon: AssignmentRoundedIcon, color: "#2563eb", label: "المهام" };
  if (type.startsWith("ASSET_")) return { icon: Inventory2RoundedIcon, color: "#b45309", label: "الأصول" };
  if (type === "P2P_appointment") return { icon: EventRoundedIcon, color: "#0e7490", label: "موعد" };
  if (type.startsWith("P2P_")) return { icon: HandshakeRoundedIcon, color: "#0e7490", label: "التعاقدات" };
  if (type === "APPROVAL") return { icon: PendingActionsRoundedIcon, color: "#d97706", label: "بانتظار موافقتك" };
  if (type === "LEAVE_TRACKING") return { icon: EventAvailableRoundedIcon, color: "#057546", label: "الإجازات" };
  return { icon: NotificationsRoundedIcon, color: "#64748b", label: "إشعار" };
};

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const dayLabel = (value) => {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return "اليوم";
  if (dayKey(d) === dayKey(yesterday)) return "أمس";
  return d.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long" });
};

const relativeTime = (value) => {
  const d = new Date(value);
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && dayKey(d) === dayKey(new Date())) return `منذ ${hours} س`;
  return d.toLocaleTimeString("ar-SA-u-ca-gregory-nu-latn", { hour: "2-digit", minute: "2-digit" });
};

export default function NotificationInbox({
  items,
  loading,
  unreadCount,
  muted,
  onToggleMute,
  onMarkAll,
  onOpenItem,
  onNavigate
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [tab, setTab] = useState("all");

  const border = isDark ? alpha("#67C99D", 0.35) : "rgba(5,117,70,.12)";
  const cardBg = isDark ? theme.palette.background.paper : "#ffffff";

  const visible = useMemo(
    () => (tab === "unread" ? items.filter((i) => !i.isRead) : items),
    [items, tab]
  );

  const groups = useMemo(() => {
    const result = [];
    visible.forEach((item) => {
      const key = item.eventAt ? dayKey(new Date(item.eventAt)) : "none";
      const last = result[result.length - 1];
      if (last && last.key === key) last.items.push(item);
      else result.push({ key, label: item.eventAt ? dayLabel(item.eventAt) : "", items: [item] });
    });
    return result;
  }, [visible]);

  const hasHrEvents = items.some((i) => String(i.notificationType || "").startsWith("HREV_"));

  const tabButton = (key, label) => {
    const active = tab === key;
    return (
      <Box
        component="button"
        type="button"
        onClick={() => setTab(key)}
        sx={{
          border: 0,
          cursor: "pointer",
          px: 1.4,
          py: 0.5,
          borderRadius: 99,
          fontFamily: "Cairo",
          fontSize: 12.5,
          fontWeight: 900,
          color: active ? primary : "rgba(255,255,255,.92)",
          backgroundColor: active ? "#ffffff" : "rgba(255,255,255,.14)",
          transition: "background-color .15s",
          "&:hover": { backgroundColor: active ? "#ffffff" : "rgba(255,255,255,.24)" }
        }}
      >
        {label}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", maxHeight: "inherit", direction: "rtl", fontFamily: "Cairo" }}>
      {/* الرأس */}
      <Box
        sx={{
          px: 1.6,
          pt: 1.4,
          pb: 1.2,
          color: "#fff",
          background: "linear-gradient(135deg, #057546 0%, #034d31 100%)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(255,255,255,.16)"
            }}
          >
            <InboxRoundedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ fontWeight: 950, fontSize: 16, lineHeight: 1.3 }}>صندوق الوارد</Box>
            <Box sx={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>
              {unreadCount ? `${unreadCount} إشعار غير مقروء` : "لا جديد — كل الإشعارات مقروءة"}
            </Box>
          </Box>
          <Tooltip title={muted ? "تشغيل صوت التنبيه" : "كتم صوت التنبيه"}>
            <IconButton size="small" onClick={onToggleMute} sx={{ color: "#fff" }}>
              {muted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="تعليم الكل كمقروء">
            <span>
              <IconButton size="small" onClick={onMarkAll} disabled={!unreadCount} sx={{ color: "#fff", "&.Mui-disabled": { color: "rgba(255,255,255,.4)" } }}>
                <DoneAllRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 0.8, mt: 1.2 }}>
          {tabButton("all", "الكل")}
          {tabButton("unread", unreadCount ? `غير المقروء (${unreadCount})` : "غير المقروء")}
        </Box>
      </Box>

      {/* القائمة */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", backgroundColor: isDark ? theme.palette.background.default : "#f6faf8" }}>
        {loading && items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={24} sx={{ color: primary }} />
          </Box>
        ) : visible.length === 0 ? (
          <Box sx={{ py: 5, px: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: alpha(primary, 0.1),
                color: primary
              }}
            >
              <InboxRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
            <Box sx={{ mt: 1.2, fontWeight: 900, fontSize: 14 }}>
              {tab === "unread" ? "لا توجد إشعارات غير مقروءة" : "صندوقك فارغ"}
            </Box>
            <Box sx={{ mt: 0.4, fontSize: 12, color: "text.secondary" }}>ستظهر هنا الإشعارات الجديدة فور وصولها</Box>
          </Box>
        ) : (
          groups.map((group) => (
            <Box key={group.key}>
              {group.label && (
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    px: 1.6,
                    py: 0.6,
                    fontSize: 11.5,
                    fontWeight: 900,
                    color: "text.secondary",
                    backgroundColor: isDark ? theme.palette.background.default : "#f6faf8",
                    borderBottom: `1px solid ${border}`
                  }}
                >
                  {group.label}
                </Box>
              )}
              {group.items.map((item) => {
                const s = styleOf(String(item.notificationType || ""));
                const Icon = s.icon;
                return (
                  <Box
                    key={item.notificationKey}
                    onClick={() => onOpenItem(item)}
                    sx={{
                      display: "flex",
                      gap: 1.1,
                      px: 1.6,
                      py: 1.1,
                      cursor: "pointer",
                      position: "relative",
                      backgroundColor: item.isRead ? cardBg : alpha(s.color, isDark ? 0.12 : 0.05),
                      borderBottom: `1px solid ${border}`,
                      transition: "background-color .15s",
                      "&:hover": { backgroundColor: alpha(s.color, isDark ? 0.18 : 0.09) },
                      "&::before": item.isRead
                        ? undefined
                        : {
                            content: '""',
                            position: "absolute",
                            insetInlineStart: 0,
                            top: 10,
                            bottom: 10,
                            width: 3,
                            borderRadius: 3,
                            backgroundColor: s.color
                          }
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        borderRadius: "11px",
                        display: "grid",
                        placeItems: "center",
                        color: s.color,
                        backgroundColor: alpha(s.color, isDark ? 0.24 : 0.12)
                      }}
                    >
                      <Icon sx={{ fontSize: 21 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 13.5,
                            fontWeight: item.isRead ? 800 : 950,
                            color: isDark ? theme.palette.text.primary : "#14231c",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {item.title}
                        </Box>
                        {item.eventAt && (
                          <Box sx={{ fontSize: 11, color: "text.secondary", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {relativeTime(item.eventAt)}
                          </Box>
                        )}
                        {!item.isRead && (
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
                        )}
                      </Box>
                      <Box
                        sx={{
                          mt: 0.3,
                          fontSize: 12.5,
                          lineHeight: 1.65,
                          color: "text.secondary",
                          fontWeight: 600,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {item.message}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.6, flexWrap: "wrap" }}>
                        <Box
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            px: 0.8,
                            py: 0.1,
                            borderRadius: 99,
                            color: s.color,
                            backgroundColor: alpha(s.color, isDark ? 0.2 : 0.1)
                          }}
                        >
                          {s.label}
                        </Box>
                        {item.actorName && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, fontSize: 11, fontWeight: 700, color: "text.secondary" }}>
                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                            {item.actorName}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* التذييل */}
      {hasHrEvents && (
        <Box sx={{ p: 1, borderTop: `1px solid ${border}`, backgroundColor: cardBg }}>
          <Button
            fullWidth
            onClick={() => onNavigate("/dashboard/hr-inbox")}
            endIcon={<ArrowBackRoundedIcon />}
            sx={{ fontFamily: "Cairo", fontWeight: 900, color: primary, borderRadius: 2 }}
          >
            فتح صندوق عمليات الموظفين
          </Button>
        </Box>
      )}
    </Box>
  );
}
