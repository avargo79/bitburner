import { NS } from '@ns';

// Browser API stealth access pattern - bypasses 25GB RAM penalty
function getWindowAPI(): Window {
  return (globalThis as any)['win' + 'dow'];
}

function getDocumentAPI(): Document {
  return (globalThis as any)['doc' + 'ument'];
}

interface CasinoConfig {
  debugMode?: boolean;
}

interface CasinoStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  netProfit: number;
  totalReloads: number;
  startTime: number;
}

// Cached DOM elements to avoid repeated searches
interface CachedElements {
  saveButton: HTMLButtonElement | null;
  betInput: HTMLInputElement | null;
  startButton: HTMLButtonElement | null;
}

export default class CasinoBotV2 {
  private ns: NS;
  private config: CasinoConfig;
  private stats: CasinoStats;
  private cached: CachedElements;

  constructor(ns: NS, config: CasinoConfig = {}) {
    this.ns = ns;
    this.config = {
      debugMode: false,
      ...config
    };
    this.stats = {
      handsPlayed: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      netProfit: 0,
      totalReloads: 0,
      startTime: Date.now()
    };
    this.cached = {
      saveButton: null,
      betInput: null,
      startButton: null
    };
  }

  async run(): Promise<void> {
    // CRITICAL: Check for stolen focus first (after page reload)
    await this.checkForStolenFocus();

    // Quick money detection
    const currentMoney = this.getCurrentMoney();

    if (currentMoney < 1000) {
      this.ns.tprint("❌ Need at least $1000");
      return;
    }

    try {
      // Step 0: Preemptive check for kicked out (like Alain does)
      if (await this.checkKickedOutFast()) {
        this.ns.tprint("🎉 We've already been kicked out of the casino!");
        await this.purchaseTorAndPrograms();
        return;
      }

      // Step 1: Navigate to casino (skip if already there)
      await this.navigateToCasino();

      // Step 2: Cache all DOM elements once for speed
      await this.cacheElements();

      // Step 3: Save game
      await this.saveGame();

      // Step 4: Ultra-fast casino loop
      await this.casinoLoop();

      // Step 5: After successful completion (kicked out), purchase TOR and programs
      await this.purchaseTorAndPrograms();

    } catch (error) {
      this.ns.tprint(`❌ Error: ${error}`);
      if (this.config.debugMode) this.debug(`Full error: ${error}`);
    }
  }

  private async purchaseTorAndPrograms(): Promise<void> {
    this.ns.tprint("");
    this.ns.tprint("═══════════════════════════════════════════════");
    this.ns.tprint("  Post-Casino: Purchasing TOR & Programs");
    this.ns.tprint("═══════════════════════════════════════════════");

    try {
      // Purchase TOR router if not already owned
      if (!this.ns.hasTorRouter()) {
        const torCost = 200000; // TOR router costs $200k
        const currentMoney = this.getCurrentMoney();

        if (currentMoney >= torCost) {
          const purchased = this.ns.singularity.purchaseTor();
          if (purchased) {
            this.ns.tprint("✓ Purchased TOR router ($200k)");
          } else {
            this.ns.tprint("⚠ Failed to purchase TOR router");
            return;
          }
        } else {
          this.ns.tprint(`⚠ Not enough money for TOR router (need $${torCost.toLocaleString()})`);
          return;
        }
      } else {
        this.ns.tprint("✓ TOR router already owned");
      }

      // List of all darkweb programs in order of usefulness
      const programs = [
        { name: "BruteSSH.exe", cost: 500000 },
        { name: "FTPCrack.exe", cost: 1500000 },
        { name: "relaySMTP.exe", cost: 5000000 },
        { name: "HTTPWorm.exe", cost: 30000000 },
        { name: "SQLInject.exe", cost: 250000000 },
        { name: "DeepscanV1.exe", cost: 500000 },
        { name: "DeepscanV2.exe", cost: 25000000 },
        { name: "ServerProfiler.exe", cost: 500000 },
        { name: "AutoLink.exe", cost: 1000000 },
        { name: "Formulas.exe", cost: 5000000000 },
      ];

      let totalSpent = 0;
      let programsPurchased = 0;

      for (const program of programs) {
        // Check if already owned
        if (this.ns.fileExists(program.name, "home")) {
          this.ns.tprint(`  ✓ ${program.name} - already owned`);
          continue;
        }

        // Check if we have enough money
        const currentMoney = this.getCurrentMoney();
        if (currentMoney >= program.cost) {
          const purchased = this.ns.singularity.purchaseProgram(program.name);
          if (purchased) {
            totalSpent += program.cost;
            programsPurchased++;
            this.ns.tprint(`  ✓ Purchased ${program.name} ($${(program.cost / 1e6).toFixed(1)}m)`);
          } else {
            this.ns.tprint(`  ⚠ Failed to purchase ${program.name}`);
          }
        } else {
          this.ns.tprint(`  ⏭ Skipping ${program.name} ($${(program.cost / 1e6).toFixed(1)}m) - insufficient funds`);
        }
      }

      this.ns.tprint("");
      this.ns.tprint(`Summary: Purchased ${programsPurchased} programs for $${(totalSpent / 1e6).toFixed(1)}m`);
      this.ns.tprint("═══════════════════════════════════════════════");

    } catch (error) {
      this.ns.tprint(`❌ Error purchasing TOR/programs: ${error}`);
    }
  }

  private getCurrentMoney(): number {
    // Use cheaper RAM API - getServerMoneyAvailable costs 0.1GB vs getPlayer().money 0.5GB
    try {
      const playerMoney = this.ns.getServerMoneyAvailable("home");
      this.debug(`Home server money: $${playerMoney.toLocaleString()}`);
      return Math.floor(playerMoney);
    } catch (error) {
      this.debug(`Money detection failed: ${error}`);
      return 0;
    }
  }

  private log(message: string): void {
    this.ns.print(`[CasinoV2] ${message}`);
  }

  private debug(message: string): void {
    if (this.config.debugMode) {
      this.ns.tprint(`[CasinoV2 DEBUG] ${message}`);
    }
  }

  private async checkForStolenFocus(): Promise<void> {
    if (this.config.debugMode) this.debug("🔍 Checking for stolen focus and popups...");

    const doc = getDocumentAPI();

    // Ultra-fast popup check using simple XPath
    const offlinePopup = this.findElementFast("//div[contains(text(), 'Offline for')]");
    if (offlinePopup) {
      const backdrop = doc.querySelector(".MuiBackdrop-root.MuiModal-backdrop");
      if (backdrop) {
        await this.clickElementFast(backdrop as HTMLElement);
        await this.sleep(2); // Hardcoded 2ms - ultra fast clicks
      }
    }

    // Ultra-fast focus check
    const unfocusButton = this.findElementFast("//button[text()='Do something else simultaneously']") as HTMLButtonElement;
    if (unfocusButton) {
      await this.clickElementFast(unfocusButton);
      await this.sleep(2); // Hardcoded 2ms - ultra fast clicks
    }
  }

  private async navigateToCasino(): Promise<void> {
    this.log("🚗 Navigating to casino...");

    const doc = getDocumentAPI();

    // Check if already in Aevum
    if (this.ns.getPlayer().city !== "Aevum") {
      this.log("Traveling to Aevum...");
      this.ns.tprint("❌ Please travel to Aevum manually and run again");
      throw new Error("Not in Aevum - need manual travel");
    }

    this.log("✅ Already in Aevum, navigating to casino...");

    // Ultra-fast navigation with minimal delays
    const cityButton = this.findElementFast("//div[(@role = 'button') and (contains(., 'City'))]") as HTMLElement;
    if (!cityButton) throw new Error("Could not find City button");

    await this.clickElementFast(cityButton);
    await this.sleep(2); // Hardcoded 2ms - ultra fast clicks

    const casinoButton = this.findElementFast("//span[@aria-label = 'Iker Molina Casino']") as HTMLElement;
    if (!casinoButton) throw new Error("Could not find Casino button");

    await this.clickElementFast(casinoButton);
    await this.sleep(2); // Hardcoded 2ms - ultra fast clicks

    const blackjackButton = this.findElementFast("//button[contains(text(), 'blackjack')]") as HTMLElement;
    if (!blackjackButton) throw new Error("Could not find Blackjack button");

    await this.clickElementFast(blackjackButton);
    await this.sleep(2); // Hardcoded 2ms - ultra fast clicks

    this.log("✅ Successfully navigated to casino blackjack");
  }

  // Cache all frequently used elements once for speed
  private async cacheElements(): Promise<void> {
    this.log("🔧 Caching DOM elements for speed...");

    const doc = getDocumentAPI();

    // Cache save button
    this.cached.saveButton = this.findElementFast("//button[@aria-label = 'save game']") as HTMLButtonElement;
    if (!this.cached.saveButton) throw new Error("Could not find save button");

    // Cache bet input
    this.cached.betInput = this.findElementFast("//input[@type='number']") as HTMLInputElement;
    if (!this.cached.betInput) throw new Error("Could not find bet input");

    // Cache start button
    this.cached.startButton = this.findElementFast("//button[text() = 'Start']") as HTMLButtonElement;
    if (!this.cached.startButton) throw new Error("Could not find start button");

    this.log("✅ All elements cached successfully");
  }

  // Ultra-fast element finder with minimal retries (based on Alain's approach)
  private findElementFast(xpath: string, maxRetries: number = 5): Element | null {
    const doc = getDocumentAPI();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const element = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
      if (element) return element;

      // Only retry with minimal delay if not found
      if (attempt < maxRetries) {
        // Synchronous micro-delay (much faster than async sleep)
        const start = Date.now();
        while (Date.now() - start < (attempt * 2)) { /* busy wait */ }
      }
    }
    return null;
  }

  // Ultra-fast click using Alain's method
  private async clickElementFast(element: HTMLElement): Promise<void> {
    await this.sleep(2); // Hardcoded 2ms - before click

    // Find React click handler using Alain's voodoo method
    const fnOnClick = (element as any)[Object.keys(element)[1]]?.onClick;
    if (fnOnClick) {
      await fnOnClick({ isTrusted: true });
    } else {
      // Fallback to native click
      element.click();
    }

    await this.sleep(2); // Hardcoded 2ms - after click
  }

  private async saveGame(): Promise<void> {
    this.log("💾 Saving game...");

    if (!this.cached.saveButton) throw new Error("Save button not cached");

    await this.sleep(5); // Hardcoded 5ms - before save
    await this.clickElementFast(this.cached.saveButton);
    await this.sleep(5); // Hardcoded 5ms - after save
  }

  private async casinoLoop(): Promise<void> {
    this.log("🎰 Starting ultra-fast casino loop...");

    let handsPlayed = 0;
    let netWinnings = 0;
    let peakWinnings = 0;

    while (handsPlayed < 1000) {
      try {
        // Quick check at start of each hand for kicked out
        if (await this.checkKickedOutFast()) {
          this.log("🎉 Kicked out detected at start of hand!");
          this.ns.tprint("🎉 SUCCESS: Made enough money and got kicked out!");
          return;
        }

        this.log(`🃏 Playing hand ${handsPlayed + 1}...`);

        // Calculate bet amount like Alain: 90% of money, max $100M
        const currentMoney = this.getCurrentMoney();
        const bet = Math.min(100000000, Math.floor(currentMoney * 0.9));

        if (bet < 1000) {
          this.log("❌ Not enough money to continue betting");
          break;
        }

        this.log(`💰 Betting $${bet.toLocaleString()}`);

        // Ultra-fast bet setting using cached input
        await this.setInputValueFast(this.cached.betInput!, bet.toString());

        // Start the game using cached button
        await this.clickElementFast(this.cached.startButton!);

        // Play the hand with optimized detection
        const result = await this.playBlackjackHandFast();

        if (result === "win") {
          netWinnings += bet;
          if (netWinnings > peakWinnings) {
            peakWinnings = netWinnings;
            await this.saveGame();
          }
          this.stats.wins++;

          // Quick check after each win to see if we've been kicked out (like Alain)
          if (await this.checkKickedOutFast()) {
            this.log("🎉 Detected kicked out after win!");
            this.ns.tprint("🎉 SUCCESS: Made enough money and got kicked out!");
            return;
          }
        } else if (result === "lose") {
          netWinnings -= bet;
          this.stats.losses++;
          this.stats.totalReloads++;

          // Reload if losing badly (like Alain's logic)
          if (currentMoney < 1E8 || netWinnings <= peakWinnings - 10 * 1E8) {
            await this.reloadPageFast();
            return;
          }
        } else if (result === "tie") {
          this.stats.pushes++;
        } else if (result === "kicked_out") {
          this.ns.tprint("🎉 SUCCESS: Kicked out!");
          return;
        }

        handsPlayed++;
        this.stats.handsPlayed++;

        // NO DELAY between hands for maximum speed

      } catch (error) {
        this.log(`❌ Error in hand ${handsPlayed + 1}: ${error}`);

        // Check if we got kicked out
        if (await this.checkKickedOutFast()) {
          this.log("🚪 Detected kicked out message!");
          this.ns.tprint("🎉 SUCCESS: Made enough money and got kicked out!");
          return;
        }

        // Otherwise, reload and try again
        this.log("🔄 Reloading due to error...");
        await this.reloadPageFast();
        return;
      }
    }

    this.log(`🏁 Casino session complete: ${this.stats.wins}W ${this.stats.losses}L ${this.stats.pushes}P`);
    this.log(`💰 Net winnings: $${netWinnings.toLocaleString()}`);
  }

  private async setInputValueFast(input: HTMLInputElement, value: string): Promise<void> {
    const onChange = (input as any)[Object.keys(input)[1]]?.onChange;
    if (onChange) {
      await onChange({ isTrusted: true, target: { value: value } });
    } else {
      throw new Error("Could not find input onChange handler");
    }
  }

  // Ultra-fast blackjack hand using Alain's optimized approach
  private async playBlackjackHandFast(): Promise<"win" | "lose" | "tie" | "kicked_out"> {
    // Brief initial wait
    await this.sleep(50); // Much faster than our original 200ms

    // Check if game ended immediately (blackjack)
    let result = await this.getWinLoseOrTieFast();
    if (result !== null) return result;

    // Game loop with minimal delays
    while (true) {
      const hitButton = this.findElementFast("//button[text() = 'Hit']") as HTMLButtonElement;
      const stayButton = this.findElementFast("//button[text() = 'Stay']") as HTMLButtonElement;

      if (!hitButton || !stayButton) {
        result = await this.getWinLoseOrTieFast();
        if (result !== null) return result;
        throw new Error("No buttons and no result");
      }

      // Make decision using basic strategy
      const shouldHit = await this.shouldHitBasicStrategyFast();

      // Make the move
      if (shouldHit) {
        await this.clickElementFast(hitButton);
      } else {
        await this.clickElementFast(stayButton);
      }

      // Brief yield for game to update
      await this.sleep(1); // Minimal 1ms delay

      // Check result immediately
      result = await this.getWinLoseOrTieFast();
      if (result !== null) return result;
    }
  }

  // Alain's optimized game result detection with cycling retries
  private async getWinLoseOrTieFast(): Promise<"win" | "lose" | "tie" | "kicked_out" | null> {
    // Check for kicked out first
    if (await this.checkKickedOutFast()) {
      return "kicked_out";
    }

    // Cycle through each check with increasing retries (Alain's method)
    let retries = 0;
    while (retries++ < 5) {
      // Check if game is still in progress
      if (this.findElementFast("//button[text() = 'Hit']", retries)) {
        return null; // Game not over yet
      }

      // Check for lose
      if (this.findElementFast("//p[contains(text(), 'lost')]", retries)) {
        return "lose";
      }

      // Check for win (both "won" and "Won" like Alain)
      if (this.findElementFast("//p/text()[contains(.,'won') or contains(.,'Won')]", retries)) {
        return "win";
      }

      // Check for tie
      if (this.findElementFast("//p[contains(text(), 'Tie')]", retries)) {
        return "tie";
      }
    }
    return null;
  }

  private async shouldHitBasicStrategyFast(): Promise<boolean> {
    const countElement = this.findElementFast("//p[contains(text(), 'Count:')]") as HTMLElement;
    if (!countElement) throw new Error("Could not find player count");

    const countText = countElement.textContent || "";
    const counts = countText.match(/\d+/g);
    if (!counts) throw new Error("Could not parse player count");

    // Use the highest count (in case of ace)
    const playerCount = Math.max(...counts.map(Number));

    // Basic strategy: Hit on 16 or less, stay on 17 or more
    const shouldHit = playerCount < 17;
    if (this.config.debugMode) this.debug(`Count: ${playerCount}, ${shouldHit ? 'hit' : 'stay'}`);

    return shouldHit;
  }

  private async checkKickedOutFast(): Promise<boolean> {
    // Based on Alain's robust cheater detection with modal handling
    let retries = 0;
    while (retries++ < 5) { // Check up to 5 times

      // Primary check: Look for the cheater message (exact text from Alain)
      const kickedOutElement = this.findElementFast("//span[contains(text(), 'Alright cheater get out of here')]", 3);
      if (kickedOutElement) {
        this.log("🚪 Found cheater message - we've been kicked out!");
        return true;
      }

      // Alternative check: Look for any dialog or text mentioning being kicked out
      const altKickedOut = this.findElementFast("//*[contains(text(), 'kicked out') or contains(text(), 'cheater')]", 2);
      if (altKickedOut) {
        this.log("🚪 Found alternative kick out message!");
        return true;
      }

      // Check for modals that might be blocking the cheater message
      const closeModal = this.findElementFast("//button[contains(@class,'closeButton')]", 2);
      if (closeModal) {
        this.log("🔧 Found modal that needs to be closed");
        await this.clickElementFast(closeModal as HTMLElement);
        await this.sleep(10); // Small delay after closing modal
        continue; // Try again after closing the modal
      }

      break; // No more modals to close
    }

    return false;
  }

  private async reloadPageFast(): Promise<void> {
    this.log("🔄 Reloading page for save scumming...");

    // Use Alain's exact method
    const win = (globalThis as any).eval("window");
    const location = (globalThis as any).eval("location");

    // Disable beforeunload warning
    win.onbeforeunload = null;

    // Minimal delay before reload (5ms for ultra-fast page reload)
    await this.sleep(5);

    // Force page reload
    location.reload();
  }

  private async sleep(ms: number): Promise<void> {
    if (ms > 0) {
      await this.ns.sleep(ms);
    }
  }
}

// MAIN SCRIPT - Ultra-fast casino automation with maximum speed
export async function main(ns: NS): Promise<void> {
  ns.disableLog('ALL');
  const debugMode = ns.args.includes('debug');

  // Auto-tail on every startup
  ns.ui.openTail();

  // Main loop with ultra-fast restarts
  while (true) {
    try {
      const bot = new CasinoBotV2(ns, { debugMode });
      await bot.run();
      break; // Exit if bot completes successfully (kicked out)
    } catch (error) {
      ns.print(`❌ Error: ${error}`);
      if (debugMode) ns.tprint(`❌ Bot error: ${error}`);
      await ns.sleep(debugMode ? 1000 : 500); // Faster restart
    }
  }
}