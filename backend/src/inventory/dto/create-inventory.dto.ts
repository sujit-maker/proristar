import { IsString, IsNumber, IsOptional, IsDateString, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CertificateDto {

  
  @IsOptional()
  id?: number;

  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @IsOptional()
  @IsString()
  inspectionType?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  certificateFile?: string;

  @IsOptional()
  certicateFile?: string; // Keep this for backward compatibility
}

export class LeasingInfoDto {
  @IsOptional()
  id?: number;

  @IsString()
  ownershipType: string;

  @IsString()
  leasingRefNo: string;

  @IsInt()
  leasoraddressbookId: number;

  @IsDateString()
  onHireDate: string;

   @IsString()
   leaseRentPerDay:string
   
   @IsString()
   remarks:string

  @IsInt()
  portId: number;

  @IsInt()
  onHireDepotaddressbookId: number;

  @IsOptional()
  @IsDateString()
  offHireDate?: string;
}

export class OnHireReportDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  reportDocument?: any;
}

export class CreateInventoryDto {
  @IsString()
  status: string;

  @IsString()
  containerNumber: string;

  @IsString()
  containerCategory: string;

  @IsString()
  containerType: string;

  @IsString()
  containerSize: string;

  @IsString()
  containerClass: string;

  @IsString()
  containerCapacity: string;

  @IsString()
  capacityUnit: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  buildYear?: string;

  @IsString()
  @IsOptional()
  grossWeight?: string;

  @IsString()
  @IsOptional()
  tareWeight?: string;

  @IsDateString()
  @IsOptional()
  InitialSurveyDate?: string;

  @IsOptional()
  @IsString()
  ownership?: string;
  
  @IsOptional()
  @IsNumber()
  portId?: number;
  
  @IsOptional()
  @IsNumber()
  onHireDepotaddressbookId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => CertificateDto)
  periodicTankCertificates?: CertificateDto[];

  @IsOptional()
  @IsArray()
  @Type(() => LeasingInfoDto)
  leasingInfo?: LeasingInfoDto[];

  @IsOptional()
  @IsArray()
  @Type(() => OnHireReportDto)
  onHireReport?: OnHireReportDto[];
}
