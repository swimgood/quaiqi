
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Footer() {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x00700BD124Ffab1f7062D177aF1BB323Efee2665");
    toast.success("Address copied to clipboard!");
  };

  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} QUAI/QI. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm">Tip me:</p>
          <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-md">
            <a
              href="https://quaiscan.io/address/0x00700BD124Ffab1f7062D177aF1BB323Efee2665"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono truncate max-w-[160px] md:max-w-[200px] hover:text-primary transition-colors flex items-center gap-1"
            >
              0x00700BD124Ffab1f7062D177aF1BB323Efee2665
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyAddress}
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
