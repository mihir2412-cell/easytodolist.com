# easy todo list

Domain: easytodolist.com

## Project Overview

Create a modern online todo list website with a clean Vercel-inspired design, built with Astro and Tailwind 4. The site should be fast, minimal, and focused on usability with no signup barrier.

Core functions:
- Add a reminder
- Shareable todo lists
- Categorization and progress tracking

## Design direction

- Simple, crisp hero section with a headline, subheadline, and primary CTA.
- Soft gradients, subtle shadows, and clear spacing.
- Use modern typography, rounded buttons, and neutral background layers.
- Keep the interface lighter in feel and easier to scan than competitor sites.
- Strong mobile-first layout, with a responsive card system for tasks and categories.

## Features to build

1. Task creation
   - Quick add input on the main page.
   - Support for title, category, and optional reminder date/time.

2. Categories
   - Add, edit, and switch categories.
   - Show category pill badges and counts.

3. Progress tracking
   - Progress bar showing completed tasks vs total.
   - Summary text like "4 of 8 tasks done".

4. Shareable lists
   - Generate a shareable URL for the current list.
   - Copy link button and social share placeholder.
   - Ability to view the shared list without login.

5. Optional reminders
   - Mark tasks with a reminder date.
   - Show upcoming reminders in a separate mini-panel.

6. Better UX than competitor
   - Faster interactions with Astro's partial hydration.
   - Cleaner information hierarchy and stronger whitespace.
   - Keyboard shortcuts for adding and completing tasks.
   - Dark mode support with toggle.
   - Accessible controls and semantic HTML.
   - Local save + cloud sharing, no login required.

## Page outline

- Hero: Title, subtitle, CTA button, and mini feature summary.
- Task panel: input, categories, list preview, and progress.
- How it works: 3 step cards (Add, Categorize, Share).
- Benefits: no signup, fast, secure, shareable.
- Footer: domain, branding, simple links.

## Implementation notes

- Use Astro page components and Tailwind 4 utility classes.
- Keep styling minimal and consistent.
- Create reusable cards for features and task items.
- Use `@DESIGN.md` as the central specification for typography, spacing, colors, and component behavior.

## Ideas to make it better than the competitor

- Provide a shareable list link instantly without requiring signup.
- Add category filtering and progress badges.
- Offer reminders and due-date indicators.
- Focus on a premium, sanitized UI without clutter.
- Add helpful onboarding copy and clear CTAs.
- Make the app feel faster with lightweight Astro pages.
- Add desktop and mobile friendly interactions, plus keyboard shortcuts.
- Consider a small persistent header with quick actions and a share button.

## Notes for development

This file should be used as the starting design brief for the Astro project. Build the homepage to reflect the domain easytodolist.com with a polished, simple layout and shareable task workflow.
