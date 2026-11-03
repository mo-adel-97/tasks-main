// الاسم الحركي للمستخدم (HR_UserNickname) — بيظهر بين قوسين جنب الاسم الكامل.
// الكاش مشترك بين كل الشاشات، وبيتحدث بعد أي تعديل.
import { useEffect, useState } from "react";
import { SSTLI_API_URL } from "../config/apiUrls";

const norm = (v) => String(v || "").trim().toLowerCase();

let state = { byGuid: new Map(), byName: new Map() };
let loading = null;
const listeners = new Set();

const publish = (items) => {
  const byGuid = new Map();
  const byName = new Map();
  (items || []).forEach((item) => {
    if (!item?.nickname) return;
    byGuid.set(norm(item.userGuid), item.nickname);
    if (item.fullName) byName.set(norm(item.fullName), item.nickname);
  });
  state = { byGuid, byName };
  listeners.forEach((fn) => fn(state));
};

export const loadNicknames = (force = false) => {
  if (loading && !force) return loading;
  loading = fetch(`${SSTLI_API_URL}/api/hr/nicknames`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((json) => publish(json?.items))
    .catch(() => {});
  return loading;
};

export const getNickname = (userGuid, fullName) =>
  (userGuid && state.byGuid.get(norm(userGuid))) || (fullName && state.byName.get(norm(fullName))) || "";

// "الاسم (الاسم الحركي)"
export const withNickname = (fullName, userGuid) => {
  const nick = getNickname(userGuid, fullName);
  return nick ? `${fullName || ""} (${nick})` : fullName || "";
};

export const saveNickname = async (userGuid, nickname, changedByUserGuid) => {
  const response = await fetch(`${SSTLI_API_URL}/api/hr/nicknames/${encodeURIComponent(userGuid)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: nickname || "", changedByUserGuid: changedByUserGuid || null })
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || "تعذر حفظ الاسم الحركي");
  await loadNicknames(true);
  return json;
};

// بيعيد رسم الشاشة لما الأسماء الحركية تتحمل أو تتغير
export const useNicknames = () => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fn = () => setVersion((v) => v + 1);
    listeners.add(fn);
    loadNicknames();
    return () => listeners.delete(fn);
  }, []);
  return { withNickname, getNickname, version };
};
