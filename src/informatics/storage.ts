import { trainingStorage } from '../training/storage.ts';
import { emptyInformatics,parseInformatics } from './state.ts';
export const INFORMATICS_KEY='math-sprint/informatics/v1';
const storage=trainingStorage(INFORMATICS_KEY,emptyInformatics,parseInformatics);
export const loadInformatics=storage.load,createInformaticsWriter=storage.writer;
