
import { useEffect, useState } from "react";

export function Footer() {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  useEffect(() => {
    // Function to get last updated time from localStorage or current time
    const getLastUpdatedTime = () => {
      try {
        const savedData = localStorage.getItem('lastValidConversionData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.lastUpdated) {
            const date = new Date(parsed.lastUpdated);
            return date.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          }
        }
      } catch (e) {
        console.error('Error getting last updated time:', e);
      }
      
      // Fallback to current time if no saved data
      const now = new Date();
      return now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    };
    
    // Update timestamp initially
    setLastUpdated(getLastUpdatedTime());
    
    // Set up listener for storage changes
    const handleStorageChange = () => {
      setLastUpdated(getLastUpdatedTime());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also update the timestamp every minute
    const interval = setInterval(() => {
      setLastUpdated(getLastUpdatedTime());
    }, 60000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-md p-3 text-sm">
      <div className="font-medium">Data Updated</div>
      <div className="text-gray-600">
        Latest conversion rates fetched at {lastUpdated}
      </div>
    </div>
  );
}
