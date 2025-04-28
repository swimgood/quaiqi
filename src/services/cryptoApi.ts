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

// Last known values to use as fallbacks
let lastQiToQuaiRate: string | null = null;
let lastQuaiToQiRate: string | null = null;
let lastQuaiUsdPrice: number | null = null;
let lastQiUsdPrice: number | null = null;
let lastUpdatedTimestamp: number = Date.now();

// Separate price history for QI and QUAI
let qiPriceHistory: Array<{ timestamp: number; price: number }> = [];
let quaiPriceHistory: Array<{ timestamp: number; price: number }> = [];

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
    
    // Add to QUAI price history
    const now = Date.now();
    quaiPriceHistory.push({ 
      timestamp: now, 
      price: lastQuaiUsdPrice 
    });
    
    // Keep only the last 100 price points
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
    // Convert hex string to decimal
    const qiToQuaiDecimal = parseInt(qiToQuaiRate, 16) / 10 ** 18;
    
    if (qiToQuaiDecimal && qiToQuaiDecimal > 0) {
      // The correct way: QI price = QUAI price * QUAI per QI
      // Since qiToQuaiRate gives us how much QUAI you get for 1 QI
      const qiUsdPrice = quaiUsdPrice * qiToQuaiDecimal;
      lastQiUsdPrice = qiUsdPrice;
      
      // Update QI price history (separate from QUAI)
      const now = Date.now();
      qiPriceHistory.push({ 
        timestamp: now, 
        price: qiUsdPrice 
      });
      
      // Keep only the last 100 price points
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
  amountIn: string
): Promise<ConversionResult> {
  try {
    // This is a simplified mock implementation
    // In a real implementation, this would call the actual API
    
    // Convert the input amount to a decimal
    const amountInDecimal = parseFloat(amountIn);
    
    // Use the latest rates to calculate the output amount
    let amountOut: number;
    let effectiveRate: number;
    
    if (tokenIn.toUpperCase() === "QI" && tokenOut.toUpperCase() === "QUAI") {
      const qiToQuaiRate = parseInt(lastQiToQuaiRate || "0", 16) / 10 ** 18;
      // Apply a mock slippage of 1-3% based on amount
      const slippagePercent = Math.min(1 + amountInDecimal / 10000, 3);
      effectiveRate = qiToQuaiRate * (1 - slippagePercent / 100);
      amountOut = amountInDecimal * effectiveRate;
      
      return {
        amountOut: amountOut.toFixed(6),
        effectiveRate: effectiveRate.toFixed(6),
        slippage: `${slippagePercent.toFixed(2)}%`
      };
    } else if (tokenIn.toUpperCase() === "QUAI" && tokenOut.toUpperCase() === "QI") {
      // For QUAI to QI, we invert the rate
      const qiToQuaiRate = parseInt(lastQiToQuaiRate || "0", 16) / 10 ** 18;
      if (qiToQuaiRate === 0) return { amountOut: "0", effectiveRate: "0", slippage: "0%" };
      
      const quaiToQiRate = 1 / qiToQuaiRate;
      // Apply a mock slippage of 1-3% based on amount
      const slippagePercent = Math.min(1 + amountInDecimal / 1000, 3);
      effectiveRate = quaiToQiRate * (1 - slippagePercent / 100);
      amountOut = amountInDecimal * effectiveRate;
      
      return {
        amountOut: amountOut.toFixed(6),
        effectiveRate: effectiveRate.toFixed(6),
        slippage: `${slippagePercent.toFixed(2)}%`
      };
    } else {
      throw new Error("Invalid token pair");
    }
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
  // Always return QI price history instead of potentially mixing data
  if (qiPriceHistory.length === 0 && lastQiUsdPrice) {
    const now = Date.now();
    qiPriceHistory.push({
      timestamp: now - 3600000, // 1 hour ago
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
