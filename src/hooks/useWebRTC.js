// hooks/useWebRTC.js
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER = 'https://192.168.50.169:8443';

export const useWebRTC = (meetingId, currentUser) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [connections, setConnections] = useState(new Map());
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;

    // انضمام للاجتماع
    socket.emit('join-meeting', {
      meetingId,
      user: currentUser
    });

    // استمع للأحداث
    socket.on('users-updated', setUsers);
    
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('users-updated');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, currentUser, meetingId]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // أضف الـ local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // استمع لـ ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: userId,
          candidate: event.candidate
        });
      }
    };

    // استمع للـ remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev).set(userId, remoteStream));
    };

    setConnections(prev => new Map(prev).set(userId, pc));
    return pc;
  };

  const handleUserJoined = async (data) => {
    if (data.user.guid === currentUser.guid) return;

    const pc = createPeerConnection(data.socketId);
    
    // أنشئ offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('offer', {
      target: data.socketId,
      offer: offer
    });
  };

  const handleOffer = async (data) => {
    const pc = createPeerConnection(data.sender);
    
    await pc.setRemoteDescription(data.offer);
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('answer', {
      target: data.sender,
      answer: answer
    });
  };

  const handleAnswer = async (data) => {
    const pc = connections.get(data.sender);
    if (pc) {
      await pc.setRemoteDescription(data.answer);
    }
  };

  const handleIceCandidate = async (data) => {
    const pc = connections.get(data.sender);
    if (pc) {
      await pc.addIceCandidate(data.candidate);
    }
  };

  const handleUserLeft = (data) => {
    const pc = connections.get(data.socketId);
    if (pc) {
      pc.close();
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(data.socketId);
        return newConnections;
      });
    }
    
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(data.socketId);
      return newStreams;
    });
  };

  const toggleAudio = (enabled) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  const toggleVideo = (enabled) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      // استبدل video track
      const videoTrack = screenStream.getVideoTracks()[0];
      const senders = Array.from(connections.values()).map(pc => 
        pc.getSenders().find(s => s.track && s.track.kind === 'video')
      );
      
      senders.forEach(sender => {
        if (sender) sender.replaceTrack(videoTrack);
      });

      videoTrack.onended = () => {
        // ارجع للكاميرا العادية
        if (localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          senders.forEach(sender => {
            if (sender) sender.replaceTrack(cameraTrack);
          });
        }
      };

    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  return {
    localStream,
    remoteStreams,
    users,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    shareScreen
  };
};