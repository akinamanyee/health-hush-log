# Cover page button repositioning

## Goal
Move the "進入" button on the cover page so it sits clearly below the two health icons, with improved vertical spacing and responsive alignment.

## What we will do

1. Inspect the current cover layout and the `front-page-2` asset safe zones so the real button aligns with the visual button/anchors in the image.
2. In `src/routes/index.tsx`, reposition the bottom section:
   - Lower the button from the very bottom edge (`pb-24`) so it appears just beneath the two icons.
   - Reduce excessive bottom padding and add a comfortable, consistent gap above the button (e.g., `gap-6` or `gap-8`) so the icons and button read as one group.
3. Preserve accessibility:
   - Keep the button large (`min-h-14`, `text-lg`, wide min tap target).
   - Maintain high contrast against the cover background.
   - Keep the "私隱與資料使用" trigger visible and tappable, but move it if it conflicts with the new button position.
4. Verify on desktop and mobile viewports that:
   - The button is not overlapping the icons.
   - Spacing looks balanced and not cramped.
   - The privacy link does not collide with the button.

## Out of scope
- No changes to navigation target (`/logbook`).
- No changes to the privacy dialog content.
- No new assets or icons added; this is a layout/spacing change only.

## Success check
- Screenshot the cover at mobile and desktop widths.
- Confirm the "進入" button appears below the two icons with clear, even spacing.
