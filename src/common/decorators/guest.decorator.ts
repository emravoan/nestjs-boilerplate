import { SetMetadata } from '@nestjs/common';

import { IS_GUEST_KEY } from '../constants/auth.constants';

/**
 * Marks route handlers that bypass JWT authentication but still require API key protection.
 */
export const Guest = () => SetMetadata(IS_GUEST_KEY, true);
