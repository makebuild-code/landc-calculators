import { queryElement, queryElements } from "$utils/dom"
import { mortgageAppointmentSlotsAPI } from "$mct/api"
import type { CreateLeadAndBookingRequest, EnquiryData } from "$mct/types"
import { createLeadAndBookingAPI } from "$mct/api"
import { lcidAPI } from '$mct/api';
import { debugError, debugLog } from "$utils/debug"
import { APIError } from "$mct/api"
import type { Booking, EnquiryForm } from "$mct/types"
import { StateManager } from "$mct/state"
import { formatDateForAPI, fmtTime, makeDateBtn } from "./utils/dates";
import { checkProceedableFromQuery } from "./utils/queryParams";

let DOM_CONFIG = {
  elements: {
    wrap: 'wrap',
    logo: 'partner-logo',
    product: 'product-info',
    dateBlock: 'date',
    dateList: 'date-list',
    timeBlock: 'time',
    timeList: 'time-list',
    formBlock: 'information',
    form: 'form',
    next: 'next',
    prev: 'back',
    submit: 'submit'
  }
}

const stateManager = new StateManager()

type DraftRequest = Partial<Omit<CreateLeadAndBookingRequest, 'booking' | 'enquiry'>> & {
  booking?: Partial<Booking>;
  enquiry?: Partial<EnquiryForm>;
};


export class partnerBookingWidget {
  TEXT_FIELDS = [
    'FirstName',
    'Surname',
    'Email',
    'Mobile',
    'VulnerableMessage',
  ] satisfies (keyof EnquiryForm)[];

  MARKETING_FIELDS = [
    'IsEmailMarketingPermitted',
    'IsPhoneMarketingPermitted',
    'IsSMSMarketingPermitted',
    'IsPostMarketingPermitted',
    'IsSocialMessageMarketingPermitted',
  ] satisfies (keyof EnquiryForm)[];

  private draft: DraftRequest;

  constructor() {
    this.draft = {};
    this.initState();
    const { ok } = checkProceedableFromQuery();
    if (!ok) {
      console.log('non proceedable');
      let noneProceedable = queryElement('[data-partner-element="none-proceed"]')
      if (!noneProceedable) return
      noneProceedable.removeAttribute('data-mct-initial')
      return
    }
    console.log('proceedable');
    let date = queryElement('[data-partner-element="date"]')
    date!.removeAttribute('data-mct-initial')
    this.initForm()
    this.initICID();
    this.initLCID();
    this.getDates()
    this.setupNavButtons()
    this.notesEventListener()
  }


  initState() {
    stateManager.subscribe((event) => {
      debugLog('🔄 State changed via new manager:', {
        changes: event.changes,
        timestamp: new Date().toISOString(),
      });

      this.updateAppointmentTag(stateManager.getState().booking || undefined);
    });
    stateManager.loadFromPersistence();
    stateManager.enableAutoPersistence();
    this.stripUrl()
    this.updateAppointmentTag(stateManager.getState().booking || undefined);
    console.log(stateManager.getState());
  }

  async initForm() {
    let form = queryElement('[data-partner-element="information"]')
    form?.addEventListener('submit', async (e) => {
      console.log('submitted');
      await this.handleFormSubmission()
      e.preventDefault();
    })
  }

  stripUrl() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get(target, prop, receiver) {
        if (typeof prop !== "string" || prop in target) {
          const v = Reflect.get(target, prop, receiver);
          return typeof v === "function" ? v.bind(target) : v;
        }
        return target.get(prop);
      }
    });

    for (const [name, value] of params) {
      this.draft.enquiry ??= {};
      (this.draft.enquiry as Partial<EnquiryData>)[name as keyof EnquiryData] = value as any;
    }

  }

  private readICIDFromQuery(): string | null {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get('icid') ?? sp.get('ICID');
    return v?.trim() ? v.trim() : null;
  }

  private readICIDFromBody(): string | null {
    // prefer data-icid, fall back to a plain icid attribute
    const v = document.body.dataset.icid ?? document.body.getAttribute('icid');
    return v?.trim() ? v.trim() : null;
  }

  async getDateSlots() {
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() + 1)
    const to = new Date(from)
    to.setDate(to.getDate() + 14)
    const fromDate = formatDateForAPI(from)
    const toDate = formatDateForAPI(to)
    const response = await mortgageAppointmentSlotsAPI.getSlots(fromDate, toDate);
    return response
  }

  setTimeSlots(day: { slots: { startTime: string; endTime: string; enabled: boolean; capacity?: number }[] }) {
    const list = queryElement(`[data-partner-element="${DOM_CONFIG.elements.timeList}"]`)
    if (!list) return
    const tpl = list.querySelector('.mct_pill_field') as HTMLElement
    const base = tpl.cloneNode(true) as HTMLElement
    list.innerHTML = ''
    for (const s of day.slots ?? []) {
      const el = base.cloneNode(true) as HTMLElement
      const input = el.querySelector('.mct_pill_input') as HTMLInputElement
      const label = el.querySelector('.mct_pill_label') as HTMLLabelElement
      const txt = `${fmtTime(s.startTime)} - ${fmtTime(s.endTime)}`
      label.textContent = txt
      input.value = txt
      input.disabled = !s.enabled || (typeof s.capacity === 'number' && s.capacity <= 0)
      list.appendChild(el)
      el.addEventListener('click', () => {

        this.draft.booking = {
          ...(this.draft.booking ?? {}),
          bookingStart: s.startTime,
          bookingEnd: s.endTime,
        };

        stateManager.set(
          'booking',
          this.toBooking(
            { bookingStart: s.startTime, bookingEnd: s.endTime },
            () => stateManager.getState().booking || undefined
          )
        );
        console.log('booking (after date pick)', stateManager.getState().booking);
        console.log('draft (after date pick)', this.draft);
      })
    }
  }

  private readEnquiryFormFromDOM(): Partial<EnquiryForm> {
    const root = queryElement(`[data-partner-element="${DOM_CONFIG.elements.form}"]`);
    if (!root) return {};

    const getVal = (name: string) =>
      (root.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null)?.value?.trim();

    const getRadio = (name: string) =>
      (root.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value;

    const getCheckbox = (name: string) =>
      !!(root.querySelector(`[name="${name}"]`) as HTMLInputElement | null)?.checked;

    const form: Partial<EnquiryForm> = {};

    // Text inputs / textarea
    for (const key of this.TEXT_FIELDS) {
      const v = getVal(key);
      if (v !== undefined) (form as any)[key] = v;
    }

    // Vulnerable radio: "Yes" | "No"
    const vuln = getRadio('Vulnerable');
    if (vuln === 'Yes' || vuln === 'No') form.Vulnerable = vuln;

    // Marketing checkboxes → booleans
    for (const key of this.MARKETING_FIELDS) {
      const el = root.querySelector(`[name="${key}"]`);
      if (el) (form as any)[key] = getCheckbox(key);
    }

    return form;
  }

  private validateForm(e: Partial<EnquiryForm>): string[] {
    const errors: string[] = [];

    for (const k of ['FirstName', 'Surname', 'Email', 'Mobile'] as const) {
      if (!e[k] || String(e[k]).trim() === '') errors.push(`${k} is required`);
    }

    if (e.Vulnerable === 'Yes' && !e.VulnerableMessage?.trim()) {
      errors.push('Please provide what you would like to share');
    }

    const email = e.Email?.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Enter a valid email address');

    return errors;
  }



  toBooking(
    partial: Partial<Booking>,
    getPrev: () => Booking | undefined
  ): Booking {
    const prev = getPrev();
    return {
      bookingDate: partial.bookingDate ?? prev?.bookingDate ?? '',
      bookingStart: partial.bookingStart ?? prev?.bookingStart ?? '',
      bookingEnd: partial.bookingEnd ?? prev?.bookingEnd ?? '',
      source: 'SYSTEM',
      bookingProfile: 'DEFAULT',
      bookingProfileId: 1,
    };
  }


  async getDates() {
    const data = await this.getDateSlots()
    const list = queryElement(`[data-partner-element="${DOM_CONFIG.elements.dateList}"]`)
    const tpl = queryElement('.mct_pill_field.is-date') as HTMLElement
    if (!list) return
    list.innerHTML = ''
    for (const day of data.result ?? []) {
      const btn = makeDateBtn(day, tpl)
      btn.addEventListener('click', () => {
        const input = btn.querySelector('.mct_pill_input') as HTMLInputElement;
        input.checked = true;

        this.setTimeSlots(day);

        // Write to the progressive draft
        this.draft.booking = {
          ...(this.draft.booking ?? {}),
          bookingDate: day.date,
        };

        stateManager.set(
          'booking',
          this.toBooking({ bookingDate: day.date }, () => stateManager.getState().booking || undefined)
        );
        console.log('booking (after date pick)', stateManager.getState().booking);
        console.log('draft (after date pick)', this.draft);
        debugLog('booking (after date pick)', stateManager.getState().booking);
      })
      list.appendChild(btn)
    }
  }

  setupNavButtons() {
    let nextButtons = queryElements(`[data-partner-element="${DOM_CONFIG.elements.next}"]`)
    let prevButtons = queryElements(`[data-partner-element="${DOM_CONFIG.elements.prev}"]`)

    nextButtons.forEach((e) => {
      e.addEventListener('click', () => {
        this.navigateNext(e)
      })
    })

    prevButtons.forEach((e) => {
      e.addEventListener('click', () => {
        this.navigatePrev(e)
      })
    })
  }

  navigateNext(el: HTMLElement | SVGElement) {
    let parent = el.closest('.p-a_block_wrap')
    if (!parent) return

    if (queryElement(':checked', parent)) {
      parent.setAttribute('data-mct-initial', 'none')
      parent.nextElementSibling?.removeAttribute('data-mct-initial')
    } else { alert("Please pick a date & time"); }
  }

  navigatePrev(el: HTMLElement | SVGElement) {
    let parent = el.closest('.p-a_block_wrap')
    if (!parent) return
    parent.setAttribute('data-mct-initial', 'none')
    parent.previousElementSibling?.removeAttribute('data-mct-initial')
  }

  notesEventListener() {
    const yesButton = queryElement('.mct_pill_field:has([name="Vulnerable"]):has([value="Yes"])');
    const noButton = queryElement('.mct_pill_field:has([name="Vulnerable"]):has([value="No"])');
    const block = queryElement('[data-partner-element="Vulnerable"]');

    if (!block) { console.error('no notes block'); return; }
    block.style.display = 'none';

    yesButton?.addEventListener('click', () => { block.style.display = 'block'; });
    noButton?.addEventListener('click', () => { block.style.display = 'none'; });
  }

  initICID() {
    const qp = this.readICIDFromQuery();
    if (qp) {
      this.setICID(qp); // query param overrides everything
      return;
    }

    const attr = this.readICIDFromBody();
    if (attr) {
      this.setICID(attr); // body attribute next
      return;
    }

    this.setICID('pb');    // default when neither is present
  }

  async initLCID() {
    const currentLCID = this.getLCID();
    const icid = this.getICID();

    try {
      const lcid = await lcidAPI.generate(currentLCID, icid);
      this.setLCID(lcid);
    } catch {
      debugError('Failed to generate LCID');
    }
  }

  setICID(icid: string) {
    stateManager.setICID(icid);
  }

  getICID(): string | null {
    return stateManager.getICID();
  }

  setLCID(lcid: string | null) {
    stateManager.setLCID(lcid);
  }

  getLCID(): string | null {
    return stateManager.getLCID();
  }

  private formatDateParts(isoLike: string | undefined | null) {
    if (!isoLike) return null;

    // Accepts "YYYY-MM-DD" (safe, no timezone shift) or any Date-parsable string
    let d: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) {
      const [y, m, day] = isoLike.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      const tmp = new Date(isoLike);
      d = isNaN(tmp.getTime()) ? null : tmp;
    }
    if (!d) return null;

    return {
      dayStr: d.toLocaleDateString('en-GB', { weekday: 'long' }),
      dateStr: String(d.getDate()).padStart(2, '0'),
      monthStr: d.toLocaleDateString('en-GB', { month: 'long' }),
    };
  }

  private updateAppointmentTag(booking?: Partial<Booking>) {
    console.log('appointment tag');
    const tag = queryElement('[data-mct-appointment="tag"]') as HTMLElement | null;
    if (!tag) return;

    const dayEl = tag.querySelector('[data-partner-element="day-string"]') as HTMLElement | null;
    const dateEl = tag.querySelector('[data-partner-element="date-string"]') as HTMLElement | null;
    const monthEl = tag.querySelector('[data-partner-element="month-string"]') as HTMLElement | null;
    const startEl = tag.querySelector('[data-partner-element="start-time"]') as HTMLElement | null;
    const endEl = tag.querySelector('[data-partner-element="end-time"]') as HTMLElement | null;

    const complete = !!(booking?.bookingDate && booking?.bookingStart && booking?.bookingEnd);

    if (!complete) {
      // Reset/placeholder state; or hide tag if you prefer
      tag.setAttribute('aria-hidden', 'true');
      if (dayEl) dayEl.textContent = 'Day';
      if (dateEl) dateEl.textContent = 'Date';
      if (monthEl) monthEl.textContent = 'Month';
      if (startEl) startEl.textContent = 'HH:MM';
      if (endEl) endEl.textContent = 'HH:MM';
      return;
    }

    tag.removeAttribute('aria-hidden');

    const parts = this.formatDateParts(booking!.bookingDate!);
    if (parts) {
      if (dayEl) dayEl.textContent = parts.dayStr;
      if (dateEl) dateEl.textContent = parts.dateStr;
      if (monthEl) monthEl.textContent = parts.monthStr;
    }

    if (startEl) startEl.textContent = fmtTime(booking!.bookingStart!);
    if (endEl) endEl.textContent = fmtTime(booking!.bookingEnd!);
  }


  async handleFormSubmission(): Promise<void> {

    const formBits = this.readEnquiryFormFromDOM();
    const prev = stateManager.getState().booking;
    const booking: Booking = {
      bookingDate: this.draft.booking?.bookingDate ?? prev?.bookingDate ?? '',
      bookingStart: this.draft.booking?.bookingStart ?? prev?.bookingStart ?? '',
      bookingEnd: this.draft.booking?.bookingEnd ?? prev?.bookingEnd ?? '',
      source: 'SYSTEM',
      bookingProfile: 'DEFAULT',
      bookingProfileId: 1,
    };
    if (!booking.bookingDate || !booking.bookingStart || !booking.bookingEnd) {
      console.log(booking);
      console.log(this.draft.booking);
    }

    const lcid = this.getLCID();
    const icid = this.getICID();

    const enquiry = {
      ...(stateManager.getState().form as EnquiryForm),
      ...(this.draft.enquiry ?? {}),
      ...formBits,
      ...(lcid ? { lcid } : {}),
      ...(icid ? { icid } : {}),
    };

    const request: CreateLeadAndBookingRequest = {
      enquiry: enquiry as any,
      booking,
    };

    try {
      console.log(request)
      // await createLeadAndBookingAPI.createLeadAndBooking(request);

      const form = queryElement('[data-partner-element="widget"]');
      const success = queryElement('[data-partner-element="success"]');
      if (!form || !success) return;

      form!.style.display = 'none';
      success?.removeAttribute('data-mct-initial');
      return;
    } catch (error: unknown) {
      debugError('Error submitting booking:', error);

      if (error instanceof APIError) {
        if (error.status === 409) {
          debugError('Booking error: 409 - Slot already taken');
        } else if (error.status === 400) {
          debugError('Booking error: 400 - Bad request, try again');
        } else {
          debugError('Booking failed with status:', error.status);
          alert('An error occurred while booking your appointment. Please try again.');
        }
      } else {
        debugError('Unexpected error:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  }


}
