"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// ...other imports...

interface InventoryFormProps {
  onClose: () => void;
  inventoryId: number;
  editData?: any;
  isEditMode?: boolean;
}

interface Certificate {
  id?: number;
  inspectionDate: string;
  inspectionType: string;
  nextDueDate: string;
  certificateFile: File | null;
  certificate?: string; // Add this line to fix the error
  isNew?: boolean;
  isModified?: boolean;
}

interface Report {
  id?: number;
  reportDate: string;
  reportDocument: File | null;
  reportDocumentName?: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface Port {
  id: number;
  portName: string;
  portType: string;
}

interface Leasor {
  id: number;
  companyName: string;
  businessType: string;
}



interface LeasingRecord {
  id?: number;
  leasingRef: string;
  leasorId: string | number;
  leasoraddressbookId: string;
  leasorName: string; // Add for display
  depotId: string | number;
  portId: string | number;
  onHireDate: string;
  onHireLocation: string;
  onHireDepotaddressbookId: string;
  onHireDepotName: string; // Add for display
  offHireDate: string;
  leaseRentPerDay: string;
  remarks: string;
  isNew?: boolean;
  isModified?: boolean;
}

const AddInventoryForm: React.FC<InventoryFormProps> = ({
  onClose,
  inventoryId,
  editData,
  isEditMode,
}) => {
  const [formData, setFormData] = useState({
    status: "Active",
    containerNumber: "",
    containerCategory: "Tank",
    containerType: "ISO Tank",
    containerSize: "20TK",
    containerClass: "T11",
    containerCapacity: "MTN",
    capacityUnit: "",
    manufacturer: "",
    buildYear: "",
    grossWeight: "",
    tareWeight: "",
    initialSurveyDate: "",
    onHireDepotaddressbookId: "",
    onHireLocation: "",
    onHireDate: "",
    offHireDate: "",
    ownership: "",
    leasingRefNo: "",
    leaseRentPerDay: "",
    remarks: "",
  });

  const [leasoraddressbookIds, setLeasoraddressbookIds] = useState<Leasor[]>([]); // Changed from leasoraddressbookIds
  const [filteredDepotsByPort, setFilteredDepotsByPort] = useState<Leasor[]>([]);
  const [allPorts, setAllPorts] = useState<Port[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedHireDepotId, setSelectedHireDepotId] = useState<number | "">("");
  const [currentLeasingRecordIndex, setCurrentLeasingRecordIndex] = useState<number | null>(null);


  const [showConditionalFields, setShowConditionalFields] = useState(
    formData.ownership === "Own"
  );

  // Certificates and Reports state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [leasingRecords, setLeasingRecords] = useState<LeasingRecord[]>([]);

  // Store edit data temporarily until all reference data is loaded
  const [tempEditData, setTempEditData] = useState<any>(null);
  const [dataLoadingComplete, setDataLoadingComplete] = useState({
    ports: false,
    leasors: false,
    depots: false
  });

  useEffect(() => {
    if (editData) {
      setTempEditData(editData);
    }
  }, [editData]);

  useEffect(() => {
    if (tempEditData && dataLoadingComplete.ports && dataLoadingComplete.leasors && dataLoadingComplete.depots) {

      let ownershipType = "";
      if (tempEditData.leasingInfo && tempEditData.leasingInfo.length > 0) {
        // Use the ownershipType from the first leasing record
        ownershipType = tempEditData.leasingInfo[0].ownershipType || "";
      }

      // Determine the correct ownership value - map "Leased" to "Lease" for display
      let displayOwnership = ownershipType || tempEditData.ownershipType || "";
      if (displayOwnership === "Leased") {
        displayOwnership = "Lease"; // Map "Leased" from backend to "Lease" for frontend dropdown
      }

      setFormData(prev => ({
        ...prev,
        ...tempEditData,
        initialSurveyDate: tempEditData.InitialSurveyDate
          ? new Date(tempEditData.InitialSurveyDate).toISOString().split('T')[0]
          : "",
        // Set ownership with correct mapping
        ownership: displayOwnership
      }));

      // Update the conditional fields visibility based on the ownership
      setShowConditionalFields(displayOwnership === "Own");

      // Handle ALL containers that have leasing info (both "Own" and "Lease") - load port and depot data
      if (tempEditData.leasingInfo && tempEditData.leasingInfo.length > 0) {
        const record = tempEditData.leasingInfo[0];

        // For "Own" containers, we need to populate the conditional fields
        if (displayOwnership === "Own") {
          // Set the on-hire location (port name) and depot data in the main form
          const portName = record.port?.portName || "";
          const depotId = record.onHireDepotaddressbookId || "";

          setFormData(prev => ({
            ...prev,
            onHireLocation: portName,
            onHireDepotaddressbookId: depotId
          }));

          // Set the selected hire depot ID for the depot dropdown
          if (record.onHireDepotaddressbookId) {
            const numericDepotId = Number(record.onHireDepotaddressbookId);
            setSelectedHireDepotId(numericDepotId);
          }

          // If we have a port ID, filter depots based on that port
          if (record.portId) {
            console.log("Filtering depots for port ID:", record.portId);
            // Add delay to ensure depots are loaded before filtering
            setTimeout(() => {
              filterDepotsByPort(record.portId);
            }, 300); // Increased delay
          }
        }
      }

      // Handle leasing records for both "Own" and "Lease" types
      if (tempEditData.leasingInfo && tempEditData.leasingInfo.length > 0) {

        const existingLeasingRecords = tempEditData.leasingInfo.map((record: any) => {


          return {
            id: record.id,
            leasingRef: record.leasingRefNo || "",
            leasorId: record.leasoraddressbookId || "",
            leasoraddressbookId: record.leasoraddressbookId || "",
            leasorName: record.addressBook?.companyName || "",
            depotId: record.onHireDepotaddressbookId || "",
            portId: record.portId || "",
            onHireDate: record.onHireDate ? new Date(record.onHireDate).toISOString().split('T')[0] : "",
            onHireLocation: record.port?.portName || "",
            onHireDepotaddressbookId: record.onHireDepotaddressbookId || "",
            onHireDepotName: record.onHireDepotAddressBook?.companyName || "",
            offHireDate: record.offHireDate ? new Date(record.offHireDate).toISOString().split('T')[0] : "",
            leaseRentPerDay: record.leaseRentPerDay || "",
            remarks: record.remarks || "",
            isNew: false,
            isModified: false
          };
        });

        console.log("Processed leasing records:", existingLeasingRecords);
        setLeasingRecords(existingLeasingRecords);

        // Filter depots for each record that has a port
        existingLeasingRecords.forEach((record: any, index: number) => {
          if (record.portId) {
            console.log(`Setting up depot filtering for record ${index} with port ID ${record.portId}`);
            // Set current index and filter depots for this specific record
            setTimeout(() => {
              setCurrentLeasingRecordIndex(index);
              filterDepotsByPort(record.portId);
            }, 1000 + (index * 300)); // Increased delay and stagger
          }
        });
      }

      // Preserve existing certificates with isModified=false
      if (tempEditData.periodicTankCertificates) {
        const existingCertificates = tempEditData.periodicTankCertificates.map((cert: any) => ({
          id: cert.id,
          inspectionDate: cert.inspectionDate ? new Date(cert.inspectionDate).toISOString().split('T')[0] : "",
          inspectionType: cert.inspectionType || "",
          nextDueDate: cert.nextDueDate ? new Date(cert.nextDueDate).toISOString().split('T')[0] : "",
          certificateFile: null,  // We can't load the file itself
          certificate: cert.certificate, // Keep filename reference
          isNew: false,
          isModified: false
        }));
        setCertificates(existingCertificates);
      }

      // For reports, we need to preserve the document filename
      if (tempEditData.onHireReport) {
        const reportData = tempEditData.onHireReport.map((report: any) => ({
          id: report.id,
          reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : "",
          reportDocument: null, // We can't load the file object
          reportDocumentName: report.reportDocument, // Store the filename
          isNew: false,
          isModified: false
        }));
        setReports(reportData);
      }

      setTempEditData(null);
    }
  }, [tempEditData, dataLoadingComplete]);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await axios.get("http://128.199.19.28:8000/ports");
        setPorts(response.data);
        setAllPorts(response.data);
        setDataLoadingComplete(prev => ({ ...prev, ports: true }));
        console.log("Ports loaded:", response.data);
      } catch (error) {
        console.error("Error fetching ports:", error);
      }
    };

    fetchPorts();
  }, []);

  // Store all depot terminals without filtering
  const [allDepotTerminals, setAllDepotTerminals] = useState<{
    id: number;
    companyName: string;
    address: string;
    businessPorts: any[];
  }[]>([]);

  // Depot options for dropdowns
  const [hireDepotOptions, setHireDepotOptions] = useState<{
    label: string;
    value: number;
    companyName?: string;
  }[]>([]);

  useEffect(() => {
    const fetchHireDepots = async () => {
      try {
        const response = await fetch("http://128.199.19.28:8000/addressbook");
        const data = await response.json();
        const depotTerminals = data.filter((entry: any) =>
          entry.businessType &&
          (entry.businessType.toLowerCase().includes("deport terminal") ||
            entry.businessType.toLowerCase().includes("depot terminal") ||
            entry.businessType.toLowerCase().includes("depot-terminal"))
        );

        setAllDepotTerminals(depotTerminals);
        setDataLoadingComplete(prev => ({ ...prev, depots: true }));

        // Initially all depots are shown until a port is selected
        const depots = depotTerminals.map((entry: any) => ({
          label: `${entry.companyName} - ${entry.address || 'No address'}`,
          value: entry.id,
        }));

        setHireDepotOptions(depots);
      } catch (error) {
        console.error("Failed to fetch hire depots:", error);
      }
    };

    fetchHireDepots();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://128.199.19.28:8000/addressbook");
        const data = await res.json();
        const leasors = data.filter(
          (entry: any) => entry.businessType && entry.businessType.includes("Leasor")
        );
        setLeasoraddressbookIds(leasors);
        setDataLoadingComplete(prev => ({ ...prev, leasors: true }));
      } catch (error) {
        console.error("Error fetching leasors:", error);
      }
    };

    fetchData();
  }, []);

  // Function to filter depots by port ID
  const filterDepotsByPort = (portId: number) => {

    // Filter depot terminals that are associated with this port
    const filteredDepots = allDepotTerminals.filter(depot => {
      // Check if depot has businessPorts and if any of them match the selected portId
      if (!depot.businessPorts || !Array.isArray(depot.businessPorts)) {
        return false;
      }

      const hasMatchingPort = depot.businessPorts.some(bp => {
        const bpPortId = bp.portId || (bp.port && bp.port.id);
        return Number(bpPortId) === Number(portId);
      });

      return hasMatchingPort;
    });

    // Update the depot options in the dropdown
    const options = filteredDepots.map(depot => ({
      label: `${depot.companyName} - ${depot.address || 'No address'}`,
      value: depot.id,
      companyName: depot.companyName, // Store company name for easy lookup
    }));

    setHireDepotOptions(options);

    setFilteredDepotsByPort(filteredDepots.map(depot => ({
      ...depot,
      businessType: "Deport Terminal" // Add the required businessType property
    })));

    // If there are no depots for this port, show a message
    if (options.length === 0) {
    }
  };

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const res = await fetch("http://128.199.19.28:8000/ports");
        const data = await res.json();
        setAllPorts(data);
      } catch (err) {
        console.error("Failed to fetch ports:", err);
      }
    };

    fetchPorts();
  }, []);


  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "ownership") {
      setShowConditionalFields(value === "Own");

      // If changing to "Own" in edit mode and we have leasing data, populate the fields
      if (value === "Own" && isEditMode && editData && editData.leasingInfo && editData.leasingInfo.length > 0) {
        const ownRecord = editData.leasingInfo[0];

        if (ownRecord.port?.portName) {
          setFormData(prev => ({
            ...prev,
            onHireLocation: ownRecord.port.portName
          }));
        }

        if (ownRecord.onHireDepotaddressbookId) {
          const numericDepotId = Number(ownRecord.onHireDepotaddressbookId);
          setSelectedHireDepotId(numericDepotId);

          // Filter depots for this port
          if (ownRecord.portId) {
            setTimeout(() => {
              filterDepotsByPort(ownRecord.portId);
            }, 100);
          }
        }
      }

      // If changing to "Lease" in edit mode, ensure leasing records are visible
      if (value === "Lease" || value === "Leased") {
        // If we don't have any leasing records yet, add a default one
        if (leasingRecords.length === 0) {
          const newRecord: LeasingRecord = {
            leasingRef: "",
            leasorId: "",
            leasoraddressbookId: "",
            leasorName: "",
            depotId: "",
            portId: "",
            onHireDate: "",
            onHireLocation: "",
            onHireDepotaddressbookId: "",
            onHireDepotName: "",
            offHireDate: "",
            leaseRentPerDay: "",
            remarks: "",
            isNew: true,
            isModified: false
          };
          setLeasingRecords([newRecord]);
        }
      }

      // If changing away from "Own", clear the conditional fields
      if (value !== "Own") {
        setFormData(prev => ({
          ...prev,
          onHireLocation: "",
          onHireDepotaddressbookId: ""
        }));
        setSelectedHireDepotId("");
      }
    }

    // When port changes in "On Hire Location", filter depots based on selected port
    if (name === "onHireLocation" && value) {
      // Find the port object based on the port name
      const selectedPort = allPorts.find((port) => port.portName === value);


      if (selectedPort) {
        console.log(`Selected port: ${selectedPort.portName} (ID: ${selectedPort.id})`);
        // Filter depots associated with this port
        filterDepotsByPort(selectedPort.id);
      } else {
        // If no port selected or invalid port, reset depot options
        const allDepots = allDepotTerminals.map((entry) => ({
          label: `${entry.companyName} - ${entry.address || 'No address'}`,
          value: entry.id,
        }));
        setHireDepotOptions(allDepots);
      }

      // Reset the selectedHireDepotId when port changes
      setSelectedHireDepotId("");
    }
  };

  // Add certificate

  // Remove certificate
  const handleDeleteCertificate = (idx: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add report

  // Remove report
  const handleDeleteReport = (idx: number) => {
    setReports((prev) => prev.filter((_, i) => i !== idx));
  };


  // Add leasing record
  const handleAddLeasingRecord = () => {
    // Just add an empty record to the table
    setLeasingRecords([
      ...leasingRecords,
      {
        leasingRef: "",
        leasorId: "",
        leasoraddressbookId: "",
        leasorName: "",
        depotId: "",
        portId: "",
        onHireDate: "",
        onHireLocation: "",
        onHireDepotaddressbookId: "",
        onHireDepotName: "",
        offHireDate: "",
        leaseRentPerDay: "",
        remarks: "",
        isNew: true,
        isModified: false
      }
    ]);
  };

  // Remove leasing record
  const handleDeleteLeasingRecord = (index: number) => {
    setLeasingRecords(leasingRecords.filter((_, i) => i !== index));
  };



  // Add a new function to submit leasing records
  const handleSubmitLeasingRecords = async (inventoryId: number) => {
    try {
      console.log("Submitting leasing records for inventory ID:", inventoryId);

      for (const record of leasingRecords) {
        // Skip if missing required values
        if (!record.leasingRef || (!record.leasoraddressbookId && !record.leasorName)) {
          console.log("Skipping incomplete leasing record - missing leasingRef or leasor:", record);
          continue;
        }

        // If record has an ID and isn't modified, skip it
        if (record.id && !record.isModified && !record.isNew) {
          console.log("Skipping unmodified existing record:", record.id);
          continue;
        }

        // Get the leasor ID - use the stored ID or look it up by name
        let leasorId = record.leasoraddressbookId; // This should already be the ID, not the name
        if (!leasorId && record.leasorName) {
          const selectedLeasor = leasoraddressbookIds.find(
            leasor => leasor.companyName === record.leasorName
          );
          leasorId = selectedLeasor?.id?.toString() ?? "";
        }

        // Get the port ID directly if available, otherwise look it up
        let portId = record.portId;
        if (!portId && record.onHireLocation) {
          const selectedPort = allPorts.find(
            port => port.portName === record.onHireLocation
          );
          portId = selectedPort?.id?.toString() ?? "";
        }

        // Get the depot ID - use the stored ID or look it up by name
        let depotId = record.onHireDepotaddressbookId; // This should already be the ID, not the name
        if (!depotId && record.onHireDepotName) {
          const selectedDepot = hireDepotOptions.find(
            depot => depot.companyName === record.onHireDepotName
          );
          depotId = selectedDepot?.value?.toString() ?? "";
        }

        if (!leasorId || !portId || !depotId) {
          console.error("Missing reference IDs for leasing record:", {
            leasorId,
            portId,
            depotId,
            record,
            leasorName: record.leasorName,
            onHireLocation: record.onHireLocation,
            onHireDepotName: record.onHireDepotName,
            availableLeasors: leasoraddressbookIds.map(l => l.companyName),
            availablePorts: allPorts.map(p => p.portName),
            availableDepots: hireDepotOptions.map(d => d.companyName)
          });
          continue;
        }

        // Convert IDs to numbers to ensure consistent typing
        const numericLeasorId = typeof leasorId === 'string' ? parseInt(leasorId) : leasorId;
        const numericPortId = typeof portId === 'string' ? parseInt(portId) : portId;
        const numericDepotId = typeof depotId === 'string' ? parseInt(depotId) : depotId;

        // Create the payload with correct ID references
        const leasingData = {
          ownershipType: record.leasingRef.startsWith("OWN-") ? "Own" : "Leased", // Use "Leased" for backend consistency
          leasingRefNo: record.leasingRef,
          leasoraddressbookId: numericLeasorId,
          onHireDepotaddressbookId: numericDepotId,
          portId: numericPortId,
          onHireDate: record.onHireDate || new Date().toISOString().split('T')[0],
          offHireDate: record.offHireDate || null,
          leaseRentPerDay: record.leaseRentPerDay || "",
          remarks: record.remarks || "",
          inventoryId: inventoryId
        };

        if (record.id && !record.isNew) {
          // Update existing record
          const response = await axios.patch(
            `http://128.199.19.28:8000/leasinginfo/${record.id}`,
            leasingData
          );
          console.log("Leasing record updated:", response.data);
        } else {
          // Create new record
          const response = await axios.post(
            "http://128.199.19.28:8000/leasinginfo",
            leasingData
          );
        }
      }

    } catch (error: any) {
      console.error("Error submitting leasing records:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
    }
  };


  // Modify handleSubmit function to collect all leasing records
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.containerNumber) {
    alert("Container Number is required");
    return;
  }

  const payload: any = {
    status: formData.status,
    containerNumber: formData.containerNumber,
    containerCategory: formData.containerCategory,
    containerType: formData.containerType,
    containerSize: formData.containerSize,
    containerClass: formData.containerClass,
    containerCapacity: formData.containerCapacity,
    capacityUnit: formData.capacityUnit,
    manufacturer: formData.manufacturer,
    buildYear: formData.buildYear,
    grossWeight: formData.grossWeight,
    tareWeight: formData.tareWeight,
    InitialSurveyDate: formData.initialSurveyDate,

    periodicTankCertificates: certificates.map((c) => ({
      id: c.id || undefined,
      inspectionDate: c.inspectionDate,
      inspectionType: c.inspectionType,
      nextDueDate: c.nextDueDate,
      certificate:
        typeof c.certificate === "string"
          ? c.certificate
          : c.certificateFile?.name || null,
    })),

    onHireReport: reports.map((r) => ({
      id: r.id || undefined,
      reportDate: r.reportDate,
      reportDocument: typeof r.reportDocument === "object"
        ? JSON.stringify(r.reportDocument)
        : r.reportDocument,
    })),

    leasingInfo: [],
  };

  // === Lease Logic ===
  if (!isEditMode && formData.ownership === "Lease") {
    if (leasingRecords.length === 0) {
      alert("Please add at least one leasing record for a Leased container.");
      return;
    }

    for (const record of leasingRecords) {
      const selectedPort = allPorts.find((p) => p.portName === record.onHireLocation);
      if (!selectedPort) {
        alert(`Port not found for leasing record`);
        return;
      }

      payload.leasingInfo.push({
        ownershipType: "Leased",
        leasingRefNo: record.leasingRef,
        leasoraddressbookId: parseInt(record.leasoraddressbookId),
        onHireDepotaddressbookId: parseInt(record.onHireDepotaddressbookId),
        portId: selectedPort.id,
        onHireDate: new Date(record.onHireDate).toISOString(),
        offHireDate: record.offHireDate ? new Date(record.offHireDate).toISOString() : null,
        leaseRentPerDay: record.leaseRentPerDay || "0",
        remarks: record.remarks || "",
      });
    }

    payload.portId = payload.leasingInfo[0].portId;
    payload.onHireDepotaddressbookId = payload.leasingInfo[0].onHireDepotaddressbookId;
    payload.ownership = "Lease";
  }

  // === Own Logic ===
  if (!isEditMode && formData.ownership === "Own") {
    const selectedPort = allPorts.find((p) => p.portName === formData.onHireLocation);
    if (!selectedPort || !selectedHireDepotId) {
      alert("On Hire Port and Depot are required.");
      return;
    }

    payload.leasingInfo.push({
      ownershipType: "Own",
      leasingRefNo: `OWN-${formData.containerNumber}`,
      leasoraddressbookId: (selectedHireDepotId),
onHireDepotaddressbookId: selectedHireDepotId,
      portId: selectedPort.id,
      onHireDate: new Date().toISOString(),
      offHireDate: null,
      leaseRentPerDay: "",
      remarks: "",
    });

    payload.portId = selectedPort.id;
    payload.onHireDepotaddressbookId = parseInt(selectedHireDepotId.toString());
    payload.ownership = "Own";
  }

  try {
    let createdInventoryId = inventoryId;

    if (isEditMode && inventoryId) {
      const response = await axios.patch(`http://128.199.19.28:8000/inventory/${inventoryId}`, payload);
      createdInventoryId = response.data.id || inventoryId;

      const originalOwnership = editData.leasingInfo?.[0]?.ownershipType || "Leased";
      const currentOwnership = formData.ownership === "Lease" ? "Leased" : "Own";

      // Ownership changed
      if (originalOwnership !== currentOwnership) {
        for (const record of editData.leasingInfo || []) {
          await axios.delete(`http://128.199.19.28:8000/leasinginfo/${record.id}`);
        }
      }

      if (formData.ownership === "Own") {
        const selectedPort = allPorts.find((p) => p.portName === formData.onHireLocation);
        if (!selectedPort || !selectedHireDepotId) throw new Error("Port/Depot missing");

        const ownLeasingData = {
          ownershipType: "Own",
          leasingRefNo: `OWN-${formData.containerNumber}`,
          leasoraddressbookId: (selectedHireDepotId),
          onHireDepotaddressbookId:(selectedHireDepotId),
          portId: selectedPort.id,
          onHireDate: new Date().toISOString(),
          offHireDate: null,
          leaseRentPerDay: "",
          remarks: "",
          inventoryId: createdInventoryId,
        };

        if (editData.leasingInfo?.length > 0) {
          await axios.patch(`http://128.199.19.28:8000/leasinginfo/${editData.leasingInfo[0].id}`, ownLeasingData);
        } else {
          await axios.post("http://128.199.19.28:8000/leasinginfo", ownLeasingData);
        }
      }

      if (formData.ownership === "Lease" && leasingRecords.length > 0) {
        await handleSubmitLeasingRecords(createdInventoryId);
      }

    } else {
      const response = await axios.post("http://128.199.19.28:8000/inventory", payload);
      createdInventoryId = response.data.id;
    }

    alert("Container saved successfully!");
    onClose();
  } catch (error: any) {
    console.error("Error saving container:", error.response?.data || error.message);
    alert("Failed to save container. Please check console for details.");
  }
};



  // Add this derived state for easier checks
  const isTank = formData.containerCategory === "Tank";
  const isDry = formData.containerCategory === "Dry";
  const isRefrigerated = formData.containerCategory === "Refrigerated";

  // Dynamic options for Container Type and Class
  let containerTypeOptions: { value: string; label: string }[] = [];
  let containerClassOptions: { value: string; label: string }[] = [];

  if (isTank) {
    containerTypeOptions = [{ value: "ISO Tank", label: "ISO Tank" }];
    containerClassOptions = [{ value: "T11", label: "T11" }];
  } else if (isDry) {
    containerTypeOptions = [
      { value: "20ft", label: "20ft" },
      { value: "30ft", label: "30ft" },
      { value: "40ft", label: "40ft" },
    ];
    containerClassOptions = [
      { value: "Standard", label: "Standard" },
      { value: "High Cube", label: "High Cube" },
      { value: "Open Top", label: "Open Top" },
    ];
  } else if (isRefrigerated) {
    containerTypeOptions = [{ value: "Refrigerated Container", label: "Refrigerated Container" }];
    containerClassOptions = []; // No options for class
  }

  // At the beginning of your component, add this style block
  const tableStyle: React.CSSProperties = {
    tableLayout: "fixed" as const,
    width: "100%",
    maxWidth: "930px"
  };

  return (
    <div className="p-4 text-sm w-full"> {/* Reduced from p-6 to p-4 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">
          {isEditMode ? "Edit Container" : "Add Container"}
        </h2>
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-neutral-400 hover:text-white h-8 w-8 p-0 cursor-pointer"
        >
          &times;
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status - using shadcn Select */}
        <div className="mb-4">
          <Label className="text-sm text-white mb-1">Status</Label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Two columns layout - keep structure, update styling */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Container Number */}
          <div>
            <Label className="text-sm text-white mb-1">Container No</Label>
            <input
              type="text"
              name="containerNumber"
              value={formData.containerNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>

          {/* Container Category */}
          <div>
            <Label className="text-sm text-white mb-1">Container Category</Label>
            <select
              name="containerCategory"
              value={formData.containerCategory}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            >
              <option value="Tank">Tank</option>
              <option value="Dry">Dry</option>
              <option value="Refrigerated">Refrigerated</option>
            </select>
          </div>

          {/* Container Type */}
          <div>
            <Label className="text-sm text-white mb-1">Container Type</Label>
            <select
              name="containerType"
              value={formData.containerType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            >
              {containerTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Container Size (only for Tank) */}
          {isTank ? (
            <div>
              <Label className="text-sm text-white mb-1">Container Size</Label>
              <select
                name="containerSize"
                value={formData.containerSize}
                onChange={handleChange}
                className="w-full px-3 py-2 text-md bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
              >
                <option value="20TK">20TK</option>
              </select>
            </div>
          ) : (
            // When not Tank, shift Container Class here
            <div>
              <Label className="text-sm text-white mb-1">Container Class</Label>
              <select
                name="containerClass"
                value={formData.containerClass}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
                disabled={isRefrigerated}
              >
                <option value="">
                  {isRefrigerated ? "No options available" : "Select Class"}
                </option>
                {containerClassOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* When Tank, show Container Class in original place, else show Container Capacity here */}
          {isTank ? (
            <div>
              <Label className="text-sm text-white mb-1">Container Class</Label>
              <select
                name="containerClass"
                value={formData.containerClass}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
              >
                {containerClassOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label className="text-sm text-white mb-1">Container Capacity</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="containerCapacity"
                  value={formData.containerCapacity}
                  onChange={handleChange}
                  placeholder="Enter capacity value"
                  className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
                />
                <select
                  name="capacityUnit"
                  value={formData.capacityUnit}
                  onChange={handleChange}
                  className="px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
                >
                  <option value="MTN">MTN</option>
                  <option value="LTRS">LTRS</option>
                </select>
              </div>
            </div>
          )}

          {/* When Tank, show Container Capacity in its original place */}
          {isTank && (
            <div>
              <Label className="text-sm text-white mb-1">Container Capacity</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="containerCapacity"
                  value={formData.containerCapacity}
                  onChange={handleChange}
                  placeholder="Enter capacity value"
                  className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
                />
                <select
                  name="capacityUnit"
                  value={formData.capacityUnit}
                  onChange={handleChange}
                  className="px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
                >
                  <option value="MTN">MTN</option>
                  <option value="LTRS">LTRS</option>
                </select>
              </div>
            </div>
          )}

          {/* Manufacturer */}
          <div>
            <Label className="text-sm text-white mb-1">Manufacturer</Label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>

          {/* Build Year */}
          <div>
            <Label className="text-sm text-white mb-1">Build Year</Label>
            <input
              type="text"
              name="buildYear"
              value={formData.buildYear}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>

          {/* Gross Weight */}
          <div>
            <Label className="text-sm text-white mb-1">Gross Wt</Label>
            <input
              type="text"
              name="grossWeight"
              value={formData.grossWeight}
              onChange={handleChange}
              placeholder="Enter gross weight"
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>

          {/* Tare Weight */}
          <div>
            <Label className="text-sm text-white mb-1">Tare Wt</Label>
            <input
              type="text"
              name="tareWeight"
              value={formData.tareWeight}
              onChange={handleChange}
              placeholder="Enter tare weight"
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>

          {/* Initial Survey Date */}
          <div>
            <Label className="text-sm text-white mb-1">Initial Survey Date</Label>
            <input
              type="date"
              name="initialSurveyDate"
              value={formData.initialSurveyDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex text-white flex-wrap gap-4 mb-4">
          {/* Ownership */}
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-1 font-medium">Ownership</Label>
            <select
              name="ownership"
              value={formData.ownership}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500"
            >
              <option value="">Select Ownership</option>
              <option value="Own">Own</option>
              <option value="Lease">Lease</option>
            </select>
          </div>

          {/* Only show these if ownership is "Own" */}
          {(formData.ownership === "Own") && (
            <>
              {/* On Hire Location (Port) */}
              <div className="flex-1 min-w-[200px]">
                <Label className="mb-1 font-medium text-white">On Hire Location (Port)</Label>
                <select
                  name="onHireLocation"
                  value={formData.onHireLocation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Port</option>
                  {allPorts.map((port) => (
                    <option key={port.id} value={port.portName}>
                      {port.portName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="mb-1 font-medium text-white">On Hire Depot</Label>
                <select
                  value={selectedHireDepotId}
                  onChange={e => {
                    const selectedId = Number(e.target.value);
                    setSelectedHireDepotId(selectedId);

                    // Also update the formData with the selected depot ID and name
                    const selectedDepot = hireDepotOptions.find(opt => opt.value === selectedId);
                    setFormData(prev => ({
                      ...prev,
                      onHireDepotaddressbookId: selectedId.toString(),
                      onHireDepotName: selectedDepot?.companyName || ""
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded border border-neutral-700 focus:border-blue-500 cursor-pointer"
                  disabled={!formData.onHireLocation}
                >
                  <option value="">
                    {!formData.onHireLocation
                      ? "Select a port first"
                      : hireDepotOptions.length === 0
                        ? "No depot terminals available for this port"
                        : "Select Hire Depot"}
                  </option>
                  {hireDepotOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.onHireLocation && hireDepotOptions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-500">
                    No companies with business type "Deport Terminal" found for this port.
                    Please add one in Address Book first.
                  </p>
                )}
              </div>

            </>
          )}
        </div>

        {/* Leasing Info Section - only shows when Lease is selected */}
        {formData.ownership === "Lease" && (
          <div className="col-span-2 mt-4">
            <Label className="text-white text-sm font-medium mb-2">Leasing Info</Label>
            <div className="bg-neutral-800 p-4 rounded border border-neutral-700">
              <table className="w-full mb-3 table-fixed" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">Leasing Ref. No</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">Leasor Name</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[100px]">On Hire Date</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">On Hire Location</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">On Hire Depot</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[100px]">Off Hire Date</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[90px]">Lease Rent</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[100px]">remarks</th>
                    <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leasingRecords.map((record, index) => (
                    <tr key={index} className="border-t border-neutral-700">
                      <td className="py-2 pr-1">
                        <input
                          type="text"
                          value={record.leasingRef}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].leasingRef = e.target.value;
                            // Mark as modified when changed
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <select
                          value={record.leasorName}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].leasorName = e.target.value;
                            // Also set the addressbook ID for backend compatibility
                            const selectedLeasor = leasoraddressbookIds.find(l => l.companyName === e.target.value);
                            updated[index].leasoraddressbookId = selectedLeasor?.id?.toString() || "";
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        >
                          <option value="">Select</option>
                          {leasoraddressbookIds.map((leasor) => (
                            <option key={leasor.id} value={leasor.companyName}>
                              {leasor.companyName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          type="date"
                          value={record.onHireDate}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].onHireDate = e.target.value;
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <select
                          value={record.onHireLocation}
                          onChange={e => {
                            const selectedPortName = e.target.value;
                            const selectedPort = allPorts.find(
                              (p) => p.portName === selectedPortName
                            );

                            const updated = [...leasingRecords];
                            updated[index].onHireLocation = selectedPortName;

                            // Also reset the depot selection when port changes
                            updated[index].onHireDepotaddressbookId = "";
                            updated[index].isModified = true;

                            setLeasingRecords(updated);

                            // Set the current leasing record index
                            setCurrentLeasingRecordIndex(index);

                            if (selectedPort) {
                              console.log(`Leasing record ${index}: Selected port: ${selectedPort.portName} (ID: ${selectedPort.id})`);
                              filterDepotsByPort(selectedPort.id);
                            }
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        >
                          <option value="">Select</option>
                          {allPorts.map((port) => (
                            <option key={port.id} value={port.portName}>
                              {port.portName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-1">
                        <select
                          value={record.onHireDepotName}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].onHireDepotName = e.target.value;
                            // Also set the addressbook ID for backend compatibility
                            const selectedDepot = hireDepotOptions.find(opt => opt.companyName === e.target.value);
                            updated[index].onHireDepotaddressbookId = selectedDepot?.value?.toString() || "";
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          disabled={!record.onHireLocation}
                          className={`w-full p-1 rounded text-white text-xs border border-neutral-600 focus:border-blue-500 ${currentLeasingRecordIndex === index ? 'bg-neutral-700' : 'bg-neutral-700'}`}
                        >
                          <option value="">
                            {!record.onHireLocation
                              ? "Select a port first"
                              : currentLeasingRecordIndex !== index
                                ? "Click port again to load depots"
                                : hireDepotOptions.length === 0
                                  ? "No depot terminals available for this port"
                                  : "Select Depot"}
                          </option>
                          {(currentLeasingRecordIndex === index || record.onHireDepotName) && hireDepotOptions.map(opt => (
                            <option key={opt.value} value={opt.companyName || opt.label.split(" - ")[0]}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          type="date"
                          value={record.offHireDate}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].offHireDate = e.target.value;
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          type="text"
                          placeholder="Lease Rent"
                          value={record.leaseRentPerDay}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].leaseRentPerDay = e.target.value;
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          type="text"
                          placeholder="remarks"
                          value={record.remarks}
                          onChange={e => {
                            const updated = [...leasingRecords];
                            updated[index].remarks = e.target.value;
                            updated[index].isModified = true;
                            setLeasingRecords(updated);
                          }}
                          className="w-full p-1 bg-neutral-700 rounded text-white text-xs border border-neutral-600 focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        <span
                          onClick={() => handleDeleteLeasingRecord(index)}
                          className="text-red-500 hover:text-red-400 cursor-pointer text-xs cursor-pointer"
                        >
                          Delete
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                type="button"
                onClick={handleAddLeasingRecord}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer"
              >
                + Add Leasing Record
              </Button>
            </div>
          </div>
        )}

        {/* Periodic Tank Certificates Section */}
        <div className="col-span-2 mt-4">
          <Label className="text-white text-sm font-medium mb-2">Periodic Tank Certificates</Label>
          <div className="bg-neutral-800 p-4 rounded border border-neutral-700">
            <table className="w-full mb-3 table-fixed" style={tableStyle}>
              <thead>
                <tr>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">
                    Inspection Date
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">
                    Inspection Type
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[120px]">
                    Next Due Date
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[240px]">
                    Certificate File
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[70px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, idx) => (
                  <tr key={idx} className="border-t border-neutral-700">
                    <td className="py-2 min-w-[150px] pr-2">  {/* Added min-w-[150px] and pr-2 */}
                      <input
                        type="date"
                        value={cert.inspectionDate}
                        onChange={(e) => {
                          const newCerts = [...certificates];
                          newCerts[idx].inspectionDate = e.target.value;
                          // Mark as modified when changed
                          newCerts[idx].isModified = true;
                          setCertificates(newCerts);
                        }}
                        className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 min-w-[150px] pr-2">
                      <select
                        value={cert.inspectionType}
                        onChange={(e) => {
                          const newCerts = [...certificates];
                          newCerts[idx].inspectionType = e.target.value;
                          setCertificates(newCerts);
                        }}
                        className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500"
                      >
                        <option value="Periodic 2.5Yr">Periodic 2.5Yr</option>
                        <option value="Periodic 5Yr">Periodic 5Yr</option>
                      </select>
                    </td>
                    <td className="py-2 min-w-[150px] pr-2">
                      <input
                        type="date"
                        value={cert.nextDueDate}
                        onChange={(e) => {
                          const newCerts = [...certificates];
                          newCerts[idx].nextDueDate = e.target.value;
                          setCertificates(newCerts);
                        }}
                        className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500  cursor-pointer"
                      />
                    </td>
                    <td className="py-2 text-white min-w-[240px] pr-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="file"
                          onChange={(e) => {
                            const newCerts = [...certificates];
                            newCerts[idx].certificateFile = e.target.files?.[0] || null;
                            setCertificates(newCerts);
                          }}
                          className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-neutral-600 file:text-white cursor-pointer"
                        />

                        {/* Show PDF link if certificate exists and no new file is selected */}
                        {cert.certificate && !cert.certificateFile && (
                          <a
                            href={`http://128.199.19.28:8000/uploads/certificates/${cert.certificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"></path>
                              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path>
                            </svg>
                            View certificate: {cert.certificate.split('-').pop()}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 min-w-[70px]">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDeleteCertificate(idx)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              type="button"
              onClick={() =>
                setCertificates([
                  ...certificates,
                  {
                    inspectionDate: "",
                    inspectionType: "Periodic 2.5Yr",
                    nextDueDate: "",
                    certificateFile: null,
                  },
                ])
              }
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer"
            >
              + Add Certificate
            </Button>
          </div>
        </div>

        {/* On Hire Reports Section */}
        <div className="col-span-2 mt-4">
          <Label className="text-white text-sm font-medium mb-2">On Hire Reports</Label>
          <div className="bg-neutral-800 p-4 rounded border border-neutral-700">
            <table className="w-full mb-3 table-fixed" style={tableStyle}>
              <thead>
                <tr>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[150px]"> {/* From 200px to 150px */}
                    Report Date
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[350px]"> {/* From 400px to 350px */}
                    Report Document
                  </th>
                  <th className="text-left text-neutral-400 text-xs font-medium pb-2 w-[70px]"> {/* From 80px to 70px */}
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => (
                  <tr key={idx} className="border-t border-neutral-700">
                    <td className="py-2 min-w-[200px] pr-2">  {/* Added min-w-[200px] and pr-2 */}
                      <input
                        type="date"
                        value={report.reportDate}
                        onChange={(e) => {
                          const newReports = [...reports];
                          newReports[idx].reportDate = e.target.value;
                          setReports(newReports);
                        }}
                        className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500  cursor-pointer"
                      />
                    </td>
                    <td className="py-2 text-white min-w-[350px] pr-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="file"
                          onChange={(e) => {
                            const newReports = [...reports];
                            newReports[idx].reportDocument = e.target.files?.[0] || null;
                            setReports(newReports);
                          }}
                          className="w-full px-3 py-2 text-sm bg-neutral-700 text-white rounded border border-neutral-600 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-neutral-600 file:text-white cursor-pointer"
                        />

                        {/* Show PDF link if report document exists and no new file is selected */}
                        {report.reportDocumentName && !report.reportDocument && (
                          <a
                            href={`http://128.199.19.28:8000/uploads/reports/${report.reportDocumentName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z"></path>
                              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path>
                            </svg>
                            View report: {report.reportDocumentName.split('-').pop()}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 min-w-[70px]">  {/* Added min-w-[80px] */}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDeleteReport(idx)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button
              type="button"
              onClick={() =>
                setReports([
                  ...reports,
                  {
                    reportDate: "",
                    reportDocument: null,
                  },
                ])
              }
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer"
            >
              + Add Report
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer"
          >
            {isEditMode ? "Update Container" : "Add Container"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddInventoryForm;
