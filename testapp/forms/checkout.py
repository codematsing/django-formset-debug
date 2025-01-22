from django.forms.fields import CharField
from django.forms.forms import Form
from formset.dialog import ApplyButton, CancelButton, DialogForm
from formset.fields import Activator
from formset.stepper import StepperCollection


class ContactForm(Form):
    first_name = CharField()
    last_name = CharField()
    next = Activator(
        label="Next",
    )


class ShippingForm(Form):
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


class PaymentForm(Form):
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


class CheckoutCollection(StepperCollection):
    legend = "Order your coffee"
    contact = ContactForm()
    shipping = ShippingForm()
    payment = PaymentForm()
