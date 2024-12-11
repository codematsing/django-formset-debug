export namespace StyleHelpers {
	const styleElement = document.createElement('style');
	let pseudoStyleSheet: CSSStyleSheet|null = null;

	export function extractStyles(element: Element, properties: Array<string>): string {
		let styles = Array<string>();
		const style = window.getComputedStyle(element);
		for (let property of properties) {
			styles.push(`${property}:${style.getPropertyValue(property)}`);
		}
		return styles.join('; ').concat('; ');
	}

	export function mutableStyles(sheet: CSSStyleSheet, selector: string, properties: {[key: string]: string}, element: HTMLElement, extraCssClass?: string) : Function {
		const setStyles = () => {
			const transition = window.getComputedStyle(element).getPropertyValue('transition');
			element.style.transition = 'none';
			if (extraCssClass) {
				element.classList.add(extraCssClass);
			}
			const style = Object.entries(properties).map(([property, value]) => {
				return `${value}:${window.getComputedStyle(element).getPropertyValue(property)};`;
			}).join('');
			if (extraCssClass) {
				element.classList.remove(extraCssClass);
			}
			element.style.transition = transition;
			return style;
		};
		const ruleIndex = sheet.insertRule(`${selector}{${setStyles()}}`, sheet.cssRules.length);
		return () => {
			sheet.deleteRule(ruleIndex);
			sheet.insertRule(`${selector}{${setStyles()}}`, ruleIndex);
		};
	}

	function convertPseudoClasses() {
		// Iterate over all style sheets, find most pseudo classes and add CSSRules with a
		// CSS selector where the pseudo class has been replaced by a real counterpart.
		// This is required, because browsers can not invoke `window.getComputedStyle(element)`
		// using pseudo classes.
		if (!pseudoStyleSheet)
			throw new Error('Style Sheet is not initialized');

		const numStyleSheets = document.styleSheets.length;
		for (let index = 0; index < numStyleSheets; index++) {
			const sheet = document.styleSheets[index];
			try {
				for (let k = 0; k < sheet.cssRules.length; k++) {
					const cssRule = sheet.cssRules.item(k);
					if (cssRule) {
						traverseStyles(cssRule, pseudoStyleSheet);
					}
				}
			} catch (e) {
				if (e instanceof DOMException) {
					console.warn('Could not read stylesheet, try adding crossorigin="anonymous"', sheet, e)
				} else {
					throw e;
				}
			}
		}
	}

	export function attachPseudoStyles() {
		document.head.appendChild(styleElement);
		if (pseudoStyleSheet === null) {
			pseudoStyleSheet = styleElement.sheet as CSSStyleSheet;
			convertPseudoClasses();
		} else {
			while (styleElement.sheet?.cssRules.length) {
				styleElement.sheet?.deleteRule(0);
			}
			for (let index = 0; index < pseudoStyleSheet.cssRules.length; index++) {
				const cssText = pseudoStyleSheet.cssRules.item(index)?.cssText;
				if (cssText) {
					styleElement.sheet?.insertRule(cssText);
				}
			}
		}
	}

	export function detachPseudoStyles() {
		document.head.removeChild(styleElement);
	}

	export function stylesAreInstalled(baseSelector: string) : boolean {
		// check if styles have been loaded for this widget
		for (let k = document.styleSheets.length - 1; k >= 0; --k) {
			const cssRule = document?.styleSheets?.item(k)?.cssRules?.item(0);
			if (cssRule instanceof CSSStyleRule && cssRule.selectorText.trim() === baseSelector)
				return true;
		}
		return false;
	}

	function traverseStyles(cssRule: CSSRule, extraCSSStyleSheet: CSSStyleSheet) {
		if (cssRule instanceof CSSImportRule) {
			try {
				if (!cssRule.styleSheet)
					return;
				for (let subRule of cssRule.styleSheet.cssRules) {
					traverseStyles(subRule, extraCSSStyleSheet);
				}
			} catch (e) {
				if (e instanceof DOMException) {
					console.warn('Could not traverse CSS import', cssRule, e)
				} else {
					throw e;
				}
			}
		} else if (cssRule instanceof CSSStyleRule) {
			if (!cssRule.selectorText)
				return;
			const newSelectorText = cssRule.selectorText.
				replaceAll(':focus', '.-focus-').
				replaceAll(':focus-visible', '.-focus-visible-').
				replaceAll(':hover', '.-hover-').
				replaceAll(':disabled', '.-disabled-').
				replaceAll(':invalid', '.-invalid-').
				replaceAll(':valid', '.-valid-').
				replaceAll('::placeholder-shown', '.-placeholder-shown').
				replaceAll(':placeholder-shown', '.-placeholder-shown').
				replaceAll('::placeholder', '.-placeholder-').
				replaceAll(':placeholder', '.-placeholder-');
			if (newSelectorText !== cssRule.selectorText) {
				extraCSSStyleSheet.insertRule(`${newSelectorText}{${cssRule.style.cssText}}`);
			}
		} // else handle other CSSRule types
	}
}
