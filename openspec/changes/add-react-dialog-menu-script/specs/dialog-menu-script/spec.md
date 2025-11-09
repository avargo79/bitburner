## ADDED Requirements
### Requirement: React Dialog Menu Script
The system SHALL provide a script called `x` that opens a React dialog window in-game, featuring a menu-driven interface for interacting with the game and its scripts.

#### Scenario: Open Dialog Window
- **WHEN** the user runs the `x` script
- **THEN** a React dialog window SHALL appear in-game

#### Scenario: Menu Navigation
- **WHEN** the dialog is open
- **THEN** the user SHALL be able to navigate a menu to interact with game features and scripts

#### Scenario: Extensible UI
- **WHEN** new features are added
- **THEN** the dialog menu SHALL support extension without breaking existing functionality

### Requirement: Extensible Menu Options
The dialog menu SHALL support adding new buttons for common automation and management actions, including but not limited to:
- Training individual stats to user-specified targets
- Studying hacking
- Committing crimes for money
- Running scripts (user selection)
- Managing servers (scan, analyze, upgrade, deploy)
- Solving coding contracts
- Managing factions/augmentations
- Gang and corporation automation
- Stock market automation
- Hacknet node management
- Casino automation
- Reputation farming
- Scheduling recurring tasks

#### Scenario: Add New Menu Button
- **WHEN** a new automation or management action is identified
- **THEN** a corresponding button SHALL be added to the dialog menu, allowing the user to trigger that action

### Requirement: Stage 0 Button
The dialog menu SHALL include a button labeled "Stage 0". When clicked, it SHALL:
- Train all combat stats in the gym to at least 50
- Then, perform mugging until the user has at least $200,000

#### Scenario: Stage 0 Button Behavior
- **WHEN** the user clicks the "Stage 0" button
- **THEN** all combat stats SHALL be trained in the gym to at least 50
- **AND THEN** the system SHALL perform mugging until the user's money is at least $200,000
