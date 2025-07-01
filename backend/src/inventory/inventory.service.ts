import { Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

async create(data: CreateInventoryDto) {
  try {
    // Create the inventory record with nested relations
    const createdInventory = await this.prisma.inventory.create({
      data: {
        status: data.status,
        containerNumber: data.containerNumber,
        containerCategory: data.containerCategory,
        containerType: data.containerType,
        containerSize: data.containerSize,
        containerClass: data.containerClass,
        containerCapacity: data.containerCapacity,
        capacityUnit: data.capacityUnit,
        manufacturer: data.manufacturer ?? '',
        buildYear: data.buildYear ?? '',
        grossWeight: data.grossWeight ?? '',
        tareWeight: data.tareWeight ?? '',
        InitialSurveyDate: data.InitialSurveyDate
          ? new Date(data.InitialSurveyDate).toISOString()
          : new Date().toISOString(),

        // ✅ Create nested periodicTankCertificates
        periodicTankCertificates: {
          create:
            data.periodicTankCertificates?.map((cert) => ({
              inspectionDate: cert.inspectionDate
                ? new Date(cert.inspectionDate).toISOString()
                : undefined,
              inspectionType: cert.inspectionType,
              nextDueDate: cert.nextDueDate
                ? new Date(cert.nextDueDate).toISOString()
                : undefined,
              certificateFile: cert.certificateFile,
            })) || [],
        },

        // ✅ Create nested leasingInfo
        leasingInfo: {
          create:
            data.leasingInfo?.map((info) => ({
              ownershipType: info.ownershipType,
              leasingRefNo: info.leasingRefNo,
              leasoraddressbookId: info.leasoraddressbookId,
              onHireDate: info.onHireDate
                ? new Date(info.onHireDate).toISOString()
                : new Date().toISOString(),
              portId: info.portId,
              leaseRentPerDay: info.leaseRentPerDay ?? '0',
              remarks: info.remarks ?? '',
              onHireDepotaddressbookId: info.onHireDepotaddressbookId,
              offHireDate: info.offHireDate
                ? new Date(info.offHireDate).toISOString()
                : null,
            })) || [],
        },

        // ✅ Create nested onHireReport
        onHireReport: {
          create:
            data.onHireReport?.map((report) => ({
              reportDate: report.reportDate
                ? new Date(report.reportDate).toISOString()
                : new Date().toISOString(),
              reportDocument:
                typeof report.reportDocument === 'object'
                  ? JSON.stringify(report.reportDocument)
                  : report.reportDocument,
            })) || [],
        },
      },

      // ✅ Include leasingInfo so we can use it for movement creation
      include: {
        leasingInfo: true,
      },
    });

    // === Create Movement History ===
    const leasing = createdInventory.leasingInfo?.[0];

    let portId: number | null = null;
    let addressBookId: number | null = null;

    if (leasing) {
      // Leased or Own container with leasing info
      portId = leasing.portId;
      addressBookId = leasing.onHireDepotaddressbookId;
    } else if (data.ownership === 'Own' && data.portId && data.onHireDepotaddressbookId) {
      // Fallback if leasingInfo wasn't included
      portId =
        typeof data.portId === 'string' ? parseInt(data.portId, 10) : data.portId;
      addressBookId =
        typeof data.onHireDepotaddressbookId === 'string'
          ? parseInt(data.onHireDepotaddressbookId, 10)
          : data.onHireDepotaddressbookId;
    }

    if (portId && addressBookId) {
      await this.prisma.movementHistory.create({
        data: {
          inventoryId: createdInventory.id,
          portId,
          addressBookId,
          status: 'AVAILABLE',
          date: new Date(),
          shipmentId: null,
        },
      });
    }

    return createdInventory;
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
}


  findAll() {
    return this.prisma.inventory.findMany({
      include: {
        leasingInfo: true,
        periodicTankCertificates: true,
        onHireReport: true,
      },
    }).then(inventories => {
      // Transform each inventory to include ownership type
      return inventories.map(inventory => {
        // Determine ownership based on existence of leasing records
        const ownershipType = inventory.leasingInfo && inventory.leasingInfo.length > 0 
          ? "Lease" 
          : "Own";
        
        return {
          ...inventory,
          ownershipType // Add this field to the returned data
        };
      });
    });
  }

  // Also update the findOne method for consistency
  findOne(id: number) {
    return this.prisma.inventory.findUnique({ 
      where: { id },
      include: {
        leasingInfo: true,
        periodicTankCertificates: true,
        onHireReport: true,
      },
    }).then(inventory => {
      if (!inventory) return null;
      
      // Determine ownership based on existence of leasing records
      const ownershipType = inventory.leasingInfo && inventory.leasingInfo.length > 0 
        ? "Lease" 
        : "Own";
      
      return {
        ...inventory,
        ownershipType // Add this field to the returned data
      };
    });
  }

  async update(id: number, data: UpdateInventoryDto) {
    // Destructure nested relations and ownership field that's not in schema
    const {
      periodicTankCertificates,
      leasingInfo,
      onHireReport,
      ownership, // Extract this field so it doesn't get passed to Prisma
      ...inventoryData
    } = data;

    // 1. Update the main inventory data (without the ownership field)
    const updatedInventory = await this.prisma.inventory.update({
      where: { id },
      data: inventoryData,
    });

    // 2. Handle certificates - don't delete existing ones, just add new ones if provided
    if (periodicTankCertificates && periodicTankCertificates.length > 0) {
      // Create new certificates but don't delete existing ones
      for (const cert of periodicTankCertificates) {
        if (cert.id) {
          // Update existing certificate
          await this.prisma.periodicTankCertificates.update({
            where: { id: cert.id },
            data: {
              inspectionDate: cert.inspectionDate,
              inspectionType: cert.inspectionType,
              nextDueDate: cert.nextDueDate,
              certificate: cert.certificateFile
            }
          });
        } else {
          // Create new certificate
          await this.prisma.periodicTankCertificates.create({
            data: {
              inspectionDate: cert.inspectionDate,
              inspectionType: cert.inspectionType,
              nextDueDate: cert.nextDueDate,
              certificate: cert.certificateFile,
              inventoryId: id
            }
          });
        }
      }
    }

    // 3. Handle leasing info - only update existing records or add new ones, never delete
    if (leasingInfo && leasingInfo.length > 0) {
      for (const lease of leasingInfo) {
        if (lease.id) {
          // Update existing leasing record
          await this.prisma.leasingInfo.update({
            where: { id: lease.id },
            data: {
              ownershipType: lease.ownershipType,
              leasingRefNo: lease.leasingRefNo,
              leasoraddressbookId: lease.leasoraddressbookId,
              onHireDepotaddressbookId: lease.onHireDepotaddressbookId,
              portId: lease.portId,
              onHireDate: lease.onHireDate,
              offHireDate: lease.offHireDate || null
            }
          });
        } else {
          // Create new leasing record
          await this.prisma.leasingInfo.create({
            data: {
              ownershipType: lease.ownershipType,
              leasingRefNo: lease.leasingRefNo,
              leasoraddressbookId: lease.leasoraddressbookId,
              onHireDepotaddressbookId: lease.onHireDepotaddressbookId,
              portId: lease.portId,
              onHireDate: lease.onHireDate,
              leaseRentPerDay: lease.leaseRentPerDay ?? "0", // ✅ Add
    remarks: lease.remarks ?? "", // ✅ Add
              offHireDate: lease.offHireDate || null,
              inventoryId: id
            }
          });
        }
      }
    }

    // 4. Handle on-hire reports - only add new ones, never delete existing
    if (onHireReport && onHireReport.length > 0) {
      for (const report of onHireReport) {
        if (report.id) {
          // Update existing report
          await this.prisma.onHireReport.update({
            where: { id: report.id },
            data: {
              reportDate: report.reportDate,
              reportDocument: report.reportDocument
            }
          });
        } else {
          // Create new report
          await this.prisma.onHireReport.create({
            data: {
              reportDate: report.reportDate ? new Date(report.reportDate).toISOString() : new Date().toISOString(),
              reportDocument: typeof report.reportDocument === 'object'
                ? JSON.stringify(report.reportDocument)
                : report.reportDocument,
              inventoryId: id
            }
          });
        }
      }
    }

    // Return the updated inventory with its related records
    return this.findOne(id);
  }

  async remove(id: string) {
    const numId = +id;

    // First delete all related records
    await this.prisma.$transaction([
      // Delete related PeriodicTankCertificates
      this.prisma.periodicTankCertificates.deleteMany({
        where: { inventoryId: numId },
      }),

      // Delete related OnHireReports
      this.prisma.onHireReport.deleteMany({
        where: { inventoryId: numId },
      }),

      // Delete related leasing info (if you have such a table)
      this.prisma.leasingInfo.deleteMany({
        where: { inventoryId: numId },
      }),

      // Then finally delete the inventory item
      this.prisma.inventory.delete({
        where: { id: numId },
      }),
    ]);

    return { id: numId };
  }
}