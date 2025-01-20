from django.forms.fields import CharField, ChoiceField
from django.forms.forms import Form
from django.forms.widgets import RadioSelect
from formset.collection import FormCollection
from formset.dialog import ApplyButton, CancelButton, DialogForm
from formset.fields import Activator


class ContactForm(Form):
    first_name = CharField()
    last_name = CharField()
    next = Activator(
        label="Next",
    )


class ShippingForm(DialogForm):
    induce_activate = '..contact.next:active'

    street = CharField(
        label="Street",
    )
    zip_code = CharField(
        label="ZIP Code",
    )
    city = CharField(
        label="City",
    )
    next = Activator(
        label="Next",
    )


class PaymentForm(DialogForm):
    induce_activate = '..shipping.next:active'

    street = CharField(
        label="Street",
    )
    zip_code = CharField(
        label="ZIP Code",
    )
    city = CharField(
        label="City",
    )
    submit = Activator(
        label="Submit",
    )


class CheckoutCollection(FormCollection):
    legend = "Order your coffee"
    contact = ContactForm()
    shipping = ShippingForm()
    payment = PaymentForm()
