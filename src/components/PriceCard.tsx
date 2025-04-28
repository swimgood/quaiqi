
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
  isLoading?: boolean;
  fallbackValue?: string;
}

export function PriceCard({
  title,
  value,
  subValue,
  className,
  isLoading = false,
  fallbackValue = "",
}: PriceCardProps) {
  // If the value is "$0.000000 USD" and we have a fallback, use the fallback
  const displayValue = value === "$0.000000 USD" && fallbackValue ? fallbackValue : value;
  
  return (
    <Card className={cn("overflow-hidden card-glow", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold transition-opacity",
            isLoading ? "animate-pulse-gentle" : ""
          )}
        >
          {displayValue}
        </div>
        {subValue && (
          <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
        )}
      </CardContent>
    </Card>
  );
}
