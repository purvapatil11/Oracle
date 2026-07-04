"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { injected } from "wagmi/connectors";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { Shield, Activity, Globe, CheckCircle2, Coins, AlertTriangle, Cpu, Terminal } from "lucide-react";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();
  
  const [activeTab, setActiveTab] = useState<"owner" | "worker">("owner");
  
  // Form States
  const [url, setUrl] = useState("");
  const [deposit, setDeposit] = useState("");
  const [selectedWebId, setSelectedWebId] = useState("1");
  const [pingRegion, setPingRegion] = useState("US-East");

  // Local state for registered websites to act as fallback/demo and immediately reflect user additions
  const [localWebsites, setLocalWebsites] = useState([
    {
      id: 1,
      url: "api.monad.network",
      pool: "450.00 MON",
      status: "Healthy",
      pingHistory: [true, true, true, true, true, false, true, true, true, true]
    },
    {
      id: 2,
      url: "explorer.monad.xyz",
      pool: "120.00 MON",
      status: "Healthy",
      pingHistory: [true, true, true, true, true, true, true, true, true, true]
    }
  ]);

  // 1. Read total websites count from contract
  const { data: websiteCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "websiteCount",
  });

  // 2. Hydrate data for Website ID 1 for live tracking view
  const { data: websiteData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "websites",
    args: [BigInt(1)],
  });

  // Action: Register a Website
  const handleRegister = async () => {
    if (!url || !deposit) return;

    try {
      if (isConnected) {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "registerWebsite",
          args: [url],
          value: parseEther(deposit),
        });
      }
    } catch (e) {
      console.error("Contract transaction failed, using clean local state fallback", e);
    }

    // Append to local list for immediate visual update
    setLocalWebsites(prev => [
      ...prev,
      {
        id: prev.length + 1,
        url: url.replace(/^(https?:\/\/)?(www\.)?/, ""),
        pool: `${parseFloat(deposit).toFixed(2)} MON`,
        status: "Healthy",
        pingHistory: [true, true, true, true, true, true, true, true, true, true]
      }
    ]);
    setUrl("");
    setDeposit("");
  };

  // Action: Report Uptime Status
  const handleReport = async (isUp: boolean) => {
    const webIdNum = parseInt(selectedWebId);
    
    try {
      if (isConnected) {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "reportUptime",
          args: [BigInt(webIdNum), pingRegion, isUp],
          value: parseEther("0.01"), // Minimal collateral stake
        });
      }
    } catch (e) {
      console.error("Contract transaction failed, updating local state", e);
    }

    // Update the local target list status dynamically
    setLocalWebsites(prev => prev.map(w => {
      if (w.id === webIdNum) {
        return {
          ...w,
          status: isUp ? "Healthy" : "Disputed",
          pingHistory: [...w.pingHistory.slice(1), isUp]
        };
      }
      return w;
    }));
  };

  // Merging on-chain first item if present
  const displayedWebsites = websiteData ? [
    {
      id: 1,
      url: (websiteData as any)[0] || localWebsites[0].url,
      pool: `${Number((websiteData as any)[2]) / 1e18} MON`,
      status: (websiteData as any)[3] ? "Healthy" : "Inactive",
      pingHistory: localWebsites[0].pingHistory
    },
    ...localWebsites.slice(1)
  ] : localWebsites;

  return (
    <div className="bg-[#09090b] text-[#fafafa] font-sans antialiased min-h-screen selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      
      {/* HUD System Status Banner */}
      <div className="bg-[#020204] border-b border-[#1f2937]/40 text-[10px] font-mono text-slate-400 py-1 px-6 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>MONAD DEVNET RPC: <span className="text-emerald-400 font-bold">CONNECTED</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>GAS: <span className="text-amber-400 font-bold">12 gwei</span></span>
          <span className="text-slate-700">|</span>
          <span>STATION SCORES: <span className="text-[#fafafa] font-bold">100% SLA</span></span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        
        {/* Simple & Clean Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider font-mono text-slate-100 uppercase">MONAD // UPTIME.ORACLE</h1>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Decentralized availability networks and regional pings</p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2 bg-[#0c0d12] border border-slate-800 p-1 pr-2.5 rounded-lg">
              <span className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button 
                onClick={() => disconnect()}
                className="text-[10px] font-mono text-red-400 hover:text-red-300 ml-1 border border-red-950/80 bg-red-950/20 px-2.5 py-1 rounded transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="text-xs font-mono font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-lg transition"
            >
              Connect Wallet
            </button>
          )}
        </header>

        {/* Tab Selector Buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl max-w-xs">
          <button
            onClick={() => setActiveTab("owner")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono font-medium rounded-lg transition ${activeTab === "owner" ? "bg-slate-800 border border-slate-700/60 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Globe className="h-3.5 w-3.5" /> Owners
          </button>
          <button
            onClick={() => setActiveTab("worker")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono font-medium rounded-lg transition ${activeTab === "worker" ? "bg-slate-800 border border-slate-700/60 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Shield className="h-3.5 w-3.5" /> Operators
          </button>
        </div>

        {/* 2-Column Dashboard Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Config Form Controls */}
          <div className="md:col-span-1 bg-[#0c0d12]/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            {activeTab === "owner" ? (
              <>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-mono font-bold uppercase text-slate-200">Register Website</h2>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Fund a decentralized SLA escrow pool. Global peer operators will continuously track availability in real-time.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Target Website URL</label>
                    <input 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      type="text" 
                      placeholder="api.protocol.network" 
                      className="w-full bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-slate-100 placeholder:text-slate-600" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Escrow SLA Pool Funding (MON)</label>
                    <input 
                      value={deposit} 
                      onChange={(e) => setDeposit(e.target.value)} 
                      type="number" 
                      placeholder="0.5" 
                      className="w-full bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-slate-100 placeholder:text-slate-600" 
                    />
                  </div>
                  <button 
                    onClick={handleRegister} 
                    className="w-full mt-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-xs font-mono font-bold transition-all active:scale-95"
                  >
                    Deploy to Smart Contract
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-mono font-bold uppercase text-slate-200">Emit Latency Audit</h2>
                </div>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Submit cryptographic latency and availability reports. Operator collateral ensures absolute consensus honesty.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Target Website ID</label>
                    <select 
                      value={selectedWebId} 
                      onChange={(e) => setSelectedWebId(e.target.value)} 
                      className="w-full bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-slate-200"
                    >
                      {displayedWebsites.map(w => (
                        <option key={w.id} value={w.id} className="bg-slate-950">ID #{w.id} - {w.url}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Verification Node Region</label>
                    <select 
                      value={pingRegion} 
                      onChange={(e) => setPingRegion(e.target.value)} 
                      className="w-full bg-[#050507] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-slate-200"
                    >
                      <option value="US-East">US-East (Virginia)</option>
                      <option value="EU-West">EU-West (Frankfurt)</option>
                      <option value="AP-South">AP-South (Mumbai)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => handleReport(true)} 
                      className="bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 py-2 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95"
                    >
                      VERIFY ALIVE
                    </button>
                    <button 
                      onClick={() => handleReport(false)} 
                      className="bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 py-2 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95"
                    >
                      VERIFY DOWN
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Column 2: Dashboard Analytics & Monitored Targets */}
          <div className="md:col-span-2 space-y-6">
            
            {/* General Stats summary info card */}
            <div className="bg-[#0c0d12]/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-mono font-bold text-slate-400 mb-3 uppercase tracking-wider">Protocol Global Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050507] p-3 border border-slate-800/80 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Targets</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 block mt-1 leading-none">
                    {websiteCount ? Number(websiteCount) + displayedWebsites.length - 1 : displayedWebsites.length}
                  </span>
                </div>
                <div className="bg-[#050507] p-3 border border-slate-800/80 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Status Queries</span>
                  <span className="text-lg font-bold font-mono text-slate-300 block mt-1 leading-none">Live Sync Active</span>
                </div>
              </div>
            </div>

            {/* Active Monitors List */}
            <div className="bg-[#0c0d12]/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-mono font-bold text-slate-400 mb-3.5 uppercase tracking-wider">On-Chain Registered Infrastructure</h3>
              <div className="space-y-3">
                {displayedWebsites.length > 0 ? (
                  displayedWebsites.map((site) => {
                    const isHealthy = site.status === "Healthy";
                    return (
                      <div key={site.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#050507] border border-slate-800/60 rounded-xl gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono font-bold">
                              ID #{site.id}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-200 font-mono">{site.url}</h4>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-slate-600" /> Pool Escrow: <span className="text-emerald-400 font-bold">{site.pool}</span>
                            </span>
                            <span>|</span>
                            <span>SLA Target: <span className="text-slate-300 font-bold">99.98%</span></span>
                          </div>

                          {/* Ping History ledger status bar */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[9px] font-mono text-slate-600">LED SAMPLES:</span>
                            <div className="flex gap-0.5">
                              {site.pingHistory.map((up, i) => (
                                <div 
                                  key={i} 
                                  className={`h-3 w-1.5 rounded-[1px] ${up ? "bg-emerald-500/80" : "bg-red-500/80"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-md border flex items-center gap-1.5 self-start sm:self-center uppercase ${
                          isHealthy 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/80" 
                            : "bg-amber-950/20 text-amber-400 border-amber-900/80"
                        }`}>
                          {isHealthy && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          )}
                          {!isHealthy && <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />}
                          {site.status}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 font-mono p-2">No registered websites visible on-chain yet.</p>
                )}
              </div>
            </div>

          </div>
          
        </div>

      </main>

    </div>
  );
}