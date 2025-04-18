import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchConversionData, formatNumber } from '@/services/api';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Type for conversion data
type ConversionDataType = {
  quaiToQiRate: number;
  qiToQuaiRate: number;
  quaiUsdPrice: number;
  qiUsdPrice: number;
  lastUpdated: Date | null;
  isStaleData: boolean;
};

export function CurrencyConverter() {
  // Store last valid data in localStorage to persist between sessions
  const getInitialData = (): ConversionDataType => {
    const savedData = localStorage.getItem('lastValidConversionData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          ...parsed,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
          isStaleData: true
        };
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }
    
    // Default initial state if no saved data
    return {
      quaiToQiRate: 0,
      qiToQuaiRate: 0,
      quaiUsdPrice: 0,
      qiUsdPrice: 0,
      lastUpdated: null,
      isStaleData: false
    };
  };
  
  const [conversionData, setConversionData] = useState<ConversionDataType>(getInitialData());
  const [loading, setLoading] = useState(false);

  // Format time to 12-hour format
  const formatTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Save valid data to localStorage
  const saveValidDataToStorage = (data: ConversionDataType) => {
    if (data.quaiToQiRate > 0 && data.quaiUsdPrice > 0) {
      localStorage.setItem('lastValidConversionData', JSON.stringify(data));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConversionData();
      
      if (data && data.quaiToQiRate > 0 && data.quaiUsdPrice > 0) {
        const newData = {
          ...data,
          isStaleData: false
        };
        setConversionData(newData);
        saveValidDataToStorage(newData);
      } else {
        setConversionData(prev => ({
          ...prev,
          isStaleData: false
        }));
      }
    } catch (error) {
      console.error('Error in fetch data:', error);
      setConversionData(prev => ({
        ...prev,
        isStaleData: false
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data initially
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  // Helper to determine if we should display a value
  const shouldDisplayValue = (value: number): boolean => {
    return value > 0;
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">Currency Converter</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchData} 
          disabled={loading}
          aria-label="Refresh data"
          className="hover:bg-gray-100"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* QUAI to QI conversion */}
          <div className="flex items-center justify-between py-2">
            <div className="text-lg font-medium">1 QUAI</div>
            <div className="flex items-center">
              <span className="mx-2">→</span>
              <div className="text-lg font-medium">
                {shouldDisplayValue(conversionData.quaiToQiRate) 
                  ? `${formatNumber(conversionData.quaiToQiRate, 6)} QI` 
                  : "Loading..."}
              </div>
            </div>
          </div>
          
          {/* QI to QUAI conversion */}
          <div className="flex items-center justify-between py-2">
            <div className="text-lg font-medium">1 QI</div>
            <div className="flex items-center">
              <span className="mx-2">→</span>
              <div className="text-lg font-medium">
                {shouldDisplayValue(conversionData.qiToQuaiRate) 
                  ? `${formatNumber(conversionData.qiToQuaiRate, 6)} QUAI` 
                  : "Loading..."}
              </div>
            </div>
          </div>
          
          {/* USD prices */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">QUAI Price</div>
              <div className="text-lg font-medium">
                {shouldDisplayValue(conversionData.quaiUsdPrice) 
                  ? `$ ${formatNumber(conversionData.quaiUsdPrice, 4)}` 
                  : "Loading..."}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">QI Price</div>
              <div className="text-lg font-medium">
                {shouldDisplayValue(conversionData.qiUsdPrice) 
                  ? `$ ${formatNumber(conversionData.qiUsdPrice, 4)}` 
                  : "Loading..."}
              </div>
            </div>
          </div>
          
          {/* Last updated time */}
          {conversionData.lastUpdated && (
            <div className="text-xs text-gray-500 text-right mt-2">
              Last updated: {formatTime(conversionData.lastUpdated)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
