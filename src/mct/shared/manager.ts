import type { StageName } from './types';

interface Stage {
  id: StageName;
  show: () => void;
  hide: () => void;
  init: () => void;
}

interface AppState {
  lcid: string | null;
  currentStageId: string | null;
}

const state: AppState = {
  lcid: null,
  currentStageId: null,
};

const stages: Record<string, Stage> = {};

export const MCTManager = {
  registerStage(stage: Stage) {
    stages[stage.id] = stage;
  },

  goToStage(stageId: string) {
    if (state.currentStageId && stages[state.currentStageId]) {
      stages[state.currentStageId].hide();
    }
    state.currentStageId = stageId;
    if (stages[stageId]) {
      stages[stageId].init?.();
      stages[stageId].show();
    }
  },

  setLCID(lcid: string) {
    state.lcid = lcid;
  },

  getLCID(): string | null {
    return state.lcid;
  },

  getState() {
    return { ...state };
  },
};
