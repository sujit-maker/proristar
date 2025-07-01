import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOnHireReportDto } from './dto/create-onhire-report.dto';
import { UpdateOnHireReportDto } from './dto/update-onhire-report.dto';

@Injectable()
export class OnHireReportService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateOnHireReportDto) {
    // Convert the date string to full ISO format if it's not already
    const formattedData = {
      ...data,
      reportDate: data.reportDate
        ? new Date(data.reportDate).toISOString()
        : undefined,
    };

    return this.prisma.onHireReport.create({ data: formattedData });
  }

  findAll() {
    return this.prisma.onHireReport.findMany();
  }

  findOne(id: number) {
    return this.prisma.onHireReport.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateOnHireReportDto) {
    // Also handle date formatting in updates
    const formattedData = {
      ...data,
      reportDate: data.reportDate
        ? new Date(data.reportDate).toISOString()
        : undefined,
    };

    return this.prisma.onHireReport.update({ where: { id }, data: formattedData });
  }

  remove(id: number) {
    return this.prisma.onHireReport.delete({ where: { id } });
  }
}
