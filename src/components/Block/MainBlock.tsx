'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

// --- 匯入 ---
import { getRandId } from '@/utils/tool';
import { useNotify } from '@/context/NotifyContext';
import { useStateContext } from '@/context/StateContext';
import createConfirmDialog from '@/components/ui/ConfirmDialog';

import { useSpeechPlayer } from '@/utils/useSpeechPlayer';
// --- 子元件 ---
import WordItem from '@/components/ui/WordItem';
import PlayArea from '@/components/Block/PlayArea';
import CardArea from '@/components/Block/CardArea';
import MainHeader from '@/components/Block/MainHeader';
import Toolbar from '@/components/Block/Toolbar';
import SettingArea from '@/components/Block/SettingArea';

// ====================================================================
// 1. 核心數據邏輯 Hook (保持不變)
// ====================================================================

function useWordSet(setId: string | undefined) {
    const router = useRouter();
    const { allSet } = useStateContext();
    const { popNotify } = useNotify();
    const [words, setWords] = useState<Word[]>([]);
    const [currentTitle, setCurrentTitle] = useState<string>("");

    useEffect(() => {
        if (!setId) { setWords([]); setCurrentTitle(""); return; }
        const storedWords = localStorage.getItem(`set-${setId}`);
        if (storedWords) { setWords(JSON.parse(storedWords)); }
        else { popNotify("Word set not found."); router.replace('/'); return; }

        const currentSetInfo = allSet.find((s) => s.id === setId);
        if (currentSetInfo) { setCurrentTitle(currentSetInfo.title); }
        else if (allSet.length > 0) { popNotify("Set info not found in list."); router.replace('/'); }
    }, [setId, allSet, router, popNotify]);

    useEffect(() => {
        if (setId && words.length > 0) {
            const storedWords = localStorage.getItem(`set-${setId}`);
            if (JSON.stringify(words) !== storedWords) {
                localStorage.setItem(`set-${setId}`, JSON.stringify(words));
            }
        }
    }, [words, setId]);

    const updateWord = useCallback((index: number, field: 'english' | 'chinese', value: string) => {
        setWords(prev => prev.map((word, i) => i === index ? { ...word, [field]: value } : word));
    }, []);

    const deleteWord = useCallback((index: number) => {
        createConfirmDialog(`Delete "${words[index]?.english}"?`,
            () => { setWords(prev => prev.filter((_, i) => i !== index)); popNotify("Word deleted"); },
            () => popNotify("Delete canceled."), "Delete"
        );
    }, [words, popNotify]);

    const addWord = useCallback((newWord: { english: string, chinese: string }) => {
        setWords(prev => [...prev, { id: getRandId(), ...newWord }]);
        popNotify(`'${newWord.english}' added`);
    }, [popNotify]);

    return { words, setWords, currentTitle, updateWord, deleteWord, addWord };
}

export default function MainBlock() {
    const params = useParams();
    const setId = params.setId as string | undefined;
    const mode = params.mode?.[0] as string | undefined;

    // --- 數據層 (來自 useWordSet Hook) ---
    const { words, setWords, currentTitle, updateWord, deleteWord, addWord } = useWordSet(setId);

    // --- 全域狀態層 (來自 useStateContext) ---
    const { state, setState } = useStateContext();
    const { popNotify } = useNotify();

    // --- 顯示與互動狀態層 (MainBlock 自身管理) ---
    const [displayList, setDisplayList] = useState<DisplayWord[]>([]);
    const [playIndexInPlayable, setPlayIndexInPlayable] = useState(0); // 在可播放列表中的索引
    const [topIndex, setTopIndex] = useState(0); // 虛擬滾動的頂部項目索引 (IntersectionObserver 用)

    const scrollRef = useRef<HTMLDivElement>(null);
    // 如果有新增單字區域，也可能需要這些 refs
    // const newWordChIRef = useRef<HTMLInputElement>(null);
    // const newWordEnIRef = useRef<HTMLInputElement>(null);
    // const inputBoxRef = useRef<HTMLTextAreaElement>(null); // 如果導入/導出在 MainBlock 中

    // 1. 根據 words 和 rand 狀態，生成用於顯示的列表
    useEffect(() => {
        let list: DisplayWord[] = words.map((word, index) => ({
            ...word,
            originalIndex: index,
        }));

        if (state.rand) {
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
        }
        setDisplayList(list);
    }, [words, state.rand]);

    // 2. 根據 displayList 和篩選條件，生成可播放的列表（儲存的是原始索引）
    const playableOriginalIndices = useMemo(() => {
        return displayList
            .filter(word => word.selected && (!word.done || !state.onlyPlayUnDone))
            .map(word => word.originalIndex);
    }, [displayList, state.onlyPlayUnDone]);

    // --- 播放邏輯層 (來自 useSpeechPlayer Hook) ---
    const {
        isPlaying, settings, setSettings,
        togglePlayPause, playNext, playPrev
    } = useSpeechPlayer(
        words, // Hook 使用原始 words 陣列 (因為它的播放邏輯需要實際的 word 物件)
        playableOriginalIndices, // 傳遞原始索引，確保它知道哪些是可播放的
        playIndexInPlayable,     // Hook 管理在 playableOriginalIndices 陣列中的索引
        setPlayIndexInPlayable   // Hook 用來更新這個索引
    );

    // 當可播放列表改變時，重設播放索引，避免索引越界
    useEffect(() => {
        if (playIndexInPlayable >= playableOriginalIndices.length) {
            setPlayIndexInPlayable(0);
        }
    }, [playableOriginalIndices.length, playIndexInPlayable]);


    // 用於滾動到列表中的特定項目 (listIndex 是 displayList 的索引)
    const scrollTo = useCallback((listIndex: number) => {
        const itemElement = document.querySelector(`[data-list-index="${listIndex}"]`);
        itemElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    // IntersectionObserver 邏輯 (用於判斷哪個 WordItem 在頂部)
    useEffect(() => {
        if (!scrollRef.current) return;

        const getRootMargin = () => {
            const top = 100;
            const bottom = top + 60;
            const height = window.innerHeight;
            return `-${top}px 0% ${bottom - height}px`;
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const indexStr = (entry.target as HTMLElement).dataset.listIndex; // 注意這裡使用 data-list-index
                    if (indexStr) setTopIndex(parseInt(indexStr, 10));
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, { rootMargin: getRootMargin() });
        const toObserve = scrollRef.current.querySelectorAll('[data-list-index]');
        toObserve.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [displayList.length]);

    const handleDoneToggle = useCallback((originalIndex: number, type: string = "") => {
        const currentWords = words;
        const newWords = currentWords.map((word, i) => {
            if (i === originalIndex) {
                if (mode === 'cards' || type === "done") {
                    return { ...word, done: !word.done };
                }
                return { ...word, selected: !word.selected };
            }
            return word;
        });

        setWords(newWords);

        if (mode === 'cards' || type === "done") {
            const numDone = newWords.filter(w => w.done).length;
            popNotify(`Words done: ${numDone}/${newWords.length}`);
        } else {
            const numSelected = newWords.filter(w => w.selected).length;
            popNotify(`Words selected: ${numSelected}/${newWords.length}`);
        }
    }, [mode, setWords, setState, words, popNotify]);

    // ... 其他處理函數，例如 AddNewWord, Import/Export 等 ...

    if (mode === 'settings') {
        return (
            <div className='main bg-slate-25 w-full sm:h-full px-1 py-2 flex flex-col relative'>
                <MainHeader />
                <SettingArea />;
            </div>
        )

    }
    console.log(displayList, playIndexInPlayable, playableOriginalIndices,)
    return (
        <div className='main bg-slate-25 w-full sm:h-full px-1 py-2 flex flex-col relative'>
            <MainHeader />
            <Toolbar setWords={setWords} /> {/* 將 setWords 傳遞給 Toolbar */}

            <div ref={scrollRef} className='relative flex flex-grow justify-center w-full px-1 overflow-y-auto'>
                <div className='md:ml-4 px-1 sm:px-2 max-w-full sm:max-w-[28rem] sm:min-w-[22rem] space-y-3 pt-2'>
                    {displayList.map((displayWord, listIndex) => (
                        <div key={displayWord.id} data-list-index={listIndex}>
                            <WordItem
                                word={displayWord} // 傳遞 displayWord
                                index={displayWord.originalIndex} // 傳遞原始索引給操作函數
                                indexP={listIndex} // 傳遞 displayList 的索引
                                state={state}
                                isTop={listIndex === topIndex}
                                // 判斷是否正在播放的邏輯
                                isPlaying={playableOriginalIndices[playIndexInPlayable] === displayWord.originalIndex}
                                onDelete={deleteWord}
                                onPlay={() => {
                                    const newIndexInPlayable = playableOriginalIndices.indexOf(displayWord.originalIndex);
                                    if (newIndexInPlayable > -1) {
                                        setPlayIndexInPlayable(newIndexInPlayable);
                                    }
                                }}
                                onChange={updateWord}
                                onDoneToggle={handleDoneToggle}
                                onNext={() => { /* 處理新增 UI */ }}
                            />
                        </div>
                    ))}
                    <div className=' h-[calc(100vh-14rem)]  w-full /bg-amber-200'></div>
                    {/* ... 你的導入/導出區域 UI ... */}
                </div>
            </div>

            {mode === 'cards' && (
                <CardArea
                    words={words}
                    state={state}
                    handleDoneToggle={handleDoneToggle}
                    playableOriginalIndices={playableOriginalIndices}
                    playIndexInPlayable={playIndexInPlayable}
                    setPlayIndexInPlayable={setPlayIndexInPlayable}
                />
            )}

            <PlayArea
                words={words}
                currentTitle={currentTitle}
                playableIndices={playableOriginalIndices}
                playIndexInPlayable={playIndexInPlayable}
                scrollTo={(originalIndex) => {
                    const listIdx = displayList.findIndex(w => w.originalIndex === originalIndex);
                    if (listIdx > -1) scrollTo(listIdx);
                }}
                isPlaying={isPlaying}
                settings={settings}
                setSettings={setSettings}
                togglePlayPause={togglePlayPause}
                playNext={playNext}
                playPrev={playPrev}
            />
        </div>
    );
}