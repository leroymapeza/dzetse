// Difficulty ramps mainly via chainCount (how far the chain's head start
// eats into the path — the biggest factor in reaction time) and colorCount
// (how easy matches are to spot), with speed increasing more gently.
export const LEVELS = [
  {
    id: '1-1',
    chainCount: 8,
    chainSpeed: 9,
    colorCount: 3,
    turns: 1.7,
    rOuter: 300,
    rInner: 165,
    startAngle: -Math.PI * 0.5,
    night: false
  },
  {
    id: '1-2',
    chainCount: 10,
    chainSpeed: 10,
    colorCount: 3,
    turns: 1.85,
    rOuter: 300,
    rInner: 155,
    startAngle: -Math.PI * 0.5,
    night: false
  },
  {
    id: '1-3',
    chainCount: 12,
    chainSpeed: 11,
    colorCount: 3,
    turns: 2.0,
    rOuter: 300,
    rInner: 145,
    startAngle: -Math.PI * 0.5,
    night: false
  },
  {
    id: '2-1',
    chainCount: 14,
    chainSpeed: 13,
    colorCount: 3,
    turns: 2.2,
    rOuter: 300,
    rInner: 135,
    startAngle: -Math.PI * 0.5,
    night: true
  },
  {
    id: '2-2',
    chainCount: 17,
    chainSpeed: 14,
    colorCount: 4,
    turns: 2.4,
    rOuter: 305,
    rInner: 125,
    startAngle: -Math.PI * 0.5,
    night: true
  },
  {
    id: '2-3',
    chainCount: 20,
    chainSpeed: 16,
    colorCount: 4,
    turns: 2.6,
    rOuter: 310,
    rInner: 115,
    startAngle: -Math.PI * 0.5,
    night: true
  }
];

export function getLevel(index) {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}
