import React from "react";

interface AccountInfoModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  email: string;
  phone: string | null;
  onVerify: () => void;
}

const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ open, onClose, name, email, phone, onVerify }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Account Info</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500">Name</div>
            <div className="font-medium text-slate-800">{name || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Email</div>
            <div className="font-medium text-slate-800">{email || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Phone</div>
            <div className="flex items-center gap-2">
              <div className="font-medium text-slate-800">{phone || "Not set"}</div>
              <button
                type="button"
                onClick={onVerify}
                className="px-2 py-1 text-xs rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoModal;
