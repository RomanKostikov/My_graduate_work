# django-summernote
from django.contrib import admin
from django_summernote.admin import SummernoteModelAdmin
from .models import *


class PrivacyPolicyAdmin(SummernoteModelAdmin):
    list_display = [field.name for field in PrivacyPolicy._meta.fields]

    class Meta:
        model = PrivacyPolicy


admin.site.register(PrivacyPolicy, PrivacyPolicyAdmin)
