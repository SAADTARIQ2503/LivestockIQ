from django.contrib import admin
from .models import Farm

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'address', 'latitude', 'longitude', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'address', 'user__username')
