import { ApiProperty } from '@nestjs/swagger';

export class BooleanResponse {
  @ApiProperty()
  result: boolean;
}
