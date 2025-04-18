
import axios from 'axios';

// Convert hex string to decimal number
const hexToDecimal = (hex: string): number => {
  return parseInt(hex, 16);
};

// Format number to specified decimal places
export const formatNumber = (num: number, decimals: number = 6): string => {
  return num.toFixed(decimals);
};

// Fetch QUAI to QI conversion rate
export const fetchQuaiToQiRate = async (): Promise<number | null> => {
  try {
    // Convert 1 QUAI to QI (1 QUAI = 10^18 base units)
    const response = await axios.post('https://rpc.quai.network/cyprus1', {
      id: 1,
      jsonrpc: '2.0',
      method: 'quai_qiToQuai',
      params: ['0x3e8', 'latest'] // 0x3e8 is 1000 in hex
    });
    
    if (response.data && response.data.result) {
      // Convert the hex result to decimal
      const baseUnitsPerQi = hexToDecimal(response.data.result);
      
      // Calculate the conversion rate (1000 QI base units to QUAI)
      // Since the API returns the result for 1000 base units, we need to adjust
      const quaiPerQi = baseUnitsPerQi / 1e18; // Convert to QUAI (1 QUAI = 10^18 base units)
      const qiPerQuai = 1 / quaiPerQi * 1000; // Convert to QI per QUAI and adjust for 1000 base units
      
      return qiPerQuai / 1000; // Return QI per 1 QUAI
    }
    console.error('Invalid response from Quai Network API');
    return null;
  } catch (error) {
    console.error('Error fetching QUAI to QI rate:', error);
    return null;
  }
};

// Fetch QUAI price in USD from CoinGecko
export const fetchQuaiUsdPrice = async (): Promise<number | null> => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=quai-network&vs_currencies=usd'
    );
    
    if (response.data && response.data['quai-network'] && response.data['quai-network'].usd) {
      return response.data['quai-network'].usd;
    }
    console.error('Invalid response from CoinGecko API');
    return null;
  } catch (error) {
    console.error('Error fetching QUAI USD price:', error);
    return null;
  }
};

// Fetch all data needed for the converter
export const fetchConversionData = async () => {
  try {
    const quaiToQiRate = await fetchQuaiToQiRate();
    const quaiUsdPrice = await fetchQuaiUsdPrice();
    
    // If both API calls failed, return null
    if (quaiToQiRate === null && quaiUsdPrice === null) {
      return null;
    }
    
    // Only use valid values (greater than 0)
    const finalQuaiToQiRate = quaiToQiRate && quaiToQiRate > 0 ? quaiToQiRate : 0;
    const finalQuaiUsdPrice = quaiUsdPrice && quaiUsdPrice > 0 ? quaiUsdPrice : 0;
    
    // Calculate QI to QUAI rate
    const qiToQuaiRate = finalQuaiToQiRate > 0 ? 1 / finalQuaiToQiRate : 0;
    
    // Calculate QI price in USD based on QUAI price and conversion rate
    const qiUsdPrice = finalQuaiUsdPrice * qiToQuaiRate;
    
    return {
      quaiToQiRate: finalQuaiToQiRate,
      qiToQuaiRate,
      quaiUsdPrice: finalQuaiUsdPrice,
      qiUsdPrice,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching conversion data:', error);
    return null;
  }
};
