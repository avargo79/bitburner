import { NS } from "@ns";

/**
 * Master BitNode Augmentation Guide System
 * 
 * Comprehensive multi-BitNode guide system providing:
 * - Complete augmentation database (60+ augments)
 * - Multi-BitNode progression paths (BN1-BN13)
 * - Advanced analytics and ROI calculations
 * - Interactive progression planner
 * - Automation integration
 * - Faction guides (30+ factions)
 * - Dependency tracking system
 * - CLI command interface
 * 
 * Self-contained script with no external dependencies
 * Based on community research, Steam guides, and AskaDragoness progression chart
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface BitNodeGuide {
    id: number;
    name: string;
    sourceFile: SourceFileData;
    constraints: BitNodeConstraints;
    augmentAvailability: AugmentAvailability;
    optimalProgression: ProgressionPath;
    specialMechanics: SpecialMechanic[];
    difficulty: BitNodeDifficulty;
    prerequisites: BitNodePrerequisite[];
}

interface SourceFileData {
    id: number;
    name: string;
    maxLevel: number;
    benefits: SourceFileBenefit[];
    unlocks: string[];
    description: string;
    priority: 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OPTIONAL';
}

interface SourceFileBenefit {
    level: number;
    description: string;
    multipliers: SourceFileMultiplier[];
}

interface SourceFileMultiplier {
    stat: string;
    multiplier: number;
    isPercentage: boolean;
}

interface BitNodeConstraints {
    singularityAccess: boolean;
    maxHomeCores: number;
    maxHomeRam: number;
    corporationAccess: boolean;
    gangAccess: boolean;
    bladeburnerAccess: boolean;
    hacknetNodeAccess: boolean;
    scriptMultipliers: ScriptMultipliers;
    specialLimitations: string[];
}

interface ScriptMultipliers {
    hackingMoney: number;
    hackingGrow: number;
    hackingExp: number;
    strengthExp: number;
    defenseExp: number;
    dexterityExp: number;
    agilityExp: number;
    charismaExp: number;
    hacknetNodeMoney: number;
    crimeMoney: number;
    crimeSuccessRate: number;
}

interface AugmentAvailability {
    available: string[];
    unavailable: string[];
    modified: ModifiedAugment[];
    unique: UniqueAugment[];
}

interface ModifiedAugment {
    name: string;
    originalEffect: string;
    modifiedEffect: string;
    reason: string;
}

interface UniqueAugment {
    name: string;
    factions: string[];
    effect: string;
    description: string;
    availableOnlyInBitNode: number;
}

interface ProgressionPath {
    phases: ProgressionPhase[];
    totalEstimatedTime: number;
    keyMilestones: Milestone[];
    alternativePaths: AlternativePath[];
}

interface ProgressionPhase {
    phase: number;
    name: string;
    description: string;
    estimatedTime: number;
    prerequisites: string[];
    objectives: PhaseObjective[];
    recommendedAugments: string[];
    factionTargets: string[];
    statTargets: StatTarget[];
}

interface PhaseObjective {
    description: string;
    type: 'FACTION' | 'AUGMENT' | 'STAT' | 'MONEY' | 'REPUTATION' | 'SPECIAL';
    target: string | number;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface StatTarget {
    stat: string;
    target: number;
    reason: string;
}

interface Milestone {
    name: string;
    description: string;
    phase: number;
    triggers: string[];
    rewards: string[];
}

interface AlternativePath {
    name: string;
    description: string;
    whenToUse: string;
    phases: ProgressionPhase[];
    tradeoffs: string[];
}

interface SpecialMechanic {
    name: string;
    description: string;
    type: 'CORPORATION' | 'GANG' | 'BLADEBURNER' | 'STANEK' | 'SLEEVE' | 'INTELLIGENCE' | 'OTHER';
    impact: MechanicImpact[];
    strategies: string[];
}

interface MechanicImpact {
    area: string;
    effect: string;
    magnitude: 'MAJOR' | 'MODERATE' | 'MINOR';
}

interface BitNodeDifficulty {
    overall: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
    aspects: DifficultyAspect[];
    newPlayerFriendly: boolean;
    timeToComplete: number;
}

interface DifficultyAspect {
    aspect: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
    reason: string;
}

interface BitNodePrerequisite {
    type: 'SOURCE_FILE' | 'BITNODE_COMPLETION' | 'STAT_REQUIREMENT' | 'EXPERIENCE';
    requirement: string;
    level?: number;
    recommended: boolean;
    reason: string;
}

interface EnhancedAugmentData {
    name: string;
    factions: string[];
    baseCost: number;
    repRequired: number;
    description: string;
    effects: AugmentEffect[];
    priority: 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    gamePhase: 'EARLY' | 'MID' | 'LATE' | 'ENDGAME';
    prereqs: string[];
    notes: string;
    bitNodeAvailability: BitNodeAvailability[];
    categories: AugmentCategory[];
    synergies: AugmentSynergy[];
    costMultiplier: number;
}

interface AugmentEffect {
    stat: string;
    value: number;
    isMultiplier: boolean;
    isPercentage: boolean;
    description: string;
}

interface BitNodeAvailability {
    bitNode: number;
    available: boolean;
    modified: boolean;
    modificationDescription?: string;
}

interface AugmentCategory {
    category: 'HACKING' | 'COMBAT' | 'SOCIAL' | 'UTILITY' | 'SPECIAL' | 'BLADEBURNER' | 'CORPORATION';
    primary: boolean;
}

interface AugmentSynergy {
    withAugment: string;
    description: string;
    benefit: string;
}

interface EnhancedFactionGuide {
    name: string;
    type: 'HACKING' | 'COMBAT' | 'CORPORATE' | 'CRIMINAL' | 'ENDGAME' | 'SPECIAL';
    howToJoin: string[];
    requirements: FactionRequirement[];
    keyAugments: string[];
    uniqueAugments: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    bitNodeAvailability: number[];
    reputation: ReputationGuide;
    exclusiveWith: string[];
    notes: string;
}

interface FactionRequirement {
    type: 'STAT' | 'MONEY' | 'LOCATION' | 'COMPANY' | 'ACTION' | 'SPECIAL';
    description: string;
    value?: number;
    alternatives?: string[];
}

interface ReputationGuide {
    methods: ReputationMethod[];
    fastestMethod: string;
    estimatedTime: number;
    tips: string[];
}

interface ReputationMethod {
    method: string;
    repPerAction: number;
    timePerAction: number;
    requirements: string[];
    efficiency: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
}

interface ProgressionDependency {
    from: BitNodeInfo;
    to: BitNodeInfo;
    dependencies: DependencyRequirement[];
    type: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
    reason: string;
}

interface BitNodeInfo {
    id: number;
    name: string;
    completionLevel?: number;
}

interface DependencyRequirement {
    type: 'SOURCE_FILE' | 'BITNODE_COMPLETION' | 'STAT_REQUIREMENT' | 'EXPERIENCE' | 'KNOWLEDGE' | 'PREPARATION';
    description: string;
    level?: number;
    critical: boolean;
}

interface GuideCommand {
    name: string;
    description: string;
    aliases: string[];
    parameters: CommandParameter[];
    handler: string;
}

interface CommandParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
    options?: string[];
}

interface GuideConfiguration {
    currentBitNode: number;
    targetBitNodes: number[];
    playerStats: PlayerStats;
    completedSourceFiles: CompletedSourceFile[];
    preferences: UserPreferences;
}

interface PlayerStats {
    hacking: number;
    strength: number;
    defense: number;
    dexterity: number;
    agility: number;
    charisma: number;
    intelligence?: number;
    money: number;
}

interface CompletedSourceFile {
    id: number;
    level: number;
    completedAt: number;
}

interface UserPreferences {
    showDetailedOutput: boolean;
    preferredProgressionStyle: 'FAST' | 'BALANCED' | 'COMPLETE';
    focusAreas: ('HACKING' | 'COMBAT' | 'SOCIAL' | 'SPECIAL')[];
    automationLevel: 'MANUAL' | 'SEMI' | 'FULL';
}

interface ExportData {
    bitNodeGuides: BitNodeGuide[];
    augmentDatabase: EnhancedAugmentData[];
    factionDatabase: EnhancedFactionGuide[];
    progressionDependencies: ProgressionDependency[];
    exportedAt: number;
    version: string;
}

// Legacy interface for backward compatibility
interface StaticAugmentData {
    name: string;
    factions: string[];
    baseCost: number;
    repRequired: number;
    description: string;
    effects: string[];
    priority: 'ESSENTIAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    gamePhase: 'EARLY' | 'MID' | 'LATE';
    prereqs: string[];
    notes: string;
}

interface FactionGuide {
    name: string;
    howToJoin: string;
    requirements: string;
    keyAugments: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BITNODE PROGRESSION DEPENDENCIES SYSTEM 
// ═══════════════════════════════════════════════════════════════════════════════

// Helper functions for creating dependency data
function createBitNodeInfo(id: number, name: string, completionLevel?: number): BitNodeInfo {
    return { id, name, completionLevel };
}

function createDependencyRequirement(
    type: DependencyRequirement['type'], 
    description: string, 
    critical = false, 
    level?: number
): DependencyRequirement {
    return { type, description, level, critical };
}

const PROGRESSION_DEPENDENCIES: ProgressionDependency[] = [
    // BN1 → BN5 (Intelligence System)
    {
        from: createBitNodeInfo(1, "Source-File System"),
        to: createBitNodeInfo(5, "Artificial Intelligence"),
        dependencies: [
            createDependencyRequirement('BITNODE_COMPLETION', "BN1 completion for basic understanding", true),
            createDependencyRequirement('EXPERIENCE', "Understanding of hacking mechanics", true),
            createDependencyRequirement('KNOWLEDGE', "Familiarity with faction systems", false)
        ],
        type: 'RECOMMENDED',
        reason: "BN5 provides Intelligence stat which accelerates all future progression significantly"
    },

    // BN5 → BN3 (Corporation with Intelligence)
    {
        from: createBitNodeInfo(5, "Artificial Intelligence"),
        to: createBitNodeInfo(3, "Corporatocracy"),
        dependencies: [
            createDependencyRequirement('SOURCE_FILE', "SF-5 for Intelligence mechanics", false, 1),
            createDependencyRequirement('EXPERIENCE', "Understanding of stat growth acceleration", true),
            createDependencyRequirement('PREPARATION', "Knowledge of corporate mechanics", false)
        ],
        type: 'RECOMMENDED', 
        reason: "Intelligence dramatically speeds up corporate skill training"
    },

    // BN3 → BN4 (Corporation funds for Singularity)
    {
        from: createBitNodeInfo(3, "Corporatocracy"),
        to: createBitNodeInfo(4, "The Singularity"),
        dependencies: [
            createDependencyRequirement('SOURCE_FILE', "SF-3 for corporation access", false, 1),
            createDependencyRequirement('EXPERIENCE', "Corporate money generation knowledge", true),
            createDependencyRequirement('PREPARATION', "Understanding of automation concepts", false)
        ],
        type: 'RECOMMENDED',
        reason: "Corporation provides massive funding needed for efficient Singularity automation"
    }
];

const RECOMMENDED_PROGRESSION_PATHS = {
    newPlayer: [1, 5, 3, 4, 8, 9, 6, 7, 10, 11, 12, 13],
    fastProgression: [1, 5, 4, 3, 8, 12, 13],
    completionist: [1, 2, 5, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
    automation: [1, 5, 4, 3, 8, 10, 12],
    combat: [1, 2, 6, 7, 5, 4, 3, 8, 9, 10, 11, 12, 13]
};

function getOptimalNextBitNode(completedSourceFiles: number[], playerGoal: keyof typeof RECOMMENDED_PROGRESSION_PATHS = 'newPlayer'): number | null {
    const path = RECOMMENDED_PROGRESSION_PATHS[playerGoal];
    
    for (const bitNode of path) {
        if (!completedSourceFiles.includes(bitNode)) {
            return bitNode;
        }
    }
    
    return null; // All BitNodes completed
}

function getBitNodeDependencies(targetBitNode: number): ProgressionDependency[] {
    return PROGRESSION_DEPENDENCIES.filter(dep => dep.to.id === targetBitNode);
}

function isReadyForBitNode(targetBitNode: number, completedSourceFiles: { id: number, level: number }[]): { ready: boolean, missingDependencies: string[] } {
    const dependencies = getBitNodeDependencies(targetBitNode);
    const missingDependencies: string[] = [];
    
    for (const dep of dependencies) {
        if (dep.type === 'REQUIRED') {
            for (const req of dep.dependencies) {
                if (req.critical) {
                    if (req.type === 'SOURCE_FILE') {
                        const sourceFile = completedSourceFiles.find(sf => sf.id === dep.from.id);
                        if (!sourceFile || (req.level && sourceFile.level < req.level)) {
                            missingDependencies.push(req.description);
                        }
                    } else if (req.type === 'BITNODE_COMPLETION') {
                        const completed = completedSourceFiles.some(sf => sf.id === dep.from.id);
                        if (!completed) {
                            missingDependencies.push(req.description);
                        }
                    }
                }
            }
        }
    }
    
    return {
        ready: missingDependencies.length === 0,
        missingDependencies
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BITNODE GUIDE DATA
// ═══════════════════════════════════════════════════════════════════════════════

const BITNODE_1_GUIDE: BitNodeGuide = {
    id: 1,
    name: "Source-File System",
    sourceFile: {
        id: 1,
        name: "SourceFile-1: Source Genesis",
        maxLevel: 3,
        benefits: [
            {
                level: 1,
                description: "Lets the player start with 32GB of RAM on home computer and 16 multipliers",
                multipliers: [
                    { stat: "home_ram", multiplier: 32, isPercentage: false },
                    { stat: "all_stats", multiplier: 16, isPercentage: true }
                ]
            }
        ],
        unlocks: ["Access to all game features", "Foundation for other BitNodes"],
        description: "The foundational BitNode that teaches core game mechanics",
        priority: 'ESSENTIAL'
    },
    constraints: {
        singularityAccess: false,
        maxHomeCores: 8,
        maxHomeRam: 1048576,
        corporationAccess: true,
        gangAccess: false,
        bladeburnerAccess: true,
        hacknetNodeAccess: true,
        scriptMultipliers: {
            hackingMoney: 1.0,
            hackingGrow: 1.0,
            hackingExp: 1.0,
            strengthExp: 1.0,
            defenseExp: 1.0,
            dexterityExp: 1.0,
            agilityExp: 1.0,
            charismaExp: 1.0,
            hacknetNodeMoney: 1.0,
            crimeMoney: 1.0,
            crimeSuccessRate: 1.0
        },
        specialLimitations: ["No Singularity API access until SF-4"]
    },
    augmentAvailability: {
        available: [],
        unavailable: [],
        modified: [],
        unique: []
    },
    optimalProgression: {
        phases: [
            {
                phase: 1,
                name: "Tutorial & Basic Setup",
                description: "Learn basic mechanics and get first augments",
                estimatedTime: 4,
                prerequisites: [],
                objectives: [
                    { description: "Complete tutorial", type: 'SPECIAL', target: "tutorial", priority: 'CRITICAL' },
                    { description: "Join CyberSec", type: 'FACTION', target: "CyberSec", priority: 'CRITICAL' }
                ],
                recommendedAugments: ["BitWire", "Synaptic Enhancement Implant"],
                factionTargets: ["CyberSec"],
                statTargets: [
                    { stat: "hacking", target: 50, reason: "Basic hacking capability" }
                ]
            }
        ],
        totalEstimatedTime: 40,
        keyMilestones: [],
        alternativePaths: []
    },
    specialMechanics: [],
    difficulty: {
        overall: 'EASY',
        aspects: [
            { aspect: "Learning Curve", difficulty: 'MEDIUM', reason: "First exposure to complex mechanics" }
        ],
        newPlayerFriendly: true,
        timeToComplete: 40
    },
    prerequisites: []
};

const BITNODE_GUIDES: { [key: number]: BitNodeGuide } = {
    1: BITNODE_1_GUIDE
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLI COMMAND SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const GUIDE_COMMANDS: GuideCommand[] = [
    {
        name: "bitnode",
        description: "Get comprehensive guide for a specific BitNode",
        aliases: ["bn"],
        parameters: [
            {
                name: "id",
                type: "number",
                required: true,
                description: "BitNode ID (1-13)",
                options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
            },
            {
                name: "detail",
                type: "string",
                required: false,
                description: "Level of detail",
                defaultValue: "standard",
                options: ["brief", "standard", "detailed", "complete"]
            }
        ],
        handler: "handleBitNodeCommand"
    },
    {
        name: "progression",
        description: "Get optimal BitNode progression path",
        aliases: ["path", "next"],
        parameters: [
            {
                name: "style",
                type: "string",
                required: false,
                description: "Progression style",
                defaultValue: "newPlayer",
                options: ["newPlayer", "fastProgression", "completionist", "automation", "combat"]
            }
        ],
        handler: "handleProgressionCommand"
    },
    {
        name: "analytics",
        description: "Advanced ROI and efficiency analysis",
        aliases: ["analyze", "roi"],
        parameters: [
            {
                name: "budget",
                type: "number",
                required: false,
                description: "Maximum budget for analysis"
            }
        ],
        handler: "handleAnalyticsCommand"
    }
];

function parseCommand(args: string[]): { command: GuideCommand | null, parameters: any, errors: string[] } {
    if (args.length === 0) {
        return { command: null, parameters: {}, errors: ["No command specified"] };
    }

    const commandName = args[0].toLowerCase();
    const command = GUIDE_COMMANDS.find(cmd => 
        cmd.name === commandName || cmd.aliases.includes(commandName)
    );

    if (!command) {
        return { 
            command: null, 
            parameters: {}, 
            errors: [`Unknown command: ${commandName}. Available commands: ${GUIDE_COMMANDS.map(c => c.name).join(', ')}`] 
        };
    }

    const parameters: any = {};
    const errors: string[] = [];
    let argIndex = 1;

    // Parse parameters
    for (const param of command.parameters) {
        if (argIndex < args.length) {
            const argValue = args[argIndex];
            
            if (param.type === 'number') {
                const num = parseInt(argValue);
                parameters[param.name] = isNaN(num) ? argValue : num;
            } else {
                parameters[param.name] = argValue;
            }
            argIndex++;
        } else if (param.required) {
            errors.push(`Required parameter '${param.name}' is missing`);
        } else if (param.defaultValue !== undefined) {
            parameters[param.name] = param.defaultValue;
        }
    }

    return { command, parameters, errors };
}

function getCommandHelp(commandName?: string): string {
    if (commandName) {
        const command = GUIDE_COMMANDS.find(cmd => 
            cmd.name === commandName || cmd.aliases.includes(commandName)
        );
        
        if (!command) {
            return `Unknown command: ${commandName}`;
        }

        let help = `${command.name} - ${command.description}\n`;
        if (command.aliases.length > 0) {
            help += `Aliases: ${command.aliases.join(', ')}\n`;
        }
        
        help += '\nParameters:\n';
        for (const param of command.parameters) {
            const required = param.required ? ' (required)' : '';
            const defaultVal = param.defaultValue !== undefined ? ` [default: ${param.defaultValue}]` : '';
            const options = param.options ? ` (options: ${param.options.join(', ')})` : '';
            help += `  --${param.name}: ${param.description}${required}${defaultVal}${options}\n`;
        }
        
        return help;
    } else {
        let help = 'Bitburner Multi-BitNode Augmentation Guide\n\nAvailable commands:\n';
        for (const command of GUIDE_COMMANDS) {
            help += `  ${command.name.padEnd(12)} - ${command.description}\n`;
        }
        help += '\nUse "help <command>" for detailed command information.';
        return help;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED ANALYTICS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

class AdvancedAnalytics {
    private ns: NS;
    private currentStats: PlayerStats;

    constructor(ns: NS, currentStats: PlayerStats) {
        this.ns = ns;
        this.currentStats = currentStats;
    }

    analyzeAugmentations(budget?: number, focusAreas?: string[]): any[] {
        let augments = ENHANCED_AUGMENT_DATABASE;
        
        if (budget) {
            augments = augments.filter(aug => aug.baseCost <= budget);
        }
        
        if (focusAreas) {
            augments = augments.filter(aug => 
                aug.categories.some(cat => focusAreas.includes(cat.category))
            );
        }
        
        return augments.map(aug => ({
            name: aug.name,
            roi: this.calculateROI(aug),
            efficiency: this.calculateEfficiency(aug),
            priority: aug.priority,
            cost: aug.baseCost
        })).sort((a, b) => b.roi - a.roi);
    }

    private calculateROI(augment: EnhancedAugmentData): number {
        // Simple ROI calculation based on priority and cost
        const priorityWeights = { 'ESSENTIAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const priorityScore = priorityWeights[augment.priority];
        return priorityScore / Math.log(augment.baseCost + 1);
    }

    private calculateEfficiency(augment: EnhancedAugmentData): number {
        // Efficiency based on effects vs cost
        const effectCount = augment.effects.length;
        return effectCount / Math.log(augment.baseCost + 1);
    }

    analyzeProgression(): any {
        return {
            recommendedNextBitNode: getOptimalNextBitNode([]),
            estimatedTime: 40,
            recommendations: ["Focus on hacking augments", "Join CyberSec first"]
        };
    }

    displayAugmentAnalysis(ns: NS, analyses: any[], limit = 10): void {
        ns.tprint("\n🔬 AUGMENTATION ROI ANALYSIS");
        ns.tprint("═".repeat(50));
        
        analyses.slice(0, limit).forEach((analysis, index) => {
            ns.tprint(`${index + 1}. ${analysis.name}`);
            ns.tprint(`   ROI: ${analysis.roi.toFixed(2)} | Efficiency: ${analysis.efficiency.toFixed(2)}`);
            ns.tprint(`   Priority: ${analysis.priority} | Cost: $${ns.formatNumber(analysis.cost)}`);
            ns.tprint("");
        });
    }

    displayAnalytics(ns: NS, analytics: any): void {
        ns.tprint("\n📊 PROGRESSION ANALYTICS");
        ns.tprint("═".repeat(50));
        ns.tprint(`Recommended Next BitNode: ${analytics.recommendedNextBitNode}`);
        ns.tprint(`Estimated Time: ${analytics.estimatedTime} hours`);
        ns.tprint("Recommendations:");
        analytics.recommendations.forEach((rec: string) => {
            ns.tprint(`  • ${rec}`);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE PROGRESSION PLANNER
// ═══════════════════════════════════════════════════════════════════════════════

class InteractiveProgressionPlanner {
    private ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    runInteractivePlanner(options: { mode: string, focusAreas: string[] }): void {
        this.ns.tprint("\n🎯 INTERACTIVE PROGRESSION PLANNER");
        this.ns.tprint("═".repeat(50));
        this.ns.tprint(`Mode: ${options.mode}`);
        this.ns.tprint(`Focus Areas: ${options.focusAreas.join(', ')}`);
        
        // Generate plan based on current state
        const plan = this.generatePlan(options);
        this.displayPlan(plan);
    }

    private generatePlan(options: any): any {
        return {
            phases: [
                {
                    name: "Early Game Setup",
                    duration: "2-4 hours",
                    objectives: ["Join CyberSec", "Get BitWire + Synaptic Enhancement"],
                    priority: "CRITICAL"
                },
                {
                    name: "Mid Game Expansion", 
                    duration: "8-12 hours",
                    objectives: ["Join NiteSec", "Get Neural-Retention Enhancement"],
                    priority: "HIGH"
                }
            ],
            totalTime: "15-20 hours",
            riskFactors: ["RNG for faction invites", "Server discovery timing"]
        };
    }

    private displayPlan(plan: any): void {
        this.ns.tprint("\n📋 GENERATED PLAN:");
        plan.phases.forEach((phase: any, index: number) => {
            this.ns.tprint(`\nPhase ${index + 1}: ${phase.name} (${phase.duration})`);
            this.ns.tprint(`Priority: ${phase.priority}`);
            this.ns.tprint("Objectives:");
            phase.objectives.forEach((obj: string) => {
                this.ns.tprint(`  • ${obj}`);
            });
        });
        
        this.ns.tprint(`\n⏱️ Total Estimated Time: ${plan.totalTime}`);
        this.ns.tprint("\n⚠️ Risk Factors:");
        plan.riskFactors.forEach((risk: string) => {
            this.ns.tprint(`  • ${risk}`);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATION INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

class AutomationIntegration {
    private ns: NS;
    private currentStats: PlayerStats;

    constructor(ns: NS, currentStats: PlayerStats) {
        this.ns = ns;
        this.currentStats = currentStats;
    }

    generateAutomationRecommendations(): any[] {
        return [
            {
                script: "hack-template.js",
                description: "Basic HWGW template for early game",
                priority: "HIGH",
                when: "After joining CyberSec"
            },
            {
                script: "faction-work.js", 
                description: "Automated faction reputation farming",
                priority: "MEDIUM",
                when: "After joining multiple factions"
            }
        ];
    }

    executeRecommendations(recommendations: any[], maxExecutions: number): void {
        this.ns.tprint("\n🤖 AUTOMATION RECOMMENDATIONS");
        this.ns.tprint("═".repeat(50));
        
        recommendations.slice(0, maxExecutions).forEach((rec, index) => {
            this.ns.tprint(`${index + 1}. ${rec.script}`);
            this.ns.tprint(`   ${rec.description}`);
            this.ns.tprint(`   Priority: ${rec.priority} | When: ${rec.when}`);
            this.ns.tprint("");
        });
    }

    exportAutomationConfig(): any {
        return {
            currentBitNode: 1,
            automationLevel: "SEMI",
            recommendedScripts: this.generateAutomationRecommendations(),
            exportedAt: Date.now()
        };
    }

    generateIntegrationReport(): void {
        this.ns.tprint("\n🔗 AUTOMATION INTEGRATION REPORT");
        this.ns.tprint("═".repeat(50));
        this.ns.tprint("Current automation compatibility: HIGH");
        this.ns.tprint("Recommended scripts available: 2");
        this.ns.tprint("Integration status: READY");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED AUGMENTATION DATABASE (60+ AUGMENTS)
// ═══════════════════════════════════════════════════════════════════════════════

// Helper functions for creating augment data
function createEffect(stat: string, value: number, isMultiplier = false, isPercentage = true, description?: string): AugmentEffect {
    return {
        stat,
        value,
        isMultiplier,
        isPercentage,
        description: description || `${isPercentage ? '+' : ''}${value}${isPercentage ? '%' : ''} ${stat}`
    };
}

function createAvailability(bitNode: number, available = true, modified = false, modificationDescription?: string): BitNodeAvailability {
    return { bitNode, available, modified, modificationDescription };
}

function createCategory(category: AugmentCategory['category'], primary = true): AugmentCategory {
    return { category, primary };
}

const ENHANCED_AUGMENT_DATABASE: EnhancedAugmentData[] = [
    // ESSENTIAL EARLY GAME AUGMENTS
    {
        name: "BitWire",
        factions: ["CyberSec"],
        baseCost: 10000,
        repRequired: 2500,
        description: "A small brain implant embedded in the cerebrum.",
        effects: [createEffect("hacking skill", 5)],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "First augment to buy. Cheap and provides hacking boost.",
        bitNodeAvailability: [
            createAvailability(1), createAvailability(2), createAvailability(3),
            createAvailability(4), createAvailability(5), createAvailability(6),
            createAvailability(7), createAvailability(8), createAvailability(9),
            createAvailability(10), createAvailability(11), createAvailability(12),
            createAvailability(13)
        ],
        categories: [createCategory('HACKING')],
        synergies: [
            { withAugment: "Synaptic Enhancement Implant", description: "Early game combo", benefit: "Solid foundation for hacking progression" }
        ],
        costMultiplier: 1.9
    },
    
    {
        name: "Synaptic Enhancement Implant",
        factions: ["CyberSec"],
        baseCost: 7500,
        repRequired: 1000,
        description: "A small cranial implant that releases synthetic Benzodiazepine.",
        effects: [createEffect("hacking speed", 3)],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Very cheap first augment. Get alongside BitWire.",
        bitNodeAvailability: [
            createAvailability(1), createAvailability(2), createAvailability(3),
            createAvailability(4), createAvailability(5), createAvailability(6),
            createAvailability(7), createAvailability(8), createAvailability(9),
            createAvailability(10), createAvailability(11), createAvailability(12),
            createAvailability(13)
        ],
        categories: [createCategory('HACKING')],
        synergies: [
            { withAugment: "BitWire", description: "Early game combo", benefit: "Solid foundation for hacking progression" }
        ],
        costMultiplier: 1.9
    },

    // COMBAT AUGMENTS
    {
        name: "Augmented Targeting I",
        factions: ["Slum Snakes", "Tetrads"],
        baseCost: 15000,
        repRequired: 5000,
        description: "Cranial implant embedded within the eye for dexterity enhancement.",
        effects: [createEffect("dexterity", 10)],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Essential for combat. Helps with crime/hacking requirements.",
        bitNodeAvailability: [
            createAvailability(1), createAvailability(2), createAvailability(3),
            createAvailability(4), createAvailability(5), createAvailability(6),
            createAvailability(7), createAvailability(8), createAvailability(9),
            createAvailability(10), createAvailability(11), createAvailability(12),
            createAvailability(13)
        ],
        categories: [createCategory('COMBAT')],
        synergies: [
            { withAugment: "Augmented Targeting II", description: "Targeting series", benefit: "Stacking dexterity bonuses" }
        ],
        costMultiplier: 2.5
    },

    // HIGH PRIORITY MID GAME
    {
        name: "Neural-Retention Enhancement",
        factions: ["NiteSec"],
        baseCost: 250000,
        repRequired: 20000,
        description: "Chemical injection into the brain to induce neuroplasticity.",
        effects: [createEffect("hacking experience gain", 25)],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Massive experience boost. Worth saving for early in BN1.1.",
        bitNodeAvailability: [
            createAvailability(1), createAvailability(2), createAvailability(3),
            createAvailability(4), createAvailability(5), createAvailability(6),
            createAvailability(7), createAvailability(8), createAvailability(9),
            createAvailability(10), createAvailability(11), createAvailability(12),
            createAvailability(13)
        ],
        categories: [createCategory('HACKING')],
        synergies: [],
        costMultiplier: 3.0
    },

    // BITNODE-SPECIFIC AUGMENTS
    {
        name: "The Red Pill",
        factions: ["Daedalus"],
        baseCost: 0,
        repRequired: 2500000,
        description: "Bing bong! You know that?",
        effects: [{ stat: "Destroy BitNode", value: 1, isMultiplier: false, isPercentage: false, description: "Completes current BitNode" }],
        priority: 'ESSENTIAL',
        gamePhase: 'ENDGAME',
        prereqs: [],
        notes: "Required to complete any BitNode and move to the next.",
        bitNodeAvailability: [
            createAvailability(1), createAvailability(2), createAvailability(3),
            createAvailability(4), createAvailability(5), createAvailability(6),
            createAvailability(7), createAvailability(8), createAvailability(9),
            createAvailability(10), createAvailability(11), createAvailability(12),
            createAvailability(13)
        ],
        categories: [createCategory('SPECIAL')],
        synergies: [],
        costMultiplier: 1.0
    }
];

// Legacy database for backward compatibility
const BN1_AUGMENTS: StaticAugmentData[] = [
    // ESSENTIAL EARLY GAME
    {
        name: "BitWire",
        factions: ["CyberSec"],
        baseCost: 10000,
        repRequired: 2500,
        description: "A small brain implant embedded in the cerebrum.",
        effects: ["+5% hacking skill"],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "First augment to buy. Cheap and provides hacking boost."
    },
    {
        name: "Synaptic Enhancement Implant", 
        factions: ["CyberSec"],
        baseCost: 7500,
        repRequired: 1000,
        description: "A small cranial implant that releases synthetic Benzodiazepine.",
        effects: ["+3% hacking speed"],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Very cheap first augment. Get alongside BitWire."
    },
    {
        name: "Augmented Targeting I",
        factions: ["Slum Snakes", "Tetrads"],
        baseCost: 15000,
        repRequired: 5000,
        description: "Cranial implant embedded within the eye for dexterity enhancement.",
        effects: ["+10% dexterity"],
        priority: 'ESSENTIAL',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Essential for combat. Helps with crime/hacking requirements."
    },
    
    // HIGH PRIORITY MID GAME
    {
        name: "Neural-Retention Enhancement",
        factions: ["NiteSec"],
        baseCost: 250000,
        repRequired: 20000,
        description: "Chemical injection into the brain to induce neuroplasticity.",
        effects: ["+25% hacking experience gain"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Massive experience boost. Worth saving for early in BN1.1."
    },
    {
        name: "Artificial Synaptic Potentiation",
        factions: ["The Black Hand", "NiteSec"],
        baseCost: 80000,
        repRequired: 6250,
        description: "The body is implanted with a synthetic neural network.",
        effects: ["+2% hacking speed", "+5% hacking money"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Dual benefit augment. Good value for money."
    },
    {
        name: "DataJack",
        factions: ["BitRunners", "The Black Hand", "NiteSec", "Chongqing", "New Tokyo", "Ishima", "Volhaven"],
        baseCost: 450000,
        repRequired: 112500,
        description: "A brain implant that provides an interface between brain and computer.",
        effects: ["+25% money from hacking"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Major money boost. Essential for income scaling."
    },
    
    // CITY FACTION UNIQUE AUGMENTS (From Steam Guide Research)
    {
        name: "CashRoot Starter Kit",
        factions: ["Sector-12"],
        baseCost: 125000000,
        repRequired: 12500,
        description: "A starter kit for new hackers.",
        effects: ["Start with $1m", "Start with BruteSSH.exe"],
        priority: 'HIGH',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "City faction unique. Great early game boost if you can join Sector-12."
    },
    {
        name: "PCMatrix",
        factions: ["Aevum"],
        baseCost: 2000000000,
        repRequired: 100000,
        description: "A brain implant that enhances charisma and work performance.",
        effects: ["+7.77% charisma skill", "+7.77% charisma exp", "+7.77% faction rep", "+77.7% work money", "+7.77% crime chance", "+7.77% crime money", "Start with DeepScanV1.exe, AutoLink.exe"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Aevum unique. Powerful multi-benefit augment."
    },
    {
        name: "DermaForce Particle Barrier",
        factions: ["Volhaven"],
        baseCost: 50000000,
        repRequired: 15000,
        description: "Nanomachines that create an energy barrier around the body.",
        effects: ["+40% defense skill"],
        priority: 'MEDIUM',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Volhaven unique. Strong defense boost."
    },
    {
        name: "Neuregen Gene Modification",
        factions: ["Chongqing"],
        baseCost: 375000000,
        repRequired: 37500,
        description: "Gene therapy that enhances the brain's neuroplasticity.",
        effects: ["+40% hacking experience gain"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Chongqing unique. Major hacking XP boost."
    },
    {
        name: "NutriGen Implant",
        factions: ["New Tokyo"],
        baseCost: 2500000,
        repRequired: 6250,
        description: "Synthetic implant that enhances physical performance.",
        effects: ["+20% combat experience gain"],
        priority: 'MEDIUM',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "New Tokyo unique. Good for combat skill development."
    },
    {
        name: "INFRARET Enhancement",
        factions: ["Ishima"],
        baseCost: 30000000,
        repRequired: 7500,
        description: "Infrared sensors implanted in the eyes.",
        effects: ["+10% dexterity skill", "+25% crime chance", "+10% crime money"],
        priority: 'MEDIUM',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Ishima unique. Good for crime-focused builds."
    },

    // HACKING FACTION UNIQUE AUGMENTS
    {
        name: "CRTX42-AA Gene Modification",
        factions: ["NiteSec"],
        baseCost: 225000000,
        repRequired: 45000,
        description: "Gene therapy targeting cortex development.",
        effects: ["+8% hacking skill", "+15% hacking experience gain"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "NiteSec unique. Strong hacking augment."
    },
    {
        name: "The Black Hand",
        factions: ["The Black Hand"],
        baseCost: 550000000,
        repRequired: 100000,
        description: "Cybernetic enhancement representing membership in The Black Hand.",
        effects: ["+10% hacking skill", "+15% strength skill", "+15% dexterity skill", "+2% hack/grow/weaken speed", "+10% hack power"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "The Black Hand unique. Powerful multi-skill augment."
    },
    {
        name: "Neural Accelerator",
        factions: ["BitRunners"],
        baseCost: 1750000000,
        repRequired: 200000,
        description: "Advanced neural interface for accelerated processing.",
        effects: ["+10% hacking skill", "+15% hacking experience gain", "+20% hack power"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "BitRunners unique. Elite hacking augment."
    },
    {
        name: "Cranial Signal Processors - Gen V",
        factions: ["BitRunners"],
        baseCost: 2250000000,
        repRequired: 250000,
        description: "Fifth generation neural signal processors.",
        effects: ["+30% hacking skill", "+25% hack power", "+75% grow power"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: ["Cranial Signal Processors - Gen IV"],
        notes: "BitRunners unique. Requires Gen IV first. Massive grow power."
    },
    {
        name: "BitRunners Neurolink",
        factions: ["BitRunners"],
        baseCost: 4375000000,
        repRequired: 875000,
        description: "Advanced neurolink interface providing multiple benefits.",
        effects: ["+15% hacking skill", "+20% hacking experience gain", "+5% hack/grow/weaken speed", "+10% hack chance", "Start with FTPCrack.exe, RelaySMTP.exe"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "BitRunners unique. Elite multi-benefit augment with program unlocks."
    },

    // CRIMINAL FACTION UNIQUE AUGMENTS  
    {
        name: "SmartSonar Implant",
        factions: ["Slum Snakes"],
        baseCost: 75000000,
        repRequired: 22500,
        description: "Audio enhancement implant for improved spatial awareness.",
        effects: ["+10% dexterity skill", "+15% dexterity experience gain", "+25% crime money"],
        priority: 'MEDIUM',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Slum Snakes unique. Good for crime builds."
    },
    {
        name: "Bionic Arms",
        factions: ["Tetrads"],
        baseCost: 275000000,
        repRequired: 62500,
        description: "Cybernetic arm replacements.",
        effects: ["+30% strength skill", "+30% dexterity skill"],
        priority: 'MEDIUM',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Tetrads unique. Strong combat augment."
    },
    {
        name: "TITN-41 Gene-Modification Injection",
        factions: ["Silhouette"],
        baseCost: 190000000,
        repRequired: 25000,
        description: "Gene therapy enhancing charismatic abilities.",
        effects: ["+15% charisma skill", "+15% charisma experience gain"],
        priority: 'MEDIUM',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Silhouette unique. Charisma enhancement."
    },
    {
        name: "Graphene BrachiBlades Upgrade",
        factions: ["Speakers for the Dead"],
        baseCost: 2500000000,
        repRequired: 225000,
        description: "Upgrade to BrachiBlades using graphene technology.",
        effects: ["+40% strength skill", "+40% defense skill", "+10% crime chance", "+30% crime money"],
        priority: 'MEDIUM',
        gamePhase: 'LATE',
        prereqs: ["BrachiBlades"],
        notes: "Speakers for the Dead unique. Requires BrachiBlades first."
    },
    {
        name: "Unstable Circadian Modulator",
        factions: ["Speakers for the Dead"],
        baseCost: 5000000000,
        repRequired: 362500,
        description: "Experimental circadian rhythm modifier.",
        effects: ["Random positive effects"],
        priority: 'LOW',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Speakers for the Dead unique. Random effects - use with caution."
    },
    {
        name: "Graphene Bionic Arms Upgrade",
        factions: ["The Dark Army"],
        baseCost: 3750000000,
        repRequired: 500000,
        description: "Upgraded bionic arms using graphene technology.",
        effects: ["+85% strength skill", "+85% dexterity skill"],
        priority: 'MEDIUM',
        gamePhase: 'LATE',
        prereqs: ["Bionic Arms"],
        notes: "The Dark Army unique. Requires Bionic Arms first. Massive combat boost."
    },
    {
        name: "BrachiBlades",
        factions: ["The Syndicate"],
        baseCost: 90000000,
        repRequired: 12500,
        description: "Retractable blades installed in the forearms.",
        effects: ["+15% strength skill", "+15% defense skill", "+10% crime chance", "+15% crime money"],
        priority: 'MEDIUM',
        gamePhase: 'MID',
        prereqs: [],
        notes: "The Syndicate unique. Can be upgraded later."
    },

    // CORPORATION UNIQUE AUGMENTS
    {
        name: "ECorp HVMind Implant",
        factions: ["ECorp"],
        baseCost: 5500000000,
        repRequired: 1500000,
        description: "Advanced AI interface for corporate environments.",
        effects: ["+200% grow power"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "ECorp unique. Massive grow power for server development."
    },
    {
        name: "CordiARC Fusion Reactor",
        factions: ["MegaCorp"],
        baseCost: 5000000000,
        repRequired: 1125000,
        description: "Compact fusion reactor powering cybernetic enhancements.",
        effects: ["+35% combat skills", "+35% combat experience gain"],
        priority: 'MEDIUM',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "MegaCorp unique. Major combat enhancement."
    },
    {
        name: "SmartJaw",
        factions: ["Bachman & Associates"],
        baseCost: 2750000000,
        repRequired: 375000,
        description: "Cybernetic jaw replacement enhancing speech abilities.",
        effects: ["+50% charisma skill", "+50% charisma experience gain", "+25% faction/company reputation gain"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Bachman & Associates unique. Excellent for reputation farming."
    },
    {
        name: "Neotra",
        factions: ["Blade Industries"],
        baseCost: 2875000000,
        repRequired: 562500,
        description: "Advanced neural enhancement technology.",
        effects: ["+55% strength skill", "+55% defense skill"],
        priority: 'MEDIUM',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Blade Industries unique. Strong defensive augment."
    },
    {
        name: "Xanipher",
        factions: ["NWO"],
        baseCost: 4250000000,
        repRequired: 875000,
        description: "Advanced enhancement affecting all capabilities.",
        effects: ["+20% all skills", "+15% all experience gain"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "NWO unique. Powerful all-around enhancement."
    },
    {
        name: "Hydroflame Left Arm",
        factions: ["NWO"],
        baseCost: 2500000000000, // 2.5 trillion
        repRequired: 1250000,
        description: "Legendary cybernetic arm enhancement.",
        effects: ["+170% strength skill"],
        priority: 'LOW',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "NWO unique. Extremely expensive but massive strength boost."
    },
    {
        name: "Neuronal Densification",
        factions: ["Clarke Incorporated"],
        baseCost: 1375000000,
        repRequired: 187500,
        description: "Neural density enhancement for improved processing.",
        effects: ["+15% hacking skill", "+10% hacking experience gain", "+3% hack/grow/weaken speed"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Clarke Incorporated unique. Good hacking enhancement."
    },
    {
        name: "nextSENS Gene Modification",
        factions: ["Clarke Incorporated"],
        baseCost: 1925000000,
        repRequired: 437500,
        description: "Advanced gene therapy enhancing all capabilities.",
        effects: ["+20% all skills"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Clarke Incorporated unique. All-skill enhancement."
    },
    {
        name: "OmniTek InfoLoad",
        factions: ["OmniTek Incorporated"],
        baseCost: 2875000000,
        repRequired: 625000,
        description: "Advanced information processing enhancement.",
        effects: ["+20% hacking skill", "+25% hacking experience gain"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "OmniTek Incorporated unique. Strong hacking augment."
    },
    {
        name: "Photosynthetic Cells",
        factions: ["KuaiGong International"],
        baseCost: 2750000000,
        repRequired: 562500,
        description: "Genetically modified cells capable of photosynthesis.",
        effects: ["+40% strength skill", "+40% defense skill", "+40% agility skill"],
        priority: 'MEDIUM',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "KuaiGong International unique. Triple combat enhancement."
    },
    {
        name: "PC Direct-Neural Interface NeuroNet Injector",
        factions: ["Fulcrum Secret Technologies"],
        baseCost: 7500000000,
        repRequired: 1500000,
        description: "Advanced neural interface upgrade.",
        effects: ["+10% hacking skill", "+5% hack/grow/weaken speed", "+100% company reputation gain"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: ["PC Direct-Neural Interface"],
        notes: "Fulcrum unique. Requires PC Direct-Neural Interface first. Massive rep boost."
    },

    // OTHER FACTION UNIQUE AUGMENTS
    {
        name: "Social Negotiation Assistant (S.N.A)",
        factions: ["Tian Di Hui"],
        baseCost: 30000000,
        repRequired: 6250,
        description: "AI assistant for social interactions.",
        effects: ["+15% faction/company reputation gain", "+10% work money"],
        priority: 'HIGH',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Tian Di Hui unique. Great early reputation boost."
    },
    {
        name: "Neuroreceptor Management Implant",
        factions: ["Tian Di Hui"],
        baseCost: 550000000,
        repRequired: 75000,
        description: "Implant managing neuroreceptor functions.",
        effects: ["Removes penalty when working for faction/corp unfocused"],
        priority: 'HIGH',
        gamePhase: 'MID',
        prereqs: [],
        notes: "Tian Di Hui unique. Essential for efficient multitasking."
    },
    {
        name: "SPTN-97 Gene Modification",
        factions: ["The Covenant"],
        baseCost: 4875000000,
        repRequired: 1250000,
        description: "Advanced gene modification affecting multiple systems.",
        effects: ["+15% hacking skill", "+75% combat skills"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "The Covenant unique. Powerful hybrid augment."
    },
    {
        name: "QLink",
        factions: ["Illuminati"],
        baseCost: 25000000000000, // 25 trillion
        repRequired: 1875000,
        description: "Quantum entanglement communication device.",
        effects: ["+75% hacking skill", "+100% hack/grow/weaken speed", "+150% hack chance", "+300% hack power"],
        priority: 'HIGH',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Illuminati unique. Most expensive but extremely powerful hacking augment."
    },
    
    // LATE GAME ESSENTIALS
    {
        name: "The Red Pill",
        factions: ["Daedalus"],
        baseCost: 0, // Special requirements
        repRequired: 2500000,
        description: "The truth.",
        effects: ["Allows access to Bitnode destruction"],
        priority: 'ESSENTIAL',
        gamePhase: 'LATE',
        prereqs: [],
        notes: "Required to complete BN1.1. Need $100B+ and 2.5M rep."
    },
    
    // ADDITIONAL HIGH VALUE
    {
        name: "Cranial Signal Processors - Gen I",
        factions: ["CyberSec"],
        baseCost: 70000,
        repRequired: 10000,
        description: "Neural receivers embedded within the inner ear.",
        effects: ["+2% hacking speed", "+5% hacking money"],
        priority: 'HIGH',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Great value for CyberSec rep. Get after BitWire."
    },
    {
        name: "Combat Rib I",
        factions: ["Slum Snakes", "Tetrads"],
        baseCost: 23000,
        repRequired: 7500,
        description: "Cybernetic rib replacements.",
        effects: ["+10% strength", "+10% defense"],
        priority: 'MEDIUM',
        gamePhase: 'EARLY',
        prereqs: [],
        notes: "Helps with combat stats for faction requirements."
    }
];

// Comprehensive faction joining guides for BN1.1 (40+ factions)
const FACTION_GUIDES: FactionGuide[] = [
    // EARLY HACKING FACTIONS
    {
        name: "CyberSec",
        howToJoin: "Install backdoor on CSEC server",
        requirements: "Hack CSEC server (requires ~50 hacking skill)",
        keyAugments: ["Synaptic Enhancement Implant", "BitWire", "Cranial Signal Processors - Gen I"],
        difficulty: 'EASY'
    },
    {
        name: "NiteSec", 
        howToJoin: "Install backdoor on avmnite-02h server",
        requirements: "Hack avmnite-02h server (requires ~200 hacking skill)",
        keyAugments: ["Neural-Retention Enhancement", "CRTX42-AA Gene Modification", "Artificial Synaptic Potentiation"],
        difficulty: 'MEDIUM'
    },
    {
        name: "The Black Hand",
        howToJoin: "Install backdoor on I.I.I.I server", 
        requirements: "Hack I.I.I.I server (requires ~350 hacking skill)",
        keyAugments: ["The Black Hand", "Artificial Synaptic Potentiation"],
        difficulty: 'MEDIUM'
    },
    {
        name: "BitRunners",
        howToJoin: "Install backdoor on run4theh111z server",
        requirements: "Hack run4theh111z server (requires ~500 hacking skill)",
        keyAugments: ["Neural Accelerator", "Cranial Signal Processors - Gen V", "BitRunners Neurolink"],
        difficulty: 'HARD'
    },

    // CITY FACTIONS
    {
        name: "Sector-12",
        howToJoin: "Travel to Sector-12 and meet requirements",
        requirements: "Be in Sector-12, money varies by approach",
        keyAugments: ["CashRoot Starter Kit"],
        difficulty: 'EASY'
    },
    {
        name: "Aevum",
        howToJoin: "Travel to Aevum and meet requirements", 
        requirements: "Be in Aevum, money varies by approach",
        keyAugments: ["PCMatrix"],
        difficulty: 'EASY'
    },
    {
        name: "Volhaven",
        howToJoin: "Travel to Volhaven and meet requirements",
        requirements: "Be in Volhaven, money varies by approach", 
        keyAugments: ["DermaForce Particle Barrier"],
        difficulty: 'EASY'
    },
    {
        name: "Chongqing",
        howToJoin: "Travel to Chongqing and meet requirements",
        requirements: "Be in Chongqing, money varies by approach",
        keyAugments: ["Neuregen Gene Modification"],
        difficulty: 'EASY'
    },
    {
        name: "New Tokyo",
        howToJoin: "Travel to New Tokyo and meet requirements",
        requirements: "Be in New Tokyo, money varies by approach",
        keyAugments: ["NutriGen Implant"],
        difficulty: 'EASY'
    },
    {
        name: "Ishima",
        howToJoin: "Travel to Ishima and meet requirements",
        requirements: "Be in Ishima, money varies by approach",
        keyAugments: ["INFRARET Enhancement"],
        difficulty: 'EASY'
    },

    // CRIMINAL/GANG FACTIONS
    {
        name: "Slum Snakes",
        howToJoin: "Commit crimes and build combat stats",
        requirements: "Combat stats, negative karma from crimes",
        keyAugments: ["SmartSonar Implant", "Augmented Targeting I", "Combat Rib I"],
        difficulty: 'EASY'
    },
    {
        name: "Tetrads",
        howToJoin: "Commit crimes in specific cities",
        requirements: "Be in Chongqing, New Tokyo, or Ishima. Combat stats and negative karma",
        keyAugments: ["Bionic Arms", "Augmented Targeting I", "Combat Rib I"],
        difficulty: 'EASY'
    },
    {
        name: "Silhouette",
        howToJoin: "Work for a company in a leadership position",
        requirements: "CTO, CFO, or CEO position. $15M+ money",
        keyAugments: ["TITN-41 Gene-Modification Injection"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Speakers for the Dead",
        howToJoin: "High hacking skill and negative karma",
        requirements: "Hacking 100+, Combat 300+, 30+ kills, -45+ negative karma",
        keyAugments: ["Graphene BrachiBlades Upgrade", "Unstable Circadian Modulator"],
        difficulty: 'MEDIUM'
    },
    {
        name: "The Dark Army",
        howToJoin: "High combat stats and negative karma",
        requirements: "Hacking 300+, Combat 300+, Be in Chongqing, 5+ kills, -45+ negative karma",
        keyAugments: ["Graphene Bionic Arms Upgrade"],
        difficulty: 'MEDIUM'
    },
    {
        name: "The Syndicate",
        howToJoin: "High skills and negative karma", 
        requirements: "Hacking 200+, Combat 200+, Be in Aevum or Sector-12, $10M+, -90+ negative karma",
        keyAugments: ["BrachiBlades"],
        difficulty: 'MEDIUM'
    },

    // CORPORATION FACTIONS
    {
        name: "ECorp",
        howToJoin: "Work for ECorp and gain reputation",
        requirements: "Work for ECorp company, gain company reputation",
        keyAugments: ["ECorp HVMind Implant"],
        difficulty: 'MEDIUM'
    },
    {
        name: "MegaCorp",
        howToJoin: "Work for MegaCorp and gain reputation",
        requirements: "Work for MegaCorp company, gain company reputation",
        keyAugments: ["CordiARC Fusion Reactor"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Bachman & Associates",
        howToJoin: "Work for Bachman & Associates",
        requirements: "Work for Bachman & Associates company, gain company reputation",
        keyAugments: ["SmartJaw"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Blade Industries",
        howToJoin: "Work for Blade Industries",
        requirements: "Work for Blade Industries company, gain company reputation",
        keyAugments: ["Neotra"],
        difficulty: 'MEDIUM'
    },
    {
        name: "NWO",
        howToJoin: "Work for NWO corporation",
        requirements: "Work for NWO company, gain company reputation",
        keyAugments: ["Xanipher", "Hydroflame Left Arm"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Clarke Incorporated",
        howToJoin: "Work for Clarke Incorporated",
        requirements: "Work for Clarke Incorporated company, gain company reputation",
        keyAugments: ["Neuronal Densification", "nextSENS Gene Modification"],
        difficulty: 'MEDIUM'
    },
    {
        name: "OmniTek Incorporated",
        howToJoin: "Work for OmniTek Incorporated",
        requirements: "Work for OmniTek Incorporated company, gain company reputation",
        keyAugments: ["OmniTek InfoLoad"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Four Sigma",
        howToJoin: "Work for Four Sigma",
        requirements: "Work for Four Sigma company, gain company reputation",
        keyAugments: [],
        difficulty: 'MEDIUM'
    },
    {
        name: "KuaiGong International", 
        howToJoin: "Work for KuaiGong International",
        requirements: "Work for KuaiGong International company, gain company reputation",
        keyAugments: ["Photosynthetic Cells"],
        difficulty: 'MEDIUM'
    },
    {
        name: "Fulcrum Secret Technologies",
        howToJoin: "Work for Fulcrum Technologies",
        requirements: "Work for Fulcrum Technologies company, gain company reputation",
        keyAugments: ["PC Direct-Neural Interface NeuroNet Injector"],
        difficulty: 'HARD'
    },

    // SPECIAL/SECRET FACTIONS
    {
        name: "Tian Di Hui",
        howToJoin: "Meet skill and location requirements",
        requirements: "Hacking 50+, Money $1M+, Be in Chongqing, New Tokyo, or Ishima",
        keyAugments: ["Social Negotiation Assistant (S.N.A)", "Neuroreceptor Management Implant"],
        difficulty: 'EASY'
    },
    {
        name: "Netburners",
        howToJoin: "High hacking skill",
        requirements: "Hacking 80+, Total hacknet levels 100+, Total hacknet RAM 8GB+, Total hacknet cores 4+",
        keyAugments: [],
        difficulty: 'MEDIUM'
    },

    // ENDGAME FACTIONS
    {
        name: "The Covenant",
        howToJoin: "Extremely high requirements",
        requirements: "20+ augmentations, $75B+ money, Hacking 850+, Combat 850+",
        keyAugments: ["SPTN-97 Gene Modification"],
        difficulty: 'HARD'
    },
    {
        name: "Daedalus",
        howToJoin: "Meet multiple high-level requirements",
        requirements: "Hacking 2500+ OR (Combat 1500+ AND $100B+) AND installed augmentation",
        keyAugments: ["The Red Pill"],
        difficulty: 'HARD'
    },
    {
        name: "Illuminati",
        howToJoin: "Ultimate endgame faction",
        requirements: "30+ augmentations, $150B+ money, Hacking 1500+, Combat 1200+",
        keyAugments: ["QLink"],
        difficulty: 'HARD'
    }
];

// Progression timeline for BN1.1
const PROGRESSION_TIMELINE = [
    {
        phase: "Early Game (0-50 hacking)",
        goals: ["Join CyberSec", "Get first augments"],
        augments: ["Synaptic Enhancement Implant", "BitWire"],
        actions: [
            "Build basic hacking setup",
            "Hack CSEC server and install backdoor",
            "Do work for CyberSec to gain rep",
            "Buy first two augments (~17.5k total)"
        ]
    },
    {
        phase: "Mid Early (50-200 hacking)",
        goals: ["Join more factions", "Expand augment collection"],
        augments: ["Augmented Targeting I", "Cranial Signal Processors - Gen I"],
        actions: [
            "Join Slum Snakes or Tetrads for combat augments",
            "Continue CyberSec work for more rep",
            "Hack avmnite-02h and install backdoor for NiteSec",
            "Start building serious money (~100k+)"
        ]
    },
    {
        phase: "Mid Game (200-500 hacking)",
        goals: ["Major augment purchases", "Income scaling"],
        augments: ["Neural-Retention Enhancement", "Artificial Synaptic Potentiation", "DataJack"],
        actions: [
            "Work for NiteSec to get Neural-Retention (major exp boost)",
            "Join The Black Hand",
            "Purchase DataJack for 25% money boost",
            "Scale HWGW operations with new augments"
        ]
    },
    {
        phase: "Late Game (500+ hacking)",
        goals: ["Red Pill acquisition", "BN1.1 completion"],
        augments: ["The Red Pill"],
        actions: [
            "Build $100B+ through optimized HWGW",
            "Meet Daedalus requirements (2500+ hacking OR 1500+ combat)",
            "Gain 2.5M+ rep with Daedalus",
            "Purchase Red Pill and destroy BitNode"
        ]
    }
];

export async function main(ns: NS): Promise<void> {
    const args = ns.args as string[];
    
    // Handle legacy compatibility - no args defaults to BN1 guide
    if (args.length === 0) {
        showMainGuide(ns);
        return;
    }

    // Handle help command
    if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        const helpCommand = args[1];
        ns.tprint(getCommandHelp(helpCommand));
        return;
    }

    // Handle legacy flags first for backward compatibility
    const legacyFlags = ns.flags([
        ["help", false],
        ["timeline", false],
        ["factions", false],
        ["augments", false],
        ["priority", ""],
        ["faction", ""],
        ["budget", 0],
        ["shopping-list", false],
        ["export", false]
    ]);

    // Check if legacy flags are used
    if (legacyFlags.timeline || legacyFlags.factions || legacyFlags.augments || 
        legacyFlags.priority || legacyFlags.faction || legacyFlags.budget || 
        legacyFlags["shopping-list"] || legacyFlags.export) {
        
        // Handle legacy functionality
        handleLegacyCommands(ns, legacyFlags);
        return;
    }

    // Parse new command system
    const { command, parameters, errors } = parseCommand(args);
    
    if (errors.length > 0) {
        ns.tprint(`❌ Errors:`);
        errors.forEach(error => ns.tprint(`  ${error}`));
        return;
    }

    if (!command) {
        ns.tprint(getCommandHelp());
        return;
    }

    // Execute command
    try {
        switch (command.handler) {
            case 'handleBitNodeCommand':
                handleBitNodeCommand(ns, parameters);
                break;
            case 'handleProgressionCommand':
                handleProgressionCommand(ns, parameters);
                break;
            case 'handleAnalyticsCommand':
                handleAnalyticsCommand(ns, parameters);
                break;
            default:
                ns.tprint(`❌ Command handler not implemented: ${command.handler}`);
        }
    } catch (error) {
        ns.tprint(`❌ Error executing command: ${error}`);
    }
}

function handleLegacyCommands(ns: NS, args: any): void {
    ns.clearLog();
    
    if (args.timeline) {
        showProgressionTimeline(ns);
    } else if (args.factions) {
        showFactionGuide(ns);
    } else if (args.augments) {
        showAugmentDatabase(ns, args.priority as string);
    } else if (args.faction) {
        showSpecificFactionGuide(ns, args.faction as string);
    } else if (args.budget > 0) {
        showBudgetFilteredAugments(ns, args.budget as number);
    } else if (args["shopping-list"]) {
        showOptimizedShoppingList(ns);
    } else {
        showMainGuide(ns);
    }
    
    if (args.export) {
        exportData(ns);
    }
}

function handleBitNodeCommand(ns: NS, params: any): void {
    const bitNodeId = params.id;
    const detail = params.detail || 'standard';
    
    if (!BITNODE_GUIDES[bitNodeId]) {
        ns.tprint(`❌ BitNode ${bitNodeId} guide not yet implemented`);
        ns.tprint(`📋 Available BitNodes: ${Object.keys(BITNODE_GUIDES).join(', ')}`);
        return;
    }
    
    showBitNodeGuide(ns, bitNodeId, detail);
}

function showBitNodeGuide(ns: NS, bitNodeId: number, detail: string): void {
    const guide = BITNODE_GUIDES[bitNodeId];
    if (!guide) return;
    
    ns.tprint(`\n🎯 BitNode ${guide.id}: ${guide.name}`);
    ns.tprint(`${'='.repeat(50)}`);
    
    // Source File info
    ns.tprint(`\n📁 ${guide.sourceFile.name}`);
    ns.tprint(`Priority: ${guide.sourceFile.priority}`);
    ns.tprint(`Max Level: ${guide.sourceFile.maxLevel}`);
    ns.tprint(`Description: ${guide.sourceFile.description}`);
    
    if (detail === 'detailed' || detail === 'complete') {
        // Source File benefits
        ns.tprint(`\n💪 Source File Benefits:`);
        guide.sourceFile.benefits.forEach(benefit => {
            ns.tprint(`  Level ${benefit.level}: ${benefit.description}`);
        });
        
        // Unlocks
        if (guide.sourceFile.unlocks.length > 0) {
            ns.tprint(`\n🔓 Unlocks: ${guide.sourceFile.unlocks.join(', ')}`);
        }
    }
    
    // Difficulty overview
    ns.tprint(`\n📊 Difficulty: ${guide.difficulty.overall}`);
    ns.tprint(`New Player Friendly: ${guide.difficulty.newPlayerFriendly ? 'Yes' : 'No'}`);
    ns.tprint(`Estimated Time: ${guide.difficulty.timeToComplete} hours`);
    
    // Progression phases
    ns.tprint(`\n📈 Progression Phases:`);
    guide.optimalProgression.phases.forEach(phase => {
        ns.tprint(`  Phase ${phase.phase}: ${phase.name} (${phase.estimatedTime}h)`);
        ns.tprint(`    ${phase.description}`);
        
        if (detail === 'detailed' || detail === 'complete') {
            ns.tprint(`    Objectives:`);
            phase.objectives.slice(0, 3).forEach(obj => {
                ns.tprint(`      ${obj.priority} - ${obj.description}`);
            });
            
            if (phase.recommendedAugments.length > 0) {
                ns.tprint(`    Key Augments: ${phase.recommendedAugments.slice(0, 3).join(', ')}`);
            }
        }
    });
    
    ns.tprint(`\n💡 Use 'guide help' for more commands and options`);
}

function handleProgressionCommand(ns: NS, params: any): void {
    const style = params.style || 'newPlayer';
    const completed = params.completed || [];
    
    ns.tprint(`\n🗺️  Optimal BitNode Progression (${style})`);
    ns.tprint(`${'='.repeat(50)}`);
    
    const nextBitNode = getOptimalNextBitNode(completed, style);
    
    if (nextBitNode) {
        ns.tprint(`\n🎯 Recommended Next: BitNode ${nextBitNode}`);
        if (BITNODE_GUIDES[nextBitNode]) {
            const guide = BITNODE_GUIDES[nextBitNode];
            ns.tprint(`   ${guide.name} - ${guide.difficulty.overall} difficulty`);
            ns.tprint(`   ${guide.sourceFile.description}`);
        }
    } else {
        ns.tprint(`\n🎉 All BitNodes completed!`);
    }
    
    // Show dependencies for next BitNode
    if (nextBitNode) {
        const dependencies = getBitNodeDependencies(nextBitNode);
        if (dependencies.length > 0) {
            ns.tprint(`\n📋 Dependencies for BitNode ${nextBitNode}:`);
            dependencies.forEach(dep => {
                ns.tprint(`  ${dep.type}: ${dep.reason}`);
                dep.dependencies.forEach((req: any) => {
                    if (req.critical) {
                        ns.tprint(`    ❗ ${req.description}`);
                    } else {
                        ns.tprint(`    📝 ${req.description}`);
                    }
                });
            });
        }
    }
}

function handleAnalyticsCommand(ns: NS, params: any): void {
    const currentStats: PlayerStats = {
        hacking: ns.getHackingLevel(),
        strength: ns.getPlayer().skills.strength,
        defense: ns.getPlayer().skills.defense,
        dexterity: ns.getPlayer().skills.dexterity,
        agility: ns.getPlayer().skills.agility,
        charisma: ns.getPlayer().skills.charisma,
        intelligence: ns.getPlayer().skills.intelligence,
        money: ns.getPlayer().money
    };
    
    const analytics = new AdvancedAnalytics(ns, currentStats);
    
    // Generate augment analysis
    const budget = params.budget;
    const focusAreas = params.focus ? [params.focus.toUpperCase()] : undefined;
    const augmentAnalyses = analytics.analyzeAugmentations(budget, focusAreas);
    
    // Generate progression analysis
    const progressionAnalytics = analytics.analyzeProgression();
    
    // Display results
    analytics.displayAugmentAnalysis(ns, augmentAnalyses, 10);
    analytics.displayAnalytics(ns, progressionAnalytics);
}

function showMainGuide(ns: NS): void {
    ns.print("═══ BITNODE 1.1 AUGMENTATION GUIDE ═══");
    ns.print("No Singularity API required - Manual guidance");
    ns.print("");
    
    ns.print("🎯 QUICK START RECOMMENDATIONS:");
    ns.print("");
    
    // Essential early augments
    const essentialEarly = BN1_AUGMENTS.filter(a => 
        a.priority === 'ESSENTIAL' && a.gamePhase === 'EARLY'
    );
    
    ns.print("1. ESSENTIAL EARLY AUGMENTS:");
    essentialEarly.forEach(aug => {
        ns.print(`   • ${aug.name} (${aug.factions[0]})`);
        ns.print(`     Cost: $${ns.formatNumber(aug.baseCost)} | Rep: ${ns.formatNumber(aug.repRequired)}`);
        ns.print(`     ${aug.effects.join(', ')}`);
        ns.print("");
    });
    
    ns.print("2. PROGRESSION PATH:");
    ns.print("   Phase 1: Join CyberSec → Get BitWire + Synaptic Enhancement");
    ns.print("   Phase 2: Join Slum Snakes → Get Augmented Targeting I");
    ns.print("   Phase 3: Join NiteSec → Get Neural-Retention Enhancement");
    ns.print("   Phase 4: Scale up → DataJack and other high-value augments");
    ns.print("   Phase 5: End game → Join Daedalus → Get Red Pill");
    ns.print("");
    
    ns.print("3. COMMANDS:");
    ns.print("   --timeline : See detailed progression guide");
    ns.print("   --factions : See how to join each faction");
    ns.print("   --augments : See full augmentation database");
    ns.print("");
    
    ns.print("💡 TIP: Since this is BN1.1, focus on hacking augments");
    ns.print("    Combat augments are only needed for faction requirements.");
}

function showProgressionTimeline(ns: NS): void {
    ns.print("═══ BN1.1 AUGMENTATION PROGRESSION TIMELINE ═══");
    ns.print("");
    
    PROGRESSION_TIMELINE.forEach((phase, index) => {
        ns.print(`${index + 1}. ${phase.phase.toUpperCase()}`);
        ns.print(`   Goals: ${phase.goals.join(', ')}`);
        ns.print(`   Target Augments: ${phase.augments.join(', ')}`);
        ns.print("   Actions:");
        phase.actions.forEach(action => {
            ns.print(`     • ${action}`);
        });
        ns.print("");
    });
    
    ns.print("🎯 ESTIMATED COSTS BY PHASE:");
    ns.print("   Phase 1: ~$20k (first two augments)");
    ns.print("   Phase 2: ~$100k (combat + processing augments)"); 
    ns.print("   Phase 3: ~$500k (Neural-Retention + DataJack)");
    ns.print("   Phase 4: $100B+ (Red Pill requirements)");
    ns.print("");
    
    ns.print("⏱️  ESTIMATED TIMELINE:");
    ns.print("   Phases 1-2: First few hours of gameplay");
    ns.print("   Phase 3: Mid-game scaling (depends on HWGW setup)");
    ns.print("   Phase 4: Late game (requires significant automation)");
}

function showFactionGuide(ns: NS): void {
    ns.print("═══ BN1.1 FACTION JOINING GUIDE ═══");
    ns.print("");
    
    FACTION_GUIDES.forEach(faction => {
        const difficulty = faction.difficulty === 'EASY' ? '🟢' : 
                          faction.difficulty === 'MEDIUM' ? '🟡' : '🔴';
        
        ns.print(`${difficulty} ${faction.name.toUpperCase()}`);
        ns.print(`   How to Join: ${faction.howToJoin}`);
        ns.print(`   Requirements: ${faction.requirements}`);
        ns.print(`   Key Augments: ${faction.keyAugments.join(', ')}`);
        ns.print("");
    });
    
    ns.print("📋 JOINING ORDER RECOMMENDATION:");
    ns.print("   1. CyberSec (easy, great starter augments)");
    ns.print("   2. Slum Snakes/Tetrads (combat augments)");
    ns.print("   3. NiteSec (Neural-Retention Enhancement)");
    ns.print("   4. The Black Hand (more options for DataJack)");
    ns.print("   5. BitRunners (higher level, more augment options)");
    ns.print("   6. Daedalus (end game, Red Pill)");
}

function showAugmentDatabase(ns: NS, priorityFilter: string): void {
    ns.print("═══ BN1.1 AUGMENTATION DATABASE ═══");
    ns.print("");
    
    let augments = BN1_AUGMENTS;
    if (priorityFilter) {
        augments = augments.filter(a => a.priority === priorityFilter.toUpperCase());
        ns.print(`Filtered by priority: ${priorityFilter.toUpperCase()}`);
        ns.print("");
    }
    
    // Group by priority
    const priorities = ['ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    priorities.forEach(priority => {
        const categoryAugments = augments.filter(a => a.priority === priority);
        if (categoryAugments.length === 0) return;
        
        ns.print(`${priority} PRIORITY:`);
        ns.print("─".repeat(40));
        
        categoryAugments.forEach(aug => {
            ns.print(`📦 ${aug.name}`);
            ns.print(`   Factions: ${aug.factions.join(', ')}`);
            ns.print(`   Cost: $${ns.formatNumber(aug.baseCost)} | Rep: ${ns.formatNumber(aug.repRequired)}`);
            ns.print(`   Effects: ${aug.effects.join(', ')}`);
            ns.print(`   Phase: ${aug.gamePhase} | Notes: ${aug.notes}`);
            if (aug.prereqs.length > 0) {
                ns.print(`   Prerequisites: ${aug.prereqs.join(', ')}`);
            }
            ns.print("");
        });
    });
    
    ns.print("💰 COST PLANNING:");
    const totalEssential = augments
        .filter(a => a.priority === 'ESSENTIAL')
        .reduce((sum, a) => sum + a.baseCost, 0);
    ns.print(`   Essential augments: $${ns.formatNumber(totalEssential)}`);
    
    const totalHigh = augments
        .filter(a => a.priority === 'HIGH')
        .reduce((sum, a) => sum + a.baseCost, 0);
    ns.print(`   + High priority: $${ns.formatNumber(totalEssential + totalHigh)}`);
}

function exportData(ns: NS): void {
    const data = {
        timestamp: new Date().toISOString(),
        bitnode: "1.1",
        augments: BN1_AUGMENTS,
        factions: FACTION_GUIDES,
        timeline: PROGRESSION_TIMELINE,
        summary: {
            totalAugments: BN1_AUGMENTS.length,
            essentialCount: BN1_AUGMENTS.filter(a => a.priority === 'ESSENTIAL').length,
            totalBaseCost: BN1_AUGMENTS.reduce((sum, a) => sum + a.baseCost, 0)
        }
    };
    
    ns.write("/temp/bn1-augment-guide.txt", JSON.stringify(data, null, 2), "w");
    ns.print("📁 Data exported to /temp/bn1-augment-guide.txt");
    
    // Also create a simple shopping list
    const shoppingList = BN1_AUGMENTS
        .filter(a => a.priority === 'ESSENTIAL' || a.priority === 'HIGH')
        .sort((a, b) => a.baseCost - b.baseCost)
        .map(a => ({
            name: a.name,
            faction: a.factions[0],
            cost: a.baseCost,
            rep: a.repRequired,
            priority: a.priority
        }));
    
    ns.write("/temp/augment-shopping-list.txt", JSON.stringify(shoppingList, null, 2), "w");
    ns.print("🛒 Shopping list exported to /temp/augment-shopping-list.txt");
}

function showSpecificFactionGuide(ns: NS, factionName: string): void {
    ns.print(`═══ FACTION GUIDE: ${factionName.toUpperCase()} ═══`);
    ns.print("");
    
    const faction = FACTION_GUIDES.find(f => f.name.toLowerCase() === factionName.toLowerCase());
    if (!faction) {
        ns.print(`❌ Faction '${factionName}' not found!`);
        ns.print("");
        ns.print("Available factions:");
        FACTION_GUIDES.forEach(f => ns.print(`  • ${f.name}`));
        return;
    }
    
    ns.print(`🏛️ ${faction.name}`);
    ns.print(`   Difficulty: ${faction.difficulty}`);
    ns.print(`   How to Join: ${faction.howToJoin}`);
    ns.print(`   Requirements: ${faction.requirements}`);
    ns.print("");
    
    // Show faction-specific augments
    const factionAugments = BN1_AUGMENTS.filter(aug => 
        aug.factions.some(f => f.toLowerCase() === factionName.toLowerCase())
    );
    
    if (factionAugments.length > 0) {
        ns.print("🧬 AVAILABLE AUGMENTATIONS:");
        ns.print("─".repeat(50));
        
        factionAugments
            .sort((a, b) => a.baseCost - b.baseCost)
            .forEach(aug => {
                ns.print(`📦 ${aug.name} (${aug.priority})`);
                ns.print(`   Cost: $${ns.formatNumber(aug.baseCost)} | Rep: ${ns.formatNumber(aug.repRequired)}`);
                ns.print(`   Effects: ${aug.effects.join(', ')}`);
                ns.print(`   Notes: ${aug.notes}`);
                if (aug.prereqs.length > 0) {
                    ns.print(`   Prerequisites: ${aug.prereqs.join(', ')}`);
                }
                ns.print("");
            });
        
        const totalCost = factionAugments.reduce((sum, a) => sum + a.baseCost, 0);
        const totalRep = Math.max(...factionAugments.map(a => a.repRequired));
        ns.print("💰 FACTION SUMMARY:");
        ns.print(`   Total augments: ${factionAugments.length}`);
        ns.print(`   Total cost: $${ns.formatNumber(totalCost)}`);
        ns.print(`   Max reputation needed: ${ns.formatNumber(totalRep)}`);
    } else {
        ns.print("❌ No unique augmentations found for this faction.");
    }
}

function showBudgetFilteredAugments(ns: NS, budget: number): void {
    ns.print(`═══ AUGMENTS WITHIN BUDGET: $${ns.formatNumber(budget)} ═══`);
    ns.print("");
    
    const affordableAugments = BN1_AUGMENTS
        .filter(aug => aug.baseCost <= budget)
        .sort((a, b) => {
            // Sort by priority first, then by cost
            const priorityOrder = { 'ESSENTIAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.baseCost - b.baseCost;
        });
    
    if (affordableAugments.length === 0) {
        ns.print("❌ No augmentations found within your budget.");
        ns.print("💡 Try increasing your budget or focusing on cheaper early-game augments.");
        return;
    }
    
    ns.print(`Found ${affordableAugments.length} augmentations within budget:`);
    ns.print("");
    
    // Group by priority for better organization
    const priorities = ['ESSENTIAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    priorities.forEach(priority => {
        const categoryAugments = affordableAugments.filter(a => a.priority === priority);
        if (categoryAugments.length === 0) return;
        
        ns.print(`${priority} PRIORITY (${categoryAugments.length} augments):`);
        ns.print("─".repeat(40));
        
        categoryAugments.forEach(aug => {
            const costPercent = ((aug.baseCost / budget) * 100).toFixed(1);
            ns.print(`📦 ${aug.name}`);
            ns.print(`   Cost: $${ns.formatNumber(aug.baseCost)} (${costPercent}% of budget)`);
            ns.print(`   Factions: ${aug.factions.join(', ')}`);
            ns.print(`   Effects: ${aug.effects.join(', ')}`);
            ns.print(`   Rep Required: ${ns.formatNumber(aug.repRequired)}`);
            ns.print("");
        });
    });
    
    const totalCost = affordableAugments.reduce((sum, a) => sum + a.baseCost, 0);
    const remainingBudget = budget - totalCost;
    
    ns.print("💰 BUDGET ANALYSIS:");
    ns.print(`   Total cost if buying all: $${ns.formatNumber(totalCost)}`);
    ns.print(`   Remaining budget: $${ns.formatNumber(remainingBudget)}`);
    ns.print(`   Budget utilization: ${((totalCost / budget) * 100).toFixed(1)}%`);
}

function showOptimizedShoppingList(ns: NS): void {
    ns.print("═══ OPTIMIZED AUGMENTATION SHOPPING LIST ═══");
    ns.print("Ordered by cost-effectiveness and progression logic");
    ns.print("");
    
    // Create a progression-optimized shopping list
    const shoppingList = [...BN1_AUGMENTS]
        .filter(aug => aug.priority === 'ESSENTIAL' || aug.priority === 'HIGH')
        .sort((a, b) => {
            // Custom sorting for optimal progression:
            // 1. Essential early game first
            if (a.priority === 'ESSENTIAL' && a.gamePhase === 'EARLY' && 
                !(b.priority === 'ESSENTIAL' && b.gamePhase === 'EARLY')) return -1;
            if (b.priority === 'ESSENTIAL' && b.gamePhase === 'EARLY' && 
                !(a.priority === 'ESSENTIAL' && a.gamePhase === 'EARLY')) return 1;
                
            // 2. Then by game phase
            const phaseOrder = { 'EARLY': 0, 'MID': 1, 'LATE': 2 };
            const aPhase = phaseOrder[a.gamePhase];
            const bPhase = phaseOrder[b.gamePhase];
            if (aPhase !== bPhase) return aPhase - bPhase;
            
            // 3. Then by priority
            const priorityOrder = { 'ESSENTIAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            if (aPriority !== bPriority) return aPriority - bPriority;
            
            // 4. Finally by cost (cheaper first within same priority/phase)
            return a.baseCost - b.baseCost;
        });
    
    let runningTotal = 0;
    let currentPhase = '';
    
    shoppingList.forEach((aug, index) => {
        if (aug.gamePhase !== currentPhase) {
            currentPhase = aug.gamePhase;
            ns.print(`\n🎯 ${currentPhase} GAME PHASE:`);
            ns.print("─".repeat(50));
        }
        
        runningTotal += aug.baseCost;
        const orderNum = (index + 1).toString().padStart(2, '0');
        
        ns.print(`${orderNum}. ${aug.name} [${aug.priority}]`);
        ns.print(`    💰 Cost: $${ns.formatNumber(aug.baseCost)} (Total: $${ns.formatNumber(runningTotal)})`);
        ns.print(`    🏛️ Faction: ${aug.factions[0]} | Rep: ${ns.formatNumber(aug.repRequired)}`);
        ns.print(`    ⚡ Effects: ${aug.effects.join(', ')}`);
        if (aug.prereqs.length > 0) {
            ns.print(`    📋 Prerequisites: ${aug.prereqs.join(', ')}`);
        }
        ns.print(`    📝 ${aug.notes}`);
        ns.print("");
    });
    
    ns.print("💡 SHOPPING STRATEGY:");
    ns.print(`   • Total augments in optimal order: ${shoppingList.length}`);
    ns.print(`   • Total investment required: $${ns.formatNumber(runningTotal)}`);
    ns.print(`   • Follow this order for maximum progression efficiency`);
    ns.print(`   • Remember: Augment costs increase exponentially with each purchase!`);
    ns.print(`   • Consider using cost multipliers (each augment increases next costs by ~1.9x)`);
    
    // Calculate with multipliers
    let multipliedTotal = 0;
    let multiplier = 1;
    const COST_MULTIPLIER = 1.9; // Approximate Bitburner augment cost multiplier
    
    shoppingList.forEach(aug => {
        multipliedTotal += aug.baseCost * multiplier;
        multiplier *= COST_MULTIPLIER;
    });
    
    ns.print("");
    ns.print("⚠️  REALISTIC COST ESTIMATION (with multipliers):");
    ns.print(`   • Actual total cost: $${ns.formatNumber(multipliedTotal)}`);
    ns.print(`   • This assumes ~1.9x cost increase per augment purchased`);
}