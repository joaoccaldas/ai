# Initiation gate

## Product rule

This is theatrical access, not cryptographic security. The current 3D cycling studio remains untouched behind an isolated entrance layer.

## 30-second ceremony

- 0–4s: freehub clicks, curtains move, the medieval 5D quantum door wakes up.
- 4–10s: Klaus, the tipsy koala MC, falls onto the stage and tries to recover his dignity.
- 10–15s: Valentino, an alien supermodel, glides in holding the Sacred Ring.
- 15–20s: Boo performs a horror jump scare, then reveals he is from Compliance.
- 20–26s: five trial sigils wake up. Klaus explains that correct answers are insecure and patterns are safer.
- 26–30s: the ceremony malfunctions, the stage shakes, and the five trials begin.

## Five puzzle rules

1. Identity / persistence: asks "What's your name?". Any text is rejected three times; the fourth submission passes.
2. Consistency: four nonsense answers change every round. The user passes by choosing the same physical position three times in a row.
3. Rhythm: absurd yes/no questions change every tap. The user passes by alternating left/right five times.
4. Restraint: a giant red button says "Press to continue". The user passes by leaving it alone for roughly five seconds. Clicking it resets the timer.
5. Combination / memory: Klaus, Valentino, Boo and the Door flash a random five-step sequence. The user reproduces the sequence.

The semantic answer is never graded. The system only evaluates interaction patterns.

## Runtime

- gate.css: cinematic stage, medieval door, responsive characters and trial UI.
- gate.js: 30-second timeline, procedural Web Audio and five-trial state machine.
- Existing app.js remains unchanged.
- Passing stores a session-only unlock.
- Add ?gate=1 to force a replay for testing.

## Blender / Higgsfield source scene

A Blender 5.2 source scene was created through Higgsfield 3D Jutsu with:

- medieval split door and stage
- Klaus
- Valentino
- Boo
- five trial sigils
- lighting
- animated camera
- 30-second timeline

Project: WYLD Bike Archive — 30s Initiation Stage
3D Jutsu project ID: 3d4536ad-5dd5-4c57-92bc-8bbffb013df7

The lightweight web characters are deliberately isolated from the existing Three.js bike renderer. The Blender scene is the source for a later high-fidelity GLB replacement without destabilizing the current studio.

## Production checklist

- [x] Preserve existing bike renderer and film system
- [x] Medieval horror / failed awards-stage entrance
- [x] 30-second cinematic pre-show
- [x] Klaus / Valentino / Boo
- [x] Procedural sound after user gesture
- [x] Five pattern-based trials
- [x] First question is "What's your name?"
- [x] First three name submissions fail; fourth passes
- [x] No semantic answer grading
- [x] Final random combination memory puzzle
- [x] Door unlock payoff
- [x] Mobile layout
- [x] Reduced-motion path
- [x] Session-only unlock
- [x] Force replay via ?gate=1
- [x] Blender/Higgsfield source scene
- [ ] Replace lightweight runtime characters with approved optimized GLB character meshes
- [ ] Add final voiced performances after voice direction is approved
