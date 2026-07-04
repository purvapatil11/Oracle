"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { injected } from "wagmi/connectors";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract";
import { Shield, Activity, Globe, CheckCircle2, Coins } from "lucide-react";

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
  const [pingRegion, setPingRegion] = useState("Asia-South");

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

  // 3. Format dynamic on-chain array cleanly if data exists
  const activeWebsites = websiteData ? [
    {
      id: 1,
      url: (websiteData as any)[0],
      pool: `${Number((websiteData as any)[2]) / 1e18} MON`,
      status: (websiteData as any)[3] ? "Healthy" : "Inactive"
    }
  ] : [];

  // Action: Register a Website
  const handleRegister = async () => {
    if (!url || !deposit) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "registerWebsite",
      args: [url],
      value: parseEther(deposit),
    });
  };

  // Action: Report Uptime Status
  const handleReport = async (isUp: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "reportUptime",
      args: [BigInt(selectedWebId), pingRegion, isUp],
      value: parseEther("0.01"), // Staking standard minimal requirement
    });
  };

  return (
    <main className="max-w-6xl mx-auto p-6 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">MONAD <span className="text-emerald-400">UPTIME</span></h1>
            <p className="text-xs text-slate-400">Decentralized Proof-of-Availability Network</p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button 
              onClick={() => disconnect()}
              className="text-xs bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900 px-3 py-1.5 rounded-lg transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={() => connect({ connector: injected() })}
            className="text-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-emerald-500/10"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {/* Mode Select Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab("owner")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition ${activeTab === "owner" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Globe className="h-4 w-4" /> Website Owners
        </button>
        <button
          onClick={() => setActiveTab("worker")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition ${activeTab === "worker" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Shield className="h-4 w-4" /> Node Operators
        </button>
      </div>

      {/* Main Dashboard Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Forms */}
        <div className="md:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          {activeTab === "owner" ? (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-400"/> Register Website</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Fund a pool of Monad native tokens. Node operators globally will track your uptime using skin-in-the-game collateral execution.</p>
              
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Website URL</label>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" placeholder="https://example.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Initial Pool Deposit (MON)</label>
                  <input value={deposit} onChange={(e) => setDeposit(e.target.value)} type="number" placeholder="0.5" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100" />
                </div>
                <button onClick={handleRegister} className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-sm font-medium transition">
                  Deploy to Smart Contract
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-400"/> Run Regional Ping</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Submit real-time latency audits. Staking token collateral ensures report integrity. Liars are automatically slashed.</p>
              
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Website ID</label>
                  <input value={selectedWebId} onChange={(e) => setSelectedWebId(e.target.value)} type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your Execution Node Region</label>
                  <input value={pingRegion} onChange={(e) => setPingRegion(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => handleReport(true)} className="bg-emerald-950/30 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition">
                    REPORT UP
                  </button>
                  <button onClick={() => handleReport(false)} className="bg-red-950/30 hover:bg-red-900/30 text-red-400 border border-red-900 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition">
                    REPORT DOWN
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Active Live Dashboard Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Protocol Global Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
                <span className="text-xs text-slate-500 block">Total Registered Assets</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{websiteCount?.toString() || "0"}</span>
              </div>
              <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
                <span className="text-xs text-slate-500 block">Active Status Queries</span>
                <span className="text-xl font-bold font-mono text-slate-300">Live Tracker Active</span>
              </div>
            </div>
          </div>

          {/* Active Real-Time Monitors */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">On-Chain Registered Infrastructure</h3>
            <div className="space-y-3">
              {activeWebsites.length > 0 ? (
                activeWebsites.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/60 rounded-xl">
                    <div>
                      <h4 className="text-sm font-medium text-slate-200 font-mono">{site.url}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">ID: {site.id}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono flex items-center gap-1">
                          <Coins className="h-2.5 w-2.5" /> Pool: {site.pool}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-900 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {site.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-mono">No registered websites visible on-chain yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}