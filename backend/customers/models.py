from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from .managers import CustomUserManager

User = settings.AUTH_USER_MODEL


class Customer(AbstractUser):
    REQUIRED_FIELDS = ["username"]
    username = models.CharField(max_length=200, null=False)
    email = models.EmailField("email address", unique=True)
    USERNAME_FIELD = "email"
    password = models.CharField(max_length=300)
    current_plan = models.CharField(max_length=100, default="Free")
    current_plan_end = models.DateTimeField(null=True)
    current_plan_start = models.DateTimeField(null=True)
    current_plan_renovation_date = models.DateTimeField(null=True)
    current_plan_price = models.IntegerField(default=0)
    token_usage_current_month = models.IntegerField(default=0)
    n_pages_current_month = models.IntegerField(default=0)
    n_documents_current_month = models.IntegerField(default=0)
    n_questions_current_month = models.IntegerField(default=0)
    current_plan_pages_limit = models.IntegerField(default=0)
    current_plan_documents_limit = models.IntegerField(default=0)
    current_plan_questions_limit = models.IntegerField(default=0)

    objects = CustomUserManager()

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if not self.pk:
            self.set_password(self.password)
        super().save(*args, **kwargs)
