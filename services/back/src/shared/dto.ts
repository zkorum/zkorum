import { ApiProperty } from '@nestjs/swagger';

interface ErrorResponse {
  code: number;
  externalMessage?: string;
}

export class BooleanResponse {
  @ApiProperty()
  result: boolean;
  error?: ErrorResponse;
}
