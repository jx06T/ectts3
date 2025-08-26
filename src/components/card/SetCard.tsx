import React from "react";
import Link from 'next/link';
import { getRandId } from '@/utils/tool';
import Tag from '@/components/ui/Tag';
import { JamChevronCircleRight } from "@/components/ui/Icons";


function SetBlock({ set }: { set: Aset }) {
    const getSetWords = (setId: string): Word[] => {
        const Words0 = localStorage.getItem(`set-${setId}`);
        if (Words0) {
            return JSON.parse(Words0 as string);
        } else {
            return [{ chinese: "Null", english: "Null", id: getRandId() }]
        };

    }
    const words = getSetWords(set.id);
    return (
        <div key={set.id} className=" w-72 h-60 bg-blue-50 rounded-xl border-0 border-blue-100 hover:bg-blue-100">
            <Link href={"/set/" + set.id} >
                <h1 className=" w-full text-center text-2xl pt-3 whitespace-nowrap overflow-x-hidden pl-3 truncate">{set.title}   <JamChevronCircleRight className=" inline-block -mt-[0.3rem]" /></h1>
            </Link>
            <div className=" mx-auto mt-1 mb-1 w-[90%] rounded-lg h-0.5 bg-purple-200"></div>
            <div className=" no-y-scrollbar h-32 mb-2 overflow-y-auto ml-4">{
                words.map((aWord: Word) => {
                    return <div key={aWord.id}>{aWord.english === '' && aWord.chinese === '' ? "Null" : (aWord.english + '／' + aWord.chinese)}</div>
                }
                )
            }

            </div>
            <div className=" flex ml-3">
                <div className=" w-24 text-left pt-[14px]">✓ {words.filter(word => word.done).length}/{words.length}</div>
                <div className=' w-full overflow-x-auto flex h-13 py-3 space-x-2'>
                    {(set.tags && set.tags.length > 0) &&
                        set.tags.map((e: string) => (
                            <Tag key={e + getRandId(2)}>{e}</Tag>
                        ))
                    }
                </div>
            </div>
        </div>)
}

export default SetBlock