"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddTariffModal from "./HandlingAgentTariff";

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status.toLowerCase() === "active";
  return (
    <span
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300
        ${isActive ? "bg-green-700 text-green-200" : "bg-red-700 text-red-200"}
        hover:scale-105`}
      style={{
        minWidth: 70,
        textAlign: "center",
        letterSpacing: 1,
      }}
    >
      {status}
    </span>
  );
};

const CostTariffPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: undefined,
    status: "Active",
    tariffCode: "",
    handlingAgentName: "",
    servicePort: "",
    currency: "USD",
    "IMP Commission": 0,
    "EXP Commission": 0,
    "Transhipment Commission": 0,
    "Empty Repo Commission": 0,
    "Detention Commission": 0,
  });

  const fetchTariffData = async () => {
    try {
      const response = await axios.get("http://128.199.19.28:8000/handling-agent-tariff-cost");
      setTariffData(response.data);
    } catch (error) {
      console.error("Failed to fetch tariff data", error);
    }
  };

  useEffect(() => {
    fetchTariffData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`http://128.199.19.28:8000/handling-agent-tariff-cost/${id}`);
        fetchTariffData();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    // Keep the full height container with overflow-auto
    <div className="h-screen overflow-auto">
      {/* Reduce the min-width to prevent table from pushing sidebar */}
      <div className="px-4 py-6 min-w-[1200px]"> {/* Reduced from 1500px to 1200px */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Handling Agent Tariff</h2>
          <Button
            onClick={() => {
              setForm({
                id: undefined,
                status: "Active",
                tariffCode: "",
                handlingAgentName: "",
                servicePort: "",
                currency: "USD",
                "IMP Commission": 0,
                "EXP Commission": 0,
                "Transhipment Commission": 0,
                "Empty Repo Commission": 0,
                "Detention Commission": 0,
              });
              setShowModal(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            <Plus className="mr-2" size={16} /> Add Tariff
          </Button>
        </div>

        {showModal && (
          <AddTariffModal
            onClose={() => setShowModal(false)}
            formTitle={form.id ? "Edit Tariff" : "Add Tariff"}
            form={form}
            setForm={setForm}
            handleSuccess={fetchTariffData}
          />
        )}

        <div className="rounded-lg shadow border border-neutral-800 bg-neutral-900 overflow-hidden">
          {/* Add a wrapper div with horizontal scroll for just the table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Make header cells more compact */}
                  {["Tariff Code", "Agent", "Service", "Currency", "IMP", "EXP", "Tranship", "Empty Repo", "Detention", "Status", "Actions"].map(
                    (header) => (
                      <TableHead key={header} className="text-white px-2 py-2 whitespace-nowrap">
                        {header}
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffData.length > 0 ? (
                  tariffData.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-neutral-800 text-white">
                      <TableCell>{item.tariffCode}</TableCell>
                      <TableCell>{item.addressBook?.companyName || "N/A"}</TableCell>
                      <TableCell>{item.port?.portName || "N/A"}</TableCell>
                      <TableCell>{item.currency?.currencyName || "N/A"}</TableCell>
                      <TableCell>{item.impCommission}</TableCell>
                      <TableCell>{item.expCommission}</TableCell>
                      <TableCell>{item.transhipmentCommission}</TableCell>
                      <TableCell>{item.emptyRepoCommission}</TableCell>
                      <TableCell>{item.detentionCommission}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setForm({
                              id: item.id,
                              status: item.status,
                              tariffCode: item.tariffCode,
                              handlingAgentName: item.addressBookId?.toString() || "",
                              servicePort: item.portId?.toString() || "",
                              currency: item.currencyId?.toString() || "",
                              "IMP Commission": item.impCommission,
                              "EXP Commission": item.expCommission,
                              "Transhipment Commission": item.transhipmentCommission,
                              "Empty Repo Commission": item.emptyRepoCommission,
                              "Detention Commission": item.detentionCommission,
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-6 text-gray-400">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostTariffPage;
