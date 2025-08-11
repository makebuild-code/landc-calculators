import { MCTManager } from '$mct/manager';
import type { StageIDENUM } from '$mct/types';
import { queryElement } from '$utils/dom';
import { getCurrentBreakpoint } from '$utils/environment/getCurrentBreakpoint';

export const panelToWindow = (stageId: StageIDENUM, to: 'panel' | 'window' = 'panel'): void => {
  const component = MCTManager.getStageDOM(stageId);
  if (!component) return;

  const toWindow = to === 'window' && getCurrentBreakpoint() === 'desktop';

  const panelBackground = queryElement('.mct_panel_background_wrapper', component);
  const header = queryElement('.mct_panel_header', component);
  const stickyHeader = queryElement('.mct_sticky-header_sticky', component);
  const panelButtons = queryElement('.mct_panel_buttons', component);

  toWindow
    ? (component.style.backgroundColor = 'var(--_mct-themes---surface--background)')
    : component.style.removeProperty('background-color');
  if (panelBackground)
    toWindow ? (panelBackground.style.display = 'none') : panelBackground.style.removeProperty('display');
  if (header) toWindow ? (header.style.paddingTop = '0px') : header.style.removeProperty('padding-top');
  if (stickyHeader) toWindow ? (stickyHeader.style.top = '0px') : stickyHeader.style.removeProperty('top');
  if (panelButtons) toWindow ? (panelButtons.style.bottom = '0px') : panelButtons.style.removeProperty('bottom');
};
