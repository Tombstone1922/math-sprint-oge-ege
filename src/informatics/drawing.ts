import type { InfoGraph } from './model.ts';
import type { VectorDrawing, VectorInk } from '../vector-drawing.ts';
export function informaticsDrawing(g:InfoGraph):VectorDrawing{
 const points=g.directed?[[30,140],[110,55],[110,140],[110,225],[230,70],[230,210],[305,140],[365,140]]:[[40,140],[130,55],[130,225],[250,55],[250,225],[350,140]];
 const items:VectorInk[]=[],ink='#20334B',blue='#3565E8';
 const line=(x1:number,y1:number,x2:number,y2:number,weight=1.7,stroke=ink)=>items.push({kind:'line',x1,y1,x2,y2,weight,stroke});
 for(const e of g.edges){const[a,b]=[points[e.from],points[e.to]],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x1=a[0]+dx/length*15,y1=a[1]+dy/length*15,x2=b[0]-dx/length*15,y2=b[1]-dy/length*15;
  line(x1,y1,x2,y2,1.8,g.directed?blue:ink);
  if(g.directed){const angle=Math.atan2(dy,dx);for(const s of[-1,1])line(x2,y2,x2-8*Math.cos(angle+s*.45),y2-8*Math.sin(angle+s*.45),1.8,blue);}
  if(e.weight!==undefined)items.push({kind:'text',x:(a[0]+b[0])/2-dy/length*13,y:(a[1]+b[1])/2+dx/length*13+3,value:String(e.weight),size:14,width:38,color:ink,bold:true});
 }
 g.labels.forEach((label,i)=>{const[x,y]=points[i];items.push({kind:'circle',x,y,r:14},{kind:'text',x,y:y+3,value:label,size:16,width:28,color:ink,bold:true});});
 return{width:390,height:280,items};
}
