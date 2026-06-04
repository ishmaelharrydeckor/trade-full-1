"use client";

import { useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import AdminUsersTable, { type AdminUserRow } from "./AdminUsersTable";
import AdminFeedbackTable, { type BetaFeedbackRow } from "./AdminFeedbackTable";

type Tab = "users" | "feedback";

export default function AdminDashboardTabs({
  initialUsers,
  feedback,
}: {
  initialUsers: AdminUserRow[];
  feedback: BetaFeedbackRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div className="space-y-6">
      {/* Tabs list */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "users"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Users ({initialUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "feedback"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Beta Feedback ({feedback.length})</span>
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "users" ? (
          <AdminUsersTable initialUsers={initialUsers} />
        ) : (
          <AdminFeedbackTable feedback={feedback} />
        )}
      </div>
    </div>
  );
}
