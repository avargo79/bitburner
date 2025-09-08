# Bitburner Hacknet Optimization System

## 🎯 **Standalone ROI-Driven Hacknet Automation**

This module provides a fully automated, lightweight Hacknet node management system for Bitburner. It intelligently purchases and upgrades Hacknet nodes to maximize passive income using real-time return-on-investment (ROI) calculations, operating as a self-contained script with zero dependencies.

---

## 🚀 **Features**
- **🎯 ROI-Driven Intelligence**: Always invests in the most profitable upgrade or purchase
- **📈 Dynamic Scaling**: Adapts strategy as your net worth and node count grow
- **💰 Capital Coordination**: Reserves cash for stock trading and server purchases
- **📊 Real-Time Dashboard**: Live status display when tailed showing performance metrics
- **⚡ Ultra-Lightweight**: ~50KB standalone script with in-memory operation
- **🔧 CLI Control**: Debug flags and configuration via command-line arguments
- **🛡️ Singleton Protection**: Prevents multiple instances from conflicting

---

## 🔧 **Usage**

### **Start the Hacknet System:**
```bash
run hacknet.js              # Run with default settings (quiet mode)
run hacknet.js --debug      # Run with verbose debug output
run hacknet.js --help       # Show help information
tail hacknet.js             # View real-time status dashboard
```

### **Command-Line Options:**
- `--debug`: Enable verbose output showing all investment decisions and calculations
- `--help`: Display usage information and examples

### **Status Dashboard:**
Use `tail hacknet.js` to view a real-time status display featuring:
- **Investment Portfolio**: Total hacknet value, daily income, overall ROI
- **Node Performance**: Individual node stats with production rates
- **Investment Opportunities**: Best upgrades/purchases ranked by ROI
- **Capital Management**: Cash reserves and coordination with other systems
- **Recent Activity**: Latest purchases and upgrades with ROI tracking

### **Run Alongside Other Systems:**
```bash
run daemon.js   # Server management tasks
run stocks.js   # Stock trading system
run hacknet.js  # Hacknet optimization (completely independent)
run batcher.js  # Attack coordination (if available)
```

---

## 📊 **Data Management**

### **In-Memory Only (Ultra-Fast):**
- `nodes: Map<number, HacknetNodeMetrics>` - Real-time node performance data
- `investments: HacknetInvestment[]` - Ranked opportunities by ROI
- `history: HacknetHistoryEntry[]` - Recent transactions (last 100)
- `strategy: HacknetStrategy` - Current optimization settings

### **No Database Dependencies:**
- All data sourced directly from Bitburner Hacknet API
- No persistence layer - keeps everything in memory
- Existing nodes automatically detected on startup
- Zero external dependencies for maximum performance

---

## 🎛️ **Data Structures**

### **Hacknet Node Metrics**
```typescript
interface HacknetNodeMetrics {
  nodeId: number;
  level: number;
  ram: number;
  cores: number;
  production: number;          // $/second current rate
  totalProduction: number;     // Lifetime earnings estimate
  lastUpdate: number;
  upgradeCosts: {
    level: number;             // Cost to upgrade level
    ram: number;               // Cost to upgrade RAM
    cores: number;             // Cost to upgrade cores
  };
  upgradeROI: {
    level: number;             // Hours to break even on level upgrade
    ram: number;               // Hours to break even on RAM upgrade
    cores: number;             // Hours to break even on core upgrade
  };
  upgradeProduction: {
    level: number;             // Additional $/second from level upgrade
    ram: number;               // Additional $/second from RAM upgrade
    cores: number;             // Additional $/second from core upgrade
  };
  efficiency: number;          // Production per $ invested (for ranking)
}
```

### **Hacknet Investment Strategy**
```typescript
interface HacknetStrategy {
  strategy: string;
  enabled: boolean;
  
  // Investment Thresholds
  purchaseThresholds: {
    maxROIHours: number;        // 24 = buy if payback < 24 hours
    minCashReserve: number;     // Always keep this much cash
    maxTotalInvestment: number; // % of net worth in hacknet (0.30 = 30%)
    dynamicROI: boolean;        // Adjust ROI limits based on progression
  };
  
  // Upgrade Preferences (weighting factors)
  upgradePreferences: {
    levelWeight: number;        // 1.0 = normal priority
    ramWeight: number;          // 1.2 = 20% bonus to RAM upgrades  
    coreWeight: number;         // 0.8 = 20% penalty to core upgrades
  };
  
  // Capital Coordination
  coordination: {
    stockTradingReserve: number;     // Cash reserved for stocks.js
    serverPurchaseReserve: number;   // Cash reserved for servers
    dynamicReserves: boolean;        // Scale reserves with portfolio value
  };
  
  // Performance Tuning
  timing: {
    analysisInterval: number;    // Seconds between ROI calculations (default: 5)
    investmentInterval: number;  // Seconds between investment decisions (default: 3)
    maxInvestmentsPerCycle: number; // Limit rapid investments (default: 1)
  };
}
```

### **Hacknet Investment Opportunity**
```typescript
interface HacknetInvestment {
  type: 'purchase' | 'level' | 'ram' | 'cores';
  nodeId?: number;             // undefined for new node purchase
  cost: number;
  productionIncrease: number;  // Additional $/second
  roiHours: number;            // Hours to break even
  priority: number;            // Weighted score for ranking (higher = better)
  efficiency: number;          // Production increase per $ invested
}
```

### **Investment History**
```typescript
interface HacknetHistoryEntry {
  timestamp: number;
  type: 'purchase' | 'level' | 'ram' | 'cores';
  nodeId: number;
  cost: number;
  expectedROI: number;         // Hours predicted to break even
  reason: string;              // Why this investment was chosen
}
```

---

## ⚙️ **ROI Calculation Algorithms**

### **Core Formulas:**
- **Upgrade ROI**: `roiHours = upgradeCost / (productionIncrease * 3600)`
- **Purchase ROI**: `roiHours = purchaseCost / (newNodeProduction * 3600)`
- **Priority Score**: `priority = (productionIncrease / cost) * upgradeWeight * urgencyFactor`
- **Efficiency Rating**: `efficiency = totalProduction / totalInvestment`

### **Production Calculations:**
Uses Bitburner's hacknet formulas for accurate production estimation:
```typescript
// Base production formula (simplified)
production = level * Math.pow(1.035, ram - 1) * ((cores + 5) / 6);
```

### **Dynamic ROI Adjustment:**
- **Early game**: Lower ROI thresholds (6-12 hours) for rapid growth
- **Mid game**: Standard thresholds (12-24 hours) for steady income
- **Late game**: Higher thresholds (24-48 hours) for optimization only

---

## 📈 **Default Strategy Configuration**

```typescript
const defaultHacknetStrategy: HacknetStrategy = {
  strategy: 'balanced',
  enabled: true,
  
  purchaseThresholds: {
    maxROIHours: 24,           // Buy if payback < 24 hours
    minCashReserve: 100000,    // Always keep $100k liquid
    maxTotalInvestment: 0.25,  // Max 25% of net worth in hacknet
    dynamicROI: true           // Adjust based on game progression
  },
  
  upgradePreferences: {
    levelWeight: 1.0,          // Balanced priority
    ramWeight: 1.1,            // Slight preference for RAM (better scaling)
    coreWeight: 0.9            // Slight preference against cores (expensive)
  },
  
  coordination: {
    stockTradingReserve: 500000,     // Reserve for stock investments
    serverPurchaseReserve: 200000,   // Reserve for server purchases
    dynamicReserves: true            // Scale with portfolio growth
  },
  
  timing: {
    analysisInterval: 5,        // Update ROI calculations every 5 seconds
    investmentInterval: 3,      // Check for investments every 3 seconds
    maxInvestmentsPerCycle: 1   // One investment per cycle (avoid rapid spending)
  }
};
```

---

## 🏗️ **Architecture & Design**

### **Standalone Operation:**
- **Independent execution**: Runs alongside daemon, stocks.js, and other systems
- **Pure in-memory operation**: No database dependencies for ultra-fast performance
- **Game API integration**: Loads existing nodes directly from Bitburner
- **Memory-optimized**: History capped at 100 entries to prevent memory bloat

### **Capital Coordination:**
- **Smart reserves**: Dynamically calculates cash needed for other systems
- **Portfolio awareness**: Considers total net worth when making investment decisions
- **Cross-system compatibility**: Designed to work with stocks.js and other automation

### **Performance Optimization:**
- **Batched calculations**: Updates multiple nodes efficiently in single API calls
- **Smart timing**: Reduces calculation frequency during low-opportunity periods
- **ROI caching**: Avoids redundant calculations for unchanged nodes

---

## 💰 **Investment Decision Logic**

### **Decision Flow:**
1. **Scan all nodes**: Calculate upgrade costs and production increases
2. **Evaluate new purchase**: Determine cost and production of next node
3. **Rank opportunities**: Sort by ROI, apply strategy weights
4. **Check constraints**: Verify cash reserves and investment limits
5. **Execute best option**: Purchase or upgrade with highest priority
6. **Log and track**: Record decision for performance analysis

### **Constraint Checks:**
- **Cash reserves**: Ensure minimum cash for other systems
- **ROI thresholds**: Only invest if payback time is acceptable
- **Investment limits**: Respect maximum hacknet allocation percentage
- **Progression scaling**: Adjust thresholds based on current BitNode/progression

---

## 📊 **Performance Tracking**

### **Key Metrics:**
- **Total Investment**: Cumulative spending on all hacknet infrastructure
- **Daily Income**: Current 24-hour production rate across all nodes
- **Portfolio ROI**: Overall return on hacknet investment
- **Node Efficiency**: Production per dollar invested for each node
- **Investment Velocity**: Rate of capital deployment over time

### **Optimization Insights:**
- **Best Performers**: Nodes with highest efficiency ratings
- **Upgrade Timing**: Historical ROI accuracy vs. predictions
- **Capital Allocation**: Hacknet vs. stock trading vs. server investment returns

---

## 🎯 **Benefits & Expected Returns**

### **Early Game (0-10 nodes):**
- **6-12 hour ROI**: Rapid payback on initial investments
- **Exponential growth**: Each node funds the next more quickly
- **Passive foundation**: Steady income for other automation systems

### **Mid Game (10-50 nodes):**
- **12-24 hour ROI**: Steady expansion with good returns
- **Strategic upgrades**: Focus on most efficient nodes
- **Capital coordination**: Balance with stock trading opportunities

### **Late Game (50+ nodes):**
- **24-48 hour ROI**: Optimization-focused, slower but steady
- **Hash preparation**: Foundation for hash spending in advanced BitNodes
- **Portfolio balance**: Maintain optimal allocation across all systems

---

## 🔗 **Integration & Compatibility**

### **System Coordination:**
- **stocks.js**: Reserves cash for stock trading opportunities
- **daemon.js**: Operates independently of task-based systems
- **batcher.js**: Provides passive income for server purchases
- **Future systems**: Designed for easy integration with server optimization

### **BitNode Compatibility:**
- **Early BitNodes**: Focus on pure income optimization
- **Advanced BitNodes**: Prepare for hash spending automation
- **All progressions**: Adaptive strategy based on available features

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Engine**
- ✅ ROI calculation algorithms
- ✅ Investment decision logic
- ✅ Basic CLI interface

### **Phase 2: Optimization**
- ✅ Real-time status display
- ✅ Capital coordination with stocks.js
- ✅ Performance tracking and metrics

### **Phase 3: Advanced Features**
- 🔄 Hash spending optimization (future BitNodes)
- 🔄 Multi-strategy support (aggressive, conservative, balanced)
- 🔄 Advanced analytics and performance prediction

---

## 📚 **Development Notes**

### **File Size Target:**
- **~50KB compiled**: Similar to stocks.js efficiency
- **Zero dependencies**: Completely self-contained
- **Fast startup**: No schema loading or data migration

### **Testing Strategy:**
- **ROI accuracy**: Verify calculations match Bitburner formulas
- **Capital safety**: Ensure reserves are always maintained
- **Performance**: Monitor memory usage and calculation speed

### **Future Enhancements:**
- **Hash automation**: Automatic hash spending for various bonuses
- **Multi-BitNode strategies**: Adaptive approaches for different challenges
- **Advanced coordination**: Integration with server purchase optimization

---

The Hacknet Optimization System provides a solid foundation of passive income that scales throughout your Bitburner progression, using intelligent ROI-driven decisions to maximize returns while coordinating seamlessly with your other automation systems.