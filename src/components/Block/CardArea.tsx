'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNotify } from '@/context/NotifyContext';
import useSpeech from '@/utils/Speech';
import { MingcuteVolumeLine } from '@/components/ui/Icons';
import Link from 'next/link';

// --- 子元件：Card ---
// Card 元件現在只負責自身的 UI 和拖動動畫，不再關心播放邏輯
interface CardProps {
    word: DisplayWord | null;
    state: StateFormat;
    onSwipe: (direction: 'left' | 'right') => void;
    handleDoneToggle: (originalIndex: number) => void;
    isBackCard: boolean; // 用於堆疊效果
}

function Card({ word, state, onSwipe, handleDoneToggle, isBackCard }: CardProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [angle, setAngle] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [action, setAction] = useState<'none' | 'left' | 'right'>('none');

    const cardRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);

    const { speakE } = useSpeech();

    useEffect(() => {
        // 每當卡片內容改變時 (切換到下一張)，重設其狀態
        setPosition({ x: 0, y: 0 });
        setAngle(0);
        setAction('none');
        setIsFlipped(false);
        isDragging.current = false;
    }, [word?.id]);

    const handleMove = (x: number, y: number) => {
        setPosition({ x, y });
        setAngle(x * 0.1);
        const swipeThreshold = 100;
        if (x < -swipeThreshold) setAction('left');
        else if (x > swipeThreshold) setAction('right');
        else setAction('none');
    };

    const handleMoveEnd = () => {
        if (!word) return;
        
        if (action !== 'none') {
            const finalX = (action === 'left' ? -1 : 1) * (window.innerWidth + 200);
            setPosition({ x: finalX, y: position.y });
            
            // 根據滑動方向觸發動作
            if (action === 'left' && word.done) {
                handleDoneToggle(word.originalIndex); 
            } else if (action === 'right' && !word.done) {
                handleDoneToggle(word.originalIndex);
            }

            // 觸發父元件的 onSwipe，切換到下一張卡
            setTimeout(() => onSwipe(action), 150);
        } else {
            // 回到原位
            setPosition({ x: 0, y: 0 });
            setAngle(0);
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isBackCard) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        startPos.current = { x: e.clientX, y: e.clientY };
        isDragging.current = true;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || isBackCard) return;
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        handleMove(dx, dy);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isBackCard) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        isDragging.current = false;
        if (Math.abs(position.x) < 5 && Math.abs(position.y) < 5) {
            setIsFlipped(f => !f); // 如果只是點擊，則翻轉
        } else {
            handleMoveEnd();
        }
    };
    
    if (!word) return null;

    return (
        <div
            ref={cardRef}
            className={`card absolute inset-x-0 inset-y-16 m-auto w-[90%] max-w-md h-3/4 select-none ${isBackCard ? 'z-20 scale-95' : 'z-30 cursor-grab active:cursor-grabbing'}`}
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`,
                transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* ... 這裡可以放您原本的卡片翻轉和樣式邏輯 ... */}
            <div className="w-full h-full bg-blue-100 rounded-lg shadow-xl flex items-center justify-center text-4xl font-bold text-center p-4">
                 {isFlipped ? word.chinese : word.english}
            </div>
            {/* 可以在這裡添加滑動方向的視覺提示 */}
        </div>
    );
}


// --- 父元件：CardArea ---
// CardArea 現在負責管理要顯示的兩張卡片，並處理跳轉邏輯
interface CardAreaProps {
    words: Word[];
    state: StateFormat;
    handleDoneToggle: (originalIndex: number) => void;
    playableOriginalIndices: number[];
    playIndexInPlayable: number;
    setPlayIndexInPlayable: (updateFn: (prev: number) => number) => void;
}

export default function CardArea({
    words, state, handleDoneToggle,
    playableOriginalIndices, playIndexInPlayable, setPlayIndexInPlayable
}: CardAreaProps) {
    const { popNotify } = useNotify();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    // 當沒有可播放的單字時，顯示提示並提供返回按鈕
    useEffect(() => {
        if (words.length > 0 && playableOriginalIndices.length === 0) {
            popNotify("All words are done!");
            router.push(`/set/${setId}`);
        }
    }, [playableOriginalIndices.length, words.length, popNotify, router, setId]);

    // 處理滑動事件，切換到下一張卡
    const handleSwipe = () => {
        setPlayIndexInPlayable(prev => (prev + 1) % playableOriginalIndices.length);
    };

    // 計算當前和下一張卡片要顯示的單字
    const currentCardWord = useMemo(() => {
        if (playableOriginalIndices.length > 0) {
            const originalIndex = playableOriginalIndices[playIndexInPlayable];
            return { ...words[originalIndex], originalIndex };
        }
        return null;
    }, [playIndexInPlayable, playableOriginalIndices, words]);
    
    const nextCardWord = useMemo(() => {
        if (playableOriginalIndices.length > 1) {
            const nextIndexInPlayable = (playIndexInPlayable + 1) % playableOriginalIndices.length;
            const originalIndex = playableOriginalIndices[nextIndexInPlayable];
            return { ...words[originalIndex], originalIndex };
        }
        return null;
    }, [playIndexInPlayable, playableOriginalIndices, words]);

    if (playableOriginalIndices.length === 0) {
        return <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center text-white z-50">Loading cards...</div>;
    }

    return (
        <div className="fixed inset-0 bg-gray-200 z-40 overflow-hidden">
             <Link href={`/set/${setId}`} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/50 hover:bg-white/80">
                {/* <MdiClose className="text-3xl text-gray-800" /> */}
            </Link>
            {/* 後面的卡片 */}
            <Card
                word={nextCardWord}
                state={state}
                onSwipe={handleSwipe}
                handleDoneToggle={handleDoneToggle}
                isBackCard={true}
            />
            {/* 前面的卡片 */}
            <Card
                word={currentCardWord}
                state={state}
                onSwipe={handleSwipe}
                handleDoneToggle={handleDoneToggle}
                isBackCard={false}
            />
        </div>
    );
}