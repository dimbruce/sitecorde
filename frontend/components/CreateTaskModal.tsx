import React, { useState } from "react";
import type { Trade } from "../types";
import { X } from "lucide-react";

interface CreateTaskModalProps {
  trades: Trade[];
  onClose: () => void;
  onCreate: (data: { tradeId: string; name: string }) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ trades, onClose, onCreate }) => {
  const [tradeId, setTradeId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!tradeId) {
      setError("Please select a subcontractor (trade).");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a task name.");
      return;
    }
    onCreate({ tradeId, name: name.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Create New Task</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm" role="alert">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Rough-in Plumbing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subcontractor (Trade)</label>
              <select
                value={tradeId}
                onChange={(e) => setTradeId(e.target.value)}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a trade…</option>
                {trades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.contact ? `— ${t.contact}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
