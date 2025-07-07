import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CurrencyFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any; // for edit mode
}

const AddCurrencyForm: React.FC<CurrencyFormProps> = ({
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    currencyCode: "",
    currencyName: "",
    currencySymbol: "",
    status: "Active",
  });

  // Populate form for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        currencyCode: initialData.currencyCode || "",
        currencyName: initialData.currencyName || "",
        currencySymbol: initialData.currencySymbol || "",
        status: initialData.status || "Active",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (initialData?.id) {
        // PUT for edit
        response = await axios.patch(
          `http://128.199.19.28:8000/currency/${initialData.id}`,
          formData
        );
      } else {
        // POST for add
        response = await axios.post("http://128.199.19.28:8000/currency", formData);
      }
      onSubmit(response.data);
      onClose();
    } catch (error) {
      console.error("Error submitting currency:", error);
      alert("Failed to submit currency. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-lg">
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-full bg-neutral-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto p-0 border border-neutral-800">
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
            <DialogTitle className="text-xl font-semibold text-white">
              {initialData ? "Edit Currency" : "Add Currency"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X size={24} />
            </Button>
          </DialogHeader>
          <form className="px-6 pb-6 pt-2" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="currencyCode"
                className="block text-neutral-200 mb-1"
              >
                Currency Code
              </label>
              <Input
                id="currencyCode"
                type="text"
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleChange}
                placeholder="Currency Code"
                required
                className="bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-400"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="currencyName"
                className="block text-neutral-200 mb-1"
              >
                Currency Name
              </label>
              <Input
                id="currencyName"
                type="text"
                name="currencyName"
                value={formData.currencyName}
                onChange={handleChange}
                placeholder="Currency Name"
                required
                className="bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-400"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="currencySymbol"
                className="block text-neutral-200 mb-1"
              >
                Symbol
              </label>
              <Input
                id="currencySymbol"
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                placeholder="Symbol"
                required
                className="bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-400"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="status" className="block text-neutral-200 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 rounded bg-neutral-800 text-white border border-neutral-700 text-sm transition-all focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter className="flex justify-end gap-3 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {initialData ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddCurrencyForm;