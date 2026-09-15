import { PRINT_READY_SCRIPT } from '../utils/printReady';
import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import sstliLogo from "../images/logo.jpg";
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const DEFAULT_API_BASE_URL = "http://localhost:5258";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const whiteColor = "#fefefe";
const textColor = "#1f2d3d";
const softBg = "#fefefe";

const NO_GUID = "00000000-0000-0000-0000-000000000000";

const sweetAlertButtons = {
  confirmButtonColor: primaryColor,
  cancelButtonColor: accentColor,
  confirmButtonText: "حسناً",
  cancelButtonText: "إلغاء",
  reverseButtons: true
};

const showSweetWarning = (message, title = "تنبيه") =>
  Swal.fire({
    icon: "warning",
    title,
    text: message,
    position: "center",
    backdrop: true,
    heightAuto: false,
    allowOutsideClick: true,
    customClass: {
      popup: "sstli-swal-popup",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text"
    },
    ...sweetAlertButtons
  });

const showSweetError = (message, title = "خطأ") =>
  Swal.fire({
    icon: "error",
    title,
    text: message,
    position: "center",
    backdrop: true,
    heightAuto: false,
    customClass: {
      popup: "sstli-swal-popup",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text"
    },
    ...sweetAlertButtons
  });

const showSweetSuccess = (message, title = "تم بنجاح") =>
  Swal.fire({
    icon: "success",
    title,
    text: message,
    position: "center",
    backdrop: true,
    heightAuto: false,
    customClass: {
      popup: "sstli-swal-popup",
      title: "sstli-swal-title",
      htmlContainer: "sstli-swal-text"
    },
    ...sweetAlertButtons
  });

const showSweetConfirm = async (message, title = "تأكيد") => {
  const result = await Swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: "نعم",
    cancelButtonText: "لا",
    confirmButtonColor: primaryColor,
    cancelButtonColor: accentColor,
    reverseButtons: true
  });

  return result.isConfirmed;
};


const toNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};


const exportHtmlDocumentToPdf = async ({
  html,
  fileName = "document.pdf",
  selector = ".sheet, .page, main, body",
  scale = 2
}) => {
  let iframe = null;

  try {
    iframe = document.createElement("iframe");

    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "820px",
      height: "1180px",
      border: "0",
      opacity: "0",
      pointerEvents: "none"
    });

    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const safeHtml = String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(
        /<button[^>]*class=["'][^"']*(?:print-btn|no-print)[^"']*["'][^>]*>[\s\S]*?<\/button>/gi,
        ""
      );

    const loaded = new Promise((resolve) => {
      iframe.onload = () => resolve();
    });

    iframe.srcdoc = safeHtml;
    await loaded;

    const doc = iframe.contentDocument;

    if (!doc) {
      throw new Error("تعذر تجهيز محتوى ملف PDF");
    }

    if (doc.fonts?.ready) {
      try {
        await doc.fonts.ready;
      } catch {}
    }

    const images = Array.from(doc.images || []);

    await Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            if (
              image.complete &&
              image.naturalWidth > 0
            ) {
              resolve();
              return;
            }

            const finish = () => resolve();

            image.addEventListener(
              "load",
              finish,
              { once: true }
            );

            image.addEventListener(
              "error",
              finish,
              { once: true }
            );

            window.setTimeout(finish, 5000);
          })
      )
    );

    const target =
      doc.querySelector(selector) ||
      doc.body;

    if (!target) {
      throw new Error("تعذر العثور على نموذج التصدير");
    }

    target.style.boxShadow = "none";
    target.style.margin = "0 auto";

    const canvas = await html2canvas(target, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 7000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(
        target.scrollWidth,
        794
      ),
      windowHeight: Math.max(
        target.scrollHeight,
        1123
      )
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const canvasRatio =
      canvas.height / canvas.width;

    const renderedHeight =
      pageWidth * canvasRatio;

    if (renderedHeight <= pageHeight) {
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.96),
        "JPEG",
        0,
        0,
        pageWidth,
        renderedHeight,
        undefined,
        "FAST"
      );
    } else {
      const pagePixelHeight =
        Math.floor(
          canvas.width *
            (pageHeight / pageWidth)
        );

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(
          pagePixelHeight,
          canvas.height - offsetY
        );

        const pageCanvas =
          document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const context =
          pageCanvas.getContext("2d");

        context.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        if (pageIndex > 0) {
          pdf.addPage("a4", "portrait");
        }

        const sliceRenderedHeight =
          pageWidth *
          (sliceHeight / canvas.width);

        pdf.addImage(
          pageCanvas.toDataURL(
            "image/jpeg",
            0.96
          ),
          "JPEG",
          0,
          0,
          pageWidth,
          sliceRenderedHeight,
          undefined,
          "FAST"
        );

        offsetY += sliceHeight;
        pageIndex += 1;
      }
    }

    pdf.save(
      fileName.toLowerCase().endsWith(".pdf")
        ? fileName
        : `${fileName}.pdf`
    );
  } finally {
    if (
      iframe &&
      iframe.parentNode
    ) {
      iframe.parentNode.removeChild(
        iframe
      );
    }
  }
};


const money = (value) =>
  toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getSellerGuid = () => {
  const user = getCurrentUser();

  return (
    user?.sellerGuid ||
    user?.SellerGuid ||
    user?.SELLER_GUID ||
    user?.guid ||
    user?.Guid ||
    ""
  );
};

const getUserGuid = () => {
  const user = getCurrentUser();

  return user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "";
};

const getAdmissionUserPayload = () => {
  const user = getCurrentUser();

  return {
    userGuid: user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "",
    userName: user?.userName || user?.UserName || "",
    fullName: user?.fullName || user?.FullName || "",
    userJop: Number(user?.userJop ?? user?.UserJop ?? 0),
    userDepart: Number(user?.userDepart ?? user?.UserDepart ?? 0),
    departGuid: user?.departGuid || user?.DepartGuid || "",
    sellerGuid: user?.sellerGuid || user?.SellerGuid || "",
    branchForWork: user?.branchForWork || user?.BranchForWork || "",
    branchGuid: user?.branchGuid || user?.BranchGuid || "",
    chkAmount: Boolean(user?.chkAmount ?? user?.ChkAmount),
    chkOtherFess: Boolean(user?.chkOtherFess ?? user?.ChkOtherFess),
    chkBranch: Boolean(user?.chkBranch ?? user?.ChkBranch),
    chkTrainer: Boolean(user?.chkTrainer ?? user?.ChkTrainer),
    staut: user?.staut_ !== false && user?.staut !== false && user?.Staut !== false,

    canSaveRegOrder:
      user?.canSaveRegOrder ??
      user?.CanSaveRegOrder ??
      user?.canAddRegOrder ??
      user?.CanAddRegOrder ??
      user?.canSaveAdmissionOrder ??
      user?.CanSaveAdmissionOrder ??
      null
  };
};

const getBranchForWork = () => {
  const user = getCurrentUser();

  return (
    user?.branchForWork ||
    user?.BranchForWork ||
    user?.branchGuid ||
    user?.BranchGuid ||
    ""
  );
};

const getStudentNationalValue = (student) => {
  const value =
    student?.studentNational ??
    student?.studentNationalValue ??
    student?.StudentNational ??
    0;

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStudentField = (student, ...names) => {
  for (const name of names) {
    if (student?.[name] !== undefined && student?.[name] !== null && student?.[name] !== "") {
      return student[name];
    }
  }

  return "";
};

const TextInfo = ({ label, value, strong = false }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.1,
      borderRadius: 2,
      border: `1px solid ${primaryLight}`,
      backgroundColor: whiteColor,
      height: "100%",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.5,
        borderRadius: 1.3,
        minHeight: 48
      },
      "@media (max-width:599px)": {
        p: 0.38,
        minHeight: 44
      }
    }}
  >
    <Typography
      sx={{
        fontSize: "0.76rem",
        color: primaryColor,
        fontWeight: 900,
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.3,
        fontSize: "0.9rem",
        color: strong ? accentColor : textColor,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          mt: 0.12,
          fontSize: "0.75rem",
          lineHeight: 1.2
        },
        "@media (max-width:599px)": {
          fontSize: "0.75rem"
        },
        fontWeight: 1000,
        wordBreak: "break-word",
        direction: "rtl",
        textAlign: "start"
      }}
    >
      <bdi dir="auto">{value || "-"}</bdi>
    </Typography>
  </Paper>
);

const SummaryCard = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      px: 2,
      py: 1.25,
      borderRadius: 3,
      border: `1px solid ${primaryLight}`,
      backgroundColor: whiteColor,
      minWidth: 145,
      textAlign: "center",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        minWidth: 0,
        px: 0.45,
        py: 0.4,
        borderRadius: 1.35,
        minHeight: 54
      },
      "@media (max-width:599px)": {
        px: 0.3,
        py: 0.3,
        minHeight: 50
      }
    }}
  >
    <Typography
      sx={{
        fontSize: "0.76rem",
        color: primaryColor,
        fontWeight: 900,
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontSize: "1.15rem",
        color,
        fontWeight: 1000,
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {money(value)}
    </Typography>
  </Paper>
);

const MoneyCell = ({ value, color = textColor }) => (
  <Typography
    sx={{
      width: "100%",
      textAlign: "center",
      fontWeight: 1000,
      color,
      fontSize: "0.84rem",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
      "@media (max-width:599px)": { fontSize: "0.75rem" }
    }}
  >
    {money(value)}
  </Typography>
);

const EllipsisCell = ({ value, align = "start" }) => (
  <Tooltip title={value || ""} arrow>
    <Typography
      sx={{
        width: "100%",
        textAlign: align,
        direction: "rtl",
        fontWeight: 900,
        fontSize: "0.8rem",
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" },
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: textColor
      }}
    >
      <bdi dir="auto">{value || "-"}</bdi>
    </Typography>
  </Tooltip>
);

const EmptyBox = ({ text }) => (
  <Box
    sx={{
      height: 220,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        height: 115,
        fontSize: "0.75rem"
      },
      "@media (max-width:599px)": {
        height: 96,
        fontSize: "0.75rem"
      },
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#789",
      fontWeight: 900
    }}
  >
    {text}
  </Box>
);

const StepPointer = ({ show }) => {
  if (!show) return null;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          width: 22,
          height: 22,
          fontSize: "0.85rem"
        },
        "@media (max-width:599px)": {
          width: 19,
          height: 19,
          fontSize: "0.75rem"
        },
        borderRadius: "50%",
        background: "linear-gradient(135deg, #fff7e6, #fff)",
        border: "1px solid #ffd28a",
        boxShadow: "0 10px 22px rgba(174,30,33,0.16)",
        fontSize: "1.45rem",
        transform: "rotate(-18deg)",
        animation: "sstliFingerMove 0.95s ease-in-out infinite alternate",
        "@keyframes sstliFingerMove": {
          "0%": { transform: "translateY(0) rotate(-18deg) scale(1)" },
          "100%": { transform: "translateY(-7px) rotate(-18deg) scale(1.08)" }
        }
      }}
    >
      ☝️
    </Box>
  );
};

const StepGuideCard = ({ number, title, hint, active, done, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      borderRadius: 3,
      height: "100%",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.5,
        borderRadius: 1.5,
        minHeight: 88
      },
      "@media (max-width:599px)": {
        p: 0.38,
        minHeight: 82
      },
      position: "relative",
      overflow: "hidden",
      border: active
        ? `2px solid ${accentColor}`
        : done
        ? `1px solid ${primaryColor}`
        : "1px solid #e4ece8",
      background: active
        ? "linear-gradient(135deg, #fff7f7 0%, #ffffff 55%, #f2fbf6 100%)"
        : done
        ? "linear-gradient(135deg, #f1fbf6 0%, #ffffff 100%)"
        : "#ffffff",
      boxShadow: active
        ? "0 16px 36px rgba(174,30,33,0.16)"
        : "0 10px 26px rgba(5,117,70,0.07)",
      transition: "0.25s ease"
    }}
  >
    <Stack
      spacing={1}
      sx={{
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { gap: "4px !important" }
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { gap: "4px !important" }
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                width: 20,
                height: 20,
                fontSize: "0.75rem"
              },
              "@media (max-width:599px)": {
                width: 18,
                height: 18,
                fontSize: "0.75rem"
              },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 1000,
              color: whiteColor,
              background: done
                ? `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
                : active
                ? `linear-gradient(135deg, ${accentColor}, #7d1113)`
                : "linear-gradient(135deg, #98a2b3, #667085)"
            }}
          >
            {done ? "✓" : number}
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 1000,
                color: active ? accentColor : textColor,
                fontSize: "0.95rem",
                lineHeight: 1.1,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                "@media (max-width:599px)": { fontSize: "0.75rem" }
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                color: "#667085",
                fontSize: "0.75rem",
                lineHeight: 1.1,
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
                "@media (max-width:599px)": { fontSize: "0.75rem" }
              }}
            >
              {hint}
            </Typography>
          </Box>
        </Stack>

        <StepPointer show={active} />
      </Stack>

      {children}
    </Stack>
  </Paper>
);

const InlineHint = ({ children, color = primaryColor }) => (
  <Typography
    sx={{
      mt: 0.8,
      fontSize: "0.76rem",
      fontWeight: 900,
      color,
      lineHeight: 1.7,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        mt: 0.28,
        fontSize: "0.75rem",
        lineHeight: 1.35
      },
      "@media (max-width:599px)": {
        mt: 0.2,
        fontSize: "0.75rem"
      }
    }}
  >
    {children}
  </Typography>
);

const FileButton = ({ label, required, file, onChange, onRemove, disabled }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 3,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.5,
        borderRadius: 1.4
      },
      "@media (max-width:599px)": {
        p: 0.38
      },
      border: required && !file ? "1px solid #ffcdd2" : "1px solid #dfeae5",
      backgroundColor: required && !file ? "#fff7f7" : "#fff"
    }}
  >
    <Stack sx={uiLayout.pageHeaderSx} spacing={1}>
      <Typography
        sx={{
          fontWeight: 1000,
          color: required && !file ? accentColor : textColor,
          fontSize: "0.86rem",
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": { fontSize: "0.75rem" }
        }}
      >
        {label} {required ? "*" : ""}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component="label"
          variant="outlined"
          disabled={disabled}
          startIcon={<AttachFileIcon />}
          sx={uiLayout.withUiSx({
            borderRadius: 2,
            fontWeight: 900,
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              minHeight: 29,
              px: 0.55,
              fontSize: "0.75rem"
            },
            "@media (max-width:599px)": {
              minHeight: 27,
              px: 0.4,
              fontSize: "0.75rem"
            },
            "& .MuiButton-startIcon": { ml: 1, mr: 0 }
          }, uiLayout.buttonSx)}
        >
          اختيار ملف
          <input
            type="file"
            hidden
            accept=".jpg,.jpeg,.png,.webp,.bmp,.pdf"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </Button>

        {file && (
          <IconButton size="small" onClick={onRemove} sx={{ color: accentColor }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Typography
        sx={{
          fontSize: "0.76rem",
          fontWeight: 800,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
          "@media (max-width:599px)": { fontSize: "0.75rem" },
          color: file ? primaryDark : "#8795a1",
          direction: "ltr",
          textAlign: "left",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
      >
        {file?.name || "لم يتم اختيار ملف"}
      </Typography>
    </Stack>
  </Paper>
);

const AdmissionOrderDialog = ({
  open,
  onClose,
  student,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  onSaved
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const [branches, setBranches] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [banks, setBanks] = useState([]);

  const [branchesLoading, setBranchesLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [diplomasLoading, setDiplomasLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastPrintData, setLastPrintData] = useState(null);

  const [regType, setRegType] = useState("");
  const [studyType, setStudyType] = useState("");
  const [branchGuid, setBranchGuid] = useState("");
  const [branchName, setBranchName] = useState("");

  const [batchGuid, setBatchGuid] = useState("");
  const [batchName, setBatchName] = useState("");

  const [contextData, setContextData] = useState(null);

  const [availableDiplomas, setAvailableDiplomas] = useState([]);
  const [availableFees, setAvailableFees] = useState([]);

  const [selectedDiplomas, setSelectedDiplomas] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);

  const [notes, setNotes] = useState("");
  const [platformId, setPlatformId] = useState("");

  const [payType, setPayType] = useState(1);
  const [amount, setAmount] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ref, setRef] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [networkBankInfo, setNetworkBankInfo] = useState(null);
  const [branchCashboxInfo, setBranchCashboxInfo] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [attachId, setAttachId] = useState(null);
  const [attachTransfer, setAttachTransfer] = useState(null);
  const [attachCertificate, setAttachCertificate] = useState(null);

  const [error, setError] = useState("");

  const studentName = getStudentField(student, "studentName", "StudentName") || "-";
  const nationalId = getStudentField(student, "nationalId", "NationalId") || "-";
  const studentTel =
    getStudentField(student, "studentTel", "tel", "StudentTel", "studentTel1") || "-";
  const accountGuid = getStudentField(student, "accountGuid", "AccountGuid");
  const studentNational = getStudentNationalValue(student);

  const totals = useMemo(() => {
    const rows = [...selectedDiplomas, ...selectedFees];

    return rows.reduce(
      (acc, row) => {
        acc.total += toNumber(row.cost);
        acc.tax += toNumber(row.tax);
        acc.subTotal += toNumber(row.subTotal);
        return acc;
      },
      { total: 0, tax: 0, subTotal: 0 }
    );
  }, [selectedDiplomas, selectedFees]);

  const currentStep = useMemo(() => {
    if (!branchGuid) return 1;
    if (regType === "" || regType === null || regType === undefined) return 2;
    if (studyType === "" || studyType === null || studyType === undefined) return 3;
    if (!contextData || !batchGuid) return 4;
    if (!selectedDiplomas.length) return 5;
    return 6;
  }, [branchGuid, regType, studyType, contextData, batchGuid, selectedDiplomas.length]);

  // الدبلوم والدورات التأهيلية والتطويرية كلها مرتبطة بدفعة في منطق الديسكتوب.
  const canChooseDiploma = Boolean(contextData) && Boolean(batchGuid);
  const noAvailableBatches =
    Boolean(branchGuid) &&
    Boolean(contextData) &&
    !batchesLoading &&
    batches.length === 0;

  const branchStepRef = useRef(null);
  const regTypeStepRef = useRef(null);
  const studyTypeStepRef = useRef(null);
  const batchStepRef = useRef(null);
  const diplomaStepRef = useRef(null);
  const paymentStepRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const refs = {
      1: branchStepRef,
      2: regTypeStepRef,
      3: studyTypeStepRef,
      4: batchStepRef,
      5: diplomaStepRef,
      6: paymentStepRef
    };

    const timer = setTimeout(() => {
      refs[currentStep]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [currentStep, open]);

  const minStartPay = toNumber(contextData?.payAmount);

const minimumPayDisplay =
  Number(regType) === 0 && minStartPay > 0
    ? money(minStartPay)
    : "غير محدد";
  const attachIdRequired = true;
  const attachTransferRequired = payType === 2;
  const attachCertificateRequired = Number(regType) === 0;

  const currentPaymentName =
    payType === 0
      ? branchCashboxInfo?.cashBoxName || "-"
      : payType === 1
      ? networkBankInfo?.bankName || "-"
      : selectedBank?.bankName || "-";

  const currentPaymentGuid =
    payType === 0
      ? branchCashboxInfo?.cashBoxGuid || NO_GUID
      : payType === 1
      ? networkBankInfo?.bankGuid || NO_GUID
      : selectedBank?.bankGuid || NO_GUID;

  const currentCostCenterGuid =
    payType === 0
      ? branchCashboxInfo?.costCenterGuid || NO_GUID
      : payType === 1
      ? networkBankInfo?.costCenterGuid || NO_GUID
      : selectedBank?.costCenterGuid || NO_GUID;

  const resetDialog = () => {
    setRegType("");
    setStudyType("");
    setBranchGuid("");
    setBranchName("");
    setBatchGuid("");
    setBatchName("");
    setContextData(null);
    setAvailableDiplomas([]);
    setAvailableFees([]);
    setSelectedDiplomas([]);
    setSelectedFees([]);
    setNotes("");
    setPlatformId("");
    setPayType(1);
    setAmount("");
    setDeviceId("");
    setRef("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setNetworkBankInfo(null);
    setBranchCashboxInfo(null);
    setSelectedBank(null);
    setBankDialogOpen(false);
    setBankSearch("");
    setAttachId(null);
    setAttachTransfer(null);
    setAttachCertificate(null);
    setLastPrintData(null);
    setError("");
  };

  const fetchJson = async (url, options) => {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || result?.error || "حدث خطأ أثناء تنفيذ الطلب");
    }

    return result;
  };

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      setError("");

      const result = await fetchJson(`${apiBaseUrl}/api/admission-order/branches`);
      setBranches(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل الفروع");
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadPlatforms = async () => {
    try {
      const result = await fetchJson(`${apiBaseUrl}/api/admission-order/platforms`);
      setPlatforms(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setPlatforms([
        { id: 0, name: "إعلان ترويجي" },
        { id: 1, name: "إعلان عنه مشهور" },
        { id: 2, name: "بحث عن معهد" },
        { id: 3, name: "مسجل مسبقاً" },
        { id: 4, name: "أحد متدربي المعهد" }
      ]);
    }
  };

  const loadDefaultNetworkBank = async () => {
    try {
      const result = await fetchJson(`${apiBaseUrl}/api/admission-order/default-network-bank`);
      setNetworkBankInfo(result?.data || null);
    } catch {
      setNetworkBankInfo(null);
    }
  };

  const loadBranchCashbox = async (targetBranchGuid = branchGuid) => {
    if (!targetBranchGuid) return;

    try {
      const params = new URLSearchParams({ branchGuid: targetBranchGuid });
      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/branch-cashbox?${params.toString()}`
      );

      setBranchCashboxInfo(result?.data || null);
    } catch (err) {
      setBranchCashboxInfo(null);
      setError(err.message || "تعذر تحميل خزينة الفرع");
    }
  };

  const loadBanks = async (search = "") => {
    try {
      setBanksLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());

      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/banks?${params.toString()}`
      );

      setBanks(
        (Array.isArray(result?.data) ? result.data : []).map((x, i) => ({
          ...x,
          id: x.bankGuid || `${x.bankName}-${i}`
        }))
      );
    } catch (err) {
      setBanks([]);
      setError(err.message || "تعذر تحميل قائمة البنوك");
    } finally {
      setBanksLoading(false);
    }
  };

  const loadBatches = async (
    targetBranchGuid = branchGuid,
    targetRegType = regType
  ) => {
    if (!targetBranchGuid) return;

    try {
      setBatchesLoading(true);
      setBatchGuid("");
      setBatchName("");
      setBatches([]);

      const params = new URLSearchParams({
        branchGuid: targetBranchGuid,
        regType: String(targetRegType)
      });
      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/batches?${params.toString()}`
      );

      const nextBatches = (Array.isArray(result?.data) ? result.data : []).map((x, i) => ({
        ...x,
        id: x.batchGuid || `${x.batchName}-${i}`
      }));

      setBatches(nextBatches);

      if (nextBatches.length === 0) {
        const message = "لا توجد دفعات متاحة لهذا الفرع حالياً، برجاء اختيار فرع آخر أو مراجعة الدعم الفني.";
        setError(message);
        await showSweetWarning(message, "لا توجد دفعات");
      }
    } catch (err) {
      setBatches([]);
      setError(err.message || "تعذر تحميل الدفعات");
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      resetDialog();
      loadBranches();
      loadPlatforms();
      loadDefaultNetworkBank();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const clearRegistrationData = () => {
    setContextData(null);
    setBatchGuid("");
    setBatchName("");
    setAvailableDiplomas([]);
    setAvailableFees([]);
    setSelectedDiplomas([]);
    setSelectedFees([]);
    setBatches([]);
    setNotes("");
    setAmount(0);
  };

  const checkStudentActiveDiploma = async () => {
    if (!accountGuid) {
      throw new Error("لا يمكن قراءة حساب الطالب");
    }

    const params = new URLSearchParams({ accountGuid });

    return await fetchJson(
      `${apiBaseUrl}/api/admission-order/student-active-diploma?${params.toString()}`
    );
  };

  const stopIfStudentHasActiveDiploma = async () => {
    const result = await checkStudentActiveDiploma();

    if (!result?.hasActiveDiploma) return false;

    const message =
      result?.message ||
      `الطالب مسجل بالفعل في دبلوم: ${result?.diplomName || ""}`;

    clearRegistrationData();
    setError(message);
    await showSweetWarning(message);

    return true;
  };

  const loadContext = async (
    targetBranchGuid = branchGuid,
    targetRegType = regType,
    targetStudyType = studyType
  ) => {
    if (!targetBranchGuid) {
      const message = "برجاء اختيار الفرع أولاً";
      setError(message);
      await showSweetWarning(message);
      return;
    }

    if (targetRegType === "" || targetRegType === null || targetRegType === undefined) {
      const message = "برجاء اختيار نوع التسجيل أولاً";
      setError(message);
      await showSweetWarning(message, "اختار نوع التسجيل");
      return;
    }

    if (targetStudyType === "" || targetStudyType === null || targetStudyType === undefined) {
      const message = "برجاء اختيار نوع الدراسة أولاً";
      setError(message);
      await showSweetWarning(message, "اختار نوع الدراسة");
      return;
    }

    try {
      setContextLoading(true);
      setError("");

      if (Number(targetRegType) === 0) {
        const blocked = await stopIfStudentHasActiveDiploma();
        if (blocked) return;
      }

      setContextData(null);
      setAvailableDiplomas([]);
      setAvailableFees([]);
      setSelectedDiplomas([]);
      setSelectedFees([]);

      const params = new URLSearchParams({
        branchGuid: targetBranchGuid,
        regType: String(targetRegType),
        studyType: String(targetStudyType),
        sellerGuid: getSellerGuid()
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/context?${params.toString()}`
      );

      setContextData(result);

      // الملاحظات التلقائية خاصة بالدبلومات فقط.
      setNotes(Number(targetRegType) === 0 ? result?.priceSaleNotes || "" : "");
      const contextMinimumPay = toNumber(result?.payAmount);

setAmount(
  Number(targetRegType) === 0 && contextMinimumPay > 0
    ? contextMinimumPay
    : ""
);

      // التخصصات لا تُحمّل إلا بعد اختيار الدفعة حتى نعرض ما له مقاعد فقط.
      setAvailableDiplomas([]);

      await Promise.all([
        loadBatches(targetBranchGuid, targetRegType),
        loadBranchCashbox(getBranchForWork() || targetBranchGuid)
      ]);

      if (result?.chkOtherFees && result?.priceListGuid) {
        await loadFees(result.priceListGuid);
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تجهيز طلب الالتحاق");
    } finally {
      setContextLoading(false);
    }
  };

  const loadDiplomas = async (
    priceSaleGuid,
    targetRegType = regType,
    targetBranchGuid = branchGuid,
    targetBatchGuid = batchGuid
  ) => {
    if (!priceSaleGuid || !targetBranchGuid || !targetBatchGuid) {
      setAvailableDiplomas([]);
      return;
    }

    try {
      setDiplomasLoading(true);
      setAvailableDiplomas([]);

      const params = new URLSearchParams({
        priceSaleGuid,
        regType: String(targetRegType),
        branchGuid: targetBranchGuid,
        batchGuid: targetBatchGuid,
        studentNational: String(studentNational)
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/diplomas?${params.toString()}`
      );

      setAvailableDiplomas(
        (Array.isArray(result?.data) ? result.data : []).map((item, index) => ({
          ...item,
          id: item.id || item.diplomGuid || `${item.code}-${index}`
        }))
      );
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل الدبلومات / الدورات");
      setAvailableDiplomas([]);
    } finally {
      setDiplomasLoading(false);
    }
  };

  const loadFees = async (priceListGuid) => {
    if (!priceListGuid) return;

    try {
      setFeesLoading(true);

      const params = new URLSearchParams({ priceListGuid });

      const result = await fetchJson(
        `${apiBaseUrl}/api/admission-order/fees?${params.toString()}`
      );

      setAvailableFees(
        (Array.isArray(result?.data) ? result.data : []).map((item, index) => ({
          ...item,
          id: item.id || item.feeGuid || `${item.code}-${index}`
        }))
      );
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل الرسوم");
      setAvailableFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleBranchChange = async (value) => {
    setBranchGuid(value);

    const found = branches.find((b) => b.branchGuid === value);
    setBranchName(found?.branchName || "");

    setRegType("");
    setStudyType("");
    setBatchGuid("");
    setBatchName("");
    setContextData(null);
    setAvailableDiplomas([]);
    setAvailableFees([]);
    setSelectedDiplomas([]);
    setSelectedFees([]);
    setBatches([]);
    setNotes("");
    setAmount(0);
    setError("");

    if (value) {
      // await Swal.fire({
      //   icon: "success",
      //   title: "تم اختيار الفرع",
      //   text: found?.branchName || "تم اختيار الفرع بنجاح، انتقل الآن إلى نوع التسجيل.",
      //   timer: 900,
      //   showConfirmButton: false,
      //   position: "center",
      //   heightAuto: false
      // });
    }
  };

  const handleRegTypeChange = async (value) => {
    const nextRegType = Number(value);

    setError("");
    setRegType("");
    setStudyType("");
    setBatchGuid("");
    setBatchName("");
    setContextData(null);
    setAvailableDiplomas([]);
    setAvailableFees([]);
    setSelectedDiplomas([]);
    setSelectedFees([]);
    setBatches([]);
    setNotes("");
    setAmount(0);

    if (!branchGuid) {
      await showSweetWarning("برجاء اختيار الفرع أولاً.", "اختار الفرع");
      return;
    }

    if (nextRegType === 0) {
      try {
        setContextLoading(true);
        const activeDiploma = await checkStudentActiveDiploma();

        if (activeDiploma?.hasActiveDiploma) {
          const message =
            activeDiploma?.message ||
            `الطالب مسجل بالفعل في دبلوم: ${activeDiploma?.diplomName || ""}`;

          setError(message);
          await showSweetWarning(message);
          return;
        }
      } catch (err) {
        const message = err.message || "حدث خطأ أثناء فحص دبلوم الطالب الحالي";
        setError(message);
        await showSweetError(message);
        return;
      } finally {
        setContextLoading(false);
      }
    }

    setRegType(nextRegType);
  };

  const handleStudyTypeChange = async (value) => {
    const nextStudyType = Number(value);

    if (!branchGuid) {
      await showSweetWarning("برجاء اختيار الفرع أولاً.", "اختار الفرع");
      return;
    }

    if (regType === "" || regType === null || regType === undefined) {
      await showSweetWarning("برجاء اختيار نوع التسجيل أولاً.", "اختار نوع التسجيل");
      return;
    }

    setStudyType(nextStudyType);
    setBatchGuid("");
    setBatchName("");
    setContextData(null);
    setAvailableDiplomas([]);
    setAvailableFees([]);
    setSelectedDiplomas([]);
    setSelectedFees([]);
    setBatches([]);
    setError("");

    await loadContext(branchGuid, regType, nextStudyType);
  };

  const handleBatchChange = async (value) => {
    setBatchGuid(value);

    const found = batches.find((b) => b.batchGuid === value);
    setBatchName(found?.batchName || "");
    setSelectedDiplomas([]);
    setAvailableDiplomas([]);

    if (!value) {
      setError("");
      return;
    }

    if (found && toNumber(found.availableSeats) <= 0) {
      const message = "هذه الدفعة لا يوجد بها مقاعد متاحة حالياً، برجاء اختيار دفعة أخرى.";
      setError(message);
      await showSweetWarning(message, "لا توجد مقاعد");
      return;
    }

    setError("");

    await loadDiplomas(
      contextData?.priceSaleGuid,
      regType,
      branchGuid,
      value
    );
  };

  const checkSeat = async (diplomGuid) => {
    const params = new URLSearchParams({
      branchGuid,
      batchGuid,
      diplomGuid,
      regType: String(regType)
    });

    const result = await fetchJson(
      `${apiBaseUrl}/api/admission-order/check-seat?${params.toString()}`
    );

    return result;
  };

  const addDiploma = async (row) => {
    try {
      if (!contextData) {
        const message = "برجاء اختيار الفرع أولاً حتى يتم تجهيز بيانات طلب الالتحاق.";
        setError(message);
        await showSweetWarning(message);
        return;
      }

      if (!batchGuid) {
        const message = "برجاء اختيار الدفعة أولاً، ثم اختر الدبلوم / الدورة.";
        setError(message);
        await showSweetWarning(message, "اختار الدفعة أولاً");
        return;
      }

      if (selectedDiplomas.some((x) => x.diplomGuid === row.diplomGuid)) {
        const message = "تم اختيار الدبلوم / الدورة مسبقًا";
        setError(message);
        await showSweetWarning(message);
        return;
      }

      const seatResult = await checkSeat(row.diplomGuid);

      if (!seatResult?.hasSeat) {
        const defaultMessage =
          Number(regType) === 0
            ? "عذراً، التخصص الذي قمت باختياره لا تتوفر أي مقاعد للتسجيل فيه"
            : Number(regType) === 1
            ? "عذراً، الدورة التأهيلية التي قمت باختيارها لا تتوفر لها مقاعد في هذه الدفعة"
            : "عذراً، الدورة التطويرية التي قمت باختيارها لا تتوفر لها مقاعد في هذه الدفعة";

        const message = seatResult?.message || defaultMessage;

        setError(message);
        await showSweetWarning(message, "لا توجد مقاعد متاحة");
        return;
      }

      if (selectedDiplomas.length > 0) {
        const ok = await showSweetConfirm(
          "هناك دبلوم / دورة مختارة بالفعل. هل تريد استبداله؟",
          "تأكيد الاستبدال"
        );
        if (!ok) return;
      }

      setSelectedDiplomas([{ ...row, id: row.diplomGuid || row.id }]);
      setError("");
    } catch (err) {
      const message = err.message || "حدث خطأ أثناء فحص المقاعد";
      setError(message);
      await showSweetError(message);
    }
  };

  const removeDiploma = (row) => {
    setSelectedDiplomas((prev) => prev.filter((x) => x.diplomGuid !== row.diplomGuid));
  };

  const addFee = async (row) => {
    if (selectedFees.some((x) => x.feeGuid === row.feeGuid)) {
      const message = "تم اختيار الرسم مسبقاً";
      setError(message);
      await showSweetWarning(message);
      return;
    }

    setSelectedFees((prev) => [...prev, { ...row, id: row.feeGuid || row.id }]);
    setError("");
  };

  const removeFee = (row) => {
    setSelectedFees((prev) => prev.filter((x) => x.feeGuid !== row.feeGuid));
  };

  const handlePayTypeChange = async (value) => {
    const nextPayType = Number(value);

    setPayType(nextPayType);
    setError("");

    if (nextPayType === 0) {
      setDeviceId("");
      setRef("");
      setSelectedBank(null);
      await loadBranchCashbox(getBranchForWork() || branchGuid);
    }

    if (nextPayType === 1) {
      setRef("");
      setSelectedBank(null);
      await loadDefaultNetworkBank();
    }

    if (nextPayType === 2) {
      setDeviceId("");
      await loadBanks("");
      setBankDialogOpen(true);
    }
  };

  const showValidationAlert = async (message, title = "تنبيه") => {
    setError(message);
    await showSweetWarning(message, title);
    return false;
  };

  const showValidationError = async (message, title = "خطأ") => {
    setError(message);
    await showSweetError(message, title);
    return false;
  };

  const validateReference = async () => {
    if (payType !== 2) return true;

    const bankName = selectedBank?.bankName || "";
    const input = String(ref || "").trim();

    if (bankName === "بنك الراجحي") {
      const pattern = /^[0-9]{4,}\s*[A-Za-zء-يآ-ى]+$/;
      const firstFour = input.length >= 4 ? input.substring(0, 4) : "";
      const allZeros = firstFour.split("").every((x) => x === "0");

      if (!pattern.test(input) || allZeros) {
        return await showValidationAlert(
          "مرجع الراجحي يجب أن يبدأ بـ 4 أرقام غير أصفار يتبعها الاسم الأول. مثال: 1234 احمد",
          "رقم المرجع غير صحيح"
        );
      }
    }

    if (bankName === "بنك الجزيرة") {
      const allDigits = /^[0-9]+$/.test(input);
      const allZeros = input.split("").every((x) => x === "0");

      if (input.length !== 8 || !allDigits || allZeros) {
        return await showValidationAlert(
          "مرجع بنك الجزيرة يجب أن يكون 8 أرقام صحيحة بدون حروف.",
          "رقم المرجع غير صحيح"
        );
      }
    }

    return true;
  };

  const validateBeforeSave = async () => {
    if (!contextData) {
      return await showValidationAlert("برجاء تجهيز بيانات طلب الالتحاق أولاً");
    }

    if (!accountGuid) {
      return await showValidationError("لا يمكن قراءة حساب الطالب");
    }

    if (!branchGuid) {
      return await showValidationAlert("برجاء اختيار الفرع");
    }

    if (regType === "" || regType === null || regType === undefined) {
      return await showValidationAlert("برجاء اختيار نوع التسجيل");
    }

    if (studyType === "" || studyType === null || studyType === undefined) {
      return await showValidationAlert("برجاء اختيار نوع الدراسة");
    }

    if (!batchGuid) {
      return await showValidationAlert("برجاء اختيار الدفعة أولاً");
    }

    if (selectedDiplomas.length === 0) {
      return await showValidationAlert("برجاء اختيار الدبلوم / الدورة أولاً");
    }

    if (contextData?.chkOtherFees && selectedFees.length === 0) {
      return await showValidationAlert("برجاء اختيار الرسوم أولاً");
    }

    if (platformId === "" || platformId === null || platformId === undefined) {
      return await showValidationAlert("برجاء اختيار منصة التعارف أولاً");
    }

   const payAmountNumber = toNumber(amount);

if (payAmountNumber <= 0) {
  return await showValidationAlert(
    Number(regType) === 0
      ? "برجاء إدخال قيمة الدفعة المقدمة"
      : "برجاء إدخال قيمة الدفعة المقدمة للدورة، ويجب أن تكون أكبر من صفر"
  );
}

// تطبيق الحد الأدنى المحدد على الدبلومات فقط
if (
  Number(regType) === 0 &&
  contextData?.chkStartPay &&
  minStartPay > 0 &&
  payAmountNumber < minStartPay
) {
  return await showValidationAlert(
    `قيمة الدفعة المقدمة لا يمكن أن تقل عن ${money(minStartPay)}`
  );
}

if (
  totals.subTotal > 0 &&
  payAmountNumber > totals.subTotal
) {
  return await showValidationAlert(
    "قيمة الدفعة المقدمة لا يمكن أن تكون أكبر من الصافي"
  );
}

    if (payType === 0 && !branchCashboxInfo?.cashBoxGuid) {
      return await showValidationError("لا يوجد صندوق مكتب خاص بالفرع، برجاء التواصل مع الدعم الفني");
    }

    if (payType === 1 && !deviceId.trim()) {
      return await showValidationAlert("برجاء إدخال كود ماكينة الشبكة");
    }

    if (payType === 1 && !networkBankInfo?.bankGuid) {
      return await showValidationError("لا يوجد بنك شبكة افتراضي، برجاء التواصل مع الدعم الفني");
    }

    if (payType === 2 && !selectedBank?.bankGuid) {
      return await showValidationAlert("برجاء اختيار البنك");
    }

    if (payType === 2 && !ref.trim()) {
      return await showValidationAlert("برجاء إدخال رقم المرجع");
    }

    if (!(await validateReference())) {
      return false;
    }

    if (attachIdRequired && !attachId) {
      return await showValidationAlert("يجب اختيار صورة الهوية ");
    }

    if (attachTransferRequired && !attachTransfer) {
      return await showValidationAlert(" يجب اختيار صورة الحوالة ");
    }

    if (attachCertificateRequired && !attachCertificate) {
      return await showValidationAlert(" يجب اختيار صورة الشهادة  ");
    }

    return true;
  };

  const uploadAttachment = async (file, type) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nationalId", nationalId);
    formData.append("type", type);

    await fetchJson(`${apiBaseUrl}/api/admission-order/upload-attachment`, {
      method: "POST",
      body: formData
    });
  };

  const cancelOrder = async (orderGuid) => {
    if (!orderGuid) return;

    try {
      await fetchJson(`${apiBaseUrl}/api/admission-order/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderGuid })
      });
    } catch {
      // لا نوقف رسالة الخطأ الأصلية
    }
  };

  const uploadAttachmentsAfterSave = async (orderGuid) => {
    try {
      await uploadAttachment(attachId, "ID");

      if (attachTransfer) {
        await uploadAttachment(attachTransfer, "trans");
      }

      if (attachCertificate) {
        await uploadAttachment(attachCertificate, "Certifcat");
      }
    } catch (err) {
      await cancelOrder(orderGuid);
      throw new Error(
        err.message ||
          "تم حفظ الطلب لكن فشل رفع المرفقات، وتم إلغاء الطلب. برجاء المحاولة مرة أخرى."
      );
    }
  };


  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const buildLocalPrintData = (savedResult = {}) => {
    const rows = [...selectedDiplomas, ...selectedFees].map((item) => ({
      name: item.diplomName || item.feeName || item.name || "-",
      cost: toNumber(item.cost),
      tax: toNumber(item.tax),
      subTotal: toNumber(item.subTotal)
    }));

    return {
      code: savedResult?.code || "",
      orderGuid: savedResult?.orderGuid || "",
      formDate: new Date().toISOString().slice(0, 10),
      customerName: studentName,
      nationalId,
      mobileNo: studentTel,
      sellerName:
        getCurrentUser()?.fullName ||
        getCurrentUser()?.FullName ||
        getCurrentUser()?.userName ||
        getCurrentUser()?.UserName ||
        "-",
      branchName,
      notes,
      total: totals.total,
      tax: totals.tax,
      subTotal: totals.subTotal,
      paidAmount: toNumber(amount),
      rows
    };
  };

const openAdmissionPrint = async (printData) => {
  const data = printData || lastPrintData;

  if (!data) {
    showSweetWarning("احفظ الطلب أولاً ثم اطبع طلب الالتحاق");
    return;
  }

  const rows = Array.isArray(data.rows) && data.rows.length ? data.rows : [];

  const refundPolicyUrl =
    "https://sstli.com/%d8%b3%d9%8a%d8%a7%d8%b3%d9%8a%d8%a9-%d8%a7%d9%84%d8%a5%d8%b3%d8%aa%d8%b1%d8%af%d8%a7%d8%af-%d8%a7%d9%84%d9%85%d8%a7%d9%84%d9%8a/";

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    refundPolicyUrl
  )}`;

  const printWindow = isCompact
    ? null
    : window.open(
        "",
        "_blank",
        "width=980,height=950"
      );

  if (!isCompact && !printWindow) {
    showSweetWarning(
      "المتصفح منع فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى."
    );
    return;
  }

  const html = `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>طلب التحاق رقم ${escapeHtml(data.code || "")}</title>

  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      width: 210mm;
      height: 297mm;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #ffffff;
      color: #17212b;
      font-family: Tahoma, Arial, sans-serif;
    }

    body {
      direction: rtl;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0;
      padding: 10mm 12mm 11mm;
      overflow: hidden;
      position: relative;
      background: #ffffff;
      page-break-after: avoid;
      break-after: avoid-page;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }

    .page::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 4mm;
      background: linear-gradient(90deg, #ae1e21 0 22%, #d3a72c 22% 34%, #057546 34% 100%);
    }

    .header {
      display: grid;
      grid-template-columns: 31mm 1fr 31mm;
      align-items: center;
      gap: 5mm;
      min-height: 31mm;
      padding: 2mm 1mm 4mm;
      border-bottom: 0.7mm solid #17212b;
    }

    .logo-box {
      width: 31mm;
      height: 27mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.25mm solid #d8dedb;
      border-radius: 3mm;
      background: #ffffff;
      box-shadow: 0 1mm 3mm rgba(0, 0, 0, 0.06);
    }

    .logo-box img {
      width: 22mm;
      height: 22mm;
      object-fit: contain;
      display: block;
    }

    .company-box {
      text-align: center;
      line-height: 1.65;
      min-width: 0;
    }

    .company-name {
      font-size: 15px;
      font-weight: 900;
      color: #17362b;
      margin-bottom: 0.6mm;
    }

    .company-branch {
      font-size: 11.5px;
      font-weight: 800;
      color: #4c5b55;
      min-height: 6mm;
    }

    .company-numbers {
      display: flex;
      justify-content: center;
      gap: 5mm;
      margin-top: 1mm;
      direction: ltr;
      font-size: 10.5px;
      font-weight: 900;
      color: #17212b;
    }

    .header-space {
      width: 31mm;
    }

    .title-wrap {
      text-align: center;
      margin: 5mm 0 4mm;
    }

    .title {
      display: inline-block;
      margin: 0;
      padding: 1.8mm 12mm;
      border-radius: 20mm;
      background: #edf7f2;
      border: 0.3mm solid #bad9ca;
      color: #075b39;
      font-size: 20px;
      font-weight: 900;
    }

    .info-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      padding: 4mm;
      border: 0.25mm solid #d8dfdc;
      border-radius: 3mm;
      background: #fbfdfc;
      margin-bottom: 4mm;
    }

    .info-col {
      min-width: 0;
    }

    .info-row {
      display: grid;
      grid-template-columns: 26mm minmax(0, 1fr) 24mm;
      align-items: center;
      min-height: 7mm;
      gap: 1.5mm;
      border-bottom: 0.2mm solid #e2e7e4;
      font-size: 10.5px;
      direction: ltr;
    }

    .info-row:last-child {
      border-bottom: 0;
    }

    .en {
      text-align: left;
      direction: ltr;
      font-weight: 800;
      color: #5c6863;
      white-space: nowrap;
    }

    .val {
      text-align: center;
      direction: rtl;
      font-weight: 900;
      color: #17212b;
      overflow-wrap: anywhere;
    }

    .val.ltr {
      direction: ltr;
    }

    .ar {
      text-align: right;
      direction: rtl;
      font-weight: 900;
      color: #075b39;
      white-space: nowrap;
    }

    .items-wrap {
      border: 0.25mm solid #cfd8d3;
      border-radius: 2.5mm;
      overflow: hidden;
      margin-bottom: 4mm;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      direction: rtl;
      font-size: 10.5px;
    }

    .items-table th {
      background: #e7eee9;
      color: #17362b;
      border-left: 0.2mm solid #cbd5d0;
      padding: 2.3mm 1.2mm;
      font-weight: 900;
      text-align: center;
    }

    .items-table th:last-child {
      border-left: 0;
    }

    .items-table td {
      padding: 2.5mm 1.2mm;
      border-top: 0.2mm solid #dde4e0;
      border-left: 0.2mm solid #e6ebe8;
      text-align: center;
      font-weight: 800;
      color: #17212b;
      overflow-wrap: anywhere;
    }

    .items-table td:last-child {
      border-left: 0;
    }

    .items-table tbody tr:nth-child(even) {
      background: #fafcfb;
    }

    .items-table .statement {
      width: 46%;
      text-align: right;
      padding-right: 2mm;
    }

    .bottom {
      display: grid;
      grid-template-columns: 36mm minmax(0, 1fr) 79mm;
      gap: 5mm;
      align-items: start;
      direction: ltr;
      padding-top: 1mm;
    }

    .qr-card {
      width: 36mm;
      padding: 2mm;
      text-align: center;
      direction: rtl;
      border: 0.25mm solid #d5ddd9;
      border-radius: 2.5mm;
      background: #ffffff;
    }

    .qr-card img {
      width: 27mm;
      height: 27mm;
      object-fit: contain;
      display: block;
      margin: 0 auto 1mm;
    }

    .qr-caption {
      font-size: 8.5px;
      font-weight: 900;
      line-height: 1.4;
      color: #32423b;
    }

    .paid-card {
      min-height: 38mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 0.25mm dashed #b8c8c0;
      border-radius: 2.5mm;
      background: #f8fbf9;
      direction: rtl;
    }

    .paid-card .label {
      font-size: 10px;
      font-weight: 900;
      color: #56635d;
      margin-bottom: 2mm;
    }

    .paid-card .amount {
      font-size: 23px;
      font-weight: 900;
      color: #ae1e21;
      direction: ltr;
      line-height: 1;
    }

    .paid-card .currency {
      margin-top: 1.5mm;
      font-size: 13px;
      font-weight: 900;
      color: #17362b;
    }

    .totals-table {
      width: 79mm;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 0.25mm solid #aebbb5;
      border-radius: 2.5mm;
      direction: rtl;
      font-size: 10.5px;
      font-weight: 900;
    }

    .totals-table td {
      padding: 2.5mm 2mm;
      border-bottom: 0.2mm solid #cfd8d3;
      vertical-align: middle;
    }

    .totals-table tr:last-child td {
      border-bottom: 0;
    }

    .totals-table .label {
      width: 65%;
      text-align: right;
      background: #f1f6f3;
      color: #17362b;
    }

    .totals-table .value {
      width: 35%;
      text-align: center;
      direction: ltr;
      background: #ffffff;
      color: #17212b;
      border-right: 0.2mm solid #cfd8d3;
      white-space: nowrap;
    }

    .notice {
      position: absolute;
      right: 12mm;
      left: 12mm;
      bottom: 18mm;
      padding: 2.2mm 4mm;
      border-radius: 2mm;
      background: #fff7f7;
      border: 0.25mm solid #edc8ca;
      text-align: center;
      color: #8c171b;
      font-size: 11px;
      font-weight: 900;
    }

    .footer {
      position: absolute;
      right: 12mm;
      left: 12mm;
      bottom: 8mm;
      display: grid;
      grid-template-columns: 48mm 1fr 30mm;
      align-items: center;
      gap: 3mm;
      padding-top: 2mm;
      border-top: 0.25mm solid #d8dfdc;
      direction: ltr;
      font-size: 8.8px;
      font-weight: 800;
      color: #5a6761;
    }

    .footer-date {
      text-align: left;
      direction: ltr;
      white-space: nowrap;
    }

    .footer-center {
      text-align: center;
      direction: rtl;
      color: #17362b;
      font-size: 9.5px;
      font-weight: 900;
    }

    .footer-page {
      text-align: right;
      direction: ltr;
      white-space: nowrap;
    }

    @media print {
      html,
      body {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        overflow: hidden !important;
      }

      .page {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        break-after: avoid-page !important;
      }
    }
  </style>
${PRINT_READY_SCRIPT}</head>

<body>
  <main class="page">
    <header class="header">
      <div class="logo-box">
        <img src="${sstliLogo}" alt="SSTLI Logo" />
      </div>

      <div class="company-box">
        <div class="company-name">شركة معهد السعودي المتخصص العالي للتدريب</div>
        <div class="company-branch">${escapeHtml(data.branchName || branchName || "")}</div>
        <div class="company-numbers">
          <span>920012673</span>
          <span>312191561600003</span>
        </div>
      </div>

      <div class="header-space"></div>
    </header>

    <div class="title-wrap">
      <h1 class="title">طلب التحاق</h1>
    </div>

    <section class="info-card">
      <div class="info-col">
        <div class="info-row">
          <div class="en">Form No</div>
          <div class="val ltr">${escapeHtml(data.code || "")}</div>
          <div class="ar">رقم الطلب</div>
        </div>

        <div class="info-row">
          <div class="en">Form Date</div>
          <div class="val ltr">${escapeHtml(data.formDate || "")}</div>
          <div class="ar">تاريخ الطلب</div>
        </div>

        <div class="info-row">
          <div class="en">Seller Name</div>
          <div class="val">${escapeHtml(data.sellerName || "")}</div>
          <div class="ar">البائع</div>
        </div>
      </div>

      <div class="info-col">
        <div class="info-row">
          <div class="en">Customer Name</div>
          <div class="val">${escapeHtml(data.customerName || "")}</div>
          <div class="ar">اسم العميل</div>
        </div>

        <div class="info-row">
          <div class="en">ID Number</div>
          <div class="val ltr">${escapeHtml(data.nationalId || "")}</div>
          <div class="ar">رقم الهوية</div>
        </div>

        <div class="info-row">
          <div class="en">Mobile No</div>
          <div class="val ltr">${escapeHtml(data.mobileNo || "")}</div>
          <div class="ar">رقم الجوال</div>
        </div>
      </div>
    </section>

    <section class="items-wrap">
      <table class="items-table">
        <thead>
          <tr>
            <th class="statement">البيان</th>
            <th>القيمة</th>
            <th>الضريبة</th>
            <th>مبلغ الضريبة</th>
            <th>الصافي</th>
          </tr>
        </thead>

        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (r) => `
                      <tr>
                        <td class="statement">${escapeHtml(r.name || "")}</td>
                        <td>${money(r.cost)}</td>
                        <td>${money(r.tax)}</td>
                        <td>${money(r.tax)}</td>
                        <td>${money(r.subTotal)}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `
                <tr>
                  <td class="statement">-</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                </tr>
              `
          }
        </tbody>
      </table>
    </section>

    <section class="bottom">
      <div class="qr-card">
        <img src="${qrUrl}" alt="QR سياسة الاسترداد" />
        <div class="qr-caption">يرجى مراجعة سياسة الاسترداد</div>
      </div>

      <div class="paid-card">
        <div class="label">المبلغ المدفوع</div>
        <div class="amount">${money(data.paidAmount)}</div>
        <div class="currency">ريال سعودي</div>
      </div>

      <table class="totals-table">
        <tr>
          <td class="label">الإجمالي قبل الضريبة</td>
          <td class="value">${money(data.total)}</td>
        </tr>
        <tr>
          <td class="label">ضريبة القيمة المضافة 15%</td>
          <td class="value">${money(data.tax)}</td>
        </tr>
        <tr>
          <td class="label">الإجمالي بعد الضريبة</td>
          <td class="value">${money(data.subTotal)}</td>
        </tr>
        <tr>
          <td class="label">المدفوع</td>
          <td class="value">${money(data.paidAmount)}</td>
        </tr>
      </table>
    </section>

    <div class="notice">المبالغ المدفوعة لرسوم دراسية غير مستردة</div>

    <footer class="footer">
      <div class="footer-date">
        ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </div>

      <div class="footer-center">شركة معهد السعودي المتخصص العالي للتدريب</div>
      <div class="footer-page">Page 1 of 1</div>
    </footer>
  </main>

  <script>
    window.addEventListener("load", function () {
      const images = Array.from(document.images || []);

      Promise.all(
        images.map(function (image) {
          if (image.complete) return Promise.resolve();

          return new Promise(function (resolve) {
            image.onload = resolve;
            image.onerror = resolve;
          });
        })
      ).then(function () {
        setTimeout(function () {
          window.focus();
          printWhenReady();
        }, 300);
      });
    });
  </script>
</body>
</html>
`;

  if (isCompact) {
    try {
      await exportHtmlDocumentToPdf({
        html,
        fileName: `طلب-التحاق-${data.code || "طلب"}.pdf`,
        selector: ".page, main, body",
        scale: isPhone ? 2 : 2.25
      });
    } catch (pdfError) {
      await showSweetError(
        pdfError?.message ||
          "تعذر تصدير طلب الالتحاق PDF"
      );
    }

    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

  const handleSave = async () => {
    if (!(await validateBeforeSave())) return;

    const permissionUser = getAdmissionUserPayload();

    if (!permissionUser.userGuid) {
      await showValidationError("لا يمكن قراءة المستخدم الحالي من localStorage");
      return;
    }

    if (!permissionUser.staut) {
      await showValidationError("المستخدم الحالي غير نشط ولا يمكنه إضافة طلب التحاق");
      return;
    }

    try {
      setSaving(true);
      setContextLoading(true);
      setError("");

      if (regType === 0) {
        const blocked = await stopIfStudentHasActiveDiploma();
        if (blocked) return;
      }

      const body = {
        sellerGuid: getSellerGuid(),
        userGuid: getUserGuid(),
        user: getAdmissionUserPayload(),

        accountGuid,
        regDocGuid: contextData.regDocGuid,
        payDocGuid: contextData.docPayGuid,
        branchGuid,
        batchGuid: batchGuid || NO_GUID,

        isPackage: false,
        packageGuid: NO_GUID,

        notes: Number(regType) === 0 ? notes : "",
        platformId: Number(platformId),

        total: totals.total,
        tax: totals.tax,
        subTotal: totals.subTotal,

        amount: toNumber(amount),
        payType,

        cashBoxGuid: payType === 0 ? currentPaymentGuid : NO_GUID,
        deviceId: payType === 1 ? deviceId : "",
        bankGuid: payType !== 0 ? currentPaymentGuid : NO_GUID,
        ref: payType === 1 ? deviceId : ref,
        payDate,

        regType,
        studyType,

        fessDocGuid: contextData?.chkOtherFees ? contextData?.fessDocGuid || NO_GUID : NO_GUID,
        costCenterGuid: currentCostCenterGuid || NO_GUID,

        actionReason: "",

        diplomas: selectedDiplomas.map((item) => ({
          diplomGuid: item.diplomGuid,
          cost: toNumber(item.cost),
          tax: toNumber(item.tax),
          subTotal: toNumber(item.subTotal),
          diplomType: Number(item.diplomType || 0),
          type: Number(item.studyType ?? regType)
        })),

        fees: selectedFees.map((item) => ({
          diplomGuid: item.feeGuid,
          cost: toNumber(item.cost),
          tax: toNumber(item.tax),
          subTotal: toNumber(item.subTotal),
          diplomType: Number(item.feeType || 0),
          type: 1
        })),

        packageDetails: []
      };

      const result = await fetchJson(`${apiBaseUrl}/api/admission-order/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      await uploadAttachmentsAfterSave(result?.orderGuid);

      const printData = result?.printData || buildLocalPrintData(result);
      setLastPrintData(printData);

      const printNow = await Swal.fire({
        icon: "success",
        title: "تم حفظ طلب الالتحاق بنجاح",
        text: `رقم الطلب: ${result?.code || ""}`,
        showCancelButton: true,
        confirmButtonText: isCompact ? "تصدير PDF" : "طباعة الآن",
        cancelButtonText: "إغلاق",
        confirmButtonColor: primaryColor,
        cancelButtonColor: "#6b7280",
        reverseButtons: true
      });

      if (printNow.isConfirmed) {
        openAdmissionPrint(printData);
      }

      onSaved?.(result);
    } catch (err) {
      const message = err.message || "حدث خطأ أثناء حفظ طلب الالتحاق";
      setError(message);
      await showSweetError(message);
    } finally {
      setSaving(false);
      setContextLoading(false);
    }
  };

  const availableDiplomaColumns = [
    {
      field: "actions",
      headerName: isCompact ? "+" : "إضافة",
      width: isPhone ? 38 : isTablet ? 46 : 90,
      minWidth: isPhone ? 38 : isTablet ? 46 : 90,
      maxWidth: isPhone ? 38 : isTablet ? 46 : 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title={isCompact ? "إضافة" : ""} arrow>
          <span>
            <Button
              size="small"
              variant="contained"
              onClick={() => addDiploma(params.row)}
              disabled={!canChooseDiploma}
              sx={uiLayout.withUiSx({
                minWidth: isPhone ? 26 : isTablet ? 30 : 62,
                width: isPhone ? 26 : isTablet ? 30 : "auto",
                height: isPhone ? 26 : isTablet ? 30 : "auto",
                p: isCompact ? 0 : undefined,
                borderRadius: isPhone ? "50%" : isTablet ? 1.5 : 2,
                fontWeight: 1000,
                fontSize: isPhone
                  ? "0.92rem"
                  : isTablet
                    ? "0.78rem"
                    : undefined,
                lineHeight: 1,
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                boxShadow: isCompact
                  ? "0 2px 6px rgba(5,117,70,0.18)"
                  : undefined,
                "&:hover": {
                  background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`
                }
              }, uiLayout.buttonSx)}
            >
              {isCompact ? "+" : "إضافة"}
            </Button>
          </span>
        </Tooltip>
      )
    },
    { field: "code", headerName: "الكود", width: 90, align: "center", headerAlign: "center" },
    {
      field: "diplomName",
      headerName: "الدبلوم / الدورة",
      flex: 1,
      minWidth: 280,
      renderCell: (params) => <EllipsisCell value={params.value} align="start" />
    },
    {
      field: "cost",
      headerName: "التكلفة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.tax} />
    },
    {
      field: "subTotal",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.subTotal} />
    }
  ];

  const selectedDiplomaColumns = [
    {
      field: "actions",
      headerName: "حذف",
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => removeDiploma(params.row)}
          sx={{ color: accentColor, backgroundColor: "#fff4f4" }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    },
    {
      field: "diplomName",
      headerName: "الدبلوم / الدورة المختارة",
      flex: 1,
      minWidth: 280,
      renderCell: (params) => <EllipsisCell value={params.value} align="start" />
    },
    {
      field: "cost",
      headerName: "التكلفة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.tax} />
    },
    {
      field: "subTotal",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.subTotal} />
    }
  ];

  const availableFeeColumns = [
    {
      field: "actions",
      headerName: isCompact ? "+" : "إضافة",
      width: isPhone ? 38 : isTablet ? 46 : 90,
      minWidth: isPhone ? 38 : isTablet ? 46 : 90,
      maxWidth: isPhone ? 38 : isTablet ? 46 : 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title={isCompact ? "إضافة" : ""} arrow>
          <span>
            <Button
              size="small"
              variant="contained"
              onClick={() => addFee(params.row)}
              sx={uiLayout.withUiSx({
                minWidth: isPhone ? 26 : isTablet ? 30 : 62,
                width: isPhone ? 26 : isTablet ? 30 : "auto",
                height: isPhone ? 26 : isTablet ? 30 : "auto",
                p: isCompact ? 0 : undefined,
                borderRadius: isPhone ? "50%" : isTablet ? 1.5 : 2,
                fontWeight: 1000,
                fontSize: isPhone
                  ? "0.92rem"
                  : isTablet
                    ? "0.78rem"
                    : undefined,
                lineHeight: 1,
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
                boxShadow: isCompact
                  ? "0 2px 6px rgba(5,117,70,0.18)"
                  : undefined,
                "&:hover": {
                  background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`
                }
              }, uiLayout.buttonSx)}
            >
              {isCompact ? "+" : "إضافة"}
            </Button>
          </span>
        </Tooltip>
      )
    },
    { field: "code", headerName: "الكود", width: 90, align: "center", headerAlign: "center" },
    {
      field: "feeName",
      headerName: "اسم الرسم",
      flex: 1,
      minWidth: 260,
      renderCell: (params) => <EllipsisCell value={params.value} align="start" />
    },
    {
      field: "cost",
      headerName: "التكلفة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.tax} />
    },
    {
      field: "subTotal",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.subTotal} />
    }
  ];

  const selectedFeeColumns = [
    {
      field: "actions",
      headerName: "حذف",
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => removeFee(params.row)}
          sx={{ color: accentColor, backgroundColor: "#fff4f4" }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    },
    {
      field: "feeName",
      headerName: "الرسوم المختارة",
      flex: 1,
      minWidth: 260,
      renderCell: (params) => <EllipsisCell value={params.value} align="start" />
    },
    {
      field: "cost",
      headerName: "التكلفة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.tax} />
    },
    {
      field: "subTotal",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row.subTotal} />
    }
  ];

  const bankColumns = [
    {
      field: "actions",
      headerName: "اختيار",
      width: 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setSelectedBank(params.row);
            setBankDialogOpen(false);
          }}
          sx={uiLayout.withUiSx({
            borderRadius: 2,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            "&:hover": { background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})` }
          }, uiLayout.buttonSx)}
        >
          اختيار
        </Button>
      )
    },
    {
      field: "bankName",
      headerName: "البيان",
      flex: 1,
      minWidth: 240,
      renderCell: (params) => <EllipsisCell value={params.value} align="start" />
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 120,
      align: "center",
      headerAlign: "center"
    }
  ];

  const gridSx = {
    border: `1px solid ${primaryLight}`,
    borderRadius: 3,
    backgroundColor: whiteColor,
    direction: "rtl",
    overflow: "hidden",
    width: "100%",
    minWidth: 0,
    "& .MuiDataGrid-columnHeaders": {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
      color: whiteColor,
      fontWeight: 1000,
      borderBottom: `1px solid ${primaryDark}`
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 1000,
      color: whiteColor,
      fontSize: isPhone ? "0.4rem" : isTablet ? "0.5rem" : undefined,
      lineHeight: 1.1,
      whiteSpace: "normal",
      textAlign: "center"
    },
    "& .MuiDataGrid-cell": {
      fontWeight: 800,
      borderColor: "#edf3f0",
      fontSize: isPhone ? "0.41rem" : isTablet ? "0.51rem" : undefined,
      px: isPhone ? 0.1 : isTablet ? 0.3 : undefined
    },
    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: "#fbfdfc"
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#f0faf5"
    },
    "& .MuiDataGrid-footerContainer": {
      direction: "rtl",
      minHeight: isPhone ? 36 : isTablet ? 40 : undefined
    },
    "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
      fontSize: isPhone ? "0.4rem" : isTablet ? "0.48rem" : undefined
    }
  };

  const loadingAny =
    branchesLoading ||
    contextLoading ||
    diplomasLoading ||
    feesLoading ||
    batchesLoading ||
    banksLoading ||
    saving;

  return (
    <>
      <style>{`
        .sstli-swal-popup {
          border-radius: 22px !important;
          direction: rtl !important;
          font-family: Cairo, Tahoma, Arial, sans-serif !important;
          box-shadow: 0 24px 70px rgba(5, 117, 70, 0.25) !important;
        }
        .sstli-swal-title {
          font-weight: 1000 !important;
          color: #1f2d3d !important;
        }
        .sstli-swal-text {
          font-weight: 800 !important;
          color: #475467 !important;
        }

        @media screen {
          .sstli-swal-popup {
            width: min(92vw, 420px) !important;
            padding: 0.75rem !important;
          }
          .sstli-swal-title {
            font-size: 0.88rem !important;
          }
          .sstli-swal-text {
            font-size: 0.66rem !important;
          }
        }

        @media (max-width: 599px) {
          .sstli-swal-popup {
            width: 88vw !important;
            padding: 0.55rem !important;
          }
          .sstli-swal-title {
            font-size: 0.76rem !important;
          }
          .sstli-swal-text {
            font-size: 0.58rem !important;
          }
        }
      `}</style>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xl"
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
            px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
            pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
            alignItems: isPhone ? "stretch" : "center"
          }
        }, uiLayout.dialogLayoutSx)}
        PaperProps={{
          sx: {
            width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
            maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : undefined,
            borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
            overflow: "hidden",
            direction: "rtl",
            height: isPhone
              ? "calc(100dvh - 58px)"
              : isTablet
                ? "calc(100dvh - 72px)"
                : "94vh",
            maxHeight: isPhone
              ? "calc(100dvh - 58px)"
              : isTablet
                ? "calc(100dvh - 72px)"
                : "94vh",
            m: 0,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${primaryLight}`,
            boxShadow: "0 18px 50px rgba(5,117,70,0.18)"
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            borderBottom: `1px solid ${primaryDark}`,
            py: isPhone ? 0.38 : isTablet ? 0.55 : 1.4,
            px: isPhone ? 0.5 : isTablet ? 0.8 : 2,
            flexShrink: 0
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: whiteColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.84rem" : "1.2rem",
                  lineHeight: 1.15
                }}
              >
                طلب الالتحاق
              </Typography>

              <Stack
                direction="row"
                spacing={isCompact ? 0.25 : 1}
                sx={{ mt: isCompact ? 0.25 : 0.8, minWidth: 0 }}
              >
                <Chip
                  label={isCompact ? studentName.split(/\s+/).filter(Boolean).slice(0, 2).join(" ") : studentName}
                  sx={{
                    fontWeight: 900,
                    backgroundColor: whiteColor,
                    color: primaryColor,
                    height: isPhone ? 22 : isTablet ? 25 : undefined,
                    maxWidth: isPhone ? 145 : isTablet ? 210 : undefined,
                    "& .MuiChip-label": {
                      px: isPhone ? 0.55 : isTablet ? 0.75 : undefined,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }
                  }}
                />
                <Chip
                  label={nationalId}
                  sx={{
                    fontWeight: 900,
                    backgroundColor: whiteColor,
                    color: primaryColor,
                    height: isPhone ? 22 : isTablet ? 25 : undefined,
                    "& .MuiChip-label": {
                      px: isPhone ? 0.5 : isTablet ? 0.7 : undefined,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }
                  }}
                />
                {!isPhone && (
                  <Chip
                    label={studentTel}
                    sx={{
                      fontWeight: 900,
                      backgroundColor: whiteColor,
                      color: primaryColor,
                      height: isTablet ? 25 : undefined,
                      "& .MuiChip-label": {
                        fontSize: isTablet ? "0.75rem" : undefined
                      }
                    }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={isCompact ? 0.08 : 1} sx={{ flexShrink: 0 }}>
              <Tooltip title="حفظ">
                <IconButton onClick={handleSave} disabled={saving} sx={{
                    color: whiteColor,
                    width: isPhone ? 24 : isTablet ? 28 : undefined,
                    height: isPhone ? 24 : isTablet ? 28 : undefined,
                    p: isCompact ? 0.25 : undefined,
                    "& svg": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined }
                  }}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>

              <Tooltip
                title={
                  lastPrintData
                    ? isCompact
                      ? "تصدير طلب الالتحاق PDF"
                      : "طباعة طلب الالتحاق"
                    : "احفظ الطلب أولاً"
                }
              >
                <span>
                  <IconButton
                    onClick={() => openAdmissionPrint(lastPrintData)}
                    disabled={!lastPrintData || saving}
                    sx={{
                    color: whiteColor,
                    width: isPhone ? 24 : isTablet ? 28 : undefined,
                    height: isPhone ? 24 : isTablet ? 28 : undefined,
                    p: isCompact ? 0.25 : undefined,
                    "& svg": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined }
                  }}
                  >
                    {isCompact ? (
                      <PictureAsPdfIcon />
                    ) : (
                      <PrintIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="تحديث">
                <IconButton onClick={loadContext} disabled={loadingAny} sx={{
                    color: whiteColor,
                    width: isPhone ? 24 : isTablet ? 28 : undefined,
                    height: isPhone ? 24 : isTablet ? 28 : undefined,
                    p: isCompact ? 0.25 : undefined,
                    "& svg": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined }
                  }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="إغلاق">
                <IconButton onClick={onClose} sx={{
                    color: whiteColor,
                    width: isPhone ? 24 : isTablet ? 28 : undefined,
                    height: isPhone ? 24 : isTablet ? 28 : undefined,
                    p: isCompact ? 0.25 : undefined,
                    "& svg": { fontSize: isPhone ? 14 : isTablet ? 16 : undefined }
                  }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: isPhone ? 0.3 : isTablet ? 0.55 : 2,
            background: `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,

            "& .MuiInputLabel-root": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            },
            "& .MuiSelect-select, & .MuiInputBase-input": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              py: isPhone ? 0.55 : isTablet ? 0.7 : undefined
            },
            "& .MuiOutlinedInput-root": {
              minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
              borderRadius: isCompact ? 1.3 : undefined
            },
            "& .MuiFormHelperText-root": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              mt: isCompact ? 0.15 : undefined
            },
            "& .MuiRadio-root": {
              p: isCompact ? 0.25 : undefined
            },
            "& .MuiFormControlLabel-label": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: isCompact ? 0.35 : 1.5,
                py: isCompact ? 0.15 : undefined,
                fontWeight: 900,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
              }}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.4} sx={{ mb: isCompact ? 0.45 : 1.6 }}>
            <Grid item xs={6} sm={6} md={3}>
              <TextInfo label="اسم الطالب" value={studentName} />
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <TextInfo label="رقم الهوية" value={nationalId} />
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <TextInfo label="الجوال" value={studentTel} />
            </Grid>
            <Grid item xs={6} sm={6} md={2.5} sx={{ display: isPhone ? "none" : "block" }}>
              <TextInfo label="دفتر التسجيل" value={contextData?.regDocName || "-"} />
            </Grid>
            <Grid item xs={6} sm={6} md={2.5} sx={{ display: isPhone ? "none" : "block" }}>
              <TextInfo
                label="قائمة السعر"
                value={contextData?.priceSaleNotes || contextData?.priceSource || "-"}
                strong={contextData?.ramadanOfferEnabled}
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: isPhone ? 0.35 : isTablet ? 0.55 : 1.5,
              mb: isCompact ? 0.45 : 1.5,
              borderRadius: isCompact ? 1.5 : 3,
              border: `1px solid ${primaryLight}`,
              backgroundColor: whiteColor,
              boxShadow: "0 10px 30px rgba(5,117,70,0.08)"
            }}
          >
            <Stack spacing={isCompact ? 0.4 : 1.4}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={isCompact ? 0.35 : 1}
              >

                {loadingAny && (
                  <Stack direction="row" alignItems="center" spacing={isCompact ? 0.35 : 1}>
                    <CircularProgress size={isPhone ? 15 : isTablet ? 18 : 22} sx={{ color: primaryColor }} />
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: primaryColor,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                      }}
                    >
                      جاري تحميل البيانات...
                    </Typography>
                  </Stack>
                )}
              </Stack>

              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.2} alignItems="stretch">
                <Grid item xs={6} sm={6} md={3.2} ref={branchStepRef}>
                  <StepGuideCard
                    number={1}
                    title="اختار الفرع"
                    hint="أول خطوة أساسية"
                    active={currentStep === 1}
                    done={Boolean(branchGuid)}
                  >
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                      <InputLabel>فرع الدراسة</InputLabel>
                      <Select
                        label="فرع الدراسة"
                        value={branchGuid}
                        displayEmpty
                        onChange={(e) => handleBranchChange(e.target.value)}
                      >
                        {/* <MenuItem value="" disabled>
                          اختر الفرع أولاً
                        </MenuItem> */}
                        {branches.map((branch) => (
                          <MenuItem key={branch.branchGuid} value={branch.branchGuid}>
                            {branch.branchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <InlineHint color={branchGuid ? primaryColor : accentColor}>
                      {branchGuid ? `تم اختيار: ${branchName}` : "ابدأ من هنا واختر الفرع المناسب."}
                    </InlineHint>
                  </StepGuideCard>
                </Grid>

                <Grid item xs={6} sm={6} md={2.1} ref={regTypeStepRef}>
                  <StepGuideCard
                    number={2}
                    title="نوع التسجيل"
                    hint="دبلوم أو دورة"
                    active={currentStep === 2}
                    done={regType !== "" && regType !== null && regType !== undefined}
                  >
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small" disabled={!branchGuid}>
                      <InputLabel>نوع التسجيل</InputLabel>
                      <Select
                        label="نوع التسجيل"
                        value={regType}
                        displayEmpty
                        onChange={(e) => handleRegTypeChange(e.target.value)}
                      >
                        {/* <MenuItem value="" disabled>
                          اختر نوع التسجيل
                        </MenuItem> */}
                        <MenuItem value={0}>دبلوم</MenuItem>
                        <MenuItem value={1}>دورة تأهيلية</MenuItem>
                        <MenuItem value={2}>دورة تطويرية</MenuItem>
                      </Select>
                    </FormControl>
                  </StepGuideCard>
                </Grid>

                <Grid item xs={6} sm={6} md={2.1} ref={studyTypeStepRef}>
                  <StepGuideCard
                    number={3}
                    title="نوع الدراسة"
                    hint="حضوري أو عن بعد"
                    active={currentStep === 3}
                    done={studyType !== "" && studyType !== null && studyType !== undefined}
                  >
                    <FormControl sx={uiLayout.formFieldSx}
                      fullWidth
                      size="small"
                      disabled={!branchGuid || regType === "" || regType === null || regType === undefined}
                    >
                      <InputLabel>نوع الدراسة</InputLabel>
                      <Select
                        label="نوع الدراسة"
                        value={studyType}
                        displayEmpty
                        onChange={(e) => handleStudyTypeChange(e.target.value)}
                      >
                        {/* <MenuItem value="" disabled>
                          اختر نوع الدراسة
                        </MenuItem> */}
                        <MenuItem value={0}>حضوري</MenuItem>
                        <MenuItem value={1}>عن بعد</MenuItem>
                      </Select>
                    </FormControl>
                  </StepGuideCard>
                </Grid>

                <Grid item xs={6} sm={6} md={2.6} ref={batchStepRef}>
                  <StepGuideCard
                    number={4}
                    title="اختار الدفعة"
                    hint="بعد الفرع مباشرة"
                    active={currentStep === 4}
                    done={Boolean(batchGuid)}
                  >
                    <FormControl sx={uiLayout.formFieldSx}
                      fullWidth
                      size="small"
                      disabled={
                        !branchGuid ||
                        studyType === "" ||
                        !contextData ||
                        !batches.length
                      }
                    >
                      <InputLabel>الدفعة</InputLabel>
                      <Select
                        label="الدفعة"
                        value={batchGuid}
                        displayEmpty
                        onChange={(e) => handleBatchChange(e.target.value)}
                      >
                        {/* <MenuItem value="" disabled>
                          اختر الدفعة
                        </MenuItem> */}
                        {batches.map((batch) => (
                          <MenuItem key={batch.batchGuid} value={batch.batchGuid}>
                            {batch.batchName} — مقاعد {money(batch.availableSeats)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <InlineHint color={noAvailableBatches ? accentColor : primaryColor}>
                      {noAvailableBatches
                        ? Number(regType) === 0
                          ? "لا توجد دفعات دبلومات متاحة لهذا الفرع."
                          : Number(regType) === 1
                          ? "لا توجد دفعات دورات تأهيلية متاحة لهذا الفرع."
                          : "لا توجد دفعات دورات تطويرية متاحة لهذا الفرع."
                        : batchGuid
                        ? `تم اختيار: ${batchName}`
                        : "اختر الدفعة المتاحة للفرع قبل اختيار الدبلوم / الدورة."}
                    </InlineHint>
                  </StepGuideCard>
                </Grid>

                <Grid item xs={6} sm={6} md={1.9} ref={diplomaStepRef}>
                  <StepGuideCard
                    number={5}
                    title="اختار التخصص"
                    hint="الخطوة التالية"
                    active={currentStep === 5}
                    done={selectedDiplomas.length > 0}
                  >
                    <Box
                      sx={{
                        p: isPhone ? 0.4 : isTablet ? 0.55 : 1.1,
                        borderRadius: isCompact ? 1.2 : 2,
                        backgroundColor: currentStep === 5 ? "#fff7f7" : primaryLight,
                        border: currentStep === 5 ? `1px dashed ${accentColor}` : `1px dashed ${primaryColor}`,
                        textAlign: "center"
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 1000,
                          color: currentStep === 5 ? accentColor : primaryColor,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          lineHeight: 1.2
                        }}
                      >
                        {selectedDiplomas.length ? "تم اختيار التخصص" : "انزل لقائمة التخصصات"}
                      </Typography>
                    </Box>
                  </StepGuideCard>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.4} sx={{ mb: isCompact ? 0.45 : 1.5 }}>
            <Grid item xs={6} sm={6} md={1.6}>
              <SummaryCard label="الإجمالي" value={totals.total} />
            </Grid>
            <Grid item xs={6} sm={6} md={1.6}>
              <SummaryCard label="الضريبة" value={totals.tax} />
            </Grid>
            <Grid item xs={6} sm={6} md={1.6}>
              <SummaryCard label="الصافي" value={totals.subTotal} color={primaryDark} />
            </Grid>
            <Grid item xs={6} sm={6} md={1.8}>
              <Paper
  elevation={0}
  sx={{
    px: isPhone ? 0.35 : isTablet ? 0.5 : 2,
    py: isPhone ? 0.3 : isTablet ? 0.4 : 1.25,
    borderRadius: isCompact ? 1.3 : 3,
    border: `1px solid ${primaryLight}`,
    backgroundColor: whiteColor,
    minWidth: 0,
    minHeight: isPhone ? 50 : isTablet ? 54 : 0,
    textAlign: "center"
  }}
>
  <Typography
    sx={{
      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.76rem",
      color: primaryColor,
      fontWeight: 900,
      lineHeight: 1.15
    }}
  >
    الحد الأدنى للدفعة المطلوبة
  </Typography>

  <Typography
    sx={{
      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1.15rem",
      lineHeight: 1.15,
      color:
        Number(regType) === 0 && contextData?.ramadanOfferEnabled
          ? accentColor
          : textColor,
      fontWeight: 1000
    }}
  >
    {minimumPayDisplay}
  </Typography>
</Paper>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <TextInfo label="نوع السداد الحالي" value={currentPaymentName} />
            </Grid>
            <Grid item xs={12} md={3.4}>
              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                label="الملاحظات"
                value={notes}
                onChange={(e) => {
                  const prefix = contextData?.ramadanPrefix
                    ? `${contextData.ramadanPrefix} - `
                    : "";

                  if (contextData?.ramadanOfferEnabled && !e.target.value.startsWith(prefix)) {
                    setNotes(prefix);
                    return;
                  }

                  setNotes(e.target.value);
                }}
                multiline
                minRows={isPhone ? 1 : isTablet ? 1 : 2}
                inputProps={{ style: { direction: "rtl", textAlign: "start", fontWeight: 800 } }}
              />
            </Grid>
          </Grid>

          <Stack spacing={isPhone ? 0.45 : isTablet ? 0.65 : 1.5}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.4,
                borderRadius: isCompact ? 1.5 : 3,
                border: `1px solid ${primaryLight}`,
                backgroundColor: whiteColor,
                boxShadow: "0 10px 30px rgba(5,117,70,0.06)"
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={isCompact ? 0.35 : 1}
                sx={{ mb: isCompact ? 0.35 : 1 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 1000,
                      color: textColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1rem",
                      lineHeight: 1.2
                    }}
                  >
                    2) اختيار التخصص والرسوم
                  </Typography>
                </Box>

                <Chip
                  label={`المتاح: ${availableDiplomas.length} تخصص / ${availableFees.length} رسوم`}
                  sx={{
                    fontWeight: 1000,
                    color: primaryColor,
                    backgroundColor: primaryLight,
                    height: isPhone ? 20 : isTablet ? 23 : undefined,
                    "& .MuiChip-label": {
                      px: isPhone ? 0.45 : isTablet ? 0.6 : undefined,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }
                  }}
                />
              </Stack>

              {!canChooseDiploma && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: isCompact ? 0.35 : 1.2,
                    py: isCompact ? 0.12 : undefined,
                    fontWeight: 900,
                    borderRadius: isCompact ? 1.2 : 2,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }}
                >
                  {branchGuid
                    ? "اختار الدفعة أولاً حتى يتم السماح باختيار التخصص."
                    : "اختار الفرع أولاً، وبعدها هتظهر الدفعات والتخصصات."}
                </Alert>
              )}

              <Grid container spacing={isCompact ? 0.45 : 1.2} sx={{ opacity: canChooseDiploma ? 1 : 0.62 }}>
                <Grid item xs={12} lg={contextData?.chkOtherFees ? 7 : 12}>
                  <Typography
                    sx={{
                      mb: isCompact ? 0.3 : 0.8,
                      fontWeight: 1000,
                      color: primaryColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }}
                  >
                    الدبلومات / الدورات المتاحة
                  </Typography>

                  <Box sx={uiLayout.withUiSx({ height: isPhone ? 190 : isTablet ? 230 : 330, minWidth: 0 }, uiLayout.tableContainerSx)}>
                    {availableDiplomas.length ? (
                      <DataGrid
                        rows={availableDiplomas}
                        columns={availableDiplomaColumns}
                        density="compact"
                        disableRowSelectionOnClick
                        disableColumnMenu={isCompact}
                        disableColumnFilter={isCompact}
                        rowHeight={isPhone ? 34 : isTablet ? 40 : undefined}
                        columnHeaderHeight={isPhone ? 32 : isTablet ? 38 : undefined}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                          pagination: {
                            paginationModel: { pageSize: 10, page: 0 }
                          }
                        }}
                        sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                      />
                    ) : (
                      <EmptyBox text="لا توجد دبلومات / دورات متاحة حتى الآن" />
                    )}
                  </Box>
                </Grid>

                {contextData?.chkOtherFees && (
                  <Grid item xs={12} lg={5}>
                    <Typography
                    sx={{
                      mb: isCompact ? 0.3 : 0.8,
                      fontWeight: 1000,
                      color: primaryColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }}
                  >
                      الرسوم المتاحة
                    </Typography>

                    <Box sx={uiLayout.withUiSx({ height: isPhone ? 190 : isTablet ? 230 : 330, minWidth: 0 }, uiLayout.tableContainerSx)}>
                      {availableFees.length ? (
                        <DataGrid
                          rows={availableFees}
                          columns={availableFeeColumns}
                          density="compact"
                          disableRowSelectionOnClick
                          pageSizeOptions={[10, 25, 50]}
                          initialState={{
                            pagination: {
                              paginationModel: { pageSize: 10, page: 0 }
                            }
                          }}
                          sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                        />
                      ) : (
                        <EmptyBox text="لا توجد رسوم متاحة" />
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.4,
                borderRadius: isCompact ? 1.5 : 3,
                border: `1px solid ${primaryLight}`,
                backgroundColor: whiteColor,
                boxShadow: "0 10px 30px rgba(5,117,70,0.06)"
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={isCompact ? 0.35 : 1}
                sx={{ mb: isCompact ? 0.35 : 1 }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 1000,
                      color: textColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1rem",
                      lineHeight: 1.2
                    }}
                  >
                    3) مراجعة الاختيارات
                  </Typography>
                </Box>

                <Chip
                  label={`المختار: ${selectedDiplomas.length} تخصص / ${selectedFees.length} رسوم`}
                  sx={{
                    fontWeight: 1000,
                    color: accentColor,
                    backgroundColor: "#fff4f4",
                    height: isPhone ? 20 : isTablet ? 23 : undefined,
                    "& .MuiChip-label": {
                      px: isPhone ? 0.45 : isTablet ? 0.6 : undefined,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }
                  }}
                />
              </Stack>

              <Grid container spacing={1.2}>
                <Grid item xs={12} lg={contextData?.chkOtherFees ? 7 : 12}>
                  <Typography
                    sx={{
                      mb: isCompact ? 0.3 : 0.8,
                      fontWeight: 1000,
                      color: primaryColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }}
                  >
                    الدبلوم / الدورة المختارة
                  </Typography>

                  <Box sx={uiLayout.withUiSx({ height: isPhone ? 125 : isTablet ? 155 : (selectedDiplomas.length ? 210 : 180), minWidth: 0 }, uiLayout.tableContainerSx)}>
                    {selectedDiplomas.length ? (
                      <DataGrid
                        rows={selectedDiplomas}
                        columns={selectedDiplomaColumns}
                        density="compact"
                        disableRowSelectionOnClick
                        disableColumnMenu={isCompact}
                        disableColumnFilter={isCompact}
                        rowHeight={isPhone ? 34 : isTablet ? 40 : undefined}
                        columnHeaderHeight={isPhone ? 32 : isTablet ? 38 : undefined}
                        hideFooter
                        sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                      />
                    ) : (
                      <EmptyBox text="لم يتم اختيار دبلوم / دورة" />
                    )}
                  </Box>
                </Grid>

                {contextData?.chkOtherFees && (
                  <Grid item xs={12} lg={5}>
                    <Typography
                    sx={{
                      mb: isCompact ? 0.3 : 0.8,
                      fontWeight: 1000,
                      color: primaryColor,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                    }}
                  >
                      الرسوم المختارة
                    </Typography>

                    <Box sx={uiLayout.withUiSx({ height: isPhone ? 125 : isTablet ? 155 : (selectedFees.length ? 210 : 180), minWidth: 0 }, uiLayout.tableContainerSx)}>
                      {selectedFees.length ? (
                        <DataGrid
                          rows={selectedFees}
                          columns={selectedFeeColumns}
                          density="compact"
                          disableRowSelectionOnClick
                          pageSizeOptions={[10, 25, 50]}
                          initialState={{
                            pagination: {
                              paginationModel: { pageSize: 10, page: 0 }
                            }
                          }}
                          sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
                        />
                      ) : (
                        <EmptyBox text="لم يتم اختيار رسوم" />
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.4,
                borderRadius: isCompact ? 1.5 : 3,
                border: `1px solid ${primaryLight}`,
                backgroundColor: whiteColor,
                boxShadow: "0 10px 30px rgba(5,117,70,0.06)"
              }}
            >
              <Typography
                sx={{
                  mb: isCompact ? 0.4 : 1,
                  fontWeight: 1000,
                  color: textColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1rem"
                }}
              >
                4) السداد وبيانات التعارف
              </Typography>

              <Grid container spacing={isPhone ? 0.4 : isTablet ? 0.6 : 1.5} alignItems="center">
                <Grid item xs={12} sm={6} md={2.2}>
                   <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
  fullWidth
  size="small"
  label="قيمة الدفعة المقدمة"
  value={amount}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setAmount("");
      return;
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      setAmount(value);
    }
  }}
  type="number"
  required
  inputProps={{
    min: 0.01,
    step: 0.01
  , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
  error={amount !== "" && toNumber(amount) <= 0}
  helperText={
    Number(regType) === 0 && minStartPay > 0
      ? `الحد الأدنى: ${money(minStartPay)}`
      : "يجب إدخال قيمة أكبر من صفر"
  }
/>
                </Grid>

                <Grid item xs={12} sm={6} md={3.5}>
                  <FormControl sx={uiLayout.formFieldSx}>
                    <Typography
                      sx={{
                        fontWeight: 1000,
                        color: textColor,
                        mb: isCompact ? 0.2 : 0.5,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      }}
                    >
                      نوع السداد
                    </Typography>
                    <RadioGroup
                      row
                      value={payType}
                      sx={uiLayout.withUiSx({
                        flexWrap: "nowrap",
                        gap: isCompact ? 0.15 : undefined,
                        "& .MuiFormControlLabel-root": {
                          mr: isCompact ? 0.2 : undefined,
                          ml: isCompact ? 0.2 : undefined
                        }
                      }, uiLayout.radioGroupSx)}
                      onChange={(e) => handlePayTypeChange(e.target.value)}
                    >
                      <FormControlLabel value={0} control={<Radio />} label="نقدي" />
                      <FormControlLabel value={1} control={<Radio />} label="شبكة" />
                      <FormControlLabel value={2} control={<Radio />} label="حوالة بنكية" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2.2}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    label="كود ماكينة الشبكة"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    disabled={payType !== 1}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.2}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    label="رقم المرجع"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    disabled={payType !== 2}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={1.9}>
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth
                    size="small"
                    label="تاريخ الحوالة"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    type="date"
                    disabled={payType !== 2}
                    InputLabelProps={{ shrink: true }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                    <InputLabel>منصة التعارف</InputLabel>
                    <Select
                      label="منصة التعارف"
                      value={platformId}
                      onChange={(e) => setPlatformId(e.target.value)}
                    >
                      {platforms.map((platform) => (
                        <MenuItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                  <TextInfo
                    label={payType === 0 ? "الخزينة" : payType === 1 ? "بنك الشبكة" : "البنك"}
                    value={currentPaymentName}
                  />
                </Grid>

                <Grid item xs={6} sm={6} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AccountBalanceIcon />}
                    disabled={payType !== 2}
                    onClick={() => {
                      loadBanks(bankSearch);
                      setBankDialogOpen(true);
                    }}
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 31 : isTablet ? 35 : 40,
                      borderRadius: isCompact ? 1.3 : 2,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      fontWeight: 1000,
                      "& .MuiButton-startIcon": { ml: 1, mr: 0 }
                    }, uiLayout.buttonSx)}
                  >
                    اختيار بنك
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.4,
                borderRadius: isCompact ? 1.5 : 3,
                border: `1px solid ${primaryLight}`,
                backgroundColor: whiteColor,
                boxShadow: "0 10px 30px rgba(5,117,70,0.06)"
              }}
            >
              <Typography
                sx={{
                  mb: isCompact ? 0.4 : 1,
                  fontWeight: 1000,
                  color: textColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "1rem"
                }}
              >
                5) المرفقات المطلوبة
              </Typography>

              <Grid container spacing={isPhone ? 0.4 : isTablet ? 0.6 : 1.5}>
                <Grid item xs={6} sm={6} md={4}>
                  <FileButton
                    label="الهوية"
                    required={attachIdRequired}
                    file={attachId}
                    onChange={setAttachId}
                    onRemove={() => setAttachId(null)}
                  />
                </Grid>

                <Grid item xs={6} sm={6} md={4}>
                  <FileButton
                    label="الحوالة"
                    required={attachTransferRequired}
                    file={attachTransfer}
                    disabled={payType !== 2}
                    onChange={setAttachTransfer}
                    onRemove={() => setAttachTransfer(null)}
                  />
                </Grid>

                <Grid item xs={6} sm={6} md={4}>
                  <FileButton
                    label="شهادة الثانوية"
                    required={attachCertificateRequired}
                    file={attachCertificate}
                    onChange={setAttachCertificate}
                    onRemove={() => setAttachCertificate(null)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            px: isPhone ? 0.35 : isTablet ? 0.55 : 2,
            py: isPhone ? 0.3 : isTablet ? 0.45 : 1.5,
            gap: isCompact ? 0.4 : 1,
            borderTop: `1px solid ${primaryLight}`,
            backgroundColor: whiteColor,
            flexShrink: 0,

            "& .MuiButton-root": {
              minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 1000,
              px: isPhone ? 1.2 : isTablet ? 1.6 : 4,
              backgroundColor: primaryColor,
              "&:hover": { backgroundColor: primaryDark },
              "& .MuiButton-startIcon": {
                ml: 1,
                mr: 0
              }
            }, uiLayout.buttonSx)}
          >
            {saving ? "جاري الحفظ..." : "حفظ طلب الالتحاق"}
          </Button>

          <Button
            onClick={onClose}
            variant="outlined"
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 1000,
              px: isPhone ? 1 : isTablet ? 1.4 : 4
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({ zIndex: 1850 }, uiLayout.dialogLayoutSx)}
        PaperProps={{
          sx: {
            width: isPhone ? "100vw" : isTablet ? "92vw" : undefined,
            height: isPhone ? "100dvh" : isTablet ? "78dvh" : 620,
            borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
            direction: "rtl",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 1000,
            py: isPhone ? 0.55 : isTablet ? 0.75 : 1.5,
            px: isPhone ? 0.7 : isTablet ? 1 : 2,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.78rem" : undefined
          }}
        >
          قائمة البنوك
        </DialogTitle>

        <DialogContent sx={{ p: isPhone ? 0.4 : isTablet ? 0.65 : 2 }}>
          <Stack direction="row" spacing={1} sx={uiLayout.withUiSx({ mb: 1 }, uiLayout.filterBarSx)}>
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              label="بحث"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadBanks(bankSearch);
              }}
            />

            <Button
              variant="contained"
              onClick={() => loadBanks(bankSearch)}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: primaryColor,
                "&:hover": { backgroundColor: primaryDark }
              }, uiLayout.buttonSx)}
            >
              بحث
            </Button>
          </Stack>

          {banksLoading ? (
            <Box sx={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={uiLayout.withUiSx({ height: isPhone ? "72dvh" : isTablet ? "62dvh" : 450 }, uiLayout.tableContainerSx)}>
              <DataGrid
                rows={banks}
                columns={bankColumns}
                density="compact"
                disableRowSelectionOnClick
                hideFooter
                sx={uiLayout.withUiSx(gridSx, uiLayout.dataGridSx)}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setBankDialogOpen(false)}
            sx={uiLayout.withUiSx({ borderRadius: 2, fontWeight: 1000 }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdmissionOrderDialog;