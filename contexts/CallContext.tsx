import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCouples } from './CouplesContext';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface CallContextType {
    callStatus: CallStatus;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isIncomingCall: boolean;
    callerName: string;
    isVideoCall: boolean;
    initiateCall: (video: boolean) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    isMuted: boolean;
    isVideoOff: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
    iceServers: [
        // STUN servers (for P2P connection when NAT is simple)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        
        // Primary TURN from Environment Variables
        ...(import.meta.env.VITE_TURN_URL ? [{
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL
        }] : []),

        // Robust Public TURN Fallbacks (Metered OpenRelay)
        // These guarantee NAT traversal works across different networks for debugging
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
    ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { couple, partnerProfile } = useCouples();
    
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isVideoCall, setIsVideoCall] = useState(true);
    const [callerName, setCallerName] = useState('');

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const channel = useRef<any>(null);
    const pendingOfferObj = useRef<RTCSessionDescriptionInit | null>(null);
    const earlyCandidates = useRef<RTCIceCandidateInit[]>([]);

    useEffect(() => {
        if (!user || !couple) return;

        // Subscribe to a unique channel for this couple's calls
        channel.current = supabase.channel(`call:${couple.id}`, {
            config: { broadcast: { self: false } }
        });

        channel.current
            .on('broadcast', { event: 'call:offer' }, handleOffer)
            .on('broadcast', { event: 'call:answer' }, handleAnswer)
            .on('broadcast', { event: 'call:ice-candidate' }, handleIceCandidate)
            .on('broadcast', { event: 'call:hangup' }, handleHangup)
            .subscribe();

        return () => {
            if (channel.current) {
                supabase.removeChannel(channel.current);
            }
            cleanupCall();
        };
    }, [user, couple]);

    const cleanupCall = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setCallStatus('idle');
        pendingOfferObj.current = null;
        earlyCandidates.current = [];
    };

    const setupPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Output ICE Candidate:', event.candidate.candidate);
                channel.current.send({
                    type: 'broadcast',
                    event: 'call:ice-candidate',
                    payload: { candidate: event.candidate }
                });
            } else {
                console.log('[WebRTC] All ICE candidates sent.');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection State:', pc.connectionState);
        };

        pc.onsignalingstatechange = () => {
             console.log('[WebRTC] Signaling State:', pc.signalingState);
        };

        pc.ontrack = (event) => {
            console.log('[WebRTC] Track Received:', event.track.kind, event.track.id);
            if (event.streams && event.streams[0]) {
                setRemoteStream(new MediaStream(event.streams[0].getTracks()));
            } else {
                setRemoteStream((prevStream) => {
                    const tracks = prevStream ? prevStream.getTracks() : [];
                    return new MediaStream([...tracks, event.track]);
                });
            }
        };

        peerConnection.current = pc;
        return pc;
    };

    const handleOffer = async ({ payload }: any) => {
        if (callStatus !== 'idle') return; // Busy
        
        setCallerName(partnerProfile?.full_name || 'Partner');
        setIsVideoCall(payload.isVideo);
        setCallStatus('incoming');
        
        // Store the offer to use when accepting
        pendingOfferObj.current = payload.offer;
    };

    const handleAnswer = async ({ payload }: any) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setCallStatus('connected');
            
            // Process any buffered candidates
            for (const candidateInit of earlyCandidates.current) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidateInit));
                } catch (e) {
                    console.error("Error adding buffered ice candidate", e);
                }
            }
            earlyCandidates.current = [];
        }
    };

    const handleIceCandidate = async ({ payload }: any) => {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
                console.error("Error handling ice candidate", e);
            }
        } else {
            // Buffer the candidate if peer connection or remote description is not set yet
            earlyCandidates.current.push(payload.candidate);
        }
    };

    const handleHangup = () => {
        cleanupCall();
    };

    const initiateCall = async (video: boolean) => {
        setIsVideoCall(video);
        setCallStatus('calling');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
                audio: true
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.current.send({
                type: 'broadcast',
                event: 'call:offer',
                payload: { offer, isVideo: video }
            });
        } catch (e: any) {
            console.error("Could not start call", e);
            if (e.name === 'NotAllowedError') {
                alert('Microphone/Camera access denied. Please grant permission in your browser settings.');
            } else if (e.name === 'NotReadableError') {
                alert('Could not access camera/microphone. It may be in use by another application.');
            } else {
                alert('An error occurred while trying to start the call: ' + e.message);
            }
            cleanupCall();
        }
    };

    const acceptCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoCall ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
                audio: true
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();

            const offer = pendingOfferObj.current;
            if (offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                pendingOfferObj.current = null;
            }

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Process any buffered candidates (candidates arriving before we hit 'Accept')
            for (const candidateInit of earlyCandidates.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
                } catch (e) {
                    console.error("Error adding buffered ice candidate (acceptCall)", e);
                }
            }
            earlyCandidates.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.current.send({
                type: 'broadcast',
                event: 'call:answer',
                payload: { answer }
            });

            setCallStatus('connected');
        } catch (e: any) {
            console.error("Could not accept call", e);
            if (e.name === 'NotAllowedError') {
                alert('Microphone/Camera access denied. Please grant permission in your browser settings.');
            } else if (e.name === 'NotReadableError') {
                alert('Could not access camera/microphone. It may be in use by another application.');
            } else {
                alert('An error occurred while trying to accept the call: ' + e.message);
            }
            cleanupCall();
        }
    };

    const rejectCall = () => {
        channel.current.send({
            type: 'broadcast',
            event: 'call:hangup',
            payload: { reason: 'rejected' }
        });
        cleanupCall();
    };

    const endCall = () => {
        channel.current.send({
            type: 'broadcast',
            event: 'call:hangup',
            payload: { reason: 'ended' }
        });
        cleanupCall();
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <CallContext.Provider value={{
            callStatus,
            localStream,
            remoteStream,
            isIncomingCall: callStatus === 'incoming',
            callerName,
            isVideoCall,
            initiateCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleVideo,
            isMuted,
            isVideoOff
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
