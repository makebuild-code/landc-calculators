import { MCTManager } from '$mct/manager';
import type { StageIDENUM } from '$mct/types';
import { queryElement } from '$utils/dom';

export const panelToWindow = (stageId: StageIDENUM, to: 'panel' | 'window' = 'panel') => {
  const component = MCTManager.getStageDOM(stageId);
  if (!component) return;

  const toWindow = to === 'window';

  const panelBackground = queryElement('.mct_panel_background_wrapper', component);
  const stickyHeader = queryElement('.mct_sticky-header_sticky', component);
  const panelButtons = queryElement('.mct_panel_buttons', component);

  /**
   * component:
   * - background-color: var(--_mtc---surface--background);
   *
   * panelBackground:
   * - display: none;
   *
   * stickyHeader:
   * - top: 0px;
   *
   * panelButtons:
   * - bottom: 0px;
   */

  toWindow
    ? (component.style.backgroundColor = 'var(--_mtc---surface--background)')
    : component.style.removeProperty('background-color');

  if (panelBackground)
    toWindow ? (panelBackground.style.display = 'none') : panelBackground.style.removeProperty('display');

  if (stickyHeader) toWindow ? (stickyHeader.style.top = '0px') : stickyHeader.style.removeProperty('top');

  if (panelButtons) toWindow ? (panelButtons.style.bottom = '0px') : panelButtons.style.removeProperty('bottom');
};
