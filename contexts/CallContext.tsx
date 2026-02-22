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
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        
        // TURN servers (for Relay when P2P is blocked by Firewall/Mobile Data)
        // [ULTRA FREE OPTION]: ExpressTURN (1TB Free/month)
        {
          urls: import.meta.env.VITE_TURN_URL || '',
          username: import.meta.env.VITE_TURN_USERNAME || '',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
        },
        // [FOREVER UNLIMITED STRATEGY]: If you ever exceed 1TB and want it 100% free, 
        // host 'CoTURN' (Open Source) on an "Oracle Cloud Always Free" instance. 
        // Oracle gives you 10TB of bandwidth for free every single month.
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
    };

    const setupPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.current.send({
                    type: 'broadcast',
                    event: 'call:ice-candidate',
                    payload: { candidate: event.candidate }
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnection.current = pc;
        return pc;
    };

    const handleOffer = async ({ payload }: any) => {
        if (callStatus !== 'idle') return; // Busy
        
        setCallerName(partnerProfile?.display_name || 'Partner');
        setIsVideoCall(payload.isVideo);
        setCallStatus('incoming');
        
        // Store the offer to use when accepting
        (peerConnection as any).pendingOffer = payload.offer;
    };

    const handleAnswer = async ({ payload }: any) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setCallStatus('connected');
        }
    };

    const handleIceCandidate = async ({ payload }: any) => {
        if (peerConnection.current) {
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
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
                video: video,
                audio: true
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

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
                video: isVideoCall,
                audio: true
            });
            setLocalStream(stream);

            const pc = setupPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = (peerConnection as any).pendingOffer;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

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
