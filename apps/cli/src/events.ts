export type ResourceAction =
  | 'creating'
  | 'created'
  | 'destroying'
  | 'destroyed'
  | 'modifying'
  | 'modified'
  | 'refreshing'
  | 'refreshed'
  | 'importing'
  | 'imported'
  | 'reading'
  | 'read'
  | 'error';

export interface LineEvent {
  type: 'line';
  text: string;
}

export interface ResourceEvent {
  type: 'resource';
  address: string;
  action: ResourceAction;
}

export interface PlanSummaryEvent {
  type: 'plan_summary';
  adds: number;
  changes: number;
  destroys: number;
}

export interface DoneEvent {
  type: 'done';
  exitCode: number;
}

export type StreamEvent = LineEvent | ResourceEvent | PlanSummaryEvent | DoneEvent;
