import isEqual from 'lodash.isequal';
import isString from 'lodash.isstring';
import {StyleHelpers} from './helpers';
import styles from './StepperCollection.scss';
import {parse} from '../build/tag-attributes';


class StepperStep {
	private readonly collection: StepperCollection;
	private readonly listItem: HTMLLIElement;
	private readonly path: string[];
	private visited = false;
	public readonly formCollection: HTMLElement;
	public readonly induceActivate: Function;

	constructor(collection: StepperCollection, listItem: HTMLLIElement, formCollection: HTMLElement) {
		this.collection = collection;
		this.listItem = listItem;
		this.formCollection = formCollection;
		this.path = listItem.getAttribute('prefix')?.split('.') ?? [];
		this.induceActivate = this.evalInducer(listItem, (...args: any[]) => this.activateStep(...args));
		this.listItem.querySelector('.stepper-head')?.addEventListener('click', this.activateVisited);
	}

	private evalInducer(element: HTMLElement, inducer: Function) : Function {
		const attrValue = element.getAttribute('df-induce-activate');
		if (!isString(attrValue))
			return () => {};
		try {
			const evalExpression = new Function(`return ${parse(attrValue, {startRule: 'InduceExpression'})}`);
			return (...args: any[]) => {
				if (evalExpression.call(this)) {
					inducer(...args);
				}
			};
		} catch (error) {
			throw new Error(`Error while parsing <django-form-collection df-induce-activate="${attrValue}">: ${error}.`);
		}
	}

	private isButtonActive(path: Array<string>, action: string): boolean {
		const absPath = path[0] !== '' ? path : (() => {
			// path is relative, so concatenate it to the form's path
			const absPath = [...this.path];
			const relPath = path.filter(part => part !== '');
			const delta = path.length - relPath.length;
			absPath.splice(absPath.length - delta + 1);
			absPath.push(...relPath);
			return absPath;
		})();
		const formset = this.collection!.formset!;
		const button = formset.buttons.find(button => isEqual(button.path, absPath));
		return action === 'active' && button === formset.currentActiveButton;
	}

	private activateVisited = (event: Event) => {
		if (this.visited) {
			this.activateStep();
		}
	};

	public activateStep(...args: any[]) {
		this.collection.steps.forEach(step => {
			step.formCollection.ariaCurrent = step.listItem.ariaCurrent = step === this ? 'step' : null;
		});
		this.setAsVisited();
	}

	public setAsVisited() {
		this.visited = true;
		this.listItem.classList.add('visited');
	}
}


class StepperCollection implements Inducible {
	private readonly element: StepperCollectionElement;
	private readonly baseSelector = 'django-stepper-collection';
	private readonly styleSheet: CSSStyleSheet;
	public readonly steps: Array<StepperStep> = [];
	public formset?: DjangoFormset;

	constructor(element: StepperCollectionElement) {
		this.element = element;
		const listItems = element.querySelectorAll('li.stepper-step');
		element.querySelectorAll('django-form-collection').forEach((formCollection: Element, index: number) => {
			this.steps.push(new StepperStep(this, listItems.item(index) as HTMLLIElement, formCollection as HTMLElement));
		});
		const formset = this.element.closest('django-formset');
		if (formset) {
			formset.addEventListener('django-formset-connected', this.registerInducer, {once: true});
		}
		this.styleSheet = StyleHelpers.stylesAreInstalled(this.baseSelector) ?? this.appendStyles();
	}

	connectedCallback() {
		this.steps[0]?.activateStep();
	}

	private registerInducer = (event: Event) => {
		if (!(event instanceof CustomEvent))
			return;
		this.formset = event.detail.formset as DjangoFormset;
		this.formset.registerInducer(this, this.updateOperability);

		let previousStep: StepperStep|null = null;
		for (const step of this.steps) {
			if (previousStep && Object.values(previousStep.formCollection.querySelectorAll('form')).every(form => form.checkValidity())) {
				step.setAsVisited();
			}
			previousStep = step;
		}
	};

	updateOperability(...args: any[]){
		for (const step of this.steps) {
			step.induceActivate(...args);
		}
	}

	private appendStyles() : CSSStyleSheet {
		const declaredStyles = document.createElement('style');
		declaredStyles.innerText = styles;
		document.head.appendChild(declaredStyles);
		if (!declaredStyles.sheet)
			throw new Error("Could not create <style> element");
		return declaredStyles.sheet as CSSStyleSheet;
	}
}


const SC = Symbol('StepperCollection');

export class StepperCollectionElement extends HTMLElement {
	private [SC]: StepperCollection;  // hides internal implementation

	constructor() {
		super();
		this[SC] = new StepperCollection(this);
	}

	connectedCallback() {
		this[SC].connectedCallback();
	}
}
