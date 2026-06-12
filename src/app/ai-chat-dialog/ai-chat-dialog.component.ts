import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService } from '../services/chat.service';

// --- Imports Εργαλείων (Αντιγραφή από tools.component.ts) ---
import { GrossToNetDialogComponent } from '../tools/dialogs/gross-to-net-dialog/gross-to-net-dialog.component';
import { LeaveDaysDialogComponent } from '../tools/dialogs/leave-days-dialog/leave-days-dialog.component';
import { LeavePartTimeDialogComponent } from '../tools/dialogs/leave-part-time-dialog/leave-part-time-dialog.component';
import { LeavePayDialogComponent } from '../tools/dialogs/leave-pay-dialog/leave-pay-dialog.component';
import { DismissalDialogComponent } from '../tools/dialogs/dismissal-dialog/dismissal-dialog.component';
import { OvertimeDialogComponent } from '../tools/dialogs/overtime-dialog/overtime-dialog.component';
import { EasterBonusDialogComponent } from '../tools/dialogs/easter-bonus-dialog/easter-bonus-dialog.component';
import { EasterPartTimeDialogComponent } from '../tools/dialogs/easter-part-time-dialog/easter-part-time-dialog.component';
import { EasterHourlyDialogComponent } from '../tools/dialogs/easter-hourly-dialog/easter-hourly-dialog.component';
import { ChristmasBonusDialogComponent } from '../tools/dialogs/christmas-bonus-dialog/christmas-bonus-dialog.component';
import { ChristmasPartTimeDialogComponent } from '../tools/dialogs/christmas-part-time-dialog/christmas-part-time-dialog.component';
import { ChristmasHourlyDialogComponent } from '../tools/dialogs/christmas-hourly-dialog/christmas-hourly-dialog.component';
import { MaternityLeaveDialogComponent } from '../tools/dialogs/maternity-leave-dialog/maternity-leave-dialog.component';
import { NationalPensionDialogComponent } from '../tools/dialogs/national-pension-dialog/national-pension-dialog.component';
import { ContributoryPensionDialogComponent } from '../tools/dialogs/contributory-pension-dialog/contributory-pension-dialog.component';

@Component({
  selector: 'app-ai-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    TextFieldModule,
    MarkdownModule,
  ],
  templateUrl: './ai-chat-dialog.component.html',
  styleUrls: ['./ai-chat-dialog.component.scss'],
})
export class AiChatDialogComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  userInput = '';

  // Το Μητρώο των εργαλείων (ίδιο με της σελίδας Tools)
  private readonly toolRegistry: Record<string, { component: any; maxWidth?: string }> = {
    'salary': { component: GrossToNetDialogComponent },
    'leave-days': { component: LeaveDaysDialogComponent, maxWidth: '500px' },
    'leave-part-time': { component: LeavePartTimeDialogComponent },
    'leave-pay': { component: LeavePayDialogComponent },
    'severance': { component: DismissalDialogComponent },
    'overtime': { component: OvertimeDialogComponent },
    'easter-bonus': { component: EasterBonusDialogComponent },
    'easter-part-time': { component: EasterPartTimeDialogComponent },
    'easter-hourly': { component: EasterHourlyDialogComponent },
    'xmas-bonus': { component: ChristmasBonusDialogComponent },
    'xmas-part-time': { component: ChristmasPartTimeDialogComponent },
    'xmas-hourly': { component: ChristmasHourlyDialogComponent },
    'maternity': { component: MaternityLeaveDialogComponent },
    'national-pension': { component: NationalPensionDialogComponent },
    'contributory-pension': { component: ContributoryPensionDialogComponent },
  };

  constructor(
    public chatService: ChatService,
    private dialog: MatDialog // Injecting το MatDialog για να ανοίγουμε Modals
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  sendMessage() {
    if (this.userInput.trim()) {
      this.chatService.sendMessage(this.userInput);
      this.userInput = '';
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Μέθοδος που ανοίγει το Modal του αντίστοιχου εργαλείου ΠΑΝΩ από το Chat!
  openTool(key: string): void {
    const entry = this.toolRegistry[key];
    if (entry) {
      this.dialog.open(entry.component, {
        width: '95vw',
        maxWidth: entry.maxWidth || '600px',
        panelClass: 'tool-dialog',
      });
    }
  }
}