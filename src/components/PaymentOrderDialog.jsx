import { adaptiveInlineStyle } from '../config/themeColors';
import { printWhenReady } from '../utils/printReady';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const fireSweetAlert = (options = {}) =>
  Swal.fire({
    direction: "rtl",
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "sstli-swal-popup",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text",
      confirmButton: "sstli-swal-confirm",
      cancelButton: "sstli-swal-cancel",
      input: "sstli-swal-input"
    },
    didOpen: () => {
      const container = document.querySelector(".swal2-container");
      if (container) {
        container.style.zIndex = "20000";
      }

      const popup = document.querySelector(".sstli-swal-popup");
      if (popup) {
        popup.style.borderRadius = "18px";
        popup.style.fontFamily = "Tahoma, Arial, sans-serif";
      }

      const confirmButton = document.querySelector(".sstli-swal-confirm");
      if (confirmButton) {
        confirmButton.style.background = "#057546";
        confirmButton.style.color = "#fff";
        confirmButton.style.border = "0";
        confirmButton.style.borderRadius = "10px";
        confirmButton.style.padding = "10px 22px";
        confirmButton.style.margin = "0 5px";
        confirmButton.style.fontWeight = "900";
        confirmButton.style.cursor = "pointer";
      }

      const cancelButton = document.querySelector(".sstli-swal-cancel");
      if (cancelButton) {
        cancelButton.style.background = "#eef2f0";
        cancelButton.style.color = "#1f2d3d";
        cancelButton.style.border = "1px solid #d3ddd8";
        cancelButton.style.borderRadius = "10px";
        cancelButton.style.padding = "10px 22px";
        cancelButton.style.margin = "0 5px";
        cancelButton.style.fontWeight = "900";
        cancelButton.style.cursor = "pointer";
      }
    },
    ...options
  });


const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatDate = (value) => {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "en-GB-u-ca-gregory",
    {
      calendar: "gregory",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(d);
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const InfoField = ({
  label,
  value,
  span = 1,
  compact = false
}) => (
  <Paper
    elevation={0}
    sx={{
      gridColumn: `span ${span}`,
      minWidth: 0,
      p: compact ? 0.7 : 1,
      borderRadius: compact ? 1.4 : 1.8,
      bgcolor: "#f8fbf9",
      border: "1px solid #e2ebe6"
    }}
  >
    <Typography
      sx={{
        color: primaryDark,
        fontWeight: 950,
        fontSize: compact ? "0.75rem" : "0.75rem",
        mb: 0.25,
        lineHeight: 1.2
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        color: "#1f2d3d",
        fontWeight: 900,
        fontSize: compact ? "0.75rem" : "0.83rem",
        lineHeight: 1.45,
        minHeight: compact ? 19 : 24,
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap"
      }}
    >
      {value || "-"}
    </Typography>
  </Paper>
);

export default function PaymentOrderDialog({
  open,
  onClose,
  order,
  apiBaseUrl,
  userGuid,
  onConfirmed,
  onUpdated,
  onOpenInvoice,
  onOpenStatement,
  onOpenOperations,
  cashBoxOptions = []
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const isCompact = isPhone || isTablet;
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editReference, setEditReference] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCashBoxGuid, setEditCashBoxGuid] = useState("");
  const [editCostCenterGuid, setEditCostCenterGuid] = useState("");
  const [allCashBoxOptions, setAllCashBoxOptions] = useState([]);
  const [cashBoxesLoading, setCashBoxesLoading] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const printFrameRef = useRef(null);

  const orderGuid = order?.orderGuid || order?.guid || order?.Guid || "";

  useEffect(() => {
    if (!open || !orderGuid) return undefined;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setData(null);

        const response = await fetch(
          `${apiBaseUrl}/api/payment-requests/${encodeURIComponent(orderGuid)}?userGuid=${encodeURIComponent(userGuid)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.error || result?.message || "تعذر تحميل طلب السداد");
        }
        const loadedData = result?.data || null;

        setData(loadedData);
        setEditMode(false);
        setEditReference(
          loadedData?.referenceNumber || ""
        );
        setEditPaymentDate(
          toDateInputValue(
            loadedData?.paymentDate
          )
        );
        setEditNotes(
          loadedData?.notes || ""
        );
        setEditCashBoxGuid(loadedData?.cashBoxGuid || "");
        setEditCostCenterGuid(loadedData?.costCenterGuid || "");
        setEditItems(
          Array.isArray(loadedData?.items)
            ? loadedData.items.map((item) => ({
                ...item,
                cost: Number(item?.cost || 0),
                tax: Number(item?.tax || 0),
                subTotal: Number(item?.subTotal || 0)
              }))
            : []
        );
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "حدث خطأ أثناء تحميل طلب السداد");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [open, orderGuid, apiBaseUrl, userGuid]);

  const items = useMemo(
    () =>
      editMode
        ? editItems
        : (Array.isArray(data?.items) ? data.items : []),
    [data, editMode, editItems]
  );
  const canConfirm = Number(data?.status ?? order?.status ?? -1) === 0 && order?.isUse !== false;

  const canEdit =
    [0, 1].includes(
      Number(data?.status ?? order?.status ?? -1)
    );

  const editableTotals = useMemo(
    () =>
      editItems.reduce(
        (acc, item) => {
          acc.total += Number(item?.cost || 0);
          acc.tax += Number(item?.tax || 0);
          acc.subTotal += Number(item?.subTotal || 0);
          return acc;
        },
        {
          total: 0,
          tax: 0,
          subTotal: 0
        }
      ),
    [editItems]
  );

  const copyBillCode = async () => {
    const billCode =
      String(
        data?.billCode ||
        order?.billCode ||
        ""
      ).trim();

    if (!billCode) {
      await fireSweetAlert({
        icon: "info",
        title: "رقم الفاتورة غير موجود",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(
        billCode
      );

      await fireSweetAlert({
        icon: "success",
        title: "تم نسخ رقم الفاتورة",
        text: billCode,
        timer: 1200,
        showConfirmButton: false
      });
    } catch {
      await fireSweetAlert({
        icon: "info",
        title: "رقم الفاتورة",
        text: billCode,
        confirmButtonText: "حسنًا"
      });
    }
  };

  const loadAllCashBoxes = async () => {
    if (!userGuid) return [];

    try {
      setCashBoxesLoading(true);

      const response = await fetch(
        `${apiBaseUrl}/api/payment-requests/cash-boxes?userGuid=${encodeURIComponent(
          userGuid
        )}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحميل قائمة البنوك والخزائن"
        );
      }

      const options =
        Array.isArray(result?.data)
          ? result.data
          : [];

      setAllCashBoxOptions(options);
      return options;
    } catch (e) {
      setAllCashBoxOptions([]);

      await fireSweetAlert({
        icon: "error",
        title: "تعذر تحميل قائمة البنوك",
        text:
          e?.message ||
          "تعذر تحميل قائمة البنوك والخزائن",
        confirmButtonText: "حسنًا"
      });

      return [];
    } finally {
      setCashBoxesLoading(false);
    }
  };

  const startEdit = async () => {
    if (!canEdit) {
      await fireSweetAlert({
        icon: "warning",
        title: "لا يمكن التعديل",
        text: "لا يمكن تعديل طلب مكرر أو ملغي.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    await loadAllCashBoxes();

    setEditReference(
      data?.referenceNumber || ""
    );
    setEditPaymentDate(
      toDateInputValue(
        data?.paymentDate
      )
    );
    setEditNotes(
      data?.notes || ""
    );
    setEditCashBoxGuid(data?.cashBoxGuid || "");
    setEditCostCenterGuid(data?.costCenterGuid || "");
    setEditItems(
      Array.isArray(data?.items)
        ? data.items.map((item) => ({
            ...item,
            cost: Number(item?.cost || 0),
            tax: Number(item?.tax || 0),
            subTotal: Number(item?.subTotal || 0)
          }))
        : []
    );
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditReference(
      data?.referenceNumber || ""
    );
    setEditPaymentDate(
      toDateInputValue(
        data?.paymentDate
      )
    );
    setEditNotes(
      data?.notes || ""
    );
    setEditCashBoxGuid(data?.cashBoxGuid || "");
    setEditCostCenterGuid(data?.costCenterGuid || "");
  };

  const changeEditItem = (
    index,
    field,
    value
  ) => {
    setEditItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                Number(value || 0)
            }
          : item
      )
    );
  };

  const saveEdit = async () => {
    if (!orderGuid || savingEdit) return;

    if (!String(editReference || "").trim()) {
      await fireSweetAlert({
        icon: "warning",
        title: "رقم المرجع مطلوب",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    if (!editPaymentDate) {
      await fireSweetAlert({
        icon: "warning",
        title: "تاريخ الحوالة مطلوب",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    if (!String(editCashBoxGuid || "").trim()) {
      await fireSweetAlert({
        icon: "warning",
        title: "الخزينة / البنك مطلوب",
        text: "برجاء اختيار الخزينة أو البنك قبل الحفظ.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const availableCashBoxes =
      allCashBoxOptions.length
        ? allCashBoxOptions
        : cashBoxOptions;

    const selectedCashBox =
      availableCashBoxes.find(
        (option) =>
          String(option?.cashBoxGuid || "").trim() ===
          String(editCashBoxGuid || "").trim()
      );

    if (
      !selectedCashBox ||
      !String(selectedCashBox?.costCenterGuid || "").trim()
    ) {
      await fireSweetAlert({
        icon: "error",
        title: "بيانات البنك غير مكتملة",
        text:
          "البنك المختار لا يحتوي على مركز تكلفة صحيح. لم يتم حفظ أي تعديل.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const safeCostCenterGuid =
      String(selectedCashBox.costCenterGuid).trim();

    if (!editItems.length) {
      await fireSweetAlert({
        icon: "warning",
        title: "لا توجد بنود في الطلب",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    if (
      editItems.some(
        (item) =>
          Number(item?.subTotal || 0) <= 0
      )
    ) {
      await fireSweetAlert({
        icon: "warning",
        title: "يوجد مبلغ غير صحيح",
        text: "الصافي يجب أن يكون أكبر من صفر.",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const reasonResult =
      await fireSweetAlert({
        icon: "question",
        title: "حفظ تعديل طلب السداد",
        input: "textarea",
        inputLabel: "سبب التعديل",
        inputPlaceholder:
          "اكتب سبب التعديل هنا...",
        inputAttributes: {
          dir: "rtl",
          rows: "4"
        },
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        focusConfirm: false,
        focusCancel: false,
        returnFocus: false,
        allowOutsideClick: false,
        inputValidator: (value) =>
          String(value || "").trim()
            ? undefined
            : "برجاء كتابة سبب التعديل",
        didOpen: () => {
          const container = document.querySelector(".swal2-container");
          if (container) {
            container.style.zIndex = "2147483647";
            container.style.pointerEvents = "auto";
          }

          const popup = Swal.getPopup();
          if (popup) {
            popup.style.pointerEvents = "auto";
          }

          const input = Swal.getInput();
          if (input) {
            input.removeAttribute("readonly");
            input.removeAttribute("disabled");
            input.style.pointerEvents = "auto";
            input.style.userSelect = "text";
            input.style.webkitUserSelect = "text";
            input.style.cursor = "text";
            input.style.position = "relative";
            input.style.zIndex = "5";
            input.style.direction = "rtl";
            input.style.textAlign = "right";
            input.style.minHeight = "130px";

            ["mousedown", "click", "keydown", "keyup", "keypress"].forEach((eventName) => {
              input.addEventListener(eventName, (event) => event.stopPropagation(), true);
            });

            setTimeout(() => input.focus(), 80);
          }
        }
      });

    if (!reasonResult.isConfirmed) {
      return;
    }

    const reason =
      String(
        reasonResult.value || ""
      ).trim();

    try {
      setSavingEdit(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/payment-requests/${encodeURIComponent(
          orderGuid
        )}/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            reason,
            referenceNumber:
              String(editReference).trim(),
            paymentDate:
              `${editPaymentDate}T00:00:00`,
            notes: editNotes || "",
            cashBoxGuid:
              editCashBoxGuid || data?.cashBoxGuid || "",
            costCenterGuid:
              safeCostCenterGuid,
            items: editItems.map((item) => ({
              diplomGuid:
                item?.diplomGuid || "",
              diplomType:
                String(
                  item?.type ??
                  item?.diplomType ??
                  ""
                ),
              cost:
                Number(item?.cost || 0),
              tax:
                Number(item?.tax || 0),
              subTotal:
                Number(item?.subTotal || 0)
            }))
          })
        }
      );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تعديل طلب السداد"
        );
      }

      const refreshedResponse =
        await fetch(
          `${apiBaseUrl}/api/payment-requests/${encodeURIComponent(
            orderGuid
          )}?userGuid=${encodeURIComponent(
            userGuid
          )}`,
          {
            cache: "no-store"
          }
        );

      const refreshedResult =
        await refreshedResponse
          .json()
          .catch(() => null);

      if (
        refreshedResponse.ok &&
        refreshedResult?.data
      ) {
        setData(refreshedResult.data);
        setEditReference(
          refreshedResult.data
            ?.referenceNumber || ""
        );
        setEditPaymentDate(
          toDateInputValue(
            refreshedResult.data
              ?.paymentDate
          )
        );
        setEditNotes(
          refreshedResult.data?.notes || ""
        );
        setEditCashBoxGuid(refreshedResult.data?.cashBoxGuid || "");
        setEditCostCenterGuid(refreshedResult.data?.costCenterGuid || "");
        setEditItems(
          Array.isArray(
            refreshedResult.data?.items
          )
            ? refreshedResult.data.items.map(
                (item) => ({
                  ...item,
                  cost: Number(
                    item?.cost || 0
                  ),
                  tax: Number(
                    item?.tax || 0
                  ),
                  subTotal: Number(
                    item?.subTotal || 0
                  )
                })
              )
            : []
        );
      }

      setEditMode(false);

      await onUpdated?.(
        result?.data || null
      );

      await fireSweetAlert({
        icon: "success",
        title: "تم التعديل",
        text:
          result?.message ||
          "تم تعديل طلب السداد بنجاح",
        confirmButtonText: "حسنًا"
      });
    } catch (e) {
      const message =
        e?.message ||
        "تعذر تعديل طلب السداد";

      setError(message);

      await fireSweetAlert({
        icon: "error",
        title: "تعذر التعديل",
        text: message,
        confirmButtonText: "حسنًا"
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const attachmentUrl = useMemo(() => {
    const nationalId = data?.nationalId || order?.nationalId || "";
    const code = data?.code || order?.code || "";
    if (!nationalId || !code) return "";
    return `https://sstli.com/arc/api/view.php?nationalId=${encodeURIComponent(nationalId)}&billCode=${encodeURIComponent(code)}`;
  }, [data, order]);

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  const confirmOrder = async () => {
    if (!orderGuid || confirming) return;

    if (!canConfirm) {
      await fireSweetAlert({
        icon: "warning",
        title: "لا يمكن التأكيد",
        text: "هذا الطلب لا يمكن تأكيده في حالته الحالية",
        confirmButtonText: "حسنًا"
      });
      return;
    }

    const confirmation = await fireSweetAlert({
      icon: "question",
      title: "تأكيد التحويل",
      html: `
        <div style="direction:rtl;text-align:center;line-height:1.9">
          هل تريد تأكيد طلب السداد رقم
          <b style="color:#057546">${data?.code || order?.code || ""}</b>؟
          <br/>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "نعم، تأكيد التحويل",
      cancelButtonText: "إلغاء",
      focusCancel: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      setConfirming(true);
      setError("");

      fireSweetAlert({
        title: "جاري تأكيد التحويل...",
        html: `
          <div style="direction:rtl;text-align:center">
            جاري التحقق من العمليات المحاسبية ثم إنشاء الفاتورة وقيد السداد
            <br/>
            <small style="color:#666">برجاء عدم إغلاق الصفحة</small>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "20000";
          Swal.showLoading();
        }
      });

      const response = await fetch(
        `${apiBaseUrl}/api/payment-requests/${encodeURIComponent(orderGuid)}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid })
        }
      );

      const result = await response.json().catch(() => null);

      Swal.close();

      if (!response.ok) {
        if (
          response.status === 409 &&
          (result?.busy || result?.code === "ACCOUNTING_BUSY")
        ) {
          await fireSweetAlert({
            icon: "info",
            title: "جاري تنفيذ قيد آخر",
            html: `
              <div style="direction:rtl;line-height:1.9;text-align:center">
                ${result?.message || "يوجد ترحيل محاسبي آخر يتم تنفيذه حاليًا."}
                <br/>
                <small style="color:#666">
                  لم يبدأ تأكيد طلب السداد ولم يتم إنشاء أي فاتورة أو قيد.
                </small>
              </div>
            `,
            confirmButtonText: "حسنًا"
          });
          return;
        }

        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تأكيد التحويل"
        );
      }

      const updated = {
        ...data,
        status: 1,
        isUse: true,
        billGuid:
          result?.data?.billGuid ||
          data?.billGuid ||
          "",
        billCode:
          result?.data?.billCode ||
          data?.billCode ||
          ""
      };

      setData(updated);

      await onConfirmed?.(
        result?.data || null
      );

      const confirmedBillCode =
        result?.data?.billCode || "";

      await fireSweetAlert({
        icon: result?.warning ? "warning" : "success",
        title: result?.warning ? "تم التأكيد مع تنبيه" : "تم بنجاح",
        html: `
          <div style="direction:rtl;line-height:1.9;text-align:center">
            ${result?.message || "تم تأكيد التحويل بنجاح"}

            ${
              confirmedBillCode
                ? `
                  <div style="margin-top:12px">
                    <div style="font-size:12px;color:#66756e">
                      رقم الفاتورة
                    </div>

                    <div
                      style="
                        color:#057546;
                        font-size:22px;
                        font-weight:1000;
                        direction:ltr;
                      "
                    >
                      ${confirmedBillCode}
                    </div>

                    <button
                      type="button"
                      id="dialog-copy-bill-code"
                      style="
                        margin-top:7px;
                        padding:6px 14px;
                        border:1px solid #057546;
                        color:#057546;
                        background:#fff;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:900;
                      "
                    >
                      نسخ رقم الفاتورة
                    </button>
                  </div>
                `
                : ""
            }

            ${
              result?.warning
                ? `<br/><small style="color:#a15c00">${result.warning}</small>`
                : ""
            }
          </div>
        `,
        confirmButtonText: "حسنًا",
        didOpen: () => {
          const container =
            document.querySelector(
              ".swal2-container"
            );

          if (container) {
            container.style.zIndex = "20000";
          }

          const copyButton =
            document.getElementById(
              "dialog-copy-bill-code"
            );

          if (
            copyButton &&
            confirmedBillCode
          ) {
            copyButton.onclick =
              async () => {
                try {
                  await navigator.clipboard.writeText(
                    String(
                      confirmedBillCode
                    )
                  );

                  copyButton.textContent =
                    "تم النسخ ✓";

                  copyButton.style.background =
                    "#057546";

                  copyButton.style.color =
                    "#fff";
                } catch {
                  copyButton.textContent =
                    "حدد الرقم وانسخه يدويًا";
                }
              };
          }
        }
      });
    } catch (e) {
      Swal.close();

      const message =
        e?.message ||
        "فشل تأكيد التحويل وتم التراجع عن العملية";

      setError(message);

      await fireSweetAlert({
        icon: "error",
        title: "فشل تأكيد التحويل",
        html: `
          <div style="direction:rtl;line-height:1.8">
            ${message}
            <br/>
            <small style="color:#666">
              لم يتم اعتماد العملية إذا فشل التنفيذ المحاسبي.
            </small>
          </div>
        `,
        confirmButtonText: "حسنًا"
      });
    } finally {
      setConfirming(false);
    }
  };

  const buildPrintHtml = () => {
    const rows = items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.statement)}</td>
            <td>${escapeHtml(item.unit || "PCS")}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${money(item.cost)}</td>
            <td>${escapeHtml(item.taxRate)}</td>
            <td>${money(item.tax)}</td>
            <td>${money(item.subTotal)}</td>
          </tr>`
      )
      .join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>طلب سداد ${escapeHtml(data?.code)}</title>
<style>
@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Arial,Tahoma,sans-serif;margin:0;color:#111}.page{border:1px solid #ccc;border-radius:12px;padding:20px}
h1{text-align:center;margin:0 0 18px;font-size:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px 20px;margin-bottom:18px}
.f{display:grid;grid-template-columns:120px 1fr;gap:8px}.l{font-weight:900}.v{background:#f4f5f5;padding:7px 9px;border-radius:4px;min-height:30px}
table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #9aa;padding:8px;text-align:center}th{background:#dce9f6;font-weight:900}tbody tr{background:#fff3cd}
.notes{margin-top:16px;display:grid;grid-template-columns:120px 1fr;gap:8px}.totals{width:280px;margin-top:18px;margin-right:auto}.totals div{display:grid;grid-template-columns:1fr 1fr;padding:7px;border-bottom:1px solid #ddd}.totals b{color:red;font-size:18px}
</style>
</head>
<body><div class="page"><h1>طلب سداد</h1>
<div class="grid">
<div class="f"><div class="l">الكود</div><div class="v">${escapeHtml(data?.code)}</div></div>
<div class="f"><div class="l">التاريخ</div><div class="v">${escapeHtml(formatDate(data?.orderDate, true))}</div></div>
<div class="f"><div class="l">اسم الطالب</div><div class="v">${escapeHtml(data?.studentName)}</div></div>
<div class="f"><div class="l">رقم الهوية</div><div class="v">${escapeHtml(data?.nationalId)}</div></div>
<div class="f"><div class="l">رقم الجوال</div><div class="v">${escapeHtml(data?.studentTel)}</div></div>
<div class="f"><div class="l">الفرع</div><div class="v">${escapeHtml(data?.branchName)}</div></div>
<div class="f"><div class="l">الخزينة/البنك</div><div class="v">${escapeHtml(data?.cashBoxName)}</div></div>
<div class="f"><div class="l">رقم المرجع</div><div class="v">${escapeHtml(data?.referenceNumber)}</div></div>
<div class="f"><div class="l">تاريخ الحوالة</div><div class="v">${escapeHtml(formatDate(data?.paymentDate))}</div></div>
<div class="f"><div class="l">المستند</div><div class="v">${escapeHtml(data?.documentName)}</div></div>
</div>
<table><thead><tr><th>البيان</th><th>الوحدة</th><th>الكمية</th><th>التكلفة</th><th>% الضريبة</th><th>الضريبة</th><th>الصافي</th></tr></thead><tbody>${rows}</tbody></table>
<div class="notes"><div class="l">ملاحظات</div><div class="v">${escapeHtml(data?.notes)}</div></div>
<div class="totals"><div><span>الإجمالي</span><b>${money(data?.total)}</b></div><div><span>الضريبة</span><b>${money(data?.tax)}</b></div><div><span>الصافي</span><b>${money(data?.subTotal)}</b></div></div>
</div></body></html>`;
  };

  const printOrder = () => {
    if (!data) return;
    const iframe = printFrameRef.current;
    if (!iframe) return;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(buildPrintHtml());
    doc.close();
    printWhenReady(iframe.contentWindow);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={confirming ? undefined : onClose}
        disableEnforceFocus
        disableRestoreFocus
        fullWidth
        maxWidth="xl"
        fullScreen={isPhone}
        dir="rtl"
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            alignItems: isPhone ? "stretch" : "center",
            p: isPhone ? 0 : isTablet ? 1 : 1.5
          }
        }, uiLayout.dialogLayoutSx)}
        PaperProps={{
          sx: {
            width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
            maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : undefined,
            height: isPhone
              ? "100dvh"
              : isTablet
                ? "min(92dvh, 920px)"
                : "min(90vh, 900px)",
            maxHeight: isPhone ? "100dvh" : "92dvh",
            m: 0,
            borderRadius: isPhone ? 0 : 2.5,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: primaryColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: { xs: 0.65, sm: 0.9, md: 1.1 },
            px: { xs: 1, sm: 1.5, md: 2 },
            minHeight: { xs: 48, sm: 54 },
            flex: "0 0 auto"
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 1000,
                fontSize: { xs: "0.82rem", sm: "1rem", md: "1.15rem" },
                lineHeight: 1.2
              }}
            >
              طلب سداد {data?.code ? `#${data.code}` : ""}
            </Typography>
            {!isPhone && (
              <Typography sx={{ opacity: 0.86, fontSize: "0.75rem", mt: 0.2 }}>
                جميع بيانات الطلب والتفاصيل المحاسبية
              </Typography>
            )}
          </Box>

          <IconButton
            onClick={onClose}
            disabled={confirming || savingEdit}
            sx={{ color: "white", p: { xs: 0.45, sm: 0.7 } }}
          >
            <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 0.8, sm: 1.2, md: 1.7 },
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            bgcolor: "#fff"
          }}
        >
          {error ? (
            <Alert severity="error" sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: ".78rem" } }}>
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CircularProgress />
            </Box>
          ) : data ? (
            <Stack spacing={{ xs: 0.9, sm: 1.2 }}>
              {/* بيانات الطلب - كروت مرتبة، صفين جنب بعض على الموبايل */}
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))"
                  },
                  gap: { xs: 0.55, sm: 0.75, md: 0.9 }
                }, uiLayout.formSectionSx)}
              >
                <InfoField compact={isCompact} label="اسم الطالب" value={data.studentName} span={isPhone ? 2 : 1} />
                <InfoField compact={isCompact} label="الكود" value={data.code} />
                <InfoField compact={isCompact} label="رقم الهوية" value={data.nationalId} />
                <InfoField compact={isCompact} label="التاريخ" value={formatDate(data.orderDate)} span={isPhone ? 2 : 1} />
                <InfoField compact={isCompact} label="رقم الجوال" value={data.studentTel} />
                {editMode ? (
                  <TextField sx={uiLayout.formFieldSx}
                    size="small"
                    label="رقم المرجع"
                    value={editReference}
                    onChange={(e) =>
                      setEditReference(
                        e.target.value
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <InfoField
                    compact={isCompact}
                    label="رقم المرجع"
                    value={data.referenceNumber}
                  />
                )}

                {editMode ? (
                  <TextField sx={uiLayout.formFieldSx}
                    size="small"
                    type="date"
                    label="تاريخ الحوالة"
                    value={editPaymentDate}
                    onChange={(e) =>
                      setEditPaymentDate(
                        e.target.value
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                ) : (
                  <InfoField
                    compact={isCompact}
                    label="تاريخ الحوالة"
                    value={formatDate(
                      data.paymentDate
                    )}
                  />
                )}

                <InfoField compact={isCompact} label="الفرع" value={data.branchName} span={isPhone ? 2 : isTablet ? 2 : 1} />
                {editMode ? (
                  <TextField
                    select
                    size="small"
                    label="الخزينة / البنك"
                    value={editCashBoxGuid}
                    onChange={(e) => {
                      const selectedGuid = e.target.value;
                      const sourceOptions =
                        allCashBoxOptions.length
                          ? allCashBoxOptions
                          : cashBoxOptions;

                      const selected = sourceOptions.find(
                        (option) =>
                          String(option.cashBoxGuid) ===
                          String(selectedGuid)
                      );
                      setEditCashBoxGuid(selectedGuid);

                      // مركز التكلفة لازم يكون الخاص بالبنك المختار نفسه فقط.
                      // ممنوع الاحتفاظ بمركز تكلفة البنك القديم.
                      setEditCostCenterGuid(
                        selected?.costCenterGuid || ""
                      );
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={uiLayout.withUiSx({
                      gridColumn: {
                        xs: "span 2",
                        sm: "span 2",
                        lg: "span 1"
                      }
                    }, uiLayout.formFieldSx)}
                  >
                    {cashBoxesLoading && (
                      <MenuItem disabled>
                        جاري تحميل قائمة البنوك والخزائن...
                      </MenuItem>
                    )}

                    {[
                      ...(
                        allCashBoxOptions.length
                          ? allCashBoxOptions
                          : cashBoxOptions
                      ),
                      ...(data?.cashBoxGuid &&
                      !(
                        allCashBoxOptions.length
                          ? allCashBoxOptions
                          : cashBoxOptions
                      ).some(
                        (option) =>
                          String(option.cashBoxGuid) ===
                          String(data.cashBoxGuid)
                      )
                        ? [{
                            cashBoxGuid: data.cashBoxGuid,
                            cashBoxName: data.cashBoxName,
                            costCenterGuid: data.costCenterGuid
                          }]
                        : [])
                    ].map((option) => (
                      <MenuItem
                        key={option.cashBoxGuid}
                        value={option.cashBoxGuid}
                      >
                        {option.cashBoxName || option.cashBoxGuid}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <InfoField compact={isCompact} label="الخزينة / البنك" value={data.cashBoxName} span={isPhone ? 2 : isTablet ? 2 : 1} />
                )}
                <InfoField compact={isCompact} label="المستند" value={data.documentName} span={isPhone ? 2 : isTablet ? 2 : 1} />

                {editMode ? (
                  <TextField
                    size="small"
                    multiline
                    minRows={3}
                    label="ملاحظات"
                    value={editNotes}
                    onChange={(e) =>
                      setEditNotes(
                        e.target.value
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={uiLayout.withUiSx({
                      gridColumn: {
                        xs: "span 2",
                        sm: "span 3",
                        lg: "span 5"
                      }
                    }, uiLayout.formFieldSx)}
                  />
                ) : (
                  <InfoField
                    compact={isCompact}
                    label="ملاحظات"
                    value={data.notes}
                    span={isPhone ? 2 : isTablet ? 3 : 5}
                  />
                )}
              </Box>

              <Divider />

              {/* تفاصيل البنود: Cards للموبايل والتابلت، Table للديسكتوب */}
              {isCompact ? (
                <Stack spacing={0.65}>
                  <Typography
                    sx={{
                      fontWeight: 1000,
                      color: primaryDark,
                      fontSize: { xs: "0.75rem", sm: ".8rem" }
                    }}
                  >
                    تفاصيل الطلب
                  </Typography>

                  {items.length ? (
                    items.map((item, index) => (
                      <Paper
                        key={`${item.code || "item"}-${index}`}
                        variant="outlined"
                        sx={{
                          p: { xs: 0.7, sm: 0.9 },
                          borderRadius: 1.8,
                          borderColor: "#eadca8",
                          bgcolor: "#fffaf0"
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 1000,
                            color: "#263238",
                            fontSize: { xs: "0.75rem", sm: ".78rem" },
                            mb: 0.55,
                            overflowWrap: "anywhere"
                          }}
                        >
                          {item.statement || "-"}
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 0.45
                          }}
                        >
                          {[
                            ["الوحدة", item.unit || "PCS", null],
                            ["الكمية", item.quantity, null],
                            ["التكلفة", item.cost, "cost"],
                            ["% الضريبة", item.taxRate, null],
                            ["الضريبة", item.tax, "tax"],
                            ["الصافي", item.subTotal, "subTotal"]
                          ].map(([label, value, field]) => (
                            <Box
                              key={label}
                              sx={{
                                bgcolor: "#fff",
                                border: "1px solid #eee5c7",
                                borderRadius: 1,
                                p: 0.45,
                                textAlign: "center",
                                minWidth: 0
                              }}
                            >
                              <Typography sx={{ color: "#68776f", fontSize: { xs: "0.75rem", sm: "0.75rem" } }}>
                                {label}
                              </Typography>

                              {editMode &&
                              field &&
                              Number(data?.status) === 0 ? (
                                <TextField InputLabelProps={{ shrink: true }}
                                  size="small"
                                  type="number"
                                  value={value ?? 0}
                                  onChange={(e) =>
                                    changeEditItem(
                                      index,
                                      field,
                                      e.target.value
                                    )
                                  }
                                  inputProps={{
                                    min: 0,
                                    step: "0.01",
                                    style: {
                                      textAlign: "center",
                                      padding: "4px"
                                    , direction: "ltr", unicodeBidi: "isolate" }
                                  , dir: "ltr" }}
                                  sx={uiLayout.withUiSx({
                                    mt: 0.2,
                                    "& .MuiInputBase-root": {
                                      fontSize: {
                                        xs: "0.75rem",
                                        sm: "0.75rem"
                                      }
                                    }
                                  }, uiLayout.formFieldSx)}
                                />
                              ) : (
                                <Typography
                                  sx={{
                                    fontWeight: 950,
                                    fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {field
                                    ? money(value)
                                    : (value ?? "-")}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Paper variant="outlined" sx={{ p: 1.2, textAlign: "center", color: "#777" }}>
                      لا توجد بنود
                    </Paper>
                  )}
                </Stack>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={uiLayout.withUiSx({
                    maxHeight: 310,
                    borderRadius: 2,
                    overflowX: "auto"
                  }, uiLayout.tableContainerSx)}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {["البيان", "الوحدة", "الكمية", "التكلفة", "% الضريبة", "الضريبة", "الصافي"].map((x) => (
                          <TableCell
                            key={x}
                            align="center"
                            sx={{
                              fontWeight: 950,
                              bgcolor: "#dce9f6",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {x}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={`${item.code}-${index}`} sx={{ bgcolor: "#fff3cd" }}>
                          <TableCell align="right" sx={{ fontWeight: 850, minWidth: 220 }}>
                            {item.statement}
                          </TableCell>
                          <TableCell align="center">{item.unit || "PCS"}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="center">
                            {editMode &&
                            Number(data?.status) === 0 ? (
                              <TextField InputLabelProps={{ shrink: true }}
                                size="small"
                                type="number"
                                value={item.cost}
                                onChange={(e) =>
                                  changeEditItem(
                                    index,
                                    "cost",
                                    e.target.value
                                  )
                                }
                                inputProps={{
                                  min: 0,
                                  step: "0.01",
                                  style: {
                                    textAlign: "center"
                                  , direction: "ltr", unicodeBidi: "isolate" }
                                , dir: "ltr" }}
                                sx={uiLayout.withUiSx({ width: 95 }, uiLayout.formFieldSx)}
                              />
                            ) : (
                              money(item.cost)
                            )}
                          </TableCell>

                          <TableCell align="center">
                            {item.taxRate}
                          </TableCell>

                          <TableCell align="center">
                            {editMode &&
                            Number(data?.status) === 0 ? (
                              <TextField InputLabelProps={{ shrink: true }}
                                size="small"
                                type="number"
                                value={item.tax}
                                onChange={(e) =>
                                  changeEditItem(
                                    index,
                                    "tax",
                                    e.target.value
                                  )
                                }
                                inputProps={{
                                  min: 0,
                                  step: "0.01",
                                  style: {
                                    textAlign: "center"
                                  , direction: "ltr", unicodeBidi: "isolate" }
                                , dir: "ltr" }}
                                sx={uiLayout.withUiSx({ width: 95 }, uiLayout.formFieldSx)}
                              />
                            ) : (
                              money(item.tax)
                            )}
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{ fontWeight: 900 }}
                          >
                            {editMode &&
                            Number(data?.status) === 0 ? (
                              <TextField InputLabelProps={{ shrink: true }}
                                size="small"
                                type="number"
                                value={item.subTotal}
                                onChange={(e) =>
                                  changeEditItem(
                                    index,
                                    "subTotal",
                                    e.target.value
                                  )
                                }
                                inputProps={{
                                  min: 0,
                                  step: "0.01",
                                  style: {
                                    textAlign: "center"
                                  , direction: "ltr", unicodeBidi: "isolate" }
                                , dir: "ltr" }}
                                sx={uiLayout.withUiSx({ width: 95 }, uiLayout.formFieldSx)}
                              />
                            ) : (
                              money(item.subTotal)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* الإجماليات */}
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 0.65, sm: 0.85 },
                  borderRadius: 2,
                  bgcolor: "#fcfdfc"
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: { xs: 0.45, sm: 0.7 }
                  }}
                >
                  {[
                    [
                      "الإجمالي",
                      editMode
                        ? editableTotals.total
                        : data.total
                    ],
                    [
                      "الضريبة",
                      editMode
                        ? editableTotals.tax
                        : data.tax
                    ],
                    [
                      "الصافي",
                      editMode
                        ? editableTotals.subTotal
                        : data.subTotal
                    ]
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        border: "1px solid #e4e9e6",
                        borderRadius: 1.3,
                        py: { xs: 0.5, sm: 0.7 },
                        px: 0.4,
                        textAlign: "center"
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: "#66756e", fontSize: { xs: "0.75rem", sm: "0.75rem" } }}>
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 1000,
                          color: accentColor,
                          fontSize: { xs: "0.75rem", sm: ".86rem" }
                        }}
                      >
                        {money(value)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* الإجراءات الثانوية داخل المحتوى */}
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))"
                  },
                  gap: 0.55
                }, uiLayout.actionBarSx)}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ReceiptLongIcon />}
                  onClick={() => onOpenInvoice?.(data)}
                  disabled={!data.billGuid}
                  sx={uiLayout.withUiSx({ fontSize: { xs: "0.75rem", sm: "0.75rem" }, minHeight: 34 }, uiLayout.buttonSx)}
                >
                  عرض الفاتورة
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={() => onOpenStatement?.(data)}
                  sx={uiLayout.withUiSx({ fontSize: { xs: "0.75rem", sm: "0.75rem" }, minHeight: 34 }, uiLayout.buttonSx)}
                >
                  كشف الحساب
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => onOpenOperations?.(data)}
                  sx={uiLayout.withUiSx({ fontSize: { xs: "0.75rem", sm: "0.75rem" }, minHeight: 34 }, uiLayout.buttonSx)}
                >
                  العمليات
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={() => attachmentUrl && window.open(attachmentUrl, "_blank", "noopener,noreferrer")}
                  disabled={!attachmentUrl}
                  sx={uiLayout.withUiSx({ fontSize: { xs: "0.75rem", sm: "0.75rem" }, minHeight: 34 }, uiLayout.buttonSx)}
                >
                  مستند الدفع
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyBillCode}
                  disabled={
                    !(
                      data?.billCode ||
                      order?.billCode
                    )
                  }
                  sx={uiLayout.withUiSx({
                    fontSize: {
                      xs: "0.75rem",
                      sm: "0.75rem"
                    },
                    minHeight: 34
                  }, uiLayout.buttonSx)}
                >
                  نسخ رقم الفاتورة
                </Button>

                {!editMode ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<EditIcon />}
                    onClick={startEdit}
                    disabled={!canEdit}
                    sx={uiLayout.withUiSx({
                      fontSize: {
                        xs: "0.75rem",
                        sm: "0.75rem"
                      },
                      minHeight: 34
                    }, uiLayout.buttonSx)}
                  >
                    تعديل الطلب
                  </Button>
                ) : (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={
                        savingEdit
                          ? (
                            <CircularProgress
                              size={14}
                              color="inherit"
                            />
                          )
                          : <SaveIcon />
                      }
                      onClick={saveEdit}
                      disabled={savingEdit}
                      sx={uiLayout.withUiSx({
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        minHeight: 34
                      }, uiLayout.buttonSx)}
                    >
                      حفظ التعديل
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      sx={uiLayout.withUiSx({
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        minHeight: 34
                      }, uiLayout.buttonSx)}
                    >
                      إلغاء التعديل
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: { xs: 0.8, sm: 1.4, md: 2 },
            py: { xs: 0.65, sm: 0.9 },
            borderTop: "1px solid #e5ebe8",
            bgcolor: "#fff",
            flex: "0 0 auto",
            gap: 0.6,
            justifyContent: "space-between"
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={onClose}
            disabled={confirming || savingEdit}
            sx={uiLayout.withUiSx({
              color: accentColor,
              fontWeight: 900,
              minWidth: { xs: 58, sm: 75 },
              fontSize: { xs: "0.75rem", sm: "0.75rem" }
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>

          <Stack sx={uiLayout.actionBarSx} direction="row" spacing={0.55}>
            <Button
              size="small"
              variant="contained"
              onClick={printOrder}
              startIcon={<PrintIcon />}
              disabled={!data}
              sx={uiLayout.withUiSx({
                minHeight: { xs: 34, sm: 38 },
                fontSize: { xs: "0.75rem", sm: "0.75rem" }
              }, uiLayout.buttonSx)}
            >
              طباعة
            </Button>

            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={confirmOrder}
              startIcon={
                confirming
                  ? <CircularProgress size={15} color="inherit" />
                  : <CheckCircleIcon />
              }
              disabled={!canConfirm || confirming || editMode || savingEdit}
              sx={uiLayout.withUiSx({
                minHeight: { xs: 34, sm: 38 },
                fontSize: { xs: "0.75rem", sm: "0.75rem" }
              }, uiLayout.buttonSx)}
            >
              {confirming
                ? "جاري التأكيد..."
                : Number(data?.status) === 1
                  ? "مؤكد"
                  : "تأكيد التحويل"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <iframe
        ref={printFrameRef}
        title="payment-order-print"
        style={adaptiveInlineStyle({
          position: "fixed",
          width: 0,
          height: 0,
          border: 0,
          visibility: "hidden"
        })}
      />
    </>
  );
}

