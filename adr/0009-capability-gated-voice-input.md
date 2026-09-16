# 0009 — Voice input is capability-gated

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
The microphone button renders only when the browser exposes speech recognition, and uses the
browser's own Chinese engine. Recognised numbers fill the review form in field order. No
audio leaves the device.

## Rejected
- **Sending audio to a server speech-to-text service.** Rejected: it would send the user's
  voice, containing health readings, off the device.
- **Always showing the button and failing on click.** Rejected: a dead button on an
  unsupported browser is a broken promise for this audience.

## Why
Fastest input for slow typists, with zero new data leaving the device.

## Consequences
Dictation is unavailable on browsers without Chinese recognition; typing and photo remain.
