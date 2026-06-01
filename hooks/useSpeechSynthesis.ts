"use client";

import { useCallback, useEffect, useState } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const waitForVoices = useCallback(async () => {
    if (!isSupported) return [] as SpeechSynthesisVoice[];
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return voices;

    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const timeout = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 800);
      window.speechSynthesis.onvoiceschanged = () => {
        window.clearTimeout(timeout);
        resolve(window.speechSynthesis.getVoices());
      };
    });
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>(async (resolve) => {
        if (!isSupported) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const voices = await waitForVoices();
        const preferredVoice =
          voices.find((voice) => /english|india|united states|united kingdom/i.test(`${voice.name} ${voice.lang}`)) ||
          voices[0];
        const chunks = splitSpeech(text);
        const keepAlive = window.setInterval(() => window.speechSynthesis.resume(), 4000);

        for (const chunk of chunks) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise<void>((chunkResolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              window.clearTimeout(fallbackTimer);
              setIsSpeaking(false);
              chunkResolve();
            };
            const utterance = new SpeechSynthesisUtterance(chunk);
            if (preferredVoice) {
              utterance.voice = preferredVoice;
              utterance.lang = preferredVoice.lang;
            }
            utterance.rate = 0.92;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = finish;
            utterance.onerror = finish;
            const fallbackTimer = window.setTimeout(finish, Math.max(3500, chunk.length * 90));
            window.speechSynthesis.speak(utterance);
          });
        }

        window.clearInterval(keepAlive);
        setIsSpeaking(false);
        resolve();
      }),
    [isSupported, waitForVoices]
  );

  useEffect(() => cancel, [cancel]);

  return { speak, cancel, isSpeaking, isSupported };
}

function splitSpeech(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.length ? sentences : [text]) {
    if ((current + " " + sentence).trim().length > 180 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
