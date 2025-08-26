'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MingcuteSettings6Fill, FluentNextFrame24Filled, FluentPreviousFrame24Filled, FluentPause24Filled, FluentPlay24Filled } from "@/components/ui/Icons";
import { useNotify } from '@/context/NotifyContext';

// --- 類型定義 (通常應該放在 types.ts) ---
interface Settings {
    timeWW: number; timeEE: number; timeEL: number; timeLC: number;
    speed: number; repeat: number; letter: boolean; chinese: boolean; init?: boolean;
}
interface UI {
    type: "range" | "checkbox"; min?: number; max?: number;
    step?: number; hint?: string; span?: string;
}

// --- UI 設定常量 ---
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


// --- Marquee (跑馬燈) 子元件 ---
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
            <div className={shouldAnimate ? 'animate-marquee' : ''}>
                {children}
            </div>
        </div>
    );
}

// --- PlayArea Props 定義 ---
interface PlayAreaProps {
    words: Word[];
    currentTitle: string;
    playableIndices: number[]; // 原始 words 陣列中的索引
    playIndexInPlayable: number; // playableIndices 陣列中的索引
    scrollTo: (originalIndex: number) => void;
    // --- 從 useSpeechPlayer Hook 傳入的 props ---
    isPlaying: boolean;
    settings: Settings;
    setSettings: (updateFn: (prevSettings: Settings) => Settings) => void;
    togglePlayPause: () => void;
    playNext: () => void;
    playPrev: () => void;
    keepAliveAudioRef: React.RefObject<HTMLAudioElement | null>;
}


// --- 主要的 PlayArea 元件 ---
export default function PlayArea({
    words, currentTitle, playableIndices, playIndexInPlayable, scrollTo,
    isPlaying, settings, setSettings, togglePlayPause, playNext, playPrev, keepAliveAudioRef
}: PlayAreaProps) {
    const [showSetting, setShowSetting] = useState(false);
    const { popNotify } = useNotify();
    const params = useParams();
    const isCardsMode = params.mode?.[0] === 'cards';

    // 計算當前正在播放的單字
    const currentWord = useMemo(() => {
        if (playableIndices.length > 0 && playIndexInPlayable < playableIndices.length) {
            const originalWordIndex = playableIndices[playIndexInPlayable];
            return words[originalWordIndex];
        }
        return null;
    }, [playableIndices, playIndexInPlayable, words]);

    // 處理滾動到正在播放的單字
    const scrollToPlaying = () => {
        if (currentWord) {
            const originalIndex = words.findIndex(w => w.id === currentWord.id);
            if (originalIndex > -1) {
                scrollTo(originalIndex);
            }
        }
    };

    // 處理設定值的變更
    const handleSettingChange = (key: string, value: string | boolean | number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed bottom-2 left-0 right-0 px-2 flex flex-col items-center z-40 pointer-events-none">
            <audio
                ref={keepAliveAudioRef}
                src="/test.wav"
                loop
                style={{ display: 'none' }}
                aria-hidden="true"
            />
            <div className={` pointer-events-auto shadow-md bg-purple-200 rounded-lg w-full max-w-4xl opacity-95 overflow-hidden `}>
                <div className={` ${showSetting ? "max-h-[500px]" : "max-h-0 "} overflow-hidden h-full w-fulltransition-all duration-500`}>
                    <div className=' w-full h-full p-4  grid gap-x-10 gap-y-3 justify-center ' style={{ gridTemplateColumns: "repeat(auto-fit, 300px)" }}>
                        {Object.entries(settings).filter(([key]) => key !== "init").map(([key, value]) => {
                            const uiConfig = SettingsUI[key];
                            if (!uiConfig) return null;
                            return (
                                <div key={key} className="my-1 flex items-center space-x-1">
                                    <span onClick={() => popNotify(uiConfig.hint || "")} className="w-16 cursor-help ">{uiConfig.span}</span>
                                    {uiConfig.type === 'range' ? (
                                        <>
                                            <input
                                                type="range"
                                                className="accent-purple-700 flex-grow jx-3 w-36 inline-block mb-3.5"
                                                min={uiConfig.min}
                                                max={uiConfig.max}
                                                step={uiConfig.step}
                                                value={value as number}
                                                onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
                                            />
                                            <span className="w-4 text-right">{value}</span>
                                        </>
                                    ) : (
                                        <input
                                            type="checkbox"
                                            className="accent-purple-700 w-5 h-5 jx-4"
                                            checked={value as boolean}
                                            onChange={(e) => handleSettingChange(key, e.target.checked)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <hr className="border-purple-300" />
                </div>
                <div className="w-full h-14 py-1 flex justify-between items-center px-4 space-x-4">
                    <div onClick={scrollToPlaying} className="flex-1 cursor-pointer overflow-hidden min-w-0">
                        <Marquee text={currentTitle} className="text-left">
                            <span>{currentTitle}</span>
                        </Marquee>
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
                                currentWord ? (
                                    <span>{currentWord.english} / {currentWord.chinese}</span>
                                ) : (
                                    <span>No word selected</span>
                                )
                            )}
                        </Marquee>
                    </div>
                </div>
            </div>
        </div>
    );
}