import { NS, BladeburnerActionName, BladeburnerActionType, BladeburnerSkillName, CityName } from '../NetscriptDefinitions';

/**
 * Bladeburner Automation Script
 * 
 * Autonomous management of Bladeburner division operations including:
 * - Intelligent action selection based on ROI and success rates
 * - Automatic skill upgrades prioritizing high-value skills
 * - Stamina and health management with automatic healing
 * - Multi-city chaos management with automatic city switching
 * - Team assignment for Operations and Black Ops
 * - Bonus time optimization for faster progression
 * - Black Ops progression with safety requirements
 * - Training management until stats reach thresholds
 * 
 * Key Parameters:
 * - Chaos threshold: 50 (triggers city switch or diplomacy)
 * - City switch threshold: 20 chaos improvement required
 * - Stamina threshold: 80% (triggers healing; configurable in code)
 * - Health threshold: 50% (triggers healing)
 * - Training threshold: 100 (minimum stat level)
 * - Success rate min: 70% (operations/contracts), 99% (Black Ops)
 * - Skill caps: Overclock 90, Tracer 15, Cyber's Edge 50
 */

// ===== TYPE DEFINITIONS =====

type BladeburnerAction = {
  type: BladeburnerActionType;
  name: BladeburnerActionName;
  repGainRate: number;
  remainingCount: number;
  meanSuccessChance: number;
  minSuccessChance: number;
  maxSuccessChance: number;
  time: number;
  level: number;
  repGain: number;
};

// ===== MAIN ENTRY POINT =====

/**
 * Main entry point for Bladeburner automation
 * Attempts to join Bladeburner division and runs continuous management loop
 */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("sleep");

  if (ns.bladeburner.joinBladeburnerDivision()) {
    ns.singularity.stopAction();

    // Continuous management loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const sleepTime = manageBladeburner(ns);
      await ns.sleep(sleepTime);
    }
  } else {
    ns.print("Not in the bladeburner division - nothing to do");
  }
}

// ===== CORE MANAGEMENT FUNCTIONS =====

/**
 * Assigns team members to Operations and Black Ops to boost success rates
 * Uses all available team members for high-risk operations
 */
function assignTeam(ns: NS, action: BladeburnerAction): void {
  // Only Operations and Black Ops benefit from teams
  if (action.type !== "Operations" && action.type !== "Black Operations") {
    return;
  }

  const teamSize = ns.bladeburner.getTeamSize(action.type, action.name);
  const availableMembers = teamSize; // Get current team size for this action

  // Assign all available team members to boost success rate
  if (availableMembers > 0) {
    ns.bladeburner.setTeamSize(action.type, action.name, availableMembers);
    ns.print(`Assigned ${availableMembers} team members to ${action.name}`);
  }
}

/**
 * Main management function that coordinates action selection and skill upgrades
 * Returns the recommended sleep time before next check
 */
function manageBladeburner(ns: NS): number {
  const action = selectAction(ns);
  const preferOverclock = action.type === "Operations" && action.meanSuccessChance > 0.8;
  upgradeSkills(ns, preferOverclock);

  const currentAction = ns.bladeburner.getCurrentAction();
  const switched = !currentAction || currentAction.name !== action.name;

  if (switched) {
    ns.print("Best action is " + action.name + " - switching to that from former action " + (currentAction?.name ?? "none"));

    // Assign team for Operations and Black Ops before starting
    assignTeam(ns, action);

    ns.bladeburner.startAction(action.type, action.name);
  }

  // Get the actual action time for the current/new action
  const actionTime = ns.bladeburner.getActionTime(action.type, action.name);

  // For General actions (Training, Field Analysis, Recruitment, etc.) and healing,
  // wait for the action to complete. Leave a small buffer for responsiveness.
  if (action.type === "General") {
    return Math.max(actionTime - 500, 1000);
  }

  // For combat operations (Contracts, Operations, Black Ops), check more frequently
  // to allow for quick switches when conditions change
  return 5000;
}

/**
 * Upgrades Bladeburner skills when skill points are available
 * Prioritizes cheapest skills with optional Overclock bias during high-success operations
 */
function upgradeSkills(ns: NS, preferOverclock: boolean): void {
  const skills = listInterestingSkills();

  const maxedOverclock = (ns.bladeburner.getSkillLevel("Overclock") >= 90);
  const maxedTracer = (ns.bladeburner.getSkillLevel("Tracer") > 15);
  const maxedCybersEdge = (ns.bladeburner.getSkillLevel("Cyber's Edge") >= 50);

  const cheapestSkills = skills
    .filter(s => s !== "Overclock" || !maxedOverclock)
    .filter(s => s !== "Tracer" || !maxedTracer) // Tracer more than 15 provides diminishing returns
    .filter(s => s !== "Cyber's Edge" || !maxedCybersEdge) // Cap stamina at reasonable level
    .sort((a, b) => ns.bladeburner.getSkillUpgradeCost(a) - ns.bladeburner.getSkillUpgradeCost(b));

  const overclockBias = (preferOverclock && !maxedOverclock) ? 3 : 1;

  for (const skill of cheapestSkills) {
    const skillCost = ns.bladeburner.getSkillUpgradeCost(skill) * (skill === "Overclock" ? 1 : overclockBias);
    if (skillCost <= ns.bladeburner.getSkillPoints()) {
      ns.toast("Upgrading " + skill);
      ns.print("Upgrading " + skill + " - it is the cheapest of the interesting skills (including Overclock bias)");
      ns.bladeburner.upgradeSkill(skill);
    }
  }
}

/**
 * Returns the list of high-priority skills worth upgrading, ordered by tier
 * Tier 1: Cheap high-value skills (1-2 points)
 * Tier 2: Core skills (broad impact)
 * Tier 3: Support skills (good value)
 * Tier 4: Situational skills (narrow but useful)
 */
function listInterestingSkills(): `${BladeburnerSkillName}`[] {
  return [
    // TIER 1: Cheap + high value (prioritize first!)
    "Cyber's Edge",      // +2% max stamina (1 point) - more uptime!
    "Hyperdrive",        // +10% XP gain (1 point) - faster progression!

    // TIER 2: Core skills (broad impact)
    "Overclock",         // -1% action time (cap at 90)
    "Blade's Intuition", // +3% all success
    "Digital Observer",  // +4% ops/blackops success

    // TIER 3: Support skills (good value)
    "Reaper",            // +2% combat stats
    "Evasive System",    // +4% dex/agi
    "Cloak",             // +5.5% stealth success

    // TIER 4: Situational (narrow but useful)
    "Tracer"             // +4% contract success (cap at 15)
  ];
}

/**
 * Finds the best city to operate in based on chaos levels and population
 * Returns city name if switching is beneficial, null if current city is optimal
 */
function findBestCity(ns: NS): `${CityName}` | null {
  const cities: `${CityName}`[] = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
  const currentCity = ns.bladeburner.getCity();
  const currentChaos = ns.bladeburner.getCityChaos(currentCity);

  // Only consider switching if current chaos is above 30 (worth the effort)
  if (currentChaos < 30) {
    return null;
  }

  let bestCity: `${CityName}` = currentCity;
  let bestChaos = currentChaos;

  for (const city of cities) {
    if (city === currentCity) continue;

    const chaos = ns.bladeburner.getCityChaos(city);
    const population = ns.bladeburner.getCityEstimatedPopulation(city);

    // Require at least 20 chaos improvement and decent population
    if (chaos < bestChaos - 20 && population > 1e9) {
      bestCity = city;
      bestChaos = chaos;
    }
  }

  return bestCity !== currentCity ? bestCity : null;
}

/**
 * Selects the optimal Bladeburner action based on current state
 * Priority order:
 * 1. Training (if stats < 100)
 * 2. Healing (if stamina < 70% OR health < 50%)
 * 3. City switching (if another city has 20+ lower chaos)
 * 4. Diplomacy (if chaos > 50)
 * 5. Black Ops (if available with 99%+ success)
 * 6. Incite Violence (if all actions depleted)
 * 7. Field Analysis (if info gap exists)
 * 8. Best ROI action (highest rep gain rate, biased toward longer ops during bonus time)
 */
function selectAction(ns: NS): BladeburnerAction {
  // Check if we have bonus time (makes actions 5x faster)
  const bonusTime = ns.bladeburner.getBonusTime();
  const hasBonusTime = bonusTime > 5000; // More than 5 seconds of bonus time

  const currentChaos = ns.bladeburner.getCityChaos(ns.bladeburner.getCity());

  // Find action with highest rank gain
  const bestActions = evaluateActions(ns)
    .filter(a => a.remainingCount >= 1)
    .filter(a => (a.type !== "Black Operations" && a.meanSuccessChance >= 0.7) || (a.type === "Black Operations" && a.meanSuccessChance >= 0.99))
    .filter(a => a.name !== "Incite Violence") // Generates too much chaos
    .filter(a => a.name !== "Raid") // Generates too much chaos, kills too many people
    // Exclude healing from ROI selection if not needed
    .filter(a => {
      if (a.name === "Hyperbolic Regeneration Chamber") return isTired(ns);
      if (a.name === "Diplomacy" && currentChaos <= 0) return false;
      return true;
    })
    .map(a => {
      // During bonus time, prefer longer operations (more total rep per action)
      // Multiply total rep gain by 1.5x for operations that take >60s
      const bonusMultiplier = (hasBonusTime && a.time > 60000 && a.type === "Operations") ? 1.5 : 1;
      return { ...a, repGainRate: a.repGainRate * bonusMultiplier };
    })
    .sort((a, b) => a.repGainRate - b.repGainRate).reverse();

  const blackOpAction = bestActions.find(a => a.type === "Black Operations");
  const trainingAction = bestActions.find(a => a.name === "Training");
  const researchAction = bestActions.find(a => a.name === "Field Analysis");
  const recruitAction = bestActions.find(a => a.name === "Recruitment");
  const healAction = evaluateActions(ns).find(a => a.name === "Hyperbolic Regeneration Chamber");
  const diplomacyAction = bestActions.find(a => a.name === "Stealth Retirement Operation") ?? bestActions.find(a => a.name === "Diplomacy");
  const inciteAction = evaluateActions(ns).find(a => a.name === "Incite Violence");

  const isTooChaotic = currentChaos > 50;
  const lackingInfo = bestActions.length > 0 && (bestActions[0].maxSuccessChance - bestActions[0].minSuccessChance) > 0.01;
  const usedUpActions = evaluateActions(ns).filter(a => a.remainingCount < 1).map(a => a.name);
  const noActionsRemaining = usedUpActions.includes("Sting Operation" as BladeburnerActionName) &&
    usedUpActions.includes("Stealth Retirement Operation" as BladeburnerActionName) &&
    usedUpActions.includes("Investigation" as BladeburnerActionName) &&
    usedUpActions.includes("Assassination" as BladeburnerActionName);

  // Check if we should switch cities before diplomacy
  const betterCity = findBestCity(ns);
  if (betterCity) {
    ns.print(`Switching to ${betterCity} - chaos ${ns.bladeburner.getCityChaos(betterCity)} vs current ${currentChaos}`);
    ns.bladeburner.switchCity(betterCity);
    // Re-evaluate actions in the new city
    return selectAction(ns);
  }

  // Decision tree for action selection, with logging
  let action: BladeburnerAction | undefined;
  if (!isTrained(ns)) {
    ns.print("Selecting Training: combat stats below threshold");
    action = trainingAction;
  } else if (isTired(ns)) {
    ns.print("Selecting Healing: HP or stamina not full");
    action = healAction;
  } else if (isTooChaotic) {
    ns.print("Selecting Diplomacy: city chaos too high");
    action = diplomacyAction;
  } else if (blackOpAction) {
    ns.print("Selecting Black Op: available and safe");
    action = blackOpAction;
  } else if (noActionsRemaining) {
    ns.print("Selecting Incite Violence: no actions remaining");
    action = inciteAction;
  } else if (lackingInfo) {
    ns.print("Selecting Field Analysis: info gap exists");
    action = researchAction;
  } else if (bestActions.length > 0) {
    ns.print("Selecting Best ROI action: " + bestActions[0].name);
    action = bestActions[0];
  } else {
    ns.print("No valid ROI actions, applying fallback order (Training, Research, Recruit, only Rest if needed)");
    // Fallback preference: Train > Research > Recruit > (only rest if tired) > anything available
    if (trainingAction && (!isTrained(ns) || trainingAction.remainingCount > 0)) {
      action = trainingAction;
    } else if (researchAction) {
      action = researchAction;
    } else if (recruitAction) {
      action = recruitAction;
    } else if (healAction && isTired(ns)) {
      action = healAction; // Only rest if actually tired
    } else {
      // As absolute fallback, pick anything available that is NOT resting unless nothing else exists
      const actionsExcludingRest = bestActions.filter(a => a.name !== "Hyperbolic Regeneration Chamber");
      action = actionsExcludingRest[0] ?? bestActions[0] ?? (evaluateActions(ns).filter(a => a.name !== "Hyperbolic Regeneration Chamber")[0]) ?? (evaluateActions(ns)[0] as BladeburnerAction);
    }
  }

  // Safety check: ensure action exists
  if (!action) {
    throw new Error("No valid action found - this should never happen");
  }

  return action;
}

/**
 * Checks if player needs healing based on stamina and health levels
 * Returns true if current stamina is below the rest threshold (default 80% of max) OR health is not full
 */
// Only heal if stamina is below threshold or HP is not full
const STAMINA_REST_THRESHOLD = 0.8; // Rest if stamina is below 80% of max (adjustable)
function isTired(ns: NS): boolean {
  const [currentStamina, maxStamina] = ns.bladeburner.getStamina();
  const player = ns.getPlayer();
  // Only heal if stamina is below threshold (configurable) or HP is not full
  const needsStamina = currentStamina < STAMINA_REST_THRESHOLD * maxStamina;
  const needsHealth = player.hp.current < player.hp.max;
  return needsStamina || needsHealth;
}

/**
 * Checks if player has completed basic training
 * Returns true if all combat stats (agility, defense, dexterity, strength) are >= 100
 */
function isTrained(ns: NS): boolean {
  const p = ns.getPlayer();
  const stats = [p.skills.agility, p.skills.defense, p.skills.dexterity, p.skills.strength];
  return Math.min(...stats) >= 100;
}

/**
 * Evaluates all available Bladeburner actions and returns their statistics
 * Includes general actions, contracts, operations, and next available Black Op
 */
function evaluateActions(ns: NS): BladeburnerAction[] {
  const general = ns.bladeburner.getGeneralActionNames().map((c: `${BladeburnerActionName}`) => getActionStats(ns, "General", c));
  const contracts = ns.bladeburner.getContractNames().map((c: `${BladeburnerActionName}`) => getActionStats(ns, "Contracts", c));
  const operations = ns.bladeburner.getOperationNames().map((o: `${BladeburnerActionName}`) => getActionStats(ns, "Operations", o));
  const nextBlackOp = ns.bladeburner.getNextBlackOp();
  const blackOp = nextBlackOp && nextBlackOp.rank <= ns.bladeburner.getRank() ? [getActionStats(ns, "Black Operations", nextBlackOp.name)] : [];
  return [...general, ...contracts, ...operations, ...blackOp];
}

/**
 * Gets detailed statistics for a specific Bladeburner action
 * Calculates reputation gain rate (rep per second × success chance)
 */
function getActionStats(ns: NS, type: `${BladeburnerActionType}`, name: `${BladeburnerActionName}`): BladeburnerAction {
  const remainingCount = Math.floor(ns.bladeburner.getActionCountRemaining(type, name));
  const [minSuccessChance, maxSuccessChance] = ns.bladeburner.getActionEstimatedSuccessChance(type, name);
  const meanSuccessChance = (minSuccessChance + maxSuccessChance) / 2;
  const time = ns.bladeburner.getActionTime(type, name);
  const level = (type === "General" || type === "Black Operations") ? 0 : ns.bladeburner.getActionCurrentLevel(type, name); // Cannot get the level for non-levellable actions
  const repGain = ns.bladeburner.getActionRepGain(type, name, level);

  const repGainRate = (repGain / (time / 1000)) * meanSuccessChance;

  return {
    type: (type as BladeburnerActionType),
    name: (name as BladeburnerActionName),
    repGainRate,
    remainingCount,
    meanSuccessChance,
    minSuccessChance,
    maxSuccessChance,
    time,
    level,
    repGain
  };
}
