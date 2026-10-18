import React from 'react';
import { Text, View } from 'react-native';
import { ProblemFigure } from '../problem-figure';
import { GeometryFigure } from '../geometry-figure';
import { GraphFigure } from '../extended/figure';
import { extendedTask } from '../extended/bank';
import { getHintSteps } from '../hints';
import { cardPalette, colors } from '../theme';
import { resolveExam, type ExamRef } from './exam';
import { MathLine, studyStyles as s } from './ui';
export function ExamPrompt({ task }: { task: ExamRef }) {
  const extended = task.moduleId === 'extended' ? extendedTask(task.problemId) : undefined, problem = extended ? undefined : resolveExam(task);
  return <View style={[s.card, { backgroundColor: cardPalette[extended?.colorIndex ?? problem?.colorIndex ?? 0], padding: 16 }]}>
    {extended?.fractionDisplay ? <><Text style={s.title}>Решите {extended.fractionDisplay.inequality ? 'неравенство' : 'уравнение'}.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 16 }}><View style={{ alignItems: 'center', maxWidth: '100%' }}><Text style={{ fontSize: 19, color: colors.ink, paddingBottom: 4 }}>{extended.fractionDisplay.top}</Text><View style={{ height: 1.5, backgroundColor: colors.ink, alignSelf: 'stretch' }} /><Text style={{ fontSize: 19, color: colors.ink, paddingTop: 4 }}>{extended.fractionDisplay.bottom}</Text></View><Text style={s.title}>{extended.fractionDisplay.tail}</Text></View></> : <MathLine size={18} bold value={extended?.condition ?? problem?.expression ?? ''} />}
    {extended?.scene && <GeometryFigure figure={{ kind: 'grid-scene', scene: extended.scene, caption: 'Чертёж к условию' }} />}
    {problem && <ProblemFigure problem={problem} />}
  </View>;
}
export function ExamSolution({ task }: { task: ExamRef }) {
  const extended = task.moduleId === 'extended' ? extendedTask(task.problemId) : undefined, problem = extended ? undefined : resolveExam(task);
  return <View style={s.card}>
    <Text style={s.title}>Разбор задания {task.number}</Text>
    {extended ? <>
      {extended.graph && <GraphFigure graph={extended.graph} />}
      {extended.steps.map((step, i) => <View key={i} style={{ marginTop: 17 }}><Text style={[s.title, { fontSize: 17 }]}>{i + 1}. {step.title}</Text><Text selectable style={s.body}>{step.text}</Text></View>)}
      <Text selectable style={[s.title, { marginTop: 16 }]}>Итог: {extended.answer}</Text><Text style={s.small}>{extended.pitfall}</Text>
    </> : problem && <><Text selectable style={s.body}>{getHintSteps(problem, task.moduleId as Exclude<ExamRef['moduleId'], 'extended'>, task.group).solution}</Text></>}
  </View>;
}
