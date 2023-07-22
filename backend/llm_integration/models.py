from django.db import models

# Create your models here.


class Index(models.Model):
    index_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    customer = models.ForeignKey("customers.Customer", on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class UploadedFile(models.Model):
    uploaded_file_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=400)
    description = models.CharField(max_length=200)
    index = models.ForeignKey("llm_integration.Index", on_delete=models.CASCADE)

    def __str__(self):
        return self.name