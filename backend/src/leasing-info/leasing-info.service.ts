// src/leasing-info/leasing-info.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLeasingInfoDto } from './dto/create-leasingInfo.dto';
import { UpdateLeasingInfoDto } from './dto/update-leasingInfo.dto';


@Injectable()
export class LeasingInfoService {
  constructor(private readonly prisma: PrismaService) {}

 async create(data: CreateLeasingInfoDto) {
  try {
    if (
      !data.leasoraddressbookId ||
      !data.onHireDepotaddressbookId ||
      !data.portId ||
      !data.inventoryId
    ) {
      throw new Error("Missing required IDs for creating leasing info.");
    }

    return await this.prisma.leasingInfo.create({
      data: {
        ownershipType: data.ownershipType,
        leasingRefNo: data.leasingRefNo,
        leasoraddressbookId: data.leasoraddressbookId,
        onHireDepotaddressbookId: data.onHireDepotaddressbookId,
        portId: data.portId,
        onHireDate: new Date(data.onHireDate),
        leaseRentPerDay: data.leaseRentPerDay,
        remarks: data.remarks,
        offHireDate: data.offHireDate ? new Date(data.offHireDate) : null,
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
      data,
    });
  }

  remove(id: number) {
    return this.prisma.leasingInfo.delete({
      where: { id },
    });
  }
}
