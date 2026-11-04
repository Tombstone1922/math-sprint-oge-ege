import { createTrainingContext } from '../training/provider';
import { emptyScience, parseScience, reduceScience } from './state';
import { SCIENCE_KEY } from './storage';
const context = createTrainingContext({ key: SCIENCE_KEY, empty: emptyScience, parse: parseScience, reduce: reduceScience });
export const ScienceProvider = context.Provider, useScience = context.useTraining;
