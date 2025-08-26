'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    LineMdMenuToCloseAltTransition, LineMdCloseToMenuAltTransition, MaterialSymbolsQuizRounded,
    AntDesignSettingFilled, IcRoundAccountCircle, MdiCardsOutline
} from '@/components/ui/Icons';
import { useNotify } from '@/context/NotifyContext';

// FunctionMenu 現在只接收必要的路由參數
function FunctionMenu() {
    const { popNotify } = useNotify();
    const params = useParams();
    const setId = params.setId as string;
    const mode = params.mode?.[0] as string | undefined;
    const isCardsMode = mode === "cards";
    console.log(mode)

    return (
        <div className='flex flex-col w-full space-y-4 p-3'>
            <Link href="/profile" className='cursor-pointer flex items-center'>
                <IcRoundAccountCircle className="text-2xl" />
                <span className='whitespace-nowrap ml-2'>Profile</span>
            </Link>
            <Link href={`/set/${setId}/settings`} className='cursor-pointer flex items-center'>
                <AntDesignSettingFilled className="text-2xl" />
                <span className='whitespace-nowrap ml-2'>Settings</span>
            </Link>
            <Link href={`/set/${setId}${isCardsMode ? '' : '/cards'}`} className='cursor-pointer flex items-center' onClick={() => popNotify(isCardsMode ? "Normal mode" : "Cards mode")}>
                <MdiCardsOutline className={`text-2xl ${isCardsMode ? "text-green-700" : ""}`} />
                <span className='whitespace-nowrap ml-2'>Card Mode</span>
            </Link>
            <div className='cursor-pointer flex items-center' onClick={() => popNotify("Coming soon")}>
                <MaterialSymbolsQuizRounded className="text-xl" style={{ fontSize: "22px" }} />
                <span className='whitespace-nowrap ml-2'>Start quiz</span>
            </div>
        </div>
    );
}

// MainHeader 只負責 UI 顯示
export default function MainHeader() {
    const [showFunctionMenu, setShowFunctionMenu] = useState(false);
    const { notify } = useNotify();

    return (
        <div className='ml-11 mt-[0.25rem] mr-1 flex justify-between relative'>
            <div className='min-w-[70px] flex items-center '>
                <div className='w-7 h-7 mr-1 bg-center bg-contain' style={{ backgroundImage: "url(/icon.png)" }}></div>
                <Link href="/" className='cursor-pointer'>
                    <span>ECTTS 2.0</span>
                </Link>
            </div>
            <div className=' absolute left-10 right-10 flex flex-col items-center '>
                <div className={`
                      transition-all duration-300 cubic-bezier(0.68, -0.55, 0.27, 1.55) 
                      bg-stone-700 rounded-full px-4 text-center max-w-xl w-fit
                      ${notify === "" ? "-translate-y-9" : "translate-y-0"}
                      `}>
                    <h2 className=" text-white min-w-36 min-h-6">{notify}</h2>
                </div>
            </div>
            <div
                style={{ width: showFunctionMenu ? "140px" : "32px" }}
                className=" absolute right-0 top-0 z-50 flex items-end flex-col rounded-xl px-0.5 py-0.5 bg-blue-100 transition-all duration-300 ease-in-out overflow-hidden"
            >
                <div onClick={() => setShowFunctionMenu(!showFunctionMenu)} className='absolute right-1 top-1 w-[1.5rem] h-[1.5rem] rounded-full cursor-pointer inline-block'>
                    {showFunctionMenu ?
                        <LineMdMenuToCloseAltTransition className='w-full h-full text-center  hover:scale-105 ' /> :
                        <LineMdCloseToMenuAltTransition className='w-full h-full text-center  hover:scale-105 ' />
                    }
                </div>
                <div className=' h-7'></div>
                {showFunctionMenu && <FunctionMenu />}
            </div>
        </div>
    );
}