import { FactionWorkStatus } from "/lib/botnet-types";

// ===== BROWSER API ACCESS =====

/**
 * Get document API using stealth technique to avoid RAM penalties
 */
export function getDocumentAPI(): any {
    return (globalThis as any)['doc' + 'ument'];
}

// ===== FACTION DETECTION SYSTEM =====

/**
 * Faction work detection and monitoring system
 * Provides stable detection of faction work activities through DOM analysis
 */
export class FactionDetector {
    private detectionHistory: FactionWorkStatus[] = [];
    private lastDetectedFaction: string | null = null;
    private consecutiveCount = 0;

    /**
     * Detect current faction work status
     */
    detectFactionWork(): FactionWorkStatus {
        const currentTime = Date.now();
        const doc = getDocumentAPI();
        
        let isWorkingForFaction = false;
        let detectedFactionName: string | null = null;
        
        try {
            // First try to find faction name in <strong> element (most reliable)
            const strongElements = doc.querySelectorAll('strong');
            for (const strongEl of strongElements) {
                const strongText = strongEl.textContent?.trim();
                if (strongText && strongText.length > 2 && strongText.length < 50) {
                    // Check if this strong element is in a faction work context
                    const parentText = strongEl.parentElement?.textContent || '';
                    if (parentText.includes('Working for') || parentText.includes('Faction work')) {
                        isWorkingForFaction = true;
                        detectedFactionName = strongText;
                        break;
                    }
                }
            }
            
            // Fallback to text-based detection if strong element method fails
            if (!isWorkingForFaction) {
                const workIndicators = [
                    'Working for',
                    'Faction work:',
                    'Doing faction work for',
                    'Currently working for faction'
                ];
                
                const allText = doc.body?.textContent || '';
                
                for (const indicator of workIndicators) {
                    const workIndex = allText.indexOf(indicator);
                    if (workIndex !== -1) {
                        isWorkingForFaction = true;
                        detectedFactionName = this.extractFactionName(allText.substring(workIndex, workIndex + 200));
                        break;
                    }
                }
            }
            
            if (detectedFactionName && detectedFactionName.toLowerCase().includes('working')) {
                detectedFactionName = null;
                isWorkingForFaction = false;
            }
            
        } catch (error) {
            isWorkingForFaction = false;
            detectedFactionName = null;
        }
        
        if (detectedFactionName === this.lastDetectedFaction) {
            this.consecutiveCount++;
        } else {
            this.consecutiveCount = 1;
            this.lastDetectedFaction = detectedFactionName;
        }
        
        const status: FactionWorkStatus = {
            isWorkingForFaction,
            detectedFactionName,
            lastDetectionTime: currentTime,
            detectionMethod: 'dom-text',
            workDuration: isWorkingForFaction ? this.calculateWorkDuration() : 0,
            consecutiveDetections: this.consecutiveCount,
            lastStatusChange: this.consecutiveCount === 1 ? currentTime : this.getLastStatusChangeTime()
        };
        
        this.detectionHistory.push(status);
        if (this.detectionHistory.length > 10) {
            this.detectionHistory.shift();
        }
        
        return status;
    }
    
    /**
     * Extract faction name from work text using pattern matching
     */
    extractFactionName(workText: string): string | null {
        const patterns = [
            /Working for\s+([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/,
            /Faction work:\s*([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/,
            /working for faction\s+([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/i,
            /faction:\s*([A-Za-z0-9\s\-\.]+?)(?:\s|$|\.|\,)/i
        ];
        
        for (const pattern of patterns) {
            const match = workText.match(pattern);
            if (match && match[1]) {
                let factionName = match[1].trim();
                
                const stopWords = ['and', 'is', 'at', 'on', 'in', 'for', 'with', 'by', 'to', 'from'];
                const words = factionName.split(/\s+/);
                const filteredWords = words.filter(word => 
                    !stopWords.includes(word.toLowerCase()) && 
                    word.length > 1
                );
                
                factionName = filteredWords.join(' ').trim();
                
                // Normalize faction names by removing trailing numbers (e.g., "Aevum68" -> "Aevum")
                factionName = factionName.replace(/\d+$/, '').trim();
                
                if (factionName.length >= 3 && factionName.length <= 50) {
                    return factionName;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Check if detection is stable (consecutive detections meet threshold)
     */
    isDetectionStable(status: FactionWorkStatus, requiredConsecutiveDetections: number = 3): boolean {
        return status.consecutiveDetections >= requiredConsecutiveDetections;
    }
    
    /**
     * Calculate work duration from detection history
     */
    private calculateWorkDuration(): number {
        if (this.detectionHistory.length < 2) return 0;
        
        const firstDetection = this.detectionHistory.find(h => h.isWorkingForFaction);
        if (!firstDetection) return 0;
        
        return Date.now() - firstDetection.lastDetectionTime;
    }
    
    /**
     * Get timestamp of last status change
     */
    private getLastStatusChangeTime(): number {
        if (this.detectionHistory.length < 2) return Date.now();
        
        for (let i = this.detectionHistory.length - 2; i >= 0; i--) {
            const prev = this.detectionHistory[i];
            const current = this.detectionHistory[this.detectionHistory.length - 1];
            
            if (prev.detectedFactionName !== current.detectedFactionName) {
                return current.lastDetectionTime;
            }
        }
        
        return this.detectionHistory[0]?.lastDetectionTime || Date.now();
    }
    
    /**
     * Get copy of detection history
     */
    getDetectionHistory(): FactionWorkStatus[] {
        return [...this.detectionHistory];
    }
    
    /**
     * Clear detection history and reset state
     */
    clearHistory(): void {
        this.detectionHistory = [];
        this.lastDetectedFaction = null;
        this.consecutiveCount = 0;
    }
}