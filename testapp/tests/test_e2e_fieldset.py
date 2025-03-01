import json
import pytest
from time import sleep
from playwright.sync_api import expect

from django.urls import path

from formset.views import FormView

from testapp.forms.customer import CustomerForm
from .utils import ContextMixin, get_javascript_catalog


class DemoFormView(ContextMixin, FormView):
    template_name = 'testapp/native-form.html'
    success_url = '/success'


urlpatterns = [
    path('customer', DemoFormView.as_view(
        form_class=CustomerForm,
        extra_context = {'click_actions': 'submit -> proceed', 'force_submission': True},
    ), name='customer'),
    get_javascript_catalog(),
]


@pytest.mark.urls(__name__)
@pytest.mark.parametrize('viewname', ['customer'])
def test_submit_customer(page, mocker, viewname):
    fieldset = page.locator('django-formset > .dj-form fieldset')
    expect(fieldset).to_have_count(1)
    expect(fieldset).to_be_visible()
    expect(fieldset).to_have_attribute('name', 'customer')
    legend = fieldset.locator('legend')
    expect(legend).to_have_text("Customer")
    page.fill('#id_customer\\.name', "John Doe")
    page.fill('#id_customer\\.address', "123, Lye Street")
    spy = mocker.spy(DemoFormView, 'post')
    page.locator('django-formset button').first.click()
    sleep(0.25)
    spy.assert_called()
    response = json.loads(spy.call_args.args[1].body)
    assert response == {'formset_data': {
        'customer.name': "John Doe", 'customer.address': "123, Lye Street", 'customer.phone_number': "",
        'no_customer': "",
    }}


@pytest.mark.urls(__name__)
@pytest.mark.parametrize('viewname', ['customer'])
def test_submit_no_customer(page, mocker, viewname):
    fieldset = page.locator('django-formset > .dj-form fieldset')
    expect(fieldset).to_have_attribute('df-hide', 'no_customer')
    page.locator('#id_no_customer').click()
    expect(fieldset).to_be_hidden()
    spy = mocker.spy(DemoFormView, 'post')
    page.locator('django-formset button').first.click()
    sleep(0.25)
    spy.assert_called()
    response = json.loads(spy.call_args.args[1].body)
    assert response == {'formset_data': {
        'customer.name': "", 'customer.address': "", 'customer.phone_number': "",
        'no_customer': "on",
    }}
