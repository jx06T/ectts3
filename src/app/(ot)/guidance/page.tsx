import React from 'react';
import ReactMarkdown from 'react-markdown'
import breaks from 'remark-breaks'


export default function Guidance() {
  return (
    <div className='home px-4 sm:px-16 space-y-3 w-full overflow-y-auto h-full'>
      <h1 className=' w-full text-center text-2xl mt-3'>Guidance</h1>
      <hr className=' black w-full' />

      <div className=' md'>

        <ReactMarkdown remarkPlugins={[breaks]}>
          {`
## 蝦
                    `}
        </ReactMarkdown>
      </div>
    </div>
  )
}