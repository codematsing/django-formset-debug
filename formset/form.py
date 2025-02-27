from django.forms.forms import DeclarativeFieldsMetaclass, Form as DjangoForm
from django.forms.models import ModelFormMetaclass
from django.utils.functional import cached_property

from formset.fieldset import Fieldset
from formset.utils import FormsetErrorList, HolderMixin


class FormDecoratorMixin:
    def __init__(self, error_class=FormsetErrorList, **kwargs):
        kwargs['error_class'] = error_class
        super().__init__(**kwargs)

    def __getitem__(self, name):
        "Returns a modified BoundField for the given field."
        from formset.boundfield import BoundField

        try:
            field = self.fields[name]
        except KeyError:
            raise KeyError(f"Key {name} not found in Form")
        return BoundField(self, field, name)

    @cached_property
    def form_id(self):
        # The "form" tag is used to link fields to their form owner
        # See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-form for details
        auto_id = self.auto_id if '%s' in str(self.auto_id) else 'id_%s'
        if self.prefix:
            return auto_id % self.prefix
        else:
            return auto_id % self.__class__.__name__.lower()


class DeclarativeFieldsetMetaclass(DeclarativeFieldsMetaclass):
    """
    Modified metaclass to collect Fields and Fieldsets from the Form class definition.
    """
    @staticmethod
    def extract_fieldsets(attrs):
        declared_fieldsets = {}
        attrs_list = []
        for key, value in list(attrs.items()):
            if isinstance(value, Fieldset):
                declared_fieldsets[key] = value
                for field_name, field in value.declared_fields.items():
                    attrs_list.append((f'{key}.{field_name}', field))
            else:
                attrs_list.append((key, value))
        return dict(attrs_list, declared_fieldsets=declared_fieldsets)

    def __new__(mcs, name, bases, attrs):
        # Collect fieldsets from current class and move its fields into new_class.
        return super().__new__(mcs, name, bases, DeclarativeFieldsetMetaclass.extract_fieldsets(attrs))


class DeclarativeModelFormMetaclass(ModelFormMetaclass):
    def __new__(mcs, name, bases, attrs):
        # Collect fieldsets from current class and move its fields into new_class.
        return super().__new__(mcs, name, bases, DeclarativeFieldsetMetaclass.extract_fieldsets(attrs))


class FormMixin(FormDecoratorMixin, HolderMixin):
    """
    Mixin class to be added to a native Django Form. This is required to overwrite
    some form methods provided by Django
    """

    def add_prefix(self, field_name):
        """
        Return the field name with a prefix prepended, if this Form has a prefix set.
        """
        return f'{self.prefix}.{field_name}' if self.prefix else field_name

    def get_context(self):
        """
        This simplified method just returns the ``form``, but not the ``fields``, ``hidden_fields``
        and ``errors``, since they are rendered by the included ``form.html`` template.
        """
        return {
            'form': self,
        }

    def get_field(self, field_name):
        return self.fields[field_name]


class Form(FormMixin, DjangoForm, metaclass=DeclarativeFieldsetMetaclass):
    """
    Base class for Form classes. This class is a subclass of Django's Form class.
    """
