
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">QUAI/QI Converter</h1>
        <p className="text-gray-600">Real-time conversion rates and prices</p>
      </div>
      
      <CurrencyConverter />
      
      <p className="text-sm text-gray-500 mt-6">
        Data updates automatically every 30 seconds
      </p>
      
      <Footer />
    </div>
  );
};

export default Index;
