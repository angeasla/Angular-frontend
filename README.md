# Εργασιακός Οδηγός — Angular Frontend

A Progressive Web App (PWA) that serves as a digital guide for Greek labor rights. It provides workers with calculators for salaries, bonuses, severance pay, pensions, and more — along with a knowledge base (wiki) and an AI-powered chat assistant.

## Features

- **Labor Rights Wiki** — Browse articles on employment law, leaves, dismissals, and more
- **Calculation Tools** — 15 interactive calculators covering:
  - Net/Gross salary conversion
  - Leave days & leave pay
  - Severance pay (dismissal compensation)
  - Overtime, night shifts, 6th day work
  - Easter & Christmas bonus (full-time, part-time, hourly)
  - Maternity leave (reduced hours conversion)
  - National Pension (Εθνική Σύνταξη)
  - Contributory Pension (Ανταποδοτική Σύνταξη)
- **AI Chat Assistant** — Ask questions about labor rights (connects to the Spring Boot backend)
- **i18n Ready** — All UI text is externalized via `ngx-translate` (Greek locale included)
- **Responsive Design** — Mobile-first with Material Design components

## Tech Stack

- **Angular 21** (standalone components, new control flow syntax)
- **Angular Material** (UI components, theming)
- **ngx-translate** (internationalization)
- **ngx-markdown** (Markdown rendering in AI chat)
- **RxJS** (reactive state management)
- **SCSS** (component-scoped styles)

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Build for production
ng build
```

The app runs at `http://localhost:4200` by default.

## Project Structure

```
src/app/
├── ai-chat-dialog/          # AI chat dialog component
├── home/                     # Landing page with hero & feature cards
├── services/
│   ├── chat.service.ts       # Chat state management & backend communication
│   ├── layout.service.ts     # Sidenav & menu state
│   └── wiki.service.ts       # Wiki article loading
├── tools/
│   ├── dialogs/              # 15 calculator dialog components
│   └── tools.component.ts    # Tools grid & dialog registry
├── wiki/
│   └── wiki-article/         # Markdown article renderer
├── app.ts                    # Root component (toolbar, sidenav, routing)
├── app.config.ts             # App providers configuration
└── app.routes.ts             # Route definitions
```

## Related Projects

This frontend connects to a **Spring Boot backend** that provides:
- RAG-based AI chat (DeepSeek API + vector embeddings of the labor rights knowledge base)
- REST API for chat message processing

The backend repository is maintained separately. Configure the backend URL in `src/app/services/chat.service.ts`.

## Configuration

| Setting | Location | Description |
|---------|----------|-------------|
| Backend API URL | `src/app/services/chat.service.ts` | Spring Boot chat endpoint |
| Translations | `public/assets/i18n/el.json` | Greek UI strings |
| Wiki Content | `public/assets/wiki/` | Markdown articles |


