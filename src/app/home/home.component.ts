import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { AiChatDialogComponent } from '../ai-chat-dialog/ai-chat-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.layoutService.hideSidenav();
  }

  ngOnDestroy(): void {
    this.layoutService.showSidenav();
  }

  openAiChat(): void {
    this.dialog.open(AiChatDialogComponent, {
      width: '95vw',
      maxWidth: '700px',
      panelClass: 'chat-dialog-panel',
    });
  }

  goToWiki(): void {
    this.router.navigate(['/wiki']);
  }
}
