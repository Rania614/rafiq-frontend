# Rafiq Frontend

A project management dashboard for planning work across projects, epics, and tasks. Built during my Frontend Developer training at Rafiq (June – July 2026).

## Features

- **Authentication:** sign up, login with "remember me", forgot and reset password, logout.
- **Projects and epics:** paginated lists with loading, empty, and error states, create and edit forms, and epic search.
- **Tasks:** board view with drag-and-drop status updates across eight statuses, a paginated list view, and a create-task form.
- **Members:** members table with role badges, invite-member modal, and an invitation acceptance page.

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Redux Toolkit, React Hook Form, Zod, dnd-kit, Supabase Auth and REST API called with `fetch`, ESLint, Prettier, pnpm.

## My Role

I implemented the frontend in this repository from Figma designs. Work was organized by ticket, on feature branches merged through pull requests.

## Technical Challenges & Solutions

### Challenge: Drag and drop on a board whose columns load separately

**Problem:** Each of the eight status columns loads its own tasks and count from the API, so moving a card changes the data of two columns.

**Approach:** Save the change first and then refresh from the server, so the board never shows a move that was not stored.

**Solution:** On drop, I ignore drops outside a column or onto the same status, send a `PATCH` with the new status, and on success change a refresh key that makes every column refetch. A toast reports success or failure.

**Result:** The board always matches what the server has stored, and a failed update leaves the card in place and tells the user.

### Challenge: One task list, two pagination behaviors

**Problem:** Numbered pages work on desktop but are awkward on a phone.

**Approach:** Keep one endpoint and page size, and choose the behavior by screen width.

**Solution:** Totals come from the `Content-Range` response header. Desktop shows page numbers (first, last, current, and neighbors). Below 768px, an `IntersectionObserver` loads the next page on scroll, a ref blocks overlapping requests, new rows are merged by id, and crossing the breakpoint resets the list.

**Result:** Scrolling on mobile does not produce duplicate rows or parallel requests, and both views show consistent counts.

### Challenge: Searching epics across all pages

**Problem:** Filtering only the loaded page would miss epics on other pages.

**Approach:** Run the search in the API and limit how often it is called.

**Solution:** The search term is debounced by 400 ms and sent as a case-insensitive title filter. Changing the term resets to page 1, a ref of the last request skips repeats, and "no results" is shown separately from "no epics yet".

**Result:** Search covers every epic in the project and sends one request per pause in typing.

### Challenge: Failing early on bad configuration and bad reset links

**Problem:** A missing or malformed Supabase URL sent auth requests to relative URLs, and a reset-password link without a token could still be submitted.

**Approach:** Validate once at build time, then guard the forms.

**Solution:** `next.config.ts` stops the build if either environment variable is missing or the URL is not http(s), and the URL is normalized in one helper. Login and sign-up check the configuration before calling the API, and the reset form is disabled with a clear message when the token is missing.

**Result:** A misconfigured deployment fails at build time, and users see a clear message when a link or configuration is invalid.

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # then set the two Supabase variables
pnpm dev
```

The app needs a Supabase project with the matching tables and functions, which are not part of this repository.
