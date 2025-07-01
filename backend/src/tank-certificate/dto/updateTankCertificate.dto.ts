    import { PartialType } from '@nestjs/mapped-types';
    import { CreatePeriodicTankCertificateDto } from './createTankCertificate.dto';

    export class UpdatePeriodicTankCertificateDto extends PartialType(CreatePeriodicTankCertificateDto) {}
