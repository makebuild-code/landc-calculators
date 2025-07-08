export const DOM_CONFIG = {
  attributes: {
    component: 'data-mct',
    stage: 'data-mct-stage',
    form: {
      components: 'data-mct-questions',
      group: 'data-mct-questions-group',
      question: 'data-mct-questions-question',
      dependsOn: 'data-mct-questions-depends-on',
      dependsOnValue: 'data-mct-questions-depends-on-value',
      element: 'data-mct-questions-element',
      output: 'data-mct-questions-output',
      type: 'data-mct-questions-outputs-type',
      hideOnGroup: 'data-mct-questions-hide-on-group',
      showOnGroup: 'data-mct-questions-show-on-group',
    },
    results: {
      components: 'data-mct-results',
      element: 'data-mct-results-element',
      output: 'data-mct-results-output',
      type: 'data-mct-results-output-type',
      showIfProceedable: 'data-mct-results-show-if-proceedable',
    },
    appointment: {
      components: 'data-mct-appointment',
      panel: 'data-mct-appointment-panel',
      slider: 'data-mct-appointment-slider',
      date: 'data-mct-appointment-date',
      element: 'data-mct-appointment-element',
      inputLabel: 'data-mct-appointment-input-label',
      form: 'data-mct-appointment-form',
    },
  },
  classes: {
    active: 'is-active',
    highlight: 'mct_highlight',
  },
} as const;
