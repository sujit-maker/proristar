"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Option = { id: string | number; name: string };
type ProductOption = {
  id: number;
  productId: string;
  productName: string;
  productType: string;
};

type SelectOptions = {
  customer: Option[];
  product: ProductOption[];
  port: Option[];
  agent: Option[];
  depot: Option[];
  shippingTerm: Option[];
};


const AddShipmentModal = ({
  onClose,
  formTitle,
  form,
  setForm,
  refreshShipments,
}: any) => {
  const [consigneeSuggestions, setConsigneeSuggestions] = useState<any[]>([]);
  const [carrierSuggestions, setCarrierSuggestions] = useState<any[]>([]);
  const [shipperSuggestions, setShipperSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allMovements, setAllMovements] = useState<any[]>([]);
  const [selectedContainers, setSelectedContainers] = useState<any[]>([]);
  const [allInventories, setAllInventories] = useState<any[]>([]);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const res = await axios.get("http://localhost:8000/movement-history");

        // Group by containerNumber inside inventory
        const grouped: { [key: string]: any[] } = {};
        for (const m of res.data) {
          const containerNo = m.inventory?.containerNumber;
          if (!containerNo) continue;

          if (!grouped[containerNo]) grouped[containerNo] = [];
          grouped[containerNo].push(m);
        }

        // Get latest entry per container, filter AVAILABLE ones
        const latestAvailableOnly = Object.values(grouped)
          .map((group: any[]) =>
            group.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]
          )
          .filter((m) => m.status === "AVAILABLE");

        setAllMovements(latestAvailableOnly);
      } catch (err) {
        console.error("Failed to fetch movements", err);
      }
    };

    fetchMovements();
  }, []);



  const handleContainerSearch = (value: string) => {
    setForm({ ...form, containerNumber: value });

    if (value.length >= 2) {
      const matched = allMovements
        .filter(
          (m) =>
            m.inventory?.containerNumber &&
            m.inventory.containerNumber.toLowerCase().includes(value.toLowerCase())
        )
        .sort(
          (a, b) =>
            new Date(a.inventory?.createdAt || a.createdAt).getTime() -
            new Date(b.inventory?.createdAt || b.createdAt).getTime()
        ); // FIFO: oldest first

      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (item: any) => {
    const containerNo = item.inventory?.containerNumber;
    if (
      selectedContainers.some(
        (c) => c.containerNumber === containerNo
      )
    )
      return;

    const newContainer = {
      containerNumber: containerNo,
      capacity: item.inventory?.containerCapacity,
      tare: item.inventory?.tareWeight,
      inventoryId: item.inventory?.id,
      portId: item.port?.id || null,
      port: item.port || null,
      depotName: item.addressBook?.companyName || "",
    };

    const updatedContainers = [...selectedContainers, newContainer];
    setSelectedContainers(updatedContainers);

    setForm({
      ...form,
      containers: updatedContainers.map((c) => ({
        containerNumber: c.containerNumber,
        capacity: c.capacity,
        tare: c.tare,
        inventoryId: c.inventoryId,
        portId: c.portId,
        depotName: c.depotName,
        
      })),
      containerNumber: "",
      capacity: "",
      tare: "",
      portName: "",
      depotName: "",
    });
    setSuggestions([]);
  };


  const handleRemoveContainer = (index: number) => {
    const updated = [...selectedContainers];
    updated.splice(index, 1);
    setSelectedContainers(updated);
  };


  const [selectOptions, setSelectOptions] = useState<SelectOptions>({
    customer: [],
    product: [],
    port: [],
    agent: [],
    depot: [],
    shippingTerm: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields ONLY for new shipments (not for edits)
      if (!form.id) {
        const requiredFields = [
          'customerName', 'productName', 'portOfLoading',
          'portOfDischarge', 'expHandlingAgent', 'impHandlingAgent',
          'emptyReturnDepot'
        ];

        for (const field of requiredFields) {
          if (!form[field]) {
            alert(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return;
          }
        }
      }

      // Build payload with only the fields that have values
      const payload: any = {};

      // Basic fields
      if (form.quotationRefNo) payload.quotationRefNumber = form.quotationRefNo;
      if (form.date) payload.date = new Date(form.date).toISOString();
      if (form.jobNumber) payload.jobNumber = form.jobNumber;
      if (form.referenceNumber) payload.refNumber = form.referenceNumber;
      if (form.masterBL) payload.masterBL = form.masterBL;
      if (form.shippingTerm) payload.shippingTerm = form.shippingTerm;

      // IDs - convert to numbers if they exist
      if (form.customerName) payload.custAddressBookId = parseInt(form.customerName);
      if (form.consigneeId) payload.consigneeAddressBookId = parseInt(form.consigneeId);
      if (form.shipperId) payload.shipperAddressBookId = parseInt(form.shipperId);
      if (form.productId) payload.productId = form.productId; // this is now a number ✅
      if (form.portOfLoading) payload.polPortId = parseInt(form.portOfLoading);
      if (form.portOfDischarge) payload.podPortId = parseInt(form.portOfDischarge);
      if (form.expHandlingAgent) payload.expHandlingAgentAddressBookId = parseInt(form.expHandlingAgent);
      if (form.impHandlingAgent) payload.impHandlingAgentAddressBookId = parseInt(form.impHandlingAgent);
      if (form.carrierId) payload.carrierAddressBookId = parseInt(form.carrierId);
      if (form.emptyReturnDepot) payload.emptyReturnDepotAddressBookId = parseInt(form.emptyReturnDepot);

      // Transhipment port if enabled
      if (form.enableTranshipmentPort && form.transhipmentPortName) {
        payload.transhipmentPortId = parseInt(form.transhipmentPortName);
      }

      // Other numerical fields - use defaults if not provided
      payload.polFreeDays = form.freeDays1 || "0";
      payload.podFreeDays = form.freeDays2 || "0";
      payload.polDetentionRate = form.detentionRate1 || "0";
      payload.podDetentionRate = form.detentionRate2 || "0";
      payload.quantity = form.quantity || String(selectedContainers.length);
      payload.vesselName = form.vesselName || "Default Vessel";

      // Date fields - use current date as fallback
      if (form.gateClosingDate) payload.gsDate = new Date(form.gateClosingDate).toISOString();
      if (form.sobDate) payload.sob = new Date(form.sobDate).toISOString();
      if (form.etaToPod) payload.etaTopod = new Date(form.etaToPod).toISOString();
      if (form.estimatedEmptyReturnDate) payload.estimateDate = new Date(form.estimatedEmptyReturnDate).toISOString();

      // Always include containers
      if (selectedContainers.length > 0) {
        payload.containers = selectedContainers.map((c) => ({
          containerNumber: c.containerNumber || "",
          capacity: c.capacity || "",
          tare: c.tare || "",
          inventoryId: c.inventoryId || null,
          portId: c.portId || null,
          depotName: c.depotName || "",
        }));
      }
      if (form.id) {
        // For PATCH (Edit)
        await axios.patch(`http://localhost:8000/shipment/${form.id}`, payload);
        alert("Shipment updated successfully!");
      } else {
        // For POST (New)
        await axios.post("http://localhost:8000/shipment", payload);
        alert("Shipment created successfully!");
      }

      if (refreshShipments) refreshShipments(); // Refresh parent
      onClose(); // Close modal
    } catch (error: any) {
      console.error("Error submitting shipment", error);
      alert(`Failed to submit shipment: ${error.response?.data?.message || error.message}`);
    }
  };





  const handleImportData = async () => {
    if (!form.quotationRefNo) return;
    try {
      const res = await axios.get(
        `http://localhost:8000/shipment/quotation/${encodeURIComponent(
          form.quotationRefNo
        )}`
      );
      const data = res.data;

      const customer = data.custAddressBook
        ? [{ id: data.custAddressBook.id, name: data.custAddressBook.companyName }]
        : [];

      const productList = data.product
        ? [{
          id: data.product.id ?? 0, // numeric ID from DB
          productId: data.product.productId,
          productName: data.product.productName,
          productType: data.product.productType || ""
        }]
        : [];

      // Step 2: Set options in state
      setSelectOptions((prev) => ({
        ...prev,
        customer,
        product: productList,
        // Keep others unchanged (or update as needed)
        port: prev.port,
        agent: prev.agent,
        depot: prev.depot,
        shippingTerm: prev.shippingTerm,
      }));

      // Step 3: Find the selected product from list
      // 🧠 Find the selected product from productList before setting form
      const selectedProduct = productList.find(
        (p) => p.productId === data.product?.productId
      );
      const portMap = new Map<number, Option>();
      [data.polPort, data.podPort, data.transhipmentPort].forEach((p) => {
        if (p && !portMap.has(p.id)) {
          portMap.set(p.id, { id: p.id, name: p.portName });
        }
      });
      const port = Array.from(portMap.values());

      // ✅ Agents: Use fallback to fetch if not populated
      const agentMap = new Map<number, string>();

      // Helper to fetch name if agent relation is missing
      const fetchAgentNameById = async (id: number) => {
        const res = await axios.get(`http://localhost:8000/addressbook/${id}`);
        return res.data.companyName;
      };

      // EXP Agent
      if (data.expHandlingAgentAddressBook) {
        agentMap.set(
          data.expHandlingAgentAddressBook.id,
          data.expHandlingAgentAddressBook.companyName
        );
      } else if (data.expHandlingAgentAddressBookId) {
        const name = await fetchAgentNameById(data.expHandlingAgentAddressBookId);
        agentMap.set(data.expHandlingAgentAddressBookId, name);
      }

      // IMP Agent
      if (data.impHandlingAgentAddressBook) {
        agentMap.set(
          data.impHandlingAgentAddressBook.id,
          data.impHandlingAgentAddressBook.companyName
        );
      } else if (
        data.impHandlingAgentAddressBookId &&
        !agentMap.has(data.impHandlingAgentAddressBookId)
      ) {
        const name = await fetchAgentNameById(data.impHandlingAgentAddressBookId);
        agentMap.set(data.impHandlingAgentAddressBookId, name);
      }

      const agent = Array.from(agentMap.entries()).map(([id, name]) => ({
        id,
        name
      }));

      // Depot
      const depot = [];
      if (data.emptyReturnAddressBook) {
        depot.push({
          id: data.emptyReturnAddressBook.id,
          name: data.emptyReturnAddressBook.companyName
        });
      } else if (data.emptyReturnAddressBookId) {
        const name = await fetchAgentNameById(data.emptyReturnAddressBookId);
        depot.push({
          id: data.emptyReturnAddressBookId,
          name
        });
      }

      const shippingTerm = data.shippingTerm
        ? [{ id: data.shippingTerm, name: data.shippingTerm }]
        : [];

      setSelectOptions({ customer, product: productList, port, agent, depot, shippingTerm });

      setForm({
        ...form,
        shippingTerm: data.shippingTerm || "",
        customerName: data.custAddressBook?.id?.toString() || "",
        billingParty: data.billingParty || "",
        rateType: data.rateType || "",
        billingType: data.billingType || "",
        productId: selectedProduct?.id || "",
        productName: selectedProduct
          ? `${selectedProduct.productId} - ${selectedProduct.productName} - ${selectedProduct.productType}`
          : "",
        portOfLoading: data.polPort?.id?.toString() || "",
        portOfDischarge: data.podPort?.id?.toString() || "",
        freeDays1: data.polFreeDays || "",
        detentionRate1: data.polDetentionRate || "",
        freeDays2: data.podFreeDays || "",
        detentionRate2: data.podDetentionRate || "",
        expHandlingAgent: (data.expHandlingAgentAddressBook?.id || data.expHandlingAgentAddressBookId)?.toString() || "",
        impHandlingAgent: (data.impHandlingAgentAddressBook?.id || data.impHandlingAgentAddressBookId)?.toString() || "",
        emptyReturnDepot: (data.emptyReturnAddressBook?.id || data.emptyReturnAddressBookId)?.toString() || "",
        enableTranshipmentPort: !!data.transhipmentPort,
        transhipmentPortName: data.transhipmentPort ? data.transhipmentPort.id.toString() : undefined,
      });
    } catch (err) {
      console.error("Failed to import data from quotation", err);
      alert("Quotation not found or fetch error");
    }
  };


  useEffect(() => {
    const fetchNextJobNumber = async () => {
      try {
        const res = await axios.get("http://localhost:8000/shipment/next-job-number");
        setForm((prev: any) => ({
          ...prev,
          jobNumber: res.data.jobNumber || "",
        }));
      } catch (err) {
        console.error("Failed to fetch job number", err);
      }
    };

    if (!form.id) {
      fetchNextJobNumber();
    }
  }, []);


  useEffect(() => {
    const fetchConsignee: () => Promise<void> = async () => {
      try {
        const res = await fetch("http://localhost:8000/addressbook");
        const data = await res.json();
        const consignee = data.filter(
          (entry: any) =>
            entry.businessType &&
            entry.businessType.includes("Consignee")
        );
        setConsigneeSuggestions(consignee);
      } catch (err) {
        console.error("Error fetching consignee:", err);
      }
    };

    fetchConsignee();
  }, []);


  useEffect(() => {
    const fetchShipper: () => Promise<void> = async () => {
      try {
        const res = await fetch("http://localhost:8000/addressbook");
        const data = await res.json();
        const shipper = data.filter(
          (entry: any) =>
            entry.businessType &&
            entry.businessType.includes("Shipper")
        );
        setShipperSuggestions(shipper);
      } catch (err) {
        console.error("Error fetching shipper:", err);
      }
    };

    fetchShipper();
  }, []);



  useEffect(() => {
    const fetchCarrier: () => Promise<void> = async () => {
      try {
        const res = await fetch("http://localhost:8000/addressbook");
        const data = await res.json();
        const carrier = data.filter(
          (entry: any) =>
            entry.businessType &&
            entry.businessType.includes("Carrier")
        );
        setCarrierSuggestions(carrier);
      } catch (err) {
        console.error("Error fetching carrier:", err);
      }
    };

    fetchCarrier();
  }, []);

  useEffect(() => {
    if (form.etaToPod && form.freeDays2) {
      const etaDate = new Date(form.etaToPod);
      const freeDays = parseInt(form.freeDays2, 10);

      if (!isNaN(freeDays)) {
        const returnDate = new Date(etaDate);
        returnDate.setDate(etaDate.getDate() + freeDays);

        const formatted = returnDate.toISOString().split("T")[0];
        setForm((prev: any) => ({
          ...prev,
          estimatedEmptyReturnDate: formatted,
        }));
      }
    }
  }, [form.etaToPod, form.freeDays2]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("http://localhost:8000/inventory");
        const data = await res.json();
        setAllInventories(data);
      } catch (error) {
        console.error("Error fetching inventories:", error);
      }
    };

    fetchInventory();
  }, []);
  const getContainerSize = (inventoryId: number) => {
    const inv = allInventories.find((i) => i.id === inventoryId);
    return inv?.containerSize || "N/A";
  };


  // --- UI Starts Here - Updated with AddProductForm styling ---
  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-lg">
      <Dialog open onOpenChange={onClose}>
        <DialogContent
          className="!w-[90vw] !max-w-[1200px] min-w-0 bg-neutral-900 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto p-0 border border-neutral-800"
        >
          <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
            <DialogTitle className="text-xl font-semibold text-white">
              {formTitle}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              &times;
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
            {/* Import Data from Quotation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Import Data from Quotation</h3>
              </div>
              <div className="flex items-end gap-4 bg-neutral-800 p-4 rounded">
                <div className="flex-1">
                  <label className="block text-sm text-neutral-200 mb-1">
                    Quotation Reference Number
                  </label>
                  <Input
                    type="text"
                    value={form.quotationRefNo || ""}
                    onChange={(e) => setForm({ ...form, quotationRefNo: e.target.value })}
                    placeholder="Enter quotation reference number"
                    className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Import shipping details from an existing quotation to auto-fill similar fields.
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded mb-5"
                  onClick={handleImportData}
                >
                  Import Data
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Basic Information</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Date (DD/MM/YY) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.date || ""}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Job Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={form.jobNumber || ""}
                      onChange={(e) => setForm({ ...form, jobNumber: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Reference Number
                    </label>
                    <Input
                      type="text"
                      value={form.referenceNumber || ""}
                      onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Master BL
                    </label>
                    <Input
                      type="text"
                      value={form.masterBL || ""}
                      onChange={(e) => setForm({ ...form, masterBL: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Shipment Type <span className="text-red-500">*</span>
                    </label>
                     <select
                  value={form.shippingTerm || ""}
                  onChange={(e) => setForm({ ...form, shippingTerm: e.target.value })}
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Shipping Term</option>
                  {selectOptions.shippingTerm.map((term) => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                   <select
                  value={form.customerName || ""}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Customer</option>
                  {selectOptions.customer.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>

                    <Select
                      value={form.productId?.toString() || ""}
                      onValueChange={(value) => {
                        const selected = selectOptions.product.find(
                          (p) => p.id.toString() === value
                        );

                        if (selected) {
                          setForm((prev: any) => ({
                            ...prev,
                            productId: selected.id,
                            productName: `${selected.productId} - ${selected.productName} - ${selected.productType}`,
                          }));
                        } else {
                          setForm((prev: any) => ({
                            ...prev,
                            productId: "",
                            productName: "",
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full p-2.5 bg-neutral-800 text-white border border-neutral-700">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>

                      <SelectContent className="bg-neutral-800 text-white border border-neutral-700">
                        {selectOptions.product.length > 0 ? (
                          selectOptions.product.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-white">
                              {`${p.productId} - ${p.productName} - ${p.productType}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-product" disabled>
                            No products available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>


                  {/* Consignee Name */}
                  <div className="relative">
                    <label className="block text-sm text-neutral-200 mb-1">
                      Consignee Name
                    </label>
                    <Input
                      type="text"
                      value={form.consigneeName || ""}
                      onChange={(e) => {
                        setForm((prev: any) => ({
                          ...prev,
                          consigneeName: e.target.value,
                          consigneeId: null,
                        }));
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Start typing consignee name..."
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                    {showSuggestions && form.consigneeName && (
                      <ul className="absolute z-10 w-full bg-neutral-800 border border-neutral-700 rounded mt-1 max-h-40 overflow-y-auto">
                        {consigneeSuggestions
                          .filter((c) =>
                            c.companyName
                              .toLowerCase()
                              .includes(form.consigneeName.toLowerCase())
                          )
                          .map((company) => (
                            <li
                              key={company.id}
                              onMouseDown={() => {
                                setForm((prev: any) => ({
                                  ...prev,
                                  consigneeName: company.companyName,
                                  consigneeId: company.id,
                                }));
                                setShowSuggestions(false);
                              }}
                              className="px-3 py-1 hover:bg-neutral-700 cursor-pointer text-sm text-white"
                            >
                              {company.companyName}
                            </li>
                          ))}
                        {consigneeSuggestions.filter((c) =>
                          c.companyName
                            .toLowerCase()
                            .includes(form.consigneeName?.toLowerCase())
                        ).length === 0 && (
                            <li className="px-3 py-1 text-neutral-400 text-sm">
                              No match found
                            </li>
                          )}
                      </ul>
                    )}
                  </div>
                  {/* Shipper Name */}
                  <div className="relative">
                    <label className="block text-sm text-neutral-200 mb-1">
                      Shipper Name
                    </label>
                    <Input
                      type="text"
                      value={form.shipperName || ""}
                      onChange={(e) => {
                        setForm((prev: any) => ({
                          ...prev,
                          shipperName: e.target.value,
                          shipperId: null,
                        }));
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Start typing shipper name..."
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                    {showSuggestions && form.shipperName && (
                      <ul className="absolute z-10 w-full bg-neutral-800 border border-neutral-700 rounded mt-1 max-h-40 overflow-y-auto">
                        {shipperSuggestions
                          .filter((c) =>
                            c.companyName
                              .toLowerCase()
                              .includes(form.shipperName.toLowerCase())
                          )
                          .map((company) => (
                            <li
                              key={company.id}
                              onMouseDown={() => {
                                setForm((prev: any) => ({
                                  ...prev,
                                  shipperName: company.companyName,
                                  shipperId: company.id,
                                }));
                                setShowSuggestions(false);
                              }}
                              className="px-3 py-1 hover:bg-neutral-700 cursor-pointer text-sm text-white"
                            >
                              {company.companyName}
                            </li>
                          ))}
                        {shipperSuggestions.filter((c) =>
                          c.companyName
                            .toLowerCase()
                            .includes(form.shipperName?.toLowerCase())
                        ).length === 0 && (
                            <li className="px-3 py-1 text-neutral-400 text-sm">
                              No match found
                            </li>
                          )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Port Information */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Port Information</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Port of Loading <span className="text-red-500">*</span>
                    </label>
                     <select
                  value={form.portOfLoading || ""}
                  onChange={(e) => setForm({ ...form, portOfLoading: e.target.value })}
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Port</option>
                  {selectOptions.port.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Port of Discharge <span className="text-red-500">*</span>
                    </label>
                    <select
                  value={form.portOfDischarge || ""}
                  onChange={(e) => setForm({ ...form, portOfDischarge: e.target.value })}
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Port</option>
                  {selectOptions.port.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                  </div>

                  {/* Free Days & Detention Rate Row */}
                  <div className="flex w-full gap-4 col-span-2">
                    <div className="flex-1">
                      <label className="block text-sm text-neutral-200 mb-1">
                        Free Days <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={form.freeDays1 || ""}
                        onChange={(e) => setForm({ ...form, freeDays1: e.target.value })}
                        className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-neutral-200 mb-1">
                        Detention Rate <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={form.detentionRate1 || ""}
                        onChange={(e) => setForm({ ...form, detentionRate1: e.target.value })}
                        className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-neutral-200 mb-1">
                        Free Days <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={form.freeDays2 || ""}
                        onChange={(e) => setForm({ ...form, freeDays2: e.target.value })}
                        className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-neutral-200 mb-1">
                        Detention Rate <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={form.detentionRate2 || ""}
                        onChange={(e) => setForm({ ...form, detentionRate2: e.target.value })}
                        className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={!!form.enableTranshipmentPort}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          enableTranshipmentPort: checked,
                        })
                      }
                      id="enableTranshipmentPort"
                    />
                    <label
                      htmlFor="enableTranshipmentPort"
                      className="text-neutral-200 text-sm"
                    >
                      Enable Transhipment Port
                    </label>
                  </div>
                  {form.enableTranshipmentPort && (
                    <div>
                      <label className="block text-sm text-neutral-200 mb-1">
                        Transhipment Port
                      </label>
                      <Select
                        value={form.transhipmentPortName || ""}
                        onValueChange={(value) => setForm({ ...form, transhipmentPortName: value })}
                      >
                        <SelectTrigger className="w-full p-2.5 bg-neutral-800 text-white border border-neutral-700">
                          <SelectValue placeholder="Select Port" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 text-white border border-neutral-700">
                          {selectOptions.port.length > 0 ? (
                            selectOptions.port.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()} className="text-white">
                                {p.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-port" disabled>No ports available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Handling Agents */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Handling Agents</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      EXP Handling Agent <span className="text-red-500">*</span>
                    </label>
                    <select
                  value={form.expHandlingAgent || ""}
                  onChange={(e) =>
                    setForm({ ...form, expHandlingAgent: e.target.value })
                  }
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Agent</option>
                  {selectOptions.agent.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      IMP Handling Agent <span className="text-red-500">*</span>
                    </label>
                     <select
                  value={form.impHandlingAgent || ""}
                  onChange={(e) =>
                    setForm({ ...form, impHandlingAgent: e.target.value })
                  }
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Agent</option>
                  {selectOptions.agent.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Container Information */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Add Inventory</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="mb-4">
                  <label className="block text-sm text-neutral-200 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={form.quantity || ""}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                  />
                </div>
                <div className="relative mb-4">
                  <label className="block text-sm text-neutral-200 mb-1">
                    Container No.
                  </label>
                  <div className="flex">
                    <Input
                      type="text"
                      value={form.containerNumber || ""}
                      onChange={(e) => handleContainerSearch(e.target.value)}
                      placeholder="Type at least 2 characters"
                      className="rounded-l w-full p-2.5 bg-neutral-800 text-white border border-neutral-700"
                    />
                    <Button
                      type="button"
                      className="rounded-r bg-blue-600 hover:bg-blue-700"
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="inline-block"
                      >
                        <circle cx="8" cy="8" r="7" />
                        <path d="M14 14l-2-2" />
                      </svg>
                    </Button>
                  </div>
                  {suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-neutral-800 text-white rounded border border-neutral-700 shadow max-h-60 overflow-y-auto">
                      {suggestions.map((sug) => (
                        <li
                          key={sug.id}
                          onClick={() => handleSuggestionSelect(sug)}
                          className="px-4 py-2 hover:bg-neutral-700 cursor-pointer text-sm"
                        >
                          <div className="font-semibold">
                            {sug.inventory.containerNumber}
                          </div>
                          <div className="text-xs text-neutral-300 flex justify-between">
                            <span>
                              Capacity: {sug.inventory.capacity}{" "}
                              {sug.inventory.capacityUnit}
                            </span>
                            <span>Tare: {sug.inventory.tare} kg</span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">
                            Location: {sug.addressBook?.companyName} -{" "}
                            {sug.port?.portName}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Search by container number (min. 2 characters)
                  </p>
                </div>
                {selectedContainers.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-white text-sm font-semibold mb-2">
                      Selected Containers
                    </h5>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-900 border-b border-neutral-700">
                          <TableHead className="text-neutral-200 text-xs">Container No</TableHead>
                          <TableHead className="text-neutral-200 text-xs">Capacity</TableHead>
                          <TableHead className="text-neutral-200 text-xs">Tare</TableHead>
                          <TableHead className="text-neutral-200 text-xs">Last Location</TableHead>
                          <TableHead className="text-neutral-200 text-xs">Size</TableHead>

                          <TableHead className="text-neutral-200 text-xs text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedContainers.map((item, index) => (
                          <TableRow key={index} className="border-t border-neutral-700">
                            <TableCell className="text-white">
                              {item.inventory?.containerNumber ||
                                item.containerNumber ||
                                "N/A"}
                            </TableCell>
                            <TableCell className="text-white">
                              {(item.inventory?.capacity || item.capacity || "N/A") +
                                " " +
                                (item.inventory?.capacityUnit || "")}
                            </TableCell>
                            <TableCell className="text-white">
                              {item.tare || item.inventory?.tare || "N/A"}
                            </TableCell>
                            <TableCell className="text-white">
                              {(item.depotName || "N/A") + " - " + (item.port?.portName || "N/A")}
                            </TableCell>
                            <TableCell className="text-white">
                              {getContainerSize(item.inventoryId)}
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveContainer(index)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            {/* Vessel Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Vessel Details</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="relative">
                    <label className="block text-sm text-neutral-200 mb-1">
                      Carrier Name
                    </label>
                    <Input
                      type="text"
                      value={form.carrierName || ""}
                      onChange={(e) => {
                        setForm((prev: any) => ({
                          ...prev,
                          carrierName: e.target.value,
                          carrierId: null,
                        }));
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Start typing carrier name..."
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                    {showSuggestions && form.carrierName && (
                      <ul className="absolute z-10 w-full bg-neutral-800 border border-neutral-700 rounded mt-1 max-h-40 overflow-y-auto">
                        {carrierSuggestions
                          .filter((c) =>
                            c.companyName
                              .toLowerCase()
                              .includes(form.carrierName.toLowerCase())
                          )
                          .map((company) => (
                            <li
                              key={company.id}
                              onMouseDown={() => {
                                setForm((prev: any) => ({
                                  ...prev,
                                  carrierName: company.companyName,
                                  carrierId: company.id,
                                }));
                                setShowSuggestions(false);
                              }}
                              className="px-3 py-1 hover:bg-neutral-700 cursor-pointer text-sm text-white"
                            >
                              {company.companyName}
                            </li>
                          ))}
                        {carrierSuggestions.filter((c) =>
                          c.companyName
                            .toLowerCase()
                            .includes(form.carrierName?.toLowerCase())
                        ).length === 0 && (
                            <li className="px-3 py-1 text-neutral-400 text-sm">
                              No match found
                            </li>
                          )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Vessel Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={form.vesselName || ""}
                      onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Gate Closing Date
                    </label>
                    <Input
                      type="date"
                      value={form.gateClosingDate || ""}
                      onChange={(e) => setForm({ ...form, gateClosingDate: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      SOB Date
                    </label>
                    <Input
                      type="date"
                      value={form.sobDate || ""}
                      onChange={(e) => setForm({ ...form, sobDate: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      ETA to PoD
                    </label>
                    <Input
                      type="date"
                      value={form.etaToPod || ""}
                      onChange={(e) => setForm({ ...form, etaToPod: e.target.value })}
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Return Depot Information */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-semibold">Return Depot Information</h3>
              </div>
              <div className="bg-neutral-800 p-4 rounded space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Empty Return Depot <span className="text-red-500">*</span>
                    </label>
                  <select
                  value={form.emptyReturnDepot || ""}
                  onChange={(e) =>
                    setForm({ ...form, emptyReturnDepot: e.target.value })
                  }
                  className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                >
                  <option value="">Select Return Depot</option>
                  {selectOptions.depot.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-200 mb-1">
                      Estimated Empty Return Date
                    </label>
                    <Input
                      type="date"
                      value={form.estimatedEmptyReturnDate || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estimatedEmptyReturnDate: e.target.value,
                        })
                      }
                      placeholder="DD/MM/YY"
                      className="w-full p-2.5 bg-neutral-800 text-white rounded border border-neutral-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit and Cancel buttons */}
            <DialogFooter className="flex justify-center gap-3 mt-6">
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 cursor-pointer"
              >
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddShipmentModal;