"use client";

const EXAMPLES = [
  {
    title: "Leave policy",
    prompt: "What is our leave policy?",
    hint: "Search company documents",
  },
  {
    title: "Active projects",
    prompt: "Show me active projects.",
    hint: "List projects by status",
  },
  {
    title: "Create a task",
    prompt: 'Create a task for Rahul in PAY called "Fix Payment API".',
    hint: "Find people & projects, then create",
  },
  {
    title: "Add an employee",
    prompt:
      "Create employee Priya Sharma, email priya@acme.com, Engineering, Software Engineer, joining today as FULL_TIME.",
    hint: "HR/Admin can onboard people",
  },
  {
    title: "Open tasks",
    prompt: "List all IN_PROGRESS tasks.",
    hint: "Filter work by status",
  },
  {
    title: "Find someone",
    prompt: "Find employee Rahul.",
    hint: "Look up people and roles",
  },
];

interface CopilotEmptyStateProps {
  onExampleClick: (prompt: string) => void;
}

export function CopilotEmptyState({ onExampleClick }: CopilotEmptyStateProps) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-4 py-10">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-from to-brand-to text-white shadow-md shadow-primary/25">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        How can I help?
      </h2>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Find and create people, projects, and tasks — or search company docs. I use your org data
        only through secure tools.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLES.map((example) => (
          <button
            key={example.title}
            type="button"
            onClick={() => onExampleClick(example.prompt)}
            className="group rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-all hover:border-border-strong hover:shadow-md"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-foreground">
              {example.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {example.hint}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
