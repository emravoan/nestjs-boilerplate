import { SetMetadata } from '@nestjs/common';

import { RESPONSE_MESSAGE_KEY } from '../constants/response.constants';

/**
 * Assigns a custom success message for transformed responses.
 */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
