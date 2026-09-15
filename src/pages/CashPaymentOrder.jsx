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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BusinessIcon from "@mui/icons-material/Business";
import CalculateIcon from "@mui/icons-material/Calculate";
import CloseIcon from "@mui/icons-material/Close";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const today = () => {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeGuid = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const readJson = async (response) => {
  const text = await response.text();

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

const fireError = (message) =>
  Swal.fire({
    icon: "error",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const fireSuccess = (message) =>
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

const CashPaymentOrder = () => {
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

  const [branchesLoading, setBranchesLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [tafkeetLoading, setTafkeetLoading] =
    useState(false);

  const [branchDialogOpen, setBranchDialogOpen] =
    useState(false);

  const [orderDialogOpen, setOrderDialogOpen] =
    useState(false);

  const [orderCodeSearch, setOrderCodeSearch] =
    useState("");

  const [form, setForm] = useState({
    code: "",
    guid: "",
    orderDate: today(),
    branchGuid: "",
    branchName: "",
    orderTo: "",
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
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const resetForm = useCallback(() => {
    setForm({
      code: "",
      guid: "",
      orderDate: today(),
      branchGuid: "",
      branchName: "",
      orderTo: "",
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
        setBranchesLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/cash-payment-orders/branches?userGuid=${encodeURIComponent(userGuid)}`,
          {
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result =
          await readJson(response);

        const values =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setBranches(values);

        if (
          values.length === 1 &&
          !form.branchGuid
        ) {
          updateForm(
            "branchGuid",
            values[0].guid
          );
          updateForm(
            "branchName",
            values[0].name
          );
        }
      } catch (error) {
        setBranches([]);
        await fireError(
          error?.message ||
          "تعذر تحميل الفروع"
        );
      } finally {
        setBranchesLoading(false);
      }
    }, [
      userGuid,
      form.branchGuid
    ]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    const numericAmount =
      Number(form.amount || 0);

    if (
      !numericAmount ||
      numericAmount <= 0
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
              `${API_BASE_URL}/api/cash-payment-orders/tafkeet?userGuid=${encodeURIComponent(userGuid)}&total=${encodeURIComponent(numericAmount)}`,
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
              result?.data ||
              ""
            )
          );
        } catch (error) {
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
      fireError(
        "برجاء اختيار الفرع أولًا"
      );
      return false;
    }

    if (!form.orderTo.trim()) {
      fireError(
        "برجاء إدخال اسم المستفيد أولًا"
      );
      return false;
    }

    if (
      !Number(form.amount) ||
      Number(form.amount) <= 0
    ) {
      fireError(
        "برجاء إدخال قيمة صحيحة"
      );
      return false;
    }

    if (!form.orderFor.trim()) {
      fireError(
        "برجاء تحديد الغرض من الصرف"
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
      await fireError(
        "الأمر الحالي محفوظ بالفعل، اضغط جديد لإنشاء أمر آخر"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/cash-payment-orders`,
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
            orderTo:
              form.orderTo.trim(),
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
        orderTo:
          String(
            data.orderTo ||
            current.orderTo
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

      await fireSuccess(
        result?.message ||
        "تم حفظ بيانات أمر صرف النقدية بنجاح"
      );
    } catch (error) {
      await fireError(
        error?.message ||
        "تعذر حفظ أمر الصرف"
      );
    } finally {
      setSaving(false);
    }
  };

  const loadOrderByCode =
    async () => {
      const code =
        String(
          orderCodeSearch || ""
        ).trim();

      if (!code) {
        await fireError(
          "برجاء إدخال رقم الأمر"
        );
        return;
      }

      try {
        const params =
          new URLSearchParams({
            userGuid,
            code
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/cash-payment-orders/by-code?${params.toString()}`,
            {
              cache: "no-store"
            }
          );

        const result =
          await readJson(response);

        const data =
          result?.data || {};

        setForm({
          code:
            String(data.code || code),
          guid:
            String(data.guid || ""),
          orderDate:
            String(
              data.orderDate || today()
            ).slice(0, 10),
          branchGuid:
            String(
              data.branchGuid || ""
            ),
          branchName:
            String(
              data.branchName || ""
            ),
          orderTo:
            String(
              data.orderTo || ""
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

        setOrderDialogOpen(false);
      } catch (error) {
        await fireError(
          error?.message ||
          "تعذر تحميل أمر الصرف"
        );
      }
    };

  const printOrder = async () => {
    if (!form.guid) {
      await fireError(
        "برجاء اختيار أمر صرف أو حفظ الأمر الحالي"
      );
      return;
    }

    const params =
      new URLSearchParams({
        userGuid,
        guid: form.guid
      });

    window.open(
      `${API_BASE_URL}/api/cash-payment-orders/print?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const branchColumns = [
    {
      field: "code",
      headerName: "كود",
      width: 100
    },
    {
      field: "name",
      headerName: "اسم الفرع",
      flex: 1,
      minWidth: 250
    }
  ];

  return (
    <NavigationShell variant="standard" ><Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#ffffff 55%,#eef8f3 100%)"
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
            <LocalAtmIcon
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
                أمر صرف نقدية
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontSize: "0.75rem",
                  color: "#708179"
                }}
              >
                إدارة الفرع / إنشاء واستعراض وطباعة أوامر صرف النقدية
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                <AddCircleOutlineIcon />
              }
              onClick={resetForm}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
            >
              جديد
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <SearchIcon />
              }
              onClick={() => {
                setOrderCodeSearch(
                  form.code || ""
                );
                setOrderDialogOpen(true);
              }}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
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
                fontFamily: "Cairo",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }, uiLayout.buttonSx)}
            >
              حفظ
            </Button>

            <Button
              variant="outlined"
              startIcon={
                <PrintIcon />
              }
              onClick={printOrder}
              disabled={!form.guid}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900
              }, uiLayout.buttonSx)}
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
              label="كود أمر الصرف"
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
              loading={branchesLoading}
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
              label="ادفعوا لأمر"
              value={form.orderTo}
              onChange={(event) =>
                updateForm(
                  "orderTo",
                  event.target.value
                )
              }
              disabled={isExisting}
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

            <FormControlLabel
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
              label="حالة الأمر نشط"
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo"
              }, uiLayout.checkboxFieldSx)}
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
                  label={`رقم الأمر: ${form.code}`}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                />

                <Chip
                  label={`المبلغ: ${money(form.amount)}`}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                />

                <Chip
                  label={`أنشئ بواسطة: ${form.createdByName || "-"}`}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                />
              </Stack>
            </>
          )}
        </Paper>
      </PageContainer>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={orderDialogOpen}
        onClose={() =>
          setOrderDialogOpen(false)
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            direction: "rtl",
            borderRadius: 4
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900
          }}
        >
          البحث عن أمر صرف
        </DialogTitle>

        <DialogContent dividers>
          <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
            autoFocus
            fullWidth
            label="رقم أمر الصرف"
            value={orderCodeSearch}
            onChange={(event) =>
              setOrderCodeSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                loadOrderByCode();
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setOrderDialogOpen(false)
            }
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={loadOrderByCode}
            startIcon={<SearchIcon />}
            sx={uiLayout.withUiSx({
              backgroundColor:
                "#057546"
            }, uiLayout.buttonSx)}
          >
            عرض
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={branchDialogOpen}
        onClose={() =>
          setBranchDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          قائمة الفروع
        </DialogTitle>

        <DialogContent
          sx={{
            height: 520
          }}
        >
          <DataGrid sx={uiLayout.dataGridSx}
            rows={branches}
            columns={branchColumns}
            loading={branchesLoading}
            disableRowSelectionOnClick
            onRowDoubleClick={(params) => {
              updateForm(
                "branchGuid",
                params.row.guid
              );
              updateForm(
                "branchName",
                params.row.name
              );
              setBranchDialogOpen(false);
            }}
          />
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            startIcon={<CloseIcon />}
            onClick={() =>
              setBranchDialogOpen(false)
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
};

export default CashPaymentOrder;
