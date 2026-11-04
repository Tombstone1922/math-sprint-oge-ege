import { createTrainingContext } from '../training/provider';
import { emptyInformatics,parseInformatics,reduceInformatics } from './state';
import { INFORMATICS_KEY } from './storage';
const context=createTrainingContext({key:INFORMATICS_KEY,empty:emptyInformatics,parse:parseInformatics,reduce:reduceInformatics});
export const InformaticsProvider=context.Provider,useInformatics=context.useTraining;
