import { Injectable } from '@nestjs/common';
import { UpdatePeriodicTankCertificateDto } from './dto/updateTankCertificate.dto';
import { CreatePeriodicTankCertificateDto } from './dto/createTankCertificate.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TankCertificateService {
     constructor(private prisma: PrismaService) {}

  create(data: CreatePeriodicTankCertificateDto & { certificate?: string }) {
  return this.prisma.periodicTankCertificates.create({
    data: {
      ...data,
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toISOString() : undefined,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate).toISOString() : undefined,
      inventoryId: typeof data.inventoryId === 'string' ? parseInt(data.inventoryId, 10) : data.inventoryId,
    }
  });
}


  findAll() {
    return this.prisma.periodicTankCertificates.findMany();
  }

  findOne(id: number) {
    return this.prisma.periodicTankCertificates.findUnique({ where: { id } });
  }

  update(id: number, data: UpdatePeriodicTankCertificateDto & { certificate?: string }) {
  return this.prisma.periodicTankCertificates.update({ where: { id }, data });
}


  remove(id: number) {
    return this.prisma.periodicTankCertificates.delete({ where: { id } });
  }
}
