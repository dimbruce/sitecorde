import React, { useState } from "react";
import type { Project } from "../types";
import { X } from "lucide-react";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (projectData: Omit<Project, "id" | "pmId">) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [projectData, setProjectData] = useState({
    name: "",
    address: "",
    client: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!projectData.name || !projectData.address || !projectData.client) {
      setError("Project name, address, and client are required.");
      return;
    }
    onCreate(projectData);
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2
            id="create-project-title"
            className="text-xl font-bold text-slate-800"
          >
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div
                className="bg-red-100 text-red-700 p-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <fieldset>
              <legend className="text-base font-semibold text-slate-800 mb-2">
                Project Details
              </legend>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={projectData.name}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Project Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={projectData.address}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="client"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="client"
                    id="client"
                    value={projectData.client}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </fieldset>

            {/* Initial subcontractors section removed per requirements */}
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateProjectModal;
