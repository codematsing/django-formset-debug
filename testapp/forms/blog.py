from django.forms import models

from formset.richtext import controls
from formset.richtext.widgets import RichTextarea

from testapp.models.blog import BlogModel


class BlogModelForm(models.ModelForm):
    class Meta:
        model = BlogModel
        fields = '__all__'
        widgets = {
            'body': RichTextarea(control_elements=[
                controls.Heading([1,2,3]),
                controls.Bold(),
                controls.Blockquote(),
                controls.CodeBlock(),
                controls.HardBreak(),
                controls.Italic(),
                controls.Underline(),
                controls.BulletList(),
                controls.OrderedList(),
                controls.TextColor(['rgb(212, 0, 0)', 'rgb(0, 212, 0)', 'rgb(0, 0, 212)']),
                # controls.TextColor(['text-red', 'text-green', 'text-blue']),
                controls.TextIndent(),
                controls.TextIndent('outdent'),
                controls.TextMargin('increase'),
                controls.TextMargin('decrease'),
                controls.TextAlign(['left', 'center', 'right']),
                controls.HorizontalRule(),
                controls.Subscript(),
                controls.Superscript(),
                controls.Separator(),
                controls.ClearFormat(),
                controls.Redo(),
                controls.Undo(),
            ], attrs={'placeholder': "Start typing …"}),
        }
