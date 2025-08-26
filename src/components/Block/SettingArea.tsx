
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useNotify } from '@/context/NotifyContext';
import { useStateContext } from '@/context/StateContext';
import Tag from '../ui/Tag';
import CustomSelect from '../ui/Select';
import { getRandId } from '@/utils/tool';

function SettingArea() {
    const { setId } = useParams();
    const { popNotify } = useNotify();
    const [setData, setSetData] = useState<{ tags?: string[], title?: string, id?: string }>({})
    const { allSet, setAllSet, allSetMap, setAllSetMap } = useStateContext()

    useEffect(() => {
        const thisSet = allSet.find(e => e.id === setId)
        if (!thisSet && allSet.length > 0) {
            popNotify("Set not found")
        }
        setSetData(thisSet!)
    }, [allSet])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            setAllSet(allSet.map((e: Aset) => e.id !== setId ? e : { ...e, ...setData }))
        }
        popNotify("Update successful")
    };

    const handleAddTag = (tag: string) => {
        if ((setData.tags || []).includes(tag)) {
            return
        }
        setSetData((prev: any) => {
            const newData = { ...prev, tags: [...(prev.tags || []), tag] }
            setAllSet(allSet.map((e: Aset) => e.id !== setId ? e : { ...e, ...newData }))
            return newData
        })
        popNotify("Update successful")
    };

    const handleDelete = (tag: string) => {
        setSetData((prev: any) => {
            const newData = {
                ...prev, tags: (prev.tags || []).filter((e: String) => e !== tag)
            }
            setAllSet(allSet.map((e: Aset) => e.id !== setId ? e : { ...e, ...newData }))
            return newData
        })
        popNotify("Update successful")
    }

    if (!setData) {
        return null
    }

    return (
        <div className='flex flex-col items-center mt-1 space-y-4 overflow-y-auto h-full'>
            <h1 className=' text-xl mb-1'>settings</h1>
            <hr className='black w-[80%]' />
            <div className=' flex space-x-2'>
                <p>title：</p>
                <input onBlur={() => setAllSet(allSet.map((e: Aset) => e.id !== setId ? e : { ...e, ...setData }))} onKeyDown={handleKeyDown} onChange={(e) => setSetData({ ...setData, title: e.target.value })} defaultValue={setData.title} type="text" className=' rounded-none bg-transparent border-b-[2px] outline-none border-blue-700' />
            </div>
            <div className=' flex space-x-2 max-w-[80%] !-mb-4'>
                <p className=' pt-3'>tags：</p>
                <div className=' w-full overflow-x-auto flex h-13 py-3 space-x-2'>
                    {setData.tags && setData.tags.length > 0 &&
                        setData.tags.map((e: string) => (
                            <Tag handleDelete={handleDelete} key={e + getRandId(2)}>{e}</Tag>
                        ))
                    }
                </div>
            </div>
            <CustomSelect
                options={Object.keys(allSetMap).map(e => ({ value: e, label: e }))}
                placeholder="Select a tag or type your own..."
                onChange={handleAddTag}
                initialValue=""
                className=' max-w-sm mt-2'
            />
            <Link className=' border-2 border-blue-700 rounded-full px-4 text-lg ' href={`/set/${setId}`}>Go back to words list</Link>
        </div>
    )
}

export default SettingArea;