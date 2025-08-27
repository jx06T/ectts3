'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '@/utils/Speech'; // 確保路徑正確

interface Settings {
    timeWW: number;
    timeEE: number;
    timeEL: number;
    timeLC: number;
    speed: number;
    repeat: number;
    letter: boolean;
    chinese: boolean;
    init?: boolean;
}

const initialSettings: Settings = {
    timeWW: 1,
    timeEE: 1,
    timeEL: 1,
    timeLC: 1,
    speed: 1,
    repeat: 3,
    letter: true,
    chinese: true,
    init: true,
};

/**
 * 純粹的語音朗讀引擎 Hook
 * @param words - 完整的單字列表
 * @param isPlaying - 是否處於播放狀態 (由父元件控制)
 * @param playingOriginalIndex - 當前要播放的單字在 `words` 陣列中的索引
 * @param onFinished - 當一個單字的完整播放序列完成時呼叫的回調
 */
export function useSpeechPlayer(
    words: Word[],
    isPlaying: boolean,
    playingOriginalIndex: number | null,
    onFinished: () => void
) {
    const { synth, speakerC, speakerE, createUtterance } = useSpeech();
    const [settings, setSettings] = useState<Settings>(initialSettings);

    const playbackIdRef = useRef(0);
    const timeoutIds = useRef<NodeJS.Timeout[]>([]);
    const settingsRef = useRef(settings);
    const wordsRef = useRef<Word[]>(words);

    // --- 設定管理 ---
    useEffect(() => {
        const storedSettings = localStorage.getItem('ectts-settings');
        if (storedSettings) {
            try {
                const parsedSettings = JSON.parse(storedSettings);
                setSettings(prev => ({ ...prev, ...parsedSettings, init: false }));
            } catch (error) {
                console.error("Failed to parse settings:", error);
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
            const { init, ...settingsToStore } = settings;
            localStorage.setItem('ectts-settings', JSON.stringify(settingsToStore));
        }
    }, [settings, words]);

    // --- 核心播放邏輯 ---
    const stop = useCallback(() => {
        playbackIdRef.current++;
        synth.cancel();
        timeoutIds.current.forEach(clearTimeout);
        timeoutIds.current = [];
    }, [synth]);

    useEffect(() => {
        if (!isPlaying || playingOriginalIndex === null) {
            stop();
            return;
        }

        stop(); // 開始新朗讀前先清理

        const currentWords = wordsRef.current;
        const wordToPlay = currentWords[playingOriginalIndex];
        if (!wordToPlay) {
            onFinished();
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
                onFinished();
            }
        })();

    }, [isPlaying, playingOriginalIndex, stop, onFinished, createUtterance, speakerC, speakerE, synth]);

    // --- 元件卸載時的清理 ---
    useEffect(() => {
        return () => stop();
    }, [stop]);

    return { settings, setSettings };
}