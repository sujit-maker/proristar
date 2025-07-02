// src/leasing-info/leasing-info.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateLeasingInfoDto } from './dto/update-leasingInfo.dto';
import { LeasingInfoDto } from './dto/create-leasingInfo.dto';


@Injectable()
export class LeasingInfoService {
  constructor(private readonly prisma: PrismaService) {}

async create(data: LeasingInfoDto) {
  try {
    if (
      !data.leasoraddressbookId ||
      !data.onHireDepotaddressbookId ||
      !data.portId ||
      !data.inventoryId
    ) {
      throw new Error("Missing required IDs for creating leasing info.");
    }

    if (!data.onHireDate) {
      throw new Error("Missing onHireDate for creating leasing info.");
    }

    return await this.prisma.leasingInfo.create({
      data: {
        ownershipType: data.ownershipType,
        leasingRefNo: data.leasingRefNo,
        leasoraddressbookId: data.leasoraddressbookId,
        onHireDepotaddressbookId: data.onHireDepotaddressbookId,
        portId: data.portId,
        onHireDate: new Date(data.onHireDate), // ✅ now guaranteed to be a string
        leaseRentPerDay: data.leaseRentPerDay,
        remarks: data.remarks,
        offHireDate: data.offHireDate ? new Date(data.offHireDate) : undefined,
        inventoryId: data.inventoryId,
      },
    });
  } catch (err) {
    console.error("❌ Error in create leasingInfo:", err);
    throw err;
  }
}

  
  findAll() {
    return this.prisma.leasingInfo.findMany({
      include: {
        addressBook: true,
        onHireDepotAddressBook: true,
        port: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.leasingInfo.findUnique({
      where: { id },
      include: {
        addressBook: true,
        onHireDepotAddressBook: true,
        port: true,
      },
    });
  }

  update(id: number, data: UpdateLeasingInfoDto) {
  return this.prisma.leasingInfo.update({
    where: { id },
   data: {
  ...data,
  ...(data.onHireDate && { onHireDate: new Date(data.onHireDate) }),
  ...(data.offHireDate && { offHireDate: new Date(data.offHireDate) }),
},

  });
}

  remove(id: number) {
    return this.prisma.leasingInfo.delete({
      where: { id },
    });
  }
}
