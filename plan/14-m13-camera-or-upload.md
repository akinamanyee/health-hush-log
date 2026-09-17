# M13 build plan — 相機或相簿

## Intent
Photo reading works naturally on phones and desktops: users can use the camera or upload an existing photo.

## Build
- Split the image picker into camera and upload controls.
- Keep drag-and-drop for desktop users.
- Continue downscaling in the browser and filling the editable review form only.

## Verify
- Photo-enabled modules show 用相機拍攝 and 上載照片.
- The reading is not saved until the user presses 儲存紀錄.