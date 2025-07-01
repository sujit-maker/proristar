import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePeriodicTankCertificateDto {
  @IsOptional()
  @IsDateString()
  inspectionDate?: Date;

  @IsOptional()
  @IsString()
  inspectionType?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: Date;

  @IsOptional()
  @IsString()
  certificate?: string; // ✅ corrected

  @IsInt()
  inventoryId: number;
}
