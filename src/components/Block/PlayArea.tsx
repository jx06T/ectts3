'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MingcuteSettings6Fill, FluentNextFrame24Filled, FluentPreviousFrame24Filled, FluentPause24Filled, FluentPlay24Filled } from "@/components/ui/Icons";
import { useNotify } from '@/context/NotifyContext';
import { useSpeechPlayer } from '@/utils/useSpeechPlayer'; // 確保路徑正確

interface UI { type: "range" | "checkbox"; min?: number; max?: number; step?: number; hint?: string; span?: string; }

// --- UI 常量 ---
const SettingsUI: Record<string, UI> = {
    timeWW: { span: "WtW", type: "range", min: 0, max: 7, step: 0.1, hint: "The interval between different words" },
    timeEE: { span: "EtE", type: "range", min: 0, max: 7, step: 0.1, hint: "The interval between repeated words" },
    timeEL: { span: "EtL", type: "range", min: 0, max: 7, step: 0.1, hint: "The interval between words and letters" },
    timeLC: { span: "LtC", type: "range", min: 0, max: 7, step: 0.1, hint: "The interval letters words and Chinese" },
    speed: { span: "speed", type: "range", min: 0.1, max: 3, step: 0.1, hint: "The speed of English words" },
    repeat: { span: "repeat", type: "range", min: 1, max: 13, hint: "number of repetitions" },
    letter: { span: "letter", type: "checkbox", hint: "Say the letters ?" },
    chinese: { span: "chinese", type: "checkbox", hint: "Say chinese ?" },
};
const SILENT_AUDIO_SRC = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhIAAAAAA=";

// --- Marquee (跑馬燈) ---
function Marquee({ children, text, className = "" }: { className?: string, children: React.ReactNode, text: string }) {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const checkOverflow = useCallback(() => {
        if (containerRef.current) {
            const { scrollWidth, clientWidth } = containerRef.current;
            setShouldAnimate(scrollWidth > clientWidth);
        }
    }, []);
    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text, checkOverflow]);
    return (
        <div ref={containerRef} className={`w-full overflow-hidden whitespace-nowrap ${className}`}>
            <div className={shouldAnimate ? 'animate-marquee' : ''}>{children}</div>
        </div>
    );
}

// --- PlayArea Props ---
interface PlayAreaProps {
    words: Word[];
    currentTitle: string;
    playableOriginalIndices: number[];
    playingOriginalIndex: number | null;
    setPlayingOriginalIndex: (index: number | null) => void;
    scrollTo: (originalIndex: number) => void;
}

// --- 主要的 PlayArea 元件 ---
export default function PlayArea({
    words, currentTitle, playableOriginalIndices, playingOriginalIndex, setPlayingOriginalIndex, scrollTo
}: PlayAreaProps) {
    const [showSetting, setShowSetting] = useState(false);
    const { popNotify } = useNotify();
    const params = useParams();
    const isCardsMode = params.mode?.[0] === 'cards';

    const [isPlaying, setIsPlaying] = useState(false);
    const keepAliveAudioRef = useRef<HTMLAudioElement>(null);

    const playableOriginalIndicesRef = useRef(playableOriginalIndices);
    useEffect(() => { playableOriginalIndicesRef.current = playableOriginalIndices; }, [playableOriginalIndices]);

    const onFinished = useCallback(() => {
        const currentPlayable = playableOriginalIndicesRef.current;
        if (currentPlayable.length === 0) {
            setIsPlaying(false); // No more words to play, stop.
            return;
        };
        const currentIndexInPlayable = playingOriginalIndex !== null ? currentPlayable.indexOf(playingOriginalIndex) : -1;
        const nextIndexInPlayable = (currentIndexInPlayable + 1) % currentPlayable.length;
        setPlayingOriginalIndex(currentPlayable[nextIndexInPlayable]);
    }, [playingOriginalIndex, setPlayingOriginalIndex]);
    
    const { settings, setSettings } = useSpeechPlayer(
        words,
        isPlaying,
        playingOriginalIndex,
        onFinished
    );
    
    const handleAudioPlay = useCallback(() => {
        if (!isPlaying) {
            popNotify("Playback started");
            setIsPlaying(true);
        }
    }, [isPlaying, popNotify]);
    
    const handleAudioPause = useCallback(() => {
        if (isPlaying) {
            popNotify("Playback paused");
            setIsPlaying(false);
        }
    }, [isPlaying, popNotify]);

    const togglePlayPause = useCallback(() => {
        const audio = keepAliveAudioRef.current;
        if (!audio) return;
        
        if (!audio.paused) {
            audio.pause();
        } else {
            if (playableOriginalIndices.length === 0) { popNotify("No words selected to play"); return; }
            if (playingOriginalIndex === null && playableOriginalIndices.length > 0) {
                setPlayingOriginalIndex(playableOriginalIndices[0]);
            }
            audio.play().catch(e => {
                console.error("Audio play failed:", e);
                popNotify("Could not start audio.");
            });
        }
    }, [playableOriginalIndices, playingOriginalIndex, setPlayingOriginalIndex, popNotify]);
    
    const playNext = useCallback(() => { onFinished() }, [onFinished]);
    
    const playPrev = useCallback(() => {
        const currentPlayable = playableOriginalIndicesRef.current;
        if (currentPlayable.length === 0) return;
        const currentIndexInPlayable = playingOriginalIndex !== null ? currentPlayable.indexOf(playingOriginalIndex) : -1;
        const prevIndexInPlayable = (currentIndexInPlayable - 1 + currentPlayable.length) % currentPlayable.length;
        setPlayingOriginalIndex(currentPlayable[prevIndexInPlayable]);
    }, [playingOriginalIndex, setPlayingOriginalIndex]);

    const currentWord = useMemo(() => {
        return playingOriginalIndex !== null ? words[playingOriginalIndex] : null;
    }, [playingOriginalIndex, words]);

    const scrollToPlaying = () => { if (playingOriginalIndex !== null) scrollTo(playingOriginalIndex); };
    
    const handleSettingChange = (key: string, value: any) => { setSettings(prev => ({ ...prev, [key]: value })); };

    return (
        <div className="fixed bottom-2 left-0 right-0 px-2 flex flex-col items-center z-40 pointer-events-none">
            <audio ref={keepAliveAudioRef} src="/test.wav" loop playsInline onPlay={handleAudioPlay} onPause={handleAudioPause} />
            <div className={` pointer-events-auto shadow-md bg-purple-200 rounded-lg w-full max-w-4xl opacity-95 overflow-hidden `}>
                <div className={` ${showSetting ? "max-h-[500px]" : "max-h-0 "} overflow-hidden h-full w-full transition-all duration-500`}>
                    <div className=' w-full h-full p-4  grid gap-x-10 gap-y-3 justify-center ' style={{ gridTemplateColumns: "repeat(auto-fit, 300px)" }}>
                        {Object.entries(settings).filter(([key]) => key !== "init").map(([key, value]) => {
                            const uiConfig = SettingsUI[key];
                            if (!uiConfig) return null;
                            return (
                                <div key={key} className="my-1 flex items-center space-x-1">
                                    <span onClick={() => popNotify(uiConfig.hint || "")} className="w-16 cursor-help ">{uiConfig.span}</span>
                                    {uiConfig.type === 'range' ? (
                                        <>
                                            <input type="range" className="accent-purple-700 flex-grow jx-3 w-36 inline-block mb-3.5" min={uiConfig.min} max={uiConfig.max} step={uiConfig.step} value={value as number} onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))} />
                                            <span className="w-4 text-right">{value}</span>
                                        </>
                                    ) : (
                                        <input type="checkbox" className="accent-purple-700 w-5 h-5 jx-4" checked={value as boolean} onChange={(e) => handleSettingChange(key, e.target.checked)} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <hr className="border-purple-300" />
                </div>
                <div className="w-full h-14 py-1 flex justify-between items-center px-4 space-x-4">
                    <div onClick={scrollToPlaying} className="flex-1 cursor-pointer overflow-hidden min-w-0">
                        <Marquee text={currentTitle} className="text-left"><span>{currentTitle}</span></Marquee>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={playPrev}><FluentPreviousFrame24Filled className="text-3xl" /></button>
                        <button onClick={() => setShowSetting(!showSetting)}><MingcuteSettings6Fill className="text-3xl" /></button>
                        <button onClick={togglePlayPause}>
                            {isPlaying ? <FluentPause24Filled className="text-3xl" /> : <FluentPlay24Filled className="text-3xl" />}
                        </button>
                        <button onClick={playNext}><FluentNextFrame24Filled className="text-3xl" /></button>
                    </div>
                    <div onClick={scrollToPlaying} className="flex-1 cursor-pointer overflow-hidden min-w-0 text-right">
                        <Marquee text={currentWord?.english || '...'} className="text-right">
                            {isCardsMode ? (
                                <span>✓ {words.filter(w => w.done).length} / {words.length}</span>
                            ) : (
                                currentWord ? <span>{currentWord.english} / {currentWord.chinese}</span> : <span>No word selected</span>
                            )}
                        </Marquee>
                    </div>
                </div>
            </div>
        </div>
    );
}