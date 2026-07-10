import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiBaseUrl}/api/chat`;

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([
    { role: 'ai', content: 'Γεια σου! Είμαι ο ψηφιακός βοηθός εργασιακών δικαιωμάτων. Πώς μπορώ να σε βοηθήσω σήμερα;' }
  ]);
  public messages$ = this.messagesSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  sendMessage(content: string) {
    const currentMessages = this.messagesSubject.value;
    const newMessages = [...currentMessages, { role: 'user', content } as ChatMessage];

    // Update UI immediately with the user's message
    this.messagesSubject.next(newMessages);
    this.isLoadingSubject.next(true);

    // SLIDING WINDOW: Only send the last 6 messages to prevent payload overflow
    const payload = {
      messages: newMessages.slice(-6)
    };

    // Call Spring Boot backend
    this.http.post<ChatMessage>(this.apiUrl, payload)
      .pipe(
        tap(response => {
          this.messagesSubject.next([...this.messagesSubject.value, response]);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Chat API Error:', error);
          this.messagesSubject.next([
            ...this.messagesSubject.value,
            { role: 'ai', content: this.errorMessage(error) }
          ]);
          return of(null);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      ).subscribe();
  }

  /**
   * Maps an HTTP failure to a user-facing Greek chat bubble. The backend per-IP rate limiter replies
   * 429 with `{ error: <Greek message>, retryAfterSeconds: N }` and a `Retry-After` header — surface
   * that message + the wait time rather than the generic "problem talking to the server".
   */
  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 429) {
      const msg = error.error?.error ?? 'Πάρα πολλά αιτήματα. Περίμενε λίγο πριν στείλεις νέο μήνυμα.';
      const retryAfter = error.error?.retryAfterSeconds ?? Number(error.headers?.get('Retry-After'));
      return retryAfter > 0 ? `${msg} (δοκίμασε ξανά σε ${this.formatWait(retryAfter)})` : msg;
    }
    if (error.status === 0) {
      return '⚠️ Δεν υπάρχει σύνδεση με τον server. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.';
    }
    return '⚠️ Υπήρξε ένα πρόβλημα επικοινωνίας με τον server. Παρακαλώ δοκίμασε ξανά.';
  }

  /** Render a seconds wait as a short Greek phrase ("45 δευτερόλεπτα" / "2 λεπτά"). */
  private formatWait(seconds: number): string {
    if (seconds >= 60) {
      const mins = Math.ceil(seconds / 60);
      return `${mins} λεπτ${mins === 1 ? 'ό' : 'ά'}`;
    }
    const secs = Math.ceil(seconds);
    return `${secs} δευτερόλεπτ${secs === 1 ? 'ο' : 'α'}`;
  }
}