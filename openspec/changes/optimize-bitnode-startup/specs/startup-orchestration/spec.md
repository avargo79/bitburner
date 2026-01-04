# Startup Orchestration Specification

## ADDED Requirements

### Requirement: Bitnode Detection
The startup orchestration system SHALL detect the current bitnode and apply bitnode-specific configurations.

#### Scenario: Player in BitNode 1
- **WHEN** player starts automation in BitNode 1
- **THEN** system applies BN1 configuration (balanced strategy, standard stat targets)

#### Scenario: Player in BitNode 4
- **WHEN** player starts automation in BitNode 4
- **THEN** system applies BN4 configuration (casino focus, high money target, specific script priorities)

#### Scenario: Player in unknown BitNode
- **WHEN** player starts automation in a bitnode without specific configuration
- **THEN** system applies conservative fallback configuration with safe defaults

### Requirement: Bitnode-Specific Configuration
The system SHALL provide bitnode-specific configurations including stat targets, training strategies, money targets, and script priorities.

#### Scenario: BN1 stat targets
- **WHEN** using BN1 configuration
- **THEN** stat targets are set to balanced values (str: 50, def: 50, dex: 50, agi: 50, hack: 50)

#### Scenario: BN4 money strategy
- **WHEN** using BN4 configuration
- **THEN** money strategy is set to "casino" with target of $10 billion

#### Scenario: Script priority ordering
- **WHEN** system loads bitnode configuration
- **THEN** scripts have priority values (1=highest priority, 10=lowest)
- **AND** high-priority scripts (botnet, contracts) launch before low-priority scripts (hacknet)

### Requirement: Prerequisite Validation
Each automation script SHALL export a prerequisite check function that validates readiness before launch.

#### Scenario: Gang script with SF2 available
- **WHEN** checking gang script prerequisites with SF2 source file
- **THEN** prerequisite check returns ready=true

#### Scenario: Gang script without SF2
- **WHEN** checking gang script prerequisites without SF2 source file
- **THEN** prerequisite check returns ready=false with reason "Gang API unavailable (need SF2)"

#### Scenario: Botnet with insufficient RAM
- **WHEN** checking botnet prerequisites with <64GB home RAM
- **THEN** prerequisite check returns ready=false with reason "Insufficient home RAM (need 64GB, have 32GB)"

#### Scenario: Sleeve script without sleeves
- **WHEN** checking sleeve script prerequisites without SF10 or BN10
- **THEN** prerequisite check returns ready=false with reason "Sleeves unavailable (need SF10)"

### Requirement: Priority-Based Script Launching
The system SHALL launch automation scripts sequentially in priority order, checking prerequisites before each launch.

#### Scenario: All prerequisites met
- **WHEN** launching scripts with all prerequisites satisfied
- **THEN** scripts launch in priority order (1 to 10)
- **AND** each script logs successful launch with timestamp

#### Scenario: Mixed prerequisite states
- **WHEN** launching scripts with some prerequisites met and others not
- **THEN** ready scripts launch immediately in priority order
- **AND** unready scripts are skipped with logged reason
- **AND** wait queue tracks scripts that might become ready

#### Scenario: Prerequisite timeout
- **WHEN** script waits for prerequisite longer than timeout (5 minutes)
- **THEN** script is marked as failed with timeout message
- **AND** remaining scripts continue launching

### Requirement: Dynamic Progression Checks
The system SHALL check player state before each training or grinding phase and skip phases that are already complete.

#### Scenario: Stats already sufficient from augmentations
- **WHEN** player stats already meet or exceed configured targets
- **THEN** system skips training phase for those stats
- **AND** logs which stats were skipped with current values

#### Scenario: Money target already met
- **WHEN** player money already meets bitnode money target
- **THEN** system skips money grinding phase
- **AND** proceeds directly to script launching

#### Scenario: Partial progress on stats
- **WHEN** some stats meet targets but others don't
- **THEN** system only trains stats below targets
- **AND** optimizes training order based on remaining requirements

### Requirement: Graceful API Degradation
Automation scripts SHALL check for API availability and exit gracefully with informative messages when APIs are unavailable.

#### Scenario: Gang API unavailable
- **WHEN** gang script runs without gang API (no SF2)
- **THEN** script logs warning message "Gang API unavailable. Need SF2 or BN2."
- **AND** script exits cleanly without errors

#### Scenario: Bladeburner API unavailable
- **WHEN** bladeburner script runs without bladeburner API (no SF7)
- **THEN** script logs warning message "Bladeburner API unavailable. Need SF7 or BN7."
- **AND** script exits cleanly without errors

#### Scenario: Sleeve API unavailable
- **WHEN** sleeve script runs without sleeve API (no SF10)
- **THEN** script logs warning message "Sleeve API unavailable. Need SF10 or BN10."
- **AND** script exits cleanly without errors

### Requirement: Status Visibility
The system SHALL provide clear status updates during startup showing progress, script states, and failure reasons.

#### Scenario: Script launch success
- **WHEN** script successfully launches
- **THEN** system logs "[✓] [scriptname] launched successfully"

#### Scenario: Script skipped due to prerequisites
- **WHEN** script is skipped due to unmet prerequisites
- **THEN** system logs "[⊘] [scriptname] skipped: [reason]"

#### Scenario: Script waiting for prerequisites
- **WHEN** script is waiting for prerequisites to be met
- **THEN** system logs "[⧗] [scriptname] waiting: [reason]"

#### Scenario: Startup dashboard
- **WHEN** startup process is running
- **THEN** system displays dashboard showing:
  - Current bitnode
  - Active phase (training, grinding, launching)
  - Running scripts count
  - Pending scripts count
  - Failed scripts with reasons

### Requirement: Configuration Customization
The system SHALL support command-line arguments to override default bitnode configurations.

#### Scenario: Override stat targets
- **WHEN** user runs with --stat-target 200 argument
- **THEN** all stat targets are set to 200 regardless of bitnode config

#### Scenario: Skip training phase
- **WHEN** user runs with --skip-training argument
- **THEN** training phase is completely bypassed
- **AND** system proceeds directly to money grinding or launching

#### Scenario: Force script launch
- **WHEN** user runs with --force argument
- **THEN** prerequisite checks are bypassed
- **AND** all scripts launch regardless of readiness

#### Scenario: Dry run mode
- **WHEN** user runs with --dry-run argument
- **THEN** system shows what would be launched without executing
- **AND** displays prerequisite status for each script

### Requirement: Backward Compatibility
The system SHALL maintain existing BN4 workflow behavior as the default configuration.

#### Scenario: BN4 unchanged behavior
- **WHEN** running startup in BN4 without arguments
- **THEN** behavior matches previous version (casino focus, same stat targets, same script order)

#### Scenario: Existing script functionality preserved
- **WHEN** scripts are launched with met prerequisites
- **THEN** internal script behavior is unchanged from previous version

### Requirement: Error Handling and Recovery
The system SHALL handle script launch failures and provide recovery options.

#### Scenario: Script launch failure
- **WHEN** script fails to launch due to error
- **THEN** error is logged with full details
- **AND** remaining scripts continue launching
- **AND** failed script is marked in status dashboard

#### Scenario: Retry failed launches
- **WHEN** user requests retry of failed scripts
- **THEN** system re-checks prerequisites for failed scripts
- **AND** relaunches scripts with met prerequisites

### Requirement: Source File Level Detection
The system SHALL detect available source files and their levels to inform prerequisite checks.

#### Scenario: SF2 Level 1 available
- **WHEN** checking for gang API availability
- **THEN** system detects SF2 level 1 or higher
- **AND** gang prerequisites pass API availability check

#### Scenario: No source files
- **WHEN** running in first bitnode playthrough (no source files)
- **THEN** system correctly identifies limited API availability
- **AND** only launches scripts compatible with base game

#### Scenario: High source file levels
- **WHEN** player has SF4-3, SF5-3 (Singularity API RAM reduction)
- **THEN** system accounts for reduced RAM costs in prerequisite checks
- **AND** adjusts RAM requirements for scripts using affected APIs
