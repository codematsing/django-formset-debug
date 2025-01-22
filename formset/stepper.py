from formset.collection import FormCollection


class StepperCollection(FormCollection):
    template_name = 'formset/default/stepper_collection.html'

    def iter_many(self):
        raise NotImplementedError("StepperCollection can not be used with siblings")

    def render(self, template_name=None, context=None, renderer=None):
        context = context or {}
        return super().render(template_name, context, renderer)

    __str__ = render
    __html__ = render
