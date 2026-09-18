import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import AddCircleOutlineIcon
  from "@mui/icons-material/AddCircleOutline";
import BadgeIcon
  from "@mui/icons-material/Badge";
import BusinessIcon
  from "@mui/icons-material/Business";
import CalculateIcon
  from "@mui/icons-material/Calculate";
import LocalPhoneIcon
  from "@mui/icons-material/LocalPhone";
import PersonIcon
  from "@mui/icons-material/Person";
import PrintIcon
  from "@mui/icons-material/Print";
import ReceiptLongIcon
  from "@mui/icons-material/ReceiptLong";
import SaveIcon
  from "@mui/icons-material/Save";
import SearchIcon
  from "@mui/icons-material/Search";
import AccountBalanceWalletIcon
  from "@mui/icons-material/AccountBalanceWallet";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const today = () => {
  const value = new Date();

  return [
    value.getFullYear(),
    String(
      value.getMonth() + 1
    ).padStart(2, "0"),
    String(
      value.getDate()
    ).padStart(2, "0")
  ].join("-");
};

const normalizeGuid = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const readJson = async (response) => {
  const text =
    await response.text();

  let result = {};

  try {
    result = text
      ? JSON.parse(text)
      : {};
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.details ||
      text
        ?.replace(/<[^>]*>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim()
        ?.slice(0, 700) ||
      `تعذر تنفيذ الطلب - HTTP ${response.status}`
    );
  }

  return result;
};

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const showSuccess = (message) =>
  Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });

const money = (value) =>
  Number(value || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

const CashReceiptAcknowledgment = () => {
  const theme = useTheme();
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
        "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const userGuid = String(
    currentUser?.guid ||
    currentUser?.Guid ||
    ""
  ).trim();

  const userName = String(
    currentUser?.fullName ||
    currentUser?.userName ||
    ""
  ).trim();

  const [branches, setBranches] =
    useState([]);

  const [loadingBranches, setLoadingBranches] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [tafkeetLoading, setTafkeetLoading] =
    useState(false);

  const [form, setForm] = useState({
    code: "",
    guid: "",
    orderDate: today(),
    branchGuid: "",
    branchName: "",
    receiptMan: "",
    nationalId: "",
    receiptTel: "",
    amount: "",
    amountText: "",
    orderFor: "",
    isUse: true,
    createdByGuid: "",
    createdByName: ""
  });

  const isExisting =
    Boolean(form.guid);

  const updateForm = (
    field,
    value
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value
    }));

  const resetForm = useCallback(() => {
    setForm({
      code: "",
      guid: "",
      orderDate: today(),
      branchGuid: "",
      branchName: "",
      receiptMan: "",
      nationalId: "",
      receiptTel: "",
      amount: "",
      amountText: "",
      orderFor: "",
      isUse: true,
      createdByGuid: "",
      createdByName: ""
    });
  }, []);

  const loadBranches =
    useCallback(async () => {
      if (!userGuid) {
        return;
      }

      try {
        setLoadingBranches(true);

        const response =
          await fetch(
            `${API_BASE_URL}/api/cash-receipt-acknowledgments/branches?userGuid=${encodeURIComponent(userGuid)}`,
            {
              cache: "no-store"
            }
          );

        const result =
          await readJson(response);

        const values =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setBranches(values);
      } catch (error) {
        setBranches([]);

        await showError(
          error?.message ||
          "تعذر تحميل الفروع"
        );
      } finally {
        setLoadingBranches(false);
      }
    }, [userGuid]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    const total =
      Number(form.amount || 0);

    if (
      !total ||
      total <= 0
    ) {
      updateForm(
        "amountText",
        ""
      );

      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setTafkeetLoading(true);

          const response =
            await fetch(
              `${API_BASE_URL}/api/cash-receipt-acknowledgments/tafkeet?userGuid=${encodeURIComponent(userGuid)}&total=${encodeURIComponent(total)}`,
              {
                cache: "no-store"
              }
            );

          const result =
            await readJson(response);

          updateForm(
            "amountText",
            String(
              result?.data?.text ||
              ""
            )
          );
        } catch {
          updateForm(
            "amountText",
            ""
          );
        } finally {
          setTafkeetLoading(false);
        }
      },
      450
    );

    return () =>
      clearTimeout(timer);
  }, [
    form.amount,
    userGuid
  ]);

  const validate = () => {
    if (!form.branchGuid) {
      showError(
        "برجاء اختيار الفرع أولًا"
      );

      return false;
    }

    if (!form.receiptMan.trim()) {
      showError(
        "برجاء إدخال اسم المستفيد أولًا"
      );

      return false;
    }

    if (!form.nationalId.trim()) {
      showError(
        "برجاء إدخال هوية المستفيد أولًا"
      );

      return false;
    }

    if (!form.receiptTel.trim()) {
      showError(
        "برجاء إدخال جوال المستفيد أولًا"
      );

      return false;
    }

    if (
      !Number(form.amount) ||
      Number(form.amount) <= 0
    ) {
      showError(
        "برجاء إدخال القيمة أولًا"
      );

      return false;
    }

    if (!form.orderFor.trim()) {
      showError(
        "برجاء تحديد سبب الاستلام أولًا"
      );

      return false;
    }

    return true;
  };

  const save = async () => {
    if (!validate()) {
      return;
    }

    if (isExisting) {
      await showError(
        "الإقرار الحالي محفوظ بالفعل، اضغط جديد لإنشاء إقرار آخر"
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_BASE_URL}/api/cash-receipt-acknowledgments`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              userGuid,
              orderDate:
                form.orderDate,
              branchGuid:
                form.branchGuid,
              receiptMan:
                form.receiptMan.trim(),
              nationalId:
                form.nationalId.trim(),
              receiptTel:
                form.receiptTel.trim(),
              orderAmount:
                Number(form.amount),
              orderAmountText:
                form.amountText,
              orderFor:
                form.orderFor.trim(),
              isUse:
                form.isUse
            })
          }
        );

      const result =
        await readJson(response);

      const data =
        result?.data || {};

      setForm((current) => ({
        ...current,
        code:
          String(data.code || ""),
        guid:
          String(data.guid || ""),
        orderDate:
          String(
            data.orderDate ||
            current.orderDate
          ).slice(0, 10),
        branchGuid:
          String(
            data.branchGuid ||
            current.branchGuid
          ),
        branchName:
          String(
            data.branchName ||
            current.branchName
          ),
        receiptMan:
          String(
            data.receiptMan ||
            current.receiptMan
          ),
        nationalId:
          String(
            data.nationalId ||
            current.nationalId
          ),
        receiptTel:
          String(
            data.receiptTel ||
            current.receiptTel
          ),
        amount:
          String(
            data.orderAmount ??
            current.amount
          ),
        amountText:
          String(
            data.orderAmountText ||
            current.amountText
          ),
        orderFor:
          String(
            data.orderFor ||
            current.orderFor
          ),
        isUse:
          data.isUse !== false,
        createdByGuid:
          String(
            data.userGuid ||
            userGuid
          ),
        createdByName:
          String(
            data.userName ||
            userName
          )
      }));

      await showSuccess(
        result?.message ||
        "تم حفظ بيانات إقرار استلام النقدية بنجاح"
      );
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر حفظ إقرار استلام النقدية"
      );
    } finally {
      setSaving(false);
    }
  };

  const findOrder = async () => {
    const result =
      await Swal.fire({
        title:
          "البحث عن إقرار استلام نقدية",
        input: "number",
        inputLabel: "رقم الإقرار",
        inputValue:
          form.code || "",
        showCancelButton: true,
        confirmButtonText: "عرض",
        cancelButtonText: "إلغاء",
        confirmButtonColor:
          "#057546",
        inputValidator: (value) =>
          !value
            ? "برجاء إدخال رقم الإقرار"
            : undefined
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const params =
        new URLSearchParams({
          userGuid,
          code: String(result.value)
        });

      const response =
        await fetch(
          `${API_BASE_URL}/api/cash-receipt-acknowledgments/by-code?${params.toString()}`,
          {
            cache: "no-store"
          }
        );

      const payload =
        await readJson(response);

      const data =
        payload?.data || {};

      setForm({
        code:
          String(data.code || ""),
        guid:
          String(data.guid || ""),
        orderDate:
          String(
            data.orderDate ||
            today()
          ).slice(0, 10),
        branchGuid:
          String(
            data.branchGuid || ""
          ),
        branchName:
          String(
            data.branchName || ""
          ),
        receiptMan:
          String(
            data.receiptMan || ""
          ),
        nationalId:
          String(
            data.nationalId || ""
          ),
        receiptTel:
          String(
            data.receiptTel || ""
          ),
        amount:
          String(
            data.orderAmount ?? ""
          ),
        amountText:
          String(
            data.orderAmountText || ""
          ),
        orderFor:
          String(
            data.orderFor || ""
          ),
        isUse:
          data.isUse !== false,
        createdByGuid:
          String(
            data.userGuid || ""
          ),
        createdByName:
          String(
            data.userName || ""
          )
      });
    } catch (error) {
      await showError(
        error?.message ||
        "تعذر تحميل الإقرار"
      );
    }
  };

  const printOrder = async () => {
    if (!form.guid) {
      await showError(
        "برجاء اختيار إقرار أو حفظ الإقرار الحالي"
      );

      return;
    }

    const params =
      new URLSearchParams({
        userGuid,
        guid: form.guid
      });

    window.open(
      `${API_BASE_URL}/api/cash-receipt-acknowledgments/print?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <NavigationShell variant="standard" ><Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        background:
          theme.palette.mode === 'dark' ? theme.palette.background.default : "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)"
      }}
    >
      

      <PageContainer
        component="main"
        sx={{
          
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,0.14)"
          }}
        >
          <Stack sx={uiLayout.actionBarSx}
            direction={{
              xs: "column",
              md: "row"
            }}
            spacing={1}
            alignItems={{
              xs: "stretch",
              md: "center"
            }}
          >
            <ReceiptLongIcon
              sx={{
                color: "#057546",
                fontSize: 40
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "1.18rem",
                  fontWeight: 900,
                  color: "#173b2b"
                }}
              >
                إقرار استلام نقدية
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "0.75rem",
                  color: "#708179"
                }}
              >
                إدارة الفرع / إنشاء واستعراض وطباعة إقرارات استلام النقدية
              </Typography>
            </Box>

            <Button sx={uiLayout.buttonSx}
              variant="outlined"
              startIcon={
                <AddCircleOutlineIcon />
              }
              onClick={resetForm}
            >
              جديد
            </Button>

            <Button sx={uiLayout.buttonSx}
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={findOrder}
            >
              بحث
            </Button>

            <Button
              variant="contained"
              startIcon={
                saving
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <SaveIcon />
              }
              onClick={save}
              disabled={
                saving ||
                isExisting
              }
              sx={uiLayout.withUiSx({
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              حفظ
            </Button>

            <Button sx={uiLayout.buttonSx}
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={printOrder}
              disabled={!form.guid}
            >
              طباعة
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.5,
              md: 2.5
            },
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,0.14)"
          }}
        >
          <Box
            sx={uiLayout.withUiSx({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md:
                  "repeat(2,minmax(0,1fr))"
              },
              gap: 1.5
            }, uiLayout.formSectionSx)}
          >
            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="كود الإقرار"
              value={form.code}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx}
              type="date"
              label="التاريخ"
              value={form.orderDate}
              onChange={(event) =>
                updateForm(
                  "orderDate",
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true
              }}
              disabled={isExisting}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <Autocomplete
              options={branches}
              loading={loadingBranches}
              value={
                branches.find(
                  (item) =>
                    normalizeGuid(
                      item.guid
                    ) ===
                    normalizeGuid(
                      form.branchGuid
                    )
                ) || (
                  form.branchGuid
                    ? {
                        guid:
                          form.branchGuid,
                        name:
                          form.branchName,
                        code: ""
                      }
                    : null
                )
              }
              isOptionEqualToValue={(
                option,
                value
              ) =>
                normalizeGuid(
                  option?.guid
                ) ===
                normalizeGuid(
                  value?.guid
                )
              }
              getOptionLabel={(option) =>
                option?.name || ""
              }
              onChange={(
                _event,
                value
              ) => {
                updateForm(
                  "branchGuid",
                  value?.guid || ""
                );

                updateForm(
                  "branchName",
                  value?.name || ""
                );
              }}
              disabled={isExisting}
              renderInput={(params) => (
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  {...params}
                  label="الفرع"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>

                        {params.InputProps
                          .startAdornment}
                      </>
                    )
                  }}
                />
              )}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="استلمت أنا"
              value={form.receiptMan}
              onChange={(event) =>
                updateForm(
                  "receiptMan",
                  event.target.value
                )
              }
              disabled={isExisting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                )
              }}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="رقم الهوية"
              value={form.nationalId}
              onChange={(event) =>
                updateForm(
                  "nationalId",
                  event.target.value
                )
              }
              disabled={isExisting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon />
                  </InputAdornment>
                )
              }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="رقم الجوال"
              value={form.receiptTel}
              onChange={(event) =>
                updateForm(
                  "receiptTel",
                  event.target.value
                )
              }
              disabled={isExisting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalPhoneIcon />
                  </InputAdornment>
                )
              }}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              type="number"
              label="المبلغ"
              value={form.amount}
              onChange={(event) =>
                updateForm(
                  "amount",
                  event.target.value
                )
              }
              disabled={isExisting}
              inputProps={{
                min: 0,
                step: "0.01"
              , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountBalanceWalletIcon />
                  </InputAdornment>
                )
              }}
            />

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              label="المبلغ كتابة"
              value={form.amountText}
              InputProps={{
                readOnly: true,
                endAdornment:
                  tafkeetLoading
                    ? (
                      <CircularProgress
                        size={18}
                      />
                    )
                    : (
                      <CalculateIcon
                        sx={{
                          color:
                            "#057546"
                        }}
                      />
                    )
              }}
            />

            <TextField InputLabelProps={{ shrink: true }}
              label="وذلك مقابل"
              value={form.orderFor}
              onChange={(event) =>
                updateForm(
                  "orderFor",
                  event.target.value
                )
              }
              disabled={isExisting}
              multiline
              minRows={5}
              sx={uiLayout.withUiSx({
                gridColumn: {
                  xs: "auto",
                  md: "1 / -1"
                }
              }, uiLayout.formFieldSx)}
            />

            <FormControlLabel sx={uiLayout.checkboxFieldSx}
              control={
                <Switch
                  checked={form.isUse}
                  onChange={(event) =>
                    updateForm(
                      "isUse",
                      event.target.checked
                    )
                  }
                  disabled={isExisting}
                  color="success"
                />
              }
              label="حالة الإقرار نشط"
            />
          </Box>

          {isExisting && (
            <>
              <Divider sx={{ my: 2 }} />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row"
                }}
                spacing={1}
              >
                <Chip
                  label={`رقم الإقرار: ${form.code}`}
                />

                <Chip
                  label={`المبلغ: ${money(form.amount)}`}
                />

                <Chip
                  label={`أنشئ بواسطة: ${form.createdByName || "-"}`}
                />
              </Stack>
            </>
          )}
        </Paper>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default CashReceiptAcknowledgment;
