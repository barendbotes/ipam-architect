// @/app/page.tsx

"use client";

import { useState, useMemo } from "react";
import {
  HierarchicalAllocator,
  RegionBias,
  AllocationResult,
} from "@/lib/hierarchical-allocator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Network,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Lightbulb,
} from "lucide-react";
import { CIDRMath } from "@/lib/cidr-math";

const REGION_NAMES = ["EMEA", "APAC", "NA", "LATAM", "AFRICA", "MENA"];

const PRESET_SUPERNETS = [
  { label: "10.0.0.0/8 (Class A)", value: "10.0.0.0/8" },
  { label: "172.16.0.0/12 (Class B)", value: "172.16.0.0/12" },
  { label: "192.168.0.0/16 (Class C)", value: "192.168.0.0/16" },
];

export default function Home() {
  const [supernet, setSupernet] = useState("10.0.0.0/8");
  const [regionCount, setRegionCount] = useState(4);
  const [subRegionsPerRegion, setSubRegionsPerRegion] = useState(2);
  const [sitesNeeded, setSitesNeeded] = useState(1000);
  const [vlansPerSite, setVlansPerSite] = useState(5);
  const [vlanSize, setVlanSize] = useState(24);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regionRatios, setRegionRatios] = useState<number[]>([1, 1, 1, 1]);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set()
  );

  const updateRegionCount = (count: number) => {
    setRegionCount(count);
    setRegionRatios(Array(count).fill(1));
  };

  const updateRegionRatio = (index: number, ratio: number) => {
    const newRatios = [...regionRatios];
    newRatios[index] = ratio;
    setRegionRatios(newRatios);
  };

  const totalRatio = useMemo(
    () => regionRatios.reduce((sum, r) => sum + r, 0),
    [regionRatios]
  );

  const calculate = () => {
    try {
      setError(null);

      const regionBiases: RegionBias[] = Array.from(
        { length: regionCount },
        (_, i) => ({
          name: REGION_NAMES[i] || `Region ${i + 1}`,
          ratio: regionRatios[i] || 1,
        })
      );

      const allocator = new HierarchicalAllocator({
        supernet,
        regionBiases,
        subRegionsPerRegion,
        vlansPerSite,
        vlanSize,
        totalSitesNeeded: sitesNeeded,
        growthMultiplier: 3,
      });

      const allocation = allocator.allocate();
      setResult(allocation);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  };

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

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 80) return "text-red-600";
    if (percentage > 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Network className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Network Subnet Design Tool
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Design hierarchical IP address allocation for global deployments with intelligent capacity planning
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="shadow-xl border-2 border-blue-100 dark:border-blue-900/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Network className="w-6 h-6 text-blue-600" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Supernet Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Supernet Address
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Input
                    value={supernet}
                    onChange={(e) => setSupernet(e.target.value)}
                    placeholder="10.0.0.0/8"
                    className="font-mono"
                  />
                  {supernet && (
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const { prefix } = CIDRMath.parseCIDR(supernet);
                          const total = CIDRMath.subnetAddressCount(prefix);
                          return `${CIDRMath.formatSize(
                            total
                          )} total addresses`;
                        } catch {
                          return "Invalid CIDR";
                        }
                      })()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Quick Presets
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SUPERNETS.map((preset) => (
                      <Button
                        key={preset.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setSupernet(preset.value)}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Number of Regions</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={regionCount}
                  onChange={(e) =>
                    updateRegionCount(parseInt(e.target.value) || 1)
                  }
                  className="border-2 focus:border-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  Geographic regions (max 6)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Territories per Region</Label>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={subRegionsPerRegion}
                  onChange={(e) =>
                    setSubRegionsPerRegion(parseInt(e.target.value) || 1)
                  }
                  className="border-2 focus:border-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  Sub-divisions within each region
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Total Sites Needed</Label>
                <Input
                  type="number"
                  min={1}
                  max={100000}
                  value={sitesNeeded}
                  onChange={(e) =>
                    setSitesNeeded(parseInt(e.target.value) || 1)
                  }
                  className="border-2 focus:border-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  Expected number of sites
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">VLANs per Site</Label>
                <Input
                  type="number"
                  min={1}
                  max={64}
                  value={vlansPerSite}
                  onChange={(e) =>
                    setVlansPerSite(parseInt(e.target.value) || 1)
                  }
                  className="border-2 focus:border-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  Network segments per location
                </p>
              </div>
            </div>

            {/* VLAN Size */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-blue-100 dark:border-blue-900/50">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">VLAN Subnet Size: /{vlanSize}</Label>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {CIDRMath.formatSize(CIDRMath.usableHosts(vlanSize))} hosts
                </Badge>
              </div>
              <Slider
                value={[vlanSize]}
                onValueChange={([val]) => setVlanSize(val)}
                min={20}
                max={28}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>/20 (4K hosts)</span>
                <span>/24 (254 hosts)</span>
                <span>/28 (14 hosts)</span>
              </div>
            </div>

            {/* Regional Bias */}
            <div className="space-y-4 pt-6 border-t-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="text-blue-600">⚖️</span>
                    Regional Capacity Bias
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allocate more addresses to regions with higher ratios
                  </p>
                </div>
                <Badge variant="outline" className="text-base px-4 py-2">Total Ratio: {totalRatio}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: regionCount }).map((_, i) => (
                  <div key={i} className="space-y-3 p-4 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-base">
                        {REGION_NAMES[i] || `Region ${i + 1}`}
                      </Label>
                      <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                        {regionRatios[i]}x (
                        {((regionRatios[i] / totalRatio) * 100).toFixed(0)}%)
                      </Badge>
                    </div>
                    <Slider
                      value={[Math.log2(regionRatios[i])]}
                      onValueChange={([val]) =>
                        updateRegionRatio(i, Math.pow(2, val))
                      }
                      min={0}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>1x</span>
                      <span>2x</span>
                      <span>4x</span>
                      <span>8x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <Button onClick={calculate} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all" size="lg">
              <Network className="w-5 h-5 mr-2" />
              Calculate Subnet Hierarchy
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Warnings & Recommendations */}
            {(result.warnings || result.recommendations) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.warnings && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.recommendations && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Recommendations</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {result.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Site Prefix
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-blue-600">
                    /{result.sitePrefixRecommendation}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.totalSubnetsPerSite} VLANs per site
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Sites
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-green-600">
                    {result.totalSitesSupported.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Across all regions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div
                    className={`text-3xl font-bold ${getUtilizationColor(
                      result.utilizationPercentage
                    )}`}
                  >
                    {result.utilizationPercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {sitesNeeded.toLocaleString()} sites needed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Regions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-orange-600">
                    {result.summary.totalRegions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.summary.totalSubRegions} territories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results Tabs */}
            <Card className="shadow-xl border-2 border-blue-100 dark:border-blue-900/50">
              <Tabs defaultValue="breakdown" className="w-full">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="breakdown" className="text-base font-semibold">
                      📊 Regional Breakdown
                    </TabsTrigger>
                    <TabsTrigger value="hierarchy" className="text-base font-semibold">🌐 Full Hierarchy</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="breakdown" className="space-y-4">
                    <div className="overflow-x-auto rounded-lg border-2 border-blue-100 dark:border-blue-900/50">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
                            <th className="text-left p-4 font-bold">
                              Region
                            </th>
                            <th className="text-left p-4 font-bold">
                              CIDR
                            </th>
                            <th className="text-right p-4 font-bold">
                              Ratio
                            </th>
                            <th className="text-right p-4 font-bold">
                              Sites
                            </th>
                            <th className="text-right p-4 font-bold">
                              % of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.summary.regionBreakdown.map((r, idx) => (
                            <tr
                              key={r.name}
                              className={`border-b hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                                idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                              }`}
                            >
                              <td className="p-4">
                                <Badge variant="outline" className="text-sm font-semibold">{r.name}</Badge>
                              </td>
                              <td className="p-4 font-mono text-sm font-medium">
                                {r.cidr}
                              </td>
                              <td className="text-right p-4 font-semibold">{r.ratio}x</td>
                              <td className="text-right p-4 font-mono font-semibold">
                                {r.sitesCapacity.toLocaleString()}
                              </td>
                              <td className="text-right p-4">
                                <Badge variant="secondary" className="font-semibold">
                                  {r.percentage.toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="hierarchy" className="space-y-4">
                    {result.hierarchy.children
                      ?.filter((r) => r.name !== "Unallocated")
                      .map((region) => (
                        <Collapsible
                          key={region.id}
                          open={expandedRegions.has(region.id)}
                          onOpenChange={() => toggleRegion(region.id)}
                        >
                          <Card className="overflow-hidden">
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <ChevronDown
                                      className={`w-5 h-5 transition-transform ${
                                        expandedRegions.has(region.id)
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                    <div>
                                      <CardTitle className="text-lg">
                                        {region.name}
                                      </CardTitle>
                                      <p className="text-sm text-muted-foreground font-mono mt-1">
                                        {region.cidr}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">
                                      {region.metadata?.ratio}x ratio
                                    </Badge>
                                    <Badge variant="secondary">
                                      {CIDRMath.formatSize(
                                        region.totalAddresses
                                      )}{" "}
                                      addresses
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Network:
                                    </span>
                                    <span className="font-mono ml-2">
                                      {region.network}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Broadcast:
                                    </span>
                                    <span className="font-mono ml-2">
                                      {region.broadcast}
                                    </span>
                                  </div>
                                </div>

                                <div className="border-t pt-3 mt-3">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Territories
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {region.children?.map((subRegion) => (
                                      <div
                                        key={subRegion.id}
                                        className="p-3 bg-muted/30 rounded-lg space-y-2"
                                      >
                                        <div className="flex justify-between items-start">
                                          <h5 className="font-medium">
                                            {subRegion.name}
                                          </h5>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {subRegion.metadata?.sitesCapacity}{" "}
                                            sites
                                          </Badge>
                                        </div>
                                        <p className="font-mono text-xs text-muted-foreground">
                                          {subRegion.cidr}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {subRegion.addressRange}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
