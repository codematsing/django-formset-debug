from django.forms import fields, widgets
from django.forms.models import ModelForm

from formset.renderers.bootstrap import FormRenderer as BootstrapFormRenderer
from formset.collection import FormCollection

from testapp.models.company import Company, Department, Team


class TeamForm(ModelForm):
	id = fields.IntegerField(
		required=False,
		widget=widgets.HiddenInput,
	)

	class Meta:
		model = Team
		fields = ['id', 'name']


class TeamCollection(FormCollection):
	min_siblings = 0
	extra_siblings = 1
	team = TeamForm()
	legend = "Teams"
	add_label = "Add Team"
	related_field = 'department'

	def retrieve_instance(self, data):
		if data := data.get('team'):
			try:
				return self.instance.teams.get(id=data.get('id') or 0)
			except (AttributeError, Team.DoesNotExist, ValueError):
				return Team(name=data.get('name'), department=self.instance)


class DepartmentForm(ModelForm):
	id = fields.IntegerField(
		required=False,
		widget=widgets.HiddenInput,
	)

	class Meta:
		model = Department
		fields = ['id', 'name']


class DepartmentCollection(FormCollection):
	min_siblings = 0
	extra_siblings = 1
	department = DepartmentForm()
	teams = TeamCollection()
	legend = "Departments"
	add_label = "Add Department"
	related_field = 'company'

	def retrieve_instance(self, data):
		if data := data.get('department'):
			try:
				return self.instance.departments.get(id=data.get('id') or 0)
			except (AttributeError, Department.DoesNotExist, ValueError):
				return Department(name=data.get('name'), company=self.instance)


class CompanyForm(ModelForm):
	class Meta:
		model = Company
		fields = '__all__'


class CompanyCollection(FormCollection):
	company = CompanyForm()
	departments = DepartmentCollection()


class MultipleCompanyForm(CompanyForm):
	id = fields.IntegerField(
		required=False,
		widget=widgets.HiddenInput,
	)

	created_by = fields.CharField(
		required=False,
		widget=widgets.HiddenInput,
		help_text="Dummy field required to distinguish the namespace of companies for each user",
	)


class CompaniesCollection(FormCollection):
	company = MultipleCompanyForm()
	departments = DepartmentCollection()
	min_siblings = 1
	legend = "Company"
	add_label = "Add Company"

	def retrieve_instance(self, data):
		if data := data.get('company'):
			try:
				return Company.objects.get(id=data.get('id') or 0)
			except Company.DoesNotExist:
				return Company(name=data.get('name'))

class CompanyDepartmentFormset(FormCollection):
	department_form = DepartmentForm()
	min_siblings=0

	# def __init__(self, **kwargs):
	# 	super().__init__(**kwargs)
	# 	#https://github.com/jrief/django-formset/issues/159
	# 	if self.instance:
	# 		self._view_instance_data = {
	# 			k:v for k,v in vars(self.instance).items() if not k.startswith('_')
	# 		}

	# #https://github.com/jrief/django-formset/issues/159
	# def full_clean(self):
	# 	super().full_clean()
	# 	if self.instance:
	# 		for key, value in self._view_instance_data.items():
	# 			setattr(self.instance, key, value)

	def save(self):
		print("Expectation: self.instance.name==company_name")
		print(f"Actual: self.instance.name={self.instance.name}")