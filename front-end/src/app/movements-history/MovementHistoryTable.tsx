"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

interface MovementRow {
  id: number;
  date: string;
  status: string;
  remarks: string,
  inventory?: { containerNumber?: string };
  shipment?: { jobNumber?: string; vesselName?: string };
  emptyRepoJob?: { jobNumber?: string; vesselName?: string };
  port?: { id?: number; portName?: string };
  addressBook?: { id?: number; companyName?: string };
}


const statusTransitions: Record<string, string[]> = {
  ALLOTTED: ["Empty Picked Up"],
  "EMPTY PICKED UP": ["Gate-In"],
  "GATE-IN": ["SoB"],
  SOB: ["Gate-Out"],
  "GATE-OUT": ["Empty Returned"],
  "EMPTY RETURNED": ["AVAILABLE", "UNAVAILABLE"],
  AVAILABLE: ["UNAVAILABLE"],
  UNAVAILABLE: ["AVAILABLE"],
};



const MovementHistoryTable = () => {
  const [data, setData] = useState<MovementRow[]>([]);
  const [containerSearch, setContainerSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [availableStatusOptions, setAvailableStatusOptions] = useState<string[]>([]);
  const [jobNumberForUpdate, setJobNumberForUpdate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [movementDate, setMovementDate] = useState(() => new Date().toISOString().slice(0, 10));


  useEffect(() => {
    axios.get("http://localhost:8000/movement-history/latest").then((res) => setData(res.data));
  }, []);

  const filteredData = data.filter((row) => {
    const containerMatch = row.inventory?.containerNumber
      ?.toLowerCase()
      .includes(containerSearch.toLowerCase());

    const jobMatch =
      row.shipment?.jobNumber?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      row.emptyRepoJob?.jobNumber?.toLowerCase().includes(jobSearch.toLowerCase());


    return (!containerSearch || containerMatch) && (!jobSearch || jobMatch);
  });

  const toggleSelectRow = (row: MovementRow) => {

    const sameJob = data.find((d) => selectedIds.includes(d.id));
    const selectedJob =
      sameJob?.shipment?.jobNumber || sameJob?.emptyRepoJob?.jobNumber;
    const currentRowJob = row.shipment?.jobNumber || row.emptyRepoJob?.jobNumber;

    const differentJobSelected = sameJob && selectedJob !== currentRowJob;

    if (differentJobSelected) {
      alert("Please select containers with the same Job Number (Shipping or Empty Repo).");
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
    );
  };

  const handleUpdateStatusClick = () => {
    const selectedRows = data.filter((row) => selectedIds.includes(row.id));
    const currentStatuses = [...new Set(selectedRows.map((r) => r.status))];

    if (currentStatuses.length !== 1) {
      alert("Selected containers must all have the same current status.");
      return;
    }


    // ✅ Updated to support both shipment and emptyRepoJob
    const currentStatus = currentStatuses[0]?.toUpperCase();
    const jobNumber =
      selectedRows[0].shipment?.jobNumber ||
      selectedRows[0].emptyRepoJob?.jobNumber ||
      "";


    setAvailableStatusOptions(statusTransitions[currentStatus] || []);
    setNewStatus("");
    setJobNumberForUpdate(jobNumber);
    setRemarks("");
    setModalOpen(true);
  };


  const handleBulkUpdate = async () => {
    if (!newStatus) {
      alert("Please select a new status.");
      return;
    }

    try {
      // First try shipment
      const shipmentRes = await axios.get("http://localhost:8000/shipment");
      const shipment = shipmentRes.data.find((s: any) => s.jobNumber === jobNumberForUpdate);

      // If no shipment, try emptyRepoJob
      let emptyRepoJob = null;
      if (!shipment) {
        const emptyRepoRes = await axios.get("http://localhost:8000/empty-repo-job");
        emptyRepoJob = emptyRepoRes.data.find((e: any) => e.jobNumber === jobNumberForUpdate);


      }

      let portId: number | undefined = undefined;
      let addressBookId: number | null | undefined = undefined;

      const source = shipment || emptyRepoJob;

      switch (newStatus.toUpperCase()) {
        case "EMPTY PICKED UP":
          break;

        case "GATE-IN":
          portId = source?.polPortId;
          addressBookId = null;
          break;

        case "SOB":
          portId = source?.podPortId || source?.polPortId;
          addressBookId = source?.carrierAddressBookId;
          break;

        case "GATE-OUT":
          portId = source?.podPortId;
          addressBookId = null;
          break;

        case "EMPTY RETURNED":
          portId = source?.podPortId;
          addressBookId = source?.emptyReturnDepotAddressBookId;
          break;

        case "AVAILABLE":
        case "UNAVAILABLE":
          break;

        default:
          return alert("Invalid status transition.");
      }

      if (["AVAILABLE", "UNAVAILABLE"].includes(newStatus.toUpperCase())) {
        const previous = data.find(d => selectedIds.includes(d.id));
        if (previous) {
          portId = previous.port?.id;
          addressBookId = previous.addressBook ? previous.addressBook.id : null;
        }
      }


      const payload: any = {
        ids: selectedIds,
        newStatus: newStatus.toUpperCase(),
        jobNumber: jobNumberForUpdate,
        date: movementDate,
      };

      payload.remarks = remarks.trim();


      if (portId !== undefined) payload.portId = portId;
      if (addressBookId !== undefined) payload.addressBookId = addressBookId;

      await axios.post("http://localhost:8000/movement-history/bulk-create", payload);

      alert("Status updated.");
      setSelectedIds([]);
      setModalOpen(false);
      const res = await axios.get("http://localhost:8000/movement-history/latest");
      setData(res.data);
    } catch (err: any) {
      console.error("Update failed:", err?.response || err?.message || err);
      alert("Update failed. Check console for details.");
    }
  };


  return (
    <div className="p-6 text-white min-h-screen">
      {/* Search Bar & Action */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Container No."
          value={containerSearch}
          onChange={(e) => setContainerSearch(e.target.value)}
          className="flex-1 min-w-[220px] bg-neutral-800 text-white px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="text"
          placeholder="Search Shipping Job No."
          value={jobSearch}
          onChange={(e) => setJobSearch(e.target.value)}
          className="flex-1 min-w-[220px] bg-neutral-800 text-white px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleUpdateStatusClick}
          disabled={selectedIds.length === 0}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded-md disabled:opacity-50"
        >
          Update Status
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-700">
        <table className="w-full text-sm bg-neutral-800">
          <thead className="bg-neutral-900 text-left text-neutral-300">
            <tr>
              <th className="p-3 text-center">Select</th>
              <th className="p-3">Date</th>
              <th className="p-3">Container No</th>
              <th className="p-3">Job No.</th>
              <th className="p-3">Status</th>
              <th className="p-3">Port</th>
              <th className="p-3">Location</th>
              <th className="p-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id} className="border-t border-neutral-700 hover:bg-neutral-700/30">
                <td className="text-center p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelectRow(row)}
                    className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500"
                  />
                </td>
                <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
                <td className="p-2">{row.inventory?.containerNumber || "-"}</td>
                <td className="p-2">{row.shipment?.jobNumber || row.emptyRepoJob?.jobNumber}</td>
                <td className="p-2 font-semibold text-orange-400">{row.status}</td>
                <td className="p-2">{row.port?.portName || "-"}</td>
                <td className="p-2">
                  {row.status.toUpperCase() === "SOB"
                    ? row.shipment?.vesselName || row.emptyRepoJob?.vesselName || "-"
                    : row.addressBook?.companyName || "-"}
                </td>
                <td className="p-2">
                  {row.remarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-neutral-700">
            <h2 className="text-lg font-semibold text-white mb-4">Bulk Update Container Status</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select New Status</option>
                {availableStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter any remarks..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default MovementHistoryTable;