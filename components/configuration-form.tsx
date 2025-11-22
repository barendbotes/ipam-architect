import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Network, Globe, Layers, Building, Settings2, CheckCircle2, Plus, Minus } from "lucide-react";
import { CIDRMath } from "@/lib/cidr-math";
import { cn } from "@/lib/utils";

interface NumberControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

function NumberControl({ value, onChange, min = 0, max = 100, step = 1, className, disabled }: NumberControlProps) {
  const handleDecrease = () => {
    if (!disabled && value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrease = () => {
    if (!disabled && value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("flex items-center border rounded-md bg-background h-10 w-full overflow-hidden shadow-sm", className)}>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        className="border-0 shadow-none rounded-none focus-visible:ring-0 text-center h-full flex-1 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
        min={min}
        max={max}
        disabled={disabled}
      />
      <div className="flex h-full shrink-0 divide-x border-l bg-muted/10">
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-9 rounded-none hover:bg-muted/50 active:bg-muted"
          onClick={handleDecrease}
          disabled={disabled || value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-9 rounded-none hover:bg-muted/50 active:bg-muted"
          onClick={handleIncrease}
          disabled={disabled || value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface ConfigurationFormProps {
  supernet: string;
  setSupernet: (value: string) => void;
  regionCount: number;
  setRegionCount: (value: number) => void;
  subRegionsPerRegion: number;
  setSubRegionsPerRegion: (value: number) => void;
  sitesNeeded: number;
  setSitesNeeded: (value: number) => void;
  vlansPerSite: number;
  setVlansPerSite: (value: number) => void;
  vlanSize: number;
  setVlanSize: (value: number) => void;
  regionRatios: number[];
  updateRegionRatio: (index: number, ratio: number) => void;
  regionThemes: { name: string; code: string }[];
}

const PRESET_SUPERNETS = [
  { label: "10.0.0.0/8", value: "10.0.0.0/8" },
  { label: "172.16.0.0/12", value: "172.16.0.0/12" },
  { label: "192.168.0.0/16", value: "192.168.0.0/16" },
];

export function ConfigurationForm(props: ConfigurationFormProps) {
  const totalRatio = props.regionRatios.reduce((sum, r) => sum + r, 0);

  return (
    <Card className="border-border shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-gradient-subtle pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Network Configuration</CardTitle>
            <CardDescription>Define the parameters for your global network architecture</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-8 px-6">
        
        {/* Section 1: Supernet Scope */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-2">
             <Label className="text-base font-semibold flex items-center gap-2">
                Supernet Scope
             </Label>
             <p className="text-sm text-muted-foreground">
               The top-level CIDR block that will be subdivided across all regions.
             </p>
          </div>
          <div className="md:col-span-8 space-y-4">
            <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="supernet"
                    value={props.supernet}
                    onChange={(e) => props.setSupernet(e.target.value)}
                    placeholder="10.0.0.0/8"
                    className="font-mono text-lg h-12 pl-4 pr-12 bg-muted/30 border-primary/20 focus-visible:ring-primary/30 transition-all"
                  />
                   {props.supernet && (() => {
                      try {
                        CIDRMath.parseCIDR(props.supernet);
                        return <CheckCircle2 className="absolute right-4 top-3.5 w-5 h-5 text-green-500 animate-in fade-in zoom-in" />;
                      } catch {
                        return null;
                      }
                    })()}
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {PRESET_SUPERNETS.map((preset) => (
                        <Button
                            key={preset.value}
                            variant="outline"
                            size="sm"
                            onClick={() => props.setSupernet(preset.value)}
                            className="h-7 text-xs font-mono bg-transparent hover:bg-primary/5"
                        >
                            {preset.label}
                        </Button>
                        ))}
                    </div>
                    {props.supernet && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            {(() => {
                                try {
                                    const { prefix } = CIDRMath.parseCIDR(props.supernet);
                                    const total = CIDRMath.subnetAddressCount(prefix);
                                    return `${CIDRMath.formatSize(total)} addresses`;
                                } catch {
                                    return "Invalid CIDR";
                                }
                            })()}
                        </span>
                    )}
                </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Section 2: Network Topology */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           <div className="md:col-span-4 space-y-2">
             <Label className="text-base font-semibold flex items-center gap-2">
                Network Topology
             </Label>
             <p className="text-sm text-muted-foreground">
               Define the hierarchical structure of your network deployment.
             </p>
          </div>
          
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Regions */}
            <div className="space-y-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Globe className="w-4 h-4" />
                <Label htmlFor="regions" className="font-semibold cursor-pointer group-hover:text-blue-600 transition-colors">Regions</Label>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <NumberControl
                    value={props.regionCount}
                    onChange={props.setRegionCount}
                    min={1}
                    max={6}
                  />
                </div>
                <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(props.regionCount / 6) * 100}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Global geographic divisions (max 6)</p>
            </div>

            {/* Territories */}
            <div className="space-y-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 text-indigo-500 mb-1">
                <Layers className="w-4 h-4" />
                <Label htmlFor="territories" className="font-semibold cursor-pointer group-hover:text-indigo-600 transition-colors">Territories</Label>
              </div>
               <div className="flex items-center gap-3">
                <div className="w-36">
                  <NumberControl
                    value={props.subRegionsPerRegion}
                    onChange={props.setSubRegionsPerRegion}
                    min={1}
                    max={16}
                  />
                </div>
                <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(props.subRegionsPerRegion / 16) * 100}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Sub-regions per global region</p>
            </div>

             {/* Total Sites */}
             <div className="space-y-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Building className="w-4 h-4" />
                <Label htmlFor="sites" className="font-semibold cursor-pointer group-hover:text-emerald-600 transition-colors">Total Sites</Label>
              </div>
              <NumberControl
                value={props.sitesNeeded}
                onChange={props.setSitesNeeded}
                min={1}
                max={100000}
                step={10}
                className="h-12 text-lg font-medium"
              />
              <p className="text-xs text-muted-foreground">Total physical locations required</p>
            </div>

             {/* VLANs/Site */}
             <div className="space-y-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <Settings2 className="w-4 h-4" />
                <Label htmlFor="vlans" className="font-semibold cursor-pointer group-hover:text-orange-600 transition-colors">VLANs per Site</Label>
              </div>
               <div className="flex items-center gap-3">
                <div className="w-36">
                  <NumberControl
                    value={props.vlansPerSite}
                    onChange={props.setVlansPerSite}
                    min={1}
                    max={64}
                  />
                </div>
                 <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(props.vlansPerSite / 64) * 100}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Network segments per location</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Section 3: Addressing Standard */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           <div className="md:col-span-4 space-y-2">
             <Label className="text-base font-semibold flex items-center gap-2">
                Addressing Standard
             </Label>
             <p className="text-sm text-muted-foreground">
               Set the standard size for your VLAN subnets.
             </p>
          </div>
          
          <div className="md:col-span-8">
             <div className="p-6 bg-muted/30 rounded-xl border border-dashed border-primary/20">
                 <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                        <Label className="text-base font-medium">VLAN Subnet Size</Label>
                        <p className="text-xs text-muted-foreground">CIDR Prefix Length</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1 bg-background shadow-sm border-primary/20">
                        <span className="font-mono text-primary mr-2">/{props.vlanSize}</span>
                        <span className="text-muted-foreground text-xs font-normal border-l pl-2 ml-2">
                            {CIDRMath.formatSize(CIDRMath.usableHosts(props.vlanSize))} hosts
                        </span>
                    </Badge>
                 </div>
                 
                 <Slider
                    value={[props.vlanSize]}
                    onValueChange={([val]) => props.setVlanSize(val)}
                    min={20}
                    max={28}
                    step={1}
                    className="w-full mb-2"
                />
                <div className="flex justify-between text-xs font-mono text-muted-foreground px-1">
                    <span>/20 (Large)</span>
                    <span>/24 (Standard)</span>
                    <span>/28 (Small)</span>
                </div>
             </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Section 4: Regional Bias */}
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <Label className="text-base font-semibold">Regional Capacity Bias</Label>
                    <p className="text-sm text-muted-foreground">
                        Adjust allocation ratios to reserve more space for high-growth regions.
                    </p>
                </div>
                 <Badge variant="secondary" className="font-mono">
                    Total Weight: {totalRatio}
                </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {Array.from({ length: props.regionCount }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 bg-card rounded-xl border shadow-sm hover:border-purple-200 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-semibold text-sm truncate pr-2">
                    {props.regionThemes[i]?.name || `Region ${i + 1}`}
                  </Label>
                  <Badge className={cn(
                    "font-mono text-[10px] px-1.5 py-0.5 h-5 transition-colors",
                    props.regionRatios[i] > 1 ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-muted text-muted-foreground"
                  )}>
                    {props.regionRatios[i]}x
                  </Badge>
                </div>
                
                <Slider
                  value={[Math.log2(props.regionRatios[i])]}
                  onValueChange={([val]) => props.updateRegionRatio(i, Math.pow(2, val))}
                  min={0}
                  max={3}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50">
                  <span>1x</span>
                  <span>2x</span>
                  <span>4x</span>
                  <span>8x</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
