import React from 'react';
import type { Problem } from './engine';
import { GeometryFigure } from './geometry-figure';
import { ChanceFigure, hasChanceFigure } from './chance-figures';
import { FunctionFigure, NumberLineFigure } from './algebra-figures';
export const hasFigure = (problem: Problem) => Boolean(problem.figure || problem.graphs || problem.numberLines || hasChanceFigure(problem.chance));
export function ProblemFigure({ problem }: { problem: Problem }) {
  if (problem.chance && hasChanceFigure(problem.chance)) return <ChanceFigure model={problem.chance} />;
  if (problem.graphs) return <FunctionFigure question={problem.graphs} />;
  if (problem.numberLines) return <NumberLineFigure question={problem.numberLines} />;
  return problem.figure ? <GeometryFigure figure={problem.figure} /> : null;
}
