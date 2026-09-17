# M11 build plan — 少一步記錄

## Intent
Users record immediately without entering age or gender. Any chart that cannot be applied without those details says 「無適用參考標準」 and still saves the reading.

## Build
- Remove the homepage profile form from the live app.
- Remove profile input from grading, CSV export and summary generation.
- Purge the old profile storage key while preserving all measurement histories.

## Verify
- No age or gender fields appear.
- Hand grip, sit-and-reach and body-fat percentage can save and show 「無適用參考標準」.