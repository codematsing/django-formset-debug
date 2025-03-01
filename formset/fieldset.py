from django.core.exceptions import ImproperlyConfigured
from django.forms.fields import Field


class FieldsetFieldsMetaclass(type):
    """
    Modified metaclass to collect fields and fieldsets from the Form class definition.
    """

    def __new__(mcs, name, bases, attrs):
        # Collect fields from current class and remove them from attrs.
        attrs['declared_fields'] = {
            key: attrs.pop(key)
            for key, value in list(attrs.items())
            if isinstance(value, Field)
        }

        new_class = super().__new__(mcs, name, bases, attrs)
        return new_class


class Fieldset(metaclass=FieldsetFieldsMetaclass):
    """
    Fieldset can be used to visually group fields inside a Form. In addition to that, a fieldset can have
    show-, hide- and disable conditions.
    """
    legend = None
    show_condition = None
    hide_condition = None
    disable_condition = None
    help_text = None
    template_name = 'formset/default/fieldset.html'

    def __init__(self, **kwargs):
        show_condition = kwargs.pop('show_condition', None)
        hide_condition = kwargs.pop('hide_condition', None)
        if show_condition and hide_condition:
            msg = f"class {self.__class__} can accept either `show_condition` or `hide_condition`, but not both."
            raise ImproperlyConfigured(msg)
        if show_condition:
            self.show_condition = show_condition
        elif hide_condition:
            self.hide_condition = hide_condition
        if disable_condition := kwargs.pop('disable_condition', None):
            self.disable_condition = disable_condition
        if legend := kwargs.pop('legend', None):
            self.legend = legend
        if help_text := kwargs.pop('help_text', None):
            self.help_text = help_text
        super().__init__(**kwargs)

    def get_context(self):
        return {
            'show_condition': self.show_condition,
            'hide_condition': self.hide_condition,
            'disable_condition': self.disable_condition,
            'legend': self.legend,
            'help_text': self.help_text,
        }

    def __repr__(self):
        return f'<{self.__class__.__name__} legend="{self.legend}" template_name="{self.template_name}">'
