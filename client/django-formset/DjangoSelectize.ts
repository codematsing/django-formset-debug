import debounce from 'lodash.debounce';
import isFinite from 'lodash.isfinite';
import isString from 'lodash.isstring';
import TomSelect from 'tom-select';
import {RecursivePartial, TomSettings} from 'tom-select/src/types';
import {IncompleteSelect} from './IncompleteSelect';
import {StyleHelpers} from './helpers';
import styles from './DjangoSelectize.scss';


export class DjangoSelectize extends IncompleteSelect {
	protected readonly shadowRoot: ShadowRoot;
	private static styleSheet: CSSStyleSheet = new CSSStyleSheet();
	private static nativeStyles: CSSStyleDeclaration|null = null;
	private readonly numOptions: number = 12;
	public readonly tomSelect: TomSelect;
	private readonly observer: MutationObserver;
	private readonly initialValue: string|string[] = '';
	private readonly baseSelector = '.ts-wrapper';
	private readonly uniqueIdentifier: string;

	constructor(tomInput: HTMLSelectElement) {
		super(tomInput);
		let isMultiple = false;
		if (tomInput.hasAttribute('multiple')) {
			// We want to use the CSS styles for <select> without multiple
			tomInput.removeAttribute('multiple');
			isMultiple = true;
		}
		DjangoSelectize.nativeStyles = DjangoSelectize.nativeStyles ?? {...window.getComputedStyle(tomInput)} as CSSStyleDeclaration;
		if (isMultiple) {
			// revert the above
			tomInput.setAttribute('multiple', 'multiple');
		}
		this.numOptions = parseInt(tomInput.getAttribute('options') ?? this.numOptions.toString());
		this.tomSelect = new TomSelect(tomInput, this.getSettings(tomInput));
		this.observer = new MutationObserver(this.attributesChanged);
		this.observer.observe(tomInput, {attributes: true});
		this.initialValue = this.currentValue;
		this.uniqueIdentifier = `ds-${Math.random().toString(36).substring(2, 15)}`;
		this.shadowRoot = this.wrapInShadowRoot();
		this.transferStyles();
		this.appendIndividualStyleSheet();
		tomInput.classList.add('dj-concealed');
		this.validateInput(this.initialValue as string);
	}

	protected getSettings(tomInput: HTMLSelectElement) : RecursivePartial<TomSettings> {
		const settings: RecursivePartial<TomSettings> = {
			create: false,
			valueField: 'id',
			labelField: 'label',
			maxItems: 1,
			maxOptions: undefined,
			sortField: [{field: '$order'}, {field: '$score'}],
			lockOptgroupOrder: true,
			searchField: ['label'],
			plugins: {},
			onFocus: this.touch,
			onBlur: this.blurred,
			onType: this.inputted,
			render: {
				no_results: `<div class="no-results">${gettext("No results found for '${input}'")}</div>`,
			}
		};
		if (this.isIncomplete) {
			settings.load = this.load;
		}
		if (tomInput.hasAttribute('multiple')) {
			settings.maxItems = parseInt(tomInput.getAttribute('max_items') ?? '3');
			settings.plugins = {...settings.plugins, remove_button: {title: gettext("Remove item")}};
			// tom-select has some issues to initialize items using the original input element
			const scriptId = `${tomInput.getAttribute('id')}_initial`;
			settings.items = JSON.parse(document.getElementById(scriptId)?.textContent ?? '[]');
		}
		return settings;
	}

	protected getValue = () => this.currentValue;

	protected async formResetted(event: Event) {
		this.getValue = () => this.initialValue;
		this.tomSelect.setValue(this.initialValue, true);
		await this.reloadOptions();
		this.getValue = () => this.currentValue;
	}

	protected formSubmitted(event: Event) {}

	protected async reloadOptions(silent?: boolean) {
		const currentValue = this.getValue();
		this.tomSelect.clear(true);
		this.fieldGroup.classList.remove('dj-dirty', 'dj-touched', 'dj-validated');
		this.fieldGroup.classList.add('dj-untouched', 'dj-pristine');
		const errorPlaceholder = this.fieldGroup.querySelector('.dj-errorlist > .dj-placeholder');
		if (errorPlaceholder) {
			errorPlaceholder.innerHTML = '';
		}
		if (this.isIncomplete) {
			this.tomSelect.clearOptions();
			this.tomSelect.input.replaceChildren();
			await this.loadOptions(this.buildFetchQuery(0), (options: Array<OptionData>) => {
				this.tomSelect.addOptions(options);
			});
		}
		this.tomSelect.setValue(currentValue, silent);
	}

	private get currentValue(): string | string[] {
		const currentValue = this.tomSelect.getValue();
		// make a deep copy because TomSelect mutates the array
		return Array.isArray(currentValue) ? [...currentValue] : currentValue;
	}

	private extractOptGroups(options: Array<OptionData>) {
		const groupnames = new Set<string>();
		options.forEach(o => {
			if (isString(o.optgroup)) {
				groupnames.add(o.optgroup);
			}
		});
		return Array.from(groupnames).map(name => ({label: name, value: name}));
	}

	private load = (search: string, callback: Function) => {
		this.loadOptions(this.buildFetchQuery(0, {search}), (options: Array<OptionData>) => {
			callback(options, this.extractOptGroups(options));
		});
	};

	private blurred = () => {
		const wrapper = this.shadowRoot.querySelector(this.baseSelector);
		wrapper?.classList.remove('dirty');
	};

	private inputted = (event: Event) => {
		const value = event as unknown as string;
		const wrapper = this.shadowRoot.querySelector(this.baseSelector);
		wrapper?.classList.toggle('dirty', value.length > 0);
	};

	private validateInput(value: String | Array<string>) {
		const wrapper = this.shadowRoot.querySelector(this.baseSelector);
		wrapper?.classList.remove('dirty');
		const selectElem = this.tomSelect.input as HTMLSelectElement;
		if (this.tomSelect.isRequired) {
			selectElem.setCustomValidity(value ? "": "Value is missing.");
		}
		if (selectElem.multiple) {
			for (let k = 0; k < selectElem.options.length; k++) {
				const option = selectElem.options.item(k);
				if (option) {
					option.selected = value.indexOf(option.value) >= 0;
				}
			}
		} else {
			this.tomSelect.input.value = value as string;
		}
	}

	private wrapInShadowRoot() : ShadowRoot {
		const group = this.tomSelect.input.parentElement;
		if (!(group instanceof HTMLElement))
			throw new Error("Could not find parent element");
		group.classList.add(this.uniqueIdentifier);  // see appendIndividualStyleSheet() for usage of this CSS class
		const shadowWrapper = document.createElement('div');
		shadowWrapper.classList.add('shadow-wrapper');
		const shadowRoot = shadowWrapper.attachShadow({mode: 'open', delegatesFocus: true});
		shadowRoot.adoptedStyleSheets = [new CSSStyleSheet()];
		this.tomSelect.input.insertAdjacentElement('beforebegin', shadowWrapper);
		const wrapper = group.removeChild(this.tomSelect.wrapper);
		shadowRoot.appendChild(wrapper);
		return shadowRoot;
	}

	private transferStyles() {
		if (DjangoSelectize.nativeStyles === null)
			throw new Error("Native styles not loaded");
		const sheet = DjangoSelectize.styleSheet;
		const wrapperStyle = (this.shadowRoot.host as HTMLElement).style;
		wrapperStyle.setProperty('display', DjangoSelectize.nativeStyles.display);
		sheet.replaceSync(styles);
		const tomInput = this.tomSelect.input;
		const lineHeight = window.getComputedStyle(tomInput).getPropertyValue('line-height');
		const optionElement = tomInput.querySelector('option');
		const displayNumOptions = Math.min(Math.max(this.numOptions, 8), 25);
		let loaded = false;
		for (let index = 0; sheet && index < sheet.cssRules.length; index++) {
			const cssRule = sheet.cssRules.item(index) as CSSStyleRule;
			const selectorText = cssRule.selectorText.trim();
			let extraStyles: string|null = null;
			switch (selectorText) {
				case this.baseSelector:
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'font-family', 'font-size', 'font-stretch', 'font-style', 'font-weight',
						'letter-spacing', 'white-space'
					]);
					loaded = true;
					break;
				case `${this.baseSelector} .ts-control`:
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'border-width', 'border-style', 'border-radius', 'padding', 'transition'
					]).concat(
						`min-height: ${DjangoSelectize.nativeStyles['height']};`
					);
					break;
				case `${this.baseSelector}.focus .ts-control`:
					tomInput.style.transition = 'none';
					tomInput.classList.add('-focus-');
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'border-color', 'box-shadow','outline', 'transition'
					]);
					tomInput.classList.remove('-focus-');
					tomInput.style.transition = '';
					break;
				case `${this.baseSelector} .ts-control > input`:
				case `${this.baseSelector} .ts-control > div`:
					if (optionElement) {
						extraStyles = StyleHelpers.extractStyles(optionElement, ['padding-left', 'padding-right']);
					}
					break;
				case `${this.baseSelector} .ts-control > input::placeholder`:
					tomInput.classList.add('-placeholder-');
					extraStyles = StyleHelpers.extractStyles(tomInput, ['background-color', 'color']);
					tomInput.classList.remove('-placeholder-');
					break;
				case `${this.baseSelector}.disabled .ts-control`:
					tomInput.classList.add('-disabled-');
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'background-color', 'border', 'box-shadow', 'color', 'opacity', 'outline', 'transition'
					]);
					tomInput.classList.remove('-disabled-');
					break;
				case `${this.baseSelector} .ts-dropdown`:
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'border-right', 'border-bottom', 'border-left',
						'border-bottom-left-radius', 'border-bottom-right-radius',
					]).concat(
						parseFloat(lineHeight) > 0 ? `line-height: calc(${lineHeight} * 1.2);` : 'line-height: 1.4em;'
					);
					break;
				case `${this.baseSelector} .ts-dropdown .ts-dropdown-content`:
					if (parseFloat(lineHeight) > 0) {
						extraStyles =  `max-height: calc(${lineHeight} * 1.2 * ${displayNumOptions});`;
					} else {
						extraStyles =  `max-height: ${displayNumOptions * 1.4}em;`;
					}
					break;
				case `${this.baseSelector} .ts-dropdown [data-selectable]`:
					extraStyles = StyleHelpers.extractStyles(tomInput, ['padding-left']);
					break;
				case ':host-context([role="group"].dj-submitted) .ts-wrapper.invalid.focus .ts-control':
					tomInput.style.transition = 'none';
					tomInput.classList.add('-focus-', '-invalid-', 'is-invalid');  // is-invalid is a Bootstrap hack
					extraStyles = StyleHelpers.extractStyles(tomInput, [
						'background-color', 'border', 'box-shadow', 'color', 'outline', 'transition'
					]);
					tomInput.classList.remove('-focus-', '-invalid-', 'is-invalid');
					tomInput.style.transition = '';
					break;
				default:
					break;
			}
			if (extraStyles) {
				sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
			}
		}
		if (!loaded)
			throw new Error(`Could not load styles for ${this.baseSelector}`);
	}

	private appendIndividualStyleSheet() {
		// `:host-context()` does not work with `:has()` or other complex selectors. Therefore, it is impossible to
		// use it as a selector for the shadow root of this individual component. To apply styles to this shadow root's
		// instance, depending on context of the host element, we use a unique CSS class. This class is added during
		// initialization to the wrapping element of the shadow root, see `wrapInShadowRoot()`.
		// Here we replace the `:host-context()`-selectors with that individual class.
		const sheet = DjangoSelectize.styleSheet;
		const individualSheet = new CSSStyleSheet();
		for (let index = 0; sheet && index < sheet.cssRules.length; index++) {
			const cssRule = sheet.cssRules.item(index) as CSSStyleRule;
			const selectorText = cssRule.selectorText.trim();
			switch (selectorText) {
				case ':host-context([role="group"].dj-touched.ds-unique-identifier) .ts-wrapper.has-items:not(.input-active) .ts-control':
				case ':host-context([role="group"].dj-touched.ds-unique-identifier) .ts-wrapper.invalid:not(.input-active) .ts-control':
					individualSheet.insertRule(cssRule.cssText.replace('.ds-unique-identifier', `.${this.uniqueIdentifier}`));
					break;
				default:
					break;
			}
		}
		this.shadowRoot.adoptedStyleSheets.push(individualSheet);
	}

	public initialize() {
		const sheet = this.shadowRoot.adoptedStyleSheets[0];
		if (!DjangoSelectize.styleSheet)
			throw new Error('Stylesheet not loaded');
		for (let index = 0; index < DjangoSelectize.styleSheet.cssRules.length; index++) {
			const cssRule = DjangoSelectize.styleSheet.cssRules.item(index) as CSSStyleRule;
			sheet.insertRule(cssRule.cssText);
		}

		// some styles might change during runtime, so we need to update them whenever necessary
		const tomInput = this.tomSelect.input as HTMLSelectElement;
		tomInput.style.transition = 'none';
		const baseStyles = () => {
			const backgroundColor = window.getComputedStyle(tomInput).getPropertyValue('background-color');
			return `--selectize-background-color:${backgroundColor};${StyleHelpers.extractStyles(tomInput, ['color'])};`;
		};
		const baseStyleRule = sheet.insertRule(`${this.baseSelector}{${baseStyles()}}`, sheet.cssRules.length);
		const controlStyleSelector = `${this.baseSelector} .ts-control`;
		const controlStyles = () => StyleHelpers.extractStyles(tomInput, ['border-color', 'box-shadow']);
		const controlStyleRule = sheet.insertRule(`${controlStyleSelector}{${controlStyles()}}`, sheet.cssRules.length);
		const dropdownStyleSelector = `${this.baseSelector} .ts-dropdown`;
		const dropdownStyleRule = sheet.insertRule(`${dropdownStyleSelector}{${controlStyles()}}`, sheet.cssRules.length);
		const currentWidth = () => window.getComputedStyle(tomInput).getPropertyValue('width');
		const currentWidthRule = sheet.insertRule(`${controlStyleSelector}{width:${currentWidth()};}`, sheet.cssRules.length);
		window.addEventListener('resize', debounce(() => {
			sheet.deleteRule(currentWidthRule);
			sheet.insertRule(`${controlStyleSelector}{width:${currentWidth()};}`, currentWidthRule);
		}, 50, {leading: false, trailing: true}));
		const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQueryList.onchange = () => {
			sheet.deleteRule(baseStyleRule);
			sheet.insertRule(`${this.baseSelector}{${baseStyles()}}`, baseStyleRule);
			sheet.deleteRule(controlStyleRule);
			sheet.insertRule(`${controlStyleSelector}{${controlStyles()}}`, controlStyleRule);
			sheet.deleteRule(dropdownStyleRule);
			sheet.insertRule(`${dropdownStyleSelector}{${controlStyles()}}`, dropdownStyleRule);
		};
		this.setupFilters(tomInput);
		this.tomSelect.on('change', (value: String) => this.validateInput(value));
	}

	private attributesChanged = (mutationsList: Array<MutationRecord>) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
				if (this.tomSelect.input.disabled) {
					if (!this.tomSelect.isDisabled) {
						this.tomSelect.disable();
					}
				} else {
					if (this.tomSelect.isDisabled) {
						this.tomSelect.enable();
					}
				}
			}
		}
	};

	public setValue(value: string|number) {
		const emitChangeEvent = () => this.tomSelect.input.dispatchEvent(new Event('change', {bubbles: true}));

		if (isFinite(value)) {
			// if the value is a number, enforce re-fetching object from the server
			this.loadOptions(this.buildFetchQuery(0, {pk: value.toString()}), (options: Array<OptionData>) => {
				if (this.tomSelect.getValue() === value.toString()) {
					// object already loaded by tom-select
					this.tomSelect.updateOption(value.toString(), options[0]);
				} else {
					// object must be added to tom-select
					this.tomSelect.addOptions(options);
				}
			}).then(() => {
				this.tomSelect.setValue(value.toString(), true);
				emitChangeEvent();
			});
		} else if (isString(value)) {
			this.tomSelect.setValue(value, true);
			emitChangeEvent();
		}
	}

	public setValues(values: Array<string>) {
		this.tomSelect.setValue(values, true);
	}
}

const DS = Symbol('DjangoSelectize');

export class DjangoSelectizeElement extends HTMLSelectElement {
	private [DS]?: DjangoSelectize;  // hides internal implementation

	constructor() {
		super();
		if (this.form) {
			this[DS] = new DjangoSelectize(this);
		}
	}

	connectedCallback() {
		this[DS]?.initialize();
	}

	get value() {
		const value = this[DS]?.tomSelect.getValue();
	 	return Array.isArray(value) ? value.join(',') : value;
	}

	set value(val: any) {
		if (this.multiple) {
			if (isString(val)) {
				this[DS]?.setValues(val.split(','));
			} else if (Array.isArray(val)) {
				this[DS]?.setValues(val);
			}
		} else {
			if (isString(val) || isFinite(val)) {
				this[DS]?.setValue(val);
			}
		}
	}
}
