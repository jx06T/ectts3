'use client'; 
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';


interface GroupsIndexMap {
    [key: string]: string[];
}


interface StateContextType {
    state: StateFormat;
    setState: React.Dispatch<React.SetStateAction<StateFormat>>;
    allSet: Aset[];
    setAllSet: React.Dispatch<React.SetStateAction<Aset[]>>;
    allSetMap: GroupsIndexMap;
    setAllSetMap: React.Dispatch<React.SetStateAction<GroupsIndexMap>>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<StateFormat>({
        showE: true,
        showC: true,
        onlyPlayUnDone: false,
        selection: 0,
        lock: false,
        rand: false,
        init: true 
    });
    const [allSet, setAllSet] = useState<Aset[]>([]);
    const [allSetMap, setAllSetMap] = useState<GroupsIndexMap>({});

    useEffect(() => {
        
        const initialAllSet = localStorage.getItem('all-set');
        if (initialAllSet) {
            setAllSet(JSON.parse(initialAllSet));
        } else {
            const defaultSets = [{
                "id": "test-samples",
                "title": "測試單字集",
                "tags": ["測試"]
            }];
            setAllSet(defaultSets);
            localStorage.setItem('all-set', JSON.stringify(defaultSets));
            localStorage.setItem('set-test-samples', JSON.stringify([
                { "id": "dptba3zf7ukiwshp", "english": "quest", "chinese": "追求", "selected": true, "done": true },
                { "id": "jal32uktdo9mhk1s", "english": "carbon", "chinese": "碳", "selected": true, "done": true },
                { "id": "3x59v0u7xlwjami1", "english": "corporation", "chinese": "公司", "selected": true, "done": true },
                { "id": "guzo7ft8n8bjmx4s", "english": "contribute", "chinese": "做出貢獻，促成", "selected": true },
                { "id": "myfsefsfseh84shpf", "english": "fundamentally", "chinese": "基本上的", "selected": true, "done": true },
                { "id": "myyu6pg5d6648hpf", "english": "fundamentally", "chinese": "基本上的", "selected": true, "done": true },
                { "id": "myyu6pcpfbw2222fpf", "english": "fundamentally", "chinese": "基本上的", "selected": true, "done": true },
                { "id": "myyu6pcp7fwawhpf", "english": "fundamentally", "chinese": "基本上的", "selected": true, "done": true },
            ]));
        }

        const storedState = localStorage.getItem("ectts-state");
        if (storedState) {
            setState({ ...JSON.parse(storedState), init: false });
        } else {
            setState(prevState => ({ ...prevState, init: false }));
        }

    }, []);

    const generateAllSetMap = (sets: Aset[]): GroupsIndexMap => {
        const newAllSetMap: GroupsIndexMap = {};
        if (!sets) return {};
        sets.forEach((aSet) => {
            if (!aSet.tags) return;
            aSet.tags.forEach(tag => {
                if (!newAllSetMap[tag]) {
                    newAllSetMap[tag] = [];
                }
                newAllSetMap[tag].push(aSet.id);
            });
        });
        return newAllSetMap;
    };

    useEffect(() => {
        if (allSet.length > 0) {
            localStorage.setItem('all-set', JSON.stringify(allSet));
            const newMap = generateAllSetMap(allSet);
            setAllSetMap(newMap);
        }
    }, [allSet]);

    useEffect(() => {
        if (Object.keys(allSetMap).length > 0) {
            localStorage.setItem('all-set-map', JSON.stringify(allSetMap));
        }
    }, [allSetMap]);

    useEffect(() => {
        if (!state.init) { // 避免在初始載入時就寫入
            localStorage.setItem("ectts-state", JSON.stringify(state));
        }
    }, [state]);


    return (
        <StateContext.Provider value={{ state, setState, allSet, setAllSet, allSetMap, setAllSetMap }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = (): StateContextType => {
    const context = useContext(StateContext);
    if (context === undefined) {
        throw new Error('useStateContext must be used within a StateProvider');
    }
    return context;
};