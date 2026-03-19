@echo off
echo Deleting old placeholders...
del /F /Q "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examController.ts"
del /F /Q "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examStatsController.ts"
del /F /Q "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examWorker.ts"
del /F /Q "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examService.ts"

echo Copying large files...
copy /Y "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\controllers\examController.ts" "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examController.ts"
copy /Y "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\controllers\examStatsController.ts" "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examStatsController.ts"
copy /Y "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\services\examService.ts" "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examService.ts"
copy /Y "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\utils\examWorker.ts" "C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examWorker.ts"

echo Done.
