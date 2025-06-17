interface AppState {
  lcid: string | null;
}

const state: AppState = {
  lcid: null,
};

export const manager = {
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
