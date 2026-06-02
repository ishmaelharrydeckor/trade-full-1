// app/(dashboard)/mentoring/page.tsx
// Stub page — prevents 404 when "Mentoring" is clicked in the nav.
// Replace contents when mentoring features ship.

export default function MentoringPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#131b2e] flex items-center justify-center border border-[#1e2a42]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h1 className="text-lg font-medium text-white">Mentoring</h1>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        Mentoring features are coming in a future release — connect with a mentor,
        share your journal, and get personalised trade reviews.
      </p>
      <span className="text-xs bg-[#131b2e] text-blue-400 border border-blue-900/50 px-3 py-1 rounded-full">
        Coming soon
      </span>
    </main>
  );
}
