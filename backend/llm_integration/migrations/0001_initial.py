# Generated by Django 4.2.2 on 2023-07-01 23:55

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Index",
            fields=[
                (
                    "index_id",
                    models.PositiveIntegerField(primary_key=True, serialize=False),
                ),
                ("name", models.CharField(max_length=100)),
            ],
        ),
    ]
