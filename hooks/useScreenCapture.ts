"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [livePreviewUrl, setLivePreviewUrl] = useState("");
  const [streamStatus, setStreamStatus] = useState("Not sharing");
  const [isSupported, setIsSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
    );
  }, []);

  const stopFramePump = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, []);

  const stopSharing = useCallback(() => {
    stopFramePump();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setPreviewUrl("");
    setLivePreviewUrl("");
    setStreamStatus("Not sharing");
  }, [stopFramePump]);

  const attachStream = useCallback(async (displayStream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = displayStream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    await video.play().catch(() => undefined);
  }, []);

  const pumpFramePreview = useCallback(() => {
    stopFramePump();
    frameTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const activeStream = streamRef.current;
      const track = activeStream?.getVideoTracks()[0];

      if (!video || !activeStream || !track || track.readyState !== "live") {
        setStreamStatus(track ? `Track ${track.readyState}` : "No active video track");
        return;
      }

      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        setStreamStatus("Waiting for video frames");
        void attachStream(activeStream);
        return;
      }

      const canvas = document.createElement("canvas");
      const width = Math.min(video.videoWidth, 960);
      const height = Math.round((width / video.videoWidth) * video.videoHeight);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, width, height);
      setLivePreviewUrl(canvas.toDataURL("image/jpeg", 0.72));
      setStreamStatus("Receiving frames");
    }, 700);
  }, [attachStream, stopFramePump]);

  const startSharing = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen sharing is not supported in this browser.");
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
    const track = displayStream.getVideoTracks()[0];
    track?.addEventListener("ended", () => {
      stopFramePump();
      streamRef.current = null;
      setStream(null);
      setPreviewUrl("");
      setLivePreviewUrl("");
      setStreamStatus("Sharing stopped");
    });
    streamRef.current = displayStream;
    setStreamStatus("Connecting to shared screen");
    setStream(displayStream);
    await attachStream(displayStream);
    pumpFramePreview();
    return displayStream;
  }, [attachStream, pumpFramePreview, stopFramePump]);

  const captureScreenshot = useCallback(async () => {
    const activeStream = streamRef.current || stream;
    const video = videoRef.current;
    if (!activeStream || !video) {
      throw new Error("Start screen sharing before capturing a screenshot.");
    }

    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to capture the shared screen.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setPreviewUrl(dataUrl);
    setLivePreviewUrl(dataUrl);
    return dataUrl;
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      void attachStream(stream);
    }
  }, [attachStream, stream]);

  useEffect(() => () => stopSharing(), [stopSharing]);

  return {
    stream,
    videoRef,
    previewUrl,
    livePreviewUrl,
    streamStatus,
    isSupported,
    startSharing,
    captureScreenshot,
    stopSharing
  };
}
