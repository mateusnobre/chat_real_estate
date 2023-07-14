from django import forms
from .models import Index


class IndexForm(forms.ModelForm):
    class Meta:
        model = Index
        fields = ["name", "customer"]
