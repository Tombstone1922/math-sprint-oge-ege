import type { Problem } from './engine.ts';
import { triangleProblemPool } from './oge15-problems.ts';
import { circleProblemPool } from './oge16-problems.ts';
import { quadrilateralProblemPool } from './oge17-problems.ts';
import { gridProblemPool } from './oge18-problems.ts';

import { statementProblemPool } from './oge19-problems.ts';

export type OgeGeometryId = 'oge-15' | 'oge-16' | 'oge-17' | 'oge-18' | 'oge-19';

export const ogeGeometryPools: Record<OgeGeometryId, readonly Problem[]> = {
  'oge-15': triangleProblemPool, 'oge-16': circleProblemPool, 'oge-17': quadrilateralProblemPool, 'oge-18': gridProblemPool, 'oge-19': statementProblemPool,
};
