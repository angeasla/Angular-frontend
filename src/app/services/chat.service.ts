import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  // Spring Boot Backend URL
  private apiUrl = 'http://localhost:8080/api/chat';

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
        catchError(error => {
          console.error('Chat API Error:', error);
          this.messagesSubject.next([
            ...this.messagesSubject.value,
            { role: 'ai', content: '⚠️ Υπήρξε ένα πρόβλημα επικοινωνίας με τον server. Παρακαλώ δοκίμασε ξανά.' }
          ]);
          return of(null);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      ).subscribe();
  }
}