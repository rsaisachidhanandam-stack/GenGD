import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Play
} from 'lucide-react';

interface DemoScriptWalkthroughProps {
  onClose: () => void;
  onExecuteStepAction: (stepNumber: number) => Promise<void>;
  currentVersion: number;
}

export const DemoScriptWalkthrough: React.FC<DemoScriptWalkthroughProps> = ({
  onClose,
  onExecuteStepAction,
  currentVersion
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [stepSuccessMessage, setStepSuccessMessage] = useState<string | null>(null);

  const steps = [
    {
      num: 1,
      title: 'Initial State Verification',
      goal: 'Confirm Server, Laptop, and Phone all begin at Version 1.',
      actionText: 'Reset Demo to Version 1',
      details: 'Seeds initial document "Product Specification PS-13.md" at Version 1 across both devices.'
    },
    {
      num: 2,
      title: 'Online Edit on Laptop (TC01)',
      goal: 'Edit a field on the laptop while online; server creates Version 2.',
      actionText: 'Execute Laptop Edit (Title -> V2)',
      details: 'Laptop submits a title change with baseVersion: 1. Server verifies currentVersion == 1 and creates immutable Version 2.'
    },
    {
      num: 3,
      title: 'Phone Goes Offline & Edits (TC03, TC10)',
      goal: 'Disconnect Phone; edit "Status" field; verify "Saved locally — pending sync".',
      actionText: 'Disconnect Phone & Make Offline Edit',
      details: 'Phone switches offline. Changes are stored durably into Phone\'s IndexedDB queue and will survive restart.'
    },
    {
      num: 4,
      title: 'Concurrent Laptop Server Edit (TC05)',
      goal: 'While Phone remains offline, edit "Description" on Laptop to advance Server to Version 3.',
      actionText: 'Execute Laptop Concurrent Edit (Description -> V3)',
      details: 'Server advances to Version 3. Now Phone\'s pending change has a stale baseVersion (V1).'
    },
    {
      num: 5,
      title: 'Phone Reconnects: Clean 3-Way Auto-Merge (TC06)',
      goal: 'Reconnect Phone; base version analyzed; non-overlapping fields merge automatically into Version 4.',
      actionText: 'Reconnect Phone & Auto-Merge',
      details: 'Since Phone changed "status" and Laptop changed "description" & "title", the changes do not overlap. Server auto-merges and creates Version 4 without data loss!'
    },
    {
      num: 6,
      title: 'Conflicting Edits on Same Field (TC07)',
      goal: 'Both devices modify "Content" differently; Phone reconnects; conflict is detected and preserved.',
      actionText: 'Trigger Conflicting Edits',
      details: 'Laptop edits content to V5a. Phone edits content offline. Phone reconnects -> Overlapping field detected -> Server refuses to overwrite and creates conflict record!'
    },
    {
      num: 7,
      title: 'Interactive Conflict Resolution & Convergence (TC12)',
      goal: 'Resolve conflict via 3-way modal; Server creates Version 5/6; both devices converge.',
      actionText: 'Open Conflict Resolver & Converge',
      details: 'User chooses explicit resolution (or custom merged text). Server commits resolution and both devices update to matching content.'
    },
    {
      num: 8,
      title: 'Security & Access Control Enforcement (SEC01, SEC02)',
      goal: 'Verify that an unauthorized user cannot read or edit document.',
      actionText: 'Test Security Enforcement (User B Attack)',
      details: 'Simulates User B attempting cross-user document access and request body userId tampering. Confirms strict 404 rejection.'
    }
  ];

  const handleRunCurrentStep = async () => {
    setIsRunning(true);
    setStepSuccessMessage(null);
    try {
      await onExecuteStepAction(activeStep);
      setStepSuccessMessage(`Step ${activeStep} executed successfully!`);
      if (activeStep < steps.length) {
        setTimeout(() => {
          setActiveStep(prev => prev + 1);
          setStepSuccessMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setStepSuccessMessage(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const currentStepObj = steps.find(s => s.num === activeStep) || steps[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '880px', maxHeight: '88vh' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Interactive Blueprint Demo Walkthrough (Section 12)
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Guided step-by-step verification of all core multi-device sync, offline, merge, and conflict scenarios.
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '8px 16px',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              style={{
                flex: 1,
                minWidth: '80px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: activeStep === s.num ? '1px solid var(--accent-purple)' : '1px solid transparent',
                background: activeStep === s.num ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                color: activeStep === s.num ? '#c084fc' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Step {s.num}
            </button>
          ))}
        </div>

        {/* Current Step Body */}
        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
              STEP {currentStepObj.num} OF {steps.length}
            </span>
            <span className="badge badge-synced">
              Current Server Version: V{currentVersion}
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {currentStepObj.title}
          </h3>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ color: 'var(--accent-blue)', marginTop: '2px' }}>
                <ArrowRight size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Objective:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentStepObj.goal}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Technical Mechanics:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {currentStepObj.details}
                </p>
              </div>
            </div>
          </div>

          {stepSuccessMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{stepSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={activeStep <= 1 || isRunning}
              onClick={() => setActiveStep(prev => prev - 1)}
            >
              Previous Step
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={activeStep >= steps.length || isRunning}
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              Next Step
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}
              onClick={handleRunCurrentStep}
              disabled={isRunning}
            >
              <Play size={15} />
              {isRunning ? 'Executing Step...' : currentStepObj.actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
