export type CommitteeId = 'UNSC' | 'UNHRC' | 'ILO' | 'UNEP' | 'DISEC' | 'IMF' | 'UNESCO' | 'WHO' | 'PRESS' | string;

export interface CommitteeInfo {
  id: CommitteeId;
  name: string;
  fullName: string;
  iconName?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxMarks: number;
  description: string;
}

export interface Delegate {
  id: string;
  slNo: number;
  committeeId: CommitteeId;
  delegateName: string;
  portfolio: string; // e.g. "USA", "India", "BBC News"
}

// Map key: delegateId_judgeIndex (e.g. "del_1_1" for delegate 1 judged by judge 1)
export interface RubricScore {
  delegateId: string;
  committeeId: CommitteeId;
  judgeIndex: 1 | 2 | 3; // 1, 2, or 3
  criteriaScores: Record<string, number>; // criterionId -> score (0-10)
  totalMarks: number;
  comments?: string;
  isLocked?: boolean;
  updatedAt: string;
}

export interface JudgeAccount {
  committeeId: CommitteeId;
  judgeIndex: 1 | 2 | 3;
  judgeName: string;
  pin: string;
}

export interface AdminAccount {
  pin: string;
}

export type UserRole = 'judge' | 'admin' | 'masteradmin' | 'guest';

export interface UserSession {
  role: UserRole;
  committeeId?: CommitteeId;
  judgeIndex?: 1 | 2 | 3;
  judgeName?: string;
  token?: string;
}

export interface JudgePortalSchedule {
  isEnabled: boolean;
  startTime?: string | null;
  endTime?: string | null;
  message?: string;
}

export interface AggregatedDelegateScore {
  delegate: Delegate;
  j1Score: RubricScore | null;
  j2Score: RubricScore | null;
  j3Score: RubricScore | null;
  j1Total: number;
  j2Total: number;
  j3Total: number;
  completedJudgesCount: number;
  averageScore: number;
  overallTotal: number;
  rank?: number;
}
