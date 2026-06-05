import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    Circle,
    Download,
    Grid2X2,
    Image,
    Loader2,
    RotateCcw,
    Square,
    Trash2,
    Video,
} from "lucide-react";
import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import usewindowstore from "@store/window.js";
import usePhotosStore from "@store/photos.js";
import useAuthStore from "@store/auth.js";

const LOCAL_CAPTURE_KEY = "cameraRecentCaptures";
const MAX_RECENT_CAPTURES = 18;

const getCaptureTime = (date = new Date()) => ({
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
    iso: date.toISOString(),
});

const readRecentCaptures = () => {
    try {
        const saved = localStorage.getItem(LOCAL_CAPTURE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Could not load camera captures:", error);
        return [];
    }
};

const CameraApp = () => {
    const { window: appWindow } = usewindowstore();
    const { user } = useAuthStore();
    const { uploadPhoto } = usePhotosStore();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const [captures, setCaptures] = useState(readRecentCaptures);
    const [activeView, setActiveView] = useState("camera");
    const [isStarting, setIsStarting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [facingMode, setFacingMode] = useState("user");
    const [cameraError, setCameraError] = useState("");
    const [status, setStatus] = useState({
        tone: "idle",
        message: user ? "Ready to save photos to Gallery." : "Sign in to sync captures to Gallery.",
    });

    const latestCapture = captures[0];
    const photoCount = useMemo(() => captures.filter((capture) => capture.type === "photo").length, [captures]);
    const videoCount = useMemo(() => captures.filter((capture) => capture.type === "video").length, [captures]);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const saveRecentCaptures = useCallback((nextCaptures) => {
        const persistentPhotos = nextCaptures
            .filter((capture) => capture.type === "photo")
            .slice(0, MAX_RECENT_CAPTURES);

        try {
            localStorage.setItem(LOCAL_CAPTURE_KEY, JSON.stringify(persistentPhotos));
        } catch (error) {
            console.warn("Camera capture history is full, keeping this session only:", error);
        }
    }, []);

    const addRecentCapture = useCallback((capture) => {
        setCaptures((current) => {
            const next = [capture, ...current].slice(0, MAX_RECENT_CAPTURES);
            saveRecentCaptures(next);
            return next;
        });
    }, [saveRecentCaptures]);

    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("This browser does not support camera capture.");
            return;
        }

        setIsStarting(true);
        setCameraError("");
        stopStream();

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
        } catch (error) {
            console.error("Camera access failed:", error);
            setCameraError(error?.name === "NotAllowedError"
                ? "Camera permission is blocked. Allow access and try again."
                : "Could not start the camera. Check that another app is not using it.");
        } finally {
            setIsStarting(false);
        }
    }, [facingMode, stopStream]);

    useEffect(() => {
        if (!appWindow?.camera?.isOpen) {
            stopStream();
            return undefined;
        }

        startCamera();
        return stopStream;
    }, [appWindow?.camera?.isOpen, startCamera, stopStream]);

    useEffect(() => {
        let intervalId;
        if (isRecording) {
            intervalId = globalThis.setInterval(() => {
                setRecordingTime((current) => current + 1);
            }, 1000);
        }
        return () => globalThis.clearInterval(intervalId);
    }, [isRecording]);

    useEffect(() => {
        setStatus((current) => {
            if (current.tone !== "idle") return current;
            return {
                tone: "idle",
                message: user ? "Ready to save photos to Gallery." : "Sign in to sync captures to Gallery.",
            };
        });
    }, [user]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const capturePhoto = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || isSaving) return;
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            setStatus({ tone: "warning", message: "Camera is still warming up. Try again in a moment." });
            return;
        }

        setIsSaving(true);

        try {
            const context = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (facingMode === "user") {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.setTransform(1, 0, 0, 1, 0, 0);

            const imageUrl = canvas.toDataURL("image/jpeg", 0.92);
            const capturedAt = getCaptureTime();
            const title = `Camera ${capturedAt.date} ${capturedAt.time}`;
            let syncedPhoto = null;
            let syncError = null;

            if (user) {
                try {
                    syncedPhoto = await uploadPhoto({
                        imageUrl,
                        title,
                        album: "Library",
                    });
                } catch (error) {
                    syncError = error;
                }
            }

            addRecentCapture({
                id: syncedPhoto?._id || `local-${Date.now()}`,
                photoId: syncedPhoto?._id,
                type: "photo",
                url: imageUrl,
                title,
                synced: Boolean(syncedPhoto),
                ...capturedAt,
            });

            setActiveView("gallery");
            setStatus({
                tone: syncedPhoto ? "success" : syncError ? "error" : "warning",
                message: syncedPhoto
                    ? "Photo saved to Gallery."
                    : syncError
                        ? "Photo saved locally. Gallery sync failed."
                        : "Photo saved locally. Sign in to sync it to Gallery.",
            });
        } catch (error) {
            console.error("Photo capture failed:", error);
            setStatus({
                tone: "error",
                message: error.response?.data?.message || error.message || "Could not save the photo.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const startRecording = () => {
        if (!streamRef.current || isRecording) return;

        try {
            chunksRef.current = [];
            const recorder = new MediaRecorder(streamRef.current);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
                const url = URL.createObjectURL(blob);
                const capturedAt = getCaptureTime();

                addRecentCapture({
                    id: `video-${Date.now()}`,
                    type: "video",
                    url,
                    title: `Video ${capturedAt.date} ${capturedAt.time}`,
                    duration: recordingTime,
                    synced: false,
                    ...capturedAt,
                });

                setStatus({ tone: "warning", message: "Video saved in Camera recents for this session." });
                setActiveView("gallery");
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecordingTime(0);
            setIsRecording(true);
            setStatus({ tone: "idle", message: "Recording video." });
        } catch (error) {
            console.error("Recording failed:", error);
            setStatus({ tone: "error", message: "This browser could not start video recording." });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const deleteCapture = (id) => {
        setCaptures((current) => {
            const deleted = current.find((capture) => capture.id === id);
            if (deleted?.type === "video" && deleted.url?.startsWith("blob:")) {
                URL.revokeObjectURL(deleted.url);
            }

            const next = current.filter((capture) => capture.id !== id);
            saveRecentCaptures(next);
            return next;
        });
    };

    const clearCaptures = () => {
        if (!confirm("Clear Camera recents? Photos already saved to Gallery will stay there.")) return;

        captures.forEach((capture) => {
            if (capture.type === "video" && capture.url?.startsWith("blob:")) {
                URL.revokeObjectURL(capture.url);
            }
        });
        setCaptures([]);
        saveRecentCaptures([]);
    };

    const downloadCapture = (capture) => {
        const link = document.createElement("a");
        link.href = capture.url;
        link.download = `${capture.title || "camera-capture"}.${capture.type === "photo" ? "jpg" : "webm"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const switchCamera = () => {
        if (isRecording) return;
        setFacingMode((current) => current === "user" ? "environment" : "user");
    };

    const statusClasses = {
        idle: "text-gray-500 dark:text-gray-400",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-amber-600 dark:text-amber-400",
        error: "text-red-600 dark:text-red-400",
    };

    return (
        <div id="camera" className="w-full h-full flex flex-col select-none bg-[#f7f7f8] text-gray-900 dark:bg-[#111214] dark:text-gray-100">
            <div id="window-header" className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 bg-white/85 backdrop-blur-xl dark:border-gray-800 dark:bg-[#17181b]/90">
                <WindowControls target="camera" />
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Camera size={17} className="text-gray-700 dark:text-gray-200" />
                    <span>Camera</span>
                </div>
                <div className="flex w-[3.25rem] justify-end">
                    {isStarting && <Loader2 size={16} className="animate-spin text-gray-400" />}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 bg-white dark:bg-[#111214]">
                <main className="relative flex min-w-0 flex-1 flex-col bg-black">
                    {cameraError ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                                <AlertTriangle size={30} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-white">Camera unavailable</p>
                                <p className="mt-1 max-w-sm text-sm text-gray-400">{cameraError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={startCamera}
                                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 active:scale-95"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                            />

                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(0,0,0,0.34))]" />

                            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                                {isRecording ? (
                                    <>
                                        <Circle size={9} className="fill-red-400 text-red-400" />
                                        <span>{formatTime(recordingTime)}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={14} className="text-emerald-300" />
                                        <span>{isStarting ? "Starting" : "Live"}</span>
                                    </>
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-5 pt-20">
                                <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveView("gallery")}
                                        className="group flex size-14 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/12 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                                        title="Open recents"
                                    >
                                        {latestCapture?.type === "photo" ? (
                                            <img src={latestCapture.url} alt="" className="h-full w-full object-cover" draggable={false} />
                                        ) : (
                                            <Grid2X2 size={22} />
                                        )}
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            disabled={isSaving || isRecording || isStarting}
                                            className="flex size-[4.5rem] items-center justify-center rounded-full border-[5px] border-white bg-white/15 text-white shadow-2xl transition hover:bg-white/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                            title="Take photo"
                                        >
                                            {isSaving ? <Loader2 size={28} className="animate-spin" /> : <Camera size={30} />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={isStarting || isSaving}
                                            className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                            title={isRecording ? "Stop recording" : "Record video"}
                                        >
                                            {isRecording ? <Square size={22} className="fill-white" /> : <Video size={23} />}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={switchCamera}
                                        disabled={isRecording}
                                        className="flex size-14 items-center justify-center rounded-xl border border-white/15 bg-white/12 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                        title="Switch camera"
                                    >
                                        <RotateCcw size={21} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                <aside className={`flex w-64 shrink-0 flex-col border-l border-gray-200/80 bg-[#fbfbfc] dark:border-gray-800 dark:bg-[#17181b] ${activeView === "gallery" ? "" : "max-md:hidden"}`}>
                    <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3 dark:border-gray-800">
                        <div>
                            <p className="text-sm font-semibold">Recents</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{photoCount} photos · {videoCount} videos</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveView(activeView === "gallery" ? "camera" : "gallery")}
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-200/80 hover:text-gray-900 active:scale-95 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            title={activeView === "gallery" ? "Focus camera" : "Show recents"}
                        >
                            <Grid2X2 size={17} />
                        </button>
                    </div>

                    <div className={`px-4 py-3 text-xs font-medium ${statusClasses[status.tone]}`}>
                        {status.message}
                    </div>

                    {captures.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-gray-400">
                            <Image size={38} />
                            <p className="text-sm font-medium">No captures yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {captures.map((capture) => (
                                        <div key={capture.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                            {capture.type === "photo" ? (
                                                <img src={capture.url} alt={capture.title} className="h-full w-full object-cover" draggable={false} />
                                            ) : (
                                                <video src={capture.url} className="h-full w-full object-cover" muted />
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6">
                                                <p className="truncate text-[11px] font-semibold text-white">{capture.time}</p>
                                                <p className="truncate text-[10px] text-white/70">
                                                    {capture.type === "video" ? formatTime(capture.duration) : capture.synced ? "In Gallery" : "Local"}
                                                </p>
                                            </div>

                                            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() => downloadCapture(capture)}
                                                    className="rounded-full bg-white/90 p-1.5 text-gray-700 shadow-sm transition hover:bg-white active:scale-95"
                                                    title="Download"
                                                >
                                                    <Download size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteCapture(capture.id)}
                                                    className="rounded-full bg-red-500/90 p-1.5 text-white shadow-sm transition hover:bg-red-600 active:scale-95"
                                                    title="Remove from recents"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-200/80 p-3 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={clearCaptures}
                                    className="w-full rounded-md px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.99] dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    Clear Recents
                                </button>
                            </div>
                        </>
                    )}
                </aside>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

const CameraWindow = WindowWrapper(CameraApp, "camera");

export default CameraWindow;
