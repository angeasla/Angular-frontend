import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'wiki', redirectTo: 'wiki/./general_index.md', pathMatch: 'full' },
  { path: 'wiki/:folder/:file', loadComponent: () => import('./wiki/wiki-article/wiki-article.component').then(m => m.WikiArticleComponent) },
  { path: 'tools', loadComponent: () => import('./tools/tools.component').then(m => m.ToolsComponent) },
];
