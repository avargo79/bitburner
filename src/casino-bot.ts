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

export default class CasinoBot {
  private ns: NS;
  private config: CasinoConfig;
  private stats: CasinoStats;

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
      // Step 1: Navigate to casino (skip if already there)
      await this.navigateToCasino();

      // Step 2: Save game
      await this.saveGame();

      // Step 3: Fast casino loop
      await this.casinoLoop();

    } catch (error) {
      this.ns.tprint(`❌ Error: ${error}`);
      if (this.config.debugMode) this.debug(`Full error: ${error}`);
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
    this.ns.print(`[CasinoBot] ${message}`);
  }

  private debug(message: string): void {
    if (this.config.debugMode) {
      this.ns.tprint(`[CasinoBot DEBUG] ${message}`);
    }
  }

  private async checkForStolenFocus(): Promise<void> {
    if (this.config.debugMode) this.debug("🔍 Checking for stolen focus and popups...");

    const doc = getDocumentAPI();

    // Quick popup check - only do full search if we suspect there's a popup
    let offlinePopup = doc.evaluate(
      "//div[contains(text(), 'Offline for')]",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    // Only do expensive DOM search if we need to
    if (!offlinePopup) {
      const elements = doc.querySelectorAll("div, p");
      for (const element of elements) {
        const text = element.textContent || "";
        if (text.includes("Offline for")) {
          offlinePopup = element;
          break;
        }
      }
    }

    if (offlinePopup) {
      // Fast backdrop click
      const backdrop = doc.querySelector(".MuiBackdrop-root.MuiModal-backdrop");
      if (backdrop) {
        await this.clickElement(backdrop as HTMLElement);
        await this.ns.sleep(100); // Ultra-fast delay
      }
    }

    // Quick focus check
    const unfocusButton = doc.evaluate(
      "//button[text()='Do something else simultaneously']",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLButtonElement;

    if (unfocusButton) {
      await this.clickElement(unfocusButton);
      await this.ns.sleep(100); // Ultra-fast delay
    }
  }

  private async navigateToCasino(): Promise<void> {
    this.log("🚗 Navigating to casino...");

    const win = getWindowAPI();
    const doc = getDocumentAPI();

    // Check if already in Aevum
    if (this.ns.getPlayer().city !== "Aevum") {
      this.log("Traveling to Aevum...");
      this.ns.tprint("❌ Please travel to Aevum manually and run again");
      throw new Error("Not in Aevum - need manual travel");
    }

    this.log("✅ Already in Aevum, navigating to casino...");

    // Click City button
    const cityButton = doc.evaluate(
      "//div[(@role = 'button') and (contains(., 'City'))]",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLElement;

    if (!cityButton) {
      throw new Error("Could not find City button");
    }

    this.log("🏙️ Clicking City button...");
    await this.clickElement(cityButton);
    await this.ns.sleep(100); // Ultra-fast delay

    // Click Casino button
    const casinoButton = doc.evaluate(
      "//span[@aria-label = 'Iker Molina Casino']",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLElement;

    if (!casinoButton) {
      throw new Error("Could not find Casino button");
    }

    this.log("🎰 Clicking Casino button...");
    await this.clickElement(casinoButton);
    await this.ns.sleep(100); // Ultra-fast delay

    // Click Blackjack button
    const blackjackButton = doc.evaluate(
      "//button[contains(text(), 'blackjack')]",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLElement;

    if (!blackjackButton) {
      throw new Error("Could not find Blackjack button");
    }

    this.log("🃏 Clicking Blackjack button...");
    await this.clickElement(blackjackButton);
    await this.ns.sleep(200); // Ultra-fast delay

    this.log("✅ Successfully navigated to casino blackjack");
  }

  private async clickElement(element: HTMLElement): Promise<void> {
    // Try multiple methods to find and trigger React click handler

    // Method 1: Search through all element keys for React props
    const elementKeys = Object.keys(element);
    let onClick = null;

    for (const key of elementKeys) {
      const props = (element as any)[key];
      if (props && typeof props === 'object' && props.onClick) {
        onClick = props.onClick;
        this.debug(`Found click handler via key: ${key}`);
        break;
      }
    }

    // Method 2: Try common React fiber property names
    if (!onClick) {
      const reactProps = (element as any)._reactInternalFiber?.memoizedProps ||
        (element as any)._reactInternalInstance?.memoizedProps ||
        (element as any).__reactInternalInstance?.memoizedProps ||
        (element as any).__reactEventHandlers;

      if (reactProps?.onClick) {
        onClick = reactProps.onClick;
        this.debug("Found click handler via React fiber");
      }
    }

    // Method 3: Fallback to native click (may not work with React components)
    if (!onClick) {
      this.debug("No React handler found, trying native click...");
      try {
        element.click();
        return;
      } catch (error) {
        this.debug(`Native click failed: ${error}`);
      }
    }

    if (onClick) {
      try {
        await onClick({ isTrusted: true, target: element, currentTarget: element });
        this.debug("✅ Successfully clicked element");
      } catch (error) {
        this.debug(`Click handler error: ${error}`);
        // Fallback to native click
        element.click();
      }
    } else {
      throw new Error("Could not find any click handler for element");
    }
  }

  private async saveGame(): Promise<void> {
    this.log("💾 Saving game...");

    const doc = getDocumentAPI();

    // Find save button using XPath
    const saveButton = doc.evaluate(
      "//button[@aria-label = 'save game']",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLButtonElement;

    if (!saveButton) {
      throw new Error("Could not find save button");
    }

    // Click the save button
    const onClick = (saveButton as any)[Object.keys(saveButton)[1]]?.onClick;
    if (onClick) {
      await onClick({ isTrusted: true });
      await this.ns.sleep(100); // Ultra-fast delay
    } else {
      throw new Error("Could not find save button click handler");
    }
  }

  private async casinoLoop(): Promise<void> {
    this.log("🎰 Starting real casino automation loop...");

    const doc = getDocumentAPI();
    let handsPlayed = 0;
    let netWinnings = 0;
    let peakWinnings = 0;

    // Find the bet input and start button once
    const betInput = doc.evaluate(
      "//input[@type='number']",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLInputElement;

    const startButton = doc.evaluate(
      "//button[text() = 'Start']",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLButtonElement;

    if (!betInput || !startButton) {
      throw new Error("Could not find bet input or start button");
    }

    while (handsPlayed < 1000) { // High limit - will stop when kicked out
      try {
        this.log(`🃏 Playing hand ${handsPlayed + 1}...`);

        // Calculate bet amount like original: 90% of money, max $100M
        const currentMoney = this.getCurrentMoney();
        const bet = Math.min(100000000, Math.floor(currentMoney * 0.9)); // 90% of money, max 100M

        if (bet < 1000) {
          this.log("❌ Not enough money to continue betting");
          break;
        }

        this.log(`💰 Betting $${bet.toLocaleString()}`);

        // Set bet amount - ultra-fast mode (no delay)
        await this.setInputValue(betInput, bet.toString());

        // Set up observer for game start
        const gameStarted = this.waitForGameStart();

        // Start the game
        await this.clickElement(startButton);

        // Wait for game to actually start (DOM change)
        await gameStarted;

        // Play the hand
        const result = await this.playBlackjackHand();

        if (result === "win") {
          netWinnings += bet;
          if (netWinnings > peakWinnings) {
            peakWinnings = netWinnings;
            await this.saveGame();
          }
          this.stats.wins++;
        } else if (result === "lose") {
          this.stats.losses++;
          this.stats.totalReloads++;
          await this.reloadPage();
          return;
        } else if (result === "tie") {
          this.stats.pushes++;
        } else if (result === "kicked_out") {
          this.ns.tprint("🎉 SUCCESS: Kicked out!");
          return;
        }

        handsPlayed++;
        this.stats.handsPlayed++;

        // Ultra-fast mode: no delay between hands

      } catch (error) {
        this.log(`❌ Error in hand ${handsPlayed + 1}: ${error}`);

        // Check if we got kicked out
        if (await this.checkKickedOut()) {
          this.log("🚪 Detected kicked out message!");
          this.ns.tprint("🎉 SUCCESS: Made enough money and got kicked out!");
          return;
        }

        // Otherwise, reload and try again
        this.log("🔄 Reloading due to error...");
        await this.reloadPage();
        return;
      }
    }

    this.log(`🏁 Casino session complete: ${this.stats.wins}W ${this.stats.losses}L ${this.stats.pushes}P`);
    this.log(`💰 Net winnings: $${netWinnings.toLocaleString()}`);
  }

  private async setInputValue(input: HTMLInputElement, value: string): Promise<void> {
    const onChange = (input as any)[Object.keys(input)[1]]?.onChange;
    if (onChange) {
      await onChange({ isTrusted: true, target: { value: value } });
    } else {
      throw new Error("Could not find input onChange handler");
    }
  }

  private waitForGameStart(): Promise<void> {
    return new Promise((resolve) => {
      const doc = getDocumentAPI();

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // Look for Hit/Stay buttons appearing or count display (only in casino area)
          if (mutation.type === 'childList') {
            const hitButton = doc.evaluate("//button[text() = 'Hit']", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const countElement = doc.evaluate("//p[contains(text(), 'Count:')]", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (hitButton || countElement) {
              observer.disconnect();
              resolve();
              return;
            }
          }
        }
      });

      // Focus only on the casino content area, not the entire page
      const casinoContainer = doc.querySelector("main") || doc.querySelector("[role='main']") || doc.body;
      observer.observe(casinoContainer, {
        childList: true,
        subtree: true
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 3000);
    });
  }

  private async playBlackjackHand(): Promise<"win" | "lose" | "tie" | "kicked_out"> {
    const doc = getDocumentAPI();

    // Fast initial check
    await this.ns.sleep(200);

    // Check if game ended immediately (blackjack)
    let result = await this.checkGameResult();
    if (result !== null) return result;

    // Event-driven gameplay using MutationObserver
    while (true) {
      const hitButton = doc.evaluate("//button[text() = 'Hit']", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLButtonElement;
      const stayButton = doc.evaluate("//button[text() = 'Stay']", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLButtonElement;

      if (!hitButton || !stayButton) {
        result = await this.checkGameResult();
        if (result !== null) return result;
        throw new Error("No buttons and no result");
      }

      // Make decision
      const shouldHit = await this.shouldHitBasicStrategy();

      // Set up observer BEFORE clicking to catch the change
      const gameStateChanged = this.waitForGameBoardChange();

      // Make the move
      if (shouldHit) {
        await this.clickElement(hitButton);
      } else {
        await this.clickElement(stayButton);
      }

      // Wait for DOM to change (much faster than arbitrary delay)
      await gameStateChanged;

      // Check result immediately after change
      result = await this.checkGameResult();
      if (result !== null) return result;
    }
  }

  private waitForGameBoardChange(): Promise<void> {
    return new Promise((resolve) => {
      const doc = getDocumentAPI();

      // Find the specific blackjack game container (not overview/job panels)
      let gameContainer = doc.querySelector("div[class*='css-fq5ump']") || // Blackjack specific container
        doc.querySelector("main") ||                    // Main content area
        doc.querySelector("[role='main']");             // Fallback to main role

      if (!gameContainer) {
        // Ultra fallback - but exclude overview areas
        const allDivs = doc.querySelectorAll("div");
        for (const div of allDivs) {
          const text = div.textContent || "";
          if (text.includes("blackjack") || text.includes("Count:") || text.includes("Hit")) {
            gameContainer = div.closest("div[class*='MuiBox']") || div.parentElement || div;
            break;
          }
        }
      }

      if (!gameContainer) gameContainer = doc.body;

      const observer = new MutationObserver((mutations) => {
        // Look for changes specifically related to blackjack game state
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Check if the change is related to game content
            const target = mutation.target as Element;
            const text = target.textContent || "";

            // Only trigger on casino/blackjack related changes
            if (text.includes('Count:') ||
              text.includes('Hit') ||
              text.includes('Stay') ||
              text.includes('won') ||
              text.includes('lost') ||
              text.includes('Tie')) {
              observer.disconnect();
              resolve();
              return;
            }
          }

          // Watch for count text changes
          if (mutation.type === 'characterData') {
            const text = mutation.target.textContent || "";
            if (text.includes('Count:')) {
              observer.disconnect();
              resolve();
              return;
            }
          }
        }
      });

      observer.observe(gameContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 2000);
    });
  }

  private async shouldHitBasicStrategy(): Promise<boolean> {
    const doc = getDocumentAPI();

    // Find player count
    const countElement = doc.evaluate(
      "//p[contains(text(), 'Count:')]",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as HTMLElement;

    if (!countElement) {
      throw new Error("Could not find player count");
    }

    const countText = countElement.textContent || "";
    const counts = countText.match(/\d+/g);
    if (!counts) {
      throw new Error("Could not parse player count");
    }

    // Use the highest count (in case of ace)
    const playerCount = Math.max(...counts.map(Number));

    // Basic strategy: Hit on 16 or less, stay on 17 or more
    const shouldHit = playerCount < 17;
    if (this.config.debugMode) this.debug(`Count: ${playerCount}, ${shouldHit ? 'hit' : 'stay'}`);

    return shouldHit;
  }

  private async checkGameResult(): Promise<"win" | "lose" | "tie" | "kicked_out" | null> {
    const doc = getDocumentAPI();

    // Check for kicked out message first
    if (await this.checkKickedOut()) {
      return "kicked_out";
    }

    // Check for win
    if (doc.evaluate("//p/text()[contains(.,'won') or contains(.,'Won')]", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
      return "win";
    }

    // Check for loss
    if (doc.evaluate("//p[contains(text(), 'lost')]", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
      return "lose";
    }

    // Check for tie
    if (doc.evaluate("//p[contains(text(), 'Tie')]", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
      return "tie";
    }

    return null; // Game still in progress
  }

  private async checkKickedOut(): Promise<boolean> {
    const doc = getDocumentAPI();

    const kickedOutElement = doc.evaluate(
      "//span[contains(text(), 'Alright cheater get out of here')]",
      doc,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    return kickedOutElement !== null;
  }

  private async reloadPage(): Promise<void> {
    this.log("🔄 Reloading page for save scumming...");

    // Use eval pattern like original casino.js
    const win = (globalThis as any).eval("window");
    const location = (globalThis as any).eval("location");

    // Disable beforeunload warning
    win.onbeforeunload = null;

    // Give brief time to see logs before reload
    await this.ns.sleep(500); // Ultra-fast delay

    // Force page reload using direct location access (exactly like original)
    location.reload();

    // CRITICAL: Script MUST end here - DO NOT continue execution
    // Bitburner will auto-restart from save state after reload
  }
}

// MAIN SCRIPT - All-in-one ultra-fast casino automation
export async function main(ns: NS): Promise<void> {
  const debugMode = ns.args.includes('debug');

  // Auto-tail on every startup (including after reloads)
  ns.ui.openTail();

  // Main loop with ultra-fast restarts
  while (true) {
    try {
      const bot = new CasinoBot(ns, {
        debugMode
      });
      await bot.run();
      break; // Exit if bot completes successfully (kicked out)
    } catch (error) {
      ns.print(`❌ Error: ${error}`);
      if (debugMode) ns.tprint(`❌ Bot error: ${error}`);
      await ns.sleep(debugMode ? 3000 : 1000); // Faster restart in ultra-fast mode
    }
  }
}