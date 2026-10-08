import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneProductField', async: false })
class AtLeastOneProductField implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateProductDto;
    return (
      dto.name !== undefined ||
      dto.description !== undefined ||
      dto.quantity !== undefined
    );
  }

  defaultMessage(): string {
    return 'At least one field is required';
  }
}

export class UpdateProductDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'quantity must be a whole number zero or greater' })
  @Min(0, { message: 'quantity must be a whole number zero or greater' })
  quantity?: number;

  @Validate(AtLeastOneProductField)
  private readonly atLeastOne?: unknown;
}
