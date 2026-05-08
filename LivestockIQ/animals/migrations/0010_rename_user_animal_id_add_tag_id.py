from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('animals', '0009_add_user_animal_id'),
    ]

    operations = [
        # 1. Drop old unique_together before rename
        migrations.AlterUniqueTogether(
            name='animal',
            unique_together=set(),
        ),
        # 2. Rename the column
        migrations.RenameField(
            model_name='animal',
            old_name='user_animal_id',
            new_name='system_id',
        ),
        # 3. Re-apply unique_together on new name
        migrations.AlterUniqueTogether(
            name='animal',
            unique_together={('user', 'system_id')},
        ),
        # 4. Add farmer-assigned tag field
        migrations.AddField(
            model_name='animal',
            name='tag_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
