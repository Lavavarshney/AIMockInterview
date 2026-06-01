"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NonVerbalMetrics } from "@/lib/types";

type FaceDetectorConstructor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

type MediaPipeFaceLandmarker = {
  detectForVideo: (
    source: HTMLVideoElement,
    timestampMs: number
  ) => {
    faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    faceBlendshapes?: Array<{
      categories?: Array<{ categoryName: string; score: number }>;
    }>;
  };
  close?: () => void;
};

declare global {
  interface Window {
    FaceDetector?: FaceDetectorConstructor;
  }
}

type TrackerState = {
  samples: number;
  faceVisible: number;
  eyeContact: number;
  positivity: number;
};

const emptyState: TrackerState = {
  samples: 0,
  faceVisible: 0,
  eyeContact: 0,
  positivity: 0
};

export function useNonVerbalTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceLandmarkerRef = useRef<MediaPipeFaceLandmarker | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isDetectorSupported, setIsDetectorSupported] = useState(false);
  const [detectorLabel, setDetectorLabel] = useState("Not loaded");
  const [permissionError, setPermissionError] = useState("");
  const [state, setState] = useState<TrackerState>(emptyState);

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));
    setIsDetectorSupported(false);
  }, []);

  const metrics = useMemo<NonVerbalMetrics>(() => {
    const samples = Math.max(state.samples, 1);
    const eyeContactPercent = Math.round((state.eyeContact / samples) * 100);
    const lookingAwayPercent = Math.round(((state.faceVisible - state.eyeContact) / samples) * 100);
    const faceVisiblePercent = Math.round((state.faceVisible / samples) * 100);
    const expressionPositivity = Math.round((state.positivity / samples) * 100);
    const confidenceScore = clampPercent(
      Math.round(
        eyeContactPercent * 0.52 +
          faceVisiblePercent * 0.28 +
          expressionPositivity * 0.2 -
          lookingAwayPercent * 0.2
      )
    );
    return {
      samples: state.samples,
      eyeContactPercent,
      lookingAwayPercent,
      faceVisiblePercent,
      expressionPositivity,
      confidenceScore
    };
  }, [state]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    faceLandmarkerRef.current?.close?.();
    faceLandmarkerRef.current = null;
    setDetectorLabel("Not loaded");
    setIsTracking(false);
  }, []);

  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const mediaPipeResult = faceLandmarkerRef.current?.detectForVideo(video, performance.now());
    const landmarks = mediaPipeResult?.faceLandmarks?.[0];
    if (landmarks?.length) {
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const nose = landmarks[1] || landmarks[4];
      const chin = landmarks[152];
      const forehead = landmarks[10];
      const eyeMidX = (leftEye.x + rightEye.x) / 2;
      const eyeMidY = (leftEye.y + rightEye.y) / 2;
      const eyeDistance = Math.max(Math.abs(rightEye.x - leftEye.x), 0.001);
      const yawOffset = Math.abs(nose.x - eyeMidX) / eyeDistance;
      const pitchOffset = Math.abs(nose.y - eyeMidY) / Math.max(Math.abs((chin?.y || 0.72) - (forehead?.y || 0.18)), 0.001);
      const faceCenterX = landmarks.reduce((total, point) => total + point.x, 0) / landmarks.length;
      const faceCenterY = landmarks.reduce((total, point) => total + point.y, 0) / landmarks.length;
      const faceVisible = faceCenterX > 0.15 && faceCenterX < 0.85 && faceCenterY > 0.12 && faceCenterY < 0.86;
      const eyeContact = faceVisible && yawOffset < 0.2 && pitchOffset > 0.16 && pitchOffset < 0.42;
      const smileLeft =
        mediaPipeResult?.faceBlendshapes?.[0]?.categories?.find((category) => category.categoryName === "mouthSmileLeft")
          ?.score || 0;
      const smileRight =
        mediaPipeResult?.faceBlendshapes?.[0]?.categories?.find((category) => category.categoryName === "mouthSmileRight")
          ?.score || 0;
      const positivity = Math.max(0.25, Math.min(1, 0.38 + (smileLeft + smileRight) / 2));

      setState((current) => ({
        samples: current.samples + 1,
        faceVisible: current.faceVisible + (faceVisible ? 1 : 0),
        eyeContact: current.eyeContact + (eyeContact ? 1 : 0),
        positivity: current.positivity + positivity
      }));
      return;
    }

    if (!window.FaceDetector) {
      setPermissionError("Eye-contact scoring is unavailable. Camera preview is shown, but metrics are not estimated.");
      return;
    }

    let faceBox: DOMRectReadOnly | null = null;
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      faceBox = faces[0]?.boundingBox || null;
    } catch {
      setPermissionError("Eye-contact scoring is unavailable. Camera preview is shown, but metrics are not estimated.");
      return;
    }

    if (!faceBox) {
      setState((current) => ({
        ...current,
        samples: current.samples + 1
      }));
      return;
    }

    const centerX = faceBox.x + faceBox.width / 2;
    const centerY = faceBox.y + faceBox.height / 2;
    const xRatio = centerX / video.videoWidth;
    const yRatio = centerY / video.videoHeight;
    const sizeRatio = faceBox.width / video.videoWidth;
    const faceVisible = sizeRatio > 0.08;
    const eyeContact = faceVisible && xRatio > 0.34 && xRatio < 0.66 && yRatio > 0.18 && yRatio < 0.62;
    const positivity = eyeContact ? 0.72 : faceVisible ? 0.48 : 0.25;

    setState((current) => ({
      samples: current.samples + 1,
      faceVisible: current.faceVisible + (faceVisible ? 1 : 0),
      eyeContact: current.eyeContact + (eyeContact ? 1 : 0),
      positivity: current.positivity + positivity
    }));
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Webcam tracking is not supported in this browser.");
      return;
    }

    try {
      setPermissionError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setState(emptyState);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
        faceLandmarkerRef.current = (await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true
        })) as MediaPipeFaceLandmarker;
        setIsDetectorSupported(true);
        setDetectorLabel("MediaPipe FaceLandmarker");
      } catch {
        setIsDetectorSupported(Boolean(window.FaceDetector));
        setDetectorLabel(window.FaceDetector ? "Browser FaceDetector" : "Unavailable");
        if (!window.FaceDetector) {
          setPermissionError("MediaPipe could not load and this browser has no FaceDetector fallback.");
        }
      }
      setIsTracking(true);
      timerRef.current = setInterval(() => {
        void analyzeFrame();
      }, 100);
    } catch {
      setPermissionError("Camera permission was denied. You can continue without non-verbal tracking.");
    }
  }, [analyzeFrame]);

  useEffect(() => stop, [stop]);

  return {
    videoRef,
    isSupported,
    isDetectorSupported,
    detectorLabel,
    isTracking,
    permissionError,
    metrics,
    start,
    stop
  };
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}
