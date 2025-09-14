import { ReactNavigator, NavigationTask, PageType } from '/lib/react-navigator';
import { ReactGameState } from '/lib/react-game-state';
import { getWindowAPI } from '/lib/react-browser-utils';

export interface WorkflowStep {
    id: string;
    name: string;
    description: string;
    page: PageType;
    action: string;
    parameters?: any[];
    conditions?: WorkflowCondition[];
    onSuccess?: WorkflowAction[];
    onFailure?: WorkflowAction[];
    timeout?: number;
    retries?: number;
    delay?: number;
}

export interface WorkflowCondition {
    type: 'state' | 'result' | 'time' | 'custom';
    check: (context: WorkflowContext) => boolean | Promise<boolean>;
    description: string;
}

export interface WorkflowAction {
    type: 'navigate' | 'execute' | 'wait' | 'retry' | 'abort' | 'branch' | 'custom';
    parameters?: any;
    handler?: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowContext {
    workflow: Workflow;
    currentStep: WorkflowStep;
    stepResults: Map<string, any>;
    globalData: Map<string, any>;
    gameState: ReactGameState;
    navigator: ReactNavigator;
    startTime: number;
    stepStartTime: number;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    version: string;
    steps: WorkflowStep[];
    onStart?: WorkflowAction[];
    onComplete?: WorkflowAction[];
    onError?: WorkflowAction[];
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    currentStepIndex: number;
    progress: number;
    result?: any;
    error?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    executionTime?: number;
}

export interface WorkflowTemplate {
    name: string;
    description: string;
    category: 'automation' | 'trading' | 'progression' | 'management' | 'utility';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedTime: number;
    prerequisites?: string[];
    createWorkflow: (parameters?: any) => Workflow;
}

export class ReactNavigationWorkflows {
    private static instance: ReactNavigationWorkflows;
    private navigator: ReactNavigator;
    private gameState: ReactGameState;
    private activeWorkflows: Map<string, Workflow> = new Map();
    private workflowHistory: Workflow[] = [];
    private templates: Map<string, WorkflowTemplate> = new Map();
    private executionInterval: number | null = null;
    private isProcessing = false;

    private constructor() {
        this.navigator = ReactNavigator.getInstance();
        this.gameState = ReactGameState.getInstance();
        this.initializeTemplates();
    }

    static getInstance(): ReactNavigationWorkflows {
        if (!ReactNavigationWorkflows.instance) {
            ReactNavigationWorkflows.instance = new ReactNavigationWorkflows();
        }
        return ReactNavigationWorkflows.instance;
    }

    startProcessing(): void {
        if (this.executionInterval) {
            return;
        }

        const win = getWindowAPI();
        this.executionInterval = win.setInterval(() => {
            this.processWorkflows();
        }, 1000);
    }

    stopProcessing(): void {
        if (this.executionInterval) {
            const win = getWindowAPI();
            win.clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
    }

    // Workflow management
    createWorkflow(workflow: Omit<Workflow, 'id' | 'status' | 'currentStepIndex' | 'progress' | 'createdAt'>): string {
        const id = this.generateWorkflowId();
        const fullWorkflow: Workflow = {
            id,
            status: 'pending',
            currentStepIndex: 0,
            progress: 0,
            createdAt: Date.now(),
            ...workflow
        };

        this.activeWorkflows.set(id, fullWorkflow);
        return id;
    }

    createFromTemplate(templateName: string, parameters?: any): string {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Workflow template '${templateName}' not found`);
        }

        const workflow = template.createWorkflow(parameters);
        return this.createWorkflow(workflow);
    }

    startWorkflow(workflowId: string): boolean {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || workflow.status !== 'pending') {
            return false;
        }

        workflow.status = 'running';
        workflow.startedAt = Date.now();
        return true;
    }

    pauseWorkflow(workflowId: string): boolean {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || workflow.status !== 'running') {
            return false;
        }

        workflow.status = 'paused';
        return true;
    }

    resumeWorkflow(workflowId: string): boolean {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || workflow.status !== 'paused') {
            return false;
        }

        workflow.status = 'running';
        return true;
    }

    cancelWorkflow(workflowId: string): boolean {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            return false;
        }

        workflow.status = 'cancelled';
        workflow.completedAt = Date.now();
        workflow.executionTime = workflow.completedAt - (workflow.startedAt || workflow.createdAt);
        
        this.workflowHistory.push(workflow);
        this.activeWorkflows.delete(workflowId);
        return true;
    }

    getWorkflow(workflowId: string): Workflow | null {
        return this.activeWorkflows.get(workflowId) || 
               this.workflowHistory.find(w => w.id === workflowId) || null;
    }

    getActiveWorkflows(): Workflow[] {
        return Array.from(this.activeWorkflows.values());
    }

    getRunningWorkflows(): Workflow[] {
        return Array.from(this.activeWorkflows.values()).filter(w => w.status === 'running');
    }

    getWorkflowHistory(): Workflow[] {
        return [...this.workflowHistory];
    }

    // Template management
    registerTemplate(name: string, template: WorkflowTemplate): void {
        this.templates.set(name, template);
    }

    getTemplate(name: string): WorkflowTemplate | null {
        return this.templates.get(name) || null;
    }

    getAllTemplates(): WorkflowTemplate[] {
        return Array.from(this.templates.values());
    }

    getTemplatesByCategory(category: string): WorkflowTemplate[] {
        return Array.from(this.templates.values()).filter(t => t.category === category);
    }

    // Workflow execution
    private async processWorkflows(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            const runningWorkflows = this.getRunningWorkflows();
            
            for (const workflow of runningWorkflows) {
                await this.processWorkflow(workflow);
            }
        } catch (error) {
            console.error('Error processing workflows:', error);
        }

        this.isProcessing = false;
    }

    private async processWorkflow(workflow: Workflow): Promise<void> {
        try {
            if (workflow.currentStepIndex >= workflow.steps.length) {
                await this.completeWorkflow(workflow);
                return;
            }

            const currentStep = workflow.steps[workflow.currentStepIndex];
            const context = this.createWorkflowContext(workflow, currentStep);

            // Check step conditions
            if (currentStep.conditions && !await this.checkConditions(currentStep.conditions, context)) {
                return; // Wait for conditions to be met
            }

            // Execute the step
            const stepResult = await this.executeWorkflowStep(currentStep, context);
            
            // Store result
            context.stepResults.set(currentStep.id, stepResult);

            if (stepResult.success) {
                // Execute onSuccess actions
                if (currentStep.onSuccess) {
                    await this.executeActions(currentStep.onSuccess, context);
                }

                // Move to next step
                workflow.currentStepIndex++;
                workflow.progress = (workflow.currentStepIndex / workflow.steps.length) * 100;
            } else {
                // Execute onFailure actions
                if (currentStep.onFailure) {
                    await this.executeActions(currentStep.onFailure, context);
                } else {
                    // Default: fail the workflow
                    await this.failWorkflow(workflow, stepResult.error || 'Step failed');
                }
            }

        } catch (error: any) {
            await this.failWorkflow(workflow, error.message || 'Unknown error');
        }
    }

    private async executeWorkflowStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
        context.stepStartTime = Date.now();

        try {
            const result = await this.navigator.executeAction(
                step.page,
                step.action,
                step.parameters
            );

            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Step execution failed'
            };
        }
    }

    private async checkConditions(conditions: WorkflowCondition[], context: WorkflowContext): Promise<boolean> {
        for (const condition of conditions) {
            try {
                const result = await condition.check(context);
                if (!result) {
                    return false;
                }
            } catch (error) {
                console.error(`Error checking condition: ${condition.description}`, error);
                return false;
            }
        }
        return true;
    }

    private async executeActions(actions: WorkflowAction[], context: WorkflowContext): Promise<void> {
        for (const action of actions) {
            try {
                await this.executeAction(action, context);
            } catch (error) {
                console.error('Error executing workflow action:', error);
            }
        }
    }

    private async executeAction(action: WorkflowAction, context: WorkflowContext): Promise<void> {
        switch (action.type) {
            case 'navigate':
                if (action.parameters?.page) {
                    await this.navigator.navigateToPage(action.parameters.page);
                }
                break;

            case 'execute':
                if (action.parameters?.page && action.parameters?.action) {
                    await this.navigator.executeAction(
                        action.parameters.page,
                        action.parameters.action,
                        action.parameters.parameters
                    );
                }
                break;

            case 'wait':
                const delay = action.parameters?.delay || 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                break;

            case 'retry':
                // Retry current step
                context.workflow.currentStepIndex = Math.max(0, context.workflow.currentStepIndex - 1);
                break;

            case 'abort':
                await this.failWorkflow(context.workflow, 'Workflow aborted by action');
                break;

            case 'branch':
                if (action.parameters?.stepIndex !== undefined) {
                    context.workflow.currentStepIndex = action.parameters.stepIndex;
                }
                break;

            case 'custom':
                if (action.handler) {
                    await action.handler(context);
                }
                break;
        }
    }

    private async completeWorkflow(workflow: Workflow): Promise<void> {
        workflow.status = 'completed';
        workflow.completedAt = Date.now();
        workflow.executionTime = workflow.completedAt - (workflow.startedAt || workflow.createdAt);
        workflow.progress = 100;

        // Execute completion actions
        if (workflow.onComplete) {
            const context = this.createWorkflowContext(workflow, workflow.steps[workflow.steps.length - 1]);
            await this.executeActions(workflow.onComplete, context);
        }

        this.workflowHistory.push(workflow);
        this.activeWorkflows.delete(workflow.id);
    }

    private async failWorkflow(workflow: Workflow, error: string): Promise<void> {
        workflow.status = 'failed';
        workflow.error = error;
        workflow.completedAt = Date.now();
        workflow.executionTime = workflow.completedAt - (workflow.startedAt || workflow.createdAt);

        // Execute error actions
        if (workflow.onError) {
            const context = this.createWorkflowContext(workflow, workflow.steps[workflow.currentStepIndex]);
            await this.executeActions(workflow.onError, context);
        }

        this.workflowHistory.push(workflow);
        this.activeWorkflows.delete(workflow.id);
    }

    private createWorkflowContext(workflow: Workflow, currentStep: WorkflowStep): WorkflowContext {
        return {
            workflow,
            currentStep,
            stepResults: new Map(),
            globalData: new Map(),
            gameState: this.gameState,
            navigator: this.navigator,
            startTime: workflow.startedAt || Date.now(),
            stepStartTime: Date.now()
        };
    }

    private generateWorkflowId(): string {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Built-in workflow templates
    private initializeTemplates(): void {
        // Money grinding workflow
        this.registerTemplate('money_grind', {
            name: 'Money Grinding',
            description: 'Automated money grinding using best available methods',
            category: 'automation',
            difficulty: 'beginner',
            estimatedTime: 3600000, // 1 hour
            createWorkflow: (params) => ({
                id: 'money-grinding-' + Date.now(),
                name: 'Money Grinding Session',
                description: 'Automated money grinding workflow',
                version: '1.0.0',
                status: 'pending' as const,
                currentStepIndex: 0,
                progress: 0,
                createdAt: Date.now(),
                steps: [
                    {
                        id: 'check_stats',
                        name: 'Check Player Stats',
                        description: 'Get current player stats',
                        page: 'stats',
                        action: 'getPlayerStats'
                    },
                    {
                        id: 'optimize_hacknet',
                        name: 'Optimize Hacknet',
                        description: 'Upgrade hacknet nodes for passive income',
                        page: 'hacknet',
                        action: 'optimizeNodes'
                    },
                    {
                        id: 'check_stocks',
                        name: 'Check Stock Market',
                        description: 'Monitor stock market for opportunities',
                        page: 'stockmarket',
                        action: 'getAllStocks'
                    }
                ]
            })
        });

        // Faction progression workflow
        this.registerTemplate('faction_progress', {
            name: 'Faction Progression',
            description: 'Automated faction reputation and augmentation management',
            category: 'progression',
            difficulty: 'intermediate',
            estimatedTime: 7200000, // 2 hours
            createWorkflow: (params) => ({
                id: 'faction-progress-' + Date.now(),
                name: 'Faction Progression',
                description: 'Automate faction work and augmentation purchases',
                version: '1.0.0',
                status: 'pending' as const,
                currentStepIndex: 0,
                progress: 0,
                createdAt: Date.now(),
                steps: [
                    {
                        id: 'get_factions',
                        name: 'Get Available Factions',
                        description: 'List all joined factions',
                        page: 'factions',
                        action: 'getAllFactions'
                    },
                    {
                        id: 'work_for_rep',
                        name: 'Work for Reputation',
                        description: 'Work for the most beneficial faction',
                        page: 'factions',
                        action: 'workForFaction',
                        parameters: [params?.targetFaction || 'CyberSec']
                    },
                    {
                        id: 'buy_augmentations',
                        name: 'Buy Augmentations',
                        description: 'Purchase available augmentations',
                        page: 'augmentations',
                        action: 'getAvailableAugmentations'
                    }
                ]
            })
        });

        // Stock trading workflow
        this.registerTemplate('stock_trading', {
            name: 'Stock Trading',
            description: 'Automated stock market trading based on forecasts',
            category: 'trading',
            difficulty: 'advanced',
            estimatedTime: 1800000, // 30 minutes
            createWorkflow: (params) => ({
                id: 'stock-trading-' + Date.now(),
                name: 'Stock Trading Session',
                description: 'Automated stock market trading',
                version: '1.0.0',
                status: 'pending' as const,
                currentStepIndex: 0,
                progress: 0,
                createdAt: Date.now(),
                steps: [
                    {
                        id: 'analyze_market',
                        name: 'Analyze Market',
                        description: 'Get current stock market data',
                        page: 'stockmarket',
                        action: 'getAllStocks'
                    },
                    {
                        id: 'execute_trades',
                        name: 'Execute Trades',
                        description: 'Buy/sell stocks based on analysis',
                        page: 'stockmarket',
                        action: 'getTopPerformers',
                        parameters: [5]
                    }
                ]
            })
        });
    }

    destroy(): void {
        this.stopProcessing();
        this.activeWorkflows.clear();
        this.workflowHistory = [];
    }
}