'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '@/utils/Speech'; // <--- 使用您提供的 Hook
import { useNotify } from '@/context/NotifyContext';

// 假設 Settings 類型定義在 @/types
interface Settings {
    timeWW: number; timeEE: number; timeEL: number; timeLC: number;
    speed: number; repeat: number; letter: boolean; chinese: boolean; init?: boolean;
}

const initialSettings: Settings = {
    timeWW: 1, timeEE: 1, timeEL: 1, timeLC: 1, speed: 1,
    repeat: 3, letter: true, chinese: true, init: true
};

export function useSpeechPlayer(
    words: Word[],
    playableIndices: number[], // 這是原始 `words` 陣列中的索引
    playIndex: number,         // 這是 `playableIndices` 陣列中的索引
    setPlayIndex: (updateFn: (prevIndex: number) => number) => void
) {
    const { popNotify } = useNotify();
    const { synth, speakerC, speakerE, createUtterance } = useSpeech(); // <--- 從您的 Hook 獲取能力

    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [isPlaying, setIsPlaying] = useState(false);

    const playbackIdRef = useRef(0); // 用於中斷過時的播放序列
    const timeoutIds = useRef<NodeJS.Timeout[]>([]); // 儲存所有的 setTimeout ID 以便清除

    // --- 設定管理 ---
    useEffect(() => {
        const storedSettings = localStorage.getItem('ectts-settings');
        if (storedSettings) {
            setSettings(JSON.parse(storedSettings));
        }
    }, []);

    useEffect(() => {
        if (!settings.init) {
            localStorage.setItem('ectts-settings', JSON.stringify(settings));
        }
    }, [settings]);

    // --- 核心播放邏輯 ---
    const stop = useCallback(() => {
        synth.cancel();
        timeoutIds.current.forEach(clearTimeout);
        timeoutIds.current = [];
        setIsPlaying(false);
        console.log("S")
    }, [synth]);

    const playWord = useCallback((indexInPlayableList: number) => {
        stop(); // 開始新播放前，先停止所有舊的
        if (playableIndices.length === 0) return;

        const safeIndex = indexInPlayableList % playableIndices.length;
        const originalWordIndex = playableIndices[safeIndex];
        const wordToPlay = words[originalWordIndex];

        if (!wordToPlay) return;

        const currentPlaybackId = ++playbackIdRef.current;
        const queue: (() => void)[] = [];
        const addDelay = (ms: number) => queue.push(() => new Promise(resolve => timeoutIds.current.push(setTimeout(resolve, ms))));

        const speak = (utterance: SpeechSynthesisUtterance | null) => {
            if (utterance) {
                queue.push(() => new Promise(resolve => {
                    utterance.onend = resolve;
                    synth.speak(utterance);
                }));
            }
        };

        // 根據您的原始邏輯構建播放隊列
        for (let i = 0; i < settings.repeat; i++) {
            speak(createUtterance(wordToPlay.english, settings.speed, speakerE));
            if (i < settings.repeat - 1) addDelay(settings.timeEE * 1000);
        }

        if (settings.letter) {
            addDelay(settings.timeEL * 1000);
            const letters = wordToPlay.english.replace(/[^a-zA-Z]/g, '').split("").join(',');
            speak(createUtterance(letters, 1, speakerE));
        }

        if (settings.chinese) {
            addDelay(settings.timeLC * 1000);
            speak(createUtterance(wordToPlay.chinese, 0.9, speakerC));
        }

        addDelay(settings.timeWW * 1000);

        // 執行播放隊列
        (async () => {
            for (const task of queue) {
                if (playbackIdRef.current !== currentPlaybackId) return; // 如果播放被中斷，則退出
                await task();
            }
            // 隊列播放完成後，自動跳到下一首
            if (playbackIdRef.current === currentPlaybackId) {
                setPlayIndex(prev => (prev + 1) % playableIndices.length);
            }
        })();

    }, [playableIndices, words, settings, stop, synth, speakerC, speakerE, createUtterance, setPlayIndex]);

    useEffect(() => {
        if (isPlaying) {
            playWord(playIndex);
        } else {
            stop();
        }
    }, [playIndex, isPlaying]); // 當索引改變或播放狀態改變時觸發

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            popNotify("Playback paused");
            setIsPlaying(false);
        } else {
            if (playableIndices.length === 0) {
                popNotify("No words selected to play");
                return;
            }
            popNotify("Playback started");
            setIsPlaying(true);
        }
    }, [isPlaying, popNotify, playableIndices.length]);

    const playNext = useCallback(() => {
        if (playableIndices.length > 0) {
            setPlayIndex(prev => (prev + 1) % playableIndices.length);
        }
    }, [playableIndices.length, setPlayIndex]);

    const playPrev = useCallback(() => {
        if (playableIndices.length > 0) {
            setPlayIndex(prev => (prev - 1 + playableIndices.length) % playableIndices.length);
        }
    }, [playableIndices.length, setPlayIndex]);

    return { isPlaying, settings, setSettings, togglePlayPause, playNext, playPrev };
}