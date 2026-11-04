import { emptyScience, parseScience } from './state.ts';
import { trainingStorage, type TrainingStorage } from '../training/storage.ts';
export const SCIENCE_KEY = 'math-sprint/science/v1';
export type ScienceStorage = TrainingStorage;
const storage = trainingStorage(SCIENCE_KEY, emptyScience, parseScience);
export const loadScience = storage.load, createScienceWriter = storage.writer;
