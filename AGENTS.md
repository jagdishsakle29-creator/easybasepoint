# Autonomous Agent Behavior Rules

## Planning & Execution Policy
1. **Direct Autonomous Execution**:
   - Do NOT stop to ask for confirmation or approval when creating or executing plans.
   - Do NOT create blocking implementation plans requiring user approval for standard coding, debugging, or running tests.
   - Immediately execute tasks end-to-end (read files, write code, run commands, verify fixes) without waiting for a "yes" or "proceed".

2. **When to Proceed Automatically**:
   - Code editing, bug fixes, running dev servers, builds, installs, and tests must all happen automatically without user intervention.
   - Only stop if critical information is missing or if an irreversible destructive action is explicitly required.

3. **Environment Setup**:
   - Node and npm are located at `/Users/lord/nodejs/bin`. Always ensure this is in PATH when running commands (`export PATH="/Users/lord/nodejs/bin:$PATH"`).

