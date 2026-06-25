# Contributing to Shraddha Care Hub

Thank you for your interest in contributing to Shraddha Care Hub. We welcome community contributions to help make this project better for everyone. By participating, you agree to abide by our Code of Conduct.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [How Can I Contribute](#how-can-i-contribute)
- [Development Guidelines](#development-guidelines)
- [Code Review Process](#code-review-process)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Getting Started

### Prerequisites

- Node.js v18 or higher (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun package manager
- Git
- A GitHub account

### Quick Start

1. Fork the repository by clicking the "Fork" button on GitHub

2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Shraddha-Care-Hub.git
   cd Shraddha-Care-Hub
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Hosla-Extended-Family/Shraddha-Care-Hub.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

---

## Development Setup

### Environment Configuration

1. Create a `.env.local` file in the project root
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Add your Resend API key for email functionality:
   ```
   VITE_RESEND_API_KEY=your_resend_api_key
   ```

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development environment |
| `npm run lint` | Run ESLint on all files |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## Technology Stack

### Frontend
- React 18.3 - UI library
- TypeScript - Type-safe JavaScript
- Vite - Build tool and dev server
- Tailwind CSS - Utility-first CSS framework
- shadcn/ui - Component library based on Radix UI
- React Router DOM 6 - Client-side routing
- React Hook Form + Zod - Form handling and validation
- TanStack React Query 5 - Server state management
- Framer Motion - Animation library
- Lucide React - Icon library

### Backend
- Supabase - PostgreSQL database, authentication, storage, and edge functions
- Resend - Email service for transactional emails

### Development Tools
- ESLint - Code linting
- TypeScript ESLint - TypeScript linting
- Vitest - Unit testing framework
- Vite Image Optimizer - Image optimization

---

## Project Structure

```
Shraddha-Care-Hub/
├── src/
│   ├── assets/              # Static images and media
│   ├── components/
│   │   ├── about/           # About page components
│   │   ├── corporate/       # Corporate page components
│   │   ├── home/            # Home page components
│   │   ├── layout/          # Layout wrapper components
│   │   ├── team/            # Team section components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── integrations/
│   │   └── supabase/        # Supabase client and types
│   ├── lib/                 # Utility functions
│   ├── pages/
│   │   ├── admin/           # Admin dashboard pages
│   │   └── *.tsx            # Public pages
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles and design tokens
├── supabase/
│   ├── functions/           # Edge functions
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase configuration
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── eslint.config.js         # ESLint configuration
└── DOCUMENTATION.md         # Technical architecture details
```

---

## How Can I Contribute

### Reporting Bugs

Before creating a bug report:
1. Check the Issues tab to ensure it has not been reported
2. Search for related discussions

When creating a bug report:
1. Use the Bug Report template
2. Provide a clear title and description
3. Include steps to reproduce the bug
4. Describe expected and actual behavior
5. Add screenshots or videos if applicable
6. Mention browser and OS information
7. Include any relevant error messages or logs

### Suggesting Enhancements

Before suggesting a feature:
1. Check existing issues to avoid duplicates
2. Ensure the feature aligns with the project's mission

When creating a feature request:
1. Use the Feature Request template
2. Explain what the feature should do
3. Explain why it would be useful
4. Describe how it should work
5. Provide examples or mockups if relevant
6. Wait for maintainer approval before starting implementation

### Submitting Pull Requests

Always get approval for features before starting work.

#### Step 1: Create a Branch

Update your local main branch:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

Create a feature or fix branch:
```bash
git checkout -b feature/add-volunteer-verification
```

Branch naming conventions:
- Features: `feature/descriptive-name`
- Bug fixes: `fix/descriptive-name`
- Hotfixes: `hotfix/descriptive-name`
- Documentation: `docs/descriptive-name`

#### Step 2: Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add TypeScript types for new code
- Do not add unnecessary global dependencies
- Keep changes focused on a single concern

#### Step 3: Test Your Changes

- Run the linter: `npm run lint`
- Run tests: `npm run test`
- Test manually in the development environment
- Verify responsive design on multiple screen sizes

#### Step 4: Commit Your Changes

```bash
git add .
git commit -m "feat: add volunteer verification workflow"
```

See the Commit Messages section for format guidelines.

#### Step 5: Push and Create a Pull Request

```bash
git push origin feature/add-volunteer-verification
```

On GitHub:
1. Click "Compare & Pull Request"
2. Fill out the PR template completely
3. Reference related issues using "Fixes #123" or "Closes #456"
4. Provide context about your changes
5. Link any relevant documentation

---

## Development Guidelines

### Code Style

Use explicit types and avoid `any`:

```typescript
// Good
interface UserFormData {
  name: string;
  email: string;
  phone?: string;
}

const submitForm = async (data: UserFormData): Promise<void> => {
  // implementation
};

// Avoid
const submitForm = async (data: any) => {
  // implementation
};
```

### React Components

File naming:
- Use PascalCase for component files: `ContactForm.tsx`
- Use camelCase for utilities: `useFormValidation.ts`

Component structure:

```typescript
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const handleFormSubmit = useCallback(
    async (data: ContactFormData) => {
      setIsLoading(true);
      try {
        await onSubmit(data);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit]
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* form content */}
    </form>
  );
};

export default ContactForm;
```

### Form Handling

- Use React Hook Form combined with Zod for all forms
- Validate on both client-side and server-side
- Provide clear error messages
- Show loading states during submission

### Styling

- Use Tailwind CSS utility classes
- Follow design tokens defined in `tailwind.config.ts`
- Use semantic color variables (primary, secondary, accent, destructive)
- Test responsive design on multiple breakpoints

```typescript
// Good
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <Button className="w-full md:w-auto">Submit</Button>
</div>

// Avoid
<div style={{ display: 'flex', gap: '16px' }}>
  <button style={{ width: '100%' }}>Submit</button>
</div>
```

### Accessibility

- Use semantic HTML elements
- Include alt text for images
- Ensure keyboard navigation works
- Test with screen readers
- Use ARIA labels where needed

```typescript
// Good
<img
  src={teamMember.photo}
  alt={`${teamMember.name}, ${teamMember.role}`}
  className="rounded-lg"
/>

<button
  aria-label="Open navigation menu"
  onClick={() => setMenuOpen(!menuOpen)}
>
  Menu
</button>
```

### Performance

- Use React.memo for heavy components
- Implement code splitting with React Router
- Use React Query for efficient data fetching
- Optimize images with the image optimizer plugin
- Avoid unnecessary re-renders

---

## Code Review Process

### What to Expect

1. Automated checks will run for ESLint validation and TypeScript compilation
2. Tests must pass
3. Maintainers will review the code for quality, logic, and performance
4. You may receive feedback requesting changes before approval
5. Once approved and CI passes, your PR will be merged

### Best Practices for Code Review

- Keep PRs focused on one feature or fix
- Keep PRs reasonably sized (aim for less than 400 lines of changes)
- Respond promptly to review comments
- Ask clarifying questions if feedback is unclear
- Be respectful in all communications
- Be open to feedback and willing to iterate

---

## Commit Messages

Follow the Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without feature or fix changes
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, or tooling changes

### Examples

```bash
git commit -m "feat(donations): add confetti celebration after submission"
git commit -m "fix(contact-form): resolve validation error on mobile"
git commit -m "docs: add database schema documentation"
git commit -m "refactor(components): extract header navigation logic"
```

### Commit Body (for complex changes)

```
feat(abuse-reports): add evidence file upload with validation

- Add client-side file type and size validation
- Implement drag-and-drop interface
- Add progress indicator for uploads
- Show error messages for invalid files

Fixes #456
```

---

## Testing

### Running Tests

```bash
npm run test              # Run tests once
npm run test:watch       # Run tests in watch mode
```

### Writing Tests

Create test files next to components:

```
src/
├── components/
│   ├── ContactForm.tsx
│   └── ContactForm.test.ts
```

Example test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<ContactForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows error for invalid email', async () => {
    render(<ContactForm onSubmit={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

---

## Documentation

### When to Update Documentation

- Adding a new feature
- Changing existing functionality
- Adding new dependencies
- Database schema changes
- API endpoint changes

### Code Comments

Explain the reason behind code, not just what it does:

```typescript
// Good
// Rate limit submissions to prevent spam attacks
const rateLimit = 3;

// Avoid
// Set rate limit to 3
const rateLimit = 3;
```

### JSDoc Comments

For complex functions, use JSDoc:

```typescript
/**
 * Validates and submits abuse report
 * @param data - The report form data
 * @param options - Submission options
 * @returns Promise resolving to report ID
 * @throws Error if validation fails
 */
async function submitAbuseReport(
  data: AbuseReportData,
  options?: SubmitOptions
): Promise<string> {
  // implementation
}
```

### Update Main Documentation

- Update README.md for user-facing changes
- Update DOCUMENTATION.md for technical architecture details
- Keep DOCUMENTATION.md in sync with database and API changes

---

## Resources

- [Project Documentation](./DOCUMENTATION.md)
- [README](./README.md)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)

---

## Getting Help

- Questions: Open a Discussion on GitHub
- Found a bug: Create an Issue on GitHub
- Need setup help: Check the Development Setup section
- Email: shraddhawelfareassociation@gmail.com
- Phone: 7811009309

---

*Last Updated: January 2026*
*For Organization: Shraddha Welfare Association*
*Project URL: https://shraddha.hosla.in*
