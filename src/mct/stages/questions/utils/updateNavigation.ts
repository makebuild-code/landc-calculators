import { getStage } from 'src/mct/shared/dom';

export const updateNavigation = (
  options: { nextEnabled?: boolean; prevEnabled?: boolean } = {}
) => {
  const stageComponent = getStage('questions');
  stageComponent.dispatchEvent(
    new CustomEvent('mct:navigation:update', {
      detail: options,
      bubbles: false,
    })
  );
};
