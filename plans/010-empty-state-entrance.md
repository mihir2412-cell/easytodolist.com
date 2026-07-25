# 010 — Empty state has no entrance animation

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: LOW (missed opportunity)
- **Category**: Missed Opportunity
- **Estimated scope**: 1 file, small

## Problem

The empty state appears with no animation. For new users who have no tasks, there's no visual guidance — just a static layout that appears instantly.

Location: `TodoApp.tsx:1098-1115`

```tsx
{/* Current — static, no animation */}
{filteredTodos.length === 0 && (
  <div className="text-center py-10 sm:py-12">
    <svg ... />
    <p>No tasks yet</p>
    <button>Add first task</button>
    <p>Press N</p>
  </div>
)}
```

## Target

Add entrance animation to guide user attention:

```tsx
{/* Target — gentle entrance animation */}
{filteredTodos.length === 0 && (
  <div className="text-center py-10 sm:py-12 animate-fade-in">
    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 animate-fade-in stagger-container-fast" ... />
    <p className="text-body text-mute mb-4 animate-fade-in stagger-container-fast" style={{ animationDelay: '50ms' }}>No tasks yet</p>
    <button className="animate-fade-in stagger-container-fast" style={{ animationDelay: '100ms' }}>Add first task</button>
    <p className="text-caption text-mute mt-4 animate-fade-in stagger-container-fast hidden sm:block" style={{ animationDelay: '150ms' }}>Press N</p>
  </div>
)}
```

Use a new stagger delay for empty state elements (100ms increments since it's only 4 items):

```css
/* Add to global.css if not using stagger-container */
.stagger-container-empty > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container-empty > *:nth-child(2) { animation-delay: 100ms; }
.stagger-container-empty > *:nth-child(3) { animation-delay: 200ms; }
.stagger-container-empty > *:nth-child(4) { animation-delay: 300ms; }
```

## Repo conventions to follow

- `animate-fade-in` uses `var(--duration-page: 400ms)` — but this is rare/first-time, so longer is acceptable
- Stagger 50-100ms per item for guidance
- Empty state is LOW-frequency (users only see it when list is empty)

## Steps

1. In `src/styles/global.css`, optionally add `.stagger-container-empty` with 100ms increments:
   ```css
   .stagger-container-empty > *:nth-child(1) { animation-delay: 0ms; }
   .stagger-container-empty > *:nth-child(2) { animation-delay: 100ms; }
   .stagger-container-empty > *:nth-child(3) { animation-delay: 200ms; }
   .stagger-container-empty > *:nth-child(4) { animation-delay: 300ms; }
   ```

2. In `TodoApp.tsx`, wrap the empty state content with `animate-fade-in` and add stagger:
   ```tsx
   {filteredTodos.length === 0 && (
     <div className="text-center py-10 sm:py-12 animate-fade-in">
       <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ animation: 'fade-in 300ms ease-out forwards', opacity: 0, animationDelay: '0ms' }} />
       <p className="text-body text-mute mb-4" style={{ animation: 'fade-in 300ms ease-out forwards', opacity: 0, animationDelay: '75ms' }}>No tasks yet</p>
       {/* Button and keyboard hint follow... */}
     </div>
   )}
   ```

   Or use a simpler approach with just `animate-fade-in` on the container (CSS stagger handles children):
   ```tsx
   <div className="text-center py-10 sm:py-12 animate-fade-in stagger-container-empty">
   ```

## Boundaries

- Do NOT make it too dramatic — this is a productivity app, not a marketing page
- Duration 300-400ms is appropriate (first-time user guidance)
- Keep the content identical — just add motion
- Stagger should guide attention: icon → text → button → hint

## Verification

- **Mechanical**: Build succeeds
- **Feel check**:
  - Clear all tasks (or start fresh) → empty state fades in with subtle stagger
  - User's eye is guided down the content naturally
  - At 10% playback: can see the cascade of elements appearing
- **Done when**: New users on empty list feel guided, not lost