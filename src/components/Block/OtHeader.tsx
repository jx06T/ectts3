'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    LineMdMenuToCloseAltTransition, LineMdCloseToMenuAltTransition, MaterialSymbolsQuizRounded,
    AntDesignSettingFilled, IcRoundAccountCircle, MdiCardsOutline
} from '@/components/ui/Icons';
import { useNotify } from '@/context/NotifyContext';


// MainHeader 只負責 UI 顯示
export default function OtHeader() {
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
        </div>
    );
}