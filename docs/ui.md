# UI controls

## Decision record

### Context

The screens already call NestJS. Buttons, fields, and the nav were styled by hand in `globals.css`.

### Problem

Make the controls look like a normal application, without a second form system and without moving business rules into the browser.

### Options considered

Plain CSS, Tailwind only, shadcn/ui on Tailwind, MUI, Ant Design, and Mantine.

### Decision

Use **shadcn/ui** with **Tailwind CSS**. The CLI preset is `base-nova` (Base UI, not Radix). Components are copied into `frontend/components/ui`.

Zod still checks forms before `fetch`. React Hook Form is not added.

### Reasons

The button, input, label, and card live in this repo, so they can be read and changed. MUI, Ant Design, and Mantine would wrap the app in a larger design system than these pages need.

### Trade-offs

Tailwind class names are a new syntax. The shadcn preset also adds theme variables we are not using yet, including a dark-mode block. There is no theme switch.

### Consequences

Login, signup, the nav, the shops page, My products, and Transfers use these components. Search and sort run in the browser on the list the server already fetched. The public shelf at `/shops/[shopId]` still uses the older list styles. Plain `button` rules in `globals.css` apply only when the element has no `data-slot`, so they do not paint over a shadcn button. The sort menu does not use `DropdownMenuLabel`: that part throws unless it sits inside a menu group.
