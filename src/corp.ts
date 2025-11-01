/**
 * Automated Corporation Management Script
 * 
 * This script automates corporation creation, startup phase, and ongoing management.
 * Based on patterns from inigo/bitburner-scripts but simplified for standalone use.
 * 
 * Usage: run corp.ts
 * 
 * The script will:
 * 1. Create a corporation if you don't have one
 * 2. Set up initial divisions (Software industry)
 * 3. Manage offices, warehouses, and employees
 * 4. Handle product development and pricing
 * 5. Accept investment offers when appropriate
 * 6. Eventually go public
 */

import { NS, CityName, Division, Product } from '@ns';

const CITIES: CityName[] = [
    CityName.Sector12,
    CityName.Aevum,
    CityName.Chongqing,
    CityName.NewTokyo,
    CityName.Ishima,
    CityName.Volhaven
];
const INDUSTRY = "Software";
const DIVISION_NAME = "TechCorp";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.tail();

    // Check if we already have a corporation
    if (!hasCorporation(ns)) {
        ns.tprint("Creating new corporation...");
        if (!await createCorporation(ns)) {
            ns.tprint("Failed to create corporation. Need $150b or be in BN3.");
            return;
        }
    }

    const investmentRound = ns.corporation.getInvestmentOffer().round;

    if (investmentRound === 1) {
        // Startup phase - get first investment
        ns.tprint("Starting corporation startup phase...");
        await runStartupPhase(ns);
    } else {
        // Management phase - ongoing operations
        ns.tprint("Starting corporation management phase...");
        await runManagementPhase(ns);
    }
}

function hasCorporation(ns: NS): boolean {
    try {
        ns.corporation.getCorporation();
        return true;
    } catch {
        return false;
    }
}

async function createCorporation(ns: NS): Promise<boolean> {
    try {
        const selfFund = ns.getResetInfo().currentNode !== 3;
        return ns.corporation.createCorporation("TechCorp Inc", selfFund);
    } catch {
        return false;
    }
}

async function runStartupPhase(ns: NS): Promise<void> {
    ns.print("=== Startup Phase ===");

    // Create software division
    if (!hasDivision(ns, INDUSTRY)) {
        ns.corporation.expandIndustry(INDUSTRY, DIVISION_NAME);
        ns.print(`Created ${INDUSTRY} division: ${DIVISION_NAME}`);
    }

    // Unlock Smart Supply
    if (!ns.corporation.hasUnlock("Smart Supply")) {
        ns.corporation.purchaseUnlock("Smart Supply");
        ns.print("Unlocked Smart Supply");
    }

    // Upgrade storage
    while (ns.corporation.getUpgradeLevel("Smart Storage") < 5) {
        ns.corporation.levelUpgrade("Smart Storage");
    }

    // Set up offices in all cities
    for (const city of CITIES) {
        await setupOffice(ns, city);
    }

    ns.print("Waiting for warehouses to fill...");
    let lastReport = Date.now();

    while (!allWarehousesFull(ns)) {
        await ns.sleep(10000);

        // Report progress every 60 seconds
        if (Date.now() - lastReport > 60000) {
            reportStatus(ns);
            lastReport = Date.now();
        }
    }

    ns.print("Warehouses full! Preparing for investment...");
    await prepareForInvestment(ns);

    // Accept investment
    const offer = ns.corporation.getInvestmentOffer().funds;
    ns.tprint(`Accepting investment offer of $${ns.formatNumber(offer)}`);
    ns.corporation.acceptInvestmentOffer();

    ns.print("=== Startup Phase Complete ===");
    ns.tprint("Corporation startup complete! Run corp.ts again to continue management.");
}

async function setupOffice(ns: NS, city: CityName): Promise<void> {
    // Expand to city if not already there
    try {
        ns.corporation.getOffice(DIVISION_NAME, city);
    } catch {
        ns.corporation.expandCity(DIVISION_NAME, city);
        ns.corporation.purchaseWarehouse(DIVISION_NAME, city);
    }

    // Set up warehouse
    const warehouse = ns.corporation.getWarehouse(DIVISION_NAME, city);
    while (warehouse.size < 300) {
        ns.corporation.upgradeWarehouse(DIVISION_NAME, city);
    }

    // Enable smart supply
    ns.corporation.setSmartSupply(DIVISION_NAME, city, true);

    // Hire employees
    const office = ns.corporation.getOffice(DIVISION_NAME, city);
    if (office.size < 3) {
        ns.corporation.upgradeOfficeSize(DIVISION_NAME, city, 3 - office.size);
    }

    while (office.numEmployees < office.size) {
        ns.corporation.hireEmployee(DIVISION_NAME, city);
    }

    // Assign employees (balanced for software)
    if (city === "Sector-12") {
        // Main office focuses on R&D initially
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Engineer", 1);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Management", 1);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Operations", 1);
    } else {
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Engineer", 1);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Operations", 1);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Management", 1);
    }

    // Start selling materials
    ns.corporation.sellMaterial(DIVISION_NAME, city, "AI Cores", "MAX", "MP");
    ns.corporation.sellMaterial(DIVISION_NAME, city, "Hardware", "MAX", "MP");
    ns.corporation.sellMaterial(DIVISION_NAME, city, "Real Estate", "MAX", "MP");
    ns.corporation.sellMaterial(DIVISION_NAME, city, "Robots", "MAX", "MP");

    ns.print(`Office setup complete in ${city}`);
}

async function prepareForInvestment(ns: NS): Promise<void> {
    ns.print("Switching employees to Business roles...");

    for (const city of CITIES) {
        // Unassign all
        const office = ns.corporation.getOffice(DIVISION_NAME, city);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Unassigned", office.numEmployees);
        await ns.sleep(100);
    }

    await ns.sleep(1000);

    for (const city of CITIES) {
        // Assign all to Business
        const office = ns.corporation.getOffice(DIVISION_NAME, city);
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, city, "Business", office.numEmployees);
    }

    ns.print("Buying advertisements...");
    while (ns.corporation.getHireAdVertCost(DIVISION_NAME) <= ns.corporation.getCorporation().funds) {
        ns.corporation.hireAdVert(DIVISION_NAME);
    }

    // Wait for offer to improve
    ns.print("Waiting for investment offer to improve...");
    await ns.sleep(5000);
}

async function runManagementPhase(ns: NS): Promise<void> {
    ns.print("=== Management Phase ===");

    const maxProducts = getMaxProducts(ns);
    ns.print(`Can have up to ${maxProducts} products`);

    while (true) {
        // Get investment offer status
        const investmentOffer = ns.corporation.getInvestmentOffer();
        const timesInvested = investmentOffer.round - 1;

        // Manage products
        await manageProducts(ns, maxProducts, timesInvested >= 2);

        // Buy upgrades
        await buyUpgrades(ns);

        // Consider second investment
        if (timesInvested === 1) {
            const productsComplete = countCompleteProducts(ns) >= 3;
            if (productsComplete) {
                ns.tprint("Accepting second investment offer...");
                ns.corporation.acceptInvestmentOffer();
            }
        }

        // Consider going public
        if (!ns.corporation.getCorporation().public && timesInvested >= 2) {
            const corp = ns.corporation.getCorporation();
            const income = corp.revenue - corp.expenses;
            if (income > 1e15) { // 1 quadrillion per second
                ns.tprint("Going public!");
                ns.corporation.goPublic(0);
                ns.corporation.issueDividends(0.5);
            }
        }

        reportStatus(ns);
        await ns.sleep(10000);
    }
}

async function manageProducts(ns: NS, maxProducts: number, allowRetiring: boolean): Promise<void> {
    const division = ns.corporation.getDivision(DIVISION_NAME);
    const products = division.products;

    if (products.length === 0 || allProductsComplete(ns, products)) {
        if (products.length < maxProducts) {
            // Create new product
            const productName = generateProductName();
            const funds = ns.corporation.getCorporation().funds;
            const investment = Math.floor(funds / 10);

            ns.print(`Creating new product: ${productName} with $${ns.formatNumber(investment)} investment`);
            ns.corporation.makeProduct(DIVISION_NAME, "Sector-12", productName, investment, investment);
        } else if (allowRetiring && products.length === maxProducts) {
            // Retire oldest product
            const oldestProduct = products[0];
            ns.print(`Retiring oldest product: ${oldestProduct}`);
            ns.corporation.discontinueProduct(DIVISION_NAME, oldestProduct);
        }
    }

    // Set prices for complete products
    for (const productName of products) {
        const product = ns.corporation.getProduct(DIVISION_NAME, "Sector-12", productName);
        if (product.developmentProgress >= 100) {
            // Use TA.II if available, otherwise set manual price
            if (ns.corporation.hasResearched(DIVISION_NAME, "Market-TA.II")) {
                ns.corporation.setProductMarketTA2(DIVISION_NAME, productName, true);
            } else {
                ns.corporation.sellProduct(DIVISION_NAME, "Sector-12", productName, "MAX", "MP", true);
            }
        }
    }
}

async function buyUpgrades(ns: NS): Promise<void> {
    const funds = ns.corporation.getCorporation().funds;
    const threshold = funds * 0.1; // Spend up to 10% of funds

    // Buy Wilson Analytics
    let cost = ns.corporation.getUpgradeLevelCost("Wilson Analytics");
    if (cost < threshold) {
        ns.corporation.levelUpgrade("Wilson Analytics");
    }

    // Buy advertisements
    cost = ns.corporation.getHireAdVertCost(DIVISION_NAME);
    if (cost < threshold) {
        ns.corporation.hireAdVert(DIVISION_NAME);
    }

    // Expand main office
    const mainOffice = ns.corporation.getOffice(DIVISION_NAME, "Sector-12");
    cost = ns.corporation.getOfficeSizeUpgradeCost(DIVISION_NAME, "Sector-12", 15);
    if (mainOffice.size < 60 && cost < threshold) {
        ns.corporation.upgradeOfficeSize(DIVISION_NAME, "Sector-12", 15);
        while (mainOffice.numEmployees < mainOffice.size) {
            ns.corporation.hireEmployee(DIVISION_NAME, "Sector-12");
        }
        // Rebalance employees (heavy R&D focus)
        const total = mainOffice.numEmployees;
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, "Sector-12", "Research & Development", Math.floor(total * 0.6));
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, "Sector-12", "Engineer", Math.floor(total * 0.15));
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, "Sector-12", "Management", Math.floor(total * 0.15));
        ns.corporation.setAutoJobAssignment(DIVISION_NAME, "Sector-12", "Business", Math.floor(total * 0.1));
    }
}

// Helper functions
function hasDivision(ns: NS, industry: string): boolean {
    const corp = ns.corporation.getCorporation();
    return corp.divisions.some(div => ns.corporation.getDivision(div).type === industry);
}

function allWarehousesFull(ns: NS): boolean {
    for (const city of CITIES) {
        const warehouse = ns.corporation.getWarehouse(DIVISION_NAME, city);
        if (warehouse.sizeUsed / warehouse.size < 0.98) {
            return false;
        }
    }
    return true;
}

function getMaxProducts(ns: NS): number {
    let max = 3;
    if (ns.corporation.hasResearched(DIVISION_NAME, "uPgrade: Capacity.I")) max++;
    if (ns.corporation.hasResearched(DIVISION_NAME, "uPgrade: Capacity.II")) max++;
    return max;
}

function allProductsComplete(ns: NS, products: string[]): boolean {
    for (const productName of products) {
        const product = ns.corporation.getProduct(DIVISION_NAME, "Sector-12", productName);
        if (product.developmentProgress < 100) {
            return false;
        }
    }
    return true;
}

function countCompleteProducts(ns: NS): number {
    const division = ns.corporation.getDivision(DIVISION_NAME);
    let count = 0;
    for (const productName of division.products) {
        const product = ns.corporation.getProduct(DIVISION_NAME, "Sector-12", productName);
        if (product.developmentProgress >= 100) count++;
    }
    return count;
}

let productCounter = 0;
function generateProductName(): string {
    const adjectives = ["Smart", "Pro", "Elite", "Ultra", "Mega", "Super", "Hyper", "Max"];
    const nouns = ["Soft", "Code", "Tech", "Suite", "App", "Tool", "Ware", "System"];
    const adj = adjectives[productCounter % adjectives.length];
    const noun = nouns[Math.floor(productCounter / adjectives.length) % nouns.length];
    productCounter++;
    return `${adj}${noun}${productCounter}`;
}

function reportStatus(ns: NS): void {
    const corp = ns.corporation.getCorporation();
    const division = ns.corporation.getDivision(DIVISION_NAME);
    const revenue = corp.revenue;
    const expenses = corp.expenses;
    const profit = revenue - expenses;

    ns.print("=== Corporation Status ===");
    ns.print(`Funds: $${ns.formatNumber(corp.funds)}`);
    ns.print(`Revenue: $${ns.formatNumber(revenue)}/s`);
    ns.print(`Expenses: $${ns.formatNumber(expenses)}/s`);
    ns.print(`Profit: $${ns.formatNumber(profit)}/s`);
    ns.print(`Products: ${division.products.length}`);
    ns.print(`Investment Round: ${ns.corporation.getInvestmentOffer().round - 1}`);
    if (corp.public) {
        ns.print(`Public: Yes (${(corp.numShares / corp.totalShares * 100).toFixed(1)}% owned)`);
    }
}
