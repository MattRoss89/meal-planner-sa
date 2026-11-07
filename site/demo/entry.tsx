import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SwapDemo from './SwapDemo'

// Mounts the swap demo into #swap-demo with a Replay button. Replay remounts
// the scene at its story boundary (the kit has no imperative replay).
function Host() {
  const [run, setRun] = useState(0)
  return (
    <>
      <SwapDemo key={run} />
      <button type="button" className="swap-replay u" onClick={() => setRun((n) => n + 1)}>Replay</button>
    </>
  )
}

const el = document.getElementById('swap-demo')
if (el) createRoot(el).render(<StrictMode><Host /></StrictMode>)
