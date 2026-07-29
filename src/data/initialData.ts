import { CommitteeInfo, RubricCriterion, Delegate, CommitteeId } from '../types';

export const COMMITTEES: CommitteeInfo[] = [
  { id: 'UNSC', name: 'UNSC', fullName: 'United Nations Security Council' },
  { id: 'UNHRC', name: 'UNHRC', fullName: 'United Nations Human Rights Council' },
  { id: 'ILO', name: 'ILO', fullName: 'International Labour Organization' },
  { id: 'UNEP', name: 'UNEP', fullName: 'United Nations Environment Programme' },
  { id: 'DISEC', name: 'DISEC', fullName: 'Disarmament & International Security Committee' },
  { id: 'IMF', name: 'IMF', fullName: 'International Monetary Fund' },
  { id: 'UNESCO', name: 'UNESCO', fullName: 'UN Educational, Scientific & Cultural Organization' },
  { id: 'WHO', name: 'WHO', fullName: 'World Health Organization' },
  { id: 'PRESS', name: 'PRESS', fullName: 'International Press Corps' },
];

export const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'speech',
    name: 'Opening Speech & Presentation',
    maxMarks: 10,
    description: 'Clarity, confidence, structure and delivery of opening speech.'
  },
  {
    id: 'research',
    name: 'Research & Preparation',
    maxMarks: 10,
    description: 'Depth of portfolio knowledge, facts, policy accuracy, and preparation.'
  },
  {
    id: 'position_papers',
    name: 'Position Papers',
    maxMarks: 10,
    description: 'Quality, structure, formatting, policy clarity, and depth of position paper.'
  },
  {
    id: 'debate',
    name: 'Participation in Debate',
    maxMarks: 10,
    description: 'Frequency and quality of motion raises, GSL speeches, and moderated caucus speeches.'
  },
  {
    id: 'diplomacy',
    name: 'Diplomacy and Collaboration',
    maxMarks: 10,
    description: 'Negotiation, working with bloc members, resolution drafting, and tact.'
  },
  {
    id: 'rules',
    name: 'Use of Rules & Procedures',
    maxMarks: 10,
    description: 'Adherence to MUN parliamentary procedure, points, motions, and decorum.'
  },
  {
    id: 'leadership',
    name: 'Leadership & Initiative',
    maxMarks: 10,
    description: 'Leading bloc discussions, driving unmoderated caucuses, and sponsoring draft resolutions.'
  },
  {
    id: 'public_speaking',
    name: 'Public Speaking & Rhetoric',
    maxMarks: 10,
    description: 'Persuasive language, voice modulation, rhetoric, and body language.'
  },
  {
    id: 'impact',
    name: 'Overall Impact',
    maxMarks: 10,
    description: 'Overall presence, influence in committee proceedings, and memorable performance.'
  },
  {
    id: 'relevance',
    name: 'Relevance & Resolution',
    maxMarks: 10,
    description: 'Relevance of solutions, alignment with state policy, and constructive contributions.'
  },
];

// Generates initial sample delegates for each committee
export const DEFAULT_DELEGATES: Delegate[] = [
  // UNSC
  { id: 'unsc-1', slNo: 1, committeeId: 'UNSC', delegateName: 'Aarav Sharma', portfolio: 'United States' },
  { id: 'unsc-2', slNo: 2, committeeId: 'UNSC', delegateName: 'Ananya Reddy', portfolio: 'United Kingdom' },
  { id: 'unsc-3', slNo: 3, committeeId: 'UNSC', delegateName: 'Rohan Verma', portfolio: 'France' },
  { id: 'unsc-4', slNo: 4, committeeId: 'UNSC', delegateName: 'Diya Patel', portfolio: 'China' },
  { id: 'unsc-5', slNo: 5, committeeId: 'UNSC', delegateName: 'Vikram Singh', portfolio: 'Russian Federation' },
  { id: 'unsc-6', slNo: 6, committeeId: 'UNSC', delegateName: 'Kavya Nair', portfolio: 'India' },

  // UNHRC
  { id: 'unhrc-1', slNo: 1, committeeId: 'UNHRC', delegateName: 'Ishaan Malhotra', portfolio: 'Norway' },
  { id: 'unhrc-2', slNo: 2, committeeId: 'UNHRC', delegateName: 'Tanvi Sen', portfolio: 'Sweden' },
  { id: 'unhrc-3', slNo: 3, committeeId: 'UNHRC', delegateName: 'Pranav Das', portfolio: 'Canada' },
  { id: 'unhrc-4', slNo: 4, committeeId: 'UNHRC', delegateName: 'Shreya Roy', portfolio: 'Germany' },

  // ILO
  { id: 'ilo-1', slNo: 1, committeeId: 'ILO', delegateName: 'Harsh Vardhan', portfolio: 'United States' },
  { id: 'ilo-2', slNo: 2, committeeId: 'ILO', delegateName: 'Bhavna Dave', portfolio: 'Germany' },
  { id: 'ilo-3', slNo: 3, committeeId: 'ILO', delegateName: 'Gautam Nambiar', portfolio: 'Japan' },

  // UNEP
  { id: 'unep-1', slNo: 1, committeeId: 'UNEP', delegateName: 'Nisha Sundaram', portfolio: 'New Zealand' },
  { id: 'unep-2', slNo: 2, committeeId: 'UNEP', delegateName: 'Kunal Kapoor', portfolio: 'Costa Rica' },
  { id: 'unep-3', slNo: 3, committeeId: 'UNEP', delegateName: 'Priya Nanda', portfolio: 'Denmark' },

  // DISEC
  { id: 'disec-1', slNo: 1, committeeId: 'DISEC', delegateName: 'Devansh Ahuja', portfolio: 'United States' },
  { id: 'disec-2', slNo: 2, committeeId: 'DISEC', delegateName: 'Isha Trivedi', portfolio: 'Russian Federation' },
  { id: 'disec-3', slNo: 3, committeeId: 'DISEC', delegateName: 'Yashwardhan', portfolio: 'China' },

  // IMF
  { id: 'imf-1', slNo: 1, committeeId: 'IMF', delegateName: 'Sanjana Thakur', portfolio: 'Japan' },
  { id: 'imf-2', slNo: 2, committeeId: 'IMF', delegateName: 'Chaitanya R', portfolio: 'Germany' },

  // UNESCO
  { id: 'unesco-1', slNo: 1, committeeId: 'UNESCO', delegateName: 'Aishwarya M', portfolio: 'Egypt' },
  { id: 'unesco-2', slNo: 2, committeeId: 'UNESCO', delegateName: 'Ritesh Biswas', portfolio: 'Greece' },

  // WHO
  { id: 'who-1', slNo: 1, committeeId: 'WHO', delegateName: 'Suhani Dixit', portfolio: 'Switzerland' },
  { id: 'who-2', slNo: 2, committeeId: 'WHO', delegateName: 'Abhinav Sen', portfolio: 'Singapore' },

  // PRESS
  { id: 'press-1', slNo: 1, committeeId: 'PRESS', delegateName: 'Kabir Mehta', portfolio: 'BBC World News' },
  { id: 'press-2', slNo: 2, committeeId: 'PRESS', delegateName: 'Anika Roy', portfolio: 'Reuters' },
];

// Helper to generate default judge PINs
export const DEFAULT_JUDGE_PINS: Record<string, string> = {
  // 1. UNSC (PIN Prefix: 111)
  'UNSC-1': '1111',
  'UNSC-2': '1112',
  'UNSC-3': '1113',

  // 2. UNHRC (PIN Prefix: 222)
  'UNHRC-1': '2221',
  'UNHRC-2': '2222',
  'UNHRC-3': '2223',

  // 3. ILO (PIN Prefix: 333)
  'ILO-1': '3331',
  'ILO-2': '3332',
  'ILO-3': '3333',

  // 4. UNEP (PIN Prefix: 444)
  'UNEP-1': '4441',
  'UNEP-2': '4442',
  'UNEP-3': '4443',

  // 5. DISEC (PIN Prefix: 555)
  'DISEC-1': '5551',
  'DISEC-2': '5552',
  'DISEC-3': '5553',

  // 6. IMF (PIN Prefix: 666)
  'IMF-1': '6661',
  'IMF-2': '6662',
  'IMF-3': '6663',

  // 7. UNESCO (PIN Prefix: 777)
  'UNESCO-1': '7771',
  'UNESCO-2': '7772',
  'UNESCO-3': '7773',

  // 8. WHO (PIN Prefix: 888)
  'WHO-1': '8881',
  'WHO-2': '8882',
  'WHO-3': '8883',

  // 9. PRESS (PIN Prefix: 999)
  'PRESS-1': '9991',
  'PRESS-2': '9992',
  'PRESS-3': '9993',
};

export const DEFAULT_ADMIN_PIN = 'admin123';
