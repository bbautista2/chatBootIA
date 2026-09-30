import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const cuidRegex = /^c[a-z0-9]{24,}$/;
    if (!cuidRegex.test(value)) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}
