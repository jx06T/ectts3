'use client';

import React, { useEffect, useRef, useState, PointerEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNotify } from "@/context/NotifyContext";
import useSpeech from "@/utils/Speech";
import { MingcuteVolumeLine } from "@/components/ui/Icons";
import Link from 'next/link';

// --- Type Definitions ---
interface Word {
    id: string;
    english: string;
    chinese: string;
    selected?: boolean;
    done?: boolean;
}

interface StateFormat {
    rand: boolean;
    onlyPlayUnDone: boolean;
    showE?: boolean;
    showC?: boolean;
}


// ====================================================================
// Card Component (【修正】恢復您原始的滑動/點擊區分邏輯)
// ====================================================================
interface CardProps {
    english: string;
    state: StateFormat;
    chinese: string;
    done: boolean;
    index: number;
    toNext: () => void;
    back: boolean;
    handleDoneToggle: (index: number, type?: string) => void;
}

function Card({ english, state, chinese, done, index, toNext, back, handleDoneToggle }: CardProps) {
     const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isMoving, setIsMoving] = useState<boolean>(false);
    const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [angle, setAngle] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState<boolean>(!state.showC ? (!state.showE ? (Math.random() < 0.5) : true) : false);
    const [action, setAction] = useState<number>(0);
    const [alpha, setAlpha] = useState<number>(0);
    const { speakE } = useSpeech();
    const cardRef = useRef<HTMLDivElement>(null);
    const overX = useRef<number>(100);

    // ... handleMove, useEffects, handleMoveEnd 函數都保持不變 ...
    const handleMove = (newX: number, newY: number): void => {
        setPosition({ x: newX, y: newY });
        setAngle(newX * 0.1);
        if (newX < -overX.current) setAction(-1);
        else if (newX > overX.current) setAction(1);
        else setAction(0);
    };

    useEffect(() => {
        setAlpha(Math.min(90, Math.max(0, (Math.abs(position.x) - overX.current + 70) * 0.5)));
    }, [position]);

    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setAngle(0);
        setAction(0);
        setIsMoving(false);
        setIsDragging(false);
        setIsFlipped(!state.showC ? (!state.showE ? Math.random() < 0.5 : true) : false);
    }, [chinese, english, state.showC, state.showE]);

    const handleMoveEnd = (finalX: number) => {
        setIsDragging(false);
        if (Math.abs(finalX) < overX.current) {
            handleMove(0, 0);
        } else {
            const flyOutX = (finalX > 0 ? 1 : -1) * (window.innerWidth + 400);
            handleMove(flyOutX, position.y);
            
            setTimeout(() => {
                setIsMoving(true);
                if (finalX < -overX.current && done) {
                    handleDoneToggle(index, "done");
                } else if (finalX > overX.current && !done) {
                    handleDoneToggle(index, "done");
                }
                toNext();
            }, 200);
        }
    };

    // 【關鍵修正點在這裡】
    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (back || (e.target as HTMLElement).closest('.dontDoIt')) return;

        let hasDragged = false;
        setIsMoving(false);
        cardRef.current?.setPointerCapture(e.pointerId);
        
        // 捕獲初始狀態，用於計算相對位移
        const startX = e.clientX;
        const initialPos = { ...position };

        const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            if (!hasDragged && Math.abs(dx) > 5) {
                hasDragged = true;
                setIsDragging(true);
            }
            if (hasDragged) {
                const dy = moveEvent.clientY - e.clientY; // 相對於初始點的 Y 位移
                handleMove(initialPos.x + dx, initialPos.y + dy);
            }
        };

        const handlePointerUp = (upEvent: globalThis.PointerEvent) => {
            cardRef.current?.releasePointerCapture(upEvent.pointerId);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            
            setIsDragging(false); // 無論如何都結束拖動狀態

            if (hasDragged) {
                // 【核心修正】根據事件物件重新計算最終位置，而不是依賴 state
                const finalX = initialPos.x + (upEvent.clientX - startX);
                handleMoveEnd(finalX);
            } else {
                setIsFlipped(f => !f);
            }
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    // Card 的 JSX 結構保持不變，與您原始碼一致
    return (
        <div
            ref={cardRef}
            className={`card pointer-events-auto absolute top-16 bottom-[70px] select-none w-[95%] mt-3 rounded-2xl max-w-[440px] min-w-80 ${back ? "z-20 scale-[0.99]" : "z-30"}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`,
                transition: isDragging || isMoving ? 'none' : 'transform 0.2s ease-out',
                perspective: '1000px',
            }}
            onPointerDown={handlePointerDown}
        >
            {/* ... 您的雙面卡片 JSX ... */}
             <div className={`relative w-full h-full transition-transform duration-500`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)' }}>
                <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}>
                    <div className={`w-full h-full flex items-center justify-center p-4 rounded-2xl bg-blue-200 ${action === -1 ? "border-2 border-red-500" : (action === 1 ? "border-2 border-green-500" : "")}`}
                         style={{ backgroundColor: `hsla(${position.x < 0 ? 14 : 94}deg, 80%, 50%, ${alpha}%)`, transition: isDragging ? 'none' : 'background-color 0.2s ease-out' }}>
                        <h1 className="select-text leading-none text-center text-4xl">{chinese}</h1>
                    </div>
                </div>
                <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className={`w-full h-full flex items-center justify-center p-4 rounded-2xl bg-blue-200 ${action === -1 ? "border-2 border-red-500" : (action === 1 ? "border-2 border-green-500" : "")}`}
                         style={{ backgroundColor: `hsla(${position.x < 0 ? 14 : 94}deg, 80%, 50%, ${alpha}%)`, transition: isDragging ? 'none' : 'background-color 0.2s ease-out' }}>
                        <h1 className="select-text leading-none text-center text-4xl">{english}</h1>
                    </div>
                </div>
            </div>
            <div className={`opacity-70 absolute right-2 top-2 rounded-lg w-8 h-8 ${done ? "bg-green-300" : "bg-red-300"}`}></div>
            <div className="dontDoIt absolute left-2 top-2 w-8">
                <button className="dontDoIt" onClick={() => speakE(english)}>
                    <MingcuteVolumeLine className="dontDoIt text-3xl" />
                </button>
            </div>
        </div>
    );
}


// ====================================================================
// CardArea Component (【修正】處理異步加載)
// ====================================================================
interface CardAreaProps {
    randomTableToPlay: number[];
    state: StateFormat;
    handleDoneToggle: (index: number, type?: string) => void;
    randomTable: number[];
    words: Word[];
    progress: {
        playIndex: number;
        setPlayIndex: (index: number) => void;
    };
    isInitialLoading: boolean; // 新增 prop，由 MainBlock 告知是否仍在初始加載
}

function CardArea({ randomTableToPlay, state, handleDoneToggle, randomTable, words, progress, isInitialLoading }: CardAreaProps) {
    const { popNotify } = useNotify();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const { playIndex, setPlayIndex } = progress;
    const bias = useRef<number>(0);
    
    // 【修正】現在只有在非初始加載狀態下，才判斷是否 all done
    useEffect(() => {
        if (!isInitialLoading && words.length > 0 && randomTableToPlay.length === 0) {
            popNotify("All words are done!");
            router.push(`/set/${setId}`);
        }
    }, [isInitialLoading, randomTableToPlay.length, words.length, popNotify, router, setId]);
    
    useEffect(() => {
        if (!isInitialLoading && randomTableToPlay.length > 0 && randomTableToPlay.indexOf(playIndex) < 0) {
            setPlayIndex(randomTableToPlay[0]);
        }
    }, [isInitialLoading, playIndex, randomTableToPlay, setPlayIndex]);

    const toNext = () => {
        bias.current += 1;
        const currentIndexInPlayable = randomTableToPlay.indexOf(playIndex);
        const nextIndexInPlayable = (currentIndexInPlayable + 1) % randomTableToPlay.length;
        setPlayIndex(randomTableToPlay[nextIndexInPlayable]);
    };

    if (isInitialLoading) {
        return <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center text-white z-50">Loading cards...</div>;
    }

    // 您的雙卡片索引計算邏輯保持不變
    const currentPlayableIndex = randomTableToPlay.indexOf(playIndex);
    const nextPlayableIndex = (currentPlayableIndex + 1) % randomTableToPlay.length;
    const nextOriginalIndex = randomTableToPlay[nextPlayableIndex] ?? randomTableToPlay[0];
    const isFrontCard0 = (bias.current % 2) === 0;
    const indexForCard0 = isFrontCard0 ? playIndex : nextOriginalIndex;
    const indexForCard1 = isFrontCard0 ? nextOriginalIndex : playIndex;
    const wordForCard0 = words[indexForCard0] || { id: "p-0", chinese: "", english: "" };
    const wordForCard1 = words[indexForCard1] || { id: "p-1", chinese: "", english: "" };
    
    return (
        <div className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center bg-slate-100/5">
             <Link href={`/set/${setId}`} className="pointer-events-auto absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 transition hover:bg-white/80">
                <span className="text-2xl text-gray-800">✕</span>
            </Link>
            <Card state={state} chinese={wordForCard0.chinese} english={wordForCard0.english} done={!!wordForCard0.done} index={indexForCard0} toNext={toNext} handleDoneToggle={handleDoneToggle} back={!isFrontCard0} />
            <Card state={state} chinese={wordForCard1.chinese} english={wordForCard1.english} done={!!wordForCard1.done} index={indexForCard1} toNext={toNext} handleDoneToggle={handleDoneToggle} back={isFrontCard0} />
        </div>
    );
}

export default CardArea;