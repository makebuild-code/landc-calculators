import { DOM_CONFIG } from '$mct/config';
import { GroupNameENUM } from '$mct/types';
import { debugLog } from '$utils/debug';
import { queryElement, queryElements } from '$utils/dom';
import { MainGroup, type GroupOptions } from '../form/Groups';
import { FormManager } from '../form/Manager_Base';

const sidebarAttr = DOM_CONFIG.attributes.sidebar;
const questionAttr = DOM_CONFIG.attributes.form;

export class Sidebar extends FormManager {
  private list: HTMLElement;
  private updateButton: HTMLButtonElement;
  private closeButtons: HTMLButtonElement[];

  constructor(component: HTMLElement) {
    super(component);

    this.list = queryElement(`[${questionAttr.components}="list"]`, component) as HTMLElement;
    this.updateButton = queryElement(`[${sidebarAttr.components}="update"]`, component) as HTMLButtonElement;
    this.closeButtons = queryElements(`[${sidebarAttr.components}="close"]`, component) as HTMLButtonElement[];
  }

  public init(): void {
    const groupElements = queryElements(`[${questionAttr.group}]`, this.list) as HTMLElement[];
    groupElements.forEach((groupEl, index) => {
      const name = groupEl.getAttribute(questionAttr.group) as GroupNameENUM;
      if (!name) return;

      const options: GroupOptions = {
        component: groupEl,
        formManager: this,
        index,
      };

      const group = name !== GroupNameENUM.Output ? new MainGroup(options) : null;
      if (group) {
        index === 0 ? group.show() : group.hide();
        this.groups.push(group);
      }
    });

    this.bindEvents();
  }

  public show(): void {
    this.component.style.removeProperty('display');
  }

  public hide(): void {
    this.component.style.display = 'none';
  }

  private bindEvents(): void {
    this.updateButton.addEventListener('click', () => {
      this.update();
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.close());
    });
  }

  private update(): void {
    debugLog('update');
  }

  private close(): void {
    this.hide();
  }
}
