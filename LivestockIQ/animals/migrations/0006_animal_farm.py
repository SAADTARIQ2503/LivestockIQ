from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('animals', '0005_remove_animal_animal_id'),
        ('farms', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='animal',
            name='farm',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='animals',
                to='farms.farm',
            ),
        ),
    ]