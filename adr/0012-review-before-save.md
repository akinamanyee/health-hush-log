# 0012 — AI-extracted values are always reviewed before saving

Date: 2026-09-16 (HKT) · Status: accepted

## Decision
Photo and voice input fill an editable form; nothing is stored until the user presses save.
Extraction uses a strict schema that allows nulls: unreadable fields stay empty rather than
being guessed, and failures show a real Traditional Chinese error.

## Rejected
- **Auto-saving a successful extraction.** Rejected: OCR on a device screen is the least
  reliable step in the product; a wrong saved number is a wrong health record.
- **Filling missing fields with a plausible value.** Rejected: silent invention.

## Why
The user is the final authority on their own reading.

## Consequences
One extra confirmation tap per photo, which is also what makes the feature trustworthy.
