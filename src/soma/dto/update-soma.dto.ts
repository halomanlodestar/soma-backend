import { PartialType } from '@nestjs/mapped-types';
import { CreateSomaDto } from './create-soma.dto';

export class UpdateSomaDto extends PartialType(CreateSomaDto) {}
