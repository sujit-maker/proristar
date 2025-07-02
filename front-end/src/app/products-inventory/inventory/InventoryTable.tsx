"use client";

import React, { useEffect, useState } from 'react';
import { History, HistoryIcon, Pencil, Search, Trash2 } from "lucide-react";
import AddContainerForm from '../inventory/CreateInventoryForm';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MovementHistoryModal from './MovementHistoryModal';

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={
      "inline-block px-4 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300 hover:scale-105 " +
      (status === "Active"
        ? "bg-green-900/80 text-green-300"
        : "bg-red-900/80 text-red-300")
    }
    style={{
      minWidth: 70,
      textAlign: "center",
      letterSpacing: 1,
      cursor: "default",
    }}
  >
    {status === "Active" ? "Active" : "Inactive"}
  </span>
);

const ProductsInventoryPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  type AddressBookEntry = { id: number; companyName: string;[key: string]: any };
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedContainerNumber, setSelectedContainerNumber] = useState<string | null>(null);

  const handleAddContainerClick = () => {
    setSelectedInventoryId(null);
    setShowModal(true);
    setShowTable(true);
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/inventory');
      setInventoryData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setLoading(false);
    }
  };

  const handleEditClick = (id: number): void => {
    setSelectedInventoryId(id);
    setShowModal(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await axios.delete(`http://localhost:8000/inventory/${id}`);
      setInventoryData(inventoryData.filter((item) => item.id !== id));
      alert('Inventory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting inventory:', error.response?.data || error);
      alert('Failed to delete inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetch("http://localhost:8000/addressbook")
      .then((res) => res.json())
      .then((data) => setAddressBook(data))
      .catch((err) => console.error("Failed to fetch address book", err));
  }, []);

  const handleViewHistory = (containerNumber: string) => {
    setSelectedContainerNumber(containerNumber);
    setShowHistoryModal(true);
  };

  const getCompanyName = (addressbookId: any) => {
    const entry = addressBook.find((ab) => ab.id === addressbookId);
    return entry ? entry.companyName : "Unknown";
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInventoryId(null);
    fetchInventoryData();
  };

  // Filter data based on search term
  const filteredData = inventoryData.filter((item) =>
    item.containerNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-6 bg-black min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex items-center w-full max-w-sm">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <Input
            placeholder="Search containers..."
            className="pl-10 bg-neutral-900 border-neutral-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          onClick={handleAddContainerClick}
        >
          Add Container
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-900">
            <TableRow>
              <TableHead className="text-neutral-200">Ownership</TableHead>
              <TableHead className="text-neutral-200">Owner/Leaser</TableHead>

              <TableHead className="text-neutral-200">Container No</TableHead>
              <TableHead className="text-neutral-200">Category</TableHead>
              <TableHead className="text-neutral-200">Type</TableHead>
              <TableHead className="text-neutral-200">Class</TableHead>
              <TableHead className="text-neutral-200">Capacity</TableHead>
              <TableHead className="text-neutral-200">Next Inspection Due Date</TableHead>
              <TableHead className="text-neutral-200">Off Hire Date</TableHead>
              <TableHead className="text-neutral-200">Movement Status</TableHead>
              <TableHead className="text-neutral-200">Status</TableHead>
              <TableHead className="text-neutral-200 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4 text-neutral-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4 text-neutral-400">
                  No inventory data found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="border-b border-neutral-800 bg-neutral-900 hover:bg-neutral-800">
                  <TableCell className="text-neutral-200">
                    {/* First check if there are leasing records with ownershipType */}
                    {item.leasingInfo?.length > 0 && item.leasingInfo[0].ownershipType
                      ? item.leasingInfo[0].ownershipType
                      : /* If no leasing records or no ownershipType in leasing record, use the top-level ownershipType */
                      (item.ownershipType ||
                        /* If there are leasing records but no ownershipType, default to "Lease" */
                        (item.leasingInfo?.length > 0 ? "Lease" : "Own"))}
                  </TableCell>
                  <TableCell className="text-neutral-200">
                    {item.leasingInfo?.[0]?.ownershipType === "Own"
                      ? "RISTAR"
                      : item.leasingInfo?.[0]
                        ? getCompanyName(item.leasingInfo[0].leasoraddressbookId)
                        : "N/A"}
                  </TableCell>


                  <TableCell className="text-neutral-200">{item.containerNumber}</TableCell>
                  <TableCell className="text-neutral-200">{item.containerCategory}</TableCell>
                  <TableCell className="text-neutral-200">{item.containerType}</TableCell>
                  <TableCell className="text-neutral-200">{item.containerClass}</TableCell>
                  <TableCell className="text-neutral-200">{item.containerCapacity}</TableCell>
                  <TableCell className="text-neutral-200">
                    {item.periodicTankCertificates?.[0]?.nextDueDate
                      ? new Date(item.periodicTankCertificates[0].nextDueDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-neutral-200">
                    {item.leasingInfo?.[0]?.offHireDate
                      ? new Date(item.leasingInfo[0].offHireDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-neutral-200">{item.movementStatus || 'N/A'}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 cursor-pointer"
                        onClick={() => handleEditClick(item.id)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 cursor-pointer"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        title="View History"
                        className="text-green-400 hover:text-green-500"
                        onClick={() => handleViewHistory(item.containerNumber)}
                      >
                        <HistoryIcon size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open) handleCloseModal();
        setShowModal(open);
      }}>
        <DialogContent
          className="
      bg-neutral-900 border border-neutral-800
      max-h-[90vh] overflow-y-auto
      backdrop-blur-md
      "
          style={{
            // Narrower width to prevent horizontal scrolling
            width: "85vw",
            maxWidth: "950px"
          }}
        >
          <DialogTitle className="sr-only">
            {selectedInventoryId ? 'Edit Container' : 'Add Container'}
          </DialogTitle>
          {showModal && (
            <AddContainerForm
              onClose={handleCloseModal}
              inventoryId={selectedInventoryId || 0}
              editData={selectedInventoryId ? inventoryData.find(item => item.id === selectedInventoryId) : null}
              isEditMode={!!selectedInventoryId}
            />
          )}
        </DialogContent>
      </Dialog>

      {showHistoryModal && selectedContainerNumber && (
        <MovementHistoryModal
          containerNumber={selectedContainerNumber}
          onClose={() => setShowHistoryModal(false)}
          
        />
      )}
    </div>
  );
};

export default ProductsInventoryPage;
