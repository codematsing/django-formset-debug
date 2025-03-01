from django import forms


#https://docs.djangoproject.com/en/5.1/ref/forms/widgets/#django.forms.MultiWidget:~:text=class%20ColorWidget(forms.MultiWidget)%3A
class ColorWidget(forms.widgets.MultiWidget):
    def __init__(self, attrs=None):
        widgets = [
            forms.widgets.TextInput(attrs={"type":"color"}),
            forms.widgets.TextInput(attrs={"type":"color"}),
        ]
        super().__init__(widgets, attrs)

    def decompress(self, value):
        return [None, None]

    def value_from_datadict(self, data, files, name):
        day, month, year = super().value_from_datadict(data, files, name)
        # DateField expects a single string that it can parse into a date.
        return "{}-{}-{}".format(year, month, day)

#for the purpose of calling ColorWidget
class ColorField(forms.fields.MultiValueField):
    def __init__(self, **kwargs):
        # Define one message for all fields.
        error_messages = {
            "incomplete": "Incomplete",
        }
        # Or define a different message for each field.
        fields = (
            forms.fields.CharField(label='foreground'),
            forms.fields.CharField(label='background'),
        )
        super().__init__(
            error_messages=error_messages,
            fields=fields,
            require_all_fields=False,
            **kwargs
        )

class MultiWidgetForm(forms.Form):

    color_field = ColorField(widget=ColorWidget())
