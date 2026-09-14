import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "http://localhost:5258";
const primary = "#057546";

const getActor = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      actorUserGuid: u?.guid || u?.Guid || u?.userGuid || u?.UserGuid || null,
      actorName: u?.fullName || u?.FullName || u?.userName || u?.UserName || "مستخدم النظام"
    };
  } catch { return { actorUserGuid: null, actorName: "مستخدم النظام" }; }
};

const emptyStep = () => ({
  stepName: "المسؤول المباشر",
  approverSource: "ORG_DIRECT_MANAGER",
  targetOrgUnitGuid: "",
  approvalMode: "ANY",
  approverUserGuids: []
});

const emptyPolicy = () => ({
  policyGuid: null,
  policyName: "مسار أذونات افتراضي",
  permissionType: "",
  sourceOrgUnitGuid: "",
  includeDescendants: true,
  priority: 100,
  isActive: true,
  notes: "",
  steps: [emptyStep()]
});

const typeName = (type) => ({ 1:"تأخير حضور",2:"انصراف مبكر",3:"خروج أثناء الدوام",4:"إذن يوم كامل" }[Number(type)] || "كل الأنواع");
const sourceName = (source) => ({
  ORG_DIRECT_MANAGER:"المسؤول المباشر",
  ORG_PARENT_MANAGER:"مسؤول الوحدة الأعلى",
  ORG_ROOT_MANAGER:"الإدارة العليا",
  ORG_UNIT_MANAGER:"مسؤول وحدة محددة",
  SPECIFIC_USERS:"أشخاص محددون"
}[source] || source);

export default function HrPermissionWorkflowManager({ buttonColor = "#fff", buttonTextColor = "#034d31" }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ permissionTypes: [], approverSources: [], units: [], employees: [] });
  const [policies, setPolicies] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [form, setForm] = useState(emptyPolicy());
  const actor = useMemo(() => getActor(), []);
  const headers = useMemo(() => ({ "Content-Type":"application/json", ...(actor.actorUserGuid ? { "X-User-Guid":actor.actorUserGuid } : {}) }), [actor.actorUserGuid]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const approvalsUrl = `${API_BASE_URL}/api/hr/permissions/workflow/my-approvals?actorUserGuid=${encodeURIComponent(actor.actorUserGuid || "")}`;
      const [c,p,a] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hr/permissions/workflow/config`, { cache:"no-store" }),
        fetch(`${API_BASE_URL}/api/hr/permissions/workflow/policies`, { cache:"no-store" }),
        actor.actorUserGuid ? fetch(approvalsUrl, { cache:"no-store", headers }) : Promise.resolve(null)
      ]);
      const cj=await c.json().catch(()=>null); const pj=await p.json().catch(()=>null); const aj=a?await a.json().catch(()=>null):null;
      if(!c.ok) throw new Error(cj?.message || "تعذر تحميل إعدادات الأذونات");
      if(!p.ok) throw new Error(pj?.message || "تعذر تحميل المسارات");
      setConfig(cj?.data || { permissionTypes:[],approverSources:[],units:[],employees:[] });
      setPolicies(Array.isArray(pj?.data)?pj.data:[]);
      setApprovals(Array.isArray(aj?.data)?aj.data:[]);
    } catch(e) {
      await Swal.fire({icon:"error",title:"تعذر تحميل الإعدادات",text:e?.message || "حدث خطأ"});
    } finally { setLoading(false); }
  }, [open, actor.actorUserGuid, headers]);

  useEffect(()=>{ load(); },[load]);

  const addStep=()=>setForm((x)=>({...x,steps:[...x.steps,emptyStep()]}));
  const updateStep=(i,patch)=>setForm((x)=>({...x,steps:x.steps.map((s,n)=>n===i?{...s,...patch}:s)}));
  const removeStep=(i)=>setForm((x)=>({...x,steps:x.steps.filter((_,n)=>n!==i)}));
  const moveStep=(i,d)=>setForm((x)=>{const a=[...x.steps];const t=i+d;if(t<0||t>=a.length)return x;[a[i],a[t]]=[a[t],a[i]];return{...x,steps:a};});

  const editPolicy=(row)=>{
    setForm({
      policyGuid:row.policyGuid,
      policyName:row.policyName || "",
      permissionType:row.permissionType ?? "",
      sourceOrgUnitGuid:row.sourceOrgUnitGuid || "",
      includeDescendants:row.includeDescendants !== false,
      priority:row.priority ?? 100,
      isActive:row.isActive !== false,
      notes:row.notes || "",
      steps:(row.steps || []).map((s)=>({
        stepName:s.stepName || "",
        approverSource:s.approverSource,
        targetOrgUnitGuid:s.targetOrgUnitGuid || "",
        approvalMode:s.approvalMode || "ANY",
        approverUserGuids:(s.approvers || []).map((u)=>u.approverUserGuid)
      }))
    });
    setTab(1);
  };

  const savePolicy=async()=>{
    if(!form.policyName.trim()||!form.steps.length) return;
    setLoading(true);
    try{
      const res=await fetch(`${API_BASE_URL}/api/hr/permissions/workflow/policy`,{
        method:"POST",headers,
        body:JSON.stringify({
          ...form,
          permissionType:form.permissionType === "" ? null : Number(form.permissionType),
          sourceOrgUnitGuid:form.sourceOrgUnitGuid || null,
          actorUserGuid:actor.actorUserGuid,
          steps:form.steps.map((s)=>({...s,targetOrgUnitGuid:s.targetOrgUnitGuid || null}))
        })
      });
      const json=await res.json().catch(()=>null);
      if(!res.ok) throw new Error(json?.message || json?.error || "تعذر حفظ المسار");
      await Swal.fire({icon:"success",title:"تم الحفظ",text:"المسار أصبح جاهزًا وسيستخدم الهيكل الإداري الموحد لتحديد الموافقين."});
      setForm(emptyPolicy());
      setTab(0);
      await load();
    }catch(e){await Swal.fire({icon:"error",title:"تعذر الحفظ",text:e?.message||"حدث خطأ"});}
    finally{setLoading(false);}
  };

  const decide=async(row,decision)=>{
    setLoading(true);
    try{
      const res=await fetch(`${API_BASE_URL}/api/hr/permissions/workflow/${row.permissionGuid}/decision`,{
        method:"POST",headers,
        body:JSON.stringify({actorUserGuid:actor.actorUserGuid,actorName:actor.actorName,decision,notes:""})
      });
      const json=await res.json().catch(()=>null);
      if(!res.ok) throw new Error(json?.message || json?.error || "تعذر تنفيذ القرار");
      await load();
    }catch(e){await Swal.fire({icon:"error",title:"تعذر تنفيذ القرار",text:e?.message||"حدث خطأ"});}
    finally{setLoading(false);}
  };

  return <>
    <Button
      variant="contained"
      startIcon={<SettingsSuggestRoundedIcon />}
      onClick={()=>setOpen(true)}
      sx={{ bgcolor:buttonColor,color:buttonTextColor,fontWeight:900,"&:hover":{bgcolor:buttonColor,opacity:.92} }}
    >
      إعدادات ومسارات الأذونات
    </Button>

    <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="lg" dir="rtl">
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box><Typography sx={{fontWeight:1000,fontSize:20}}>إدارة الأذونات ومسارات الموافقات</Typography><Typography sx={{fontSize:10.5,color:"text.secondary"}}>الموافقون يأتون من نفس الهيكل الإداري الموحد</Typography></Box>
          <IconButton onClick={()=>setOpen(false)}><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto" sx={{mb:1}}>
          <Tab label="المسارات الحالية" />
          <Tab label="إنشاء / تعديل مسار" />
          <Tab label={`موافقاتي (${approvals.length})`} />
        </Tabs>

        {tab===0 && <Stack spacing={1}>
          <Alert severity="info">يمكن عمل مسار عام لكل الأذونات، أو مسار لنوع إذن، أو مسار لوحدة تنظيمية كاملة وكل الوحدات التابعة لها.</Alert>
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={()=>{setForm(emptyPolicy());setTab(1);}} sx={{alignSelf:"flex-start"}}>مسار جديد</Button>
          {policies.map((p)=><Paper key={p.policyGuid} variant="outlined" sx={{p:1.1,borderRadius:2.5,cursor:"pointer"}} onClick={()=>editPolicy(p)}>
            <Stack direction={{xs:"column",md:"row"}} justifyContent="space-between" gap={1}>
              <Box><Typography sx={{fontWeight:950}}>{p.policyName}</Typography><Typography sx={{fontSize:10.5,color:"text.secondary"}}>{typeName(p.permissionType)} • {p.sourceOrgUnitName || "كل الوحدات"}{p.includeDescendants ? " • يشمل الوحدات التابعة" : ""}</Typography></Box>
              <Stack direction="row" gap={.5} flexWrap="wrap">{(p.steps||[]).map((s)=><Chip key={s.policyStepGuid} size="small" label={`${s.stepNo}. ${s.stepName || sourceName(s.approverSource)}`} />)}</Stack>
            </Stack>
          </Paper>)}
          {!policies.length && <Alert severity="warning">لا توجد مسارات مخصصة بعد. في هذه الحالة يستخدم النظام المسؤول المباشر من الهيكل كمسار آمن افتراضي.</Alert>}
        </Stack>}

        {tab===1 && <Stack spacing={1}>
          <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1.4fr 1fr 1.4fr 100px"},gap:1}}>
            <TextField size="small" label="اسم المسار" value={form.policyName} onChange={(e)=>setForm((x)=>({...x,policyName:e.target.value}))}/>
            <FormControl size="small"><InputLabel>نوع الإذن</InputLabel><Select label="نوع الإذن" value={form.permissionType} onChange={(e)=>setForm((x)=>({...x,permissionType:e.target.value}))}><MenuItem value="">كل الأنواع</MenuItem>{(config.permissionTypes||[]).map((t)=><MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>)}</Select></FormControl>
            <FormControl size="small"><InputLabel>الوحدة المصدر</InputLabel><Select label="الوحدة المصدر" value={form.sourceOrgUnitGuid} onChange={(e)=>setForm((x)=>({...x,sourceOrgUnitGuid:e.target.value}))}><MenuItem value="">كل الوحدات</MenuItem>{(config.units||[]).map((u)=><MenuItem key={u.orgUnitGuid} value={u.orgUnitGuid}>{u.unitName}</MenuItem>)}</Select></FormControl>
            <TextField size="small" type="number" label="الأولوية" value={form.priority} onChange={(e)=>setForm((x)=>({...x,priority:Number(e.target.value||100)}))}/>
          </Box>
          <FormControl size="small" sx={{width:260}}><InputLabel>تطبيق الوحدة</InputLabel><Select label="تطبيق الوحدة" value={form.includeDescendants?"yes":"no"} onChange={(e)=>setForm((x)=>({...x,includeDescendants:e.target.value==="yes"}))}><MenuItem value="yes">الوحدة وكل ما تحتها</MenuItem><MenuItem value="no">الوحدة فقط</MenuItem></Select></FormControl>

          <Typography sx={{fontWeight:950}}>خطوات الموافقة</Typography>
          {form.steps.map((step,index)=><Paper key={index} variant="outlined" sx={{p:1,borderRadius:2.5}}>
            <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"70px 1.2fr 1.3fr 1fr auto"},gap:1,alignItems:"center"}}>
              <TextField size="small" label="الخطوة" value={index+1} disabled/>
              <TextField size="small" label="اسم الخطوة" value={step.stepName} onChange={(e)=>updateStep(index,{stepName:e.target.value})}/>
              <FormControl size="small"><InputLabel>الموافق من</InputLabel><Select label="الموافق من" value={step.approverSource} onChange={(e)=>updateStep(index,{approverSource:e.target.value,targetOrgUnitGuid:"",approverUserGuids:[]})}>{(config.approverSources||[]).map((s)=><MenuItem key={s.value} value={s.value}>{s.name}</MenuItem>)}</Select></FormControl>
              <FormControl size="small"><InputLabel>طريقة الموافقة</InputLabel><Select label="طريقة الموافقة" value={step.approvalMode} onChange={(e)=>updateStep(index,{approvalMode:e.target.value})}><MenuItem value="ANY">موافقة أي واحد تكفي</MenuItem><MenuItem value="ALL">موافقة الجميع</MenuItem></Select></FormControl>
              <Stack direction="row"><IconButton disabled={index===0} onClick={()=>moveStep(index,-1)}><KeyboardArrowUpRoundedIcon/></IconButton><IconButton disabled={index===form.steps.length-1} onClick={()=>moveStep(index,1)}><KeyboardArrowDownRoundedIcon/></IconButton><IconButton color="error" disabled={form.steps.length===1} onClick={()=>removeStep(index)}><DeleteOutlineRoundedIcon/></IconButton></Stack>
            </Box>
            {step.approverSource==="ORG_UNIT_MANAGER" && <FormControl size="small" fullWidth sx={{mt:1}}><InputLabel>الوحدة التي سيُؤخذ مسؤولوها</InputLabel><Select label="الوحدة التي سيُؤخذ مسؤولوها" value={step.targetOrgUnitGuid} onChange={(e)=>updateStep(index,{targetOrgUnitGuid:e.target.value})}>{(config.units||[]).map((u)=><MenuItem key={u.orgUnitGuid} value={u.orgUnitGuid}>{u.unitName}</MenuItem>)}</Select></FormControl>}
            {step.approverSource==="SPECIFIC_USERS" && <Autocomplete multiple sx={{mt:1}} options={config.employees||[]} getOptionLabel={(o)=>o.employeeName||""} value={(config.employees||[]).filter((u)=>step.approverUserGuids.includes(u.employeeGuid))} onChange={(_,v)=>updateStep(index,{approverUserGuids:v.map((x)=>x.employeeGuid)})} renderInput={(params)=><TextField {...params} size="small" label="الأشخاص المحددون"/>}/>} 
          </Paper>)}
          <Button variant="outlined" startIcon={<AddRoundedIcon/>} onClick={addStep} sx={{alignSelf:"flex-start"}}>إضافة خطوة</Button>
          <TextField multiline minRows={2} label="ملاحظات" value={form.notes} onChange={(e)=>setForm((x)=>({...x,notes:e.target.value}))}/>
          <Button variant="contained" onClick={savePolicy} disabled={loading}>حفظ المسار</Button>
        </Stack>}

        {tab===2 && <Stack spacing={1}>
          <Alert severity="success" icon={<FactCheckRoundedIcon/>}>هذه الطلبات وصلت لمرحلتك أنت حسب الهيكل والمسار المجمد وقت تقديم الطلب.</Alert>
          {approvals.map((row)=><Paper key={row.permissionGuid} variant="outlined" sx={{p:1.1,borderRadius:2.5}}>
            <Stack direction={{xs:"column",md:"row"}} justifyContent="space-between" gap={1}>
              <Box><Typography sx={{fontWeight:950}}>{row.employeeName}</Typography><Typography sx={{fontSize:10.5,color:"text.secondary"}}>{typeName(row.permissionType)} • {row.permissionDate?.slice?.(0,10) || row.permissionDate} • {row.stepName}</Typography><Typography sx={{fontSize:11,mt:.4}}>{row.reason}</Typography></Box>
              <Stack direction="row" spacing={.7}><Button color="error" variant="outlined" onClick={()=>decide(row,"REJECT")}>رفض</Button><Button color="success" variant="contained" onClick={()=>decide(row,"APPROVE")}>موافقة</Button></Stack>
            </Stack>
          </Paper>)}
          {!approvals.length && <Alert severity="info">لا توجد أذونات تنتظر موافقتك حاليًا.</Alert>}
        </Stack>}
      </DialogContent>
      <DialogActions><Button onClick={()=>setOpen(false)}>إغلاق</Button></DialogActions>
    </Dialog>
  </>;
}
