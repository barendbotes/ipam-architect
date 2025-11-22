import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { AllocationResult } from "@/lib/hierarchical-allocator";
import { CIDRMath } from "@/lib/cidr-math";
import { cn } from "@/lib/utils";

interface HierarchyViewProps {
  result: AllocationResult;
  regionThemes: { name: string; code: string }[];
}

function TerritorySitePreview({
  siteId,
  cidr,
  vlanCount,
  label
}: {
  siteId: string;
  cidr: string;
  vlanCount: number;
  label: string;
}) {
  return (
    <div className="bg-background/50 rounded border p-2 text-xs space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{label}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-mono">{siteId}</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-mono text-primary">{cidr}</span>
        <span className="text-muted-foreground">{vlanCount} VLANs</span>
      </div>
    </div>
  );
}

export function HierarchyView({ result, regionThemes }: HierarchyViewProps) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(regionId)) {
        newSet.delete(regionId);
      } else {
        newSet.add(regionId);
      }
      return newSet;
    });
  };

  const getRegionCode = (regionName: string) => {
    const theme = regionThemes.find(t => t.name === regionName);
    return theme?.code || regionName.substring(0, 3).toUpperCase();
  };

  return (
    <Card className="border-border animate-slide-up">
      <CardHeader className="border-b bg-gradient-subtle">
        <CardTitle>Full Hierarchy</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {result.hierarchy.children
          ?.filter((r) => r.name !== "Unallocated")
          .map((region) => (
            <Collapsible
              key={region.id}
              open={expandedRegions.has(region.id)}
              onOpenChange={() => toggleRegion(region.id)}
            >
              <CollapsibleTrigger className="w-full group">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        expandedRegions.has(region.id) && "rotate-180"
                      )}
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold bg-background">
                          {region.name}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">{region.cidr}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {region.metadata?.sitesCapacity
                          ? `${region.metadata.sitesCapacity.toLocaleString()} sites capacity`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {region.children?.length || 0} territories
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 ml-4 md:ml-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {region.children?.map((subRegion, subIndex) => {
                    // Calculate site examples
                    const regionCode = getRegionCode(region.name);
                    const sitePrefix = result.sitePrefixRecommendation;
                    const { ip: subRegionIp, prefix: subRegionPrefix } = CIDRMath.parseCIDR(subRegion.cidr);
                    const maxSites = Number(CIDRMath.subnetCount(subRegionPrefix, sitePrefix));
                    
                    // First Site
                    const firstSiteCidr = CIDRMath.getNthSubnet(subRegionIp, subRegionPrefix, sitePrefix, BigInt(0));
                    const firstSiteId = `${regionCode}-T${subIndex + 1}-S001`;
                    
                    // Last Site
                    const lastSiteCidr = CIDRMath.getNthSubnet(subRegionIp, subRegionPrefix, sitePrefix, BigInt(maxSites - 1));
                    const lastSiteId = `${regionCode}-T${subIndex + 1}-S${maxSites}`;

                    return (
                      <div
                        key={subRegion.id}
                        className="p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{subRegion.name}</span>
                              <span className="font-mono text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                                {subRegion.cidr}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {subRegion.metadata?.sitesCapacity?.toLocaleString()} sites
                              </p>
                              <span className="text-border">•</span>
                              <p className="text-xs font-mono text-muted-foreground/70">
                                {subRegion.addressRange}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <TerritorySitePreview
                            label="First Site"
                            siteId={firstSiteId}
                            cidr={`${firstSiteCidr}/${sitePrefix}`}
                            vlanCount={result.summary.vlansPerSite}
                          />
                          <TerritorySitePreview
                            label="Last Site"
                            siteId={lastSiteId}
                            cidr={`${lastSiteCidr}/${sitePrefix}`}
                            vlanCount={result.summary.vlansPerSite}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
      </CardContent>
    </Card>
  );
}
