// التنبيهات والإعلانات غير المقروءة للمستخدم — بتظهر في أي صفحة (متركّبة في NavigationShell).
// واحد ورا التاني بالأولوية؛ زر الاطلاع بيسجّل إنه شافه فمبيظهرش تاني، والإغلاق بس بيأجّله للصفحة الجاية.
import React, { useEffect, useState } from "react";
import AnnouncementDialog from "./AnnouncementDialog";
import { SSTLI_API_URL } from "../../config/apiUrls";

const API_BASE_URL = SSTLI_API_URL;

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "").trim();
  } catch {
    return "";
  }
};

// اللي اتقفل من غير اطلاع ميرجعش يظهر في نفس الجلسة إلا لما تتفتح صفحة جديدة بعد دقيقة
const snoozed = new Map();

export default function GlobalAnnouncements() {
  const [queue, setQueue] = useState([]);
  const [acknowledging, setAcknowledging] = useState(false);
  const userGuid = getUserGuid();

  useEffect(() => {
    if (!userGuid) return undefined;
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/announcements/unread?${new URLSearchParams({ userGuid })}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((r) => {
        if (cancelled) return;
        const now = Date.now();
        setQueue((r.items || []).filter((a) => !(snoozed.get(a.alertGuid) > now)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userGuid]);

  const current = queue[0];
  const next = () => setQueue((q) => q.slice(1));

  const acknowledge = async () => {
    if (!current) return;
    setAcknowledging(true);
    try {
      await fetch(`${API_BASE_URL}/api/announcements/${current.alertGuid}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid })
      });
    } catch {
      // لو الحفظ فشل هيظهر تاني المرة الجاية، وده أحسن من إنه يضيع
    } finally {
      setAcknowledging(false);
      next();
    }
  };

  const close = () => {
    if (current) snoozed.set(current.alertGuid, Date.now() + 60 * 1000);
    next();
  };

  return (
    <AnnouncementDialog
      key={current?.alertGuid}
      alert={current}
      open={Boolean(current)}
      acknowledging={acknowledging}
      onAcknowledge={acknowledge}
      onClose={close}
    />
  );
}
