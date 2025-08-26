import React from "react";
import { useStateContext } from '@/context/StateContext';
import Link from 'next/link';
import { getRandId } from '@/utils/tool';
import SetCard from "@/components/card/SetCard"

function SetBlock() {
    const { allSet } = useStateContext()


    const getSetWords = (setId: string): Word[] => {
        const Words0 = localStorage.getItem(`set-${setId}`);
        if (Words0) {
            return JSON.parse(Words0 as string);
        } else {
            return [{ chinese: "Null", english: "Null", id: getRandId() }]
        };

    }
    return (<div className="ml-12 w-full">

        <div className=" flex mt-3  min-w-[70px]">
            <div className=' w-7 h-7 mr-1' style={{
                backgroundImage: "url(../../icon.png)",
                backgroundPosition: "center",
                backgroundSize: "contain"
            }}></div>
            < Link href="/" className='cursor-pointer' >
                <span className=" h-8">ECTTS 2.0</span>
            </Link>
        </div>


        <div className=" w-full-jx">
            <div className=" -ml-12">
                <h2 className=" text-2xl mb-1 mt-3 text-center -ml-6">Commonly used word set</h2>
                <hr className=' black w-full' />
                {allSet.length == 0 ? <div className=" ml-1 mt-2  mr-10">
                    展開側邊欄並點擊加號圖標新增單字集！
                </div> : <div className=" ml-1 mt-2 mr-10">
                    點擊單字集標題進入單字集！展開側邊欄查看更多單字集！
                </div>}
            </div>
        </div>
        <div className=" cardsL w-full h-full mt-6 -ml-6 overflow-y-auto no-y-scrollbar pb-36">
            {allSet.slice(0, Math.min(6, allSet.length)).map(aSet =>
                <SetCard set={aSet} key={aSet.id}></SetCard>
            )}
        </div>

    </div>)
}

export default SetBlock