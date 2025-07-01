'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Search, Trash2, Plus, History, Download } from 'lucide-react';
import axios from 'axios';
import AddShipmentForm from './AddShipmentForm';

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
import { generateCroPdf } from './generateCroPdf';

const AllShipmentsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [containerSearch, setContainerSearch] = useState('');

  // Add state for selected containers
  const [selectedContainers, setSelectedContainers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    id: undefined,
    status: true,
    quotationRefNo: '',
    refNumber: '',
    masterBL: '',
    shippingTerm: '',
    date: '',
    gsDate: '',
    sob: '',
    etaTopod: '',
    estimateDate: '',

    jobNumber: '',

    customerId: '',
    shipperId: '',
    consigneeId: '',
    carrierId: '',
    productId: '',
    portOfLoading: '',
    portOfDischarge: '',
    transhipmentPortId: '',
    expHandlingAgentId: '',
    impHandlingAgentId: '',
    emptyReturnDepotId: '',

    enableTranshipmentPort: false,

    quantity: '',
    containerNumber: '',
    capacity: '',
    tare: '',

    freeDays1: '',
    detentionRate1: '',
    freeDays2: '',
    detentionRate2: '',
  });

  const fetchShipments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/shipment');
      setShipments(res.data);
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    }
  };

  useEffect(() => {
    // Fetch once and log the raw response
    axios.get('http://localhost:8000/shipment')
      .then(res => {
        setShipments(res.data);
      })
      .catch(err => console.error('Failed to fetch shipments', err));
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this shipment?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/shipment/${id}`);
      await fetchShipments();
    } catch (err) {
      console.error('Failed to delete shipment', err);
      alert('Error deleting shipment.');
    }
  };

  const handleEdit = (shipment: any) => {

    // Initialize selectedContainers with the existing containers
    const existingContainers = (shipment.containers || []).map((container: any) => ({
      containerNumber: container.containerNumber || "",
      capacity: container.capacity || "",
      tare: container.tare || "",
      inventoryId: container.inventoryId || null,
      portId: container.portId || null,
      depotName: container.depotName || "",
    }));

    // Use correct field names matching what the form expects
    setFormData({
      id: shipment.id,
      status: shipment.status ?? true,
      quotationRefNo: shipment.quotationRefNumber || '',
      date: shipment.date ? new Date(shipment.date).toISOString().split('T')[0] : '',
      jobNumber: shipment.jobNumber || '',
      refNumber: shipment.refNumber || '',
      masterBL: shipment.masterBL || '',
      shippingTerm: shipment.shippingTerm || '',

      // Field names must match the state definition
      customerId: shipment.custAddressBookId?.toString() || '',
      consigneeId: shipment.consigneeAddressBookId?.toString() || '',
      shipperId: shipment.shipperAddressBookId?.toString() || '',
      carrierId: shipment.carrierAddressBookId?.toString() || '',

      // Product info
      productId: shipment.productId?.toString() || '',

      // Ports 
      portOfLoading: shipment.polPortId?.toString() || '',
      portOfDischarge: shipment.podPortId?.toString() || '',
      enableTranshipmentPort: !!shipment.transhipmentPortId,
      transhipmentPortId: shipment.transhipmentPortId?.toString() || '',

      // Free days and detention
      freeDays1: shipment.polFreeDays || '',
      detentionRate1: shipment.polDetentionRate || '',
      freeDays2: shipment.podFreeDays || '',
      detentionRate2: shipment.podDetentionRate || '',

      // Handling agents
      expHandlingAgentId: shipment.expHandlingAgentAddressBookId?.toString() || '',
      impHandlingAgentId: shipment.impHandlingAgentAddressBookId?.toString() || '',

      // Container data
      quantity: shipment.quantity || '',
      containerNumber: '',
      capacity: '',
      tare: '',

      // Date fields must match state definition
      gsDate: shipment.gsDate ? new Date(shipment.gsDate).toISOString().split('T')[0] : '',
      sob: shipment.sob ? new Date(shipment.sob).toISOString().split('T')[0] : '',
      etaTopod: shipment.etaTopod ? new Date(shipment.etaTopod).toISOString().split('T')[0] : '',

      // Depot
      emptyReturnDepotId: shipment.emptyReturnDepotAddressBookId?.toString() || '',
      estimateDate: shipment.estimateDate ? new Date(shipment.estimateDate).toISOString().split('T')[0] : '',
    });

    // Set selected containers
    setSelectedContainers(existingContainers);

    setShowModal(true);
  };

  // Add state for allMovements
  const [allMovements, setAllMovements] = useState<any[]>([]);

  useEffect(() => {
    // Fetch allMovements data from backend (update the URL as needed)
    axios.get('http://localhost:8000/shipment')
      .then(res => setAllMovements(res.data))
      .catch(err => console.error('Failed to fetch movements', err));
  }, []);

  const handleDownloadPDF = async (shipmentId: number, containers: any[]) => {
    const getSize = (inventoryId: number) => {
      const container = allMovements.find(m => m.inventoryId === inventoryId);
      return container?.inventory?.containerSize || "N/A";
    };

    await generateCroPdf(shipmentId, containers);
  };


  return (
    <div className="px-4 pt-0 pb-4">
      <div className="flex items-center justify-between mt-0 mb-4">
        <div className="relative mr-4 w-full max-w-sm">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <Input
              type="text"
              placeholder="Search by container..."
              value={containerSearch}
              onChange={(e) => setContainerSearch(e.target.value)}
              className="pl-10 h-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-400 focus-visible:ring-neutral-700"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            setFormData({
              id: undefined,
              status: true,
              quotationRefNo: '',
              refNumber: '',
              masterBL: '',
              shippingTerm: '',
              date: '',
              gsDate: '',
              sob: '',
              etaTopod: '',
              estimateDate: '',

              jobNumber: '',

              customerId: '',
              shipperId: '',
              consigneeId: '',
              carrierId: '',
              productId: '',
              portOfLoading: '',
              portOfDischarge: '',
              transhipmentPortId: '',
              expHandlingAgentId: '',
              impHandlingAgentId: '',
              emptyReturnDepotId: '',

              enableTranshipmentPort: false,

              quantity: '',
              containerNumber: '',
              capacity: '',
              tare: '',

              freeDays1: '',
              detentionRate1: '',
              freeDays2: '',
              detentionRate2: '',
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Shipment
        </Button>

        {showModal && (
          <AddShipmentForm
            onClose={() => setShowModal(false)}
            formTitle={formData.id ? 'Edit Shipment' : 'New Shipment Job'}
            form={formData}
            setForm={setFormData}
            refreshShipments={fetchShipments}
          />
        )}
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-800">
            <TableRow className="hover:bg-neutral-800/60 border-neutral-700">
              <TableHead className="text-neutral-300 font-medium">Shipment No.</TableHead>
              <TableHead className="text-neutral-300 font-medium">Date</TableHead>
              <TableHead className="text-neutral-300 font-medium">Customer</TableHead>
              <TableHead className="text-neutral-300 font-medium">Shipper</TableHead>
              <TableHead className="text-neutral-300 font-medium">Product</TableHead>
              <TableHead className="text-neutral-300 font-medium">Ports</TableHead>
              <TableHead className="text-neutral-300 font-medium">Containers</TableHead>
              <TableHead className="text-neutral-300 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-neutral-400 py-6">
                  No shipments found.
                </TableCell>
              </TableRow>
            ) : (
              shipments
                .filter((s: any) => {
                  // If search is empty, show all shipments
                  if (!containerSearch.trim()) return true;

                  // If containers array doesn't exist or is empty, don't filter it out
                  if (!s.containers || s.containers.length === 0) return false;

                  // Otherwise check if any container matches search
                  return s.containers.some((c: any) =>
                    c.containerNumber?.toLowerCase().includes(containerSearch.toLowerCase())
                  );
                })
                .map((shipment: any) => (
                  <TableRow
                    key={shipment.id}
                    className="text-white border-b border-neutral-800 hover:bg-neutral-800/50"
                  >
                    <TableCell className="font-medium">{shipment.jobNumber}</TableCell>
                    <TableCell>{new Date(shipment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{shipment.customerAddressBook?.companyName || '-'}</TableCell>
                    <TableCell>{shipment.shipperAddressBook?.companyName || '-'}</TableCell>
                    <TableCell>{shipment.product?.productName || '-'}</TableCell>
                    <TableCell>{shipment.polPort?.portName || '-'} → {shipment.podPort?.portName || '-'}</TableCell>
                    <TableCell>
                      {(shipment.containers ?? [])
                        .map((c: any) => c.containerNumber)
                        .join(', ') || '-'}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        onClick={() => handleEdit(shipment)}
                        title="Edit"
                        variant="ghost"
                        size="icon"
                        className="text-blue-400 hover:text-blue-300 hover:bg-neutral-800"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(shipment.id)}
                        title="Delete"
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-neutral-800"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-400  hover:text-green-500"
                        title="Download PDF"
                        onClick={() => handleDownloadPDF(shipment.id, shipment.containers ?? [])}
                      >
                        <Download size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AllShipmentsPage;
