import { useState } from "react";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [copied, setCopied] = useState(false);
  const address = "0x00700BD124Ffab1f7062D177aF1BB323Efee2665";

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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

      {/* Tip me section */}
      <div className="text-center mt-8 text-sm text-gray-500 flex flex-col items-center gap-2">
        <div>
          Tip me:&nbsp;
          <a
            href={`https://quaiscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-800"
          >
            {address}
          </a>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-800 border border-gray-300 rounded-md hover:bg-gray-300 transition"
        >
          {copied ? "Copied!" : "Copy address"}
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
