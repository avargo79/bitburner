// @ts-nocheck
// Script Version: v0.2.0
/**
 * Corporation Autopilot Script
 * Based on: https://github.com/mirkoconsiglio/Bitburner-scripts
 * 
 * This script automates corporation growth through 3 phases:
 * - Part 1: Basic Agriculture setup
 * - Part 2: Investment-funded expansion (waits for $210B and $5T rounds)
 * - Part 3: Tobacco division for massive profits
 * - Autopilot: Continuous product development and optimization
 * 
 * Features:
 * - Employee wellness management with automatic tea/coffee purchases
 * - Intern position assignment (1/9 ratio) to maintain morale and energy
 * - Office parties for emergency morale/energy boosts
 * - Configurable thresholds for wellness interventions
 * 
 * Requires: Warehouse API and Office API
 */

import type { NS } from '@ns';

const SCRIPT_VERSION = '0.2.0';
const DEBUG_CONFIG = { enabled: false };

// Employee Wellness Configuration
const WELLNESS_CONFIG = {
    // Morale/energy thresholds for tea/coffee purchases
    moraleThreshold: 95,
    energyThreshold: 95,
    // Critical thresholds for office parties
    criticalMoraleThreshold: 90,
    criticalEnergyThreshold: 90,
    // Intern ratios: 1/9 is optimal, 1/6 is fallback for low wellness
    internRatioNormal: 9,  // 1 intern per 9 employees
    internRatioHigh: 6,    // 1 intern per 6 employees (if wellness still drops)
    teaCostPerEmployee: 1e6,
    coffeeCostPerEmployee: 1e6,
    partyBudgetPerEmployee: 5e6,
};

// Autopilot configuration
const AUTOPILOT_CONFIG = {
    researchReserve: {
        base: 50e3,
        perProduct: 5e3,
        max: 200e3,
    },
    productBudget: {
        min: 1e9,
        maxFraction: 0.15,
        maxAbsolute: 5e12,
        marketingShare: 0.35,
        versionSlope: 0.2,
    }
};

const MATERIAL_CONFIG = {
    supportMaterials: [
        { name: 'Hardware', factorKey: 'hardwareFactor', perEmployee: 70 },
        { name: 'Robots', factorKey: 'robotFactor', perEmployee: 35 },
        { name: 'AI Cores', factorKey: 'aiCoreFactor', perEmployee: 45 },
        { name: 'Real Estate', factorKey: 'realEstateFactor', perEmployee: 550 },
    ],
    capacityShare: 0.7,
    stageMultipliers: {
        foundation: 0.5,
        expansion: 1,
        saturation: 2.2,
    },
    requiredBufferCycles: 20,
};

const ADVERT_CONFIG = {
    popularityAwarenessTarget: 0.85,
    popularityFloor: 5e3,
    minAdVertSpacing: 2,
};

const SMART_SUPPLY_CONFIG = {
    fundsBufferMultiplier: 1.25,
    reservePerCityMultiplier: 1.1,
    minReserveAfterUnlock: 35e9,
    minCitiesBeforeUnlock: 1,
    profitFloor: 5e6,
    requirePositiveProfit: true,
    waitLogEvery: 5,
    maxWaitCycles: 120,
};

const BOOTSTRAP_CONFIG = {
    minFundsPerCity: 25e9,
    materialBudgetPerEmployee: 2e9,
    waitLogEvery: 5,
    bootstrapFraction: 0.6,
    absoluteMinimum: 6e9,
    maxWaitCycles: 120,
};

const DEFAULT_OFFICE_DISTRIBUTIONS = {
    starter: { operations: 1, engineer: 1, business: 1 },
    branch: { operations: 2, engineer: 2, business: 1, management: 2, RAndD: 1 },
    hq: { operations: 6, engineer: 6, business: 5, management: 5, RAndD: 5 },
};

const DIVISION_PLANS = {
    Agriculture: {
        industry: 'Agriculture',
        mainCity: 'Sector-12',
        productCity: 'Sector-12',
        supportStages: {
            foundation: MATERIAL_CONFIG.stageMultipliers.foundation,
            expansion: MATERIAL_CONFIG.stageMultipliers.expansion,
            saturation: MATERIAL_CONFIG.stageMultipliers.saturation,
        },
        offices: {
            starter: { size: 3, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.starter },
            branch: { size: 9, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.branch },
        },
    },
    Tobacco: {
        industry: 'Tobacco',
        mainCity: 'Aevum',
        productCity: 'Aevum',
        supportStages: {
            foundation: MATERIAL_CONFIG.stageMultipliers.expansion,
            expansion: MATERIAL_CONFIG.stageMultipliers.expansion,
            saturation: MATERIAL_CONFIG.stageMultipliers.saturation,
        },
        offices: {
            branch: { size: 9, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.branch },
            hq: { size: 30, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.hq },
        },
    },
};

const DASHBOARD_STATE = {
    startTime: Date.now(),
    telemetry: [],
    telemetryLimit: 180,
    lastDecision: { action: 'Boot', detail: 'Initializing', ts: Date.now() },
    lastRender: 0,
};

const PRODUCT_ANALYTICS = new Map();

let dashboardInitialized = false;

function getDivisionPlan(division) {
    const fallback = {
        industry: division,
        mainCity: 'Sector-12',
        productCity: 'Sector-12',
        supportStages: {
            foundation: MATERIAL_CONFIG.stageMultipliers.foundation,
            expansion: MATERIAL_CONFIG.stageMultipliers.expansion,
            saturation: MATERIAL_CONFIG.stageMultipliers.saturation,
        },
        offices: {
            starter: { size: 3, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.starter },
            branch: { size: 9, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.branch },
        },
    };
    return DIVISION_PLANS[division] ?? fallback;
}

function getOfficeTemplate(division, template) {
    const plan = getDivisionPlan(division);
    return plan.offices?.[template] ?? null;
}

function getSupportMultiplier(division, stage) {
    const plan = getDivisionPlan(division);
    if (plan.supportStages?.[stage]) return plan.supportStages[stage];
    return MATERIAL_CONFIG.stageMultipliers[stage] ?? 1;
}

/**
 * Main entry point
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function main(ns: NS): Promise<void> {
    ns.clearLog();
    const flags = ns.flags([
        ['debug', false],
    ]);
    DEBUG_CONFIG.enabled = Boolean(flags.debug);
    ns.disableLog('ALL');
    initDashboard(ns);
    ns.tprint(`corp2 initializing version ${SCRIPT_VERSION} (debug=${DEBUG_CONFIG.enabled})`);
    const corp = ns.corporation;

    // Check if Corporation API is available
    try {
        corp.getConstants();
    } catch {
        throw new Error(`This script requires Corporation API access`);
    }

    // Try to unlock Warehouse API and Office API (required for this script)
    const unlocks = ['Warehouse API', 'Office API'];
    let neededUnlocks = [];
    let firstCheck = true;

    // Wait until we can afford and purchase all required unlocks
    while (true) {
        neededUnlocks = [];
        let totalCost = 0;

        for (const unlock of unlocks) {
            try {
                const cost = corp.getUnlockCost(unlock);
                if (cost > 0 && cost < Infinity) {
                    neededUnlocks.push({ name: unlock, cost });
                    totalCost += cost;
                }
            } catch {
                // Already unlocked, continue
            }
        }

        // If all unlocks are available, purchase them
        if (neededUnlocks.length === 0) {
            break;
        }

        const currentFunds = corp.getCorporation().funds;

        if (currentFunds >= totalCost) {
            // Purchase all unlocks
            for (const unlock of neededUnlocks) {
                corp.purchaseUnlock(unlock.name);
                ns.tprint(`✓ Purchased ${unlock.name} for $${ns.formatNumber(unlock.cost)}`);
            }
            break;
        } else {
            // Not enough funds yet
            if (firstCheck) {
                ns.tprint(`Waiting for funds to purchase required unlocks...`);
                ns.tprint(`Current funds: $${ns.formatNumber(currentFunds)}`);
                ns.tprint(`Total needed: $${ns.formatNumber(totalCost)}`);
                ns.tprint(`Missing: $${ns.formatNumber(totalCost - currentFunds)}`);
                for (const unlock of neededUnlocks) {
                    ns.tprint(`  - ${unlock.name}: $${ns.formatNumber(unlock.cost)}`);
                }
                firstCheck = false;
            }
            await ns.corporation.nextUpdate();
        }
    }

    // Set up
    const cities = getCities();
    const jobs = getJobs();
    const division1 = 'Agriculture';
    const division2 = 'Tobacco';
    const smartSupplyReady = tryUnlockSmartSupplyEarly(ns);
    if (!smartSupplyReady) {
        ns.print(`Smart Supply too expensive to buy upfront; continuing bootstrap and deferring the unlock.`);
    }
    // Part 1
    await part1(ns, cities, jobs, division1);
    // Part 2
    await part2(ns, cities, jobs, division1);
    // Part 3
    await part3(ns, cities, jobs, division2);
    // Autopilot
    await autopilot(ns, cities, jobs, division2);
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string} division
 * @returns {Promise<void>}
 */
export async function part1(ns, cities, jobs, division) {
    const corp = ns.corporation;
    const plan = getDivisionPlan(division);
    const starterTemplate = getOfficeTemplate(division, 'starter') ?? { size: 3, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.starter };
    const foundationMultiplier = plan.supportStages?.foundation ?? MATERIAL_CONFIG.stageMultipliers.foundation;
    const orderedCities = prioritizeCities(cities, plan.mainCity);
    debugLog(ns, 'Part1 start', { division, funds: corp.getCorporation().funds, orderedCities });
    // Expand to Agriculture division
    await expandIndustry(ns, 'Agriculture', division);
    // Expand city-by-city, deferring Smart Supply until funds and profits stabilize
    for (let index = 0; index < orderedCities.length; index++) {
        const city = orderedCities[index];
        await waitForCityBootstrapFunds(ns, division, city, starterTemplate);
        debugLog(ns, 'Part1 city setup', { division, city });
        // Expand to city
        await expandCity(ns, division, city);
        // Purchase warehouse
        await purchaseWarehouse(ns, division, city);
        enableSmartSupply(ns, division, city, true);
        const starterSize = starterTemplate.size ?? 3;
        const positions = buildPositionsWithInterns(jobs, starterSize, starterTemplate.distribution ?? DEFAULT_OFFICE_DISTRIBUTIONS.starter);
        await upgradeOffice(ns, division, city, starterSize, positions);
        // Start selling material
        corp.sellMaterial(division, city, 'Food', 'MAX', 'MP');
        corp.sellMaterial(division, city, 'Plants', 'MAX', 'MP');
        await stockSupportMaterials(ns, division, city, foundationMultiplier);
        const builtCities = index + 1;
        const remainingCities = orderedCities.length - builtCities;
        await ensureSmartSupplyUnlocked(ns, division, {
            builtCities,
            remainingCities,
            templateSize: starterTemplate.size,
            reason: `post-${city}`,
            wait: false,
        });
    }
    await ensureSmartSupplyUnlocked(ns, division, {
        builtCities: orderedCities.length,
        remainingCities: 0,
        templateSize: starterTemplate.size,
        reason: 'post-foundation',
        wait: true,
    });
    // Upgrade warehouse upto level 2
    for (let city of orderedCities) {
        await upgradeWarehouseUpto(ns, division, city, 2);
    }
    // Hire advert
    await hireAdVertUpto(ns, division, 1);
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string }division
 * @returns {Promise<void>}
 */
export async function part2(ns, cities, jobs, division) {
    const branchTemplate = getOfficeTemplate(division, 'branch') ?? { size: 9, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.branch };
    await ensureSmartSupplyUnlocked(ns, division, {
        builtCities: getDivisionSafe(ns, division)?.cities?.length ?? 0,
        remainingCities: 0,
        templateSize: branchTemplate.size,
        reason: 'pre-part2-scaling',
        wait: true,
    });
    // Get upgrades
    let upgrades = [
        { name: 'FocusWires', level: 2 },
        { name: 'Neural Accelerators', level: 2 },
        { name: 'Speech Processor Implants', level: 2 },
        { name: 'Nuoptimal Nootropic Injector Implants', level: 2 },
        { name: 'Smart Factories', level: 2 }
    ];
    await upgradeUpto(ns, upgrades);
    // Boost production
    for (let city of cities) {
        await stockSupportMaterials(ns, division, city, getSupportMultiplier(division, 'foundation'));
    }
    // Wait for investment offer of $210b for the first round
    await investmentOffer(ns, 210e9, 1);
    // Upgrade office size to nine (now includes 1 intern with 1/9 ratio)
    for (let city of cities) {
        const branchSize = branchTemplate.size ?? 9;
        const positions = buildPositionsWithInterns(jobs, branchSize, branchTemplate.distribution ?? DEFAULT_OFFICE_DISTRIBUTIONS.branch, { forceHighInterns: shouldUseHighInternRatio(ns, division, city) });
        await upgradeOffice(ns, division, city, branchSize, positions);
    }
    // Upgrade factories and storage
    upgrades = [
        { name: 'Smart Factories', level: 10 },
        { name: 'Smart Storage', level: 10 }
    ];
    await upgradeUpto(ns, upgrades);
    // Upgrade warehouses
    for (let city of cities) {
        await upgradeWarehouseUpto(ns, division, city, 9);
    }
    // Boost production
    for (let city of cities) {
        await stockSupportMaterials(ns, division, city, getSupportMultiplier(division, 'expansion'));
    }
    // Wait for investment offer of $5t for the second round
    await investmentOffer(ns, 5e12, 2);
    // Upgrade warehouses
    for (let city of cities) {
        await upgradeWarehouseUpto(ns, division, city, 19);
    }
    // Boost production
    for (let city of cities) {
        await stockSupportMaterials(ns, division, city, getSupportMultiplier(division, 'saturation'));
    }
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string} division
 * @param {string} mainCity
 * @returns {Promise<void>}
 */
export async function part3(ns, cities, jobs, division, mainCity = null) {
    const plan = getDivisionPlan(division);
    const branchTemplate = getOfficeTemplate(division, 'branch') ?? { size: 9, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.branch };
    const hqTemplate = getOfficeTemplate(division, 'hq') ?? { size: 30, distribution: DEFAULT_OFFICE_DISTRIBUTIONS.hq };
    const productCity = mainCity ?? plan.productCity ?? plan.mainCity ?? 'Aevum';
    // Expand into Tobacco industry
    await expandIndustry(ns, 'Tobacco', division);
    for (let city of cities) {
        // Expand to city
        await expandCity(ns, division, city);
        // Purchase warehouse
        await purchaseWarehouse(ns, division, city);
        enableSmartSupply(ns, division, city, true);
        if (city === productCity) {
            const hqSize = hqTemplate.size ?? 30;
            const positions = buildPositionsWithInterns(jobs, hqSize, hqTemplate.distribution ?? DEFAULT_OFFICE_DISTRIBUTIONS.hq, { forceHighInterns: shouldUseHighInternRatio(ns, division, city) });
            await upgradeOffice(ns, division, city, hqSize, positions);
        } else {
            const branchSize = branchTemplate.size ?? 9;
            const positions = buildPositionsWithInterns(jobs, branchSize, branchTemplate.distribution ?? DEFAULT_OFFICE_DISTRIBUTIONS.branch, { forceHighInterns: shouldUseHighInternRatio(ns, division, city) });
            await upgradeOffice(ns, division, city, branchSize, positions);
        }
        await stockSupportMaterials(ns, division, city, getSupportMultiplier(division, 'expansion'));
    }
    // Start making Tobacco v1
    if (getLatestVersion(ns, division) === 0) {
        const budget = calculateProductBudget(ns, division, 1);
        await makeProduct(ns, division, productCity, 'Tobacco v1', budget.design, budget.marketing);
    }
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string} division
 * @param {string} mainCity
 * @returns {Promise<void>}
 */
export async function autopilot(ns, cities, jobs, division, mainCity = null) {
    const corp = ns.corporation;
    const plan = getDivisionPlan(division);
    const headquartersCity = mainCity ?? plan.productCity ?? plan.mainCity ?? (cities[0] ?? 'Aevum');
    const upgrades = getResearch();
    let maxProducts = 3;
    if (corp.hasResearched(division, upgrades.capacity1)) maxProducts++;
    if (corp.hasResearched(division, upgrades.capacity2)) maxProducts++;
    // Get latest version
    let version = getLatestVersion(ns, division);
    // noinspection InfiniteLoopJS
    while (true) {
        const corpStats = corp.getCorporation();
        const divisionInfo = safeGetDivision(ns, division);
        if (!divisionInfo) {
            ns.print(`autopilot: division ${division} not available; waiting...`);
            await corp.nextUpdate();
            continue;
        }
        recordDivisionTelemetry(divisionInfo);
        if (divisionInfo.products.length === 0) {
            const budget = calculateProductBudget(ns, division, 1);
            await makeProduct(ns, division, headquartersCity, 'Tobacco v1', budget.design, budget.marketing);
            version = 1;
            await corp.nextUpdate();
            continue;
        }
        const minResearch = getMinResearchReserve(ns, division);
        let currentProduct;
        try {
            currentProduct = corp.getProduct(division, 'Tobacco v' + version);
        } catch {
            currentProduct = null;
        }
        if (currentProduct && currentProduct.developmentProgress >= 100) {
            // Start selling the developed version
            corp.sellProduct(division, headquartersCity, 'Tobacco v' + version, 'MAX', 'MP*' + (2 ** (version - 1)), true);
            // Set Market TA II if researched
            if (corp.hasResearched(division, upgrades.market2)) corp.setProductMarketTA2(division, 'Tobacco v' + version, true);
            // Discontinue earliest version
            if (corp.getDivision(division).products.length === maxProducts) {
                const earliest = 'Tobacco v' + getEarliestVersion(ns, division);
                corp.discontinueProduct(division, earliest);
                PRODUCT_ANALYTICS.delete(earliest);
            }
            // Start making new version
            const budget = calculateProductBudget(ns, division, version + 1);
            await makeProduct(ns, division, headquartersCity, 'Tobacco v' + (version + 1), budget.design, budget.marketing);
            // Update current version
            version++;
        } else if (!currentProduct) {
            version = getLatestVersion(ns, division);
        }
        // Check research progress for lab
        if (!corp.hasResearched(division, upgrades.lab) &&
            corp.getDivision(division).researchPoints - corp.getResearchCost(division, upgrades.lab) >= minResearch) {
            corp.research(division, upgrades.lab);
        }
        // Check research progress for Market TAs
        let researchCost = 0;
        if (!corp.hasResearched(division, upgrades.market1)) researchCost += corp.getResearchCost(division, upgrades.market1);
        if (!corp.hasResearched(division, upgrades.market2)) researchCost += corp.getResearchCost(division, upgrades.market2);
        if (corp.hasResearched(division, upgrades.lab) && researchCost > 0 &&
            corp.getDivision(division).researchPoints - researchCost >= minResearch) {
            if (!corp.hasResearched(division, upgrades.market1)) corp.research(division, upgrades.market1);
            if (!corp.hasResearched(division, upgrades.market2)) {
                corp.research(division, upgrades.market2);
                // Set Market TA II on for the current selling versions
                for (const product of corp.getDivision(division).products) corp.setProductMarketTA2(division, product, true);
            }
        }
        // Check research progress for Fulcrum
        if (corp.hasResearched(division, upgrades.market2) && !corp.hasResearched(division, upgrades.fulcrum) &&
            corp.getDivision(division).researchPoints - corp.getResearchCost(division, upgrades.fulcrum) >= minResearch) {
            corp.research(division, upgrades.fulcrum);
        }
        // Check research progress for Capacity I
        if (corp.hasResearched(division, upgrades.fulcrum) && !corp.hasResearched(division, upgrades.capacity1) &&
            corp.getDivision(division).researchPoints - corp.getResearchCost(division, upgrades.capacity1) >= minResearch) {
            corp.research(division, upgrades.capacity1);
            maxProducts++;
        }
        // Check research progress for Capacity II
        if (corp.hasResearched(division, upgrades.capacity1) && !corp.hasResearched(division, upgrades.capacity2) &&
            corp.getDivision(division).researchPoints - corp.getResearchCost(division, upgrades.capacity2) >= minResearch) {
            corp.research(division, upgrades.capacity2);
            maxProducts++;
        }
        // Check what is cheaper
        const advertCost = corp.getHireAdVertCost(division);
        const officeUpgradeCost = corp.getOfficeSizeUpgradeCost(division, headquartersCity, 15);
        const needsAds = shouldPrioritizeAdvertising(divisionInfo);

        if (!needsAds && officeUpgradeCost < advertCost) {
            if (corpStats.funds >= officeUpgradeCost) {
                const currentSize = corp.getOffice(division, headquartersCity).size;
                const newSize = currentSize + 15;
                corp.upgradeOfficeSize(division, headquartersCity, 15);
                hireMaxEmployees(ns, division, headquartersCity);
                // Assign jobs with intern-aware distribution
                const positions = buildPositionsWithInterns(jobs, newSize, {
                    operations: 1,
                    engineer: 1,
                    business: 1,
                    management: 1,
                    RAndD: 1
                }, { forceHighInterns: shouldUseHighInternRatio(ns, division, headquartersCity) });
                for (const position of positions) {
                    await corp.setAutoJobAssignment(division, headquartersCity, position.job, position.num);
                }
                setDashboardDecision('Office Upgrade', `${headquartersCity} +15 seats`);
            }
        } else if (corpStats.funds >= advertCost) {
            corp.hireAdVert(division);
            setDashboardDecision('AdVert Purchase', `Spent ${formatMoney(ns, advertCost)}`);
        }
        // Level upgrades
        levelUpgrades(ns, 0.1);
        // Manage employee wellness (tea/coffee/parties)
        manageEmployeeWellness(ns, cities, division);
        // Go public
        if (corpStats.revenue >= 1e18 && !corpStats.public) corp.goPublic(0);
        // If public
        if (corpStats.public) {
            // Sell a small amount of shares when they amount to more cash than we have on hand
            const sellAmount = Math.min(1e6, Math.max(0, corpStats.numShares));
            if (sellAmount > 0 && corpStats.shareSaleCooldown <= 0 &&
                corpStats.sharePrice * sellAmount > ns.getPlayer().money) {
                corp.sellShares(sellAmount);
            }
            // Buyback shares when we can (uses corporation funds, not player funds)
            else if (corpStats.issuedShares > 0) {
                const buybackCost = corpStats.issuedShares * corpStats.sharePrice;
                const corpFunds = corpStats.funds;
                if (corpFunds > buybackCost * 1.1) {
                    corp.buyBackShares(corpStats.issuedShares);
                }
            }
            // Check if we can unlock Shady Accounting
            try {
                const cost1 = corp.getUnlockCost('Shady Accounting');
                if (corpStats.funds >= cost1 && cost1 > 0 && cost1 < Infinity) {
                    corp.purchaseUnlock('Shady Accounting');
                }
            } catch { /* already purchased */ }
            // Check if we can unlock Government Partnership
            try {
                const cost2 = corp.getUnlockCost('Government Partnership');
                if (corpStats.funds >= cost2 && cost2 > 0 && cost2 < Infinity) {
                    corp.purchaseUnlock('Government Partnership');
                }
            } catch { /* already purchased */ }
            // Issue dividends
            if (corpStats.revenue > corpStats.expenses) {
                const targetRate = dividendsPercentage(ns);
                if (targetRate !== corpStats.dividendRate) corp.issueDividends(targetRate);
            } else if (corpStats.dividendRate > 0) {
                corp.issueDividends(0);
            }
        }
        updateProductAnalytics(ns, division);
        const telemetrySummary = summarizeTelemetry();
        const productSnapshot = getProductAnalyticsSnapshot();
        renderDashboard(ns, {
            corpStats,
            divisionInfo,
            telemetry: telemetrySummary,
            products: productSnapshot,
        });
        // Wait for next corporation update
        await corp.nextUpdate();
    }
}

function initDashboard(ns) {
    if (dashboardInitialized) return;
    dashboardInitialized = true;
    ns.tail();
    ns.clearLog();
    ns.print('Initializing corporation dashboard...');
}

function recordDivisionTelemetry(divisionInfo) {
    if (!divisionInfo) return;
    const point = {
        ts: Date.now(),
        awareness: divisionInfo.awareness,
        popularity: divisionInfo.popularity,
        ratio: divisionInfo.popularity / Math.max(1, divisionInfo.awareness),
    };
    DASHBOARD_STATE.telemetry.push(point);
    if (DASHBOARD_STATE.telemetry.length > DASHBOARD_STATE.telemetryLimit) {
        DASHBOARD_STATE.telemetry.shift();
    }
}

function summarizeTelemetry() {
    const history = DASHBOARD_STATE.telemetry;
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const anchor = history[Math.max(0, history.length - 5)];
    const ratioTrend = anchor ? latest.ratio - anchor.ratio : 0;
    return { latest, ratioTrend };
}

function setDashboardDecision(action, detail) {
    DASHBOARD_STATE.lastDecision = { action, detail, ts: Date.now() };
}

function renderDashboard(ns, payload) {
    if (!dashboardInitialized) return;
    const { corpStats, divisionInfo, telemetry, products } = payload;
    ns.clearLog();
    const lines = [];
    lines.push(`=== Corporation Autopilot Dashboard v${SCRIPT_VERSION} ===`);
    lines.push(`Corp  | Funds ${formatMoney(ns, corpStats.funds)} | Profit ${formatMoney(ns, corpStats.revenue - corpStats.expenses)} | Research ${formatNumber(ns, divisionInfo.researchPoints)}`);
    const ratio = telemetry?.latest?.ratio ?? 0;
    const ratioTrend = telemetry?.ratioTrend ?? 0;
    const ratioIndicator = ratioTrend > 0.01 ? '^' : ratioTrend < -0.01 ? 'v' : '-';
    lines.push(`Div   | ${divisionInfo.name} @ ${formatNumber(ns, divisionInfo.numAdVerts || 0)} AdVert | Aware ${formatNumber(ns, divisionInfo.awareness)} | Pop ${formatNumber(ns, divisionInfo.popularity)} | Ratio ${(ratio).toFixed(2)} ${ratioIndicator}`);
    if (products?.length) {
        lines.push('Prod  | ROI snapshot (rating x output / investment)');
        for (const product of products) {
            const rating = Number(product.rating ?? 0);
            const dev = Number(product.development ?? 0);
            lines.push(`       - ${product.name.padEnd(14)} ROI ${product.roi.toFixed(2)} | Rating ${rating.toFixed(1)} | Dev ${dev.toFixed(0)}%`);
        }
    }
    const decision = DASHBOARD_STATE.lastDecision;
    if (decision) {
        const delta = Math.max(1, (Date.now() - decision.ts) / 1000);
        lines.push(`Last  | ${decision.action} (${decision.detail}) ${delta.toFixed(0)}s ago`);
    }
    const uptimeMinutes = (Date.now() - DASHBOARD_STATE.startTime) / 60000;
    lines.push(`Uptime| ${uptimeMinutes.toFixed(1)} min`);
    for (const line of lines) ns.print(line);
}

function debugLog(ns, message, detail) {
    if (!DEBUG_CONFIG.enabled) return;
    const suffix = detail === undefined ? '' : (typeof detail === 'string' ? ` ${detail}` : ` ${JSON.stringify(detail)}`);
    const line = `[DEBUG] ${message}${suffix}`;
    ns.print(line);
    try {
        ns.tprint(`corp2 ${line}`);
    } catch { /* ignore tprint errors (e.g., tail-only) */ }
}

function trackProductInvestment(name, design, marketing) {
    const entry = PRODUCT_ANALYTICS.get(name) ?? { name, started: Date.now() };
    entry.designBudget = design;
    entry.marketingBudget = marketing;
    entry.investment = Math.max(1, (design ?? 0) + (marketing ?? 0));
    PRODUCT_ANALYTICS.set(name, entry);
}

function calculateProductROI(entry, productInfo) {
    const productionSignal = productInfo.productionAmount * Math.max(1, productInfo.effectiveRating);
    return productionSignal / Math.max(1, entry.investment ?? productInfo.designInvestment + productInfo.advertisingInvestment);
}

function updateProductAnalytics(ns, division) {
    let divisionInfo;
    try {
        divisionInfo = ns.corporation.getDivision(division);
    } catch {
        return;
    }
    const active = new Set();
    for (const product of divisionInfo.products) {
        let info;
        try {
            info = ns.corporation.getProduct(division, product);
        } catch {
            continue;
        }
        const entry = PRODUCT_ANALYTICS.get(product) ?? { name: product, started: Date.now() };
        entry.designInvestment = info.designInvestment;
        entry.advertisingInvestment = info.advertisingInvestment;
        entry.investment = Math.max(1, (entry.designBudget ?? info.designInvestment) + (entry.marketingBudget ?? info.advertisingInvestment));
        entry.production = info.productionAmount;
        entry.sales = info.actualSellAmount;
        entry.rating = info.rating;
        entry.effectiveRating = info.effectiveRating;
        entry.development = info.developmentProgress;
        entry.roi = calculateProductROI(entry, info);
        PRODUCT_ANALYTICS.set(product, entry);
        active.add(product);
    }
    for (const key of Array.from(PRODUCT_ANALYTICS.keys())) {
        if (!active.has(key)) PRODUCT_ANALYTICS.delete(key);
    }
}

function getProductAnalyticsSnapshot(limit = 3) {
    return Array.from(PRODUCT_ANALYTICS.values())
        .map(entry => ({ ...entry, roi: entry.roi ?? 0 }))
        .sort((a, b) => b.roi - a.roi)
        .slice(0, limit);
}

function getMinResearchReserve(ns, division) {
    const corp = ns.corporation;
    const config = AUTOPILOT_CONFIG.researchReserve;
    let products = 0;
    try {
        products = corp.getDivision(division).products.length;
    } catch {
        products = 0;
    }
    const reserve = config.base + products * config.perProduct;
    return Math.min(config.max, reserve);
}

function safeGetDivision(ns, division) {
    try {
        return ns.corporation.getDivision(division);
    } catch {
        return null;
    }
}

/**
 * Function to level the cheapest upgrade if under a certain percentage of the corp funds
 *
 * @param {NS} ns
 * @param {number} percent
 */
function levelUpgrades(ns, percent) {
    const corp = ns.corporation;
    let cheapestCost = Infinity;
    let cheapestUpgrade;
    for (const upgrade of getUpgrades()) {
        const cost = corp.getUpgradeLevelCost(upgrade);
        if (cost < cheapestCost) {
            cheapestUpgrade = upgrade;
            cheapestCost = cost;
        }
    }
    if (percent * corp.getCorporation().funds >= cheapestCost) corp.levelUpgrade(cheapestUpgrade);
}

/**
 * Function to return a list of upgrades
 *
 * @return {string[]}
 */
function getUpgrades() {
    return [
        'Smart Factories',
        'Smart Storage',
        'DreamSense',
        'Wilson Analytics',
        'Nuoptimal Nootropic Injector Implants',
        'Speech Processor Implants',
        'Neural Accelerators',
        'FocusWires',
        'ABC SalesBots',
        'Project Insight'
    ];
}

/**
 *
 * @param {NS} ns
 * @returns {number}
 */
function dividendsPercentage(ns) {
    const corpStats = ns.corporation.getCorporation();
    if (corpStats.revenue <= corpStats.expenses) return 0;
    const safeRevenue = Math.max(1, corpStats.revenue);
    const ratio = Math.log(safeRevenue) / (20 * Math.log(1000));
    return Math.max(0, Math.min(0.5, ratio));
}

/**
 *
 * @returns {Object<string>} Jobs
 */
function getJobs() {
    return {
        operations: 'Operations',
        engineer: 'Engineer',
        business: 'Business',
        management: 'Management',
        RAndD: 'Research & Development',
        intern: 'Intern'
    };
}


/**
 * Function to wait for enough money
 *
 * @param {NS} ns
 * @param {function} func
 * @param {*[]} args
 * @returns {Promise<void>}
 */
async function moneyFor(ns, func, ...args) {
    const corp = ns.corporation;
    while (func(...args) > corp.getCorporation().funds) {
        await corp.nextUpdate();
    }
}

/**
 * Function to wait for enough money
 *
 * @param {NS} ns
 * @param {number} amount
 * @returns {Promise<void>}
 */
async function moneyForAmount(ns, amount) {
    const corp = ns.corporation;
    while (amount > corp.getCorporation().funds) {
        await corp.nextUpdate();
    }
}

/**
 * Function to hire employees up to office size
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 */
function hireMaxEmployees(ns, division, city) {
    const corp = ns.corporation;
    ns.print(`Hiring employees for ${division} (${city})`);
    debugLog(ns, 'hireMaxEmployees start', { division, city });
    while (corp.getOffice(division, city).numEmployees < corp.getOffice(division, city).size) {
        corp.hireEmployee(division, city);
    }
    debugLog(ns, 'hireMaxEmployees complete', { division, city, size: corp.getOffice(division, city).size });
}

/**
 * Function to upgrade list of upgrades upto a certain level
 *
 * @param {NS} ns
 * @param {Object<string, number>[]} upgrades
 * @returns {Promise<void>}
 */
async function upgradeUpto(ns, upgrades) {
    const corp = ns.corporation;
    for (let upgrade of upgrades) {
        debugLog(ns, 'upgradeUpto target', { upgrade: upgrade.name, level: upgrade.level });
        while (corp.getUpgradeLevel(upgrade.name) < upgrade.level) {
            await moneyFor(ns, corp.getUpgradeLevelCost, upgrade.name);
            corp.levelUpgrade(upgrade.name);
            ns.print(`Upgraded ${upgrade.name} to level ${corp.getUpgradeLevel(upgrade.name)}`);
            debugLog(ns, 'upgradeUpto tick', { upgrade: upgrade.name, level: corp.getUpgradeLevel(upgrade.name) });
        }
    }
}

/**
 * Function to buy materials upto a certain quantity
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {Object<string, number>[]} materials
 * @returns {Promise<void>}
 */
async function buyMaterialsUpto(ns, division, city, materials) {
    const corp = ns.corporation;
    debugLog(ns, 'buyMaterialsUpto enter', { division, city, materials });
    logMaterialStatus(ns, division, city, materials, 'pre-purchase');
    const fallbackMaterials = [];
    for (let material of materials) {
        const matInfo = corp.getMaterial(division, city, material.name);
        const curQty = matInfo?.qty ?? 0;
        const targetQty = material.qty ?? 0;
        const needed = Math.max(0, targetQty - curQty);
        if (needed <= 0) continue;
        try {
            corp.bulkPurchase(division, city, material.name, needed);
            ns.tprint(`Bulk purchased ${round3(needed)} ${material.name} for ${division}/${city}`);
            debugLog(ns, 'buyMaterialsUpto bulkPurchase', { division, city, material: material.name, needed });
        } catch (error) {
            ns.print(`bulkPurchase failed for ${material.name} (${division}/${city}); falling back to buy rate. Error: ${String(error)}`);
            debugLog(ns, 'buyMaterialsUpto bulkPurchase-error', { division, city, material: material.name, error: String(error) });
            fallbackMaterials.push(material);
            const rate = needed / 10;
            ns.tprint(`Setting buy rate ${round3(rate)} for ${material.name} (${division}/${city}) target ${round3(targetQty)} current ${round3(curQty)}`);
            corp.buyMaterial(division, city, material.name, rate);
        }
    }
    if (fallbackMaterials.length > 0) {
        while (true) {
            let breakOut = true;
            for (let material of fallbackMaterials) {
                const curQty = corp.getMaterial(division, city, material.name).qty;
                if (curQty >= material.qty) {
                    corp.buyMaterial(division, city, material.name, 0);
                } else {
                    breakOut = false;
                }
            }
            logMaterialStatus(ns, division, city, fallbackMaterials, 'tick');
            if (breakOut) break;
            await corp.nextUpdate();
        }
    }
    logMaterialStatus(ns, division, city, materials, 'complete');
    debugLog(ns, 'buyMaterialsUpto complete', { division, city });
}

function buildSupportMaterialTargets(ns, division, city, multiplier = 1) {
    const corp = ns.corporation;
    let divisionInfo;
    try {
        divisionInfo = corp.getDivision(division);
    } catch {
        return [];
    }
    let office;
    try {
        office = corp.getOffice(division, city);
    } catch {
        return [];
    }
    if (!corp.hasWarehouse(division, city)) return [];
    const warehouse = corp.getWarehouse(division, city);
    const industry = corp.getIndustryData(divisionInfo.type);
    const maxCapacity = warehouse.size * MATERIAL_CONFIG.capacityShare;
    const targets = [];

    for (const entry of MATERIAL_CONFIG.supportMaterials) {
        const factor = industry[entry.factorKey] ?? 0;
        if (factor <= 0) continue;
        const desired = (entry.perEmployee * office.size * factor * multiplier);
        targets.push({
            name: entry.name,
            qty: Math.min(maxCapacity, desired),
        });
    }

    if (industry.requiredMaterials) {
        for (const [material, ratio] of Object.entries(industry.requiredMaterials)) {
            const buffer = Math.max(warehouse.size * 0.05, office.size * ratio * MATERIAL_CONFIG.requiredBufferCycles * multiplier);
            targets.push({ name: material, qty: buffer });
        }
    }

    return targets;
}

function logMaterialStatus(ns, division, city, materials, label = '') {
    const corp = ns.corporation;
    const snapshots = materials.map(material => {
        const mat = safeGetMaterial(corp, division, city, material.name);
        const currentQty = round3(mat.qty);
        const targetQty = round3(material.qty ?? 0);
        return {
            name: material.name,
            qty: currentQty,
            target: targetQty,
            buyRate: round3(mat.buy ?? 0),
            prodRate: round3(mat.prod ?? 0),
            desiredRate: round3(((material.qty ?? 0) - currentQty) / 10),
        };
    });
    const prefix = label ? `Material status [${label}]` : 'Material status';
    ns.tprint(`${prefix} ${division}/${city}: ${JSON.stringify(snapshots)}`);
    debugLog(ns, 'materialStatus snapshot', { division, city, label, snapshots });
}

function safeGetMaterial(corp, division, city, materialName) {
    try {
        return corp.getMaterial(division, city, materialName) ?? { qty: 0 };
    } catch {
        return { qty: 0 };
    }
}

function round3(value) {
    const num = Number(value);
    if (Number.isFinite(num)) {
        return Number(num.toFixed(3));
    }
    return 0;
}

async function stockSupportMaterials(ns, division, city, multiplier = 1) {
    const targets = buildSupportMaterialTargets(ns, division, city, multiplier);
    if (targets.length === 0) return;
    debugLog(ns, 'stockSupportMaterials targets', { division, city, multiplier, count: targets.length });
    await buyMaterialsUpto(ns, division, city, targets);
}

function prioritizeCities(cities, mainCity) {
    const unique = Array.from(new Set(cities));
    if (!mainCity || !unique.includes(mainCity)) return unique;
    return [mainCity, ...unique.filter(city => city !== mainCity)];
}

function estimateCitySetupCost(ns, templateSize = 3) {
    const constants = ns.corporation.getConstants();
    const baseCost = constants.officeInitialCost + constants.warehouseInitialCost;
    const materialBudget = (templateSize ?? 3) * BOOTSTRAP_CONFIG.materialBudgetPerEmployee;
    return baseCost + materialBudget;
}

function getDivisionSafe(ns, division) {
    const corp = ns.corporation;
    try {
        return corp.getDivision(division);
    } catch {
        return null;
    }
}

async function waitForCityBootstrapFunds(ns, division, city, template) {
    const corp = ns.corporation;
    let divisionInfo = null;
    try {
        divisionInfo = corp.getDivision(division);
    } catch { /* division not created yet */ }
    debugLog(ns, 'Bootstrap helper entry', { division, city, existingCities: divisionInfo?.cities ?? [] });
    if (divisionInfo?.cities?.includes(city)) {
        debugLog(ns, 'Bootstrap helper skip-existing', { division, city });
        return;
    }
    const targetSize = template?.size ?? 3;
    const constants = corp.getConstants();
    const baseCost = constants.officeInitialCost + constants.warehouseInitialCost;
    const estimatedCost = estimateCitySetupCost(ns, targetSize);
    const corpStats = corp.getCorporation();
    const corpFunds = corpStats.funds;
    const cityCount = divisionInfo?.cities?.length ?? 0;
    const dynamicFloor = Math.max(
        BOOTSTRAP_CONFIG.absoluteMinimum,
        Math.min(BOOTSTRAP_CONFIG.minFundsPerCity, corpFunds * (BOOTSTRAP_CONFIG.bootstrapFraction ?? 1))
    );
    let minFunds = Math.max(estimatedCost, dynamicFloor);
    const canForceFirstCity = cityCount === 0 && corpFunds >= baseCost;
    if (canForceFirstCity && corpFunds < minFunds) {
        ns.print(`Bootstrap: forcing first city ${city} with limited funds ${formatMoney(ns, corpFunds)} (target was ${formatMoney(ns, minFunds)})`);
        debugLog(ns, 'Bootstrap force-first-city', { division, city, corpFunds, minFunds, estimatedCost });
        return;
    }
    let cycles = 0;
    debugLog(ns, 'Bootstrap wait start', { division, city, minFunds, dynamicFloor, estimatedCost });
    while (corp.getCorporation().funds < minFunds) {
        if (cycles >= (BOOTSTRAP_CONFIG.maxWaitCycles ?? 120)) {
            const stats = corp.getCorporation();
            ns.print(`Bootstrap: timed out waiting for ${formatMoney(ns, minFunds)}; proceeding with ${formatMoney(ns, stats.funds)}`);
            debugLog(ns, 'Bootstrap wait timeout', { division, city, funds: stats.funds, target: minFunds });
            break;
        }
        if (cycles % BOOTSTRAP_CONFIG.waitLogEvery === 0) {
            const stats = corp.getCorporation();
            ns.print(`Bootstrap: waiting for ${formatMoney(ns, minFunds)} before expanding ${division} to ${city} (funds ${formatMoney(ns, stats.funds)}, profit ${formatMoney(ns, stats.revenue - stats.expenses)})`);
            debugLog(ns, 'Bootstrap wait tick', { division, city, funds: stats.funds, target: minFunds });
        }
        cycles++;
        await corp.nextUpdate();
    }
    debugLog(ns, 'Bootstrap wait satisfied', { division, city, funds: corp.getCorporation().funds, target: minFunds });
}

function calculateProductBudget(ns, division, version) {
    const corp = ns.corporation;
    const corpStats = corp.getCorporation();
    const divisionInfo = corp.getDivision(division);
    const demandBoost = Math.min(2, Math.max(0.5, divisionInfo.popularity / Math.max(1, divisionInfo.awareness)) + 0.5);
    const versionBoost = 1 + version * AUTOPILOT_CONFIG.productBudget.versionSlope;
    const available = corpStats.funds * AUTOPILOT_CONFIG.productBudget.maxFraction * demandBoost * versionBoost;
    const total = Math.min(AUTOPILOT_CONFIG.productBudget.maxAbsolute, Math.max(AUTOPILOT_CONFIG.productBudget.min, available));
    const marketing = total * AUTOPILOT_CONFIG.productBudget.marketingShare;
    return { design: total - marketing, marketing };
}

function shouldPrioritizeAdvertising(divisionInfo) {
    const awareness = Math.max(1, divisionInfo.awareness);
    const popularity = Math.max(1, divisionInfo.popularity);
    const ratio = popularity / awareness;
    return popularity < ADVERT_CONFIG.popularityFloor || ratio < ADVERT_CONFIG.popularityAwarenessTarget;
}

/**
 * Function to upgrade warehouse up to certain level
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {number} level
 * @returns {Promise<void>}
 */
async function upgradeWarehouseUpto(ns, division, city, level) {
    const corp = ns.corporation;
    debugLog(ns, 'upgradeWarehouse enter', { division, city, targetLevel: level });
    while (corp.getWarehouse(division, city).level < level) {
        await moneyFor(ns, corp.getUpgradeWarehouseCost, division, city);
        corp.upgradeWarehouse(division, city);
        ns.print(`Upgraded warehouse in ${division} (${city}) to level ${corp.getWarehouse(division, city).level}`);
        debugLog(ns, 'upgradeWarehouse tick', { division, city, level: corp.getWarehouse(division, city).level });
    }
}

/**
 * Function to hire AdVert up to certain level
 *
 * @param {NS} ns
 * @param {string} division
 * @param {number} level
 * @returns {Promise<void>}
 */
async function hireAdVertUpto(ns, division, level) {
    const corp = ns.corporation;
    debugLog(ns, 'hireAdVert enter', { division, targetLevel: level });
    while (corp.getHireAdVertCount(division) < level) {
        await moneyFor(ns, corp.getHireAdVertCost, division);
        corp.hireAdVert(division);
        ns.print(`Hired AdVert in ${division} to level ${level}`);
        debugLog(ns, 'hireAdVert tick', { division, currentLevel: corp.getHireAdVertCount(division) });
    }
}

/**
 * Function to upgrade an office, hire maximum number of employees and assign them jobs
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {number} size
 * @param {Object<string, number>[]} positions
 * @returns {Promise<void>}
 */
async function upgradeOffice(ns, division, city, size, positions) {
    const corp = ns.corporation;
    const upgradeSize = size - corp.getOffice(division, city).size;
    if (upgradeSize > 0) {
        ns.print(`Upgrading office in ${division} (${city}) to ${size}`);
        debugLog(ns, 'upgradeOffice wait-funds', { division, city, size, upgradeSize });
        await moneyFor(ns, corp.getOfficeSizeUpgradeCost, division, city, upgradeSize);
        corp.upgradeOfficeSize(division, city, upgradeSize);
        debugLog(ns, 'upgradeOffice resized', { division, city, size });
    }
    hireMaxEmployees(ns, division, city);
    const allPositions = getPositions(ns, division, city);
    for (let position of positions) {
        if (allPositions[position.job] !== position.num) {
            await corp.setAutoJobAssignment(division, city, position.job, position.num);
            debugLog(ns, 'upgradeOffice assign-job', { division, city, job: position.job, count: position.num });
        }
    }
}

/**
 *
 * @param {NS} ns
 * @param division
 * @param city
 * @returns {Object<string, number>[]}
 */
function getPositions(ns, division, city) {
    const corp = ns.corporation;
    // In the modern API, employeeJobs directly provides the job assignment counts
    return corp.getOffice(division, city).employeeJobs;
}

/**
 * Calculate the number of interns needed based on office size and ratio
 * 
 * @param {number} officeSize - Total number of employees in office
 * @param {number} ratio - Intern ratio (9 for 1/9, 6 for 1/6)
 * @returns {number} Number of interns to assign
 */
function calculateInternCount(officeSize, ratio = WELLNESS_CONFIG.internRatioNormal) {
    // At least 1 intern if office size >= ratio
    return Math.max(0, Math.floor(officeSize / ratio));
}

/**
 * Build job position array with intern allocation
 * Distributes remaining positions after interns across other roles
 * 
 * @param {Object} jobs - Jobs object from getJobs()
 * @param {number} officeSize - Total office size
 * @param {Object} distribution - Distribution ratios for non-intern roles
 * @returns {Object[]} Array of {job, num} objects
 */
function buildPositionsWithInterns(jobs, officeSize, distribution, options = {}) {
    const internRatio = options.forceHighInterns ? WELLNESS_CONFIG.internRatioHigh : WELLNESS_CONFIG.internRatioNormal;
    const internCount = calculateInternCount(officeSize, internRatio);
    let remainingSlots = officeSize - internCount;

    const positions = [];
    if (internCount > 0) positions.push({ job: jobs.intern, num: internCount });

    const entries = Object.entries(distribution);
    const totalRatio = entries.reduce((sum, [, ratio]) => sum + ratio, 0);
    const remainders = [];
    let assigned = 0;

    for (const [role, ratio] of entries) {
        const exact = remainingSlots * (ratio / totalRatio);
        const num = Math.floor(exact);
        if (num > 0) {
            positions.push({ job: jobs[role], num });
            assigned += num;
        }
        remainders.push({ role, job: jobs[role], fraction: exact - num });
    }

    let leftover = remainingSlots - assigned;
    if (leftover > 0) {
        remainders.sort((a, b) => b.fraction - a.fraction);
        let idx = 0;
        while (leftover > 0 && remainders.length > 0) {
            const target = remainders[idx % remainders.length];
            const existing = positions.find(p => p.job === target.job);
            if (existing) existing.num += 1; else positions.push({ job: target.job, num: 1 });
            leftover--;
            idx++;
        }
    }

    return positions;
}

function shouldUseHighInternRatio(ns, division, city) {
    const stats = getEmployeeStats(ns, division, city);
    return stats.morale < WELLNESS_CONFIG.criticalMoraleThreshold ||
        stats.energy < WELLNESS_CONFIG.criticalEnergyThreshold;
}

/**
 * Get average employee morale and energy for an office
 * 
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @returns {{morale: number, energy: number}}
 */
function getEmployeeStats(ns, division, city) {
    const corp = ns.corporation;
    const office = corp.getOffice(division, city);
    return {
        morale: office.avgMorale,
        energy: office.avgEnergy
    };
}

/**
 * Check employee wellness and purchase tea/coffee if needed
 * Returns true if tea or coffee was purchased
 * 
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @returns {boolean} True if wellness intervention was performed
 */
function checkAndBoostWellness(ns, division, city) {
    const corp = ns.corporation;
    const stats = getEmployeeStats(ns, division, city);
    const funds = corp.getCorporation().funds;
    const office = corp.getOffice(division, city);
    const teaCost = office.size * WELLNESS_CONFIG.teaCostPerEmployee;
    const coffeeCost = office.size * WELLNESS_CONFIG.coffeeCostPerEmployee;
    const partyBudget = office.size * WELLNESS_CONFIG.partyBudgetPerEmployee;
    let boosted = false;

    if (stats.morale < WELLNESS_CONFIG.moraleThreshold) {
        try {
            if (funds >= teaCost) {
                corp.buyTea(division, city);
                ns.print(`Bought tea for ${division} (${city}) - Morale ${stats.morale.toFixed(1)}`);
                boosted = true;
            }
        } catch { /* api unavailable */ }
    }

    if (stats.energy < WELLNESS_CONFIG.energyThreshold) {
        try {
            if (funds >= coffeeCost) {
                corp.buyCoffee(division, city);
                ns.print(`Bought coffee for ${division} (${city}) - Energy ${stats.energy.toFixed(1)}`);
                boosted = true;
            }
        } catch { /* api unavailable */ }
    }

    if (stats.morale < WELLNESS_CONFIG.criticalMoraleThreshold &&
        stats.energy < WELLNESS_CONFIG.criticalEnergyThreshold) {
        try {
            if (funds >= partyBudget) {
                corp.throwParty(division, city, partyBudget);
                ns.print(`Threw party for ${division} (${city}) - Morale ${stats.morale.toFixed(1)}, Energy ${stats.energy.toFixed(1)}`);
                boosted = true;
            }
        } catch { /* api unavailable */ }
    }

    return boosted;
}

/**
 * Monitor and manage employee wellness across all offices in a division
 * 
 * @param {NS} ns
 * @param {string[]} cities
 * @param {string} division
 */
function manageEmployeeWellness(ns, cities, division) {
    for (const city of cities) {
        try {
            checkAndBoostWellness(ns, division, city);
        } catch (e) {
            // Division/city might not exist yet; ignore
        }
    }
}

/**
 * Function to wait for an investment offer of a certain amount
 *
 * @param {NS} ns
 * @param {number} amount
 * @param {number} round
 * @returns {Promise<void>}
 */
async function investmentOffer(ns, amount, round = 5) {
    const corp = ns.corporation;
    ns.print(`Waiting for investment offer of ${formatMoney(ns, amount)} (target round ${round})`);
    debugLog(ns, 'investmentOffer start', { amount, round });
    while (true) {
        const offer = corp.getInvestmentOffer();
        debugLog(ns, 'investmentOffer tick', { currentRound: offer.round, funds: offer.funds });
        if (offer.round > round) {
            ns.print(`Investment round ${round} already passed (current round ${offer.round}).`);
            debugLog(ns, 'investmentOffer missed', { amount, round, currentRound: offer.round });
            return;
        }
        if (offer.funds >= amount) {
            ns.print(`Accepted investment offer of ${formatMoney(ns, offer.funds)} in round ${offer.round}`);
            corp.acceptInvestmentOffer();
            debugLog(ns, 'investmentOffer accepted', { amount: offer.funds, round: offer.round });
            return;
        }
        await ns.corporation.nextUpdate();
    }
}

/**
 * Function to start making a product
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {string} name
 * @param {number} design
 * @param {number} marketing
 * @returns {Promise<void>}
 */
async function makeProduct(ns, division, city, name, design = 0, marketing = 0) {
    const corp = ns.corporation;
    debugLog(ns, 'makeProduct enter', { division, city, name, design, marketing });
    const products = corp.getDivision(division).products;
    const proposedVersion = parseVersion(name);
    let currentBestVersion = 0;
    for (let product of products) {
        let version = parseVersion(product);
        if (version > currentBestVersion) currentBestVersion = version;
    }
    if (proposedVersion > currentBestVersion) {
        await moneyForAmount(ns, design + marketing);
        corp.makeProduct(division, city, name, design, marketing);
        ns.print(`Started to make ${name} in ${division} (${city}) with ${formatMoney(ns, design)} for design and ${formatMoney(ns, marketing)} for marketing`);
        trackProductInvestment(name, design, marketing);
        debugLog(ns, 'makeProduct started', { division, city, name, design, marketing });
    } else {
        ns.print(`Already making/made ${name} in ${division} (${city})`);
        debugLog(ns, 'makeProduct skipped-existing', { division, city, name });
    }
}

/**
 * Function to get latest product version
 *
 * @param {NS} ns
 * @param {string} division
 * @return {number}
 */
function getLatestVersion(ns, division) {
    const products = ns.corporation.getDivision(division).products;
    let latestVersion = 0;
    for (let product of products) {
        let version = parseVersion(product);
        if (version > latestVersion) latestVersion = version;
    }
    return latestVersion;
}

/**
 * Function to get earliest product version
 *
 * @param {NS} ns
 * @param {string} division
 * @returns {number}
 */
function getEarliestVersion(ns, division) {
    const products = ns.corporation.getDivision(division).products;
    let earliestVersion = Number.MAX_SAFE_INTEGER;
    for (let product of products) {
        let version = parseVersion(product);
        if (version < earliestVersion) earliestVersion = version;
    }
    return earliestVersion;
}

/**
 * Function to parse product version from name
 *
 * @param {string} name
 * @returns {number}
 */
function parseVersion(name) {
    let version = '';
    for (let i = 1; i <= name.length; i++) {
        let slice = name.slice(-i);
        if (!isNaN(slice)) version = slice;
        else if (version === '') throw new Error(`Product name must end with version number`);
        else return parseInt(version);
    }
}

/**
 * Function to expand industry
 *
 * @param {NS} ns
 * @param {string} industry
 * @param {string} division
 * @returns {Promise<void>}
 */
async function expandIndustry(ns, industry, division) {
    const corp = ns.corporation;
    debugLog(ns, 'expandIndustry enter', { industry, division });
    // Be explicit: check if a division with this type or name already exists
    const divisions = corp.getCorporation().divisions || [];
    const hasType = divisions.some(d => d.type === industry);
    const hasName = divisions.some(d => d.name === division);
    if (hasType || hasName) {
        ns.print(`Already expanded: industry=${industry} (exists=${hasType}), name=${division} (exists=${hasName})`);
        debugLog(ns, 'expandIndustry skip-existing', { industry, division, hasType, hasName });
        return;
    }

    ns.print(`Expanding to ${industry} industry: ${division}`);
    debugLog(ns, 'expandIndustry wait-funds', { industry, division });
    const cost = corp.getIndustryData(industry).startingCost;
    await moneyForAmount(ns, cost);
    try {
        corp.expandIndustry(industry, division);
        debugLog(ns, 'expandIndustry success', { industry, division });
    } catch (err) {
        // The game's API can throw when the requested division name is already in use by another
        // script or when race conditions occur. If that's the case, detect and ignore it; otherwise rethrow.
        const msg = String(err || '');
        if (msg.toLowerCase().includes('already in use') || msg.toLowerCase().includes('already exists')) {
            ns.print(`expandIndustry: Division name ${division} already in use; skipping.`);
            debugLog(ns, 'expandIndustry name-conflict', { industry, division, message: msg });
            return;
        }
        debugLog(ns, 'expandIndustry error', { industry, division, message: msg });
        throw err;
    }
}


/**
 * Function to expand city
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @returns {Promise<void>}
 */
async function expandCity(ns, division, city) {
    const corp = ns.corporation;
    debugLog(ns, 'expandCity enter', { division, city });
    if (!corp.getDivision(division).cities.includes(city)) {
        const cost = corp.getConstants().officeInitialCost;
        debugLog(ns, 'expandCity wait-funds', { division, city, cost });
        await moneyForAmount(ns, cost);
        corp.expandCity(division, city);
        ns.print(`Expanded to ${city} for ${division}`);
        debugLog(ns, 'expandCity success', { division, city });
    } else {
        ns.print(`Already expanded to ${city} for ${division}`);
        debugLog(ns, 'expandCity skip-existing', { division, city });
    }
}

/**
 * Function to purchase warehouse
 *
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @returns {Promise<void>}
 */
async function purchaseWarehouse(ns, division, city) {
    const corp = ns.corporation;
    debugLog(ns, 'purchaseWarehouse enter', { division, city });
    if (!corp.hasWarehouse(division, city)) {
        const cost = corp.getConstants().warehouseInitialCost;
        debugLog(ns, 'purchaseWarehouse wait-funds', { division, city, cost });
        await moneyForAmount(ns, cost);
        corp.purchaseWarehouse(division, city);
        ns.print(`Purchased warehouse in ${division} (${city})`);
        debugLog(ns, 'purchaseWarehouse success', { division, city });
    } else {
        ns.print(`Already purchased warehouse in ${city} for ${division}`);
        debugLog(ns, 'purchaseWarehouse skip-existing', { division, city });
    }
}

function tryUnlockSmartSupplyEarly(ns) {
    if (isSmartSupplyUnlocked(ns)) {
        return true;
    }
    const corp = ns.corporation;
    let cost = 0;
    try {
        cost = corp.getUnlockCost('Smart Supply');
    } catch {
        return false;
    }
    if (!(cost > 0 && cost < Infinity)) {
        return isSmartSupplyUnlocked(ns);
    }
    const funds = corp.getCorporation().funds;
    const reserveFloor = Math.max(
        SMART_SUPPLY_CONFIG.minReserveAfterUnlock ?? 0,
        BOOTSTRAP_CONFIG.absoluteMinimum ?? 0,
    );
    if (funds - cost < reserveFloor) {
        ns.print(`Smart Supply costs ${formatMoney(ns, cost)} but only ${formatMoney(ns, funds)} available; deferring unlock.`);
        return false;
    }
    try {
        corp.purchaseUnlock('Smart Supply');
        ns.print(`Smart Supply unlocked before bootstrap (cost ${formatMoney(ns, cost)})`);
        return true;
    } catch (error) {
        ns.print(`Smart Supply purchase attempt failed: ${String(error)}`);
        return false;
    }
}

function isSmartSupplyUnlocked(ns) {
    const corp = ns.corporation;
    try {
        if (typeof corp.hasUnlockUpgrade === 'function' && corp.hasUnlockUpgrade('Smart Supply')) {
            return true;
        }
    } catch {
        // Ignore and fall back to cost probe
    }
    try {
        const cost = corp.getUnlockCost('Smart Supply');
        return !(cost > 0 && cost < Infinity);
    } catch {
        return true;
    }
}

function evaluateSmartSupplyUnlock(ns, division, context = {}) {
    if (isSmartSupplyUnlocked(ns)) {
        return { ready: true, needsPurchase: false, reason: 'already-unlocked' };
    }
    const corp = ns.corporation;
    let cost = 0;
    try {
        cost = corp.getUnlockCost('Smart Supply');
    } catch {
        return { ready: true, needsPurchase: false, reason: 'cost-unavailable' };
    }
    if (!(cost > 0 && cost < Infinity)) {
        return { ready: true, needsPurchase: true, reason: 'no-cost' };
    }
    const corpStats = corp.getCorporation();
    const fundsAfter = corpStats.funds - cost;
    const templateSize = context.templateSize ?? 3;
    const perCityBudget = estimateCitySetupCost(ns, templateSize);
    const remainingCities = Math.max(0, context.remainingCities ?? 0);
    const reserveNeed = Math.max(
        SMART_SUPPLY_CONFIG.minReserveAfterUnlock,
        cost * SMART_SUPPLY_CONFIG.fundsBufferMultiplier,
        perCityBudget * remainingCities * SMART_SUPPLY_CONFIG.reservePerCityMultiplier,
    );
    const divisionInfo = getDivisionSafe(ns, division);
    const builtCities = Math.max(context.builtCities ?? 0, divisionInfo?.cities?.length ?? 0);
    if (builtCities < SMART_SUPPLY_CONFIG.minCitiesBeforeUnlock) {
        return { ready: false, needsPurchase: true, reason: 'city-threshold', details: { builtCities } };
    }
    if (fundsAfter < reserveNeed) {
        return { ready: false, needsPurchase: true, reason: 'reserve', details: { fundsAfter, reserveNeed } };
    }
    if (SMART_SUPPLY_CONFIG.requirePositiveProfit) {
        const profit = (divisionInfo?.lastCycleRevenue ?? 0) - (divisionInfo?.lastCycleExpenses ?? 0);
        if (profit < SMART_SUPPLY_CONFIG.profitFloor) {
            return { ready: false, needsPurchase: true, reason: 'profit', details: { profit } };
        }
    }
    return { ready: true, needsPurchase: true, reason: 'requirements-met', details: { fundsAfter, reserveNeed } };
}

async function ensureSmartSupplyUnlocked(ns, division, context = {}) {
    const corp = ns.corporation;
    const waitForUnlock = Boolean(context.wait);
    let cycles = 0;
    while (true) {
        const assessment = evaluateSmartSupplyUnlock(ns, division, context);
        if (assessment.ready) {
            if (assessment.needsPurchase && !isSmartSupplyUnlocked(ns)) {
                await unlockUpgrade(ns, 'Smart Supply');
                ns.print(`Smart Supply unlocked (${context.reason ?? 'auto'})`);
                debugLog(ns, 'smartSupply unlocked', { reason: context.reason, details: assessment.details });
            }
            return true;
        }
        if (!waitForUnlock) {
            debugLog(ns, 'smartSupply deferral', { reason: assessment.reason, context, details: assessment.details });
            return false;
        }
        if (cycles >= (SMART_SUPPLY_CONFIG.maxWaitCycles ?? 120)) {
            ns.print(`Smart Supply gating timed out (${assessment.reason}); unlocking to avoid stall.`);
            await unlockUpgrade(ns, 'Smart Supply');
            return true;
        }
        if (cycles % (SMART_SUPPLY_CONFIG.waitLogEvery ?? 5) === 0) {
            const corpStats = corp.getCorporation();
            ns.print(`Smart Supply waiting (${assessment.reason}) | Funds ${formatMoney(ns, corpStats.funds)}`);
            debugLog(ns, 'smartSupply waiting', { reason: assessment.reason, details: assessment.details });
        }
        cycles++;
        await corp.nextUpdate();
    }
}

function enableSmartSupply(ns, division, city, enabled = true) {
    const corp = ns.corporation;
    try {
        corp.setSmartSupply(division, city, enabled);
    } catch {
        // Warehouse API may be missing temporarily; swallow and continue.
    }
}

/**
 * Function to unlock upgrade
 *
 * @param {NS} ns
 * @param {string} upgrade
 * @returns {Promise<void>}
 */
async function unlockUpgrade(ns, upgrade) {
    const corp = ns.corporation;
    debugLog(ns, 'unlockUpgrade enter', { upgrade });
    // Check if already purchased by trying to get the cost (will be 0 or Infinity if owned)
    try {
        const cost = corp.getUnlockCost(upgrade);
        if (cost > 0 && cost < Infinity) {
            debugLog(ns, 'unlockUpgrade wait-funds', { upgrade, cost });
            await moneyForAmount(ns, cost);
            corp.purchaseUnlock(upgrade);
            ns.print(`Purchased ${upgrade}`);
            debugLog(ns, 'unlockUpgrade success', { upgrade });
        } else {
            ns.print(`Already purchased ${upgrade}`);
            debugLog(ns, 'unlockUpgrade skip-existing', { upgrade });
        }
    } catch {
        ns.print(`Already purchased ${upgrade}`);
        debugLog(ns, 'unlockUpgrade skip-existing', { upgrade, via: 'exception' });
    }
}

/**
 * Function to return important research
 *
 * @returns {Object<string>}
 */
function getResearch() {
    return {
        lab: 'Hi-Tech R&D Laboratory',
        market1: 'Market-TA.I',
        market2: 'Market-TA.II',
        fulcrum: 'uPgrade: Fulcrum',
        capacity1: 'uPgrade: Capacity.I',
        capacity2: 'uPgrade: Capacity.II'
    };
}

/**
 *
 * @param {NS} ns
 * @param {string} str
 */
export function printBoth(ns, str) {
    ns.print(str);
    ns.tprint(str);
}

/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function copyScriptsToAll(ns) {
    for (let server of getServers(ns)) if (server !== 'home') await ns.scp(scriptsToCopy(), server, 'home');
}

/**
 *
 * @returns {Object<string>}
 */
export function getScripts() {
    return {
        cortex: 'cortex.js',
        upgradeHomeRam: '/player/upgrade-home-ram.js',
        upgradeHomeCores: '/player/upgrade-home-cores.js',
        joinFactions: '/factions/join-factions.js',
        hack: '/daemons/hack.js',
        grow: '/daemons/grow.js',
        weaken: '/daemons/weaken.js',
        charge: '/daemons/charge.js',
        intelligence: '/daemons/intelligence.js',
        batcher: '/hacking/batcher.js',
        backdoor: '/hacking/backdoor.js',
        share: '/daemons/share.js',
        utils: 'utils.js',
        gang: '/gang/manager.js',
        corp: '/corporation/autopilot.js',
        bladeburner: '/bladeburner/autopilot.js',
        stock: '/stock-market/autopilot.js',
        hacknet: '/hacknet/manager.js',
        sleeve: '/sleeve/autopilot.js',
        stanek: '/stanek/controller.js'
    };
}

/**
 *
 * @returns {string[]}
 */
export function getManagerScripts() {
    const scripts = getScripts();
    return [
        scripts.cortex,
        scripts.gang,
        scripts.corp,
        scripts.bladeburner,
        scripts.stock,
        scripts.hacknet,
        scripts.sleeve,
        scripts.stanek,
        scripts.batcher
    ];
}

/**
 *
 * @returns {string[]}
 */
export function scriptsToCopy() {
    return Object.values(getScripts());
}

/**
 *
 * @returns {Object<Object>}
 */
function getOrganisations() {
    return {
        'ECorp': {
            location: 'Aevum',
            stockSymbol: 'ECP',
            server: 'ecorp',
            faction: 'ECorp',
            company: 'ECorp',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'MegaCorp': {
            location: 'Sector-12',
            stockSymbol: 'MGCP',
            server: 'megacorp',
            faction: 'MegaCorp',
            company: 'MegaCorp',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Blade Industries': {
            location: 'Sector-12',
            stockSymbol: 'BLD',
            server: 'blade',
            faction: 'Blade Industries',
            company: 'Blade Industries',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Clarke Incorporated': {
            location: 'Aevum',
            stockSymbol: 'CLRK',
            server: 'clarkinc',
            faction: 'Clarke Incorporated',
            company: 'Clarke Incorporated',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'OmniTek Incorporated': {
            location: 'Volhaven',
            stockSymbol: 'OMTK',
            server: 'omnitek',
            faction: 'OmniTek Incorporated',
            company: 'OmniTek Incorporated',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Four Sigma': {
            location: 'Sector-12',
            stockSymbol: 'FSIG',
            server: '4sigma',
            faction: 'Four Sigma',
            company: 'Four Sigma',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'KuaiGong International': {
            location: 'Chongqing',
            stockSymbol: 'KGI',
            server: 'kuai-gong',
            faction: 'KuaiGong International',
            company: 'KuaiGong International',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Fulcrum Technologies': {
            location: 'Aevum',
            stockSymbol: 'FLCM',
            server: 'fulcrumtech',
            company: 'Fulcrum Technologies',
            companyPositions: ['Business', 'IT', 'Software']
        },
        'Storm Technologies': {
            location: 'Ishima',
            stockSymbol: 'STM',
            server: 'stormtech',
            company: 'Storm Technologies',
            companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
        },
        'DefComm': {
            location: 'New Tokyo',
            stockSymbol: 'DCOMM',
            server: 'defcomm',
            company: 'DefComm',
            companyPositions: ['IT', 'Software Consultant', 'Software']
        },
        'Helios Labs': {
            location: 'Volhaven',
            stockSymbol: 'HLS',
            server: 'helios',
            company: 'Helios Labs',
            companyPositions: ['IT', 'Software Consultant', 'Software']
        },
        'VitaLife': {
            location: 'New Tokyo',
            stockSymbol: 'VITA',
            server: 'vitalife',
            company: 'VitaLife',
            companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
        },
        'Icarus Microsystems': {
            location: 'Sector-12',
            stockSymbol: 'ICRS',
            server: 'icarus',
            company: 'Icarus Microsystems',
            companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
        },
        'Universal Energy': {
            location: 'Sector-12',
            stockSymbol: 'UNV',
            server: 'univ-energy',
            company: 'Universal Energy',
            companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
        },
        'AeroCorp': {
            location: 'Aevum',
            stockSymbol: 'AERO',
            server: 'aerocorp',
            company: 'AeroCorp',
            companyPositions: ['IT', 'Security', 'Software']
        },
        'Omnia Cybersystems': {
            location: 'Volhaven',
            stockSymbol: 'OMN',
            server: 'omnia',
            company: 'Omnia Cybersystems',
            companyPositions: ['IT', 'Security', 'Software']
        },
        'Solaris Space Systems': {
            location: 'Chongqing',
            stockSymbol: 'SLRS',
            server: 'solaris',
            company: 'Solaris Space Systems',
            companyPositions: ['IT', 'Security', 'Software']
        },
        'Global Pharmaceuticals': {
            location: 'New Tokyo',
            stockSymbol: 'GPH',
            server: 'global-pharm',
            company: 'Global Pharmaceuticals',
            companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
        },
        'Nova Medical': {
            location: 'Ishima',
            stockSymbol: 'NVMD',
            server: 'nova-med',
            company: 'Nova Medical',
            companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
        },
        'Watchdog Security': {
            location: 'Aevum',
            stockSymbol: 'WDS',
            company: 'Watchdog Security',
            companyPositions: ['Agent', 'IT', 'Security', 'Software Consultant', 'Software']
        },
        'LexoCorp': {
            location: 'Volhaven',
            stockSymbol: 'LXO',
            server: 'lexo-corp',
            company: 'LexoCorp',
            companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
        },
        'Rho Construction': {
            location: 'Aevum',
            stockSymbol: 'RHOC',
            server: 'rho-construction',
            company: 'Rho Construction',
            companyPositions: ['Business', 'Software']
        },
        'Alpha Enterprises': {
            location: 'Sector-12',
            stockSymbol: 'APHE',
            server: 'alpha-ent',
            company: 'Alpha Enterprises',
            companyPositions: ['Business', 'Software Consultant', 'Software']
        },
        'SysCore Securities': {
            location: 'Volhaven',
            stockSymbol: 'SYSC',
            server: 'syscore',
            company: 'SysCore Securities',
            companyPositions: ['IT', 'Software']
        },
        'CompuTek': {
            location: 'Volhaven',
            stockSymbol: 'CTK',
            server: 'comptek',
            company: 'CompuTek',
            companyPositions: ['IT', 'Software']
        },
        'NetLink Technologies': {
            location: 'Aevum',
            stockSymbol: 'NTLK',
            server: 'netlink',
            company: 'NetLink Technologies',
            companyPositions: ['IT', 'Software']
        },
        'Omega Software': {
            location: 'Ishima',
            stockSymbol: 'OMGA',
            server: 'omega-net',
            company: 'Omega Software',
            companyPositions: ['IT', 'Software Consultant', 'Software']
        },
        'FoodNStuff': {
            location: 'Sector-12',
            stockSymbol: 'FNS',
            server: 'foodnstuff',
            company: 'FoodNStuff',
            companyPositions: ['Employee', 'part-time Employee']
        },
        'Sigma Cosmetics': { stockSymbol: 'SGC', server: 'sigma-cosmetics' },
        'Joe\'s Guns': {
            location: 'Sector-12',
            stockSymbol: 'JGN',
            server: 'joesguns',
            company: 'Joe\'s Guns',
            companyPositions: ['Employee', 'part-time Employee']
        },
        'Catalyst Ventures': { stockSymbol: 'CTYS', server: 'catalyst' },
        'Microdyne Technologies': { stockSymbol: 'MDYN', server: 'microdyne' },
        'Titan Laboratories': { stockSymbol: 'TITN', server: 'titan-labs' },
        'CyberSec': { server: 'CSEC', faction: 'CyberSec', factionWorkTypes: ['Hacking'] },
        'The Runners': { server: 'run4theh111z', faction: 'BitRunners', factionWorkTypes: ['Hacking'] },
        'Bachman & Associates': {
            location: 'Aevum',
            server: 'b-and-a',
            faction: 'Bachman & Associates',
            company: 'Bachman & Associates',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Fulcrum Secret Technologies': {
            server: 'fulcrumassets',
            faction: 'Fulcrum Secret Technologies',
            factionWorkTypes: ['Hacking', 'Security']
        },
        'NiteSec': { server: 'avmnite-02h', faction: 'NiteSec', factionWorkTypes: ['Hacking'], gang: true },
        'I.I.I.I': { server: 'I.I.I.I', faction: 'The Black Hand', factionWorkTypes: ['Hacking', 'Field'], gang: true },
        'Slum Snakes': { faction: 'Slum Snakes', factionWorkTypes: ['Field', 'Security'], gang: true },
        'Tetrads': { faction: 'Tetrads', factionWorkTypes: ['Field', 'Security'], gang: true },
        'Speakers for the Dead': {
            faction: 'Speakers for the Dead',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            gang: true
        },
        '.': { server: '.', faction: 'The Dark Army', factionWorkTypes: ['Hacking', 'Field'], gang: true },
        'The Syndicate': { faction: 'The Syndicate', factionWorkTypes: ['Hacking', 'Field', 'Security'], gang: true },
        'Rothman University': { location: 'Sector-12', server: 'rothman-uni', university: 'Rothman University' },
        'ZB Institute of Technology': {
            location: 'Volhaven',
            server: 'zb-institute',
            university: 'ZB Institute of Technology'
        },
        'Summit University': { location: 'Aevum', server: 'summit-university', university: 'Summit University' },
        'Crush Fitness': { location: 'Aevum', server: 'crush-fitness', gym: 'Crush Fitness Gym' },
        'Millenium Fitness Network': { location: 'Volhaven', server: 'millenium-fitness', gym: 'Millenium Fitness Gym' },
        'Iron Gym Network': { location: 'Sector-12', server: 'iron-gym', gym: 'Iron Gym' },
        'Powerhouse Fitness': { location: 'Sector-12', server: 'powerhouse-fitness', gym: 'Powerhouse Gym' },
        'Snap Fitness': { location: 'Aevum', server: 'snap-fitness', gym: 'Snap Fitness Gym' },
        'Silhouette': { faction: 'Silhouette', factionWorkTypes: ['Hacking', 'Field'] },
        'Tian Di Hui': { faction: 'Tian Di Hui', factionWorkTypes: ['Hacking', 'Security'] },
        'Netburners': { faction: 'Netburners', factionWorkTypes: ['Hacking'] },
        'Aevum': {
            location: 'Aevum',
            faction: 'Aevum',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'Sector-12': {
            location: 'Sector-12',
            faction: 'Sector-12',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'Chongqing': {
            location: 'Chongqing',
            faction: 'Chongqing',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'New Tokyo': {
            location: 'New Tokyo',
            faction: 'New Tokyo',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'Ishima': {
            location: 'Ishima',
            faction: 'Ishima',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'Volhaven': {
            location: 'Volhaven',
            faction: 'Volhaven',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            city: true
        },
        'NWO': {
            location: 'Volhaven',
            server: 'nwo',
            faction: 'NWO',
            company: 'NWO',
            factionWorkTypes: ['Hacking', 'Field', 'Security'],
            companyPositions: ['Business', 'IT', 'Security', 'Software']
        },
        'Delta One': {
            location: 'Sector-12',
            server: 'deltaone',
            company: 'Delta One',
            companyPositions: ['IT', 'Security', 'Software']
        },
        'Central Intelligence Agency': {
            location: 'Sector-12',
            company: 'Central Intelligence Agency',
            companyPositions: ['Agent', 'IT', 'Security', 'Software']
        },
        'National Security Agency': {
            location: 'Sector-12',
            company: 'National Security Agency',
            companyPositions: ['Agent', 'IT', 'Security', 'Software']
        },
        'Aevum Police Headquarters': {
            location: 'Aevum', server: 'aevum-police',
            company: 'Aevum Police Headquarters',
            companyPositions: ['Security', 'Software']
        },
        'Carmichael Security': {
            location: 'Sector-12',
            company: 'Carmichael Security',
            companyPositions: ['Agent', 'IT', 'Security', 'Software Consultant', 'Software']
        },
        'Galactic Cybersystems': {
            location: 'Aevum', server: 'galactic-cyber',
            company: 'Galactic Cybersystems',
            companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
        },
        'Noodle Bar': {
            location: 'New Tokyo', server: 'n00dles',
            company: 'Noodle Bar',
            companyPositions: ['Waiter', 'part-time Waiter']
        },
        'InfoComm': { server: 'infocomm' },
        'Taiyang Digital': { server: 'taiyang-digital' },
        'ZB Defense Industries': { server: 'zb-def' },
        'Applied Energetics': { server: 'applied-energetics' },
        'Zeus Medical': { server: 'zeus-med' },
        'UnitaLife Group': { server: 'unitalife' },
        'The Hub': { server: 'the-hub' },
        'Johnson Orthopedics': { server: 'johnson-ortho' },
        'ZER0 Nightclub': { server: 'zero' },
        'Nectar Nightclub Network': { server: 'nectar-net' },
        'Neo Nightclub Network': { server: 'neo-net' },
        'Silver Helix': { server: 'silver-helix' },
        'HongFang Teahouse': { server: 'hong-fang-tea' },
        'HaraKiri Sushi Bar Network': { server: 'harakiri-sushi' },
        'Phantasy Club': { server: 'phantasy' },
        'Max Hardware Store': { server: 'max-hardware' },
        'Helios': { server: 'The-Cave' },
        'w0r1d_d43m0n': { server: 'w0r1d_d43m0n' },
        'The Covenant': { faction: 'The Covenant', factionWorkTypes: ['Hacking', 'Field'] },
        'Daedalus': { faction: 'Daedalus', factionWorkTypes: ['Hacking', 'Field'] },
        'Illuminati': { faction: 'Illuminati', factionWorkTypes: ['Hacking', 'Field'] },
        'Iker Molina Casino': { location: 'Aevum' },
        'Sector-12 City Hall': { location: 'Sector-12' },
        'Arcade': { location: 'New Tokyo' },
        '0x6C1': { location: 'Ishima' },
        'Hospital': { general: true },
        'The Slums': { general: true },
        'Travel Agency': { general: true },
        'World Stock Exchange': { general: true },
        'Bladeburners': { location: 'Sector-12', faction: 'Bladeburners' },
        'Church of the Machine God': { location: 'Chongqing', faction: 'Church of the Machine God' },
        'Shadows of Anarchy': { faction: 'Shadows of Anarchy' }
    };
}

/**
 *
 * @return {string[]}
 */
export function getFactions() {
    return Object.values(getOrganisations()).filter(v => v.faction).map(v => v.faction);
}

/**
 *
 * @return {string[]}
 */
export function getCompanies() {
    return Object.values(getOrganisations()).filter(v => v.company).map(v => v.company);
}

/**
 *
 * @return {string[]}
 */
export function getGangs() {
    return Object.values(getOrganisations()).filter(v => v.gang).map(v => v.faction);
}

/**
 *
 * @returns {string[]}
 */
export function getCities() {
    return Object.values(getOrganisations()).filter(v => v.city).map(v => v.location);
}

/**
 *
 * @return {string[]}
 */
export function getGyms() {
    return Object.values(getOrganisations()).filter(v => v.gym).map(v => v.gym);
}

/**
 *
 * @return {string[]}
 */
export function getUniversities() {
    return Object.values(getOrganisations()).filter(v => v.university).map(v => v.university);
}

/**
 *
 * @param {string} faction
 * @returns {string[]}
 */
export function getFactionWorktypes(faction) {
    return Object.values(getOrganisations()).find(v => v.faction === faction).factionWorkTypes;
}

/**
 *
 * @param {string} faction
 * @returns {string[]}
 */
export function getCompanyPositions(company) {
    return Object.values(getOrganisations()).find(v => v.company === company).companyPositions;
}

/**
 *
 * @param {string} symbol
 * @returns {string}
 */
export function symbolToServer(symbol) {
    for (const v of Object.values(getOrganisations())) if (v.stockSymbol === symbol) return v.server;
}

/**
 *
 * @param {string} gym
 * @return {string}
 */
export function getGymLocation(gym) {
    for (const v of Object.values(getOrganisations())) if (v.gym === gym) return v.location;
}

/**
 *
 * @param {string} university
 * @return {string}
 */
export function getUniversityLocation(university) {
    for (const v of Object.values(getOrganisations())) if (v.university === university) return v.location;
}

/**
 *
 * @return {string[]}
 */
export function getCrimes() {
    return ['shoplift', 'rob', 'mug', 'larceny', 'drugs', 'bond', 'traffic', 'homicide', 'grand', 'kidnap',
        'assassinate', 'heist'];
}

/**
 *
 * @param {NS} ns
 * @param {number} minimumRam
 */
export function deployBatchers(ns, minimumRam = 2 ** 14) {
    const scripts = getScripts();
    const servers = getAccessibleServers(ns);
    const hackables = getOptimalHackable(ns, servers);
    // filter and sort servers according to RAM
    const hosts = servers.filter(server => ns.getServerMaxRam(server) >= minimumRam).sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
    // Deploy batchers
    for (let i = 0; i < Math.min(hosts.length, hackables.length); i++) {
        if (!ns.isRunning(scripts.batcher, hosts[i], hackables[i])) {
            ns.scriptKill(scripts.batcher, hosts[i]);
            ns.exec(scripts.batcher, hosts[i], 1, hackables[i]);
        }
    }
}

/**
 *
 * @param {NS} ns
 */
export function manageAndHack(ns) {
    const scripts = getScripts();
    const servers = getAccessibleServers(ns);
    const hackables = getOptimalHackable(ns, servers);
    const [freeRams, filteredHackables] = getFreeRams(ns, servers, hackables);
    const hackstates = getHackStates(ns, servers, filteredHackables);
    for (const target of filteredHackables) {
        const money = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const sec = ns.getServerSecurityLevel(target);
        const secDiff = sec - minSec;
        if (secDiff > 0) {
            const threads = Math.ceil(secDiff * 20) - hackstates.get(target).weaken;
            if (threads > 0 && !findPlaceToRun(ns, scripts.weaken, threads, freeRams, target)) return;
        }
        let moneyPercent = money / maxMoney;
        if (moneyPercent === 0) moneyPercent = 0.1;
        if (moneyPercent < 0.9) {
            const threads = Math.ceil(ns.growthAnalyze(target, 1 / moneyPercent)) - hackstates.get(target).grow;
            if (threads > 0 && !findPlaceToRun(ns, scripts.grow, threads, freeRams, target)) return;
        }
        if (moneyPercent > 0.75 && secDiff < 50) {
            let threads = Math.floor(ns.hackAnalyzeThreads(target, money - (0.4 * maxMoney))) - hackstates.get(target).hack;
            if (threads > 0 && !findPlaceToRun(ns, scripts.hack, threads, freeRams, target)) return;
        }
    }
}

/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {string[]} hackables
 * @returns {Object<number, number, number>}
 */
function getHackStates(ns, servers, hackables) {
    const scripts = getScripts();
    const hackstates = new Map();
    for (let server of servers.values()) {
        for (let hackable of hackables.values()) {
            let weakenScript = ns.getRunningScript(scripts.weaken, server, hackable);
            let growScript = ns.getRunningScript(scripts.grow, server, hackable);
            let hackScript = ns.getRunningScript(scripts.hack, server, hackable);
            if (hackstates.has(hackable)) {
                hackstates.get(hackable).weaken += !weakenScript ? 0 : weakenScript.threads;
                hackstates.get(hackable).grow += !growScript ? 0 : growScript.threads;
                hackstates.get(hackable).hack += !hackScript ? 0 : hackScript.threads;
            } else {
                hackstates.set(hackable, {
                    weaken: !weakenScript ? 0 : weakenScript.threads,
                    grow: !growScript ? 0 : growScript.threads,
                    hack: !hackScript ? 0 : hackScript.threads
                });
            }
        }
    }
    return hackstates;
}

/**
 *
 * @param {NS} ns
 */
export function updateOverview(ns) {
    const doc = eval('document');
    const hook0 = doc.getElementById('overview-extra-hook-0');
    const hook1 = doc.getElementById('overview-extra-hook-1');
    try {
        const headers = [];
        const values = [];
        headers.push(`Income\u00A0`);
        values.push(`${formatMoney(ns, ns.getTotalScriptIncome()[0])}`);
        headers.push(`Karma`);
        values.push(`${formatNumber(ns, ns.heart.break())}`);
        hook0.innerText = headers.join('\n');
        hook1.innerText = values.join('\n');
    } catch (err) {
        ns.print(`ERROR: Update Skipped: ${String(err)}`);
    }
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {null|string[]}
 */
export function routeFinder(ns, server) {
    const route = [];
    const found = recursiveRouteFinder(ns, '', ns.getHostname(), server, route);
    if (found) return route;
    else return null;
}

/**
 *
 * @param {NS} ns
 * @param {string} parent
 * @param {string} host
 * @param {string} server
 * @param {string[]} route
 * @returns {boolean}
 */
export function recursiveRouteFinder(ns, parent, host, server, route) {
    const children = ns.scan(host);
    for (let child of children) {
        if (parent === child) {
            continue;
        }
        if (child === server) {
            route.unshift(child);
            route.unshift(host);
            return true;
        }
        if (recursiveRouteFinder(ns, host, child, server, route)) {
            route.unshift(host);
            return true;
        }
    }
    return false;
}

/**
 *
 * @param {NS} ns
 * @returns {string[]}
 */
export function getServers(ns) {
    const serverList = ['home'];
    for (let s of serverList) ns.scan(s).filter(n => !serverList.includes(n)).forEach(n => serverList.push(n));
    return serverList;
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
 */
export function hackServer(ns, server) {
    if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) return false;
    if (ns.hasRootAccess(server)) return true;
    let portOpened = 0;
    if (ns.fileExists('BruteSSH.exe', 'home')) {
        ns.brutessh(server);
        portOpened++;
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(server);
        portOpened++;
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(server);
        portOpened++;
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(server);
        portOpened++;
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(server);
        portOpened++;
    }
    if (ns.getServerNumPortsRequired(server) <= portOpened) {
        ns.nuke(server);
        return true;
    }
    return false;
}

/**
 *
 * @param {NS} ns
 * @returns {string[]}
 */
export function getAccessibleServers(ns) {
    return getServers(ns).filter(server => hackServer(ns, server) && !server.startsWith('hacknet-node-'));
}

/**
 *
 * @param {NS} ns
 * @param {string} script
 * @param {number} threads
 * @param {Object<string, number>[]} freeRams
 * @param {*[]} scriptArgs
 * @returns {boolean}
 */
export function findPlaceToRun(ns, script, threads, freeRams, ...scriptArgs) {
    const scriptRam = ns.getScriptRam(script);
    let remainingThreads = threads;
    while (freeRams.length > 0) {
        const host = freeRams[0].host;
        const ram = freeRams[0].freeRam;
        if (ram < scriptRam) freeRams.shift();
        else if (ram < scriptRam * remainingThreads) { // Put as many threads as we can
            const threadsForThisHost = Math.floor(ram / scriptRam);
            ns.exec(script, host, threadsForThisHost, ...scriptArgs);
            remainingThreads -= threadsForThisHost;
            freeRams.shift();
        } else { // All remaining threads were placed
            ns.exec(script, host, remainingThreads, ...scriptArgs);
            freeRams[0].freeRam -= scriptRam * remainingThreads;
            return true;
        }
    }
    return false;
}

/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {string[]} hackables
 * @returns {Object<string, number>[] | [Object<string, number>[], string[]]}
 */
export function getFreeRams(ns, servers, hackables) {
    const scripts = getScripts();
    const freeRams = [];
    const unhackables = [];
    for (const server of servers) {
        if (hackables && ns.scriptRunning(scripts.batcher, server)) { // Check if we have a batcher running on this server
            const process = ns.ps(server).find(s => s.filename === scripts.batcher); // Find the process of the batcher
            unhackables.push(process.args[0]); // Don't hack the target of the batcher
            continue; // Don't run scripts on the host
        }
        const freeRam = getFreeRam(ns, server);
        if (freeRam > 0) freeRams.push({ host: server, freeRam: freeRam });
    }
    const sortedFreeRams = freeRams.sort((a, b) => b.freeRam - a.freeRam);
    if (hackables) {
        const filteredHackables = hackables.filter(hackable => !unhackables.includes(hackable));
        return [sortedFreeRams, filteredHackables];
    }
    return sortedFreeRams;
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @return {number}
 */
export function getFreeRam(ns, server, ignoreNonManagerScripts = false) {
    const data = readFromFile(ns, getPortNumbers().reservedRam);
    const reservedRam = (data[server] ?? [{ 'ram': 0 }]).reduce((a, b) => a + b.ram, 0);
    let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server) - reservedRam;
    if (ignoreNonManagerScripts) {
        const managerScripts = getManagerScripts();
        ns.ps(server).forEach(p => {
            const script = p.filename;
            if (!managerScripts.includes(script)) freeRam += ns.getScriptRam(script, server) * p.threads;
        });
    }
    return freeRam;
}

/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {number} cores
 * @returns {string[]}
 */
export function getOptimalHackable(ns, servers, cores = 1) {
    return servers.filter(server => ns.getServerMaxMoney(server) > 0).sort((a, b) => targetCost(ns, b, cores)[0] - targetCost(ns, a, cores)[0]);
}

/**
 *
 * @param {NS} ns
 * @param {string} target
 * @param {number} cores
 * @param {number} hackPercent
 * @param {number} freeRam
 * @returns {[number, number, number]}
 */
export function targetCost(ns, target, cores = 1, hackPercent = 0.5, freeRam = 2 ** 15) {
    const form = ns.formulas.hacking;
    const player = ns.getPlayer(); // Get player info
    const server = ns.getServer(target); // Get server info
    server.hackDifficulty = server.minDifficulty; // Assume server is at min sec
    // Security
    const hackSec = ns.hackAnalyzeSecurity(1); // Sec increase for 1 hack thread
    const growSec = ns.growthAnalyzeSecurity(1); // Sec increase for 1 grow thread
    const weakenSec = ns.weakenAnalyze(1, cores); // Sec decrease for 1 weaken thread
    // Script Rams
    const scripts = getScripts();
    const hackRam = ns.getScriptRam(scripts.hack);
    const growRam = ns.getScriptRam(scripts.grow);
    const weakenRam = ns.getScriptRam(scripts.weaken);

    // RAM calculations

    // Hack threads per hack percent
    const hackThreads = hackPercent / form.hackPercent(server, player);
    // Weaken threads needed per hack thread
    const weakenThreadsPerHackThread = hackSec / weakenSec;
    // Weaken threads per hack thread
    const weakenThreadsAfterHack = weakenThreadsPerHackThread * hackThreads;
    // Percent to grow by 1 thread at min sec
    const growPercent = form.growPercent(server, 1, player, cores);
    // Grow threads needed
    const growThreads = Math.log(1 / (1 - hackPercent)) / Math.log(growPercent);
    // Weaken threads needed per grow thread
    const weakenThreadsPerGrowThread = growSec / weakenSec;
    // Weaken threads needed per grow thread
    const weakenThreadsAfterGrow = weakenThreadsPerGrowThread * growThreads;
    // Cycle RAM
    const cycleRam = hackThreads * hackRam + growThreads * growRam + (weakenThreadsAfterHack + weakenThreadsAfterGrow) * weakenRam;
    // Number of cycles in one cycle group
    const cycleCount = Math.floor(freeRam / cycleRam);
    // Group RAM
    const groupRam = cycleRam * cycleCount;

    // Stolen money calculations

    // Chance to hack at min sec
    const chance = form.hackChance(server, player);
    // Average money stolen per cycle
    const averageMoneyPerCycle = server.moneyMax * hackPercent * chance;
    // Average money stolen per group
    const averageMoneyPerGroup = averageMoneyPerCycle * cycleCount;

    // Time taken calculations

    // Time taken for weaken
    const weakenTime = form.weakenTime(server, player);
    // Time taken from one cycle to the next
    const cycleDelay = weakenTime / cycleCount;
    // Time taken from one group to the next
    const groupDelay = cycleDelay * cycleCount; // equivalent to weaken time

    // Cost function calculations

    // Average Money per unit Ram per unit time
    const averageMoneyPerRamPerTime = averageMoneyPerGroup / (2 * groupDelay * groupRam);
    // Average money stolen per unit Ram
    const averageMoneyPerRam = averageMoneyPerRamPerTime * (2 * groupDelay);
    // Average money stolen per unit time
    const averageMoneyPerTime = averageMoneyPerGroup * groupRam;

    // Cost
    return [averageMoneyPerRamPerTime, averageMoneyPerRam, averageMoneyPerTime];
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {number}
 */
export function altTargetCost(ns, server) { // Doesn't use Formulas
    const hack = ns.hackAnalyzeChance(server) * ns.hackAnalyze(server) * ns.getServerMaxMoney(server) ** 4 / ns.getHackTime(server);
    const grow = ns.getGrowTime(server) * ns.growthAnalyze(server, 2) ** 2;
    const weaken = ns.getWeakenTime(server) * ns.getServerMinSecurityLevel(server) ** 2;
    return hack / (grow * weaken);
}

/**
 *
 * @returns {Object<string, number>[]}
 */
export function getCracks() {
    return [
        { name: 'BruteSSH.exe', level: 50 },
        { name: 'FTPCrack.exe', level: 100 },
        { name: 'relaySMTP.exe', level: 300 },
        { name: 'HTTPWorm.exe', level: 400 },
        { name: 'SQLInject.exe', level: 800 }
    ];
}

/**
 *
 * @returns {string[]}
 */
export function getUsefulPrograms() {
    return ['ServerProfiler.exe', 'AutoLink.exe', 'DeepscanV1.exe', 'DeepscanV2.exe'];
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
 */
export function promptScriptRunning(ns, server) {
    for (const script of getPromptScripts()) if (ns.scriptRunning(script, server)) return true;
    return false;
}

/**
 *
 * @returns {string[]}
 */
function getPromptScripts() {
    const scripts = getScripts();
    return [
        scripts.joinFactions,
        scripts.upgradeHomeRam,
        scripts.upgradeHomeCores,
        '/augmentations/install.js',
        '/augmentations/purchase.js',
        '/build/script-remover.js'
    ];
}

/**
 *
 * @param {NS} ns
 * @param {string} script
 * @param {string} server
 * @returns {boolean}
 */
export function enoughRam(ns, script, server = ns.getHostname(), threads = 1) {
    return ns.getScriptRam(script, server) * threads <= getFreeRam(ns, server);
}

/**
 *
 * @returns {Object<number>}
 */
export function getPortNumbers() {
    return {
        general: 0,
        reservedRam: 1,
        gang: 2,
        corp: 3,
        augmentations: 4,
        hack: 5,
        bladeburner: 7,
        stock: 8,
        hacknet: 9,
        sleeve: 10,
        stanek: 13
    };
}

/**
 *
 * @param {number} portNumber
 * @returns {Object<*>}
 */
export function defaultPortData(portNumber) {
    switch (portNumber) {
        case 0:
            return { bitnodeN: 1, contractor: true };
        case 1:
            return { 'home': [{ 'ram': 64, 'server': 'DEF', 'pid': 'DEF' }] };
        case 2:
            return undefined;
        case 3:
            return undefined;
        case 4:
            return undefined;
        case 5:
            return undefined;
        case 6:
            return undefined;
        case 7:
            return undefined;
        case 8:
            return { long: [], short: [] };
        case 9:
            return undefined;
        case 10: {
            const sleeves = {};
            for (let i = 0; i < 8; i++) {
                sleeves[`sleeve-${i}`] = {
                    task: 'Idle',
                    usefulFaction: false,
                    usefulCompany: false
                };
            }
            return sleeves;
        }
        case 11:
            return undefined;
        case 12:
            return undefined;
        case 13:
            return { pattern: 'starter', maxCharges: 50 };
        case 14:
            return undefined;
        case 15:
            return undefined;
        case 16:
            return undefined;
        case 17:
            return undefined;
        case 18:
            return undefined;
        case 19:
            return undefined;
        case 20:
            return undefined;
        default:
            throw new Error(`Trying to use an invalid port: ${portNumber}. Only ports 1-20 are valid.`);
    }
}

/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function initData(ns) {
    const bitnodeData = readFromFile(ns, 0);
    for (let i = 1; i <= 20; i++)
        if (ns.getPlayer().bitNodeN !== bitnodeData.bitNodeN || !ns.fileExists(`/data/${i}.txt`))
            await writeToFile(ns, i, defaultPortData(i));
    await writeToFile(ns, 0, { bitnodeN: ns.getPlayer().bitNodeN });
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @return {Promise<void>}
 */
export async function resetData(ns, portNumber) {
    await writeToFile(ns, portNumber, defaultPortData(portNumber));
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @param {boolean} write
 * @param {boolean} clear
 * @returns {Object<*>}
 */
export function getDataFromPort(ns, portNumber, write = true, clear = true) {
    const port = ns.getPortHandle(portNumber);
    const data = port.empty() ? defaultPortData(portNumber) : port.read();
    if (clear) port.clear();
    if (write) port.write(data);
    return data;
}

/**
 *
 * @param {number} portNumber
 * @returns {string}
 */
export function getFileHandle(portNumber) {
    return `/data/${portNumber}.txt`;
}

/**
 *
 * @param {NS} ns
 * @param {string} handle
 * @param {*} data
 * @param {string} mode
 */
export async function writeToFile(ns, portNumber, data, mode = 'w') {
    if (typeof data !== 'string') data = JSON.stringify(data);
    await ns.write(getFileHandle(portNumber), data, mode);
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @param {boolean} saveToFile
 * @param {string} mode
 * @returns {Object<*>}
 */
export function readFromFile(ns, portNumber) {
    const data = ns.read(getFileHandle(portNumber));
    return data ? JSON.parse(data) : defaultPortData(portNumber);
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @param {Object<*>} data
 * @param {string} mode
 * @returns {Promise<void>}
 */
export async function modifyFile(ns, portNumber, dataToModify, mode = 'w') {
    const data = readFromFile(ns, portNumber);
    const updatedData = recursiveModify(data, dataToModify);
    await writeToFile(ns, portNumber, updatedData, mode);
}

/**
 *
 * @param {Object<*>} data
 * @param {Object<*>} dataToModify
 * @returns {Object<*>}
 */
function recursiveModify(data, dataToModify) {
    for (const [key, val] of Object.entries(dataToModify)) {
        if (typeof val === 'object' && !Array.isArray(val) && data[key]) {
            const _data = data[key];
            recursiveModify(_data, val);
            data[key] = _data;
        } else data[key] = val;
    }
    return data;
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @param {ram} number
 * @returns {Promise<void>}
 */
export async function reserveRam(ns, server, ram) {
    const portNumber = getPortNumbers().reservedRam;
    const data = readFromFile(ns, portNumber);
    const updatedData = data[server] ?? [];
    updatedData.push({ 'ram': ram, 'server': ns.getRunningScript().server, 'pid': ns.getRunningScript().pid });
    const dataToModify = { [server]: updatedData };
    await modifyFile(ns, portNumber, dataToModify);
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {Promise<void>}
 */
export async function unreserveRam(ns, server) {
    const portNumber = getPortNumbers().reservedRam;
    const scriptHost = ns.getRunningScript().server;
    const pid = ns.getRunningScript().pid;
    const data = readFromFile(ns, portNumber);
    const updatedData = data[server].filter(e => e.server !== scriptHost || e.pid !== pid);
    const dataToModify = { [server]: updatedData };
    await modifyFile(ns, portNumber, dataToModify);
}

/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function updateReservedRam(ns) {
    const portNumber = getPortNumbers().reservedRam;
    const data = readFromFile(ns, portNumber);
    const updatedData = {};
    Object.entries(data).forEach(([k, v]) => updatedData[k] = v.filter(e => e.pid === 'DEF' || ns.ps(e.server).some(s => s.pid === e.pid)));
    await writeToFile(ns, portNumber, updatedData);
}

/**
 *
 * @param {NS} ns
 * @param {number} n
 * @return {string}
 */
export function formatNumber(ns, n) {
    return isNaN(n) ? 'NaN' : ns.nFormat(n, '0.000a');
}

/**
 *
 * @param {NS} ns
 * @param {number} n
 * @return {string}
 */
export function formatMoney(ns, n) {
    return isNaN(n) ? 'NaN' : ns.nFormat(n, '$0.000a');
}

/**
 *
 * @param {NS} ns
 * @param {number} b
 * @return {string}
 */
export function formatRam(ns, b) {
    return isNaN(b) ? 'NaN' : ns.nFormat(b * 1e9, '0.00b');
}

/**
 *
 * @param {number} n
 * @param {number} round
 * @return {string}
 */
export function formatPercentage(n, round = 2) {
    return isNaN(n) ? 'NaN%' : `${(n * 100).toFixed(round)}%`;
}

/**
 *
 * @param {NS} ns
 * @param {number} t
 * @param {boolean} milliPrecision
 * @return {string}
 */
export function formatTime(ns, t, milliPrecision = false) {
    return isNaN(t) ? 'NaN' : ns.tFormat(t, milliPrecision);
}