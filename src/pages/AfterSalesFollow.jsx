import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

const getMonthAgo = () => {
  const value = new Date();
  value.setMonth(
    value.getMonth() - 1
  );

  return value
    .toISOString()
    .slice(0, 10);
};

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");

const showError = async (message) => {
  await Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });
};

const showSuccess = async (message) => {
  await Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });
};

const questions = [
  "هل تم الرد على جميع استفساراتك بشكل كافي أثناء التسجيل؟",
  "هل تم تأكيد معلومات الدبلوم: مدة الدراسة وعدد الساعات والسعر؟",
  "هل تم تأكيد أن الدراسة حضوري بجدول محاضرات مرن؟",
  "هل تم تأكيد الالتزام بحضور الاختبارات الفصلية؟",
  "هل تم تأكيد الالتزام بسداد الأقساط الشهرية؟"
];

const AfterSalesFollow = () => {
  const user = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("user") ||
          "{}"
      ),
    []
  );

  const userGuid = String(
    user?.guid ||
      user?.Guid ||
      ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(getToday());

  const [toDate, setToDate] =
    useState(getToday());

  const [rows, setRows] =
    useState([]);

  const [serverFilters, setServerFilters] =
    useState({
      batches: [],
      followUsers: [],
      salesmen: [],
      callStatuses: []
    });

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [batchFilter, setBatchFilter] =
    useState("الكل");

  const [followUserFilter, setFollowUserFilter] =
    useState("الكل");

  const [callStatusFilter, setCallStatusFilter] =
    useState("الكل");

  const [salesmanFilter, setSalesmanFilter] =
    useState("الكل");



  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const selectChecks = [
        batchFilter === "الكل" ||
          row.batchName === batchFilter,

        followUserFilter === "الكل" ||
          row.followUpName === followUserFilter,

        callStatusFilter === "الكل" ||
          row.callStatus === callStatusFilter,

        salesmanFilter === "الكل" ||
          row.salesmanName === salesmanFilter
      ];

      return selectChecks.every(Boolean);
    });
  }, [
    rows,
    batchFilter,
    followUserFilter,
    callStatusFilter,
    salesmanFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          row.regDocGuid ||
          `after-sales-${index}`,

        regDocGuid:
          row.regDocGuid || "",

        studentName:
          row.studentName || "",

        studentTel:
          row.studentTel || "",

        nationalId:
          row.nationalId || "",

        diplomName:
          row.diplomName || "",

        branchName:
          row.branchName || "",

        batchName:
          row.batchName || "",

        salesmanName:
          row.salesmanName || "",

        followUpName:
          row.followUpName || "",

        callStatus:
          row.callStatus ||
          "لم يتحدد الموقف",

        studyType:
          row.studyType || "",

        lastNotes:
          row.lastNotes || ""
      })
    );
  }, [filteredRows]);

  const columns = useMemo(
    () => [
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.3,
        minWidth: 150
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 1,
        minWidth: 120
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 1,
        minWidth: 120
      },
      {
        field: "diplomName",
        headerName: "التخصص",
        type: "string",
        flex: 1.3,
        minWidth: 150
      },
      {
        field: "branchName",
        headerName: "الفرع",
        type: "string",
        flex: 1.45,
        minWidth: 170
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 1,
        minWidth: 120
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 1,
        minWidth: 125
      },
      {
        field: "followUpName",
        headerName: "القائم بالمتابعة",
        type: "string",
        flex: 1.1,
        minWidth: 135
      },
      {
        field: "callStatus",
        headerName: "حالة الاتصال",
        type: "singleSelect",
        valueOptions: [
          "تم الرد",
          "لم يتم الرد",
          "لم يتحدد الموقف"
        ],
        flex: 1.05,
        minWidth: 135,
        renderCell: (params) => (
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.4,
              borderRadius: 999,
              fontWeight: 900,
              color:
                params.value === "تم الرد"
                  ? "#057546"
                  : params.value === "لم يتم الرد"
                  ? "#ae1e21"
                  : "#735c00",
              background:
                params.value === "تم الرد"
                  ? "#e6f3ee"
                  : params.value === "لم يتم الرد"
                  ? "#fdecec"
                  : "#fff7cc"
            }}
          >
            {params.value ||
              "لم يتحدد الموقف"}
          </Box>
        )
      },
      {
        field: "studyType",
        headerName: "نوع الدراسة",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      {
        field: "actions",
        headerName: "إجراء",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 90,
        renderCell: (params) => (
          <Tooltip
            title={
              params.row.lastNotes
                ? `آخر ملاحظة: ${params.row.lastNotes}`
                : "إضافة ملاحظة"
            }
          >
            <IconButton
              onClick={() =>
                openNotesForm(
                  params.row
                )
              }
              sx={{
                color: "#057546"
              }}
            >
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
        )
      }
    ],
    []
  );

  const loadData = async () => {
    if (!userGuid) {
      await showError(
        "بيانات المستخدم غير موجودة"
      );
      return;
    }

    if (!fromDate || !toDate) {
      await showError(
        "برجاء تحديد الفترة"
      );
      return;
    }

    if (fromDate > toDate) {
      await showError(
        "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية"
      );
      return;
    }

    setLoading(true);

    try {
      const params =
        new URLSearchParams({
          userGuid,
          fromDate,
          toDate
        });

      const response = await fetch(
        `${API_BASE_URL}/api/after-sales-follow?${params.toString()}`,
        {
          headers: {
            Accept:
              "application/json"
          }
        }
      );

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "الخادم لم يرجع استجابة JSON صحيحة"
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل متابعة ما بعد البيع"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

      setServerFilters({
        batches:
          result?.data?.filters
            ?.batches || [],

        followUsers:
          result?.data?.filters
            ?.followUsers || [],

        salesmen:
          result?.data?.filters
            ?.salesmen || [],

        callStatuses:
          result?.data?.filters
            ?.callStatuses || []
      });

    } catch (error) {
      setRows([]);

      await showError(
        error?.message ||
          "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setBatchFilter("الكل");
    setFollowUserFilter("الكل");
    setCallStatusFilter("الكل");
    setSalesmanFilter("الكل");
  };

  const openNotesForm = async (row) => {
    if (!row?.regDocGuid) {
      await showError(
        "لا يمكن قراءة رقم الاستمارة"
      );
      return;
    }

    const callResult =
      await Swal.fire({
        icon: "question",
        title:
          "نموذج متابعة ما بعد البيع",
        text:
          "هل تم الرد على الاتصال؟",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "نعم",
        denyButtonText: "لا",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        denyButtonColor: "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (callResult.isDismissed) {
      return;
    }

    if (callResult.isDenied) {
      const noAnswer =
        await Swal.fire({
          title:
            "لم يتم الرد على الاتصال",
          input: "textarea",
          inputLabel:
            "ملاحظة إضافية",
          inputPlaceholder:
            "اكتب ملاحظة اختيارية...",
          showCancelButton: true,
          confirmButtonText: "حفظ",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          cancelButtonColor:
            "#ae1e21",
          reverseButtons: true
        });

      if (!noAnswer.isConfirmed) {
        return;
      }

      await saveNotes(
        row.regDocGuid,
        {
          callAnswered: false,
          answers: [],
          rating: null,
          extraNotes:
            noAnswer.value || ""
        }
      );

      return;
    }

    const answers = [];

    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const answerResult =
        await Swal.fire({
          icon: "question",
          title:
            `السؤال ${index + 1} من ${questions.length}`,
          text: questions[index],
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "نعم",
          denyButtonText: "لا",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          denyButtonColor:
            "#ae1e21",
          reverseButtons: true,
          allowOutsideClick: false
        });

      if (answerResult.isDismissed) {
        return;
      }

      if (
        answerResult.isConfirmed
      ) {
        answers.push({
          answer: true,
          reason: ""
        });

        continue;
      }

      const reasonResult =
        await Swal.fire({
          icon: "warning",
          title:
            "سبب اختيار لا",
          input: "textarea",
          inputLabel:
            questions[index],
          inputPlaceholder:
            "اكتب السبب...",
          inputValidator: (
            value
          ) => {
            if (
              !String(value || "")
                .trim()
            ) {
              return "برجاء كتابة السبب";
            }

            return undefined;
          },
          showCancelButton: true,
          confirmButtonText:
            "متابعة",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          cancelButtonColor:
            "#ae1e21",
          reverseButtons: true,
          allowOutsideClick: false
        });

      if (!reasonResult.isConfirmed) {
        return;
      }

      answers.push({
        answer: false,
        reason:
          reasonResult.value || ""
      });
    }

    const ratingResult =
      await Swal.fire({
        title:
          "تقييم خدمة القبول والتسجيل",
        html:
          '<div id="after-sales-rating-root"></div>',
        showCancelButton: true,
        confirmButtonText: "متابعة",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true,
        didOpen: () => {
          const root =
            document.getElementById(
              "after-sales-rating-root"
            );

          if (!root) return;

          root.innerHTML = `
            <div style="font-family:Cairo;margin-bottom:12px">
              اختر تقييمًا من 1 إلى 5
            </div>
            <select id="after-sales-rating"
              style="
                width:100%;
                padding:10px;
                border:1px solid #ccc;
                border-radius:8px;
                font-size:16px;
              ">
              <option value="">اختر التقييم</option>
              <option value="1">1 - ضعيف</option>
              <option value="2">2</option>
              <option value="3">3 - جيد</option>
              <option value="4">4</option>
              <option value="5">5 - ممتاز</option>
            </select>
          `;
        },
        preConfirm: () => {
          const element =
            document.getElementById(
              "after-sales-rating"
            );

          const value =
            Number(element?.value);

          if (
            !Number.isInteger(value) ||
            value < 1 ||
            value > 5
          ) {
            Swal.showValidationMessage(
              "برجاء اختيار التقييم"
            );

            return false;
          }

          return value;
        }
      });

    if (!ratingResult.isConfirmed) {
      return;
    }

    const notesResult =
      await Swal.fire({
        title: "ملاحظة إضافية",
        input: "textarea",
        inputPlaceholder:
          "اكتب ملاحظة اختيارية...",
        showCancelButton: true,
        confirmButtonText:
          "مراجعة وحفظ",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!notesResult.isConfirmed) {
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد الحفظ",
        text:
          "هل تريد حفظ نموذج متابعة ما بعد البيع؟",
        showCancelButton: true,
        confirmButtonText:
          "نعم، حفظ",
        cancelButtonText: "إلغاء",
        confirmButtonColor:
          "#057546",
        cancelButtonColor:
          "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    await saveNotes(
      row.regDocGuid,
      {
        callAnswered: true,
        answers,
        rating:
          ratingResult.value,
        extraNotes:
          notesResult.value || ""
      }
    );
  };

  const saveNotes = async (
    regDocGuid,
    formData
  ) => {
    Swal.fire({
      title:
        "جارٍ حفظ نموذج المتابعة",
      text:
        "برجاء الانتظار...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-sales-follow/${encodeURIComponent(regDocGuid)}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid,
            ...formData
          })
        }
      );

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "الخادم لم يرجع استجابة JSON صحيحة"
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر حفظ نموذج المتابعة"
        );
      }

      Swal.close();

      await showSuccess(
        result?.message ||
          "تم حفظ نموذج المتابعة بنجاح"
      );

      await loadData();
    } catch (error) {
      Swal.close();

      await showError(
        error?.message ||
          "حدث خطأ أثناء حفظ المتابعة"
      );
    }
  };

  const filterOptions = (
    values
  ) => [
    "الكل",
    ...values
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f5f8f7",
        direction: "ltr"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          marginLeft: {
            xs: 0,
            md:
              `${SIDEBAR_WIDTH}px`
          },

          width: {
            xs: "100%",
            md:
              `calc(100% - ${SIDEBAR_WIDTH}px)`
          },

          minHeight: "100vh",

          p: {
            xs: 1.5,
            md: 3
          },

          direction: "ltr"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.14)",
            background: "#fff"
          }}
        >
          <Box
            sx={{
              p: {
                xs: 2,
                md: 3
              },

              background:
                "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",

              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31"
              }}
            >
              متابعة ما بعد البيع
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "Cairo",
                color: "#61756d"
              }}
            >
              متابعة العملاء وإضافة نموذج الاتصال بعد البيع
            </Typography>
          </Box>

          <Box
            sx={{
              p: {
                xs: 2,
                md: 3
              }
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <TextField
                type="date"
                size="small"
                label="من تاريخ"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
              />

              <TextField
                type="date"
                size="small"
                label="إلى تاريخ"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
              />

              <Button
                variant="contained"
                startIcon={
                  <SearchIcon />
                }
                onClick={loadData}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  background: "#057546"
                }}
              >
                عرض
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  <RefreshIcon />
                }
                onClick={loadData}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800
                }}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  <ClearAllIcon />
                }
                onClick={clearFilters}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#ae1e21",
                  borderColor: "#ae1e21"
                }}
              >
                مسح الفلاتر
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: "#fff9c4",
                  color: "#ae1e21",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                العدد: {filteredRows.length}
              </Box>
            </Stack>

            <Stack
              direction={{
                xs: "column",
                lg: "row"
              }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <TextField
                select
                fullWidth
                size="small"
                label="الدفعة"
                value={batchFilter}
                onChange={(event) =>
                  setBatchFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.batches
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="القائم بالمتابعة"
                value={followUserFilter}
                onChange={(event) =>
                  setFollowUserFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.followUsers
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="حالة الاتصال"
                value={callStatusFilter}
                onChange={(event) =>
                  setCallStatusFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.callStatuses
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="مندوب البيع"
                value={salesmanFilter}
                onChange={(event) =>
                  setSalesmanFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.salesmen
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Box
              sx={{
                width: "100%",
                height: 740,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 3,
                overflow: "hidden"
              }}
            >
              <DataGrid
                rows={dataGridRows}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                showToolbar
                slots={{
                  toolbar: GridToolbar
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: {
                      debounceMs: 350
                    },
                    csvOptions: {
                      utf8WithBom: true,
                      fileName:
                        "متابعة ما بعد البيع"
                    },
                    printOptions: {
                      disableToolbarButton: true
                    }
                  }
                }}
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: 25
                    }
                  }
                }}
                pageSizeOptions={[
                  10,
                  25,
                  50,
                  100
                ]}
                localeText={{
                  noRowsLabel:
                    "لا توجد بيانات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة",
                  toolbarColumns:
                    "الأعمدة",
                  toolbarFilters:
                    "الفلاتر",
                  toolbarDensity:
                    "الكثافة",
                  toolbarExport:
                    "تصدير",
                  toolbarQuickFilterPlaceholder:
                    "بحث داخل الجريد...",
                  filterPanelAddFilter:
                    "إضافة فلتر",
                  filterPanelRemoveAll:
                    "مسح الكل",
                  filterPanelOperator:
                    "نوع المقارنة",
                  filterPanelColumns:
                    "العمود",
                  filterPanelInputLabel:
                    "القيمة",
                  filterOperatorContains:
                    "يحتوي على",
                  filterOperatorDoesNotContain:
                    "لا يحتوي على",
                  filterOperatorEquals:
                    "يساوي",
                  filterOperatorDoesNotEqual:
                    "لا يساوي",
                  filterOperatorStartsWith:
                    "يبدأ بـ",
                  filterOperatorEndsWith:
                    "ينتهي بـ",
                  filterOperatorIsEmpty:
                    "فارغ",
                  filterOperatorIsNotEmpty:
                    "غير فارغ",
                  filterOperatorIsAnyOf:
                    "واحد من",
                  columnMenuFilter:
                    "فلترة",
                  columnMenuHideColumn:
                    "إخفاء العمود",
                  columnMenuSortAsc:
                    "ترتيب تصاعدي",
                  columnMenuSortDesc:
                    "ترتيب تنازلي",
                  columnMenuUnsort:
                    "إلغاء الترتيب"
                }}
                sx={{
                  border: 0,
                  direction: "ltr",
                  fontFamily: "Cairo",

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      "#057546",
                    color: "#fff",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderBottom: 0
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor:
                      "#057546"
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    textAlign: "center",
                    width: "100%"
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    color:
                      "rgba(255,255,255,0.55)",
                    visibility: "visible"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    textAlign: "center",
                    justifyContent: "center",
                    whiteSpace: "normal",
                    lineHeight: 1.45,
                    borderColor: "#e6ece9"
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor:
                      "#fbfdfc"
                  },

                  "& .MuiDataGrid-row:hover": {
                    backgroundColor:
                      "#fff3d6"
                  },

                  "& .MuiDataGrid-toolbarContainer": {
                    p: 1,
                    gap: 1,
                    borderBottom:
                      "1px solid #e6ece9",
                    backgroundColor:
                      "#f8fbf9",
                    direction: "rtl"
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#057546"
                  },

                  "& .MuiDataGrid-footerContainer": {
                    direction: "ltr",
                    fontFamily: "Cairo"
                  }
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AfterSalesFollow;