import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { useGetAttendanceQuery, useGetGeofenceConfigQuery, usePunchInMutation, usePunchOutMutation } from '@/store/api';
import { Camera, MapPin, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/punch')({
  component: PunchPage,
});

function PunchPage() {
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthRadius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const user = useAppSelector(s => s.auth.user);
  const { data: attendanceData, refetch } = useGetAttendanceQuery(
    user ? { userId: user.id } : undefined,
    { skip: !user }
  );
  const { data: geofenceData } = useGetGeofenceConfigQuery();
  const [punchInMutation, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOutMutation, { isLoading: isPunchingOut }] = usePunchOutMutation();
  const records = attendanceData?.records ?? [];
  const todayKey = new Date().toISOString().split('T')[0];
  const currentSessionRecord = records.find(r => r.date === todayKey && r.status === 'active');
  const currentSession = currentSessionRecord
    ? {
        punchIn: currentSessionRecord.punchIn,
        selfieUrl: currentSessionRecord.selfieUrl,
        latitude: currentSessionRecord.latitude,
        longitude: currentSessionRecord.longitude,
      }
    : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    const videoElement = videoRef.current;
    videoElement.srcObject = stream;
    videoElement.play().catch(() => {
      setCameraError('Unable to start camera preview. Please retry.');
    });
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setStream(mediaStream);
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream]);

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setSelfie(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  }, [stopCamera]);

  const getLocation = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Location access denied. Please allow location permissions.'),
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  const handlePunchIn = async () => {
    if (!selfie) return;
    try {
      setActionError(null);
      await punchInMutation({ selfieBase64: selfie, latitude: location?.lat ?? null, longitude: location?.lng ?? null }).unwrap();
      setSelfie(null);
      await refetch();
    } catch (error) {
      setActionError((error as { data?: { message?: string } })?.data?.message || 'Failed to punch in');
    }
  };

  const handlePunchOut = async () => {
    if (!user) return;
    try {
      setActionError(null);
      await punchOutMutation().unwrap();
      await refetch();
    } catch (error) {
      setActionError((error as { data?: { message?: string } })?.data?.message || 'Failed to punch out');
    }
  };

  const isPunchedIn = !!currentSession;
  const geofenceEnabled = !!geofenceData?.enabled;
  const geofenceConfigValid = !!geofenceData?.validConfig;
  const geofenceDistance =
    geofenceEnabled &&
    geofenceConfigValid &&
    location &&
    typeof geofenceData?.officeLatitude === 'number' &&
    typeof geofenceData?.officeLongitude === 'number'
      ? distanceMeters(location.lat, location.lng, geofenceData.officeLatitude, geofenceData.officeLongitude)
      : null;
  const outsideGeofence =
    geofenceEnabled && geofenceConfigValid && geofenceDistance != null && geofenceDistance > (geofenceData?.radiusMeters ?? 0);
  const geofenceErrorMessage = geofenceEnabled
    ? !geofenceConfigValid
      ? 'Attendance radius is misconfigured. Please contact admin.'
      : outsideGeofence
        ? `Current location doesn't fall under attendance radius (${Math.round(geofenceDistance ?? 0)}m away, allowed ${geofenceData?.radiusMeters}m)`
        : null
    : null;
  const isActionDisabled =
    (!isPunchedIn && !selfie) ||
    isPunchingIn ||
    isPunchingOut ||
    outsideGeofence ||
    (geofenceEnabled && !geofenceConfigValid);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Punch In / Out</h1>

      {/* Clock */}
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="font-display text-6xl font-bold text-foreground tabular-nums">
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        {isPunchedIn && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm">
            <Clock className="h-3.5 w-3.5" />
            Clocked in since {currentSession.punchIn}
          </div>
        )}
      </div>

      {/* Camera */}
      {!isPunchedIn && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Live Selfie Capture</h2>
          </div>
          {cameraError ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {cameraError}
            </div>
          ) : selfie ? (
            <div className="space-y-3">
              <img src={selfie} alt="Selfie" className="w-full rounded-lg border border-border" />
              <button onClick={() => { setSelfie(null); startCamera(); }} className="text-sm text-primary hover:underline">
                Retake
              </button>
            </div>
          ) : stream ? (
            <div className="space-y-3">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg border border-border" />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={captureSelfie}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Capture Selfie
                </button>
                <button
                  onClick={stopCamera}
                  className="w-full h-10 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
                >
                  Close Camera
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full h-10 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              Open Camera
            </button>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Location */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Location</h2>
        </div>
        {locationError ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {locationError}
            <button onClick={getLocation} className="ml-auto text-primary hover:underline text-xs">Retry</button>
          </div>
        ) : location ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${outsideGeofence ? 'text-destructive' : 'text-success'}`}>
              <CheckCircle2 className="h-4 w-4" />
              Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
            </div>
            {geofenceErrorMessage ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {geofenceErrorMessage}
              </div>
            ) : geofenceEnabled && geofenceDistance != null ? (
              <div className="text-xs text-muted-foreground">
                Within attendance radius. Distance from office: {Math.round(geofenceDistance)}m / {geofenceData?.radiusMeters}m
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Acquiring location...</div>
        )}
      </div>

      {/* Action */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}
      <button
        onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
        disabled={isActionDisabled}
        className={`w-full h-14 rounded-2xl font-display text-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isPunchedIn
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground glow-primary hover:bg-primary/90'
        }`}
      >
        {isPunchingIn || isPunchingOut ? 'Please wait...' : isPunchedIn ? 'PUNCH OUT' : 'PUNCH IN'}
      </button>
    </div>
  );
}