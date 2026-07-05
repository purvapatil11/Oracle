# Oracle: Decentralized Multi-Region Web3 Uptime Platform

A trustless, decentralized alternative to traditional website monitoring services.leverages an on-chain game-theoretic consensus protocol to perform uptime checks, using a stake-and-challenge mechanism to distribute rewards and maintain permanent, immutable incident logs.

---

##  Product Showcases

<p align="center">
  <img src="screenshots/photo1.png" alt="Oracle dashboard" width="700" />
  <br />
  <img src="screenshots/photo2.png" alt="Oracle incidents view" width="700" />
</p>

---

## The Problem & Our Solution

### The Problem with Centralized Monitoring (Web2)
1. **Single Point of Failure:** If a traditional monitoring service's server fails or experiences local network routing issues, it triggers false-positive downtime alerts, eroding trust.
2. **Opacity of SLA Metrics:** Closed-source databases can easily be modified or misreported by cloud hosts or monitoring platforms. Website owners lack cryptographic proof of downtime when claiming SLA breaches.
3. **Friction in Web3 Environments:** Decentralized protocols, DAOs, and dApps must pay for monitoring using Web2 credit cards and SaaS subscriptions, breaking the permissionless, end-to-end cryptographic flow.

### The Oracle Solution (Web3)
Oracle completely decentralizes the website monitoring ecosystem, transforming uptime verification into an **incentive-aligned economic game** governed by smart contracts:
* **Escrow-Funded Jobs:** Website owners deposit native **MON** tokens into an on-chain reward pool to fund ongoing monitoring.
* **Skin in the Game (Staking):** Global reporting nodes (workers) monitor the registered URLs. When submitting an uptime report, they must stake their own **MON** (minimum 0.01 MON) behind their report's accuracy.
* **Optimistic Consensus & Dispute Mechanism:** Reports are assumed true unless challenged within a **3-minute dispute window**. If challenged, a community-driven voting phase resolves the correct state, rewarding the honest party and slashing the liar's stake.

---

## Protocol Lifecycle & Game Theory

Oracle operates as an optimistic, stake-backed oracle network. The diagram below illustrates the on-chain interaction flow:

```
                  +--------------------------------+
                  |  Owner registers website &     |
                  |  deposits MON into Reward Pool |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |  Regional Node pings site &    |
                  |  reports status + stakes MON  |
                  +---------------+----------------+
                                  |
                                  v
                     /=========================\
                    /     Was it disputed       \
                    \   within 3-minute window? /
                     \=========================/
                             /          \
                     Yes    /            \   No (Optimistic Path)
                           /              \
                          v                v
            +-----------------------+    +-----------------------+
            | Challenger matches    |    | Reporter is proven    |
            | stake & flags dispute |    | honest. Gets stake    |
            +-----------+-----------+    | back + base reward    |
                        |                | from website pool.    |
                        v                +-----------------------+
            +-----------------------+
            | Community casts votes |
            |   on disputed report  |
            +-----------+-----------+
                        |
                        v
            +-----------------------+
            | Contract Settled:     |
            | Correct party wins    |
            | entire combined pool  |
            +-----------------------+
```


## 🛠️ Tech Stack & Directory Structure

* **Smart Contracts:** Solidity `^0.8.20`, developed and tested using **Foundry** (Forge-std).
* **Frontend App:** **Next.js 16** (React 19, App Router) styled with **Tailwind CSS v4** and lucide icons.
* **Web3 Integration:** **Wagmi** and **Viem** with React Query, configured for the Monad Testnet / Devnet environment.

### Project Layout
```
/
├── contracts/                  # Solidity smart contracts (Foundry)
│   ├── src/
│   │   └── UptimeProtocol.sol  # Core protocol contract
│   ├── script/
│   │   └── DeployUptime.s.sol  # Deployment script
│   └── test/
│       └── UptimeProtocol.t.sol# Comprehensive staking & slashing unit tests
└── frontend/                   # Next.js 16 Web Dashboard
    ├── src/
    │   ├── app/                # Next.js pages (Landing, Dashboard, Incidents)
    │   ├── components/         # Reusable UI components (Navbar, StatusBadge)
    │   ├── config/             # Wagmi provider setup & contract ABI configs
    │   └── lib/                # Mock data layer & local fallbacks
    └── package.json            # Frontend dependency specifications
```

---

## 📜 Smart Contract Architecture

The primary logic is implemented in `contracts/src/UptimeProtocol.sol`.

### Core Data Models
* `Website`: Holds the website's metadata, the owner address, the active status, and the remaining reward `balancePool`.
* `Report`: Logs the state of an uptime check, containing the `reporter`, `reporterStake`, `region`, `reportedIsUp` (boolean status), `status` (Pending, Disputed, ResolvedUp, ResolvedDown), and the challenger details (`challenger`, `challengerStake`, and community voting counters).

---


## 🚀 Getting Started

### 1. Smart Contract Setup & Testing

Navigate into the `contracts` folder:
```bash
cd contracts
```

#### Install Dependencies
Foundry dependencies are bundled in `lib/`. If you need to re-initialize or update them:
```bash
forge install
```

#### Compile the Contracts
```bash
forge build
```

#### Run the Test Suite
Oracle features a comprehensive unit test suite executing a complete dispute, voting, and slashing loop. Run the tests with:
```bash
forge test -vv
```

#### Local Deployment Script
To deploy the contract on a local or remote EVM chain, set your deployment key and RPC URL:
```bash
forge script script/DeployUptime.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

---

### 2. Frontend Setup

Navigate into the `frontend` folder:
```bash
cd ../frontend
```

#### Install Node Packages
```bash
npm install
```

#### Contract Configuration
Update the contract deployment address in `frontend/src/config/contract.ts` to link the frontend to your newly deployed address:
```typescript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
```

#### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to explore Oracle.


## Contributing
This project was built during monad blitz pune hackathon
---


