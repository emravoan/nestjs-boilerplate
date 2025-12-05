import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/**
 * Formats class-validator errors into field/message groups for form binding.
 */
function formatValidationErrors(errors: ValidationError[]): Array<{ field: string; messages: string[] | unknown[] }> {
  return errors.map((error) => {
    const messages = Object.values(error.constraints || {});

    return {
      field: error.property,
      messages: !error.children?.length ? messages : formatValidationErrors(error.children),
    };
  });
}

/**
 * Creates a global validation pipe with frontend-friendly error shaping.
 */
export function ValidationPipeFactory(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    disableErrorMessages: true,
    exceptionFactory: (errors) => {
      return new BadRequestException({
        message: 'Some fields are invalid. Please check and try again.',
        errors: formatValidationErrors(errors),
      });
    },
  });
}
