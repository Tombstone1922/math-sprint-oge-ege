import { instrumentDrawing } from './physics-instruments.ts';
import { plotDrawing } from './physics-plot.ts';
import { fmt, type PhysicsFigure } from './physics-model.ts';
import type { VectorInk } from '../vector-drawing.ts';
export type PhysicsInk = VectorInk;
const ink='#20334B',blue='#3565E8';
export function physicsDrawing(figure:PhysicsFigure):{width:number;height:number;items:PhysicsInk[]}{
 const items:PhysicsInk[]=[],width=390,height=280;
 const line=(x1:number,y1:number,x2:number,y2:number,weight=2,stroke=ink)=>items.push({kind:'line',x1,y1,x2,y2,weight,stroke});
 const text=(x:number,y:number,value:string,size=15,w=100,bold=false)=>items.push({kind:'text',x,y,value,size,width:w,color:ink,bold});
 const arrow=(x1:number,y1:number,x2:number,y2:number,stroke=ink)=>{line(x1,y1,x2,y2,2,stroke);const a=Math.atan2(y2-y1,x2-x1);for(const s of [-1,1])line(x2,y2,x2-7*Math.cos(a+s*.45),y2-7*Math.sin(a+s*.45),2,stroke);};
 if(figure.kind==='scale'){
  const instrument = instrumentDrawing(figure), vertical = ['Динамометр', 'Термометр', 'Мензурка'].includes(figure.instrument);
  return { width: vertical ? 250 : width, height, items: vertical ? instrument.map(p => p.kind === 'line' ? { ...p, x1: p.x1 - 70, x2: p.x2 - 70 } : { ...p, x: p.x - 70 }) : instrument };
 }else if(figure.kind==='apparatus'){
  text(195,24,'Схема установки',17,300,true);
  if(figure.mode==='friction'){line(35,185,355,185,3);line(105,133,205,133,2);line(105,133,105,183,2);line(205,133,205,183,2);line(105,183,205,183,2);line(205,157,280,157,2);arrow(282,157,350,157,blue);text(157,114,figure.labels[0]??'Брусок',14,150);text(288,122,figure.labels[1]??'Динамометр',13,160);text(196,217,'Горизонтальная поверхность',14,310);}
  else if(figure.mode==='spring'){line(95,64,275,64,4);line(180,64,180,82);let x=180,y=82;for(let i=0;i<8;i++){const nx=i%2?167:193,ny=y+8;line(x,y,nx,ny);x=nx;y=ny;}line(x,y,180,162);line(150,162,210,162);line(150,162,150,204);line(210,162,210,204);line(150,204,210,204);text(180,226,figure.labels[0]??'Груз',14,220);text(293,131,figure.labels[1]??'Пружина',14,170);}
  else if(figure.mode==='density'){line(92,75,92,210);line(92,210,255,210);line(255,210,255,75);line(92,142,255,142,2,blue);line(151,155,197,155);line(151,155,151,195);line(197,155,197,195);line(151,195,197,195);if(figure.labels[0]?.includes('доступ')){line(160,195,160,210);line(187,195,187,210);}else line(174,80,174,155);text(174,52,figure.labels[0]??'Тело',14,220);text(170,240,figure.labels[1]??'Жидкость',14,300);}
  else{arrow(32,170,357,170);line(85,120,85,190,3);arrow(85,168,85,126,blue);arrow(190,214,190,81);arrow(190,81,190,214);line(312,92,312,213,4);line(85,126,190,126,1.6,blue);line(190,126,312,190,1.6,blue);text(85,74,'Предмет',14,104);text(190,52,'Линза',14,90);text(310,65,'Экран',14,100);text(195,247,figure.labels.join(' · '),13,360);}
 }else if(figure.kind==='plot'){
  items.push(...plotDrawing(figure));
 }else if(figure.kind==='meters'){
  // Source, rheostat and ammeter are in series. V measures only the test resistor.
  const box=(x:number,y:number,w:number,h:number)=>{line(x,y,x+w,y);line(x+w,y,x+w,y+h);line(x+w,y+h,x,y+h);line(x,y+h,x,y);};
  line(32,110,55,110);box(55,98,66,24);arrow(115,73,72,130);text(88,53,'Rр',16,60,true);
  line(121,110,149,110);items.push({kind:'circle',x:167,y:110,r:18});text(167,114,'A',18,30,true);
  line(185,110,231,110);box(231,98,66,24);text(264,70,'R',17,80,true);line(297,110,358,110);
  line(215,110,215,184);line(215,184,246,184);items.push({kind:'circle',x:264,y:184,r:18});text(264,188,'V',18,30,true);line(282,184,320,184);line(320,184,320,110);
  for(const x of [215,320])items.push({kind:'circle',x,y:110,r:3,fill:ink});
  line(32,110,32,236);line(358,110,358,236);line(32,236,104,236);line(104,217,104,255,3);line(134,225,134,247,3);line(134,236,256,236);
  items.push({kind:'circle',x:259,y:236,r:3},{kind:'circle',x:300,y:236,r:3});line(262,236,297,236);line(303,236,358,236);text(279,262,'К',17,40,true);text(119,270,'Источник',13,130);text(91,213,'+',14,22);text(146,213,'−',14,22);
 }else if(figure.kind==='circuit'){
  const resistor=(x:number,y:number,r:number,label:string)=>{line(x-30,y-12,x+30,y-12);line(x+30,y-12,x+30,y+12);line(x+30,y+12,x-30,y+12);line(x-30,y+12,x-30,y-12);text(x,y-32,figure.unknown === true || Array.isArray(figure.unknown) && figure.unknown.includes(label === 'R₁' ? 0 : 1) ? `${label} = ?` : `${label} = ${fmt(r)} Ом`,16,170,true);};
  if(figure.parallel){for(const y of [84,168]){line(40,y,165,y);line(225,y,350,y);}line(40,84,40,220);line(350,84,350,220);resistor(195,84,figure.resistors[0],'R₁');resistor(195,168,figure.resistors[1],'R₂');}
  else{line(40,110,70,110);line(130,110,260,110);line(320,110,350,110);resistor(100,110,figure.resistors[0],'R₁');resistor(290,110,figure.resistors[1],'R₂');line(40,110,40,220);line(350,110,350,220);}
  line(40,220,181,220);line(209,220,350,220);line(181,203,181,237,3);line(209,209,209,231,3);text(167,249,'+',17,22);text(225,249,'−',17,22);text(195,182,figure.voltage===undefined?'Участок цепи':`U = ${fmt(figure.voltage)} В`,15,190);
 }else if(figure.kind==='rays'){
  const cx=190,cy=150,y=105,fx=cx+figure.focal*1.2,end=340,correctY=y+(end-cx)/(fx-cx)*(cy-y);
  arrow(18,cy,373,cy);arrow(cx,242,cx,44);arrow(cx,44,cx,242);arrow(20,y,cx,y,blue);line(fx,cy-6,fx,cy+6);text(fx,cy+26,'F',15,30,true);text(195,20,'Собирающая линза',15,240,true);
  const wrong=[45,105,235];let w=0;for(let k=1;k<=4;k++){const target=k===figure.correct?correctY:wrong[w++];line(cx,y,end,target,2,blue);text(359,target+1,String(k),16,30,true);}
 }else if(figure.kind==='lens'){
  const F=figure.focal,d=figure.distance,f=F*d/(d-F),scale=Math.min(160/d,145/f),cx=195,cy=160,object=40,img=object*f/d;
  arrow(20,cy,375,cy);arrow(cx,245,cx,50);arrow(cx,50,cx,245);text(cx,25,'Собирающая линза',15,220,true);
  for(const sign of [-1,1]){const x=cx+sign*F*scale;line(x,cy-5,x,cy+5);text(x,cy+25,sign===1?'F':'−F',14,50);}
  arrow(cx-d*scale,cy,cx-d*scale,cy-object,blue);text(cx-d*scale,cy-object-15,'Предмет',13,64);
  line(cx-d*scale,cy-object,cx,cy-object,1.8,blue);line(cx,cy-object,cx+f*scale,cy+img,1.8,blue);line(cx-d*scale,cy-object,cx+f*scale,cy+img,1.8,blue);arrow(cx+f*scale,cy,cx+f*scale,cy+img,blue);
  text(315,258,'Главная оптическая ось',13,150);
 }else if(figure.kind==='charges'){
  const count=figure.values.length;figure.values.forEach((v,i)=>{const x=65+i*(260/Math.max(1,count-1));items.push({kind:'circle',x,y:120,r:27});line(x,147,x,190);line(x-21,190,x+21,190);text(x,64,v,15,100,true);text(x,125,String(i+1),18,40,true);});
  text(195,235,'Изолирующие подставки',16,280);
 }else if(figure.kind==='lever'){
  const fulcrum=195,total=Math.max(figure.left,figure.right),scale=145/total,left=fulcrum-figure.left*scale,right=fulcrum+figure.right*scale;
  line(left,105,right,105,4);line(fulcrum,109,fulcrum-15,139);line(fulcrum-15,139,fulcrum+15,139);line(fulcrum+15,139,fulcrum,109);arrow(left,105,left,190,blue);arrow(right,105,right,190,blue);text(left,217,`F₁ = ${figure.force} Н`,16,100,true);text(right,217,'F₂ = ?',16,90,true);text((left+fulcrum)/2,73,`${figure.left} см`,15,120);text((right+fulcrum)/2,73,`${figure.right} см`,15,120);text(fulcrum,170,'Опора',14,90);
 }
 return {width,height,items};
}
