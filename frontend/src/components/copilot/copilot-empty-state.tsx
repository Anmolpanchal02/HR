"use client";

const EXAMPLES = [
  "What is our leave policy?",
  "Show me active projects.",
  'Create a task for Rahul in PAY called "Fix Payment API".',
  "Summarize recent engineering activity.",
];

interface CopilotEmptyStateProps {
  onExampleClick: (prompt: string) => void;
}

export function CopilotEmptyState({ onExampleClick }: CopilotEmptyStateProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">AI Copilot</h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Ask questions, find information, and get work done across your organization.
      </p>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Try asking
      </p>
      <div className="mt-3 flex max-w-xl flex-col gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleClick(example)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            &ldquo;{example}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
