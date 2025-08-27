'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '@/utils/Speech';
import { useNotify } from '@/context/NotifyContext';

// --- Type Definitions ---
interface Word {
    english: string;
    chinese: string;
}

interface Settings {
    timeWW: number; timeEE: number; timeEL: number; timeLC: number;
    speed: number; repeat: number; letter: boolean; chinese: boolean; init?: boolean;
}

const initialSettings: Settings = {
    timeWW: 1, timeEE: 1, timeEL: 1, timeLC: 1, speed: 1,
    repeat: 3, letter: true, chinese: true, init: true
};

const SILENT_AUDIO_SRC = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhIAAAAAA=";

// --- The Refactored Hook ---
export function useSpeechPlayer(
    words: Word[],
    // NEW: The stable originalIndex of the word to play, or null if nothing.
    playingOriginalIndex: number | null,
    // NEW: Callback to signal completion and request the next word.
    onFinished: () => void
) {
    const { popNotify } = useNotify();
    const { synth, speakerC, speakerE, createUtterance } = useSpeech();

    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [isPlaying, setIsPlaying] = useState(false);

    const playbackIdRef = useRef(0);
    const timeoutIds = useRef<NodeJS.Timeout[]>([]);
    const keepAliveAudioRef = useRef<HTMLAudioElement | null>(null);

    const settingsRef = useRef(settings);
    const wordsRef = useRef<Word[]>(words);

    // --- Settings and Data Management ---
    useEffect(() => {
        const storedSettings = localStorage.getItem('ectts-settings');
        if (storedSettings) {
            try {
                const parsedSettings = JSON.parse(storedSettings);
                setSettings(prev => ({ ...prev, ...parsedSettings, init: false }));
            } catch (error) {
                console.error("Failed to parse settings from localStorage:", error);
                setSettings(prev => ({ ...prev, init: false }));
            }
        } else {
            setSettings(prev => ({ ...prev, init: false }));
        }
    }, []);

    useEffect(() => {
        settingsRef.current = settings;
        wordsRef.current = words;
        if (!settings.init) {
            const { ...settingsToStore } = settings;
            localStorage.setItem('ectts-settings', JSON.stringify(settingsToStore));
        }
    }, [settings, words]);

    // --- Keep-Alive Audio (Unchanged) ---
    useEffect(() => {
        const handleAudioPlay = () => !isPlaying && setIsPlaying(true);
        const handleAudioPause = () => isPlaying && setIsPlaying(false);
        if (!keepAliveAudioRef.current) {
            const audio = new Audio(SILENT_AUDIO_SRC);
            audio.loop = true; audio.volume = 0; audio.setAttribute('playsinline', 'true');
            keepAliveAudioRef.current = audio;
        }
        const audioElement = keepAliveAudioRef.current;
        audioElement.addEventListener('play', handleAudioPlay);
        audioElement.addEventListener('pause', handleAudioPause);
        return () => {
            audioElement.removeEventListener('play', handleAudioPlay);
            audioElement.removeEventListener('pause', handleAudioPause);
        };
    }, [isPlaying]);


    // --- Core Playback Logic ---
    const stop = useCallback(() => {
        playbackIdRef.current++;
        synth.cancel();
        timeoutIds.current.forEach(clearTimeout);
        timeoutIds.current = [];
    }, [synth]);

    // This is the main effect that drives playback, now triggered by playingOriginalIndex
    useEffect(() => {
        if (!isPlaying || playingOriginalIndex === null) {
            stop();
            return;
        }

        stop(); // Always start clean

        const currentWords = wordsRef.current;
        const wordToPlay = currentWords[playingOriginalIndex];

        if (!wordToPlay) {
            console.error(`Word with originalIndex ${playingOriginalIndex} not found.`);
            onFinished(); // Signal to move on if word is somehow invalid
            return;
        }

        const currentPlaybackId = playbackIdRef.current;
        const queue: (() => Promise<void>)[] = [];

        const addDelay = (ms: number) => queue.push(() => new Promise(resolve => {
            const id = setTimeout(resolve, ms);
            timeoutIds.current.push(id);
        }));

        const speak = (utterance: SpeechSynthesisUtterance | null) => {
            if (utterance) {
                queue.push(() => new Promise(resolve => {
                    utterance.onend = () => resolve();
                    utterance.onerror = () => { console.warn("Speech error."); resolve(); };
                    synth.speak(utterance);
                }));
            }
        };

        const currentSettings = settingsRef.current;
        for (let i = 0; i < currentSettings.repeat; i++) {
            speak(createUtterance(wordToPlay.english, currentSettings.speed, speakerE));
            if (i < currentSettings.repeat - 1) addDelay(currentSettings.timeEE * 1000);
        }
        if (currentSettings.letter) {
            addDelay(currentSettings.timeEL * 1000);
            const letters = wordToPlay.english.replace(/[^a-zA-Z]/g, '').split("").join(',');
            speak(createUtterance(letters, 1, speakerE));
        }
        if (currentSettings.chinese) {
            addDelay(currentSettings.timeLC * 1000);
            speak(createUtterance(wordToPlay.chinese, 0.9, speakerC));
        }
        addDelay(currentSettings.timeWW * 1000);

        (async () => {
            for (const task of queue) {
                if (playbackIdRef.current !== currentPlaybackId) return;
                await task();
            }
            if (playbackIdRef.current === currentPlaybackId) {
                onFinished(); // Signal completion
            }
        })();

    }, [isPlaying, playingOriginalIndex, stop, onFinished, createUtterance, speakerC, speakerE, synth]);


    const togglePlayPause = useCallback(() => {
        const nextIsPlaying = !isPlaying;
        if (nextIsPlaying) {
            if (wordsRef.current.filter(w => w.selected).length === 0) {
                popNotify("No words selected to play");
                return;
            }
            popNotify("Playback started");
            setIsPlaying(true);
            keepAliveAudioRef.current?.play().catch(console.warn);
        } else {
            popNotify("Playback paused");
            setIsPlaying(false);
            keepAliveAudioRef.current?.pause();
        }
    }, [isPlaying, popNotify]);

    useEffect(() => {
        return () => {
            stop();
            keepAliveAudioRef.current?.pause();
        };
    }, [stop]);

    // NEW: Return setIsPlaying so parent can control it directly when starting playback
    return { isPlaying, setIsPlaying, settings, setSettings, togglePlayPause, keepAliveAudioRef };
}