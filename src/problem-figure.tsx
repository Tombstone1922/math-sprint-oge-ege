import React from 'react';
import { NumericFigure, AxisFigure } from './numeric-figures';
import type { Problem } from './engine';
import { GeometryFigure } from './geometry-figure';
import { ChanceFigure, hasChanceFigure } from './chance-figures';
import { FunctionFigure, NumberLineFigure } from './algebra-figures';
export const hasFigure = (problem: Problem) => Boolean(problem.numericTask || problem.axisScene || problem.figure || problem.graphs || problem.numberLines || hasChanceFigure(problem.chance));
export function ProblemFigure({ problem }: { problem: Problem }) {
  if (problem.numericTask) return <NumericFigure task={problem.numericTask} />;
  if (problem.axisScene) return <AxisFigure scene={problem.axisScene} />;
  if (problem.chance && hasChanceFigure(problem.chance)) return <ChanceFigure model={problem.chance} />;
  if (problem.graphs) return <FunctionFigure question={problem.graphs} />;
  if (problem.numberLines) return <NumberLineFigure question={problem.numberLines} />;
  return problem.figure ? <GeometryFigure figure={problem.figure} /> : null;
}
