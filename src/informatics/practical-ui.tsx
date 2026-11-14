import React, { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button, Choice, Disclosure } from '../components';
import { MotionIn } from '../motion';
import { s } from '../subject-ui';
import { colors, layout, surface } from '../theme';
import type { TrainingWork } from '../training/engine';
import { useInformatics } from './provider';
import type { InformaticsTask } from './model';
import { packTrainingFiles, robotProgram, runRobot, type RobotField, type TrainingFile } from './practical-model';

function Download({ files, filename, title }: { files:TrainingFile[]; filename:string; title:string }) {
 const [status,setStatus]=useState(''), [busy,setBusy]=useState(false);
 const exportFiles=async()=>{
  setStatus('');setBusy(true);
  try{
   const bytes=packTrainingFiles(files);
   if(Platform.OS==='web'){
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'})), link=document.createElement('a');
    link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
   }else{
    if(!await Sharing.isAvailableAsync()) throw Error('sharing');
    const file=new File(Paths.cache,filename);file.create({overwrite:true});file.write(bytes);
    await Sharing.shareAsync(file.uri,{mimeType:'application/zip',dialogTitle:title});
   }
  }catch{setStatus('Не удалось открыть сохранение архива. Можно посмотреть файлы в карточке или попробовать снова.');}
  finally{setBusy(false);}
 };
 return <><Button secondary title={busy?'Готовим файлы…':title} onPress={()=>void exportFiles()} disabled={busy}/>{Boolean(status)&&<Text accessibilityLiveRegion="polite" style={s.small}>{status}</Text>}</>;
}

function RobotPreview({ field, painted }: { field:RobotField; painted?:string[] }) {
 const {width}=useWindowDimensions(), cell=Math.min(35,Math.floor((Math.min(width,layout.maxWidth)-88)/field.columns));
 const target=new Set(field.target.map(p=>p.join(','))), wall=new Set(field.walls.map(p=>p.join(',')));
 return <View accessible accessibilityLabel={`Поле Робота: ${field.columns} на ${field.rows}. Начало: столбец ${field.start[0]+1}, строка ${field.start[1]+1}.`} style={{alignSelf:'center',marginVertical:12,borderWidth:1,borderColor:colors.border}}>
  {Array.from({length:field.rows},(_,y)=><View key={y} style={{flexDirection:'row'}}>{Array.from({length:field.columns},(_,x)=>{
   const key=`${x},${y}`, start=x===field.start[0]&&y===field.start[1], right=wall.has(key+',R'), down=wall.has(key+',D'), top=wall.has(`${x},${y-1},D`), left=wall.has(`${x-1},${y},R`), marked=painted?.includes(key);
   return <View key={x} style={{width:cell,height:cell,borderRightWidth:right?2:1,borderBottomWidth:down?2:1,borderTopWidth:top?2:0,borderLeftWidth:left?2:0,borderRightColor:right?colors.navy:colors.border,borderBottomColor:down?colors.navy:colors.border,borderTopColor:colors.navy,borderLeftColor:colors.navy,backgroundColor:marked?colors.mint:target.has(key)?colors.amber:colors.white,alignItems:'center',justifyContent:'center'}}>
    {start&&<Text style={{color:colors.blue,fontSize:14,fontWeight:'800'}}>Р</Text>}
   </View>;
  })}</View>)}
 </View>;
}
const caseText=(a:number[])=>a.join('\n');
export function PracticalMaterials({task}:{task:InformaticsTask}){
 const p=task.practical;
 if(!p)return null;
 return <View testID="practical-materials">
  {p.files?.length ? <><Download title={`Скачать исходные файлы · ${p.files.length}`} files={p.files} filename={`${task.id}.zip`}/>
    <Disclosure title="Просмотреть учебные файлы">
     <Text style={s.small}>В архиве те же файлы. Для задач с редактором сохрани архив и открой материалы в нужной программе.</Text>
     <ScrollView nestedScrollEnabled style={{maxHeight:350}}>{p.files.map(f=><View key={f.path} style={{paddingVertical:9,borderBottomWidth:1,borderColor:colors.border}}>
      <Text selectable style={s.title}>{f.path}</Text>{p.files!.length<=15&&!f.path.endsWith('.svg')&&<Text selectable style={s.small}>{f.text.slice(0,2600)}{f.text.length>2600?'\n… Полный текст — в архиве.':''}</Text>}
     </View>)}</ScrollView>
    </Disclosure></> : null}
  {p.robot&&<><RobotPreview field={p.robot.preview}/><Text style={s.small}>Р — старт; жёлтые клетки нужно закрасить. Тёмные линии — стены.</Text></>}
  {p.program&&<Disclosure title="Примеры входа и выхода">{p.program.examples.map((example,i)=><View key={i} style={s.card}><Text style={s.title}>Пример {i+1}</Text><Text selectable style={s.body}>{caseText(example.input)}</Text><Text style={s.small}>Ожидаемый ответ: {example.output}</Text></View>)}</Disclosure>}
 </View>;
}
export function PracticalSamples({task}:{task:InformaticsTask}){
 const p=task.practical;
 if(!p)return null;
 const cases=p.program&&[...p.program.examples,...p.program.checks];
 const tests=cases?.flatMap(({input,output},i)=>[{path:`проверка/${i+1}.in.txt`,text:caseText(input)+'\n'},{path:`проверка/${i+1}.out.txt`,text:String(output)+'\n'}])??[];
 const files=[...(p.sampleFiles??[]),...tests];
 return <>{(p.robot||p.program)&&<Text selectable style={[s.body,{fontFamily:'monospace'}]}>{p.robot?.sample??p.program?.sample}</Text>}{files.length>0&&<Download files={files} filename={`${task.id}-razbor.zip`} title={p.program?'Скачать образец программы и тесты':'Скачать материалы для сверки'}/>}</>;
}

export function InformaticsWritten({task,work,session}:{task:InformaticsTask;work:TrainingWork;session:string}){
 const {dispatch}=useInformatics(), base={session,task:task.id};
 const [robotCheck,setRobotCheck]=useState<{message:string;painted:string[];ok:boolean}|null>(null);
 const robot=task.practical?.robot, program=task.practical?.program;
 const validateRobot=()=>{
  if(!robot)return;
  try{
   const parsed=robotProgram(work.draft??''), visible=runRobot(parsed,robot.preview);
   const others=robot.tests.map(field=>runRobot(parsed,field)), ok=visible.correct&&others.every(x=>x.correct);
   setRobotCheck({painted:visible.painted,ok,message:ok?'Поведение верно на четырёх полях. Проверь универсальность алгоритма.':!visible.correct?visible.reason!:`На поле другого размера: ${others.find(x=>!x.correct)?.reason}`});
  }catch(error){setRobotCheck({message:error instanceof Error?error.message:'Не удалось разобрать команды.',painted:[],ok:false});}
 };
 return <>
  <View style={s.card}><Text accessibilityRole="header" style={s.title}>{robot?'Алгоритм Робота':program?'Моя программа':'Моя работа'}</Text>
   <Text style={s.small}>{robot?'Команды по одной на строку: вверх, вниз, влево, вправо, закрасить. Цикл: «нц пока справа свободно», команды, «кц». Вместо «справа» можно использовать «слева», «сверху», «снизу».':program?'Запусти свой код в среде программирования. Здесь можно сохранить его черновик и затем сверить с образцом; приложение не исполняет введённый код.':'Выполни задание в редакторе. Запиши здесь название файла и что получилось — этого достаточно для перехода к сверке.'}</Text>
   <TextInput multiline accessibilityLabel={robot?'Команды Робота':program?'Черновик программы':'Заметки к учебному файлу'} editable={!work.submitted} value={work.draft??''} onChangeText={value=>{setRobotCheck(null);dispatch({...base,type:'draft',value});}} maxLength={6000} autoCapitalize="none" autoCorrect={false} style={{...surface.field,minHeight:128,marginTop:12,textAlignVertical:'top',padding:14,color:colors.ink,fontSize:16,lineHeight:23}}/>
   {robot&&!work.submitted&&<Button secondary title="Проверить на четырёх полях" disabled={!work.draft?.trim()} onPress={validateRobot}/>}
   {robotCheck&&robot&&<MotionIn accessibilityLiveRegion="polite" style={[s.notice,{backgroundColor:robotCheck.ok?colors.mint:colors.redPale}]}><Text style={s.body}>{robotCheck.message}</Text><RobotPreview field={robot.preview} painted={robotCheck.painted}/></MotionIn>}
  </View>
  {!work.opened&&<Disclosure title="Подсказки по шагам" initialOpen={work.hint>0}>
   {work.hint>=1&&<Text style={s.body}>{task.steps[0]}</Text>}{work.hint>=2&&<Text style={s.body}>{task.steps[1]}</Text>}
   {work.hint<2&&<Button secondary title={work.hint?'Показать следующий шаг':'Небольшой намёк'} onPress={()=>dispatch({...base,type:'hint',level:work.hint+1})}/>}
  </Disclosure>}
  {work.opened&&<MotionIn style={s.card}><Text accessibilityRole="header" style={s.title}>Самопроверка по критериям</Text>
   {task.steps.map((step,i)=><Text style={s.body} key={i}>{i+1}. {step}</Text>)}<PracticalSamples task={task}/>
   <Text style={s.body}>Отметь критерии, которые выполнены в твоём решении.</Text>
   {task.written?.criteria.map(({title,detail},i)=><View key={title} style={{marginTop:12}}><Choice title={`${work.criteria?.[i]?'✓ ':''}${title}`} role="checkbox" selected={Boolean(work.criteria?.[i])} disabled={work.submitted} onPress={()=>dispatch({...base,type:'criterion',index:i,checked:!work.criteria?.[i]})}/><Text style={s.small}>{detail}</Text></View>)}
   {work.submitted&&<Text accessibilityLiveRegion="polite" style={s.body}>Сохранено: {work.score} из {task.written?.criteria.length} критериев.</Text>}
  </MotionIn>}
 </>;
}
