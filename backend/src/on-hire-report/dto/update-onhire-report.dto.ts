import { PartialType } from '@nestjs/mapped-types';
import { CreateOnHireReportDto } from './create-onhire-report.dto';

export class UpdateOnHireReportDto extends PartialType(CreateOnHireReportDto) {}
