from django import forms
from .models import Index,UploadedFile


class IndexForm(forms.ModelForm):
    class Meta:
        model = Index
        fields = ["name", "customer"]


class UploadedFileForm(forms.ModelForm):
    class Meta:
        model = UploadedFile
        fields = ["name", "description","index"]
