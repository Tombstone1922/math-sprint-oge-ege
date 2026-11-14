export const createGroups = (title: (group:number) => string) =>
  Array.from({length:10},(_,i)=>({ number:i+1, title:title(i+1), note:'20 учебных заданий · в подборке случайные 10' }));
export const courseExam = (id: string): 'oge'|'ege' => id.includes('-ege-')?'ege':'oge';
export const courseExamName = (id:string) => courseExam(id)==='ege'?'ЕГЭ':'ОГЭ';
export const examRegistry = <T extends {id:string;number:number;exam?:'ege'}>(tasks:readonly T[], subject:string) => {
  const banks: Record<string,T[]> = {};
  for (const task of tasks) {
    const id = `${subject}-${task.exam??'oge'}-${task.number}`;
    (banks[id]??=[]).push(task);
  }
  return banks;
};
