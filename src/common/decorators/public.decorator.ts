import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/**
 * Marks route handlers that should bypass global auth guard checks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
