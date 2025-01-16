from django.forms import models

from formset.collection import FormCollection
from formset.widgets import DualSortableSelector

from testapp.models import PollModel


class ModelPollForm(models.ModelForm):
    """
    Many-to-Many Field with specific mapping model
    """

    class Meta:
        model = PollModel
        fields = '__all__'
        widgets = {
            'weighted_opinions': DualSortableSelector(search_lookup='label__icontains'),
        }


class PollCollection(FormCollection):
    """
    Wrap a ModelForm into a FormCollection
    """
    legend = "Sortable Many-to-Many Field"
    help_text = "Selected options on the right hand side can be sorted by dragging"
    poll = ModelPollForm()
