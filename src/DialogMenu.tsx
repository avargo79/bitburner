import React, { useState } from "react";

export interface DialogMenuProps {
  onStage0: () => void;
  // Add more handlers for future menu actions
}

/**
 * DialogMenu - Extensible React menu for Bitburner automation
 *
 * Usage:
 *   - Add new buttons for automation actions as needed
 *   - Connect handlers via props or context
 *   - Style and extend freely for new features
 */
export const DialogMenu: React.FC<DialogMenuProps> = ({ onStage0 }) => {
  const [open, setOpen] = useState(true);

  return open ? (
    <div className="dialog-menu" style={{ position: "fixed", top: 40, right: 40, background: "#222", color: "#fff", padding: 24, borderRadius: 8, zIndex: 9999 }}>
      <h2>Bitburner Menu</h2>
      <button onClick={onStage0} style={{ marginBottom: 12 }}>Stage 0: Train & Mug</button>
      {/* Example additional menu actions: */}
      <button onClick={() => alert('Train Stat')}>Train Stat</button>
      <button onClick={() => alert('Commit Crime')}>Commit Crime</button>
      <button onClick={() => alert('Run Script')}>Run Script</button>
      <button onClick={() => alert('Manage Servers')}>Manage Servers</button>
      <button onClick={() => alert('Solve Contract')}>Solve Contract</button>
      <button onClick={() => alert('Faction Progress')}>Faction Progress</button>
      <button onClick={() => alert('Gang Manager')}>Gang Manager</button>
      <button onClick={() => alert('Corp Manager')}>Corp Manager</button>
      <button onClick={() => alert('Stock Automation')}>Stock Automation</button>
      <button onClick={() => alert('Hacknet Manager')}>Hacknet Manager</button>
      <button onClick={() => alert('Casino Automation')}>Casino Automation</button>
      <button onClick={() => alert('Reputation Farming')}>Reputation Farming</button>
      <button onClick={() => alert('Scheduler')}>Scheduler</button>
      {/* End example actions. Add real handlers as needed. */}
      <button onClick={() => setOpen(false)}>Close</button>
    </div>
  ) : null;
};
