import React from 'react';
import ReactMarkdown from 'react-markdown'
import breaks from 'remark-breaks'


export default function Contact() {
  return (
    <div className='home px-4 sm:px-16 space-y-3 w-full overflow-y-auto h-full'>
      <h1 className=' w-full text-center text-2xl mt-3'>Contact Us</h1>
      <hr className=' black w-full' />

      <div className=' md'>
        <ReactMarkdown remarkPlugins={[breaks]}>
          {`
## Contact Us
- Instagram：[jx06_t](https://www.instagram.com/jx06_t)
- GitHub：[jx06T](https://github.com/jx06T)
`}
        </ReactMarkdown>
      </div>
    </div>
  )
}