import {
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateBy,
  buildMessage,
} from 'class-validator';

export class PublishTransferDto {
  @IsString()
  @Matches(/^\d+$/, { message: 'productId must be a whole number' })
  productId!: string;

  @IsInt({ message: 'quantity must be a whole number greater than zero' })
  @Min(1, { message: 'quantity must be a whole number greater than zero' })
  quantity!: number;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'unitPrice must be a decimal string with up to 2 decimal places',
  })
  @ValidateBy({
    name: 'positiveUnitPrice',
    validator: {
      validate: (value: unknown) => typeof value === 'string' && Number(value) > 0,
      defaultMessage: buildMessage(() => 'unitPrice must be greater than zero'),
    },
  })
  unitPrice!: string;
}
