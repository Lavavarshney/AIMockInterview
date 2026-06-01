"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length?: number;
  0: {
    transcript: string;
    confidence?: number;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition() {
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");
  const [lastConfidence, setLastConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );

    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      void navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permission) => {
          setPermissionState(permission.state);
          permission.onchange = () => setPermissionState(permission.state);
        })
        .catch(() => setPermissionState("unknown"));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    recognitionRef.current?.stop();
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setLastConfidence(0);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(
    async () => {
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          setPermissionState("granted");
        } catch (error) {
          setPermissionState("denied");
          const denied = error instanceof DOMException && error.name === "NotAllowedError";
          throw new Error(
            denied
              ? "Microphone permission was denied. Allow microphone access from the browser address bar, then try again."
              : "Microphone is unavailable. Check that a microphone is connected and not being used by another app."
          );
        }
      }

      return new Promise<string>((resolve, reject) => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) {
          reject(new Error("Speech recognition is not supported in this browser."));
          return;
        }

        clearTranscript();
        const recognition = new Recognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        recognition.maxAlternatives = 3;

        const resetSilenceTimer = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => recognition.stop(), 4500);
        };

        recognition.onstart = () => {
          setIsListening(true);
          resetSilenceTimer();
        };

        recognition.onresult = (event) => {
          let interim = "";
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (result.isFinal) {
              finalTranscriptRef.current += `${result[0].transcript.trim()} `;
              setLastConfidence(result[0].confidence || 0);
            } else {
              interim += result[0].transcript;
              setLastConfidence(result[0].confidence || 0);
            }
          }
          interimTranscriptRef.current = interim;
          setInterimTranscript(interim || finalTranscriptRef.current.trim());
          resetSilenceTimer();
        };

        recognition.onerror = (event) => {
          setIsListening(false);
          if (event.error === "not-allowed") {
            setPermissionState("denied");
          }
          if (event.error === "no-speech" || event.error === "audio-capture") {
            recognition.stop();
            return;
          }
          reject(
            new Error(
              event.error === "not-allowed"
                ? "Microphone permission was denied. Allow microphone access from the browser address bar, then try again."
                : event.error
            )
          );
        };

        recognition.onend = () => {
          setIsListening(false);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          const answer = finalTranscriptRef.current.trim() || interimTranscriptRef.current.trim();
          resolve(answer);
        };

        recognition.start();
      });
    },
    [clearTranscript]
  );

  useEffect(
    () => () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort();
    },
    []
  );

  return {
    startListening,
    stopListening,
    clearTranscript,
    interimTranscript,
    isListening,
    isSupported,
    permissionState,
    lastConfidence
  };
}
