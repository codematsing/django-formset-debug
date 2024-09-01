import {Extension, Mark, getNodeAttributes} from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		classBasedMark: {
			setMarkClass: (name: string, cssClass: string) => ReturnType,
			unsetMarkClass: (name: string) => ReturnType,
		},
		classBasedNode: {
			toggleNodeClass: (cssClass: string|null, allowedClasses: Set<string>) => ReturnType,
		},
	}
}


export const ClassBasedMark = Mark.create({
	name: 'classBasedMark',

	addOptions() {
		return {
			allowedClasses: [],
		}
	},

	addAttributes() {
		return {
			[this.name]: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					for (let cssClass of this.options.allowedClasses) {
						if (element.classList.contains(cssClass)) {
							return cssClass;
						}
					}
				},
				renderHTML: (attributes: Record<string, any>) => {
					return {class: attributes[this.name]};
				},
			},
		};
	},

	parseHTML() {
		return [{
			tag: 'span',
			getAttrs: (element: HTMLElement) => {
				if (element instanceof HTMLElement) {
					if (this.options.allowedClasses.some((cssClass: string) => element.classList.contains(cssClass))) {
						return {};
					}
				}
				return false;
			},
		}];
	},

	renderHTML({HTMLAttributes}) {
		return ['span', HTMLAttributes, 0];
	},

	addCommands() {
		return {
			setMarkClass: (name: string, cssClass: string) => ({commands}) => {
				return commands.setMark(name, {[name]: cssClass});
			},
			unsetMarkClass: (name: string) => ({commands}) => {
				return commands.unsetMark(name);
			},
		}
	},
});


export const ClassBasedNode = Extension.create({
	name: 'classBasedNode',

	addOptions() {
		return {
			types: ['paragraph', 'heading'],
		}
	},

	addGlobalAttributes() {
		return [{
			types: this.options.types,
			attributes: {
				cssClasses: {
					default: null,
					parseHTML: element => element.classList.value,
					renderHTML: attributes => {
						return attributes.cssClasses ? {class: attributes.cssClasses} : {};
					},
				},
			},
		}];
	},

	addCommands() {
		return {
			toggleNodeClass: (cssClass: string|null, allowedClasses: Set<string>) => ({commands, state}) => {
				return this.options.types.every((type: string) => {
					const currentClass = getNodeAttributes(state, type).cssClasses ?? '';
					const currentClasses = new Set<string>(currentClass.split(' '));
					const newClasses = currentClasses.difference(allowedClasses);
					if (cssClass) {
						newClasses.add(cssClass);
					}
					return commands.updateAttributes(type, {
						cssClasses: Array.from(newClasses).filter(c => c).join(' ')
					});
				});
			},
		};
	},

});
