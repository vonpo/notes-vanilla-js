/**
 * Features:
 * 1. Render single template.
 * 2. Render nested templates.
 * 3. Render arrays of templates.
 * 4. Attach dom handler (i.e onclick)
 * 5. Add css classes.
 * 6. Add styles.
 *
 * MiniReact returns render function to re-render component.
 * Render only happens when object has different reference than previous one.
 * If object has same references properties won't be rendered.
 *
 * @usage: {
 *     @events: {
 *         onclick: {
 *             button: '
 *         }
 *     },
 *     title: 'test' // Will set property 'test' value to template that has element with id= 'title'
 * }
 * @param containerElement
 * @param templateId
 * @param index
 *
 * @return {{render: function}}
 * @constructor
 */
// Mini React framework
const MiniReact = (containerElement, templateId, index) => {
	/**
	 * Get element by id helper.
	 * @param container
	 * @param id
	 * @param index
	 * @return {Element}
	 */
	function getElementById(container = document, id, index) {
		const elements = container.querySelectorAll(`[data-id="${id}"]`);

		if (typeof index === 'undefined') {
			index = elements.length - 1;
		}

		return elements[index];
	}

	const log = text => window.debug && console.debug(`[MiniReact] ${text}`);

	if (isNaN(index) || !containerElement.children[index]) {
		const template = document.getElementById(templateId).content.cloneNode(true);

		containerElement.appendChild(template)
	} else {
		log(`Skip append child for item with index. Item id ${containerElement.id}, templateId: ${templateId}, indexId: ${index}`)
	}

	let lastRender;


	const render = (data) => {
		// Simple optimization.
		// Use equality comparator if data is the same skip render.
		if (lastRender === data) {
			console.info('Skip render.');
			return
		}

		const nodesToRemove = [];

		// Find nodes to remove.
		if (lastRender) {
			for (let [elementId] of Object.entries(lastRender)) {
				if (elementId === '@events' || elementId === '@classes') {
					continue;
				}

				if (!data[elementId]) {
					nodesToRemove.push(elementId);
				}
			}
		}

		// Remove previous nodes that are not used anymore.
		if (nodesToRemove.length > 0) {
			nodesToRemove.forEach(nodeToRemoveId => containerElement
				.getElementById(nodeToRemoveId)
				.remove())
		}

		for (let [elementId, value] of Object.entries(data)) {
			if (elementId === '@classes') {
				for (let [elementId, className] of Object.entries(value)) {
					const element = getElementById(containerElement, elementId, index)

					element.setAttribute('class', className)
				}
				continue;
			}

			if (elementId === '@styles') {
				for (let [elementId, styles] of Object.entries(value)) {
					const element = getElementById(containerElement, elementId, index)

					for (let [styleName, styleValue] of Object.entries(styles)) {
						element.style[styleName] = styleValue;
					}
				}
				continue;
			}

			// 4. Attach dom events.
			if (elementId === '@events') {
				// Attach events.
				for (let [elementId, handlers] of Object.entries(value)) {
					// Take always last rendered element.
					const element = getElementById(containerElement, elementId, index)

					// Map handlers to element.
					for (let [handler, handlerFunction] of Object.entries(handlers)) {
						element[handler] = e => {
							handlerFunction({e, data, element, render})
						};
					}
				}

				continue;
			}

			const element = getElementById(containerElement, elementId, index)

			// Ignore data properties they are not meant to be rendered.
			if (!element) {
				continue;

			}
			// 1. Render single template values.
			if (typeof value === "string" || typeof value === "number") {
				// If value the same don't change it.
				if (element && typeof element.value !== 'undefined') {
					element.value = value;
				} else if (element && element.innerText !== value) {
					element.innerText = value;
				}

				// 3. Render arrays.
			} else if (Array.isArray(value)) {
				const templateId = element.getAttribute('data-template')

				log(`Render array element id: '${element.id}', templateId: '${templateId}'`);

				// Check for elements to remove.
				const lastRenderArray = lastRender && lastRender[elementId];

				if (lastRenderArray) {
					lastRenderArray.forEach((node, index) => {
						if (!value[index]) {
							element.children[index].remove();
						}
					})
				}

				// Apply children.
				value.forEach((arrayItem, index) => {
					const {render} = MiniReact(element, templateId, index);

					render(arrayItem);
				});

				// 2. Render nested templates.
			} else if (typeof value === "object") {
				const templateId = element.getAttribute('data-template');
				const {render} = MiniReact(element, templateId);

				log(`Render object element id: '${element.id}', templateId: '${templateId}'`);

				render(value);
			}
		}

		lastRender = data;
	}

	return {render}
}

// NOTE APP
const {render} = MiniReact(document.getElementById("root"), "appTemplate");

const updateNote = (noteToUpdate, update) => {
	appStore = {
		...appStore,
		notes: appStore.notes.map(note => {
			if (note === noteToUpdate) {
				return {
					...noteToUpdate,
					...update
				}
			}
			return note;
		})
	}

	render(appStore);
}

/**
 * Update all notes.
 * Mark other nodes as not selected.
 *
 * @param data
 */
const onNodeClick = ({data}) => {
	appStore = {
		...appStore,
		notes: appStore.notes.map(note => {
			const isSelected = note === data;

			return {
				...note,
				isSelected,
				'@classes': {
					textarea: isSelected ? 'active' : '',
					box: isSelected ? 'box active' : 'box'
				}
			}
		})
	}

	render(appStore);
};

const onAddNote = () => {
	appStore = {
		...appStore,
		notes: [...appStore.notes, {...simpleNote}],
		'@classes': {
			emptyNotesInfo: ''
		}
	};

	render(appStore);
}

const onRemoveNote = ({data}) => {
	const notes = appStore.notes.filter(note => note !== data);

	appStore = {
		...appStore,
		notes,
		'@classes': {
			emptyNotesInfo: notes.length === 0 ? 'emptyNotesInfo' : ''
		}
	};

	render(appStore);
}

const onColorChange = ({data, e}) => {
	updateNote(data, {
		color: e.target.value,
		'@styles': {
			textarea: {
				backgroundColor: e.target.value
			}
		}
	})
}

const onTextChange = ({e, data}) => {
	updateNote(data, {
		textarea: e.target.value
	})
}

// Empty note.
const simpleNote = {
	'@classes': {
		box: 'box'
	},
	'@events': {
		addNote: {
			onclick: onAddNote,
		},
		removeNote: {
			onclick: onRemoveNote
		},
		textarea: {
			onkeyup: onTextChange,
			onclick: onNodeClick
		},
		color: {
			onchange: onColorChange
		}
	},
	color: '#dede24',
	textarea: ''
};
// App store.
let appStore = {
	'@events': {
		addNote: {
			onclick: onAddNote
		}
	},
	notes: [{...simpleNote}]
};

render(appStore);