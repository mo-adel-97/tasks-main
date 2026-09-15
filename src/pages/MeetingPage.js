import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from '../components/common/uiLayout';
// MeetingPageRtc.jsx
import './rtl-forms-fix.css';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Typography, Container, Button, IconButton, Avatar, Chip,
  Snackbar, Alert, Grid, Paper, CircularProgress, Card, CardContent, TextField
} from "@mui/material";
import {
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
  CallEnd, People, Chat, Link as LinkIcon
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import io from "socket.io-client";

const COLOR_SCHEME = {
  primary: "#80b49e",
  primaryLight: "#94c4ac",
  primaryDark: "#5a8f7a",
  secondary: "#ff6b6b",
  accent: "#4ecdc4",
  background: "#f8fbfa",
  text: "#2c3e50",
  success: "#22c55e",
  warning: "#f59e42",
  error: "#ef4444",
  info: "#3b82f6",
};

// ===== اضبط دول حسب بيئتك =====
const API_BASE_URL = "https://filesregsiteration.sstli.com/erp"; // للعنوان/المنظم/الخ
const SIGNALING_URL = "https://192.168.50.169:8443"; // غيّره إلى سيرفر السوكيت عندك
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const MeetingPage = () => {
  // حالة عامة
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // واجهة
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // ميديا محلية — افتراضيًا OFF
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // سوكيت و WebRTC
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());      // peerId -> RTCPeerConnection
  const sendersRef = useRef(new Map());    // peerId -> { audioSender, videoSender }
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // ستريمات للعرض
  const [remotePeers, setRemotePeers] = useState([]); // [{peerId, user, stream}]
  const [participants, setParticipants] = useState([]); // [{socketId,guid,name,avatar,isAudioOn,isVideoOn,isHost,isSelf}]

  // محادثة
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const getMeetingIdFromUrl = () => window.location.pathname.split("/").pop();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      showSnackbar("يجب تسجيل الدخول أولاً", "error");
      return;
    }
    try {
      setCurrentUser(JSON.parse(userData));
    } catch {
      showSnackbar("خطأ في قراءة المستخدم", "error");
    }
  }, []);

  // ========== تنظيف شامل عند المغادرة ==========
  const handleLeave = () => {
    const meetingId = getMeetingIdFromUrl();
    try {
      socketRef.current?.emit("leave-meeting", {
        meetingId,
        user: { guid: currentUser?.guid },
      });
    } catch {}
    try { socketRef.current?.disconnect(); } catch {}

    try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { screenStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}

    for (const id of peersRef.current.keys()) {
      const pc = peersRef.current.get(id);
      try { pc?.getSenders()?.forEach(s => s?.track && s.track.stop && s.track.stop()); } catch {}
      try { pc?.close(); } catch {}
    }
    peersRef.current.clear();
    sendersRef.current.clear();
  };

  // تحميل الاجتماع + تشغيل الميديا + سوكيت
  useEffect(() => {
    if (!currentUser) return;

    const init = async () => {
      const meetingId = getMeetingIdFromUrl();
      try {
        setLoading(true);

        // 1) بيانات الاجتماع
        const res = await fetch(`${API_BASE_URL}/meeting_room_api.php?action=get_meeting&meeting_id=${meetingId}`);
        if (res.ok) {
          const data = await res.json();
          setMeetingInfo(data);
        } else {
          setMeetingInfo(null);
        }

        // 2) محاولة أخذ الميديا - لو فشلت، نكمل الاجتماع عادي
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          localStreamRef.current = stream;

          // افتراضيًا قافل الاثنين
          setTrackEnabled(stream, "audio", false);
          setTrackEnabled(stream, "video", false);
        } catch (err) {
          console.error("getUserMedia error:", err);
          showSnackbar("تعذّر الوصول للكاميرا/المايك، هتكمل الاجتماع بدون ميديا", "warning");
          // مهم: ما نرميش error، نخلي الاجتماع يكمل
        }

        // 3) Socket.io
        const socket = io(SIGNALING_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        // join-meeting
        socket.emit("join-meeting", {
          meetingId,
          user: {
            guid: currentUser.guid,
            name: currentUser.userName || currentUser.fullName || "User",
            avatar: (currentUser.userName || currentUser.fullName || "U").charAt(0),
            isAudioOn: false,
            isVideoOn: false,
          },
        });

        // السيرفر يرجّع لستة الموجودين (اللي كانوا في الغرفة قبلنا)
        socket.on("room-peers", async (list) => {
          // اللي داخل جديد هو اللي يبعث offers
          for (const p of list) {
            await createPeerAndOffer(p.socketId, p.user);
          }
          const me = buildSelfParticipant(socket.id);
          const others = list.map((p) => toParticipant(p.user, p.socketId));
          setParticipants(mergeParticipants([me, ...others]));
        });

        // حد جديد انضم (احنا هنا من القدام)
        // ماندخلش WebRTC من هنا، بس نحدّث لستة المشاركين
        socket.on("user-joined", ({ user, socketId }) => {
          setParticipants((prev) => mergeParticipants([...prev, toParticipant(user, socketId)]));
        });

        // signaling: offer / answer / ice
        socket.on("offer", async ({ offer, sender }) => {
          await ensurePeer(sender, null);
          const pc = peersRef.current.get(sender);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { answer: pc.localDescription, target: sender });
        });

        socket.on("answer", async ({ answer, sender }) => {
          const pc = peersRef.current.get(sender);
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", async ({ candidate, sender }) => {
          const pc = peersRef.current.get(sender);
          if (!pc) return;
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
        });

        // تغييرات الميوت/الفيديو
        socket.on("user-media-updated", ({ userId, audio, video }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              (p.guid === userId || p.socketId === userId) ? { ...p, isAudioOn: audio, isVideoOn: video } : p
            )
          );
        });

        // حد خرج
        socket.on("user-left", ({ socketId }) => {
          cleanupPeer(socketId);
          setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
          setRemotePeers((prev) => prev.filter((p) => p.peerId !== socketId));
        });

        window.addEventListener("beforeunload", handleLeave);
        setLoading(false);
      } catch (err) {
        console.error("Meeting init failed:", err);
        setLoading(false);
        showSnackbar("فشل إعداد الاجتماع (WebRTC)", "error");
      }
    };

    init();

    return () => {
      try { window.removeEventListener("beforeunload", handleLeave); } catch {}
      handleLeave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ======= WebRTC helpers =======
  const buildSelfParticipant = (socketId) => ({
    socketId,
    guid: currentUser?.guid,
    name: currentUser?.userName || currentUser?.fullName || "أنا",
    avatar: (currentUser?.userName || currentUser?.fullName || "U").charAt(0),
    isAudioOn,
    isVideoOn,
    isHost: false,
    isSelf: true,
  });

  const toParticipant = (user, socketId) => ({
    socketId,
    guid: user?.guid,
    name: user?.name ?? "ضيف",
    avatar: user?.avatar ?? "U",
    isAudioOn: user?.isAudioOn ?? true,
    isVideoOn: user?.isVideoOn ?? true,
    isHost: user?.isHost ?? false,
    isSelf: false,
  });

  const mergeParticipants = (arr) => {
    const seen = new Map();
    for (const p of arr) seen.set(p.socketId || p.guid || p.name, p);
    return Array.from(seen.values());
  };

  const ensurePeer = async (peerId, userObj) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(peerId, pc);

    // Add local tracks (لو فيه ميديا)
    if (localStreamRef.current) {
      const a = localStreamRef.current.getAudioTracks()[0];
      const v = localStreamRef.current.getVideoTracks()[0];
      const audioSender = a ? pc.addTrack(a, localStreamRef.current) : null;
      const videoSender = v ? pc.addTrack(v, localStreamRef.current) : null;
      sendersRef.current.set(peerId, { audioSender, videoSender });
    }

    // Remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      setRemotePeers((prev) => {
        const idx = prev.findIndex((p) => p.peerId === peerId);
        const entry = { peerId, user: userObj, stream: remoteStream };
        if (idx === -1) return [...prev, entry];
        const clone = [...prev]; clone[idx] = entry; return clone;
      });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice-candidate", { target: peerId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "failed" || st === "disconnected" || st === "closed") cleanupPeer(peerId);
    };

    return pc;
  };

  const createPeerAndOffer = async (peerId, userObj) => {
    const pc = await ensurePeer(peerId, userObj);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("offer", { offer, target: peerId });
  };

  const cleanupPeer = (peerId) => {
    const pc = peersRef.current.get(peerId);
    try { pc?.getSenders()?.forEach(s => s?.track && s.track.stop && s.track.stop()); } catch {}
    try { pc?.close(); } catch {}
    peersRef.current.delete(peerId);
    sendersRef.current.delete(peerId);
  };

  const setTrackEnabled = (stream, kind, enabled) => {
    stream.getTracks().filter(t => t.kind === kind).forEach(t => (t.enabled = enabled));
  };

  const replaceVideoTrackForAll = (newTrack) => {
    for (const [, senders] of sendersRef.current.entries()) {
      const sender = senders?.videoSender;
      if (sender && newTrack) {
        try { sender.replaceTrack(newTrack); } catch {}
      }
    }
  };

  // ======= UI Actions =======
  const toggleAudio = async () => {
    // لو مفيش stream أصلاً، حاول تاخد واحد دلوقتي
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        localStreamRef.current = stream;
        setTrackEnabled(stream, "video", isVideoOn);
      } catch (err) {
        console.error("getUserMedia on toggleAudio:", err);
        showSnackbar("تعذّر الوصول للمايك", "error");
        return;
      }
    }

    const next = !isAudioOn;
    setIsAudioOn(next);
    if (localStreamRef.current) setTrackEnabled(localStreamRef.current, "audio", next);
    socketRef.current?.emit("toggle-media", {
      meetingId: getMeetingIdFromUrl(),
      userId: currentUser?.guid || socketRef.current?.id,
      audio: next,
      video: isVideoOn,
    });
    setParticipants((prev) => prev.map((p) => (p.isSelf ? { ...p, isAudioOn: next } : p)));
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        localStreamRef.current = stream;
        setTrackEnabled(stream, "audio", isAudioOn);
      } catch (err) {
        console.error("getUserMedia on toggleVideo:", err);
        showSnackbar("تعذّر الوصول للكاميرا", "error");
        return;
      }
    }

    const next = !isVideoOn;
    setIsVideoOn(next);
    if (localStreamRef.current) setTrackEnabled(localStreamRef.current, "video", next);
    socketRef.current?.emit("toggle-media", {
      meetingId: getMeetingIdFromUrl(),
      userId: currentUser?.guid || socketRef.current?.id,
      audio: isAudioOn,
      video: next,
    });
    setParticipants((prev) => prev.map((p) => (p.isSelf ? { ...p, isVideoOn: next } : p)));
  };

  const startScreenShare = async () => {
    try {
      const scr = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = scr;
      const screenTrack = scr.getVideoTracks()[0];
      setIsScreenSharing(true);
      replaceVideoTrackForAll(screenTrack);
      screenTrack.onended = () => stopScreenShare();
    } catch {
      showSnackbar("تم إلغاء مشاركة الشاشة", "info");
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current) return;
    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) replaceVideoTrackForAll(camTrack);
  };

  const toggleScreenShare = () => (isScreenSharing ? stopScreenShare() : startScreenShare());

  const leaveMeeting = () => {
    handleLeave();
    window.location.href = "/meetings";
  };

  const copyMeetingLink = () => {
    if (meetingInfo?.meetingLink) {
      navigator.clipboard.writeText(meetingInfo.meetingLink);
      showSnackbar("تم نسخ رابط الاجتماع", "success");
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: currentUser?.userName || currentUser?.fullName || "أنا",
        time: new Date().toLocaleTimeString(),
        message: newMessage.trim(),
      },
    ]);
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleCloseSnackbar = () =>
    setSnackbar((s) => ({ ...s, open: false }));

  // ======= فيديوهات =======
  const localVideoEl = useMemo(() => {
    return (
      <VideoTile
        key="local"
        name={currentUser?.userName || currentUser?.fullName || "أنا"}
        avatar={(currentUser?.userName || currentUser?.fullName || "U").charAt(0)}
        stream={localStreamRef.current}
        isAudioOn={isAudioOn}
        isVideoOn={isVideoOn}
        isSelf
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioOn, isVideoOn, currentUser, localStreamRef.current]);

// هنستخدم participants كـ source أساسي
const remoteVideoTiles = participants
  .filter((p) => !p.isSelf) // استبعد نفسك
  .map((p) => {
    // لو فيه stream للـ peer ده، هنعمله bind
    const peer = remotePeers.find((r) => r.peerId === p.socketId);

    return (
      <VideoTile
        key={p.socketId || p.guid || p.name}
        name={p.name}
        avatar={p.avatar}
        stream={peer?.stream || null}
        // لو مفيش stream، هنعدّي isVideoOn=false عشان يبان Avatar بس
        isAudioOn={p.isAudioOn}
        isVideoOn={!!peer?.stream && p.isVideoOn}
      />
    );
  });


  if (loading) {
    return (
      <Box sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLOR_SCHEME.background} 0%, #ffffff 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 2
      }}>
        <CircularProgress sx={{ color: COLOR_SCHEME.primary }} />
        <Typography variant="h6">جاري تجهيز الاجتماع...</Typography>
      </Box>
    );
  }

  if (!meetingInfo) {
    return (
      <Box sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLOR_SCHEME.background} 0%, #ffffff 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 2
      }}>
        <Typography variant="h6" color="error">لم يتم العثور على الاجتماع</Typography>
        <Button
          variant="contained"
          onClick={() => (window.location.href = "/meetings")}
          sx={uiLayout.withUiSx({ bgcolor: COLOR_SCHEME.primary }, uiLayout.buttonSx)}
        >
          العودة إلى الاجتماعات
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f0f0f" }}>
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ bgcolor: "#1a1a1a", p: 2, borderBottom: "1px solid #2d2d2d" }}>
        <Container maxWidth="xl">
          <Box sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 2
          }}>
            <Box>
              <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                {meetingInfo.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                منظم الاجتماع: {meetingInfo.organizer}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip
                label={`${participants.length || (1 + remotePeers.length)} مشارك`}
                sx={{ bgcolor: COLOR_SCHEME.primary, color: "white" }}
                size="small"
              />
              <IconButton
                onClick={copyMeetingLink}
                sx={{ color: "#ccc", "&:hover": { color: "white" } }}
              >
                <LinkIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="xl" sx={{ py: 2, height: "calc(100vh - 80px)" }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          <Grid item xs={12} lg={showParticipants || showChat ? 8 : 12}>
            <Paper
              sx={{
                height: "100%",
                bgcolor: "#1a1a1a",
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #2d2d2d",
              }}
            >
              {/* Video Grid */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fit, minmax(360px, 1fr))`,
                  gap: 2,
                  overflow: "auto",
                }}
              >
                {localVideoEl}
                {remoteVideoTiles}
              </Box>

              {/* Controls */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#2d2d2d",
                  borderTop: "1px solid #404040",
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <IconButton
                  onClick={toggleAudio}
                  sx={{
                    bgcolor: isAudioOn ? COLOR_SCHEME.primary : COLOR_SCHEME.error,
                    color: "white",
                    "&:hover": {
                      bgcolor: isAudioOn ? COLOR_SCHEME.primaryDark : "#d32f2f",
                      transform: "scale(1.1)"
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {isAudioOn ? <Mic /> : <MicOff />}
                </IconButton>

                <IconButton
                  onClick={toggleVideo}
                  sx={{
                    bgcolor: isVideoOn ? COLOR_SCHEME.primary : COLOR_SCHEME.error,
                    color: "white",
                    "&:hover": {
                      bgcolor: isVideoOn ? COLOR_SCHEME.primaryDark : "#d32f2f",
                      transform: "scale(1.1)"
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {isVideoOn ? <Videocam /> : <VideocamOff />}
                </IconButton>

                <IconButton
                  onClick={toggleScreenShare}
                  sx={{
                    bgcolor: isScreenSharing ? COLOR_SCHEME.warning : "#444",
                    color: "white",
                    "&:hover": {
                      bgcolor: isScreenSharing ? "#f57c00" : "#555",
                      transform: "scale(1.1)"
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
                </IconButton>

                <IconButton
                  onClick={() => setShowParticipants((v) => !v)}
                  sx={{
                    bgcolor: showParticipants ? COLOR_SCHEME.info : "#444",
                    color: "white",
                    "&:hover": {
                      bgcolor: showParticipants ? "#1976d2" : "#555",
                      transform: "scale(1.1)"
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <People />
                </IconButton>

                <IconButton
                  onClick={() => setShowChat((v) => !v)}
                  sx={{
                    bgcolor: showChat ? COLOR_SCHEME.info : "#444",
                    color: "white",
                    "&:hover": {
                      bgcolor: showChat ? "#1976d2" : "#555",
                      transform: "scale(1.1)"
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <Chat />
                </IconButton>

                <IconButton
                  onClick={leaveMeeting}
                  sx={{
                    bgcolor: COLOR_SCHEME.error,
                    color: "white",
                    "&:hover": { bgcolor: "#d32f2f", transform: "scale(1.1)" },
                    transition: "all 0.3s ease",
                  }}
                >
                  <CallEnd />
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          {(showParticipants || showChat) && (
            <Grid item xs={12} lg={4}>
              <Paper
                sx={{
                  height: "100%",
                  bgcolor: "#1a1a1a",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #2d2d2d",
                  borderRadius: 2,
                }}
              >
                {showParticipants && (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ p: 2, borderBottom: "1px solid #2d2d2d", bgcolor: "#2d2d2d" }}>
                      <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "center", gap: 1, color: "white" }}
                      >
                        <People /> المشاركون ({participants.length || (1 + remotePeers.length)})
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
                      <Grid container spacing={1}>
                        {/* أنا */}
                        <Grid item xs={12}>
                          <ParticipantRow
                            name={currentUser?.userName || currentUser?.fullName || "أنا"}
                            avatar={(currentUser?.userName || currentUser?.fullName || "U").charAt(0)}
                            isAudioOn={isAudioOn}
                            isVideoOn={isVideoOn}
                            isSelf
                          />
                        </Grid>
                        {/* الآخرين */}
                        {participants
                          .filter((p) => !p.isSelf)
                          .map((p) => (
                            <Grid item xs={12} key={p.socketId || p.guid || p.name}>
                              <ParticipantRow
                                name={p.name}
                                avatar={p.avatar}
                                isAudioOn={p.isAudioOn}
                                isVideoOn={p.isVideoOn}
                              />
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                  </Box>
                )}

                {showChat && (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ p: 2, borderBottom: "1px solid #2d2d2d", bgcolor: "#2d2d2d" }}>
                      <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "center", gap: 1, color: "white" }}
                      >
                        <Chat /> المحادثة
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
                      {chatMessages.map((m) => (
                        <Box
                          key={m.id}
                          sx={{
                            mb: 2,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "#2d2d2d",
                            border: "1px solid #404040",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: COLOR_SCHEME.info,
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                              }}
                            >
                              {m.sender}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              {m.time}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "white", lineHeight: 1.4 }}
                          >
                            {m.message}
                          </Typography>
                        </Box>
                      ))}
                      <div ref={messagesEndRef} />
                    </Box>

                    <Box sx={{ p: 2, borderTop: "1px solid #2d2d2d", bgcolor: "#2d2d2d" }}>
                      <TextField InputLabelProps={{ shrink: true }}
                        fullWidth
                        placeholder="اكتب رسالة..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        multiline
                        maxRows={3}
                        sx={uiLayout.withUiSx({
                          "& .MuiInputBase-root": {
                            color: "white",
                            bgcolor: "#404040",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#4a4a4a" },
                          },
                          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                        }, uiLayout.formFieldSx)}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={sendMessage}
                              disabled={!newMessage.trim()}
                              sx={{
                                color: newMessage.trim()
                                  ? COLOR_SCHEME.primary
                                  : "#666",
                                "&:hover": { color: COLOR_SCHEME.primary },
                              }}
                            >
                              <Chat />
                            </IconButton>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

// ====== Components ======
const VideoTile = ({ name, avatar, stream, isAudioOn, isVideoOn, isSelf = false }) => {
  const videoRef = useRef(null);

  // إعادة attach وتشغيل الفيديو عند تفعيل الكاميرا، وإيقاف العرض عند إطفائها
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (stream && isVideoOn) {
      if (v.srcObject !== stream) v.srcObject = stream;
      const playSafe = async () => {
        try {
          await v.play();
        } catch {
          // المتصفح ممكن يمنع بدون تفاعل، نطنّش
        }
      };
      playSafe();
    } else {
      try { v.pause(); } catch {}
    }
  }, [stream, isVideoOn]);

  return (
    <Card
      sx={{
        bgcolor: "#2d2d2d",
        borderRadius: 2,
        position: "relative",
        overflow: "hidden",
        border: "1px solid #404040",
        transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ p: 0, height: 260, position: "relative" }}>
        {stream && isVideoOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isSelf}
            style={adaptiveInlineStyle({ width: "100%", height: "100%", objectFit: "cover", background: "#000" })}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#2d2d2d",
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: COLOR_SCHEME.primary,
                fontSize: "2rem",
              }}
            >
              {avatar}
            </Avatar>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(0,0,0,0.8)",
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
            {name} {isSelf ? "(أنا)" : ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!isAudioOn && (
              <MicOff sx={{ fontSize: 16, color: COLOR_SCHEME.error }} />
            )}
            {!isVideoOn && (
              <VideocamOff sx={{ fontSize: 16, color: COLOR_SCHEME.warning }} />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ParticipantRow = ({ name, avatar, isAudioOn, isVideoOn, isSelf }) => {
  return (
    <Card sx={{ bgcolor: "#2d2d2d", border: "1px solid #404040", "&:hover": { bgcolor: "#333" } }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: COLOR_SCHEME.primary, width: 40, height: 40 }}>
            {avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
              {name} {isSelf ? "(أنا)" : ""}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: isAudioOn ? COLOR_SCHEME.success : COLOR_SCHEME.error }}
              >
                {isAudioOn ? "🎤" : "🔇"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: isVideoOn ? COLOR_SCHEME.success : COLOR_SCHEME.warning }}
              >
                {isVideoOn ? "📹" : "📷"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MeetingPage;
