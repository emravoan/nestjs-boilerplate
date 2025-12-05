import { SetMetadata } from '@nestjs/common';

import { SKIP_TRANSFORM_KEY } from '../constants/response.constants';

/**
 * Marks routes that should skip response transformation.
 */
export const RawResponse = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
