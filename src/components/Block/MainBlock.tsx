'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

// --- Icons  ---
import { TablerCircleArrowUpFilled, Fa6SolidFileImport, Fa6SolidFileExport } from '@/components/ui/Icons';

// --- Utilities ---
import { getRandId, copyToClipboard } from '@/utils/tool';
import { useNotify } from '@/context/NotifyContext';
import { useStateContext } from '@/context/StateContext';
import createConfirmDialog from '@/components/ui/ConfirmDialog';
import { useSpeechPlayer } from '@/utils/useSpeechPlayer';

// --- Sub-components ---
import WordItem from '@/components/ui/WordItem';
import PlayArea from '@/components/Block/PlayArea';
import CardArea from '@/components/Block/CardArea';
import MainHeader from '@/components/Block/MainHeader';
import Toolbar from '@/components/Block/Toolbar';
import SettingArea from '@/components/Block/SettingArea';


// ====================================================================
// Type Definitions
// ====================================================================
interface Word {
    id: string;
    english: string;
    chinese: string;
    selected?: boolean;
    done?: boolean;
}

interface DisplayWord extends Word {
    originalIndex: number;
}


// ====================================================================
// AddWordForm Component
// ====================================================================
interface AddWordFormProps {
    onAddWord: (word: { english: string; chinese: string }) => void;
    onClose: () => void;
}

function AddWordForm({ onAddWord, onClose }: AddWordFormProps) {
    const [newWord, setNewWord] = useState({ chinese: "", english: "" });
    const engInputRef = useRef<HTMLInputElement>(null);
    const chnInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        engInputRef.current?.focus();
    }, []);

    const handleAdd = () => {
        if (!newWord.english.trim() || !newWord.chinese.trim()) return;
        onAddWord(newWord);
        setNewWord({ chinese: "", english: "" });
        engInputRef.current?.focus();
    };

    return (
        <div className='fixed left-0 right-0 top-20 z-50 flex justify-center'>
            <div className='w-[min(90%,36rem)] space-y-2 rounded-md bg-purple-100 px-3 py-4 shadow-lg'>
                <input
                    ref={engInputRef}
                    className='w-full rounded-md bg-purple-50 p-1'
                    value={newWord.english}
                    type="text"
                    placeholder="English"
                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            chnInputRef.current?.focus();
                        }
                    }}
                />
                <input
                    ref={chnInputRef}
                    className='w-full rounded-md bg-purple-50 p-1'
                    value={newWord.chinese}
                    type="text"
                    placeholder="Chinese"
                    onChange={(e) => setNewWord({ ...newWord, chinese: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                />
                <div onClick={onClose} className='absolute right-2 top-2 h-6 w-6 cursor-pointer rounded-full bg-purple-300 text-center leading-6 transition hover:bg-purple-400'>
                    ✕
                </div>
            </div>
        </div>
    );
}

// ====================================================================
// ImportExportArea Component
// ====================================================================
interface ImportExportProps {
    words: Word[];
    onImport: (newWords: Word[]) => void;
    scrollToTop: () => void;
}

function ImportExportArea({ words, onImport, scrollToTop }: ImportExportProps) {
    const inputBoxRef = useRef<HTMLTextAreaElement>(null);
    const { popNotify } = useNotify();

    const handleExport = () => {
        const selectedWords = words.filter(e => e.selected);
        if (selectedWords.length === 0) {
            popNotify("Select words first to export");
            return;
        }
        const exportText = selectedWords.map(e => `${e.english}\n${e.chinese}`).join("\n");
        if (inputBoxRef.current) {
            inputBoxRef.current.value = exportText;
        }
        copyToClipboard(exportText);
        popNotify(`${selectedWords.length} words copied & exported`);
        inputBoxRef.current?.focus();
    };

    const handleImport = () => {
        if (!inputBoxRef.current || inputBoxRef.current.value.trim() === "") {
            popNotify("Please paste words into the text area first");
            return;
        }

        createConfirmDialog(
            "Import these words? This will replace your current word list.",
            () => {
                const lines = inputBoxRef.current!.value.split("\n");
                const result: Word[] = [];
                for (let i = 0; i < lines.length; i += 2) {
                    if (i + 1 < lines.length && lines[i].trim() && lines[i + 1].trim()) {
                        result.push({
                            id: getRandId(),
                            english: lines[i].trim(),
                            chinese: lines[i + 1].trim(),
                            selected: true,
                            done: false,
                        });
                    }
                }
                onImport(result);
                popNotify("Words imported successfully!");
                if (inputBoxRef.current) inputBoxRef.current.value = "";
            },
            () => popNotify("Import canceled."),
            "Import",
            "Cancel"
        );
    };


    return (
        <div className='relative w-full px-1 pt-8 sm:px-2 md:ml-4 mt-4'>
            <textarea
                placeholder='Paste words here to import (English on one line, Chinese on the next), or click Export to generate text from selected words.'
                rows={10}
                ref={inputBoxRef}
                className='h-full w-full rounded-md p-2 outline-none'
            ></textarea>
            <button onClick={scrollToTop} className='absolute top-4 right-2 inline'>
                <TablerCircleArrowUpFilled className='text-4xl text-black transition hover:text-slate-700' />
            </button>
            <div className='mt-4 flex h-24 space-x-4'>
                <button className='flex h-fit cursor-pointer items-center space-x-2 rounded-md bg-blue-100 px-4 py-2 transition hover:bg-blue-200' onClick={handleImport}>
                    <Fa6SolidFileImport className='text-xl text-red-800' />
                    <span className='whitespace-nowrap'>Import</span>
                </button>
                <button className='flex h-fit cursor-pointer items-center space-x-2 rounded-md bg-blue-100 px-4 py-2 transition hover:bg-blue-200' onClick={handleExport}>
                    <Fa6SolidFileExport className='text-xl' />
                    <span className='whitespace-nowrap'>Export</span>
                </button>
            </div>
        </div>
    );
}

// ====================================================================
// Data Hook
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
        if (storedWords) {
            const parsedWords: Word[] = JSON.parse(storedWords).map((w: any) => ({
                id: w.id || getRandId(),
                english: w.english,
                chinese: w.chinese,
                selected: w.selected ?? true,
                done: w.done ?? false,
            }));
            setWords(parsedWords);
        } else {
            popNotify("Word set not found.");
            router.replace('/');
            return;
        }

        const currentSetInfo = allSet.find((s) => s.id === setId);
        if (currentSetInfo) {
            setCurrentTitle(currentSetInfo.title);
        } else if (allSet.length > 0) {
            popNotify("Set info not found in list.");
            router.replace('/');
        }
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
        setWords(prev => [...prev, { id: getRandId(), selected: true, done: false, ...newWord }]);
        popNotify(`'${newWord.english}' added`);
    }, [popNotify]);

    return { words, setWords, currentTitle, updateWord, deleteWord, addWord };
}


// ====================================================================
// Main Component
// ====================================================================
const ITEM_HEIGHT = 64;
const BUFFER_SIZE = 5;

export default function MainBlock() {
    const params = useParams();
    const setId = params.setId as string | undefined;
    const mode = params.mode?.[0] as string | undefined;

    const { words, setWords, currentTitle, updateWord, deleteWord, addWord } = useWordSet(setId);
    const { state } = useStateContext();

    const [displayList, setDisplayList] = useState<DisplayWord[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    const [playingOriginalIndex, setPlayingOriginalIndex] = useState<number | null>(null);

    const [scrollTop, setScrollTop] = useState(0);
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(20);
    const [topIndex, setTopIndex] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const randStateRef = useRef(state.rand);

    // --- **關鍵修正 1: 建立 Ref 來穩定回調函數所需的數據** ---
    const playableOriginalIndicesRef = useRef<number[]>([]);

    // Intelligent displayList update logic
    useEffect(() => {
        const needsReshuffle = displayList.length !== words.length || randStateRef.current !== state.rand || (displayList.length === 0 && words.length > 0);
        if (needsReshuffle) {
            randStateRef.current = state.rand;
            let newList: DisplayWord[] = words.map((word, index) => ({ ...word, originalIndex: index }));
            if (state.rand) {
                for (let i = newList.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[newList[i], newList[j]] = [newList[j], newList[i]]; }
            }
            setDisplayList(newList);
        } else {
            const wordMap = new Map(words.map(w => [w.id, w]));
            setDisplayList(currentList => currentList.map(displayWord => {
                const updatedWordData = wordMap.get(displayWord.id);
                return updatedWordData ? { ...displayWord, ...updatedWordData } : displayWord;
            }));
        }
    }, [words, state.rand]);

    // Virtualization calculation logic
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const newStartIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
        const visibleItemsCount = Math.ceil(container.clientHeight / ITEM_HEIGHT);
        const newEndIndex = Math.min(displayList.length, newStartIndex + visibleItemsCount + BUFFER_SIZE * 2);
        setStartIndex(newStartIndex);
        setEndIndex(newEndIndex);
        setTopIndex(Math.floor((scrollTop + ITEM_HEIGHT / 2) / ITEM_HEIGHT));
    }, [scrollTop, displayList.length]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => { setScrollTop(event.currentTarget.scrollTop); };

    const playableOriginalIndices = useMemo(() => {
        return displayList
            .filter(word => word.selected && (!word.done || !state.onlyPlayUnDone))
            .map(word => word.originalIndex);
    }, [displayList, state.onlyPlayUnDone]);

    // Sync the latest playable list to the ref for stable callbacks
    useEffect(() => {
        playableOriginalIndicesRef.current = playableOriginalIndices;
    }, [playableOriginalIndices]);

    // --- **關鍵修正 2: `playNextWord` 回調現在完全穩定** ---
    const playNextWord = useCallback(() => {
        const currentPlayable = playableOriginalIndicesRef.current;
        if (currentPlayable.length === 0) {
            setPlayingOriginalIndex(null);
            return;
        }
        const currentIndexInPlayable = playingOriginalIndex !== null ? currentPlayable.indexOf(playingOriginalIndex) : -1;
        const nextIndexInPlayable = (currentIndexInPlayable + 1) % currentPlayable.length;
        const nextOriginalIndex = currentPlayable[nextIndexInPlayable];
        setPlayingOriginalIndex(nextOriginalIndex);
    }, [playingOriginalIndex]); // Now only depends on the stable state

    const { isPlaying, setIsPlaying, settings, setSettings, togglePlayPause, keepAliveAudioRef } = useSpeechPlayer(
        words,
        playingOriginalIndex,
        playNextWord
    );

    const playNext = useCallback(() => {
        if (!isPlaying) return;
        playNextWord();
    }, [isPlaying, playNextWord]);

    const playPrev = useCallback(() => {
        if (!isPlaying) return;
        const currentPlayable = playableOriginalIndicesRef.current;
        if (playingOriginalIndex === null || currentPlayable.length === 0) return;
        const currentIndexInPlayable = currentPlayable.indexOf(playingOriginalIndex);
        const prevIndexInPlayable = (currentIndexInPlayable - 1 + currentPlayable.length) % currentPlayable.length;
        const prevOriginalIndex = currentPlayable[prevIndexInPlayable];
        setPlayingOriginalIndex(prevOriginalIndex);
    }, [isPlaying, playingOriginalIndex]);

    // --- **關鍵修正 3: 新的 `handlePlayFromListItem` 函數** ---
    const handlePlayFromListItem = useCallback((originalIndexToPlay: number) => {
        // Step 1: Ensure the word is selected before playing.
        if (!words[originalIndexToPlay]?.selected) {
            const newWords = words.map((word, i) =>
                i === originalIndexToPlay ? { ...word, selected: true } : word
            );
            setWords(newWords);
        }

        // Step 2: Directly set the playback state.
        // The speech player hook will pick this up in the next render cycle.
        setPlayingOriginalIndex(originalIndexToPlay);
        // setIsPlaying(true);
    }, [words, setWords, setIsPlaying]);


    const handleDoneToggle = useCallback((originalIndex: number, type: string = "") => {
        const newWords = words.map((word, i) => {
            if (i === originalIndex) {
                if (mode === 'cards' || type === "done") return { ...word, done: !word.done };
                return { ...word, selected: !word.selected };
            }
            return word;
        });
        setWords(newWords);
    }, [mode, words, setWords]);

    const scrollTo = useCallback((listIndex: number) => {
        scrollRef.current?.scrollTo({ top: listIndex * ITEM_HEIGHT, behavior: 'smooth' });
    }, []);

    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    if (mode === 'settings') {
        return (
            <div className='main relative flex h-full w-full flex-col bg-slate-25 px-1 py-2 sm:h-full'>
                <MainHeader />
                <SettingArea />
            </div>
        );
    }

    return (
        <div className='main relative flex h-full w-full flex-col bg-slate-25 px-1 py-2 sm:h-full'>
            {showAddForm && (
                <AddWordForm
                    onAddWord={(newWord) => {
                        addWord(newWord);
                        setTimeout(() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollTo({
                                    top: scrollRef.current.scrollHeight,
                                    behavior: 'smooth'
                                });
                            }
                        }, 100);
                    }}
                    onClose={() => setShowAddForm(false)}
                />
            )}
            <MainHeader />
            <Toolbar setWords={setWords} />

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className='relative flex w-full flex-grow justify-center overflow-y-auto'
            >
                <div className='relative w-full sm:max-w-[28rem] sm:min-w-[22rem]'>
                    <div style={{ height: `${displayList.length * ITEM_HEIGHT}px` }} className='relative w-full'>
                        <div
                            style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}
                            className='absolute left-0 top-0 w-full space-y-3 px-1 pt-2 sm:px-2 md:ml-4'
                        >
                            {displayList.slice(startIndex, endIndex).map((displayWord, i) => {
                                const listIndex = startIndex + i;
                                return (
                                    <div key={displayWord.id}>
                                        <WordItem
                                            word={displayWord}
                                            index={displayWord.originalIndex}
                                            indexP={listIndex}
                                            state={state}
                                            isTop={listIndex === topIndex}
                                            isPlaying={playingOriginalIndex === displayWord.originalIndex}
                                            onDelete={deleteWord}
                                            onPlay={() => handlePlayFromListItem(displayWord.originalIndex)}
                                            onChange={updateWord}
                                            onDoneToggle={handleDoneToggle}
                                            onNext={() => setShowAddForm(true)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <ImportExportArea
                        words={words}
                        onImport={setWords}
                        scrollToTop={scrollToTop}
                    />
                </div>
            </div>

            {mode === 'cards' && (
                <CardArea
                    words={words}
                    state={state}
                    handleDoneToggle={handleDoneToggle}
                    playableOriginalIndices={playableOriginalIndices}
                    playIndexInPlayable={playingOriginalIndex !== null ? playableOriginalIndices.indexOf(playingOriginalIndex) : -1}
                    setPlayIndexInPlayable={() => {}}
                />
            )}

            <PlayArea
                words={words}
                currentTitle={currentTitle}
                playableIndices={playableOriginalIndices}
                playIndexInPlayable={playingOriginalIndex !== null ? playableOriginalIndices.indexOf(playingOriginalIndex) : -1}
                scrollTo={(originalIndex) => {
                    const listIdx = displayList.findIndex(w => w.originalIndex === originalIndex);
                    if (listIdx > -1) scrollTo(listIdx);
                }}
                isPlaying={isPlaying}
                settings={settings}
                setSettings={setSettings}
                togglePlayPause={() => {
                    if (isPlaying) {
                        togglePlayPause(); // The hook's pause function
                    } else {
                        // The hook's resume function (it continues from playingOriginalIndex)
                        setIsPlaying(true);
                    }
                }}
                playNext={playNext}
                playPrev={playPrev}
                keepAliveAudioRef={keepAliveAudioRef}
            />
        </div>
    );
}