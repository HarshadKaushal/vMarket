import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null) {
      return '';
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString({ message: 'description must be a string' })
  description!: string;

  @IsInt({ message: 'quantity must be a whole number zero or greater' })
  @Min(0, { message: 'quantity must be a whole number zero or greater' })
  quantity!: number;
}
