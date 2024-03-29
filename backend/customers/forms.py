from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Customer


# Create your forms here.


class NewUserForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = Customer
        fields = ("username", "email", "password1", "password2")

    def save(self, commit=True):
        user = super(NewUserForm, self).save(commit=False)
        user.email = self.cleaned_data["email"]
        user.password = self.cleaned_data["password1"]
        if commit:
            user.save()
        return user
