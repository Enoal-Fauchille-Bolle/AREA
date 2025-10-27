import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export enum LinkPlatform {
  WEB = 'web',
  MOBILE = 'mobile',
}

function IsRequiredWith(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredWith',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0] as string;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          // If related property has a value, this property must also have a value
          if (relatedValue !== undefined && relatedValue !== null) {
            return value !== undefined && value !== null;
          }
          // If related property is empty, this can be empty too
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0] as string;
          return `${args.property} is required when ${relatedPropertyName} is provided`;
        },
      },
    });
  };
}

export class LinkServiceDto {
  @ApiProperty({
    description: 'The OAuth authorization code received from the service',
    example: 'SplxlOBeZQQYbYS6WxSbIA',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: LinkServiceDto) => o.platform !== undefined)
  @IsString()
  @IsRequiredWith('platform')
  code?: string;

  @ApiProperty({
    description: 'The platform for the link',
    enum: LinkPlatform,
    example: LinkPlatform.WEB,
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: LinkServiceDto) => o.code !== undefined)
  @IsEnum(LinkPlatform)
  @IsRequiredWith('code')
  platform?: LinkPlatform;
}
