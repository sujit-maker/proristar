"use client";

import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import axios from "axios";
import ExchangeRateForm from "./ExchangeRateForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ExchangeRate {
  id: number;
  fromCurrency: {
    currencyName: string;
    currencyCode: string;
  };
  toCurrency: {
    currencyName: string;
    currencyCode: string;
  };
  exchangeRate: string;
  variance: string;
  date: string;
}

const ExchangeRateTable = () => {
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editRecord, setEditRecord] = useState<ExchangeRate | null>(null);

  const handleAddExchangeRateClick = () => {
    setEditRecord(null);
    setShowExchangeRateModal(true);
  };

  const handleCloseModal = () => {
    setShowExchangeRateModal(false);
    setEditRecord(null);
  };

  const fetchExchangeRates = async () => {
    try {
      const res = await axios.get("http://128.199.19.28:8000/exchange-rates");
      setExchangeRates(res.data);
    } catch (err) {
      console.error("Failed to fetch exchange rates", err);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const filteredRates = exchangeRates.filter((rate) =>
    `${rate.fromCurrency?.currencyName} ${rate.toCurrency?.currencyName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleEdit = (record: ExchangeRate): void => {
    setEditRecord(record);
    setShowExchangeRateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this exchange rate?")) return;
    try {
      await axios.delete(`http://128.199.19.28:8000/exchange-rates/${id}`);
      fetchExchangeRates();
    } catch (err) {
      console.error("Failed to delete exchange rate:", err);
      alert("Failed to delete exchange rate.");
    }
  };

  return (
    <div className="px-4 pt-0 pb-4">
      <div className="flex items-center justify-between mt-0 mb-4">
        <div className="relative w-full mr-4 max-w-xs">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search exchange rates..."
            className="p-2 pl-10 rounded-lg bg-neutral-900 text-white placeholder-neutral-400 border border-neutral-800 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 px-6 shadow rounded-md whitespace-nowrap cursor-pointer"
          onClick={handleAddExchangeRateClick}
        >
          <Plus size={16} className="mr-2" />
          Add Exchange Rate
        </Button>
      </div>

      <div className="rounded-lg shadow border border-neutral-800 bg-neutral-900 overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-900">
            <TableRow>
              <TableHead className="text-center text-white">From Currency</TableHead>
              <TableHead className="text-center text-white">To Currency</TableHead>
              <TableHead className="text-center text-white">Rate</TableHead>
              <TableHead className="text-center text-white">Variance</TableHead>
              <TableHead className="text-center text-white">Date</TableHead>
              <TableHead className="text-center text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-neutral-400 bg-neutral-900">
                  No exchange rates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRates.map((rate) => (
                <TableRow key={rate.id} className="hover:bg-neutral-800 transition border-b border-neutral-800">
                  <TableCell className="text-center text-white">
                    {rate.fromCurrency?.currencyName} ({rate.fromCurrency?.currencyCode})
                  </TableCell>
                  <TableCell className="text-center text-white">
                    {rate.toCurrency?.currencyName} ({rate.toCurrency?.currencyCode})
                  </TableCell>
                  <TableCell className="text-center text-white">{rate.exchangeRate}</TableCell>
                  <TableCell className="text-center text-white">{rate.variance}</TableCell>
                  <TableCell className="text-center text-white">
                    {new Date(rate.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => handleEdit(rate)}
                        className="hover:bg-blue-900 hover:text-blue-400 text-neutral-300 transition-all duration-200 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => handleDelete(rate.id)}
                        className="hover:bg-red-900 hover:text-red-400 text-neutral-300 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showExchangeRateModal && (
        <ExchangeRateForm
          onClose={handleCloseModal}
          onSuccess={fetchExchangeRates}
          editData={editRecord}
        />
      )}
    </div>
  );
};

export default ExchangeRateTable;
