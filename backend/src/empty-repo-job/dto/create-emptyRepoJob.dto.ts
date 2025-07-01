// src/empty-repo-job/dto/create-empty-repo-job.dto.ts

import { IsArray, IsDateString, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRepoShipmentContainerDto {
  @IsString()
  containerNumber: string;

  @IsString()
  capacity: string;

  @IsString()
  tare: string;

  @IsOptional() @IsInt()
  inventoryId?: number;

  @IsOptional() @IsInt()
  portId?: number;

  @IsOptional() @IsString()
  depotName?: string;
}

export class CreateEmptyRepoJobDto {
  @IsDateString()
  date: string;

  @IsString()
  jobNumber: string;

  @IsString()
  houseBL: string;

  @IsString()
  shippingTerm: string;

  @IsOptional() @IsInt()
  expHandlingAgentAddressBookId?: number;

  @IsOptional() @IsInt()
  impHandlingAgentAddressBookId?: number;

  @IsOptional() @IsInt()
  carrierAddressBookId?: number;

  @IsOptional() @IsInt()
  emptyReturnDepotAddressBookId?: number;

  @IsOptional() @IsInt()
  polPortId?: number;

  @IsOptional() @IsInt()
  podPortId?: number;

  @IsOptional() @IsInt()
  transhipmentPortId?: number;

  @IsString()
  polFreeDays: string;

  @IsString()
  podFreeDays: string;

  @IsString()
  polDetentionRate: string;

  @IsString()
  podDetentionRate: string;

  @IsString()
  quantity: string;

  @IsString()
  vesselName: string;

  @IsDateString()
  gsDate: string;

  @IsDateString()
  sob: string;

  @IsDateString()
  etaTopod: string;

  @IsDateString()
  estimateDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRepoShipmentContainerDto)
  containers: CreateRepoShipmentContainerDto[];
}
