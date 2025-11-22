import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Lightbulb, Copy, Check } from "lucide-react";
import type { AllocationResult } from "@/lib/hierarchical-allocator";
import { cn } from "@/lib/utils";

interface ResultsSummaryProps {
  result: AllocationResult;
  sitesNeeded: number;
}

export function ResultsSummary({ result, sitesNeeded }: ResultsSummaryProps) {
  const [copied, setCopied] = useState(false);

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 80) return "text-destructive";
    if (percentage > 60) return "text-orange-500";
    return "text-emerald-500";
  };

  const handleCopy = () => {
    const summary = {
      supernet: result.hierarchy.cidr,
      totalSites: result.totalSitesSupported,
      utilization: result.utilizationPercentage,
      regions: result.summary.regionBreakdown
    };
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalRatio = result.summary.regionBreakdown.reduce((acc, r) => acc + r.ratio, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Warnings and Recommendations */}
      {(result.warnings || result.recommendations) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.warnings && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {result.recommendations && (
            <Alert className="border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <AlertTitle className="font-semibold">Recommendations</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  {result.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex justify-end gap-2">
         <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied JSON" : "Copy JSON"}
         </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Site Prefix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 relative z-10 space-y-3">
            <div>
                <div className="text-3xl font-bold text-primary">/{result.sitePrefixRecommendation}</div>
                <p className="text-sm text-muted-foreground mt-1">
                {result.totalSubnetsPerSite} VLANs capacity
                </p>
            </div>
            <div className="space-y-1.5">
                 <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    <span>VLAN Utilization</span>
                    <span>{Math.round((result.summary.vlansPerSite / result.totalSubnetsPerSite) * 100)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn(
                            "h-full rounded-full transition-all duration-500", 
                            (result.summary.vlansPerSite / result.totalSubnetsPerSite) > 0.8 ? "bg-orange-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, (result.summary.vlansPerSite / result.totalSubnetsPerSite) * 100)}%` }} 
                    />
                 </div>
                 <p className="text-xs text-muted-foreground text-right">{result.summary.vlansPerSite} used</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold">
              {result.totalSitesSupported.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Across all regions</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className={cn("text-3xl font-bold", getUtilizationColor(result.utilizationPercentage))}>
              {result.utilizationPercentage.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {sitesNeeded.toLocaleString()} sites needed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-all hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold">{result.summary.totalRegions}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {result.summary.totalSubRegions} territories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Breakdown */}
      <Card className="border-border">
        <CardHeader className="border-b bg-gradient-subtle">
          <div className="flex justify-between items-center">
             <CardTitle>Regional Distribution</CardTitle>
             <Badge variant="outline" className="font-mono">
                Supernet: {result.hierarchy.cidr}
             </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Supernet Visualization Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span>Allocation Breakdown</span>
                <span>100% Total Capacity</span>
            </div>
            <div className="h-6 w-full bg-muted/50 rounded-full overflow-hidden flex border shadow-inner">
                {result.summary.regionBreakdown.map((r, i) => (
                    <div 
                        key={i}
                        className="h-full first:bg-yellow-500 even:bg-orange-500 odd:bg-blue-500 hover:opacity-80 transition-opacity relative group border-r border-background/20 last:border-r-0"
                        style={{ width: `${r.percentage}%` }}
                        title={`${r.name}: ${r.percentage.toFixed(1)}%`}
                    >
                    </div>
                ))}
                {result.summary.regionBreakdown.reduce((acc, r) => acc + r.percentage, 0) < 100 && (
                   <div className="h-full bg-muted-foreground/5" style={{ flex: 1 }} title="Unallocated" />
                )}
            </div>
          </div>

          {/* Grid of Region Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {result.summary.regionBreakdown.map((r, i) => {
                 const projectedSites = Math.ceil(sitesNeeded * (r.ratio / totalRatio));
                 const utilization = Math.min(100, (projectedSites / r.sitesCapacity) * 100);
                 const isFull = utilization > 90;

                 return (
                    <div key={i} className="group flex flex-col p-4 rounded-xl bg-card border hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                             <div className="space-y-1">
                                <div className="font-semibold text-base">{r.name}</div>
                                <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                                    {r.cidr}
                                </Badge>
                             </div>
                             <Badge variant="secondary" className="font-mono text-xs">
                                {r.percentage.toFixed(1)}%
                             </Badge>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                    <span>Projected Utilization</span>
                                    <span className={isFull ? "text-destructive" : "text-emerald-500"}>{utilization.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500", 
                                            isFull ? "bg-destructive" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${utilization}%` }} 
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{projectedSites.toLocaleString()} sites</span>
                                    <span>{r.sitesCapacity.toLocaleString()} cap</span>
                                </div>
                            </div>

                             <div className="pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                                <span>Growth Ratio</span>
                                <Badge variant="outline" className="bg-muted/30 font-mono text-xs">
                                    {r.ratio}x
                                </Badge>
                             </div>
                        </div>
                    </div>
                 );
             })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
