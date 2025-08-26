'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { IcRoundDoneOutline, MaterialFileRename, MaterialDeleteRounded, AkarIconsMoreVerticalFill, MaterialAddToPhotos, MdiGithub, SolarSiderbarBold } from '@/components/ui/Icons';
import { useNotify } from '@/context/NotifyContext';
import { useStateContext } from '@/context/StateContext';
import createConfirmDialog from '@/components/ui/ConfirmDialog';
import { getRandId } from '@/utils/tool';

function PopupMenu({ isShow, y, id, callback }: { isShow: boolean, y: number, id: string, callback: (id: string, type: "D" | "R") => void }) {
    const optionRef = useRef<HTMLDivElement>(null);
    const [spaceBelow, setSpaceBelow] = useState(100);

    useEffect(() => {
        const handleResize = () => setSpaceBelow(window.innerHeight);
        handleResize(); // 初始化
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const yCss = `${y + (y > spaceBelow - 160 ? -70 : 20)}px`;

    useEffect(() => {
        if (optionRef.current) {
            optionRef.current.style.top = yCss;
        }
    }, [y, isShow, yCss]);

    return (
        <>
            {isShow && (
                <div
                    ref={optionRef}
                    className="shadow-md bg-purple-200 left-60 absolute z-60 rounded-lg p-2 space-y-2"
                >
                    <button
                        className="option-button2 h-8 items-center justify-start flex w-full cursor-pointer rounded-md hover:bg-purple-300"
                        onClick={() => callback(id, "D")}
                    >
                        <MaterialDeleteRounded className="option-button2 text-3xl text-red-700 mr-2" />
                        <span>Delete</span>
                    </button>
                    <hr />
                    <button
                        className="option-button2 h-8 items-center justify-start flex w-full cursor-pointer rounded-md hover:bg-purple-300"
                        onClick={() => callback(id, "R")}
                    >
                        <MaterialFileRename className="option-button2 text-3xl text-blue-700 mr-2" />
                        <span>Rename</span>
                    </button>
                </div>
            )}
        </>
    );
}

function SetItem({ title = "", onShowOption, selected, id, rename, handleRename }: { handleRename: (id: string, name?: string) => void, rename: boolean, title: string, onShowOption: (id: string, offsetTop: number) => void, selected: boolean, id: string }) {
    const { popNotify } = useNotify();
    const setRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            handleRename(id, renameInputRef.current?.value);
        }
    };

    return (
        <div ref={setRef} className={` cursor-pointer rounded-md ${selected ? "bg-blue-50" : "bg-blue-100"} hover:bg-blue-50 relative h-10 text-base flex items-center gap-2 my-[2px] justify-between`}>
            {!rename ?
                <Link onClick={() => popNotify('Switch word set')} href={`/set/${id}`} className='h-full p-2 overflow-x-hidden w-full'>{title}</Link> :
                <input ref={renameInputRef} className=' border-purple-300 outline-none border-b-2 my-1 p-2 bg-transparent' onKeyDown={handleKeyDown} defaultValue={title} type="text" autoFocus />
            }
            {rename ?
                <IcRoundDoneOutline onClick={() => handleRename(id, renameInputRef.current?.value)} className=' shadow-sm mr-2 text-lg bg-blue-100 rounded-lg cursor-pointer' />
                :
                <button className='option-button h-8 hover:bg-blue-150 rounded-md mr-[1px]' onClick={() => onShowOption(id, setRef.current?.offsetTop ?? 0)}>
                    <AkarIconsMoreVerticalFill className='option-button w-5 mr-0 flex-shrink-0' />
                </button>
            }
        </div>
    );
}

function SetGroup({ tagName = "", sets, deleteSet, renameSet, scrollBarY }: { scrollBarY: number, renameSet: (id: string, name: string) => void, deleteSet: (id: string) => void, tagName: string, sets: Aset[] }) {
    const { popNotify } = useNotify();
    const [showSets, setShowSets] = useState<boolean>(false);
    const [optionState, setOptionState] = useState<{ id: string, y: number }>({ id: "", y: -99999 });
    const [renameId, setRenameId] = useState<string>("");

    const params = useParams();
    const currentSetId = params.setId as string | undefined;

    const handleRenameSubmit = (id: string, name?: string) => {
        if (!name) {
            return
        }
        setRenameId("");
        renameSet(id, name);
    };

    const handleOptionAction = (id: string, type: "D" | "R"): void => {
        if (type === "D") {
            createConfirmDialog(
                `Delete "${sets.find(e => e.id === id)?.title}" ? \nThis operation is irreversible.`,
                () => deleteSet(id),
                () => popNotify("Delete operation canceled."),
                "Delete",
                "Cancel"
            );
        } else {
            popNotify(`Rename`);
            setRenameId(id);
        }
    };

    const handleShowOption = (id: string, y: number): void => {
        setOptionState({ id, y });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.option-button, .option-button2')) {
                return;
            }
            setOptionState({ id: "", y: -99999 });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={` cursor-pointer w-full bg-blue-100 p-2 my-1 rounded-md ${!showSets ? " h-10 overflow-hidden" : ""}`}>
            <div onClick={() => setShowSets(!showSets)} className=' flex justify-between'>
                <h1>{tagName}</h1>
                <span className=' w-6' >{showSets ? "▼" : "►"}</span>
            </div>
            {showSets && <hr className=' my-1 text-white' />}
            {showSets && (
                <div>
                    {sets.map((set) =>
                        <SetItem
                            handleRename={handleRenameSubmit}
                            onShowOption={handleShowOption}
                            id={set.id}
                            key={set.id}
                            title={set.title}
                            selected={currentSetId === set.id}
                            rename={renameId === set.id}
                        />
                    )}
                </div>
            )}
            <PopupMenu callback={handleOptionAction} id={optionState.id} isShow={optionState.y !== -99999} y={optionState.y - scrollBarY} />
        </div>
    );
}


export default function Sidebar() {
    const { allSet, setAllSet, allSetMap } = useStateContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [scrollBarY, setScrollBarY] = useState<number>(0);

    const { popNotify } = useNotify();
    const router = useRouter();
    const params = useParams();
    const currentSetId = params.setId as string | undefined;

    const scrollBarRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentSetId || allSet.length === 0) {
            return;
        }
        const setLocation = allSet.findIndex((e) => e.id === currentSetId);
        if (setLocation > 0) {
            const currentActiveSet = allSet[setLocation];
            const otherSets = allSet.filter((e) => e.id !== currentSetId);
            setAllSet([currentActiveSet, ...otherSets]);
        }
    }, [currentSetId, allSet, setAllSet]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddSet = () => {
        const newId = getRandId();
        localStorage.setItem(`set-${newId}`, JSON.stringify([{ id: getRandId(), chinese: "", english: "" }]));
        setAllSet((prev) => [{ id: newId, title: "New Set", tags: [] }, ...prev]);
        setIsSidebarOpen(false);
        popNotify("New set created!");
        setTimeout(() => {
            router.push(`/set/${newId}/settings`);
        }, 300);
    };

    const handleDeleteSet = (id: string) => {
        localStorage.removeItem(`set-${id}`);
        popNotify(`"${allSet.find(e => e.id === id)?.title}" deleted`);
        setAllSet((prev) => prev.filter((set) => set.id !== id));
    };

    const handleRenameSet = (id: string, name: string) => {
        setAllSet((prev) => prev.map((set) => (set.id === id) ? { ...set, title: name } : set));
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollBarY(scrollBarRef.current?.scrollTop || 0);
    };

    return (
        <div ref={sidebarRef} className='sidebar h-full flex z-50 overflow-hidden'>
            <div className={`bg-blue-50 ${isSidebarOpen ?  " w-[18rem] sm:w-[22rem] lg:w-[24rem] px-2 p-1" : "min-w-0 w-0 px-0"} fixed xs:static h-full flex flex-col rounded-md transition-all duration-300 ease-in-out shadow-xl`}>
                <div className=' h-8 flex mt-1 items-center justify-between'>
                    <SolarSiderbarBold className=' cursor-pointer text-3xl' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <MaterialAddToPhotos className=' cursor-pointer text-3xl mr-1' onClick={handleAddSet} />
                </div>

                <hr className=' my-1'></hr>

                <div ref={scrollBarRef} onScroll={handleScroll} className={` ${isSidebarOpen ? "overflow-y-auto" : "overflow-y-hidden"} flex-auto`}>
                    {Object.keys(allSetMap).length > 0 &&
                        Object.keys(allSetMap).map((tag) => {
                            const setsInGroup = allSet.filter(e => allSetMap[tag].includes(e.id));
                            if (setsInGroup.length === 0) return null;
                            return <SetGroup scrollBarY={scrollBarY} key={tag} renameSet={handleRenameSet} deleteSet={handleDeleteSet} tagName={tag} sets={setsInGroup} />;
                        })
                    }
                    {<SetGroup scrollBarY={scrollBarY} key={"All"} renameSet={handleRenameSet} deleteSet={handleDeleteSet} tagName={"All"} sets={allSet} />}
                </div>

                {isSidebarOpen && (
                    <div className=' z-30 mt-1 h-10 p-1 flex items-center'>
                        <a href='https://github.com/jx06T/ectts_2.0' target='_blank' rel="noopener noreferrer">
                            <MdiGithub className=' text-3xl' />
                        </a>
                        <span className='ml-2 text-xs text-slate-300'>2.2.5 - jx06T</span>
                    </div>
                )}
            </div>

            <div className={` ${isSidebarOpen ? " opacity-0 pointer-events-none" : " opacity-100 w-11 pl-2 p-1 "} bg-transparent absolute flex flex-col justify-between transition-opacity`}>
                <div className=' h-8 flex mt-1 items-center'>
                    <SolarSiderbarBold className=' text-3xl cursor-pointer' onClick={() => setIsSidebarOpen(true)} />
                </div>
            </div>
        </div>
    );
}