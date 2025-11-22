"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, ArrowRight, Network } from "lucide-react";
import { HierarchicalAllocator, type RegionBias, type AllocationResult } from "@/lib/hierarchical-allocator";
import { StepIndicator } from "@/components/step-indicator";
import { ConfigurationForm } from "@/components/configuration-form";
import { ResultsSummary } from "@/components/results-summary";
import { HierarchyView } from "@/components/hierarchy-view";
import { SiteExample } from "@/components/site-example";

const REGION_THEMES = [
  { name: "Orion", code: "ORI" },
  { name: "Andromeda", code: "AND" },
  { name: "Cygnus", code: "CYG" },
  { name: "Lyra", code: "LYR" },
  { name: "Draco", code: "DRC" },
  { name: "Phoenix", code: "PHX" },
];

const STEPS = ["Configuration", "Results", "Hierarchy"];

const Home = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [supernet, setSupernet] = useState("10.0.0.0/8");
  const [regionCount, setRegionCount] = useState(4);
  const [subRegionsPerRegion, setSubRegionsPerRegion] = useState(2);
  const [sitesNeeded, setSitesNeeded] = useState(1000);
  const [vlansPerSite, setVlansPerSite] = useState(5);
  const [vlanSize, setVlanSize] = useState(24);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regionRatios, setRegionRatios] = useState<number[]>([1, 1, 1, 1]);
  const [vlanPrefixes, setVlanPrefixes] = useState<number[]>([]);

  const updateRegionCount = (count: number) => {
    setRegionCount(count);
    setRegionRatios(Array(count).fill(1));
  };

  const updateRegionRatio = (index: number, ratio: number) => {
    const newRatios = [...regionRatios];
    newRatios[index] = ratio;
    setRegionRatios(newRatios);
  };

  const updateVlanPrefix = (index: number, prefix: number) => {
    setVlanPrefixes((prev) => {
      const base = prev.length ? prev : Array.from({ length: vlansPerSite }, () => vlanSize);
      const next = [...base];
      next[index] = prefix;
      return next;
    });
  };

  const calculate = () => {
    try {
      setError(null);

      const regionBiases: RegionBias[] = Array.from({ length: regionCount }, (_, i) => ({
        name: REGION_THEMES[i]?.name || `Region ${i + 1}`,
        ratio: regionRatios[i] || 1,
        code: REGION_THEMES[i]?.code,
      }));

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
      const initialPrefixes = Array.from({ length: vlansPerSite }, () => vlanSize);
      setVlanPrefixes(initialPrefixes);
      setResult(allocation);
      setCurrentStep(2);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center space-y-3 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Network className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-primary">
            Network Subnet Design Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Design hierarchical IP address allocation for global deployments with intelligent capacity planning
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {/* Content */}
        <div className="space-y-6">
          {/* Step 1: Configuration */}
          {currentStep === 1 && (
            <div className="animate-fade-in space-y-6">
              <ConfigurationForm
                supernet={supernet}
                setSupernet={setSupernet}
                regionCount={regionCount}
                setRegionCount={updateRegionCount}
                subRegionsPerRegion={subRegionsPerRegion}
                setSubRegionsPerRegion={setSubRegionsPerRegion}
                sitesNeeded={sitesNeeded}
                setSitesNeeded={setSitesNeeded}
                vlansPerSite={vlansPerSite}
                setVlansPerSite={setVlansPerSite}
                vlanSize={vlanSize}
                setVlanSize={setVlanSize}
                regionRatios={regionRatios}
                updateRegionRatio={updateRegionRatio}
                regionThemes={REGION_THEMES}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Configuration Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button size="lg" onClick={calculate} className="gap-2">
                  Calculate & Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Results Summary */}
          {currentStep === 2 && result && (
            <div className="space-y-6">
              <ResultsSummary result={result} sitesNeeded={sitesNeeded} />

              <SiteExample
                allocation={result}
                vlanSize={vlanSize}
                vlansPerSite={vlansPerSite}
                vlanPrefixes={vlanPrefixes}
                updateVlanPrefix={updateVlanPrefix}
                regionThemes={REGION_THEMES}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Configuration
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="gap-2">
                  View Full Hierarchy
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Hierarchy View */}
          {currentStep === 3 && result && (
            <div className="space-y-6">
              <HierarchyView result={result} regionThemes={REGION_THEMES} />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Results
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                  New Calculation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
