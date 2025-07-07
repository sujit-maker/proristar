import { Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInventoryDto) {
    try {
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

          periodicTankCertificates: {
            create:
              data.periodicTankCertificates?.map((cert) => ({
                inspectionDate: cert.inspectionDate
                  ? new Date(cert.inspectionDate)
                  : new Date(),
                inspectionType: cert.inspectionType,
                nextDueDate: cert.nextDueDate
                  ? new Date(cert.nextDueDate)
                  : new Date(),
                certificate: cert.certificate ?? '',
              })) || [],
          },

          leasingInfo: {
            create:
              data.leasingInfo?.map((info) => ({
                ownershipType: info.ownershipType,
                leasingRefNo: info.leasingRefNo,
                leasoraddressbookId: info.leasoraddressbookId,
                onHireDate: info.onHireDate
                  ? new Date(info.onHireDate)
                  : new Date(),
                portId: info.portId,
                leaseRentPerDay: info.leaseRentPerDay ?? '0',
                remarks: info.remarks ?? '',
                onHireDepotaddressbookId: info.onHireDepotaddressbookId,
                offHireDate: info.offHireDate
                  ? new Date(info.offHireDate)
                  : null,
              })) || [],
          },

          onHireReport: {
            create:
              data.onHireReport?.map((report) => ({
                reportDate: report.reportDate
                  ? new Date(report.reportDate)
                  : new Date(),
                reportDocument:
                  typeof report.reportDocument === 'object'
                    ? JSON.stringify(report.reportDocument)
                    : (report.reportDocument ?? ''),
              })) || [],
          },
        },
        include: {
          leasingInfo: true,
        },
      });

      // After creation, prepare movement history
      const leasing = createdInventory.leasingInfo?.[0];

      let portId: number | null = null;
      let addressBookId: number | null = null;

      if (leasing) {
        portId = leasing.portId;
        addressBookId = leasing.onHireDepotaddressbookId;
      } else if (
        data['ownership'] === 'Own' &&
        data['portId'] &&
        data['onHireDepotaddressbookId']
      ) {
        portId =
          typeof data['portId'] === 'string'
            ? parseInt(data['portId'], 10)
            : data['portId'];
        addressBookId =
          typeof data['onHireDepotaddressbookId'] === 'string'
            ? parseInt(data['onHireDepotaddressbookId'], 10)
            : data['onHireDepotaddressbookId'];
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
    return this.prisma.inventory
      .findMany({
        include: {
          leasingInfo: true,
          periodicTankCertificates: true,
          onHireReport: true,
        },
      })
      .then((inventories) => {
        return inventories.map((inventory) => {
          const ownershipType =
            inventory.leasingInfo && inventory.leasingInfo.length > 0
              ? 'Lease'
              : 'Own';

          return {
            ...inventory,
            ownershipType,
          };
        });
      });
  }

  findOne(id: number) {
    return this.prisma.inventory
      .findUnique({
        where: { id },
        include: {
          leasingInfo: true,
          periodicTankCertificates: true,
          onHireReport: true,
        },
      })
      .then((inventory) => {
        if (!inventory) return null;

        const ownershipType =
          inventory.leasingInfo && inventory.leasingInfo.length > 0
            ? 'Lease'
            : 'Own';

        return {
          ...inventory,
          ownershipType,
        };
      });
  }

  async update(id: number, data: UpdateInventoryDto) {
    const {
      periodicTankCertificates,
      leasingInfo,
      onHireReport,
      ownership,
      ...inventoryData
    } = data;

    await this.prisma.inventory.update({
      where: { id },
      data: inventoryData,
    });

    if (periodicTankCertificates?.length) {
      for (const cert of periodicTankCertificates) {
        const inspectionDate = cert.inspectionDate
          ? new Date(cert.inspectionDate)
          : undefined;
        const nextDueDate = cert.nextDueDate
          ? new Date(cert.nextDueDate)
          : undefined;

        if (cert.id) {
          await this.prisma.periodicTankCertificates.update({
            where: { id: cert.id },
            data: {
              inspectionDate,
              inspectionType: cert.inspectionType,
              nextDueDate,
              certificate: cert.certificate ?? '',
            },
          });
        } else {
          await this.prisma.periodicTankCertificates.create({
            data: {
              inspectionDate,
              inspectionType: cert.inspectionType,
              nextDueDate,
              certificate: cert.certificate ?? '',
              inventoryId: id,
            },
          });
        }
      }
    }

    if (leasingInfo?.length) {
      for (const lease of leasingInfo) {
        const leasingData: any = {
          ownershipType: lease.ownershipType,
          leasingRefNo: lease.leasingRefNo,
          leasoraddressbookId: lease.leasoraddressbookId,
          onHireDepotaddressbookId: lease.onHireDepotaddressbookId,
          portId: lease.portId,
          leaseRentPerDay: lease.leaseRentPerDay ?? '0',
          remarks: lease.remarks ?? '',
        };

        if (lease.onHireDate) {
          leasingData.onHireDate = new Date(lease.onHireDate);
        }
        if (lease.offHireDate) {
          leasingData.offHireDate = new Date(lease.offHireDate);
        }

        if (lease.id) {
          await this.prisma.leasingInfo.update({
            where: { id: lease.id },
            data: {
              ownershipType: lease.ownershipType,
              leasingRefNo: lease.leasingRefNo,
              leasoraddressbookId: lease.leasoraddressbookId,
              onHireDepotaddressbookId: lease.onHireDepotaddressbookId,
              portId: lease.portId,
              onHireDate: lease.onHireDate
                ? new Date(lease.onHireDate)
                : undefined,
              offHireDate: lease.offHireDate
                ? new Date(lease.offHireDate)
                : undefined,
              leaseRentPerDay: lease.leaseRentPerDay ?? '0',
              remarks: lease.remarks ?? '',
            },
          });
        } else {
          await this.prisma.leasingInfo.create({
            data: {
              ownershipType: lease.ownershipType,
              leasingRefNo: lease.leasingRefNo,
              leasoraddressbookId: lease.leasoraddressbookId,
              onHireDepotaddressbookId: lease.onHireDepotaddressbookId,
              portId: lease.portId,
              onHireDate: lease.onHireDate
                ? new Date(lease.onHireDate)
                : new Date(),
              offHireDate: lease.offHireDate
                ? new Date(lease.offHireDate)
                : undefined,
              leaseRentPerDay: lease.leaseRentPerDay ?? '0',
              remarks: lease.remarks ?? '',
              inventoryId: id,
            },
          });
        }
      }
    }

    if (onHireReport?.length) {
      for (const report of onHireReport) {
        if (report.id) {
          await this.prisma.onHireReport.update({
            where: { id: report.id },
            data: {
              reportDate: report.reportDate
                ? new Date(report.reportDate)
                : undefined,
              reportDocument: report.reportDocument,
            },
          });
        } else {
          await this.prisma.onHireReport.create({
            data: {
              reportDate: report.reportDate
                ? new Date(report.reportDate)
                : undefined,
              reportDocument:
                typeof report.reportDocument === 'object'
                  ? JSON.stringify(report.reportDocument)
                  : report.reportDocument,
              inventoryId: id,
            },
          });
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const numId = +id;

    await this.prisma.$transaction([
      this.prisma.periodicTankCertificates.deleteMany({
        where: { inventoryId: numId },
      }),
      this.prisma.onHireReport.deleteMany({
        where: { inventoryId: numId },
      }),
      this.prisma.leasingInfo.deleteMany({
        where: { inventoryId: numId },
      }),
      this.prisma.inventory.delete({
        where: { id: numId },
      }),
    ]);

    return { id: numId };
  }
}
