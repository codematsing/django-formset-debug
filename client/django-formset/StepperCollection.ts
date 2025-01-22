import {StyleHelpers} from './helpers';
import styles from './StepperCollection.scss';


class StepperCollection {
	private readonly element: StepperCollectionElement;
	private readonly baseSelector = 'django-stepper-collection';
	private readonly styleSheet: CSSStyleSheet;

	constructor(element: StepperCollectionElement) {
		this.element = element;
		this.styleSheet = StyleHelpers.stylesAreInstalled(this.baseSelector) ?? this.appendStyles();
	}

	initialize() {
		console.log('StepperCollectionElement initialized');
	}

	private appendStyles() : CSSStyleSheet {
		const declaredStyles = document.createElement('style');
		declaredStyles.innerText = styles;
		document.head.appendChild(declaredStyles);
		if (!declaredStyles.sheet)
			throw new Error("Could not create <style> element");
		const sheet = declaredStyles.sheet;
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
		this[SC].initialize();
	}
}
