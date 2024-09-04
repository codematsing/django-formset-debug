from django.forms.fields import CharField, ChoiceField
from django.forms.forms import Form
from django.forms.widgets import RadioSelect
from formset.collection import FormCollection
from formset.dialog import ApplyButton, CancelButton, DialogForm
from formset.fields import Activator


class CoffeeForm(Form):
    nickname = CharField()
    flavors = Activator(
        label="Add flavors",
        help_text="Open the dialog to edit flavors",
    )


class FlavorForm(DialogForm):
    title = "Choose a Flavor"
    induce_open = '..coffee.flavors:active'
    induce_close = '.cancel:active || .apply:active'

    flavors = ChoiceField(
        choices=(
            ('caramel', "Caramel Macchiato"),
            ('cinnamon', "Cinnamon Dolce Latte"),
            ('hazelnut', "Turkish Hazelnut"),
            ('vanilla', "Vanilla Latte"),
            ('chocolate', "Chocolate Fudge"),
            ('almonds', "Roasted Almonds"),
            ('cream', "Irish Cream"),
        ),
        widget=RadioSelect,
        required=False,
    )
    cancel = Activator(
        label="Close",
        widget=CancelButton,
    )
    apply = Activator(
        label="Apply",
        widget=ApplyButton,
    )

class CoffeeOrderCollection(FormCollection):
    legend = "Order your coffee"
    add_label = "Add Coffee Order"
    min_siblings = 1
    extra_siblings = 1
    coffee = CoffeeForm()
    flavor = FlavorForm()


class CafeteriaCollection(FormCollection):
    coffee_order = CoffeeOrderCollection()
