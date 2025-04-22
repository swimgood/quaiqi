// rpcUtils.js
import { ethers } from "ethers"

export async function getSlippage(rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  const oneQI = ethers.parseUnits("1", 18)

  const quaiFromQi = await provider.send("quai_qiToQuai", [oneQI.toString()])
  const qiFromQuai = await provider.send("quai_quaiToQi", [oneQI.toString()])

  const quaiFromQiFloat = parseFloat(ethers.formatUnits(quaiFromQi, 18))
  const qiFromQuaiFloat = parseFloat(ethers.formatUnits(qiFromQuai, 18))

  const expected = 1 / qiFromQuaiFloat
  const actual = quaiFromQiFloat

  const slippage = ((expected - actual) / expected) * 100

  return {
    buyRate: qiFromQuaiFloat,
    sellRate: quaiFromQiFloat,
    slippagePercent: slippage.toFixed(4)
  }
}
