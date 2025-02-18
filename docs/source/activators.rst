.. _activators:

=============================
Activators and Button Widgets
=============================

In almost every form, there are some buttons to submit or reset the field's contents. In a typical
Django application, these buttons must be added to the rendering templates as HTML elements. But if
you think about it, a button also is an input field, sometimes rendered as ``<button …>`` and
sometimes as ``<input type="button" …>``. Okay, the button's value is transient and it only is used
to trigger an action, such as submit, reset or a custom event. But it still is an input field with a
name and a value, so why does Django not provide a field type for it?

This is where **django-formset** comes in. It provides a field type for buttons named "Activator".
This name was chosen to distinguish it from the term "Button", which is used for its representation
in HTML. Such an :class:`formset.fields.Activator` behaves as any other Django Form field and can be
used to trigger an action – more on that later. The default widget of an ``Activator`` field is, as
one might expect, the :class:`formset.widgets.Button` widget. An ``Activator`` can be used inside
any Django ``Form`` or ``FormCollection``. There it behaves very similar to a normal field. The main
difference is that it does not store any data and hence can't be initialized. Instead, it waits for
click events which then can be intercepted by other components of the embedding
``<django-formset>``-component.


Listening for Activation Events
===============================

In a typical JavaScript application, we would add an event handler to a button element to listen for
click events. On activation, this handler then would perform some action such as submitting a form
or opening a dialog. While this approach is very flexible, it does not fit well into Django's form
concept which aims to be declarative. We therefore need to invert the flow of control.

Instead of adding an event listener to the button which then performs some action, the interested
component can *listen* for the named ``Activator`` field to be clicked. A dialog component for
instance, can popup and disappear by specifying any condition on button activation and the state of
other input fields.

This example shows how to use an ``Activator`` field to submit the form:

.. django-view:: contact_form
	:caption: form.py

	from django.forms.fields import CharField
	from django.forms.forms import Form
	from formset.fields import Activator
	from formset.renderers import ButtonVariant
	from formset.widgets import Button

	class ContactForm(Form):
	    full_name = CharField(
	        label="Full Name",
	    )
	    submit = Activator(
	        label="Submit",
	        widget=Button(
	            action='disable -> spinner -> delay(500) -> submit -> reload !~ scrollToError',
	            button_variant=ButtonVariant.PRIMARY,
	            icon_path='formset/icons/send.svg',
	        ),
	    )

The default widget of an ``Activator`` field is the ``Button`` widget. In this example we use a
chain of actions, which is triggered when the button is clicked: First, *disable* the button, then
render a *spinner*, then *delay* execution for half a second, then *submit* the form's data, and
finally *reload* the page. If an error occurred scroll to the first rejected field.

This ``action`` attribute can be configured in many different ways, more on this, in section
:ref:`action-queues`.

.. django-view:: contact_view
	:view-function: ContactView.as_view(extra_context={'framework': 'bootstrap', 'pre_id': 'contact-result'}, form_kwargs={'auto_id': 'cf_id_%s'})
	:hide-code:

	from formset.views import FormView

	class ContactView(FormView):
	    form_class = ContactForm
	    template_name = "form-no-button.html"
	    success_url = "/success"

By allowing activator fields to be part of the form and collection logic, we can declare a
self-contained submission workflow, rather than the hybrid approach we're used to, where buttons
must be declared in template and the form is declared in Python. This also allows us to place
buttons anywhere, and not just at the top or bottom of the form.


Button Variants
===============

The ``button_variant`` attribute can be used to specify the appearance of the button in a consistent
manner across the application. These variants are defined in the ``ButtonVariant`` enum type:

* ``ButtonVariant.PRIMARY``: Use this to submit a form.
* ``ButtonVariant.SECONDARY``: Use this to close a dialog.
* ``ButtonVariant.SUCCESS``: Use to finalize a transaction.
* ``ButtonVariant.DANGER``: Use to delete something.
* ``ButtonVariant.WARNING``: Use to reset the form.
* ``ButtonVariant.INFO``: Use to navigate somewhere.

These terms are borrowed from the Bootstrap framework, but they can be used for all other CSS
frameworks supported by **django-formset**. It might be necessary to adopt the corresponding CSS
classes.


Button Icons
============

The ``Button`` widget can be configured to display an icon in addition to the button text. The
``icon_path`` must point to an icon in SVG format and stored in a template folder of the
application, here for instance ``formset/icons/send.svg``. This is because the icon must be inlined
into the HTML code rendering the button. Otherwise the icon would have to be loaded as a static file
and used inside a ``<img src="…">`` tag. But then it would not be possible to style the fill color
of the icon. By using an inlined SVG, the fill color can be styled using the current CSS foreground
color.

.. note::
	The head tag of such a SVG file should contain the ``fill`` attribute as
	``<svg xmlns="http://www.w3.org/2000/svg" … fill="currentColor">``. This then draws all the
	strokes in the current foreground color, which is important to keep the proper contrast since
	the button variants can have different background colors.

Remember that **django-formset** can temporarily replace the chosen icon by a special variant. For
instance by an animated spinner, bummer or success mark when used with the appropriate actions.


Icon Alignment
--------------

By default, icons are rendered on the right hand side of the button text. This can be changed by
setting the ``icon_left`` attribute of the ``Button`` widget to ``True``.
