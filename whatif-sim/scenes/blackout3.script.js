// Part 3 "Floor 9". Der Einstieg haengt von der Abstimmung in Part 2 ab: VOTE = 'tell' oder 'quiet'.
export const VOTE = 'tell';

const open = {
  tell: { id: 'hook', role: 'hook', rate: '-7%', pitch: '-8Hz', beat: 0.34, text: "You told them. Now 40 people want *Marek's water.*", say: "You told them. Now forty people want Marek's water.", pause: 0.25, space: 'stairs' },
  quiet: { id: 'hook', role: 'hook', rate: '-7%', pitch: '-8Hz', beat: 0.34, text: 'You said nothing. They *followed you* anyway.', pause: 0.25, space: 'stairs' },
};

export default {
  tts: 'directed',
  voice: 'en-US-AndrewNeural',
  rate: '-3%',
  pitch: '-5Hz',
  lines: [
    open[VOTE],
    { id: 'bolt', role: 'setup', link: 'also', rate: '-4%', beat: 0.3, space: 'stairs', text: 'Day 3. Marek bolts his door. The last tap is *gone.*', say: 'Day three. Marek bolts his door. The last tap is gone.' },
    { id: 'water', role: 'setup', link: 'deshalb', rate: '-5%', beat: 0.34, space: 'room', text: 'You have 11 liters left. Your flashlight just *died.*', say: 'You have eleven liters left. Your flashlight just died.' },
    { id: 'candles', role: 'escalation', link: 'also', rate: '-4%', space: 'room', text: 'So tonight, every floor burns *candles.*' },
    { id: 'warn', role: 'escalation', link: 'aber', rate: '-3%', space: 'room', text: 'Firefighters warn against *exactly that.*', pause: 0.7 },
    { id: 'smell', role: 'turn', link: 'aber', rate: '-7%', pitch: '-8Hz', beat: 0.42, space: 'room', text: '7:52 PM. Helen lifts her head. She smells it *first.*', say: 'Seven fifty-two P M. Helen lifts her head. She smells it first.', pause: 0.8 },
    { id: 'smoke', role: 'peak', link: 'also', rate: '-24%', pitch: '-12Hz', gain: -3, space: 'room', text: '*Smoke.*', pause: 0.9 },
    { id: 'crack', role: 'escalation', link: 'deshalb', rate: '-6%', pitch: '-7Hz', beat: 0.34, space: 'hall', text: 'You open your door one inch. The stairwell is *gray.*' },
    { id: 'floor9', role: 'escalation', link: 'denn', rate: '-3%', beat: 0.34, space: 'hall', text: 'It started on floor 9. One candle. *Five floors* below you.', say: 'It started on floor nine. One candle. Five floors below you.' },
    { id: 'dial', role: 'escalation', link: 'deshalb', rate: '-2%', beat: 0.34, space: 'room', text: 'You dial for help. *No network.*' },
    { id: 'hose', role: 'answer', link: 'denn', rate: '-3%', space: 'room', text: 'And without pumps, fire hoses can run *short on pressure* up here.' },
    { id: 'look', role: 'twist', link: 'aber', rate: '-6%', pitch: '-7Hz', beat: 0.42, space: 'room', text: "Then you look at Helen. She's 81. She *can't* do stairs.", say: "Then you look at Helen. She's eighty-one. She can't do stairs.", pause: 0.7 },
    { id: 'alone', role: 'payoff', link: 'also', rate: '-8%', pitch: '-8Hz', beat: 0.5, space: 'room', text: 'Alone, you might make it. *She knows.*', pause: 0.9 },
    { id: 'go', role: 'twist', link: 'doch', rate: '-16%', pitch: '-10Hz', gain: -3, space: 'room', text: 'She says: *"Go."*', say: 'She says: Go.', pause: 1.0 },
    { id: 'choice', role: 'consequence', link: 'doch', rate: '-6%', pitch: '-7Hz', beat: 0.46, space: 'room', text: 'Run through the smoke. Or shut the door, and *stay.*', pause: 0.8 },
    { id: 'ask', role: 'cliffhanger', link: 'doch', rate: '-16%', pitch: '-10Hz', gain: -2, space: 'room', text: 'What would *you* do?' },
  ],
};
