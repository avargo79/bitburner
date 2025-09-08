import { NS } from "@ns";

/**
 * Augmentation Guide for BitNode 1.1
 * 
 * Provides augmentation recommendations without requiring Singularity API.
 * Based on community research and BitNode 1.1 specific constraints.
 * 
 * Since Singularity functions are limited in BN1.1, this guide provides:
 * - Static progression paths based on community meta
 * - Manual purchasing guidance 
 * - Faction joining strategies
 * - Cost estimates and priority rankings
 */

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

// Static augmentation database for BN1.1 (no API calls needed)
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

// Faction joining guide for BN1.1
const FACTION_GUIDES: FactionGuide[] = [
    {
        name: "CyberSec",
        howToJoin: "Install backdoor on CSEC server",
        requirements: "Hack CSEC server (requires ~50 hacking skill)",
        keyAugments: ["BitWire", "Synaptic Enhancement Implant", "Cranial Signal Processors - Gen I"],
        difficulty: 'EASY'
    },
    {
        name: "NiteSec", 
        howToJoin: "Install backdoor on avmnite-02h server",
        requirements: "Hack avmnite-02h server (requires ~200 hacking skill)",
        keyAugments: ["Neural-Retention Enhancement", "Artificial Synaptic Potentiation", "DataJack"],
        difficulty: 'MEDIUM'
    },
    {
        name: "The Black Hand",
        howToJoin: "Install backdoor on I.I.I.I server", 
        requirements: "Hack I.I.I.I server (requires ~350 hacking skill)",
        keyAugments: ["Artificial Synaptic Potentiation", "DataJack"],
        difficulty: 'MEDIUM'
    },
    {
        name: "BitRunners",
        howToJoin: "Install backdoor on run4theh111z server",
        requirements: "Hack run4theh111z server (requires ~500 hacking skill)",
        keyAugments: ["DataJack"],
        difficulty: 'HARD'
    },
    {
        name: "Slum Snakes",
        howToJoin: "Do crimes in downtown area",
        requirements: "Combat stats, criminal activity",
        keyAugments: ["Augmented Targeting I", "Combat Rib I"],
        difficulty: 'EASY'
    },
    {
        name: "Daedalus",
        howToJoin: "Meet multiple high-level requirements",
        requirements: "Hacking 2500+ OR Combat 1500+ AND $100B+ AND installed Red Pill from other faction",
        keyAugments: ["The Red Pill"],
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
    const args = ns.flags([
        ["help", false],
        ["timeline", false],
        ["factions", false],
        ["augments", false],
        ["priority", ""],
        ["export", false]
    ]);

    if (args.help) {
        ns.tprint("BitNode 1.1 Augmentation Guide (No Singularity API)");
        ns.tprint("");
        ns.tprint("Options:");
        ns.tprint("  --timeline    Show progression timeline for BN1.1");
        ns.tprint("  --factions    Show faction joining guide");
        ns.tprint("  --augments    Show all augmentations database");
        ns.tprint("  --priority X  Filter by priority (ESSENTIAL/HIGH/MEDIUM/LOW)");
        ns.tprint("  --export      Export data to files");
        ns.tprint("");
        ns.tprint("Examples:");
        ns.tprint("  run augment-guide.js --timeline");
        ns.tprint("  run augment-guide.js --factions");
        ns.tprint("  run augment-guide.js --priority ESSENTIAL");
        return;
    }

    ns.clearLog();
    
    if (args.timeline) {
        showProgressionTimeline(ns);
    } else if (args.factions) {
        showFactionGuide(ns);
    } else if (args.augments) {
        showAugmentDatabase(ns, args.priority as string);
    } else {
        showMainGuide(ns);
    }
    
    if (args.export) {
        exportData(ns);
    }
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