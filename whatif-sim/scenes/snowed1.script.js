// Snowed in, Part 1 "The last exit".
export default {
  tts: 'directed',
  voice: 'en-US-AndrewNeural',
  rate: '-3%',
  pitch: '-5Hz',
  lines: [
    { id: 'hook', role: 'hook', rate: '-6%', pitch: '-8Hz', beat: 0.34, space: 'room', text: 'The highway stopped 3 hours ago. Your tank is *a quarter full.*', say: 'The highway stopped three hours ago. Your tank is a quarter full.', pause: 0.3 },
    { id: 'drive', role: 'setup', link: 'also', rate: '-3%', beat: 0.3, space: 'street', text: "6:40 PM. You're driving home. It starts to *snow.*", say: "Six forty P M. You're driving home. It starts to snow." },
    { id: 'brake', role: 'turn', link: 'aber', rate: '-6%', pitch: '-7Hz', beat: 0.36, space: 'street', text: 'Then the brake lights. All of them. For *miles.*', pause: 0.5 },
    { id: 'stat', role: 'escalation', link: 'denn', rate: '-2%', space: 'street', text: 'One winter storm in Germany froze *84 kilometers* of highway.', say: 'One winter storm in Germany froze eighty-four kilometers of highway.' },
    { id: 'night', role: 'escalation', link: 'deshalb', rate: '-5%', beat: 0.34, space: 'room', text: '9:40 PM. Nobody moves. Outside: *minus 12.*', say: 'Nine forty P M. Nobody moves. Outside: minus twelve.' },
    { id: 'plows', role: 'escalation', link: 'denn', rate: '-3%', space: 'room', text: "The plows can't reach you. Stuck cars block the way." },
    { id: 'walk', role: 'escalation', link: 'deshalb', rate: '-5%', beat: 0.34, space: 'street', text: 'You think about walking. Then you open the door. You *cannot see.*', pause: 0.5 },
    { id: 'rule1', role: 'answer', link: 'denn', rate: '-4%', beat: 0.3, space: 'street', text: '*Rule one:* stay with your car. In a whiteout, people lose their way fast.' },
    { id: 'beside', role: 'turn', link: 'aber', rate: '-8%', pitch: '-8Hz', beat: 0.42, space: 'room', text: '11:15 PM. The car next to you sputters.', say: 'Eleven fifteen P M. The car next to you sputters.', pause: 0.8 },
    { id: 'dark', role: 'peak', link: 'also', rate: '-14%', pitch: '-10Hz', gain: -2, space: 'street', text: 'Its lights go *out.*', pause: 1.0 },
    { id: 'empty', role: 'consequence', link: 'deshalb', rate: '-4%', beat: 0.34, space: 'room', text: 'No fuel. No heat. And you look at your own gauge.', pause: 0.5 },
    { id: 'hours', role: 'payoff', link: 'doch', rate: '-5%', pitch: '-7Hz', space: 'room', text: 'Eight more hours of *night.*', pause: 0.6 },
    { id: 'choice', role: 'consequence', link: 'doch', rate: '-6%', pitch: '-7Hz', beat: 0.46, space: 'room', text: 'Stay warm now. Or save fuel for *later.*', pause: 0.7 },
    { id: 'ask', role: 'cliffhanger', link: 'doch', rate: '-14%', pitch: '-10Hz', gain: -2, space: 'room', text: 'Engine *on or off?*' },
  ],
};
