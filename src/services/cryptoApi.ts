import { toast } from "sonner";

interface QuaiResponse {
  jsonrpc: string;
  id: number;
  result: string;
}

interface CoinGeckoResponse {
  'quai-network': {
    usd: number;
  };
}

interface ConversionResult {
  amountOut: string;
  effectiveRate: string;
  slippage: string;
}

interface ConversionOptions {
  direction: 'quaiToQi' | 'qiToQuai';
  slippage?: number;
}

interface FlowData {
  quaiToQiVolume: number;
  qiToQuaiVolume: number;
  timestamp: number;
}

// Last known values to use as fallbacks
let lastQiToQuaiRate: string | null = null;
let lastQuaiToQiRate: string | null = null;
let lastQuaiUsdPrice: number | null = null;
let lastQiUsdPrice: number | null = null;
let lastUpdatedTimestamp: number = Date.now();

// Separate price history for QI and QUAI
let qiPriceHistory: Array<{ timestamp: number; price: number }> = [];
let quaiPriceHistory: Array<{ timestamp: number; price: number }> = [];

// Conversion flow tracking
let flowHistory: FlowData[] = [];

// Record conversion flows for slippage calculation
export function recordConversionFlow(direction: 'quaiToQi' | 'qiToQuai', amount: number) {
  const now = Date.now();
  
  flowHistory.push({
    quaiToQiVolume: direction === 'quaiToQi' ? amount : 0,
    qiToQuaiVolume: direction === 'qiToQuai' ? amount : 0,
    timestamp: now
  });
  
  // Keep only last 24 hours of data
  flowHistory = flowHistory.filter(f => now - f.timestamp < 86400000);
}

// Calculate dynamic slippage based on actual flow
const calculateDynamicSlippage = (
  amount: number,
  direction: 'quaiToQi' | 'qiToQuai'
) => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  // Get recent flows
  const recentFlows = flowHistory.filter(f => f.timestamp > oneHourAgo);
  
  // Calculate flow ratios
  const totalQuaiToQi = recentFlows.reduce((sum, f) => sum + f.quaiToQiVolume, 0);
  const totalQiToQuai = recentFlows.reduce((sum, f) => sum + f.qiToQuaiVolume, 0);
  const totalFlow = totalQuaiToQi + totalQiToQuai;
  
  // Base slippage (minimum)
  let baseSlippage = direction === 'quaiToQi' ? 0.1 : 0.3;
  
  // Flow-based adjustment (more flow = less slippage)
  const flowRatio = direction === 'quaiToQi' 
    ? totalQuaiToQi / (totalFlow || 1)
    : totalQiToQuai / (totalFlow || 1);
  
  const flowAdjustment = (1 - flowRatio) * 5; // Up to 5% adjustment
  
  // Size impact (larger trades = more slippage)
  const sizeImpact = Math.min(amount / 10000, 5);
  
  // Total slippage
  return Math.min(baseSlippage + flowAdjustment + sizeImpact, direction === 'quaiToQi' ? 3 : 10);
};

// Get flow data for graphs
export function getFlowHistory() {
  return flowHistory;
}

export async function fetchQiToQuai(amount = "0x3e8"): Promise<string> {
  try {
    const response = await fetch("https://rpc.quai.network/cyprus1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "quai_qiToQuai",
        params: [amount, "latest"],
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: QuaiResponse = await response.json();
    lastQiToQuaiRate = data.result;
    lastUpdatedTimestamp = Date.now();
    return data.result;
  } catch (error) {
    console.error("Error fetching QI to QUAI rate:", error);
    return lastQiToQuaiRate || "0";
  }
}

export async function fetchQuaiToQi(amount = "0x3e8"): Promise<string> {
  try {
    const response = await fetch("https://rpc.quai.network/cyprus1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        method: "quai_quaiToQi",
        params: [amount, "latest"],
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: QuaiResponse = await response.json();
    lastQuaiToQiRate = data.result;
    lastUpdatedTimestamp = Date.now();
    return data.result;
  } catch (error) {
    console.error("Error fetching QUAI to QI rate:", error);
    return lastQuaiToQiRate || "0";
  }
}

export async function fetchQuaiUsdPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=quai-network&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: CoinGeckoResponse = await response.json();
    lastQuaiUsdPrice = data["quai-network"].usd;
    lastUpdatedTimestamp = Date.now();
    
    quaiPriceHistory.push({ 
      timestamp: Date.now(), 
      price: lastQuaiUsdPrice 
    });
    
    if (quaiPriceHistory.length > 100) {
      quaiPriceHistory = quaiPriceHistory.slice(-100);
    }
    
    return lastQuaiUsdPrice;
  } catch (error) {
    console.error("Error fetching QUAI USD price:", error);
    return lastQuaiUsdPrice || 0.068177;
  }
}

export async function calculateQiUsdPrice(
  qiToQuaiRate: string,
  quaiUsdPrice: number
): Promise<number> {
  try {
    const qiToQuaiDecimal = parseInt(qiToQuaiRate, 16) / 10 ** 18;
    
    if (qiToQuaiDecimal && qiToQuaiDecimal > 0) {
      const qiUsdPrice = quaiUsdPrice * qiToQuaiDecimal;
      lastQiUsdPrice = qiUsdPrice;
      
      qiPriceHistory.push({ 
        timestamp: Date.now(), 
        price: qiUsdPrice 
      });
      
      if (qiPriceHistory.length > 100) {
        qiPriceHistory = qiPriceHistory.slice(-100);
      }
      
      return qiUsdPrice;
    }
    
    return lastQiUsdPrice || (quaiUsdPrice * 16);
  } catch (error) {
    console.error("Error calculating QI USD price:", error);
    return lastQiUsdPrice || (quaiUsdPrice * 16);
  }
}

export async function calculateConversionAmount(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  options?: ConversionOptions
): Promise<ConversionResult> {
  try {
    const amountInDecimal = parseFloat(amountIn);
    const direction = tokenIn.toUpperCase() === "QUAI" ? 'quaiToQi' : 'qiToQuai';
    
    // Calculate dynamic slippage
    const slippagePercent = calculateDynamicSlippage(amountInDecimal, direction);
    
    if (tokenIn.toUpperCase() === "QI" && tokenOut.toUpperCase() === "QUAI") {
      const qiToQuaiRate = parseInt(lastQiToQuaiRate || "0", 16) / 10 ** 18;
      
      // First calculate raw conversion without slippage
      const rawAmountOut = amountInDecimal * qiToQuaiRate;
      
      // Then apply slippage by reducing output amount
      const amountOut = rawAmountOut * (1 - slippagePercent / 100);
      
      return {
        amountOut: amountOut.toFixed(6),
        effectiveRate: (amountOut / amountInDecimal).toFixed(6),
        slippage: `${slippagePercent.toFixed(2)}%`
      };
    } 
    else if (tokenIn.toUpperCase() === "QUAI" && tokenOut.toUpperCase() === "QI") {
      const qiToQuaiRate = parseInt(lastQiToQuaiRate || "0", 16) / 10 ** 18;
      if (qiToQuaiRate === 0) return { amountOut: "0", effectiveRate: "0", slippage: "0%" };
      
      const quaiToQiRate = 1 / qiToQuaiRate;
      
      // First calculate raw conversion without slippage
      const rawAmountOut = amountInDecimal * quaiToQiRate;
      
      // Then apply slippage by reducing output amount
      const amountOut = rawAmountOut * (1 - slippagePercent / 100);
      
      return {
        amountOut: amountOut.toFixed(6),
        effectiveRate: (amountOut / amountInDecimal).toFixed(6),
        slippage: `${slippagePercent.toFixed(2)}%`
      };
    }
    
    throw new Error("Invalid token pair");
  } catch (error) {
    console.error("Error calculating conversion amount:", error);
    toast.error("Failed to calculate conversion. Please try again.");
    return {
      amountOut: "0",
      effectiveRate: "0",
      slippage: "0%"
    };
  }
}

export function getPriceHistory() {
  if (qiPriceHistory.length === 0 && lastQiUsdPrice) {
    const now = Date.now();
    qiPriceHistory.push({
      timestamp: now - 3600000,
      price: lastQiUsdPrice
    });
    qiPriceHistory.push({
      timestamp: now,
      price: lastQiUsdPrice
    });
  }
  return qiPriceHistory;
}

export function getQuaiPriceHistory() {
  return quaiPriceHistory;
}

export function getLastUpdatedTime(): number {
  return lastUpdatedTimestamp;
}
