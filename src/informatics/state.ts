import { createTrainingEngine, type TrainingState, type TrainingAction } from '../training/engine.ts';
import { informaticsCourse, informaticsTask, informaticsTaskCourse, informaticsAnswer, informaticsCorrect, informaticsReady, validInformaticsInput } from './courses.ts';
import type { InformaticsCourseId } from './model.ts';
export type InformaticsState=TrainingState<InformaticsCourseId>;
export type InformaticsAction=TrainingAction<InformaticsCourseId>;
const engine=createTrainingEngine({defaultCourse:'informatics-oge-1' as InformaticsCourseId,sessionPrefix:'informatics',course:informaticsCourse,task:informaticsTask,taskCourse:informaticsTaskCourse,answer:informaticsAnswer,correct:informaticsCorrect,ready:informaticsReady,valid:validInformaticsInput});
export const emptyInformatics=engine.empty,reduceInformatics=engine.reduce,parseInformatics=engine.parse,informaticsPending=engine.pending,informaticsTotals=engine.totals;
