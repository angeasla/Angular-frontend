import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [TranslateModule],
  template: `<h2>{{ 'NAV.WIKI' | translate }}</h2><p>Επίλεξε ένα άρθρο από το μενού.</p>`,
})
export class WikiComponent implements OnInit {
  constructor(private layoutService: LayoutService) {}

  ngOnInit(): void {
    this.layoutService.showSidenav();
  }
}
