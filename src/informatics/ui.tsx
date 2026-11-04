import React from'react';
import{router}from'expo-router';
import{Pressable,Text,View}from'react-native';
import{Button,Screen,type}from'../components';
import{s}from'../subject-ui';
import{colors}from'../theme';
import{informaticsCourse}from'./courses';
import{useInformatics}from'./provider';
export const informaticsRoute=(number=1)=>({pathname:'/subject-module' as const,params:{subject:'informatics',exam:'oge',number:String(number)}});
export function InformaticsBack({number=1,title='К модулю'}:{number?:number;title?:string}){return<Pressable accessibilityRole="button" accessibilityLabel={title} onPress={()=>router.dismissTo(informaticsRoute(number))} style={({pressed})=>[{minHeight:48,justifyContent:'center',paddingVertical:10,marginBottom:10},pressed&&s.pressed]}><Text style={s.link}>‹ {title}</Text></Pressable>;}
export function InformaticsGate(){const{loadError,retryLoad}=useInformatics();return<Screen><Text style={type.title}>{loadError?'Не удалось загрузить информатику':'Загружаем тренировку…'}</Text><Text style={s.body}>{loadError?'Сохранённые данные не будут заменены пустыми. Повтори загрузку.':'Восстанавливаем место остановки.'}</Text>{loadError&&<Button title="Повторить загрузку информатики" onPress={retryLoad}/>}<Button secondary title="К предметам" onPress={()=>router.dismissTo('/subjects')}/></Screen>;}
export function InformaticsSaveNotice(){const{saveError,retrySave}=useInformatics();return saveError?<View accessibilityLiveRegion="polite" style={[s.notice,{backgroundColor:colors.amber}]}><Text style={s.body}>Информатика пока не сохранилась. Повтори сохранение перед выходом.</Text><Button title="Сохранить информатику ещё раз" onPress={retrySave}/></View>:null;}
export function InformaticsResume(){const{state,ready}=useInformatics(),course=informaticsCourse(state.active?.course);return ready&&state.active&&course?<Pressable accessibilityRole="button" accessibilityLabel={`Продолжить информатику №${course.number}`} onPress={()=>router.push('/informatics-practice')} style={({pressed})=>[s.card,pressed&&s.pressed]}><Text style={s.title}>Продолжить информатику №{course.number} →</Text><Text style={s.body}>{state.active.phase==='view'?'Карточки с разбором':state.active.phase==='result'?'Итог сохранённой подборки':'Самостоятельная тренировка'} · место остановки сохранено</Text></Pressable>:null;}
