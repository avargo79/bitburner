import { NS } from "@ns";

// ===== CORE SERVER DATA INTERFACE =====
export interface ServerData {
    hostname: string;
    hasAdminRights: boolean;
    purchasedByPlayer: boolean;
    requiredHackingSkill: number;
    maxRam: number;
    ramUsed: number;
    moneyMax: number;
    moneyAvailable: number;
    hackDifficulty: number;
    minDifficulty: number;
    hackTime: number;
    weakenTime: number;
    growTime: number;
}

// ===== FACTION DETECTION INTERFACES =====
export interface FactionWorkStatus {
    isWorkingForFaction: boolean;
    detectedFactionName: string | null;
    lastDetectionTime: number;
    detectionMethod: 'dom-text' | 'manual';
    workDuration: number;
    consecutiveDetections: number;
    lastStatusChange: number;
}

// ===== SHARE SYSTEM INTERFACES =====
export interface ShareCalculationResult {
    baseThreads: number;
    effectiveThreads: number;
    intelligenceBonus: number;
    coreBonus: number;
    reputationBonus: number;
    totalRAMRequired: number;
    ramPerThread: number;
}

export interface ServerShareData {
    hostname: string;
    cpuCores: number;
    availableRAM: number;
    maxRam: number;
    ramUsed: number;
}

export interface ShareConfiguration {
    ramPercentage: number;
    minimumThreads: number;
    maximumThreads: number;
    priorityCoreThreshold: number;
    intelligenceOptimization: boolean;
}

export interface ServerResourceProfile {
    hostname: string;
    cpuCores: number;
    availableRAM: number;
    maxRam: number;
    ramUsed: number;
    maxShareThreads: number;
    efficiencyScore: number;
    isPurchased: boolean;
    isEligible: boolean;
    ramUtilization: number;
    allocationPriority: number;
}

export interface ShareOptimizationResult {
    eligibleServers: ServerResourceProfile[];
    ineligibleServers: ServerResourceProfile[];
    totalAvailableThreads: number;
    totalAvailableRAM: number;
    averageEfficiencyScore: number;
    highPerformanceServerCount: number;
    recommendations: string[];
}

// ===== HWGW BATCH INTERFACES =====
export interface IHWGWBatch {
    target: ServerData;
    hackThreads: number;
    weakenAfterHackThreads: number;
    growThreads: number;
    weakenAfterGrowThreads: number;
    totalThreads: number;
    executionTime: number;
    hackDelay: number;
    weakenAfterHackDelay: number;
    growDelay: number;
    weakenAfterGrowDelay: number;
}

export interface IPrepBatch {
    target: ServerData;
    prepOperation: 'weaken' | 'grow';
    threads: number;
    totalThreads: number;
    executionTime: number;
    delay: number;
}

// ===== EXECUTION RESULT INTERFACES =====
export interface IExecutionResult {
    totalScripts: number;
    successfulScripts: number;
    failedScripts: number;
    totalThreadsAllocated: number;
    ramUtilized: number;
}

export interface IRepboostExecutionResult {
    isActive: boolean;
    ramUsed: number;
    deployedServers: number;
    totalThreads: number;
    effectiveThreads: number;
    detectedFaction: string | null;
    stabilityStatus: string;
}

export interface IRepboostAllocationResult {
    ramUsed: number;
    updatedAllocation: any;
    updatedAllocationTime: number;
}

// ===== SERVER MANAGEMENT INTERFACES =====
export interface IPurchasedServerResult {
    bought: number;
    upgraded: number;
    currentCount: number;
    targetRamPower: number;
}

export interface IServerManagementResult {
    rootedCount: number;
    purchasedServers: IPurchasedServerResult;
}

// ===== BOTNET OPTIONS TYPE =====
export interface BotnetOptions {
    debug: boolean;
    repeat: boolean;
    rooting: boolean;
    cleanup: boolean;
    'max-servers': number;
    'target-ram-power': number;
    repboost: boolean;
    'repboost-ram-percentage': number;
    'repboost-min-threads': number;
    'repboost-max-threads': number;
    'repboost-core-threshold': number;
    'repboost-stability-delay': number;
    'repboost-intelligence-opt': boolean;
    'repboost-debug': boolean;
}

// ===== RAM SNAPSHOT INTERFACES =====
export interface NetworkRAMSnapshot {
    totalAvailable: number;
    totalMax: number;
    totalUsed: number;
    servers: Array<{
        hostname: string;
        availableRAM: number;
        maxRAM: number;
        usedRAM: number;
    }>;
}

// ===== STATUS MONITORING INTERFACES =====
export interface StatusData {
    playerHackLevel: number;
    playerMoney: number;
    totalServers: number;
    rootedServers: number;
    purchasedServers: number;
    topTargets: ServerData[];
    activeBatches: number;
    networkRAM: {
        total: number;
        available: number;
        utilization: number;
    };
}

// ===== DEBUG LOGGING ENUMS =====
export enum DebugLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5
}

export enum DebugCategory {
    SYSTEM = 'SYSTEM',
    REPBOOST = 'REPBOOST', 
    HWGW = 'HWGW',
    SERVER = 'SERVER',
    NETWORK = 'NETWORK',
    ALLOCATION = 'ALLOCATION',
    EXECUTION = 'EXECUTION'
}

// ===== UTILITY TYPE DEFINITIONS =====
export type ServerFilter = (server: ServerData) => boolean;
export type ServerComparator = (a: ServerData, b: ServerData) => number;
export type TargetSelector = (servers: ServerData[]) => ServerData[];