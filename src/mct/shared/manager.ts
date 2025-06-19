import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { initQuestions } from '../stages/questions';
import { generateLCID } from './api/generateLCID';
import { mctAttr } from './constants';
import type { StageName } from './types';

interface Stage {
  id: StageName;
  show: () => void;
  hide: () => void;
  init: () => void;
}

const stages: Record<string, Stage> = {};

interface DOM {
  mctComponent: HTMLElement | null;
  stages: Partial<Record<StageName, HTMLElement>>;
}

const dom: DOM = {
  mctComponent: null,
  stages: {},
};

interface AppState {
  lcid: string | null;
  currentStageId: string | null;
}

const state: AppState = {
  lcid: null,
  currentStageId: null,
};

export const MCTManager = {
  initDOM(): DOM {
    dom.mctComponent = queryElement(`[${mctAttr.mct}="component"]`) as HTMLElement;
    if (!dom.mctComponent) throw new Error('MCT component not found');

    const stageElements = queryElements(`[${mctAttr.stage}]`, dom.mctComponent);
    stageElements.forEach((stage) => {
      const name = stage.getAttribute(mctAttr.stage);
      if (name) dom.stages[name as StageName] = stage as HTMLElement;
    });

    return dom;
  },

  getComponent() {
    if (!dom.mctComponent) throw new Error('MCT component not initialised');
    return dom.mctComponent;
  },

  getStage(name: StageName) {
    if (!dom.stages) throw new Error('Stages not initialised');
    const stage = dom.stages[name];
    if (!stage) throw new Error(`Stage '${name}' not found`);
    return dom.stages[name];
  },

  async preInit() {
    try {
      const lcid = await generateLCID();
      this.setLCID(lcid);
    } catch {
      console.error('Failed to generate LCID');
    }
  },

  route() {
    const mainQuestions = this.getStage('questions') as HTMLElement;
    initQuestions(mainQuestions, {
      mode: 'main',
      prefill: false,
    });
  },

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

    /**
     * @todo:
     * - Store LCID in Local Storage
     * - Store LCID in cookie
     */
  },

  getLCID(): string | null {
    return state.lcid;
  },

  getState() {
    return { ...state };
  },
};
