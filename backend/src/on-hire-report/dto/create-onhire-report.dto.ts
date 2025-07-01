import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateOnHireReportDto {
  @IsOptional()
  @IsDateString()
  reportDate?: Date;

  @IsOptional()
  @IsString()
  reportDocument?: string;

  @IsInt()
  inventoryId: number;
}
