import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  suggestedToolKey?: string;   // Το tag που έστειλε το AI (π.χ. 'severance')
  suggestedToolName?: string;  // Το ωραίο όνομα για το κουμπί
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  // private apiUrl = 'http://localhost:8080/api/chat';
  private apiUrl = '/api/chat';

  // Λεξικό για να μεταφράζουμε τα tags του AI σε ανθρώπινους τίτλους
  private readonly TOOL_NAMES: Record<string, string> = {
    'salary': 'Υπολογισμός Μισθού',
    'leave-days': 'Ημέρες Αδείας',
    'leave-part-time': 'Ημέρες Αδείας (Εκ περιτροπής)',
    'leave-pay': 'Επίδομα Αδείας',
    'severance': 'Υπολογισμός Αποζημίωσης',
    'overtime': 'Υπερωρίες & Νυχτερινά',
    'easter-bonus': 'Δώρο Πάσχα',
    'easter-part-time': 'Δώρο Πάσχα (Εκ περιτροπής)',
    'easter-hourly': 'Δώρο Πάσχα (Ωρομίσθιοι)',
    'xmas-bonus': 'Δώρο Χριστουγέννων',
    'xmas-part-time': 'Δώρο Χριστουγέννων (Εκ περιτροπής)',
    'xmas-hourly': 'Δώρο Χριστουγέννων (Ωρομίσθιοι)',
    'maternity': 'Άδεια Μητρότητας',
    'national-pension': 'Εθνική Σύνταξη',
    'contributory-pension': 'Ανταποδοτική Σύνταξη'
  };

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

    this.messagesSubject.next(newMessages);
    this.isLoadingSubject.next(true);

    const payload = { messages: newMessages.slice(-6) };

    this.http.post<ChatMessage>(this.apiUrl, payload)
      .pipe(
        tap(response => {
          let text = response.content;
          let suggestedKey: string | undefined = undefined;
          let suggestedName: string | undefined = undefined;

          // Regular Expression: Ψάχνει για [TOOL: κάτι] οπουδήποτε στο κείμενο
          const match = text.match(/\[TOOL:\s*([a-zA-Z0-9-]+)\]/i);
          if (match) {
            suggestedKey = match[1].toLowerCase();
            suggestedName = this.TOOL_NAMES[suggestedKey] || 'Άνοιγμα Εργαλείου';
            // Αφαιρούμε το Tag από το κείμενο για να μη φανεί στο chat
            text = text.replace(match[0], '').trim(); 
          }

          const enrichedResponse: ChatMessage = {
            role: response.role,
            content: text,
            suggestedToolKey: suggestedKey,
            suggestedToolName: suggestedName
          };

          this.messagesSubject.next([...this.messagesSubject.value, enrichedResponse]);
        }),
        catchError(error => {
          console.error('Chat API Error:', error);
          this.messagesSubject.next([
            ...this.messagesSubject.value,
            { role: 'ai', content: '⚠️ Υπήρξε ένα πρόβλημα επικοινωνίας με τον server.' }
          ]);
          return of(null);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      ).subscribe();
  }
}