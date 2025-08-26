import React from 'react';
import ReactMarkdown from 'react-markdown'
import breaks from 'remark-breaks'


export default function SetsManagement() {
  return (
    <div className='home px-4 sm:px-16 space-y-3 w-full overflow-y-auto h-full'>
      <h1 className=' w-full text-center text-2xl mt-3'>Sets Management</h1>
      <hr className=' black w-full' />

      <div className=' md'>

        <ReactMarkdown remarkPlugins={[breaks]}>
          {`
## 3.0 版預計功能
- 單字集合併
- 單字集分割
- 單字集批量匯出

                    `}
        </ReactMarkdown>
      </div>
    </div>
  )
}