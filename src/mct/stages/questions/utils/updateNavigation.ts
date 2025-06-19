import { MCTManager } from 'src/mct/shared/manager';

export const updateNavigation = (
  options: { nextEnabled?: boolean; prevEnabled?: boolean } = {}
) => {
  const stageComponent = MCTManager.getStage('questions') as HTMLElement;
  stageComponent.dispatchEvent(
    new CustomEvent('mct:navigation:update', {
      detail: options,
      bubbles: false,
    })
  );
};
