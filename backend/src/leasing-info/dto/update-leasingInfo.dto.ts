// src/leasing-info/dto/update-leasing-info.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLeasingInfoDto } from './create-leasingInfo.dto';

export class UpdateLeasingInfoDto extends PartialType(CreateLeasingInfoDto) {}
