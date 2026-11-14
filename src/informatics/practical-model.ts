export type TrainingFile = { path: string; text: string };
export type RobotField = { columns: number; rows: number; start: [number,number]; walls: [number,number,'R'|'D'][]; target: [number,number][] };
export type ProgramCase = { input: number[]; output: number };
export type Practical = {
 files?: TrainingFile[];
 robot?: { preview: RobotField; tests: RobotField[]; sample: string };
 program?: { examples: ProgramCase[]; checks: ProgramCase[]; sample: string };
 sampleFiles?: TrainingFile[];
};
type Dir = 'R'|'L'|'U'|'D';
type Command = { op: Dir|'P' } | { op: 'loop'; dir: Dir; body: Command[] };
const dir: Record<Dir,[number,number]>={R:[1,0],L:[-1,0],U:[0,-1],D:[0,1]};
const names: Record<string,Dir>={вправо:'R',влево:'L',вверх:'U',вниз:'D',справа:'R',слева:'L',сверху:'U',снизу:'D'};
export function robotProgram(source:string):Command[] {
 const lines=source.toLowerCase().split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 if(!lines.length || lines.length>180) throw Error('Запиши от 1 до 180 команд, по одной на строку.');
 const result:Command[]=[], stack=[result];
 for(const [i,line] of lines.entries()){
  const loop=/^нц пока (справа|слева|сверху|снизу) свободно$/.exec(line);
  if(loop){
   if(stack.length>=8) throw Error('Слишком много вложенных циклов.');
   const body:Command[]=[];stack.at(-1)!.push({op:'loop',dir:names[loop[1]],body});stack.push(body);
  }else if(line==='кц'){
   if(stack.length===1 || !stack.at(-1)!.length) throw Error(`Проверь границы цикла, строка ${i+1}.`);
   stack.pop();
  }else if(line==='закрасить') stack.at(-1)!.push({op:'P'});
  else if(['вправо','влево','вверх','вниз'].includes(line)) stack.at(-1)!.push({op:names[line]});
  else throw Error(`Неизвестная команда, строка ${i+1}.`);
 }
 if(stack.length!==1) throw Error('Закрой каждый цикл командой «кц».');
 return result;
}
export function runRobot(commands:Command[], field:RobotField):{correct:boolean;painted:string[];reason?:string} {
 let [x,y]=field.start, fuel=6000, reason:string|undefined;
 const painted=new Set<string>(), walls=new Set(field.walls.map(w=>w.join(',')));
 const free=(d:Dir)=>{
  const [dx,dy]=dir[d], a=x+dx,b=y+dy;
  return a>=0&&a<field.columns&&b>=0&&b<field.rows&&!walls.has([Math.min(x,a),Math.min(y,b),dx?'R':'D'].join(','));
 };
 const execute=(body:Command[])=>{
  for(const cmd of body){
   if(reason) return;
   if(--fuel<0){reason='Робот не закончил работу за 6000 операций.';return;}
   if(cmd.op==='loop') while(!reason&&free(cmd.dir)) execute(cmd.body);
   else if(cmd.op==='P') painted.add(`${x},${y}`);
   else if(!free(cmd.op)) {reason='Робот столкнулся со стеной.';return;}
   else {x+=dir[cmd.op][0];y+=dir[cmd.op][1];}
  }
 };
 execute(commands);
 const correct=!reason&&painted.size===field.target.length&&field.target.every(t=>painted.has(t.join(',')));
 return {correct,painted:[...painted],reason:reason??(correct?undefined:'Нужно закрасить все отмеченные клетки и только их.')};
}

// ZIP with stored UTF-8 entries. Used for task materials and workbook exports.
const crcTable = Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);return n>>>0;});
export function packTrainingFiles(files:TrainingFile[]):Uint8Array<ArrayBuffer> {
 const bytes=(s:string)=>new Uint8Array(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g,(_,h:string)=>String.fromCharCode(parseInt(h,16))).split('').map(c=>c.charCodeAt(0)));
 const parts=files.map(({path,text})=>{const name=bytes(path),content=bytes(text),crc=content.reduce((c,v)=>(c>>>8)^crcTable[(c^v)&255],0xffffffff)^0xffffffff;return{name,content,crc};});
 const centralSize=parts.reduce((n,f)=>n+46+f.name.length,0),localSize=parts.reduce((n,f)=>n+30+f.name.length+f.content.length,0);
 const output=new Uint8Array(localSize+centralSize+22), view=new DataView(output.buffer);
 const u16=(at:number,n:number)=>view.setUint16(at,n,true),u32=(at:number,n:number)=>view.setUint32(at,n,true);
 let at=0, central=localSize;
 for(const f of parts){
  u32(at,0x04034b50);u16(at+4,20);u16(at+6,2048);u32(at+14,f.crc);u32(at+18,f.content.length);u32(at+22,f.content.length);u16(at+26,f.name.length);
  output.set(f.name,at+30);output.set(f.content,at+30+f.name.length);
  u32(central,0x02014b50);u16(central+4,20);u16(central+6,20);u16(central+8,2048);u32(central+16,f.crc);u32(central+20,f.content.length);u32(central+24,f.content.length);u16(central+28,f.name.length);u32(central+42,at);
  output.set(f.name,central+46);
  at+=30+f.name.length+f.content.length; central+=46+f.name.length;
 }
 u32(central,0x06054b50);u16(central+8,parts.length);u16(central+10,parts.length);u32(central+12,centralSize);u32(central+16,localSize);
 return output;
}
export const csv = (rows: (number|string)[][]) => '\uFEFF'+rows.map(r=>r.map(v=>typeof v==='number'?String(v).replace('.',','):/[;"\r\n]/.test(v)?'"'+v.replaceAll('"','""')+'"':v).join(';')).join('\r\n');
