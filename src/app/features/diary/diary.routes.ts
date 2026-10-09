import { Routes } from '@angular/router';

import { DiaryComponent } from './pages/diary/diary.component';

/** Маршруты фичи «Дневник» (монтируются в оболочке под authGuard). */
export const DIARY_ROUTES: Routes = [{ path: '', component: DiaryComponent }];
