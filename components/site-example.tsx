import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CIDRMath } from "@/lib/cidr-math";
import type { AllocationResult } from "@/lib/hierarchical-allocator";

interface SiteExampleVlan {
  cidr: string;
  network: string;
  broadcast: string;
  addressRange: string;
  usableHosts: number;
}

interface SiteExample {
  cidr: string;
  network: string;
  broadcast: string;
  addressRange: string;
  vlans: SiteExampleVlan[];
  warning?: string;
}

interface SiteExampleProps {
  allocation: AllocationResult;
  vlanSize: number;
  vlansPerSite: number;
  vlanPrefixes: number[];
  updateVlanPrefix: (index: number, prefix: number) => void;
  regionThemes: { name: string; code: string }[];
}

function buildSiteExample(
  allocation: AllocationResult,
  defaultVlanPrefix: number,
  vlansPerSite: number,
  vlanPrefixes?: number[]
): SiteExample | null {
  const regions = allocation.hierarchy.children;
  if (!regions || regions.length === 0) return null;

  const region =
    regions.find((r) => r.name !== "Unallocated" && r.children && r.children.length > 0) ?? regions[0];
  const subRegion = region.children && region.children[0];
  if (!subRegion) return null;

  const { ip: subRegionIp, prefix: subRegionPrefix } = CIDRMath.parseCIDR(subRegion.cidr);
  const sitePrefix = allocation.sitePrefixRecommendation;
  const siteNetwork = CIDRMath.getNthSubnet(subRegionIp, subRegionPrefix, sitePrefix, BigInt(0));
  const siteBroadcast = CIDRMath.getBroadcastAddress(siteNetwork, sitePrefix);
  const { first: siteFirst, last: siteLast } = CIDRMath.getHostRange(siteNetwork, sitePrefix);

  const vlans: SiteExampleVlan[] = [];
  const siteBaseNum = CIDRMath.ipToNumber(siteNetwork);
  const siteBroadcastNum = CIDRMath.ipToNumber(siteBroadcast);
  const prefixes =
    vlanPrefixes && vlanPrefixes.length > 0
      ? vlanPrefixes
      : Array.from({ length: vlansPerSite }, () => defaultVlanPrefix);

  let currentIpNum = siteBaseNum;
  let allocatedVlans = 0;

  for (let i = 0; i < vlansPerSite; i++) {
    const prefix = prefixes[i] ?? defaultVlanPrefix;
    const vlanSizeBig = CIDRMath.subnetAddressCount(prefix);

    let vlanNetworkNum = currentIpNum;
    const remainder = vlanNetworkNum % vlanSizeBig;
    if (remainder !== BigInt(0)) {
      vlanNetworkNum = vlanNetworkNum - remainder + vlanSizeBig;
    }

    if (vlanNetworkNum + vlanSizeBig - BigInt(1) > siteBroadcastNum) {
      break;
    }

    const vlanNetwork = CIDRMath.numberToIp(vlanNetworkNum);
    const vlanBroadcast = CIDRMath.getBroadcastAddress(vlanNetwork, prefix);
    const { first, last } = CIDRMath.getHostRange(vlanNetwork, prefix);

    vlans.push({
      cidr: `${vlanNetwork}/${prefix}`,
      network: vlanNetwork,
      broadcast: vlanBroadcast,
      addressRange: `${first} - ${last}`,
      usableHosts: Number(CIDRMath.usableHosts(prefix)),
    });

    allocatedVlans++;
    currentIpNum = vlanNetworkNum + vlanSizeBig;
  }

  const totalSiteAddresses = CIDRMath.subnetAddressCount(sitePrefix);
  const usedAddresses = currentIpNum - siteBaseNum;
  const remainingAddresses = totalSiteAddresses - usedAddresses;

  let warning: string | undefined;
  if (allocatedVlans < vlansPerSite) {
    warning = `With your per-VLAN sizes, only ${allocatedVlans} of ${vlansPerSite} VLANs fit in the /${sitePrefix} site block.`;
  } else {
    const minVlanSize = prefixes.reduce<bigint>((min, p) => {
      const size = CIDRMath.subnetAddressCount(p);
      return min === BigInt(0) || size < min ? size : min;
    }, BigInt(0));

    if (minVlanSize > BigInt(0) && remainingAddresses > BigInt(0) && remainingAddresses < minVlanSize * BigInt(2)) {
      warning = `Per-site VLAN layout is close to capacity; only ${CIDRMath.formatSize(remainingAddresses)} addresses remain in the site block.`;
    }
  }

  return {
    cidr: `${siteNetwork}/${sitePrefix}`,
    network: siteNetwork,
    broadcast: siteBroadcast,
    addressRange: `${siteFirst} - ${siteLast}`,
    vlans,
    warning,
  };
}

export function SiteExample({
  allocation,
  vlanSize,
  vlansPerSite,
  vlanPrefixes,
  updateVlanPrefix,
  regionThemes,
}: SiteExampleProps) {
  const siteExample = buildSiteExample(allocation, vlanSize, vlansPerSite, vlanPrefixes);

  if (!siteExample) return null;

  const theme = regionThemes[0];
  const exampleSiteId = theme ? `${theme.code}-S001` : "XXX-S001";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
      {/* Region and Site Codes */}
      <Card className="border-border hover:shadow-md transition-all">
        <CardHeader className="border-b bg-gradient-subtle">
          <CardTitle className="text-sm uppercase tracking-wider">
            Region & Site Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Regions use astronomy names with shortcodes.
            </p>
            {theme && (
              <>
                <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded border mb-2">
                  {theme.name} — <span className="text-primary font-semibold">{theme.code}</span>
                </p>
                <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded border">
                  Example site ID: <span className="text-primary font-semibold">{exampleSiteId}</span>
                </p>
              </>
            )}
          </div>

          {vlanPrefixes.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">Per-VLAN Size Bias</h4>
                <p className="text-xs text-muted-foreground">
                  Adjust individual VLAN prefix lengths within the site block. Smaller prefix = larger VLAN.
                </p>
              </div>
              <ScrollArea className="h-72">
                <div className="space-y-3 pr-3">
                  {vlanPrefixes.map((prefix, index) => (
                    <div key={index} className="space-y-1.5 p-3 bg-muted/30 rounded-lg border">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">VLAN {index + 1}</span>
                        <span className="font-mono text-primary">
                          /{prefix} · {CIDRMath.formatSize(CIDRMath.usableHosts(prefix))} hosts
                        </span>
                      </div>
                      <Slider
                        value={[prefix]}
                        onValueChange={([val]) => updateVlanPrefix(index, val)}
                        min={allocation.sitePrefixRecommendation}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {siteExample.warning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {siteExample.warning}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Template Example */}
      <Card className="border-border hover:shadow-md transition-all">
        <CardHeader className="border-b bg-gradient-subtle">
          <CardTitle className="text-sm uppercase tracking-wider">
            Site Template Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-mono text-sm font-semibold text-primary">{siteExample.cidr}</p>
            <p className="text-xs text-muted-foreground mt-1">{siteExample.addressRange}</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">VLANs ({siteExample.vlans.length})</h4>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 gap-2.5 pr-3">
                {siteExample.vlans.map((vlan, index) => (
                  <div
                    key={vlan.cidr}
                    className="p-3 bg-muted/50 rounded-md border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        VLAN {index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {vlan.usableHosts} hosts
                      </Badge>
                    </div>
                    <p className="font-mono text-sm font-semibold text-primary mb-1">
                      {vlan.cidr}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {vlan.addressRange}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
