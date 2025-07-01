import { IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateLeasingInfoDto {
  @IsString()
  ownershipType: string;

  @IsString()
  leasingRefNo: string;

  @IsInt()
  leasoraddressbookId: number;

  @IsInt()
  onHireDepotaddressbookId: number;

  @IsInt()
  portId: number;

  @IsDateString()
  onHireDate: string;

  @IsDateString()
  @IsOptional()
  offHireDate?: string;  // Add this field as optional

  @IsInt()
  @IsOptional()
  inventoryId?: number;

    @IsString()
  leaseRentPerDay: string;

    @IsString()
  remarks: string;
}
