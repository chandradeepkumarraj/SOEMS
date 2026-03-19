import shutil
import sys
import os

files_to_copy = [
    (r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\controllers\examController.ts", r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examController.ts"),
    (r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\controllers\examStatsController.ts", r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examStatsController.ts"),
    (r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\services\examService.ts", r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examService.ts"),
    (r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\utils\examWorker.ts", r"C:\Users\ASUS\Documents\GitHub\SOEMS\backend\src\modules\exam\examWorker.ts")
]

for src, dst in files_to_copy:
    try:
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Successfully copied {src} to {dst}")
        else:
            print(f"Source not found: {src}")
    except Exception as e:
        print(f"Error copying {src}: {str(e)}")
