// SlippageDisplay.tsx
import { useEffect, useState } from "react"
import { getSlippage } from "@/lib/quai" // adjust path to match your file structure

export default function SlippageDisplay() {
  const [slippage, setSlippage] = useState<null | {
    buyRate: number
    sellRate: number
    slippagePercent: string
  }>(null)

  useEffect(() => {
    const fetchData = async () => {
      const data = await getSlippage("https://your-quai-rpc-url") // replace with actual URL
      setSlippage(data)
    }
    fetchData()
  }, [])

  if (!slippage) return <p className="text-gray-400">Loading slippage data...</p>

  return (
    <div className="p-4 bg-neutral-900 text-white rounded-2xl shadow-xl space-y-2 max-w-md">
      <p>🔄 Buy QI (QUAI → QI): <strong>{slippage.buyRate}</strong></p>
      <p>🔁 Sell QI (QI → QUAI): <strong>{slippage.sellRate}</strong></p>
      <p>📉 Estimated Slippage: <strong>{slippage.slippagePercent}%</strong></p>
    </div>
  )
}
