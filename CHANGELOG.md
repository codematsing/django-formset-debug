## Changes

1.5.4
  * Fix: Regression in `FileUploadWidget`, drag and drop of file into drag area does not work.

1.5.3
  * Fix: Regression in `RichtextArea`, heading with a single level does not work.

1.5.2
  * Fix naming issue in interactive docs, preventing the dialog not to close.
  * Fix in RichtextArea: Dropdown menu did not show up at the right position.

- 1.5.1
  * The published version of **django-formset** now also includes the monolithic build of all
    JavaScript files.
  * In RichtextArea: Add control element to select font family.
  * Date- and DateTime-widgets as Calendar representation now always apply 6 rows to prevent widget
    resizing when paginating.
  * Fixing RichtextArea: Only find direct dialog element for a menu button.
  * Fixing Selectize widget: Apply proper styles if group elements are nested. Happened when using
    the widget in a RichtextArea's dialog.
  * Fixed: Main stylesheet sometimes was loaded more than once.

- 1.5
  * **Breaking Change:** Always include `<script src="{% url 'javascript-catalog' %}"></script>` to
    the `<head>`-section of an HTML template. This is because `gettext` is used inside many
    JavaScript files. 
  * Drop support for Django-4.1 and Python-3.9.
  * Add support for Python-3.12.
  * Fix #142: A `FormCollection` with siblings and multiple `RichtextArea` widgets did not work.
  * Fix #140: Adding `default_renderer` to `FormCollection` did not always have the intended effect.
  * Fix #138: Selectize widget in sortable collection raises JavaScript error.
  * Fix monolithic build.
  * Attribute `<button df-click="…">` now accepts function `setFieldValue()`. This can be used to
    transfer values from one field to another one.
  * Introduce partial submits and prefilling of dialog forms in collections.
  * The parser generator allows whitespace inside parentheses.
  * Perform all E2E tests by also using the monolithic build. 
  * Add `jest` to explicitly test the parser generator.

- 1.4.5
  * Fix: When submitting a form with a `FileField`, the `UploadedFileInput` widget returns ``None``
    to signalize that nothing changed. Then however, the `clean()`-method did not access the initial
    value of the field. This is fixed now.
  * Fix: Using the value `cleaned_data` from a FormCollection, always started to validate and then
    returned values. Now, one must explicitly call `is_valid()`, otherwise an `AttributeError` is
    raised. 

- 1.4.4
  * Fix: In widget `PhoneNumberInput`, the country lookup field did not behave es expected when
    using the up- or down-arrow keys to navigate through the list of countries.
  * In widget `PhoneNumberInput`, entering "0" into the search field now does not filter the list
    of countries anymore. This is because country codes starting with "00" is not a valid E.164
    format.

- 1.4.3
  * Fix regression in widget `UploadedFileInput` introduced in 1.4: The Delete button did not work
    for files added through the `initial` parameter.
  * Prevent uploading files with an unmatching accept attribute.
  * In widget `PhoneNumberInput`, set focus on country lookup field after opening dropdown box with
    international prefixes.

- 1.4.2
  * Fix: `SlugInput` widget used an invalid `pattern` attribute in its input field.
  * Removed `^…` and `…$` from all `pattern` attributes in all fields using regular expressions.
  * Add delay on `reload()` handler to prevent early firing of restore.

- 1.4.1
  * Fix #136: Submit button shows bummer symbol after okay symbol.
  * Fix #132: The size of the input window does not change as the window size changes.

- 1.4
  * Add support for form dialogs. They can be used standalone or to add complex extensions to the
    Richtext editor.
  * **Breaking change:** `controls.Link()` must be replaced by
    `controls.DialogControl(SimpleLinkDialogForm())`. Check documentation for details.
  * Add control element for footnotes to the Richtext editor.
  * The ternary operator can be used in button actions to distinguish between two possible queues. 
  * The ``require`` attribute of input fields can be made conditional.
  * The ``Selectize`` widget now passes the value to and from the underlying implementation.
  * Activators can be added to ``Form`` and ``FormCollection`` classes. They allow the usage of
    buttons as first class input fields.
  * Add support for Django-5.0.

- 1.3.10
  * Fix #125: IncompleteSelect can't handle collections with siblings.
  * Fix #128: Boolean field shows label twice.
  * In webcomponents, separate constructor from connectedCallback.
  * Fix problem in `Selectize` widget when using `filter_by` with lazy loading.
  * postcss-nested-include@1.3 requires relative paths.
  * Upgrade to `flyctl` version 0.2.28.

- 1.3.9
  * Fix widget `Selectize` losing borders when used in a collection with siblings after a form
    reset.
  * Add support for UTF-8 characters when using the `Selectize` widget with lazy loading.
  * On reset, the number of siblings is set to the initial value.

- 1.3.8
  * Fail silently if package 'phonenumbers' is not installed.
  * Adopt to Django-5.0
  * In RichtextArea, add padding to placeholder field.
  * In DjangoSelectize make background color almost white.

- 1.3.7
  * Disable unique checks for Django<4.0, because they are not compatible.

- 1.3.6
  * Backport to Django-4.0.

- 1.3.5
  * Fix #99: File upload is not compatible with generic Django storage class.

- 1.3.4
  * Fix #97: Forms and FormCollections with disabled fields and initial data, now are validated
    using that initial data.
  * The filter in the widget for the `PhoneNumberField` now is cleared after reopening the selector.

- 1.3.3
  * Fix #96: In `FormCollection` with siblings, the `<form>`'s ID sometimes was not unique.
  * The selector for international prefixes of the `PhoneNumberField`, now offers a search box.
  * Prevent loading styles for `PhoneNumberField` more than once.

- 1.3.2
  * Handle form reset for `PhoneNumberField` properly.
  * Fix: Monolithic build did not include `PhoneNumberField`.
  * Use cached translation in demo project.

- 1.3.1
  * Improved the usability of the `PhoneNumberField`. The user is now forced to select the country
    code from a dropdown list, whenever the phone number does not start with `+`.
  * The dropdown list of the `PhoneNumberField` now shows the countries name in the current
    language.
  
- 1.3
  * New widget: `PhoneNumberField` which can be used to improve the user experience when entering 
    phone numbers.

- 1.2.2
  * Nicer outline and box-shadow, whenever a `DualSelector` element receives input focus. It now
    surrounds the complete field.
  * In the Calendar and DateRange pickers, the cursor changes to a symbol signalizing into which
    direction the second date choice is going to be made.
  * New widgets: `CountrySelectize` and `CountrySelectizeMultiple` which prefix the country name
    with the corresponding flag.

- 1.2.1
  * Fix: Ignore key press events for pure calendar widgets. Since a pure calendar widget can not be
    focused, handling key press events does not make sense.
  * Fix: Calendar cells with attribute `disabled` are not selectable anymore.

- 1.2
  * Add widgets `DatePicker`, `DateTextbox`, `DateCalendar`, `DateTimePicker`, `DateTimeTextbox`
    and `DateTimeCalendar`. They can be used as alternative widgets to Django's `DateInput` and
    `DateTimeInput` widgets.
  * Add range fields `DateRangeField` and `DateTimeRangeField` which can be used in forms to query
    for a date- or datetime range. With these two fields six more widgets are added to the library:
    `DateRangeCalendar`, `DateRangeTextbox`, `DateRangePicker`, `DateTimeRangeCalendar`,
    `DateTimeRangeTextbox` and `DateTimeRangePicker`.
  * The calendar widget now supports 12 hours time format.
  * Fix: In rare occasions, the styling of widgets has been loaded twice.
  * Fix: Field choices declared as callables are now supported.
  * Prepared rendering for Django-5.0.

- 1.1.2
  * Drop support for Django-4.0.

- 1.1.1
  * Fix problems in widgets `Selectize` and `DualSelector` when used with `filter_by`. Selectable
    choices now are always updated using the proper filter values.

- 1.1
  * Form collections containing only empty fields won't be submitted. This applies to collections
    added using `extra_siblings` as to collections added using the appropriate "Add <label>" button.
  * Fix problem when using MultiWidget widgets. Under some configurations an error was raised
    stating “Duplicate name 'xxx' on multiple input fields”.

- 1.0.1
  * Fix: When using the Selectize widgets, using the arrow-up/down buttons did not highlight the
    selected option.
  * Officially support for Django-4.2. 

- 1.0
  * **Breaking change:** Class `FormCollection` is validated entirely and only after all checks
    passed, models are created out of the cleaned data. This means that the method
    `construct_instance` and `model_to_dict` changed their signature. Please read the docs on how to
    use them now.
  * **Breaking change:** In all rendered forms, `<django-field-group>` is replaced against
    `<div role="group">` because self-declared elements shall only be used as web components.
  * **Breaking change:** In all rendered forms groups, `<django-error-messages>` is replaced against
    `<meta name="error-messages">` because self-declared elements shall only be used as web
    components.
  * **Breaking change:** Attribute `click`, which is used to specify action queues in submit
    buttons, has been renamed to `df-click` in order to prevent naming collisions.
  * **Breaking change:** Attributes `show-if`, `hide-if` and `disable-if` which are used to hide or
    disable fields, fieldsets and buttons, have been renamed to `df-show`,  `df-hide` and
    `df-disable` in order to prevent naming collisions.
  * The documentation now is interactive integrating the many working examples.
  * Fix: In `DualSortableSelector` the initial ordering of options, sometimes did not correspond to
    the intermediate's model entries. 
  * Add view class `BulkEditCollectionView` to edit a collection with siblings without any main
    object. Also add method `models_to_list` as a counterpart to `model_to_dict` for list views.
  * Constructor of `FormCollection` additionally accepts `auto_id`. This can be used to set the
    format of the `id` field in form fields.
  * Constructor of `FormCollection` additionally accepts `instance`. This helps to build the models
    out of a collection.
  * Class `FormCollection` performs a unique validating check while performing a `full_clean`.
  * Add a date- and datetime picker rendered by the server using the Python `Calendar` class.
  * Widget ``UploadedFileInput`` accepts `{…, max-size: <bytes>, …}` in its `attrs` to limit the
    uploadable file size.
  * Add control elements for to RichTextarea: `TextAlign`, `TextColor`, `TextIndent`, `TextMargin`,
    `Blockquote`, `Codeblock`, `HardBreak`, `Subscript`, `Superscript`, `Placeholder`.
  * Add check to determine if the same id is used by more than one field inside `<django-formset…>`
    elements on a single page.
  * In `RichtextArea` replace `popper.js` against `floating-ui`.
    

- 0.13.4
  * Fix: On the Javascript console, library TonSelect complained to be initialized already, if more
    than one `Selectize` or `SelectizeMultiple` widget were used.
  * Some valid Python regular expressions were rejected by the Javascript implementation when used
    as pattern in a `RegexField`.
  * When building the project, now one can use the comman line options `--debug` and `--monolith` to
    control how the client code shall be generated.

- 0.13.3
  * Fix initialization problem: Webcomponents loaded through templates in a FormCollection with
    multiple instances were not loaded.
  * Fix problem in client code: Collections with siblings did not aggregate data for submission
    correctly in all circumstances. 

- 0.13.2
  * Add polyfill `@ungap/custom-elements` to fix compatibility issues on Safari.

- 0.13.1
  * Fix broken merge.

- 0.13
  * Add feature to preselect choices in one select field using a value from another field.
  * Remove function `getValue()` from widgets `RichtextArea` and `DjangoSelectize`; use property
    `value` instead.

- 0.12
  * Add feature to work with option groups when using the ``Selectize``, ``SelectizeMultiple``,
    ``DualSelector`` and ``DualSortableSelector`` widget.
  * Fix border shadow after submitting invalid form data.

- 0.11.1
  * In `DjangoButton`'s `reload()` action, add a Boolean argument to optionally ignore query strings.
  * In `DjangoSelectize` fix handling of `line-height: normal` by settings it to value 1.2.
  * In `DjangoSelectize` change `background-color` for mouse over on `<option>` elements.

- 0.11
  * Add widget for Django's [SlugField](https://docs.djangoproject.com/en/latest/ref/forms/fields/#slugfield).
  * Add widget to handle rich text using the [Tiptap](https://tiptap.dev/) editor framework.
  * Load submodules with 3rd party dependencies dynamically. This decreases the initial Javascript
    payload by ~90% compared to a monolithic build.
  * In addition to the [esbuild compiler](https://esbuild.github.io/), add scripts to compile the
    TypeScript code using [rollup](https://rollupjs.org/guide/en/) + [babel](https://babeljs.io/) +
    [terser](https://terser.org/).
  * Web components are initialized on the `DOMContentLoaded` (instead of `load`) Event.
  * Fix: The `Selectize` widget now uses the same border styles for feedback as other input/select
    fields.
  * Fix: Forms which do not provide data are not validated.
  * Add handler to listen for an external `reset` Event.
  * Fix: `FileUpload` widget now loses focus after file submission.
  * Handle input fields for URLs properly.
  * Fix missing feedback on datetime and password fields.
  * Fix: An initialized `FormCollection` with siblings but `max_siblings=None`, raised a TypeError.
  * Fix: Forms now pay attention to form attribute `novalidate`.
  * All `<form>` elements are empty and referred by form=… attribute from their input fields.
  * Add Python utility class `ClassList` which behaves similar to its Javascript counterpart
    `HTMLElement`.
  * Unify the styling of animated icons, such as "Okay", "Bummer" and "Spinner".
  * On HTML placeholders used to display feedback errors, add `role="alert"`.
  * Fix: Uploading more than one file caused the ``UploadWidget`` to complain with "File upload
    still in progress."
  * Add button actions ``confirm()`` and ``alertOnError`` to the possible queue of actions.

- 0.10.3
  * Fix: Widget `DualSortableSelector` now checks bounds for provided values. This in rare occasions
    raised an exception.
  * Both CSS files `collections.css` and `bootstrap5-extra.css` now are compiled from a SCSS source.

- 0.10.2
  * In sortable form collections, add a CSS ghost class to make moved item more opaque. This is for
    a better usability experience.
  * In sortable form collections, change the form name after moving a collection. This fixes a
    problem with form validation.
  * Fix: On forms created from a model, method `IncompleteSelectResponseMixin.fetch_options()`
    raised an AttributeError.
  * Class `FormCollection` and class `Fieldset` accept an optional help text which is rendered at
    the bottom of a `<django-form-collection>` or `<fieldset>`.
  * Some rendering templates remove whitespace using templatetag `{% spaceless %}`.
  * Django-4.1 now is officially supported.

- 0.10.1
  * The HTML tags for `<select is="django-selectize">` and `<select is="django-dual-selector">`
    declare their own webcomponents which now add their own HTML elements in front of themselves,
    before hiding. Instead of hiding via `display: none;` they now "conceal" so that the browser
    can set focus on input fields not validating.
  * Replace `uglify` against `terser` to minify JavaScript files.
  * In webcomponent `<select is="django-dual-selector">`, replace `elem.getValue()` against
    `elem.value`.
  * Simplify the way events handlers are called.
  * Remove the CSRF-Token from the request header of webcomponents `<select is="django-selectize">`
    and `<select is="django-dual-selector">`, since they exclusively use GET requests.
  * The right selector box of the webcomponent `<select is="django-dual-selector" required …>`
    highlights as invalid (by rendering a red border), if input data is missing.

- 0.10
  * The right part of the widget `DualSelector` optionally is sortable now. Views accepting forms
    with this widget can rely upon that sorting order and store it.
  * Form collections with siblings can optionally be declared as sortable. A drag handle is then
    rendered above the collection, which can be used for sorting.
  * Add Germans translations text readable by the end user.

- 0.9.1
  * The optional URL parameter passed into button action `proceed(...)` now takes precedence over
    the `success_url` returned inside the response object.
  * Allow wrapping HTML elements between a `<django-formset>` and its immediate
    `<django-form-collection>`-elements.
  * Add German translations.

- 0.9
  * Fixed problems when resetting a formset containing multiple collections with siblings: All just
    added collections are removed on reset.
  * Distinguish while removing a collection: A just added collection is removed, while existing
    collections are marked for removal.
  * On cleaning post data while processing collections, one can choose whether to keep existig but
    removed colections for further processing, or ignore them.
  * Allow extra label to be added inside the "Add collection" button.
  * Handle CSRF token via attribute to `<django-formset csrf-token="…">` rather than using a cookie.
  * Fix typo: Rename  `IncompleSelectResponseMixin` -> `IncompleteSelectResponseMixin`.
  * Fix some issues with `FormCollection`-s: Invoking `replicate` now creates a deep copy of all
    children.
  * Fix in widget `FileInput`: On reloading the form, the provided value is kept to its initial
    state.

- 0.8.8
  * Use a simpler and semantically more correct HTML representation for the file uploader widget.

- 0.8.7
  * Fix: If an uploaded image has an EXIF orientation tag, that image that is transposed accordingly.
  * On file upload, fill the progressbar to only 90%. The remaining 10% of the progressbar are
    filled after successful image transformation.
  * Rename Event "submit" to "submitted", because otherwise FireFox triggers a page reload.

- 0.8.6
  * Fix: Files uploaded into collections with siblings, are not duplicated anymore.
  * Fix: Clear `cleaned_data` during form validation to prevent duplicate content.
  * Fix occasionally occuring MRO-TypeError when instantiating checkbox widget.
  * Remove tag "_marked_for_removal_" while submitting form. Use Array with holes instead.
  * In Collections with siblings, do not extend number of siblings, if maximum is reached.

- 0.8.5
  * Fix: Form collections with empty siblings, on submission now create an empty array.

- 0.8.4
  * Add optional argument for delay in milliseconds to button actions `okay` and `bummer`. 
  * Resetting a django-formset removes all just added sibling collections and unmarks all
    collections for removal.
  * Fields beeing hidden on the client using `show-if`/`hide-if` also are disabled to prevent
    validation – which wouldn't make sense anyway.
  * Add parameter `legend` to Form Collection so that a collection can have an optional title.

- 0.8.3
  * Fix: For ``field_css_classes``, fall back to form name rather than its prefix.

- 0.8.2
  * Fix: Set empty dropbox item on upload widget during form reset.
  * Fix: Collections with siblings on root level generated invalid form data.
  * Add special placeholder to render errors for collections with siblings.
  * Add additional actions to button: Spinner, Okay, Bummer and Reload.
  * In Button's proceed action, print a warning, if neither a success-, nor a
    fallback-URL is given to proceed.
  * In `FormCollectionView` handle response of posting formsets analogous to the way
    Django handles forms.

- 0.8.1
  * Adopt `DualSelector` for Tailwind.css.
  * Hide `calendar-picker-indicator` in touched input date fields.
  * Fix: Expecting path for base location as Path object.
  * Fix: Updating of existing object failed.
  * Add method `get_extra_data` to class `FormView`.
  * Increase max filename length to 250 characters.
  * Fix: Abort silently if input field is missing.
  * Replace `<div>`-based progress bar against proper HTML element `<progress>`.

- 0.8
  * Add widget `DualSelector` which accepts multiple values and is the form field counterpart
    to Django's `ManyToManyField`. This is an alternative widget to `SelectizeMultiple`.

- 0.7
  * Add widget `SelectizeMultiple` which accepts multiple values and is the form field counterpart
    to Django's `ManyToManyField`.
  * Bugfix in UploadWidget: Do not delete existing file on form update.

- 0.6
  * Content from `FileUploadWidget` can be transfered to a Django model and vice versa.

- 0.4
  * It is possible to control every aspect of the feedback, given to the user while he fills the
    input fields.
  * Templatetag `render_form` and `formsetify` accepts parameters `form_classes` and
    `collection_classes` for finer styling control.

- 0.3
  * Add `show-if`, `hide-if` and `disable-if` attribute parsing to fields and fieldsets.
  * Add class `Fieldset` to handle forms with legends and the possibility for hiding and disabling.
  * Form Collections may have siblings and can be extended.

- 0.2
  * Refactored to work for Django>4 only.
  * Added Form Collections.

- 0.1
  * Initial release.
