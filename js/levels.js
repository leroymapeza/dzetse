// Difficulty ramps mainly via chainCount (how far the chain's head start
// eats into the path — the biggest factor in reaction time) and colorCount
// (how easy matches are to spot), with speed increasing more gently.
export const LEVELS = [
  { id: '1-1', chainCount: 8,  chainSpeed: 9,  colorCount: 3, turns: 1.70, rOuter: 300, rInner: 165, startAngle: -Math.PI * 0.5, night: false },
  { id: '1-2', chainCount: 10, chainSpeed: 10, colorCount: 3, turns: 1.85, rOuter: 300, rInner: 155, startAngle: -Math.PI * 0.5, night: false },
  { id: '1-3', chainCount: 12, chainSpeed: 11, colorCount: 3, turns: 2.00, rOuter: 300, rInner: 145, startAngle: -Math.PI * 0.5, night: false },
  { id: '2-1', chainCount: 14, chainSpeed: 13, colorCount: 3, turns: 2.20, rOuter: 300, rInner: 135, startAngle: -Math.PI * 0.5, night: true },
  { id: '2-2', chainCount: 17, chainSpeed: 14, colorCount: 4, turns: 2.40, rOuter: 305, rInner: 125, startAngle: -Math.PI * 0.5, night: true },
  { id: '2-3', chainCount: 20, chainSpeed: 16, colorCount: 4, turns: 2.60, rOuter: 310, rInner: 115, startAngle: -Math.PI * 0.5, night: true },
  { id: '3-1', chainCount: 23, chainSpeed: 17, colorCount: 4, turns: 2.80, rOuter: 312, rInner: 105, startAngle: -Math.PI * 0.5, night: false },
  { id: '3-2', chainCount: 26, chainSpeed: 18, colorCount: 5, turns: 3.00, rOuter: 315, rInner: 98,  startAngle: -Math.PI * 0.5, night: false },
  { id: '3-3', chainCount: 29, chainSpeed: 19, colorCount: 5, turns: 3.15, rOuter: 318, rInner: 90,  startAngle: -Math.PI * 0.5, night: false },
  { id: '4-1', chainCount: 32, chainSpeed: 21, colorCount: 5, turns: 3.30, rOuter: 320, rInner: 82,  startAngle: -Math.PI * 0.5, night: true },
  { id: '4-2', chainCount: 35, chainSpeed: 22, colorCount: 5, turns: 3.45, rOuter: 322, rInner: 76,  startAngle: -Math.PI * 0.5, night: true },
  { id: '4-3', chainCount: 38, chainSpeed: 24, colorCount: 6, turns: 3.60, rOuter: 325, rInner: 70,  startAngle: -Math.PI * 0.5, night: true }
];

export function getLevel(index) {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}
